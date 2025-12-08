# Firebase Admin SDK Setup for Backend

This guide explains how to set up Firebase Admin SDK for persistent data storage.

## 1. Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `sql-online-ide`
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the JSON file as `  `

## 2. Configure Backend

### Option A: Environment Variable (Recommended for Production)

```bash
# Set the path to your credentials file
export FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json
```

### Option B: Place in Backend Directory (Development)

1. Copy `firebase-credentials.json` to `backend/` directory
2. Update `.env` file:

```env
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

### Option C: Default Credentials (Cloud Deployment)

When deploying to Google Cloud (Cloud Run, GCE, etc.), the SDK will automatically use default credentials.

## 3. Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database**
4. Click **"Create Database"**
5. Choose **Production Mode** (we'll set rules next)
6. Select a location close to your users

## 4. Set Firestore Security Rules

Go to **Firestore Database** → **Rules** and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User sessions - only accessible by the user
    match /user_sessions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User tables - only accessible by the owner
    match /user_tables/{docId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Backend service account has full access (for server-side operations)
    match /{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

## 5. Install Dependencies

```bash
cd backend
pip install firebase-admin
```

Or update requirements:

```bash
pip install -r requirements.txt
```

## 6. Verify Setup

Run the backend and check logs:

```bash
cd backend
python -m uvicorn main:app --reload
```

You should see:
```
✓ Firestore: Initialized with credentials from ./firebase-credentials.json
```

## Data Structure

### Collection: `user_sessions`

```json
{
  "user_id": "firebase-uid",
  "session_id": "uuid",
  "tables": ["table1", "table2"],
  "created_at": "timestamp",
  "expires_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Collection: `user_tables`

Document ID: `{user_id}_{table_name}`

```json
{
  "user_id": "firebase-uid",
  "session_id": "uuid",
  "table_name": "employees",
  "columns": [
    {"name": "id", "type": "INTEGER"},
    {"name": "name", "type": "VARCHAR"}
  ],
  "row_count": 100,
  "has_data": true,
  "data_compressed": "base64-gzip-compressed-data",
  "data_size_bytes": 12345,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Cost Optimization

The implementation includes several cost-saving measures:

1. **Compression**: Table data is gzip compressed before storage
2. **Size Limits**: Tables over 10,000 rows or 500KB compressed are metadata-only
3. **Batch Writes**: Multiple operations are batched when possible
4. **Lazy Sync**: Data syncs on table creation, not on every query

## Security Features

1. **User Isolation**: Each user can only access their own data
2. **Composite Keys**: Table documents use `{user_id}_{table_name}` to prevent collisions
3. **Ownership Validation**: Delete operations verify ownership before proceeding
4. **No Cross-User Access**: Backend validates user_id on all operations

## Troubleshooting

### "Firestore not available, running in local-only mode"

- Credentials file not found or invalid
- Check `FIREBASE_CREDENTIALS_PATH` environment variable

### "Permission denied" errors

- Firestore rules not configured correctly
- Service account doesn't have required permissions

### Data not syncing

- Check backend logs for sync errors
- Verify Firestore is enabled in Firebase Console

