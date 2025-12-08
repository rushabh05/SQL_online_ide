# Online SQL Playground - Implementation Plan

## Project Overview
Build an online IDE where users upload CSV files, which are automatically converted into SQL tables, allowing users to practice SQL queries safely.

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Query Engine**: DuckDB (fast, excellent CSV support, built-in security)
- **File Storage**: Local temporary storage with session management
- **Session Management**: In-memory sessions with UUID-based isolation

### Frontend
- **Framework**: React with Vite
- **SQL Editor**: Monaco Editor (VS Code's editor)
- **Styling**: Modern CSS with glassmorphism and animations
- **UI Components**: Custom-built with premium design

## Architecture

```
┌─────────────────┐
│   React Frontend │
│  (Monaco Editor) │
└────────┬────────┘
         │ REST API
┌────────▼────────────────┐
│   FastAPI Backend       │
│  - Upload Handler       │
│  - Query Executor       │
│  - Session Manager      │
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│   DuckDB Engine         │
│  - Per-session DB       │
│  - Resource limits      │
│  - Query sandboxing     │
└─────────────────────────┘
```

## Implementation Phases

### Phase 1: Backend Foundation
1. Set up FastAPI project structure
2. Implement session management (UUID-based)
3. Create DuckDB connection pool with resource limits
4. Build CSV upload endpoint with validation
5. Implement CSV-to-table conversion with schema inference

### Phase 2: Query Execution
1. Create SQL query execution endpoint
2. Add query timeout and result size limits
3. Implement error handling and user-friendly messages
4. Add query explanation feature
5. Build CSV download endpoint for results

### Phase 3: Frontend Foundation
1. Set up React + Vite project
2. Integrate Monaco Editor for SQL
3. Create upload component with drag-and-drop
4. Build schema preview component
5. Design results display component

### Phase 4: Integration & Features
1. Connect frontend to backend APIs
2. Implement session persistence (24-hour TTL)
3. Add sample queries/snippets
4. Build query history
5. Add syntax highlighting and auto-completion

### Phase 5: Security & Polish
1. Add rate limiting
2. Implement CSRF protection
3. Add input validation and sanitization
4. Create comprehensive error messages
5. Performance testing and optimization

## File Structure

```
SQL_online_ide/
├── backend/
│   ├── main.py                 # FastAPI app entry
│   ├── routes/
│   │   ├── upload.py          # Upload endpoints
│   │   ├── query.py           # Query execution
│   │   └── session.py         # Session management
│   ├── services/
│   │   ├── csv_converter.py   # CSV to SQL conversion
│   │   ├── query_executor.py  # DuckDB query execution
│   │   └── session_manager.py # Session lifecycle
│   ├── models/
│   │   └── schemas.py         # Pydantic models
│   ├── utils/
│   │   ├── validators.py      # Input validation
│   │   └── security.py        # Security utilities
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── SchemaPreview.jsx
│   │   │   ├── SQLEditor.jsx
│   │   │   ├── QueryResults.jsx
│   │   │   └── SampleQueries.jsx
│   │   ├── services/
│   │   │   └── api.js         # API client
│   │   └── styles/
│   │       └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Security Measures

1. **Query Sandboxing**: Each session gets isolated DuckDB instance
2. **Resource Limits**: 
   - Max file size: 50MB
   - Query timeout: 10 seconds
   - Max result rows: 10,000
   - Memory cap per session: 512MB
3. **Rate Limiting**: 10 queries per minute per session
4. **Input Validation**: Strict CSV and SQL validation
5. **Session Isolation**: UUID-based, no cross-session access

## Key Features

### Upload & Conversion
- Drag-and-drop CSV upload
- Multi-file upload support
- Auto schema detection (types: INTEGER, FLOAT, VARCHAR, DATE)
- Preview first 100 rows
- Display column statistics

### SQL Workspace
- Monaco editor with SQL syntax highlighting
- Auto-completion for table/column names
- Query templates (SELECT, JOIN, GROUP BY, etc.)
- Query execution with real-time results
- Query explanation (EXPLAIN command)
- Download results as CSV

### User Experience
- Modern, premium UI with animations
- Clear error messages
- Loading states and progress indicators
- Responsive design
- Dark mode support

## Success Metrics

- Query response time: <2s for 100k rows
- Support 50+ concurrent sessions
- 99.9% query execution success rate
- Zero cross-session data leaks
- User-friendly error messages (95% clarity rating)

## Future Enhancements (Out of Scope for MVP)

- User authentication and saved workspaces
- Query sharing and collaboration
- Support for multiple database engines
- Advanced query optimization hints
- Data visualization charts
- Export to multiple formats (Excel, JSON, Parquet)
