# ✨ Generate Sample Data Feature

## Overview
Users can now generate realistic sample tables without needing CSV files. Simply type a table name and get 50-500 rows of realistic data instantly!

---

## 🎯 Features

### **Generate Sample Data Button**
- **Location**: Top toolbar, between "Upload CSV" and "History"
- **Icon**: Sparkles (✨)
- **Opens**: Dialog with predefined tables and custom options

### **Predefined Tables**
Ready-to-use tables with realistic data:

1. **employees** - Employee records with names, departments, salaries
2. **customers** - Customer data with contact information  
3. **products** - Product catalog with pricing
4. **orders** - Order transactions
5. **sales** - Sales transactions with revenue data
6. **users** - User accounts and profiles

### **Custom Tables**
- Enter any table name
- System generates appropriate columns and data
- Intelligent data generation based on name

### **Row Count Options**
Choose how many rows to generate:
- 50 rows (default)
- 100 rows
- 200 rows
- 500 rows

---

## 🚀 How to Use

### Method 1: Predefined Tables
1. Click **"Generate Sample Data"** button in toolbar
2. Choose number of rows (50, 100, 200, or 500)
3. Click on any **predefined table card**
4. Table is generated and appears in sidebar
5. Start querying immediately!

### Method 2: Custom Table
1. Click **"Generate Sample Data"** button
2. Choose number of rows
3. Enter custom table name (e.g., "transactions", "inventory")
4. Click **"Generate"** button
5. Table created with intelligent column structure

### Visual Flow
```
[Generate Sample Data] Button
        ↓
   Dialog Opens
        ↓
Select: [50] [100] [200] [500] rows
        ↓
Choose Predefined OR Enter Custom
        ↓
   Click Generate
        ↓
Table appears in sidebar!
```

---

## 📊 Predefined Table Details

### 1. **employees**
**Columns:**
- `id` (INTEGER) - Employee ID
- `name` (VARCHAR) - Full name
- `email` (VARCHAR) - Email address
- `department` (VARCHAR) - Department name
- `salary` (DOUBLE) - Annual salary
- `hire_date` (DATE) - Date hired
- `manager_id` (INTEGER) - Manager's employee ID

**Sample Data:**
- Realistic names from name pool
- Valid email format
- Departments: Engineering, Sales, Marketing, HR, Finance, etc.
- Salaries: $40,000 - $150,000
- Hire dates: Last 10 years
- Hierarchical manager relationships

### 2. **customers**
**Columns:**
- `id` (INTEGER)
- `name` (VARCHAR)
- `email` (VARCHAR)
- `phone` (VARCHAR)
- `address` (VARCHAR)
- `city` (VARCHAR)
- `country` (VARCHAR)
- `created_at` (TIMESTAMP)

**Sample Data:**
- US phone format: +1-XXX-XXX-XXXX
- Major cities: New York, Los Angeles, Chicago, etc.
- Multiple countries: USA, Canada, UK, Germany, etc.
- Created dates: Last 2 years

### 3. **products**
**Columns:**
- `id` (INTEGER)
- `name` (VARCHAR)
- `description` (VARCHAR)
- `price` (DOUBLE)
- `category` (VARCHAR)
- `stock` (INTEGER)
- `created_at` (TIMESTAMP)

**Sample Data:**
- Product names: Laptop Pro, Phone Plus, etc.
- Prices: $10 - $2,000
- Categories: Electronics, Clothing, Food, Books, etc.
- Stock levels: 0 - 500 units

### 4. **orders**
**Columns:**
- `id` (INTEGER)
- `customer_id` (INTEGER)
- `order_date` (DATE)
- `total_amount` (DOUBLE)
- `status` (VARCHAR)
- `shipping_address` (VARCHAR)

**Sample Data:**
- Order dates: Last year
- Amounts: $10 - $1,000
- Statuses: pending, processing, shipped, delivered, cancelled
- Realistic shipping addresses

### 5. **sales**
**Columns:**
- `id` (INTEGER)
- `product_id` (INTEGER)
- `quantity` (INTEGER)
- `price` (DOUBLE)
- `sale_date` (DATE)
- `customer_id` (INTEGER)
- `revenue` (DOUBLE)

**Sample Data:**
- Quantities: 1 - 20 units
- Prices: $10 - $500
- Revenue: quantity × price
- Sales dates: Last year
- Foreign keys to customers and products

### 6. **users**
**Columns:**
- `id` (INTEGER)
- `username` (VARCHAR)
- `email` (VARCHAR)
- `created_at` (TIMESTAMP)
- `last_login` (TIMESTAMP)
- `is_active` (BOOLEAN)
- `role` (VARCHAR)

**Sample Data:**
- Usernames: firstname_lastname123
- Email format: username@example.com
- 75% active users
- Roles: admin, user, moderator, guest
- Recent login times

---

## 🎨 Dialog Interface

### Layout
```
┌─────────────────────────────────────────────┐
│ ✨ Generate Sample Table                    │
│ Choose a predefined table or enter custom   │
├─────────────────────────────────────────────┤
│ Number of Rows:                             │
│ [50] [100] [200] [500]                      │
│                                             │
│ Predefined Tables:                          │
│ ┌──────────────┐ ┌──────────────┐          │
│ │ 📊 employees │ │ 👥 customers │          │
│ │ 7 cols       │ │ 8 cols       │          │
│ └──────────────┘ └──────────────┘          │
│                                             │
│ Or Enter Custom Table Name:                 │
│ [transactions_______________] [Generate]    │
└─────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Frontend Components

#### GenerateTableDialog Component
```typescript
interface GenerateTableDialogProps {
    onGenerate: (tableName: string, rowCount: number) => Promise<void>
}

