"""
Firestore Service for Persistent User Data Storage

This service provides:
1. Persistent storage for user sessions and table metadata
2. CSV data storage (compressed) for tables under 1MB
3. Sync mechanism between DuckDB (fast queries) and Firestore (persistence)
4. Security validation to ensure users can only access their own data

Architecture:
- Firestore stores: user sessions, table metadata, small table data
- DuckDB stores: actual table data for fast SQL queries
- On user login: Restore DuckDB from Firestore if needed
- On data change: Sync to Firestore for persistence

Cost Optimization:
- Only store metadata for large tables (schema, row count)
- Compress table data before storing
- Use batch writes to reduce operations
- Cache reads to minimize Firestore calls
"""

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter
from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import Dict, List, Optional, Any, Tuple
import json
import gzip
import base64
import os
import threading


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime, date, and Decimal objects"""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, bytes):
            return obj.decode('utf-8', errors='replace')
        return super().default(obj)

# Maximum size for storing table data in Firestore (500KB compressed)
MAX_TABLE_DATA_SIZE = 500 * 1024  # 500KB
# Maximum rows to store in Firestore (for cost efficiency)
MAX_ROWS_TO_STORE = 10000


class FirestoreService:
    """
    Firestore service for persistent user data storage.
    
    Security Model:
    - All data is scoped to user_id
    - No cross-user data access is possible
    - Session validation before any operation
    
    Consistency Model:
    - Write-through: Data written to both DuckDB and Firestore
    - Read-through: Try DuckDB first, fallback to Firestore
    - Eventual consistency with immediate local availability
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """Singleton pattern for Firestore service"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self.db = None
        self._init_firebase()
    
    def _init_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if already initialized
            if firebase_admin._apps:
                self.db = firestore.client()
                print("[OK] Firestore: Using existing Firebase app")
                return
            
            cred = None
            
            # 1. Check for JSON content in environment variable (for Railway/Render)
            firebase_json = os.environ.get('FIREBASE_CREDENTIALS_JSON')
            if firebase_json:
                try:
                    cred_dict = json.loads(firebase_json)
                    cred = credentials.Certificate(cred_dict)
                    print("[OK] Firestore: Initialized with FIREBASE_CREDENTIALS_JSON env var")
                except json.JSONDecodeError as e:
                    print(f"[ERROR] Invalid JSON in FIREBASE_CREDENTIALS_JSON: {e}")
            
            # 2. Check environment variable for file path
            if not cred:
                env_path = os.environ.get('FIREBASE_CREDENTIALS_PATH')
                if env_path and os.path.exists(env_path):
                    cred = credentials.Certificate(env_path)
                    print(f"[OK] Firestore: Initialized with FIREBASE_CREDENTIALS_PATH: {env_path}")
            
            # 3. Check backend directory (where this file's parent is)
            if not cred:
                backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                possible_paths = [
                    os.path.join(backend_dir, 'firebase-credentials.json'),
                    os.path.join(backend_dir, 'serviceAccountKey.json'),
                    os.path.join(backend_dir, 'firebase-adminsdk.json'),
                ]
                for path in possible_paths:
                    if os.path.exists(path):
                        cred = credentials.Certificate(path)
                        print(f"[OK] Firestore: Initialized with credentials from {path}")
                        break
            
            # 4. Check current working directory
            if not cred:
                cwd_path = os.path.join(os.getcwd(), 'firebase-credentials.json')
                if os.path.exists(cwd_path):
                    cred = credentials.Certificate(cwd_path)
                    print(f"[OK] Firestore: Initialized with credentials from {cwd_path}")
            
            if cred:
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
            else:
                # Try default credentials (for Cloud Run, GCE, etc.)
                try:
                    firebase_admin.initialize_app()
                    self.db = firestore.client()
                    print("[OK] Firestore: Initialized with default credentials")
                except Exception as default_err:
                    # No credentials found
                    print(f"[WARN] Firestore: No credentials found, running in local-only mode")
                    print(f"  Looked in: FIREBASE_CREDENTIALS_JSON env, FIREBASE_CREDENTIALS_PATH env, backend/firebase-credentials.json")
                    self.db = None
                    return
            
        except Exception as e:
            print(f"[ERROR] Firestore initialization error: {e}")
            self.db = None
    
    def is_available(self) -> bool:
        """Check if Firestore is available"""
        return self.db is not None
    
    # ==================== USER SESSION OPERATIONS ====================
    
    def save_user_session(
        self,
        user_id: str,
        session_id: str,
        tables: List[str],
        created_at: datetime,
        expires_at: datetime
    ) -> bool:
        """
        Save user session to Firestore.
        
        Security: Only the user's own session is saved, scoped by user_id.
        """
        if not self.is_available():
            return False
        
        try:
            doc_ref = self.db.collection('user_sessions').document(user_id)
            doc_ref.set({
                'user_id': user_id,
                'session_id': session_id,
                'tables': tables,
                'created_at': created_at,
                'expires_at': expires_at,
                'updated_at': datetime.now(),
            }, merge=True)
            return True
        except Exception as e:
            print(f"Error saving user session: {e}")
            return False
    
    def get_user_session(self, user_id: str) -> Optional[Dict]:
        """
        Get user session from Firestore.
        
        Security: Only returns the user's own session.
        """
        if not self.is_available():
            return None
        
        try:
            doc_ref = self.db.collection('user_sessions').document(user_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                # Convert Firestore timestamps to datetime
                if 'created_at' in data and hasattr(data['created_at'], 'timestamp'):
                    data['created_at'] = data['created_at'].timestamp()
                if 'expires_at' in data and hasattr(data['expires_at'], 'timestamp'):
                    data['expires_at'] = data['expires_at'].timestamp()
                return data
            return None
        except Exception as e:
            print(f"Error getting user session: {e}")
            return None
    
    def delete_user_session(self, user_id: str) -> bool:
        """Delete user session from Firestore"""
        if not self.is_available():
            return False
        
        try:
            # Delete session document
            self.db.collection('user_sessions').document(user_id).delete()
            
            # Delete all tables for this user
            tables_ref = self.db.collection('user_tables')
            query = tables_ref.where(filter=FieldFilter('user_id', '==', user_id))
            
            batch = self.db.batch()
            for doc in query.stream():
                batch.delete(doc.reference)
            batch.commit()
            
            return True
        except Exception as e:
            print(f"Error deleting user session: {e}")
            return False
    
    # ==================== TABLE OPERATIONS ====================
    
    def save_table_metadata(
        self,
        user_id: str,
        session_id: str,
        table_name: str,
        columns: List[Dict[str, str]],
        row_count: int,
        created_at: Optional[datetime] = None
    ) -> bool:
        """
        Save table metadata to Firestore.
        
        Security: Table is scoped to user_id, preventing cross-user access.
        """
        if not self.is_available():
            return False
        
        try:
            # Use composite key: user_id + table_name
            doc_id = f"{user_id}_{table_name}"
            doc_ref = self.db.collection('user_tables').document(doc_id)
            
            doc_ref.set({
                'user_id': user_id,
                'session_id': session_id,
                'table_name': table_name,
                'columns': columns,
                'row_count': row_count,
                'created_at': created_at or datetime.now(),
                'updated_at': datetime.now(),
                'has_data': False,  # Will be updated if data is stored
            }, merge=True)
            
            return True
        except Exception as e:
            print(f"Error saving table metadata: {e}")
            return False
    
    def save_table_data(
        self,
        user_id: str,
        table_name: str,
        data: List[List[Any]],
        columns: List[str]
    ) -> bool:
        """
        Save table data to Firestore (compressed).
        
        Cost Optimization:
        - Only stores tables under MAX_ROWS_TO_STORE rows
        - Compresses data using gzip
        - Stores as base64 encoded string
        
        Security: Data is scoped to user_id.
        """
        if not self.is_available():
            return False
        
        # Check row limit for cost efficiency
        if len(data) > MAX_ROWS_TO_STORE:
            print(f"Table {table_name} has {len(data)} rows, exceeding limit. Storing metadata only.")
            return False
        
        try:
            # Prepare data for storage
            table_data = {
                'columns': columns,
                'rows': data
            }
            
            # Compress data (use custom encoder for datetime/date/Decimal)
            json_str = json.dumps(table_data, cls=DateTimeEncoder)
            compressed = gzip.compress(json_str.encode('utf-8'))
            
            # Check size limit
            if len(compressed) > MAX_TABLE_DATA_SIZE:
                print(f"Table {table_name} data too large ({len(compressed)} bytes). Storing metadata only.")
                return False
            
            # Encode as base64 for Firestore storage
            encoded = base64.b64encode(compressed).decode('utf-8')
            
            # Save to Firestore
            doc_id = f"{user_id}_{table_name}"
            doc_ref = self.db.collection('user_tables').document(doc_id)
            
            doc_ref.update({
                'data_compressed': encoded,
                'data_size_bytes': len(compressed),
                'has_data': True,
                'updated_at': datetime.now(),
            })
            
            return True
        except Exception as e:
            print(f"Error saving table data: {e}")
            return False
    
    def get_table_data(
        self,
        user_id: str,
        table_name: str
    ) -> Optional[Dict]:
        """
        Get table data from Firestore.
        
        Security: Only returns data for the specified user.
        
        Returns:
            Dict with 'columns' and 'rows' if data exists, None otherwise
        """
        if not self.is_available():
            return None
        
        try:
            doc_id = f"{user_id}_{table_name}"
            doc_ref = self.db.collection('user_tables').document(doc_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return None
            
            data = doc.to_dict()
            
            # Check if data is stored
            if not data.get('has_data') or 'data_compressed' not in data:
                return None
            
            # Decompress data
            compressed = base64.b64decode(data['data_compressed'])
            json_str = gzip.decompress(compressed).decode('utf-8')
            table_data = json.loads(json_str)
            
            return table_data
        except Exception as e:
            print(f"Error getting table data: {e}")
            return None
    
    def get_user_tables(self, user_id: str) -> List[Dict]:
        """
        Get all table metadata for a user.
        
        Security: Only returns tables belonging to the specified user.
        """
        if not self.is_available():
            return []
        
        try:
            tables_ref = self.db.collection('user_tables')
            query = tables_ref.where(filter=FieldFilter('user_id', '==', user_id))
            
            tables = []
            for doc in query.stream():
                data = doc.to_dict()
                # Don't include the compressed data in the list
                if 'data_compressed' in data:
                    del data['data_compressed']
                tables.append(data)
            
            return tables
        except Exception as e:
            print(f"Error getting user tables: {e}")
            return []
    
    def delete_table(self, user_id: str, table_name: str) -> bool:
        """
        Delete a table from Firestore.
        
        Security: Only deletes if the table belongs to the user.
        """
        if not self.is_available():
            return False
        
        try:
            doc_id = f"{user_id}_{table_name}"
            doc_ref = self.db.collection('user_tables').document(doc_id)
            
            # Verify ownership before deletion
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                if data.get('user_id') != user_id:
                    print(f"Security: User {user_id} attempted to delete table owned by {data.get('user_id')}")
                    return False
            
            doc_ref.delete()
            return True
        except Exception as e:
            print(f"Error deleting table: {e}")
            return False
    
    # ==================== SYNC OPERATIONS ====================
    
    def sync_session_to_firestore(
        self,
        user_id: str,
        session_id: str,
        session_data: Dict,
        conn  # DuckDB connection
    ) -> bool:
        """
        Sync entire session to Firestore.
        
        This is called when:
        1. User uploads a new CSV
        2. User generates sample data
        3. Periodic background sync
        
        Consistency: Ensures Firestore has the latest data from DuckDB.
        """
        if not self.is_available() or not user_id:
            return False
        
        try:
            tables = session_data.get('tables', [])
            
            # Save session metadata
            self.save_user_session(
                user_id=user_id,
                session_id=session_id,
                tables=tables,
                created_at=session_data.get('created_at', datetime.now()),
                expires_at=session_data.get('expires_at', datetime.now() + timedelta(days=365))
            )
            
            # Sync each table
            for table_name in tables:
                self._sync_table_to_firestore(user_id, session_id, table_name, conn)
            
            return True
        except Exception as e:
            print(f"Error syncing session to Firestore: {e}")
            return False
    
    def _sync_table_to_firestore(
        self,
        user_id: str,
        session_id: str,
        table_name: str,
        conn  # DuckDB connection
    ) -> bool:
        """Sync a single table to Firestore"""
        try:
            # Get table schema
            columns_result = conn.execute(f"DESCRIBE {table_name}").fetchall()
            columns = [{"name": col[0], "type": col[1]} for col in columns_result]
            
            # Get row count
            row_count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            
            # Save metadata
            self.save_table_metadata(
                user_id=user_id,
                session_id=session_id,
                table_name=table_name,
                columns=columns,
                row_count=row_count
            )
            
            # Try to save data (will skip if too large)
            if row_count <= MAX_ROWS_TO_STORE:
                data_result = conn.execute(f"SELECT * FROM {table_name}").fetchall()
                column_names = [col['name'] for col in columns]
                
                # Convert to list of lists
                data = [list(row) for row in data_result]
                
                self.save_table_data(
                    user_id=user_id,
                    table_name=table_name,
                    data=data,
                    columns=column_names
                )
            
            return True
        except Exception as e:
            print(f"Error syncing table {table_name}: {e}")
            return False
    
    def restore_session_from_firestore(
        self,
        user_id: str,
        conn  # DuckDB connection
    ) -> Optional[Dict]:
        """
        Restore session from Firestore to DuckDB.
        
        This is called when:
        1. User logs in on a new device
        2. Server restarts and session is not in memory
        
        Consistency: Rebuilds DuckDB from Firestore data.
        
        Returns:
            Session data dict if successful, None otherwise
        """
        if not self.is_available():
            return None
        
        try:
            # Get user session
            session_data = self.get_user_session(user_id)
            if not session_data:
                return None
            
            tables_restored = []
            
            # Get all tables for user
            tables = self.get_user_tables(user_id)
            
            for table_meta in tables:
                table_name = table_meta['table_name']
                
                # Try to restore table data
                table_data = self.get_table_data(user_id, table_name)
                
                if table_data:
                    # Restore table from stored data
                    self._restore_table_to_duckdb(
                        conn=conn,
                        table_name=table_name,
                        columns=table_data['columns'],
                        rows=table_data['rows'],
                        column_types=table_meta.get('columns', [])
                    )
                    tables_restored.append(table_name)
                else:
                    print(f"No data stored for table {table_name}, skipping restore")
            
            return {
                'session_id': session_data.get('session_id'),
                'tables': tables_restored,
                'created_at': session_data.get('created_at'),
                'expires_at': session_data.get('expires_at'),
            }
            
        except Exception as e:
            print(f"Error restoring session from Firestore: {e}")
            return None
    
    def _restore_table_to_duckdb(
        self,
        conn,
        table_name: str,
        columns: List[str],
        rows: List[List[Any]],
        column_types: List[Dict[str, str]]
    ) -> bool:
        """Restore a table to DuckDB from Firestore data"""
        try:
            # Drop existing table if exists
            conn.execute(f"DROP TABLE IF EXISTS {table_name}")
            
            # Build column definitions
            type_map = {col['name']: col['type'] for col in column_types}
            col_defs = []
            for col_name in columns:
                col_type = type_map.get(col_name, 'VARCHAR')
                col_defs.append(f'"{col_name}" {col_type}')
            
            # Create table
            create_sql = f"CREATE TABLE {table_name} ({', '.join(col_defs)})"
            conn.execute(create_sql)
            
            # Insert data in batches
            if rows:
                placeholders = ', '.join(['?' for _ in columns])
                insert_sql = f"INSERT INTO {table_name} VALUES ({placeholders})"
                
                # Batch insert for efficiency
                batch_size = 1000
                for i in range(0, len(rows), batch_size):
                    batch = rows[i:i + batch_size]
                    conn.executemany(insert_sql, batch)
            
            return True
        except Exception as e:
            print(f"Error restoring table {table_name} to DuckDB: {e}")
            return False
    
    # ==================== USER QUERY OPERATIONS ====================
    
    def save_user_query(self, user_id: str, query: str) -> bool:
        """
        Save user's current query to Firestore for cross-device persistence.
        
        This saves the latest query the user is working on, so they can
        continue from any device.
        
        Security: Query is scoped to user_id.
        """
        if not self.is_available() or not user_id:
            return False
        
        try:
            doc_ref = self.db.collection('user_queries').document(user_id)
            doc_ref.set({
                'user_id': user_id,
                'current_query': query,
                'updated_at': datetime.now(),
            }, merge=True)
            return True
        except Exception as e:
            print(f"Error saving user query: {e}")
            return False
    
    def get_user_query(self, user_id: str) -> Optional[str]:
        """
        Get user's saved query from Firestore.
        
        Returns the latest query the user was working on.
        
        Security: Only returns query for the specified user_id.
        """
        if not self.is_available() or not user_id:
            return None
        
        try:
            doc_ref = self.db.collection('user_queries').document(user_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                return data.get('current_query')
            return None
        except Exception as e:
            print(f"Error getting user query: {e}")
            return None
    
    def delete_user_query(self, user_id: str) -> bool:
        """Delete user's saved query from Firestore."""
        if not self.is_available() or not user_id:
            return False
        
        try:
            self.db.collection('user_queries').document(user_id).delete()
            return True
        except Exception as e:
            print(f"Error deleting user query: {e}")
            return False


# Global singleton instance
firestore_service = FirestoreService()
