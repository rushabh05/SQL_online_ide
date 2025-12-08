# 🎓 SQL Playground - Quick Start Guide

Welcome to the Online SQL Playground! This guide will help you get started with uploading CSV files and practicing SQL queries.

## 📋 Table of Contents
1. [Getting Started](#getting-started)
2. [Uploading CSV Files](#uploading-csv-files)
3. [Writing SQL Queries](#writing-sql-queries)
4. [Understanding Results](#understanding-results)
5. [Sample Queries](#sample-queries)
6. [Tips & Best Practices](#tips--best-practices)

## 🚀 Getting Started

### Step 1: Start the Application

**Backend Server:**
```bash
cd backend
python main.py
```
✅ Backend runs on: http://localhost:8000

**Frontend Application:**
```bash
cd frontend
npm run dev
```
✅ Frontend runs on: http://localhost:5173

### Step 2: Open Your Browser
Navigate to `http://localhost:5173` - You should see the SQL Playground interface with:
- File upload area on the left
- SQL editor in the center
- Results panel below

## 📤 Uploading CSV Files

### Method 1: Drag and Drop
1. Drag your CSV file onto the upload dropzone
2. Wait for the upload and conversion to complete
3. View the table schema in the sidebar

### Method 2: Click to Browse
1. Click on the upload dropzone
2. Select your CSV file from the file picker
3. Wait for processing

### What Happens After Upload?
- CSV is converted to a SQL table
- Column types are automatically detected
- Table schema is displayed
- Preview of first 100 rows is available

### Sample Data
We've included `sample_data.csv` with employee data:
- **id**: Employee ID (INTEGER)
- **name**: Employee name (VARCHAR)
- **age**: Age (INTEGER)
- **city**: City location (VARCHAR)
- **salary**: Annual salary (INTEGER)

## ✍️ Writing SQL Queries

### Basic SELECT Query
```sql
-- View all data (limited to 10 rows)
SELECT * FROM sample_data LIMIT 10;
```

### Filtering with WHERE
```sql
-- Find employees in specific cities
SELECT name, city, salary
FROM sample_data
WHERE city IN ('New York', 'San Francisco')
ORDER BY salary DESC;
```

### Aggregations
```sql
-- Average salary by city
SELECT 
  city,
  COUNT(*) as employee_count,
  AVG(salary) as avg_salary,
  MAX(salary) as max_salary
FROM sample_data
GROUP BY city
ORDER BY avg_salary DESC;
```

### JOINs (with multiple tables)
First upload two CSV files, then:
```sql
-- Join two tables
SELECT 
  t1.name,
  t1.city,
  t2.department
FROM employees AS t1
INNER JOIN departments AS t2
  ON t1.dept_id = t2.id;
```

## 📊 Understanding Results

### Successful Query
✅ **Green checkmark** indicates success
- **Row count**: Number of rows returned
- **Execution time**: How long the query took
- **Results table**: Scrollable data grid

### Query Errors
❌ **Red error** indicates a problem
- **Error message**: Description of what went wrong
- **Suggestions**: How to fix the issue

### Result Limits
⚠️ **Warning badge** appears when:
- Results exceed 10,000 rows (automatically limited)
- Add `LIMIT` clause to control output size

## 🎯 Sample Queries

### 1. Count Rows
```sql
SELECT COUNT(*) as total_employees
FROM sample_data;
```

### 2. Top Earners
```sql
SELECT name, salary
FROM sample_data
ORDER BY salary DESC
LIMIT 5;
```

### 3. Age Groups
```sql
SELECT 
  CASE 
    WHEN age < 30 THEN 'Under 30'
    WHEN age BETWEEN 30 AND 40 THEN '30-40'
    ELSE 'Over 40'
  END as age_group,
  COUNT(*) as count,
  AVG(salary) as avg_salary
FROM sample_data
GROUP BY age_group;
```

### 4. City Statistics
```sql
SELECT 
  city,
  COUNT(*) as employees,
  MIN(age) as youngest,
  MAX(age) as oldest,
  ROUND(AVG(salary), 2) as avg_salary
FROM sample_data
GROUP BY city
HAVING COUNT(*) > 0
ORDER BY avg_salary DESC;
```

### 5. Salary Ranges
```sql
SELECT 
  name,
  salary,
  CASE 
    WHEN salary < 70000 THEN 'Entry Level'
    WHEN salary BETWEEN 70000 AND 90000 THEN 'Mid Level'
    ELSE 'Senior Level'
  END as level
FROM sample_data
ORDER BY salary;
```

## 💡 Tips & Best Practices

### Performance Tips
1. **Use LIMIT** - Always limit results for large tables
2. **WHERE before GROUP BY** - Filter early to reduce processing
3. **Index-friendly queries** - Use WHERE on indexed columns
4. **Avoid SELECT *** - Select only needed columns

### Writing Better Queries
1. **Use meaningful aliases** - `SELECT name AS employee_name`
2. **Comment your SQL** - `-- This finds top performers`
3. **Format for readability** - Use line breaks and indentation
4. **Test incrementally** - Start simple, then add complexity

### Common Patterns

#### Find Duplicates
```sql
SELECT name, COUNT(*) as occurrences
FROM sample_data
GROUP BY name
HAVING COUNT(*) > 1;
```

#### Percentile Calculation
```sql
SELECT 
  name,
  salary,
  PERCENT_RANK() OVER (ORDER BY salary) * 100 as percentile
FROM sample_data;
```

#### Running Totals
```sql
SELECT 
  name,
  salary,
  SUM(salary) OVER (ORDER BY salary) as running_total
FROM sample_data;
```

## 🔍 Query Explanation

Click **"🔍 Explain"** to see:
- Query execution plan
- Estimated rows scanned
- Join strategies
- Index usage

Example:
```sql
-- Click Explain to see how DuckDB optimizes this
SELECT city, AVG(salary)
FROM sample_data
WHERE age > 30
GROUP BY city;
```

## 💾 Downloading Results

1. Write your query
2. Click **"⬇️ Download CSV"**
3. Results are saved as `query_results.csv`

Perfect for:
- Sharing analysis with colleagues
- Creating reports
- Further processing in Excel

## ⚠️ Security & Limits

### What's Allowed
✅ SELECT queries
✅ WITH (Common Table Expressions)
✅ JOINs, WHERE, GROUP BY, ORDER BY
✅ Window functions
✅ EXPLAIN commands

### What's Blocked
❌ INSERT, UPDATE, DELETE
❌ CREATE, DROP, ALTER
❌ File operations (COPY, ATTACH)
❌ System commands

### Resource Limits
- **File size**: Max 50 MB per CSV
- **Query timeout**: 10 seconds
- **Max results**: 10,000 rows
- **Memory**: 512 MB per session
- **Rate limit**: 10 queries per minute

## 🎨 Keyboard Shortcuts

**In SQL Editor:**
- `Ctrl + /` - Comment/uncomment line
- `Ctrl + Enter` - Run query (custom shortcut)
- `Ctrl + F` - Find in editor
- `Ctrl + H` - Find and replace
- `Alt + Up/Down` - Move line up/down

## 🐛 Troubleshooting

### "Table not found" Error
**Problem**: Table doesn't exist
**Solution**: Upload CSV file first, check table name in schema panel

### "Session not found" Error
**Problem**: Session expired (24 hours max)
**Solution**: Refresh page to create new session

### Query Timeout
**Problem**: Query takes too long (>10 seconds)
**Solution**: 
- Add WHERE clause to filter data
- Use LIMIT to reduce results
- Simplify joins

### Upload Failed
**Problem**: CSV file won't upload
**Solution**:
- Check file size (<50 MB)
- Ensure .csv extension
- Verify CSV is properly formatted
- Try a smaller file first

## 📚 Learning Resources

### SQL Basics
- Start with SELECT, WHERE, ORDER BY
- Practice filtering and sorting
- Learn aggregations (COUNT, AVG, SUM)

### Intermediate
- Master JOINs (INNER, LEFT, RIGHT)
- Use GROUP BY with HAVING
- Try subqueries and CTEs

### Advanced
- Window functions (ROW_NUMBER, RANK)
- Complex aggregations
- Query optimization

## 🎉 Example Workflow

1. **Upload Data**
   - Drag `sample_data.csv` to upload area
   - View schema in sidebar

2. **Explore Data**
   ```sql
   SELECT * FROM sample_data LIMIT 5;
   ```

3. **Analyze**
   ```sql
   SELECT city, AVG(salary) as avg_salary
   FROM sample_data
   GROUP BY city;
   ```

4. **Refine**
   ```sql
   SELECT city, AVG(salary) as avg_salary
   FROM sample_data
   WHERE age > 30
   GROUP BY city
   HAVING AVG(salary) > 75000
   ORDER BY avg_salary DESC;
   ```

5. **Download**
   - Click "Download CSV"
   - Share results

## 🚀 Next Steps

- Upload your own CSV files
- Try the sample queries
- Experiment with joins across multiple tables
- Practice SQL concepts
- Build complex analytical queries

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.

**Happy Querying! 🎯**