// Predefined table templates
const SAMPLE_TABLES = [
    {
        name: 'employees',
        description: 'Employee records...',
        columns: ['id', 'name', 'email', ...]
    },
    // ... more templates
]
```

#### API Integration
```typescript
// lib/api.ts
generateSampleTable: async (sessionId, tableName, rowCount) => {
    const response = await api.post('/upload/generate-sample', {
        session_id: sessionId,
        table_name: tableName,
        row_count: rowCount,
    })
    return response.data
}
```

### Backend Implementation

#### Sample Data Generator Service
```python
class SampleDataGenerator:
    """Generate realistic sample data"""
    
    TEMPLATES = {
        'employees': {
            'columns': [...],
            'generator': 'generate_employees'
        },
        # ... more templates
    }
    
    def generate_table(self, conn, table_name, row_count):
        # Generate data based on template or generic
        # Create table in DuckDB
        # Return table info
```

#### API Endpoint
```python
@router.post("/generate-sample")
async def generate_sample_table(request: GenerateSampleRequest):
    # Validate session
    # Generate sample data
    # Create table
    # Return schema
```

---

## 💡 Use Cases

### 1. Learning SQL
```
Generate: employees (100 rows)
Practice: SELECT, WHERE, GROUP BY, JOIN
No CSV needed!
```

### 2. Testing Queries
```
Generate: orders (200 rows) + customers (100 rows)
Test: Complex JOINs and aggregations
Realistic data for testing
```

### 3. Demonstrations
```
Generate: sales (500 rows)
Demo: Dashboard queries, analytics
Professional-looking data
```

### 4. Quick Prototyping
```
Generate: Custom "inventory" table
Prototype: New query logic
Iterate quickly
```

---

## 🎯 Benefits

### For Users
1. **No CSV Required**: Start querying immediately
2. **Realistic Data**: Professional-quality sample data
3. **Multiple Options**: Predefined or custom tables
4. **Flexible Size**: Choose row count
5. **Instant Generation**: No upload time

### For Learning
1. **Practice SQL**: Learn without finding datasets
2. **Test Queries**: Experiment safely
3. **Understand Schemas**: See realistic table structures
4. **Try JOINs**: Multiple related tables available

### For Development
1. **Quick Testing**: No data preparation needed
2. **Consistent Data**: Same structure every time
3. **Scalable**: Generate 50-500 rows
4. **Reproducible**: Same templates available

---

## 🔮 Future Enhancements

### Planned Features
1. **More Templates**: Add 10+ more predefined tables
2. **Custom Columns**: Specify exact column structure
3. **Relationships**: Auto-create foreign keys between tables
4. **Data Patterns**: Choose data distribution (normal, uniform, etc.)
5. **Import from Schema**: Generate data from SQL schema
6. **Save Templates**: Create and save custom templates
7. **Bulk Generate**: Create multiple tables at once
8. **Export Templates**: Share table templates

### Advanced Options
1. **Seed Control**: Reproducible random data
2. **Constraints**: Add CHECK constraints
3. **Indexes**: Auto-create indexes
4. **Views**: Generate sample views
5. **Triggers**: Add sample triggers

---

## 📝 Example Queries

### After Generating employees + orders
```sql
-- Find top earning employees
SELECT name, department, salary
FROM employees
ORDER BY salary DESC
LIMIT 10;

-- Department statistics
SELECT department, 
       COUNT(*) as employee_count,
       AVG(salary) as avg_salary
FROM employees
GROUP BY department;

-- Manager hierarchy
SELECT e.name as employee,
       m.name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

### After Generating customers + orders
```sql
-- Customer order history
SELECT c.name, 
       COUNT(o.id) as order_count,
       SUM(o.total_amount) as total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.name
ORDER BY total_spent DESC;
```

---

## ⚠️ Limitations

### Current Limitations
1. **Fixed Templates**: Only 6 predefined tables
2. **No Relationships**: Foreign keys not enforced
3. **Random Data**: Not based on real datasets
4. **English Only**: Names and data in English
5. **Max 500 Rows**: Limited to prevent performance issues

### Workarounds
1. **Generate Multiple**: Create several tables and JOIN
2. **Modify After**: Use UPDATE queries to adjust data
3. **Upload CSV**: For specific data needs
4. **Combine Methods**: Mix generated and uploaded tables

---

## 🎓 Tips & Tricks

### Quick Start
1. Click "Generate Sample Data"
2. Keep default 50 rows
3. Click "employees"
4. Start querying!

### For Learning
1. Generate employees (100 rows)
2. Generate orders (200 rows)
3. Practice JOINs between them
4. Try GROUP BY and aggregations

### For Testing
1. Generate multiple related tables
2. Test complex queries
3. Verify query logic
4. Check performance

### Best Practices
1. **Start Small**: Use 50 rows for testing
2. **Scale Up**: Increase to 500 for performance testing
3. **Use Templates**: Predefined tables have better relationships
4. **Name Clearly**: Custom tables should have descriptive names

---

**Last Updated**: November 25, 2025  
**Version**: 2.3.0  
**Status**: ✅ Complete & Working


