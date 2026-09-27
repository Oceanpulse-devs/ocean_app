# 🚀 Railway Database Migration Guide

## 🎯 **The Problem**
Your local database has columns like `username`, `lastActive`, etc., but your Railway production database doesn't have these columns. This is why your deployed app might not work properly.

## ✅ **The Solution**
Run the migration script to sync your Railway database with your local changes.

## 📋 **What You Need**

### 1. **Railway Database Credentials**
Make sure your `.env` file has these variables:
```env
DB_HOST=your-railway-db-host
DB_USER=your-railway-db-user
DB_PASSWORD=your-railway-db-password
DB_NAME=your-railway-db-name
DB_PORT=3306
NODE_ENV=production
```

### 2. **Migration Files**
- ✅ `migrations/add_username_lastactive_columns.sql` - Contains all the SQL commands
- ✅ `run_migration_railway.js` - Node.js script to run the migration
- ✅ `migrate_railway.bat` - Windows batch file to run everything

## 🚀 **How to Run the Migration**

### **Option 1: Windows Batch File (Easiest)**
```bash
cd ocean_server
migrate_railway.bat
```

### **Option 2: Manual Steps**
```bash
cd ocean_server
npm install mysql2
node run_migration_railway.js
```

## 📊 **What Gets Added to Your Railway Database**

### **Users Table:**
- ✅ `username` VARCHAR(50) UNIQUE - Auto-generated from email
- ✅ `lastActive` TIMESTAMP - Tracks when user was last active

### **Products Table:**
- ✅ `likes` INT DEFAULT 0 - For product likes

### **Posts Table:**
- ✅ `postSubType` ENUM('buyer', 'seller') - Buyer or seller post
- ✅ `minBudget` DECIMAL(10, 2) - Minimum budget for buyer posts
- ✅ `maxBudget` DECIMAL(10, 2) - Maximum budget for buyer posts
- ✅ `category` VARCHAR(100) - Post category
- ✅ `condition` VARCHAR(50) - Product condition

### **New Tables:**
- ✅ `user_follows` - For follow/following functionality
- ✅ `saved_products` - For saved products
- ✅ `saved_posts` - For saved posts
- ✅ `notifications` - For user notifications

## 🔍 **Verification**

After running the migration, you can verify it worked by:

1. **Check your Railway database** - You should see the new columns
2. **Test your app** - Upload forms should now work properly
3. **Check logs** - The migration script will show success messages

## 🚨 **Important Notes**

- ✅ **Safe to run multiple times** - The script handles duplicate columns gracefully
- ✅ **Backs up existing data** - No data will be lost
- ✅ **Works with existing users** - Generates usernames for existing users
- ✅ **Production ready** - All changes are compatible with your deployed app

## 🎉 **Result**

After running this migration:
- ✅ Your Railway database will have all the columns your local database has
- ✅ Your deployed app will work exactly like your local app
- ✅ All upload forms will work properly
- ✅ User profiles will display correctly
- ✅ Follow/save/notification features will work

## 🆘 **Troubleshooting**

### **Error: "ER_DUP_FIELDNAME"**
- This means the column already exists - it's safe to ignore

### **Error: "ER_TABLE_EXISTS_ERROR"**
- This means the table already exists - it's safe to ignore

### **Error: "Connection refused"**
- Check your Railway database credentials in `.env`
- Make sure your Railway database is running

### **Error: "Access denied"**
- Verify your database username and password
- Check if your Railway database allows external connections

## 📞 **Need Help?**

If you encounter any issues:
1. Check the error message in the console
2. Verify your `.env` file has correct Railway credentials
3. Make sure your Railway database is accessible
4. Run the migration script again (it's safe to run multiple times)

---

**🎯 Once this migration is complete, your Railway database will be perfectly synced with your local database, and your deployed app will work flawlessly!**
