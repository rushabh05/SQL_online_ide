"""
Sample data generator for creating realistic test tables
"""
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
import duckdb

class SampleDataGenerator:
    """Generate realistic sample data based on table name"""
    
    # Predefined table templates
    TEMPLATES = {
        'employees': {
            'columns': [
                ('id', 'INTEGER'),
                ('name', 'VARCHAR'),
                ('email', 'VARCHAR'),
                ('department', 'VARCHAR'),
                ('salary', 'DOUBLE'),
                ('hire_date', 'DATE'),
                ('manager_id', 'INTEGER'),
            ],
            'generator': 'generate_employees'
        },
        'customers': {
            'columns': [
                ('id', 'INTEGER'),
                ('name', 'VARCHAR'),
                ('email', 'VARCHAR'),
                ('phone', 'VARCHAR'),
                ('address', 'VARCHAR'),
                ('city', 'VARCHAR'),
                ('country', 'VARCHAR'),
                ('created_at', 'TIMESTAMP'),
            ],
            'generator': 'generate_customers'
        },
        'products': {
            'columns': [
                ('id', 'INTEGER'),
                ('name', 'VARCHAR'),
                ('description', 'VARCHAR'),
                ('price', 'DOUBLE'),
                ('category', 'VARCHAR'),
                ('stock', 'INTEGER'),
                ('created_at', 'TIMESTAMP'),
            ],
            'generator': 'generate_products'
        },
        'orders': {
            'columns': [
                ('id', 'INTEGER'),
                ('customer_id', 'INTEGER'),
                ('order_date', 'DATE'),
                ('total_amount', 'DOUBLE'),
                ('status', 'VARCHAR'),
                ('shipping_address', 'VARCHAR'),
            ],
            'generator': 'generate_orders'
        },
        'sales': {
            'columns': [
                ('id', 'INTEGER'),
                ('product_id', 'INTEGER'),
                ('quantity', 'INTEGER'),
                ('price', 'DOUBLE'),
                ('sale_date', 'DATE'),
                ('customer_id', 'INTEGER'),
                ('revenue', 'DOUBLE'),
            ],
            'generator': 'generate_sales'
        },
        'users': {
            'columns': [
                ('id', 'INTEGER'),
                ('username', 'VARCHAR'),
                ('email', 'VARCHAR'),
                ('created_at', 'TIMESTAMP'),
                ('last_login', 'TIMESTAMP'),
                ('is_active', 'BOOLEAN'),
                ('role', 'VARCHAR'),
            ],
            'generator': 'generate_users'
        },
    }
    
    # Sample data pools
    FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary',
                   'William', 'Patricia', 'Richard', 'Jennifer', 'Thomas', 'Linda', 'Charles', 'Barbara']
    LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
                  'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor']
    DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'IT', 'Customer Support']
    CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego']
    COUNTRIES = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Spain', 'Italy', 'Australia']
    CATEGORIES = ['Electronics', 'Clothing', 'Food', 'Books', 'Toys', 'Sports', 'Home', 'Garden']
    STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    ROLES = ['admin', 'user', 'moderator', 'guest']
    
    def generate_table(self, conn: duckdb.DuckDBPyConnection, table_name: str, row_count: int) -> Dict[str, Any]:
        """
        Generate a sample table with realistic data
        
        Args:
            conn: DuckDB connection
            table_name: Name of the table to create
            row_count: Number of rows to generate
            
        Returns:
            Table information dictionary
        """
        # Check if we have a template for this table
        template = self.TEMPLATES.get(table_name.lower())
        
        if template:
            # Use predefined template
            columns = template['columns']
            generator_method = getattr(self, template['generator'])
            data = generator_method(row_count)
        else:
            # Generate generic table
            columns, data = self.generate_generic_table(table_name, row_count)
        
        # Create table
        self._create_table(conn, table_name, columns, data)
        
        # Get table info
        return self._get_table_info(conn, table_name)
    
    def generate_employees(self, count: int) -> List[tuple]:
        """Generate employee data"""
        data = []
        for i in range(1, count + 1):
            name = f"{random.choice(self.FIRST_NAMES)} {random.choice(self.LAST_NAMES)}"
            email = f"{name.lower().replace(' ', '.')}@company.com"
            department = random.choice(self.DEPARTMENTS)
            salary = round(random.uniform(40000, 150000), 2)
            hire_date = (datetime.now() - timedelta(days=random.randint(0, 3650))).date()
            manager_id = random.randint(1, max(1, i // 5)) if i > 1 else None
            data.append((i, name, email, department, salary, hire_date, manager_id))
        return data
    
    def generate_customers(self, count: int) -> List[tuple]:
        """Generate customer data"""
        data = []
        for i in range(1, count + 1):
            name = f"{random.choice(self.FIRST_NAMES)} {random.choice(self.LAST_NAMES)}"
            email = f"{name.lower().replace(' ', '.')}@email.com"
            phone = f"+1-{random.randint(200, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            address = f"{random.randint(100, 9999)} Main St"
            city = random.choice(self.CITIES)
            country = random.choice(self.COUNTRIES)
            created_at = datetime.now() - timedelta(days=random.randint(0, 730))
            data.append((i, name, email, phone, address, city, country, created_at))
        return data
    
    def generate_products(self, count: int) -> List[tuple]:
        """Generate product data"""
        products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 'Headphones', 'Camera',
                   'Shirt', 'Pants', 'Shoes', 'Jacket', 'Book', 'Toy', 'Game', 'Tool']
        data = []
        for i in range(1, count + 1):
            name = f"{random.choice(products)} {random.choice(['Pro', 'Plus', 'Max', 'Ultra', 'Basic'])}"
            description = f"High quality {name.lower()} with great features"
            price = round(random.uniform(10, 2000), 2)
            category = random.choice(self.CATEGORIES)
            stock = random.randint(0, 500)
            created_at = datetime.now() - timedelta(days=random.randint(0, 365))
            data.append((i, name, description, price, category, stock, created_at))
        return data
    
    def generate_orders(self, count: int) -> List[tuple]:
        """Generate order data"""
        data = []
        for i in range(1, count + 1):
            customer_id = random.randint(1, max(1, count // 2))
            order_date = (datetime.now() - timedelta(days=random.randint(0, 365))).date()
            total_amount = round(random.uniform(10, 1000), 2)
            status = random.choice(self.STATUSES)
            shipping_address = f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Elm', 'Pine'])} St, {random.choice(self.CITIES)}"
            data.append((i, customer_id, order_date, total_amount, status, shipping_address))
        return data
    
    def generate_sales(self, count: int) -> List[tuple]:
        """Generate sales data"""
        data = []
        for i in range(1, count + 1):
            product_id = random.randint(1, 100)
            quantity = random.randint(1, 20)
            price = round(random.uniform(10, 500), 2)
            sale_date = (datetime.now() - timedelta(days=random.randint(0, 365))).date()
            customer_id = random.randint(1, max(1, count // 2))
            revenue = round(quantity * price, 2)
            data.append((i, product_id, quantity, price, sale_date, customer_id, revenue))
        return data
    
    def generate_users(self, count: int) -> List[tuple]:
        """Generate user data"""
        data = []
        for i in range(1, count + 1):
            first_name = random.choice(self.FIRST_NAMES).lower()
            last_name = random.choice(self.LAST_NAMES).lower()
            username = f"{first_name}_{last_name}{random.randint(1, 999)}"
            email = f"{username}@example.com"
            created_at = datetime.now() - timedelta(days=random.randint(0, 730))
            last_login = datetime.now() - timedelta(days=random.randint(0, 30))
            is_active = random.choice([True, True, True, False])  # 75% active
            role = random.choice(self.ROLES)
            data.append((i, username, email, created_at, last_login, is_active, role))
        return data
    
    def generate_generic_table(self, table_name: str, count: int) -> tuple:
        """Generate a generic table based on name"""
        # Create basic columns
        columns = [
            ('id', 'INTEGER'),
            ('name', 'VARCHAR'),
            ('value', 'DOUBLE'),
            ('category', 'VARCHAR'),
            ('created_at', 'TIMESTAMP'),
            ('is_active', 'BOOLEAN'),
        ]
        
        data = []
        for i in range(1, count + 1):
            name = f"{table_name.title()} {i}"
            value = round(random.uniform(1, 1000), 2)
            category = random.choice(self.CATEGORIES)
            created_at = datetime.now() - timedelta(days=random.randint(0, 365))
            is_active = random.choice([True, False])
            data.append((i, name, value, category, created_at, is_active))
        
        return columns, data
    
    def _create_table(self, conn: duckdb.DuckDBPyConnection, table_name: str, columns: List[tuple], data: List[tuple]):
        """Create table and insert data"""
        # Create table schema
        column_defs = ', '.join([f"{name} {dtype}" for name, dtype in columns])
        create_sql = f"CREATE TABLE {table_name} ({column_defs})"
        conn.execute(create_sql)
        
        # Insert data
        placeholders = ', '.join(['?' for _ in columns])
        insert_sql = f"INSERT INTO {table_name} VALUES ({placeholders})"
        conn.executemany(insert_sql, data)
    
    def _get_table_info(self, conn: duckdb.DuckDBPyConnection, table_name: str) -> Dict[str, Any]:
        """Get table information"""
        # Get column info
        result = conn.execute(f"DESCRIBE {table_name}").fetchall()
        columns = [{'name': row[0], 'type': row[1]} for row in result]
        
        # Get row count
        row_count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        
        # Get preview data as list of dictionaries
        preview_result = conn.execute(f"SELECT * FROM {table_name} LIMIT 5").fetchall()
        column_names = [col['name'] for col in columns]
        preview_data = [
            {col_name: value for col_name, value in zip(column_names, row)}
            for row in preview_result
        ]
        
        return {
            'table_name': table_name,
            'row_count': row_count,
            'columns': columns,
            'preview_data': preview_data
        }


