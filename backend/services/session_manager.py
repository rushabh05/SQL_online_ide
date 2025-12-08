"""
Session management service for handling user sessions with persistence
Supports both guest sessions and user-linked sessions

Architecture:
- DuckDB: Fast SQL query execution (local/server-side)
- Firestore: Persistent cloud storage for logged-in users
- Local files: Backup metadata for server restarts

Data Flow:
1. Guest users: DuckDB only (1 hour TTL)
2. Logged-in users: DuckDB + Firestore sync (permanent until deleted)
   - On upload: Save to DuckDB immediately, sync to Firestore async
   - On login (new device): Restore from Firestore if DuckDB empty
   - On table delete: Remove from both DuckDB and Firestore
"""
import uuid
import os
import shutil
import json
import pickle
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple
import duckdb
import threading

# Import Firestore service (lazy import to avoid circular deps)
def get_firestore_service():
    from services.firestore_service import firestore_service
    return firestore_service


class SessionManager:
    """
    Manages user sessions and DuckDB connections with dual persistence.
    
    Storage Strategy:
    - Guest sessions: DuckDB only, 1 hour TTL
    - User sessions: DuckDB + Firestore, permanent until deleted
    
    Consistency:
    - Write-through to Firestore for logged-in users
    - Restore from Firestore on new device/server restart
    """
    
    # Permanent TTL for logged-in users (effectively no expiry)
    USER_TTL_DAYS = 365  # 1 year (effectively permanent)
    GUEST_TTL_HOURS = 1  # 1 hour for guests
    
    def __init__(self, session_ttl_hours: int = 24):  # Legacy param, ignored for users
        self.sessions: Dict[str, dict] = {}
        self.session_ttl = timedelta(days=self.USER_TTL_DAYS)  # Permanent for users
        self.guest_ttl = timedelta(hours=self.GUEST_TTL_HOURS)
        self.lock = threading.Lock()
        self.base_dir = os.path.join(os.path.dirname(__file__), "..", "temp_sessions")
        self.user_sessions_file = os.path.join(self.base_dir, "user_sessions.json")
        os.makedirs(self.base_dir, exist_ok=True)
        
        # Load user-session mappings
        self.user_sessions: Dict[str, str] = self._load_user_sessions()
    
    def _load_user_sessions(self) -> Dict[str, str]:
        """Load user-to-session mappings from disk"""
        if os.path.exists(self.user_sessions_file):
            try:
                with open(self.user_sessions_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_user_sessions(self):
        """Save user-to-session mappings to disk"""
        try:
            with open(self.user_sessions_file, 'w') as f:
                json.dump(self.user_sessions, f, indent=2)
        except Exception as e:
            print(f"Error saving user sessions: {e}")
    
    def create_session(self, existing_session_id: Optional[str] = None, user_id: Optional[str] = None) -> Tuple[str, datetime]:
        """Create a new session and return session_id and expiration time"""
        
        # If user is logged in and already has a session, return that
        if user_id and user_id in self.user_sessions:
            existing_id = self.user_sessions[user_id]
            result = self.restore_session(existing_id, user_id)
            if result:
                return result
        
        session_id = existing_session_id or str(uuid.uuid4())
        
        # Use longer TTL for logged-in users
        ttl = self.session_ttl if user_id else self.guest_ttl
        expires_at = datetime.now() + ttl
        
        # Create session directory
        session_dir = os.path.join(self.base_dir, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Use persistent DuckDB for session restoration
        db_path = os.path.join(session_dir, "session.duckdb")
        conn = duckdb.connect(db_path)
        
        # Set resource limits
        conn.execute("SET memory_limit='512MB'")
        conn.execute("SET threads=2")
        
        with self.lock:
            self.sessions[session_id] = {
                "connection": conn,
                "created_at": datetime.now(),
                "expires_at": expires_at,
                "session_dir": session_dir,
                "db_path": db_path,
                "tables": [],
                "query_count": 0,
                "last_query_time": None,
                "user_id": user_id  # Link to user if logged in
            }
            
            # Link user to session
            if user_id:
                self.user_sessions[user_id] = session_id
                self._save_user_sessions()
        
        # Save session metadata
        self._save_session_metadata(session_id)
        
        return session_id, expires_at
    
    def get_user_session(self, user_id: str) -> Optional[Tuple[str, datetime]]:
        """
        Get the session linked to a user.
        
        Priority:
        1. Check local user_sessions mapping
        2. Try to restore from local DuckDB files
        3. Try to restore from Firestore (cross-device support)
        """
        # First, check local mapping
        if user_id in self.user_sessions:
            session_id = self.user_sessions[user_id]
            result = self.restore_session(session_id, user_id)
            if result:
                return result
        
        # Try to restore from Firestore if not found locally
        return self._restore_from_firestore(user_id)
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """Get session information"""
        with self.lock:
            if session_id not in self.sessions:
                return None
            
            session = self.sessions[session_id]
            
            # Check if session expired
            if datetime.now() > session["expires_at"]:
                self._cleanup_session(session_id)
                return None
            
            return session
    
    def get_connection(self, session_id: str) -> Optional[duckdb.DuckDBPyConnection]:
        """Get DuckDB connection for a session"""
        session = self.get_session(session_id)
        if session:
            return session["connection"]
        return None
    
    def add_table(self, session_id: str, table_name: str):
        """
        Add a table to session's table list.
        For logged-in users, also syncs to Firestore.
        """
        with self.lock:
            if session_id in self.sessions:
                if table_name not in self.sessions[session_id]["tables"]:
                    self.sessions[session_id]["tables"].append(table_name)
                    self._save_session_metadata(session_id)
                    
                    # Sync to Firestore for logged-in users
                    user_id = self.sessions[session_id].get("user_id")
                    if user_id:
                        self._sync_table_to_firestore(session_id, table_name)
    
    def remove_table(self, session_id: str, table_name: str):
        """
        Remove a table from session's table list.
        For logged-in users, also removes from Firestore.
        """
        with self.lock:
            if session_id in self.sessions:
                if table_name in self.sessions[session_id]["tables"]:
                    self.sessions[session_id]["tables"].remove(table_name)
                    self._save_session_metadata(session_id)
                    
                    # Remove from Firestore for logged-in users
                    user_id = self.sessions[session_id].get("user_id")
                    if user_id:
                        try:
                            fs = get_firestore_service()
                            fs.delete_table(user_id, table_name)
                        except Exception as e:
                            print(f"Error removing table from Firestore: {e}")
    
    def increment_query_count(self, session_id: str):
        """Increment query count and update last query time"""
        with self.lock:
            if session_id in self.sessions:
                self.sessions[session_id]["query_count"] += 1
                self.sessions[session_id]["last_query_time"] = datetime.now()
    
    def check_rate_limit(self, session_id: str, max_queries_per_minute: int = 10) -> bool:
        """Check if session has exceeded rate limit"""
        session = self.get_session(session_id)
        if not session:
            return False
        
        last_query = session.get("last_query_time")
        if not last_query:
            return True
        
        # Simple rate limiting: check queries in last minute
        one_minute_ago = datetime.now() - timedelta(minutes=1)
        if last_query > one_minute_ago:
            # Count recent queries (simplified - in production use a sliding window)
            return session["query_count"] < max_queries_per_minute
        
        return True
    
    def _cleanup_session(self, session_id: str):
        """Clean up session resources"""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            
            # Close DuckDB connection
            try:
                session["connection"].close()
            except:
                pass
            
            # Remove user-session mapping if exists
            user_id = session.get("user_id")
            if user_id and user_id in self.user_sessions:
                if self.user_sessions[user_id] == session_id:
                    del self.user_sessions[user_id]
                    self._save_user_sessions()
            
            # Remove session directory (only for guest sessions or expired user sessions)
            # For user sessions, we keep the data
            try:
                if not user_id and os.path.exists(session["session_dir"]):
                    shutil.rmtree(session["session_dir"])
            except:
                pass
            
            # Remove from sessions dict
            del self.sessions[session_id]
    
    def cleanup_expired_sessions(self):
        """Clean up all expired sessions"""
        with self.lock:
            expired = [
                sid for sid, sess in self.sessions.items()
                if datetime.now() > sess["expires_at"]
            ]
            
            for sid in expired:
                self._cleanup_session(sid)
    
    def delete_session(self, session_id: str):
        """Manually delete a session"""
        with self.lock:
            self._cleanup_session(session_id)
    
    def _save_session_metadata(self, session_id: str):
        """Save session metadata to disk for persistence"""
        if session_id not in self.sessions:
            return
        
        session = self.sessions[session_id]
        metadata = {
            "session_id": session_id,
            "created_at": session["created_at"].isoformat(),
            "expires_at": session["expires_at"].isoformat(),
            "tables": session["tables"],
            "query_count": session["query_count"],
            "last_query_time": session["last_query_time"].isoformat() if session["last_query_time"] else None,
            "user_id": session.get("user_id")
        }
        
        metadata_path = os.path.join(session["session_dir"], "metadata.json")
        try:
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
        except Exception as e:
            print(f"Error saving session metadata: {e}")
    
    def restore_session(self, session_id: str, user_id: Optional[str] = None) -> Optional[Tuple[str, datetime]]:
        """Restore an existing session from disk"""
        session_dir = os.path.join(self.base_dir, session_id)
        metadata_path = os.path.join(session_dir, "metadata.json")
        db_path = os.path.join(session_dir, "session.duckdb")
        
        # Check if session exists on disk
        if not os.path.exists(metadata_path) or not os.path.exists(db_path):
            return None
        
        try:
            # Load metadata
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Check if session expired
            expires_at = datetime.fromisoformat(metadata["expires_at"])
            stored_user_id = metadata.get("user_id")
            
            # For guest sessions, check expiration strictly
            if not stored_user_id and datetime.now() > expires_at:
                # Clean up expired guest session
                shutil.rmtree(session_dir)
                return None
            
            # Use longer TTL for logged-in users
            ttl = self.session_ttl if (user_id or stored_user_id) else self.guest_ttl
            new_expires_at = datetime.now() + ttl
            
            # If a user is logging in and claiming this session, link it
            effective_user_id = user_id or stored_user_id
            
            # Reconnect to existing database
            conn = duckdb.connect(db_path)
            conn.execute("SET memory_limit='512MB'")
            conn.execute("SET threads=2")
            
            with self.lock:
                self.sessions[session_id] = {
                    "connection": conn,
                    "created_at": datetime.fromisoformat(metadata["created_at"]),
                    "expires_at": new_expires_at,
                    "session_dir": session_dir,
                    "db_path": db_path,
                    "tables": metadata["tables"],
                    "query_count": metadata["query_count"],
                    "last_query_time": datetime.fromisoformat(metadata["last_query_time"]) if metadata["last_query_time"] else None,
                    "user_id": effective_user_id
                }
                
                # Update user-session mapping if user is logged in
                if effective_user_id:
                    self.user_sessions[effective_user_id] = session_id
                    self._save_user_sessions()
            
            # Update metadata with new expiration and user
            self._save_session_metadata(session_id)
            
            return session_id, new_expires_at
            
        except Exception as e:
            print(f"Error restoring session: {e}")
            return None
    
    def get_session_tables(self, session_id: str) -> List[dict]:
        """Get list of tables in session with their schemas"""
        conn = self.get_connection(session_id)
        if not conn:
            return []
        
        try:
            # Get all tables
            tables_result = conn.execute("SHOW TABLES").fetchall()
            tables_info = []
            
            for (table_name,) in tables_result:
                # Get column info
                columns_result = conn.execute(f"DESCRIBE {table_name}").fetchall()
                columns = [{"name": col[0], "type": col[1]} for col in columns_result]
                
                # Get row count
                row_count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
                
                tables_info.append({
                    "table_name": table_name,
                    "columns": columns,
                    "row_count": row_count
                })
            
            return tables_info
            
        except Exception as e:
            print(f"Error getting session tables: {e}")
            return []
    
    def extend_session(self, session_id: str) -> Optional[datetime]:
        """Extend session expiration time"""
        session = self.get_session(session_id)
        if not session:
            return None
        
        # Use appropriate TTL based on whether user is logged in
        ttl = self.session_ttl if session.get("user_id") else self.guest_ttl
        
        with self.lock:
            new_expires_at = datetime.now() + ttl
            self.sessions[session_id]["expires_at"] = new_expires_at
            self._save_session_metadata(session_id)
            return new_expires_at

    # ==================== FIRESTORE SYNC METHODS ====================
    
    def _sync_table_to_firestore(self, session_id: str, table_name: str):
        """
        Sync a single table to Firestore (async-safe).
        Called after table creation/update.
        """
        try:
            session = self.sessions.get(session_id)
            if not session:
                return
            
            user_id = session.get("user_id")
            if not user_id:
                return  # Don't sync guest sessions
            
            conn = session.get("connection")
            if not conn:
                return
            
            fs = get_firestore_service()
            if not fs.is_available():
                print("Firestore not available, skipping sync")
                return
            
            # Get table schema
            columns_result = conn.execute(f"DESCRIBE {table_name}").fetchall()
            columns = [{"name": col[0], "type": col[1]} for col in columns_result]
            
            # Get row count
            row_count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            
            # Save metadata
            fs.save_table_metadata(
                user_id=user_id,
                session_id=session_id,
                table_name=table_name,
                columns=columns,
                row_count=row_count
            )
            
            # Try to save data (will skip if too large)
            if row_count <= 10000:  # MAX_ROWS_TO_STORE
                data_result = conn.execute(f"SELECT * FROM {table_name}").fetchall()
                column_names = [col['name'] for col in columns]
                data = [list(row) for row in data_result]
                
                fs.save_table_data(
                    user_id=user_id,
                    table_name=table_name,
                    data=data,
                    columns=column_names
                )
            
            # Update session in Firestore
            fs.save_user_session(
                user_id=user_id,
                session_id=session_id,
                tables=session.get("tables", []),
                created_at=session.get("created_at", datetime.now()),
                expires_at=session.get("expires_at", datetime.now() + self.session_ttl)
            )
            
            print(f"[OK] Synced table '{table_name}' to Firestore for user {user_id[:8]}...")
            
        except Exception as e:
            print(f"Error syncing table to Firestore: {e}")
    
    def _restore_from_firestore(self, user_id: str) -> Optional[Tuple[str, datetime]]:
        """
        Restore user session from Firestore.
        Called when user logs in on a new device or after server restart.
        """
        try:
            fs = get_firestore_service()
            if not fs.is_available():
                return None
            
            # Get user session from Firestore
            session_data = fs.get_user_session(user_id)
            if not session_data:
                return None
            
            print(f"Found Firestore session for user {user_id[:8]}...")
            
            # Create new local session
            session_id = session_data.get('session_id') or str(uuid.uuid4())
            expires_at = datetime.now() + self.session_ttl
            
            # Create session directory
            session_dir = os.path.join(self.base_dir, session_id)
            os.makedirs(session_dir, exist_ok=True)
            
            # Create new DuckDB connection
            db_path = os.path.join(session_dir, "session.duckdb")
            conn = duckdb.connect(db_path)
            conn.execute("SET memory_limit='512MB'")
            conn.execute("SET threads=2")
            
            # Restore tables from Firestore
            restored_tables = []
            user_tables = fs.get_user_tables(user_id)
            
            for table_meta in user_tables:
                table_name = table_meta['table_name']
                table_data = fs.get_table_data(user_id, table_name)
                
                if table_data:
                    # Restore table to DuckDB
                    if self._restore_table_to_duckdb(
                        conn=conn,
                        table_name=table_name,
                        columns=table_data['columns'],
                        rows=table_data['rows'],
                        column_types=table_meta.get('columns', [])
                    ):
                        restored_tables.append(table_name)
                        print(f"  [OK] Restored table '{table_name}' ({len(table_data['rows'])} rows)")
            
            # Save session
            with self.lock:
                self.sessions[session_id] = {
                    "connection": conn,
                    "created_at": datetime.now(),
                    "expires_at": expires_at,
                    "session_dir": session_dir,
                    "db_path": db_path,
                    "tables": restored_tables,
                    "query_count": 0,
                    "last_query_time": None,
                    "user_id": user_id
                }
                
                self.user_sessions[user_id] = session_id
                self._save_user_sessions()
            
            self._save_session_metadata(session_id)
            
            print(f"[OK] Restored session from Firestore with {len(restored_tables)} tables")
            return session_id, expires_at
            
        except Exception as e:
            print(f"Error restoring from Firestore: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _restore_table_to_duckdb(
        self,
        conn,
        table_name: str,
        columns: List[str],
        rows: List[List],
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
    
    def sync_all_user_data(self, user_id: str) -> bool:
        """
        Force sync all user data to Firestore.
        Useful for manual backup or before logout.
        """
        try:
            # Find user's session
            if user_id not in self.user_sessions:
                return False
            
            session_id = self.user_sessions[user_id]
            session = self.sessions.get(session_id)
            if not session:
                return False
            
            fs = get_firestore_service()
            if not fs.is_available():
                return False
            
            conn = session.get("connection")
            if not conn:
                return False
            
            # Sync session and all tables
            return fs.sync_session_to_firestore(
                user_id=user_id,
                session_id=session_id,
                session_data=session,
                conn=conn
            )
            
        except Exception as e:
            print(f"Error syncing user data: {e}")
            return False


# Global session manager instance
session_manager = SessionManager()
