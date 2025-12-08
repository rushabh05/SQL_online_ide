# 📖 SQL Workspace - User Guide

## Quick Start

### 1. Upload Your Data
Click **"Upload CSV"** in the top toolbar to load your data files.

### 2. Explore Your Schema
Use the **left sidebar** to browse tables and columns:
- Click a table name to expand and see its columns
- View row counts and data types
- Color-coded types: 🔵 Numbers, 🟢 Text, 🟣 Dates, 🟡 Boolean

### 3. Write SQL Queries
Use the **center editor** to write your SQL:
- Syntax highlighting for SQL keywords
- Auto-indentation and formatting
- Sample queries available in dropdown

### 4. Execute & View Results
- Press **Ctrl+Enter** or click **"Run"** button
- Results appear in **terminal panel** at bottom
- View execution time and row counts

---

## Interface Overview

```
┌─────────────────────────────────────────────────────────────┐
│ [SQL Workspace] [Connected] [2 Tables] | [Upload] [History] │
├────────┬────────────────────────────────────┬───────────────┤
│        │                                    │               │
│ Schema │  SQL Editor                        │  Query        │
│ Tree   │  - Write queries here              │  History      │
│        │  - Syntax highlighting             │  (optional)   │
│ Tables │  - Press Ctrl+Enter to run         │               │
│ └─Col1 │                                    │  - Recent     │
│ └─Col2 ├────────────────────────────────────┤  - Favorites  │
│        │  Terminal Results                  │               │
│        │  $ Query executed successfully     │               │
│        │  [Results table here]              │               │
└────────┴────────────────────────────────────┴───────────────┘
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Enter** | Run current SQL query |
| **Ctrl+B** | Toggle schema sidebar |
| **Ctrl+H** | Toggle query history |
| **Ctrl+J** | Toggle results panel |
| **F1** | Show help & shortcuts |

> **Tip**: On Mac, use **Cmd** instead of **Ctrl**

---

## Features

### 🗂️ Schema Explorer (Left Sidebar)

**What it does:**
- Shows all uploaded tables
- Displays columns with data types
- Shows row counts for each table

**How to use:**
1. Click table name to expand
2. View all columns and their types
3. Click collapse icon (◀) to minimize sidebar

**Tips:**
- Hover over items for full names
- Color-coded types help identify data
- Footer shows total statistics

---

### ✍️ SQL Editor (Center)

**What it does:**
- Write and edit SQL queries
- Syntax highlighting
- Line numbers and formatting

**How to use:**
1. Type your SQL query
2. Use **Sample Queries** dropdown for templates
3. Press **Ctrl+Enter** to execute
4. Click **Explain** to see query plan
5. Click **Download** to export results

**Sample Queries:**
- Select All
- Count Rows
- Group By Aggregate
- INNER/LEFT JOIN examples

**Tips:**
- Queries are auto-saved to history
- Use **Clear** (🗑️) to reset editor
- Editor remembers your last query

---

### 💻 Terminal Results (Bottom Panel)

**What it does:**
- Displays query results in terminal style
- Shows success/error messages
- Provides execution statistics

**How to use:**
1. Results appear automatically after running query
2. Scroll through large result sets
3. Click **Copy** (📋) to copy data
4. Click **Download** (💾) to export CSV
5. Click **Maximize** (⬜) for larger view
6. Click **Collapse** (▼) to hide panel

**Status Indicators:**
- ✅ **SUCCESS**: Query executed successfully
- ❌ **ERROR**: Query failed (see error message)
- 🔵 **PLAN**: Execution plan displayed

**Tips:**
- Results are color-coded by data type
- NULL values shown in gray
- Hover over cells to see full content

---

### 📜 Query History (Right Sidebar)

**What it does:**
- Saves last 50 queries automatically
- Lets you favorite important queries
- Shows success/failure status

**How to use:**
1. Click **History** button to open
2. Click query to expand details
3. Click **⭐** to mark as favorite
4. Click **▶️ Run Again** to execute
5. Click **📋** to copy query
6. Click **🗑️** to delete from history

**Organization:**
- **⭐ Favorites**: Starred queries at top
- **🕐 Recent**: All other queries below

**Tips:**
- History persists across sessions
- Failed queries marked with ❌
- Shows execution time for each query
- Click **Clear All** to reset history

---

## Common Tasks

### Upload Multiple CSV Files
1. Click **"Upload CSV"**
2. Select first file → Upload
3. Repeat for additional files
4. All tables appear in schema sidebar

### Join Multiple Tables
```sql
SELECT 
  t1.column1,
  t2.column2
FROM table1 AS t1
INNER JOIN table2 AS t2
  ON t1.id = t2.table1_id
LIMIT 100;
```

### Filter and Sort Data
```sql
SELECT * 
FROM your_table
WHERE column_name = 'value'
ORDER BY another_column DESC
LIMIT 50;
```

### Aggregate Data
```sql
SELECT 
  category,
  COUNT(*) as count,
  AVG(price) as avg_price
FROM products
GROUP BY category
ORDER BY count DESC;
```

### Save Favorite Queries
1. Run your query
2. Open **History** (Ctrl+H)
3. Find your query
4. Click **⭐** to favorite
5. Access anytime from Favorites section

---

## Tips & Tricks

### Maximize Screen Space
- Collapse sidebar (Ctrl+B) when not needed
- Collapse results (Ctrl+J) while writing queries
- Close history panel when not in use
- Use maximize button on results for better view

### Work Efficiently
- Use **Ctrl+Enter** instead of clicking Run
- Keep favorite queries starred for quick access
- Use sample queries as starting templates
- Check execution time to optimize queries

### Troubleshooting
- **Query fails?** Check error message in red terminal output
- **No results?** Verify table names in schema sidebar
- **Slow query?** Use LIMIT to reduce result size
- **Lost query?** Check history panel (Ctrl+H)

### Best Practices
- Start with `LIMIT 10` when exploring new tables
- Use `SELECT *` sparingly on large tables
- Name your columns clearly in GROUP BY queries
- Test JOINs on small datasets first

---

## Data Types Reference

### Numeric Types
- **INTEGER**: Whole numbers (1, 42, -5)
- **BIGINT**: Large whole numbers
- **DOUBLE**: Decimal numbers (3.14, -0.5)

### Text Types
- **VARCHAR**: Variable-length text
- **TEXT**: Long text content

### Date/Time Types
- **DATE**: Date only (2024-01-15)
- **TIMESTAMP**: Date and time
- **TIME**: Time only

### Other Types
- **BOOLEAN**: True/False values

---

## FAQ

**Q: Where is my data stored?**
A: Data is stored temporarily in your session. Upload CSV files each time you start.

**Q: Can I save my queries?**
A: Yes! Use the favorites feature (⭐) in query history.

**Q: How many tables can I upload?**
A: No hard limit, but performance may vary with very large datasets.

**Q: Can I edit uploaded data?**
A: No, data is read-only. Use SQL queries to transform and analyze.

**Q: What SQL dialect is supported?**
A: DuckDB SQL (similar to PostgreSQL with some extensions).

**Q: Can I export results?**
A: Yes! Click Download button to export as CSV.

**Q: Is my data private?**
A: Yes, data is session-based and not permanently stored.

---

## Need Help?

1. Press **F1** or click **Help** menu for keyboard shortcuts
2. Check **Sample Queries** dropdown for examples
3. Review error messages in terminal for debugging
4. Consult full documentation in `docs/` folder

---

**Happy Querying! 🚀**

