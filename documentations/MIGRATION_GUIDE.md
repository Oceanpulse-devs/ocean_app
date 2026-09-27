# 🚀 Database Migration Guide

## 📋 **Migration System Overview**

This project uses a proper migration system to keep your Railway database in sync with your local database.

## 📁 **Migration Files Location**

All migration files are stored in: `ocean_server/migrations/`

## 🔧 **How to Create a New Migration**

### **Step 1: Create Migration File**
Create a new file in the `migrations` folder with this naming convention:
```
YYYY-MM-DD-description-of-changes.sql
```

Example: `2024-01-20-add-user-preferences.sql`

### **Step 2: Write Migration SQL**
Use the template in `migrations/TEMPLATE.sql`:

```sql
-- Migration: Add user preferences
-- Date: 2024-01-20
-- Description: Add user preferences table

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    theme VARCHAR(50) DEFAULT 'light',
    notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### **Step 3: Run Migration**
```bash
cd ocean_server
node run_migrations.js
```

## 🚀 **Migration Commands**

### **Run All Migrations**
```bash
node run_migrations.js
```

### **Run with Batch File**
```bash
migrate_railway.bat
```

## 📊 **Migration Tracking**

The system automatically tracks which migrations have been run using a `migrations` table in your database.

## ✅ **Best Practices**

1. **Always create migration files** when adding/removing columns or tables
2. **Use descriptive filenames** with dates
3. **Test migrations locally** before running on Railway
4. **Never edit existing migration files** - create new ones instead
5. **Use IF NOT EXISTS** for table creation
6. **Handle reserved keywords** with backticks (e.g., `condition`)

## 🚨 **Important Notes**

- ✅ **Migration files are version controlled** - commit them to Git
- ✅ **Migrations are idempotent** - safe to run multiple times
- ✅ **Railway database** will be automatically synced
- ✅ **Local and production** databases stay in sync

## 📝 **Example Migration Files**

### **Adding Columns**
```sql
-- Add new columns to existing table
ALTER TABLE users ADD COLUMN lastLogin TIMESTAMP NULL;
ALTER TABLE products ADD COLUMN views INT DEFAULT 0;
```

### **Creating Tables**
```sql
-- Create new table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### **Updating Data**
```sql
-- Update existing data
UPDATE users SET status = 'active' WHERE status IS NULL;
```

## 🎯 **Workflow**

1. **Make changes locally** (add columns, create tables, etc.)
2. **Create migration file** in `migrations/` folder
3. **Test migration locally** (optional)
4. **Run migration on Railway** using `node run_migrations.js`
5. **Commit migration file** to Git
6. **Deploy updated code** to Railway

---

**🎉 This system ensures your Railway database is always in sync with your local development!**


