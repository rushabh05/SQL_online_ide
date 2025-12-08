# 🗄️ SQL Workspace - Professional Database IDE

A modern, web-based SQL editor inspired by DBeaver and MySQL Workbench. Upload CSV files, generate sample data, and execute SQL queries with a professional interface.

![Version](https://img.shields.io/badge/version-2.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.9+-blue)
![Next.js](https://img.shields.io/badge/next.js-16.0-black)

---

## ✨ Features

### 🎨 Professional UI
- **DBeaver-Style Interface**: Familiar layout for database professionals
- **Collapsible Panels**: Left sidebar, bottom results, right history
- **Resizable Panels**: Drag to resize sidebar and results panel
- **Dark Theme**: Easy on the eyes with syntax highlighting

### 📊 Data Management
- **CSV Upload**: Drag & drop CSV files to create tables
- **Sample Data Generation**: 6 predefined tables + custom generation
- **Table Management**: View schema, delete tables, browse data
- **Multiple Tables**: Upload and join multiple datasets
- **Session Persistence**: Auto-save with 1-hour TTL - reload and continue!

### 💻 SQL Editor
- **Monaco Editor**: Same editor as VS Code
- **Syntax Highlighting**: SQL keywords, strings, numbers
- **Auto-complete**: Smart suggestions (coming soon)
- **Keyboard Shortcuts**: Ctrl+Enter to run, and more
- **Sample Queries**: Pre-built query templates

### 🔍 Query Execution
- **Fast Execution**: Powered by DuckDB
- **Terminal-Style Results**: Professional output display
- **Query History**: Save and favorite queries
- **Explain Plans**: Analyze query performance
- **CSV Export**: Download results

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd SQL_online_ide
```

#### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs on: http://localhost:8000

#### 3. Setup Frontend
```bash
cd nextjs-frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

### First Steps
1. Open http://localhost:3000
2. Click "Generate Sample Data" or "Upload CSV"
3. Write your SQL query
4. Press Ctrl+Enter to execute
5. View results in terminal panel below

---

## 📖 Documentation

### User Guides
- **[User Guide](docs/USER_GUIDE.md)** - Complete user manual
- **[Features Showcase](docs/FEATURES_SHOWCASE.md)** - Visual tour of features
- **[Quick Start](QUICKSTART.md)** - Get started in 5 minutes

### Technical Documentation
- **[Architecture](docs/DBEAVER_STYLE_REDESIGN.md)** - System design and components
- **[API Documentation](http://localhost:8000/docs)** - FastAPI interactive docs
- **[Project Summary](docs/PROJECT_SUMMARY.md)** - Overview and metrics

### Feature Documentation
- **[Session Persistence](docs/SESSION_PERSISTENCE.md)** - Auto-save with 1-hour TTL
- **[Generate Sample Data](docs/GENERATE_SAMPLE_DATA.md)** - Sample table generation
- **[Resizable Panels](docs/RESIZABLE_PANELS.md)** - Panel resize feature
- **[Delete Tables](docs/DELETE_TABLE_FEATURE.md)** - Table management

---

## 🎯 Key Features Explained

### 1. Generate Sample Data
No CSV files? No problem! Generate realistic sample tables instantly:
- **Predefined Tables**: employees, customers, products, orders, sales, users
- **Custom Tables**: Enter any name, get intelligent columns
- **Flexible Size**: 50, 100, 200, or 500 rows

### 2. Resizable Panels
Customize your workspace:
- **Left Sidebar**: Drag right edge to resize (200px - 600px)
- **Bottom Results**: Drag top edge to resize (150px - dynamic max)
- **Collapsible**: Hide panels you don't need (Ctrl+B, Ctrl+J, Ctrl+H)

### 3. Query History
Never lose a query:
- **Auto-save**: Last 50 queries saved automatically
- **Favorites**: Star important queries
- **Re-run**: Click to load and execute again
- **Persistent**: Saved in localStorage

### 4. Terminal Results
Professional output display:
- **Color-coded**: Success (green), errors (red), data types
- **Scrollable**: Handle large result sets
- **Actions**: Copy to clipboard, download CSV
- **Statistics**: Row count, column count, execution time

---

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **DuckDB**: High-performance SQL engine
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

### Frontend
- **Next.js 16**: React framework with Turbopack
- **TypeScript**: Type-safe JavaScript
- **Monaco Editor**: VS Code editor component
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: Beautiful UI components
- **Axios**: HTTP client

---

## 📁 Project Structure

```
SQL_online_ide/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   ├── routes/
│   │   ├── session.py          # Session management
│   │   ├── upload.py           # File upload & sample data
│   │   └── query.py            # Query execution
│   ├── services/
│   │   ├── session_manager.py  # Session handling
│   │   ├── csv_converter.py    # CSV to SQL conversion
│   │   ├── query_executor.py   # Query execution logic
│   │   └── sample_data_generator.py  # Sample data generation
│   └── requirements.txt
│
├── nextjs-frontend/
│   ├── app/
│   │   ├── page.tsx            # Main application page
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── database-sidebar.tsx    # Left schema explorer
│   │   ├── sql-editor.tsx          # Monaco editor wrapper
│   │   ├── terminal-results.tsx    # Bottom results panel
│   │   ├── query-history.tsx       # Right history sidebar
│   │   ├── file-upload.tsx         # CSV upload component
│   │   ├── generate-table-dialog.tsx  # Sample data dialog
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   └── utils.ts            # Utility functions
│   └── package.json
│
├── docs/                       # Documentation
├── sample_data/               # Example CSV files
└── README.md                  # This file
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run SQL query |
| `Ctrl+B` | Toggle left sidebar |
| `Ctrl+H` | Toggle query history |
| `Ctrl+J` | Toggle results panel |
| `F1` | Show help menu |

---

## 🎓 Example Workflows

### Workflow 1: Learning SQL
```
1. Click "Generate Sample Data"
2. Select "employees" (100 rows)
3. Select "orders" (200 rows)
4. Practice JOINs, GROUP BY, aggregations
5. Save favorite queries
```

### Workflow 2: Data Analysis
```
1. Upload your CSV files
2. Explore schema in left sidebar
3. Write analytical queries
4. Export results as CSV
5. Iterate and refine
```

### Workflow 3: Quick Prototyping
```
1. Generate custom table
2. Test query logic
3. Use query history to iterate
4. Export final results
```

---

## 🔧 Configuration

### Backend Configuration
Edit `backend/main.py`:
```python
# CORS settings
allow_origins=["http://localhost:3000"]

# Server settings
host="0.0.0.0"
port=8000
```

### Frontend Configuration
Edit `nextjs-frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <PID> /F

# Restart backend
python main.py
```

### Frontend Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database Issues
```bash
# Clear temp sessions
rm -rf backend/temp_sessions/*

# Restart backend
python main.py
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style
- **Python**: Follow PEP 8
- **TypeScript**: Use ESLint configuration
- **Components**: Functional components with hooks
- **Documentation**: Update docs for new features

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

**Inspired by:**
- DBeaver Community Edition
- MySQL Workbench
- DataGrip by JetBrains
- Azure Data Studio

**Built with:**
- [FastAPI](https://fastapi.tiangolo.com/)
- [DuckDB](https://duckdb.org/)
- [Next.js](https://nextjs.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Support

- **Documentation**: Check the `docs/` folder
- **Issues**: Open an issue on GitHub
- **Questions**: See FAQ in User Guide

---

## 🗺️ Roadmap

### Coming Soon
- [ ] Auto-complete for table/column names
- [ ] Multi-tab editor
- [ ] Visual query builder
- [ ] Schema ER diagrams
- [ ] Dark/Light theme toggle
- [ ] Export to multiple formats (JSON, Excel)
- [ ] Collaborative features
- [ ] Query performance analyzer

---

**Built with ❤️ for the SQL community**

**Version**: 2.3.0  
**Last Updated**: November 26, 2025  
**Status**: ✅ Production Ready
