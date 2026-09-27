# 🚀 Railway Universal Categories Migration

This migration updates your Railway MySQL database to support the new universal category system with custom user categories.

## 📋 What This Migration Does

### ✅ Database Changes:
- Adds `isCustom` field to distinguish system vs user-created categories
- Adds `createdBy` field to track who created custom categories  
- Adds `usageCount` field to track category popularity
- Adds proper foreign key constraints and indexes

### ✅ New Universal Categories (11 total):
1. **Tech** 📱 - Technology, electronics, software, and digital products
2. **Fashion** 👗 - Clothing, shoes, accessories, and style items  
3. **Home & Living** 🏠 - Furniture, home decor, appliances, and household items
4. **Automotive** 🚗 - Cars, motorcycles, auto parts, and vehicle accessories
5. **Sports & Fitness** ⚽ - Sports equipment, fitness gear, and athletic apparel
6. **Books & Education** 📚 - Books, educational materials, courses, and learning resources
7. **Health & Beauty** 💄 - Health products, beauty items, and wellness equipment
8. **Entertainment** 🎮 - Games, toys, collectibles, and entertainment items
9. **Jewelry & Watches** 💍 - Jewelry, watches, and luxury accessories
10. **Art & Collectibles** 🎨 - Artwork, antiques, rare items, and collectibles
11. **Other** ➕ - Custom categories and miscellaneous items

## 🚀 How to Run the Migration

### Option 1: Direct Node.js (Recommended)
```bash
cd ocean_server
node railway-universal-categories-migration.js
```

### Option 2: Using the Runner Script
```bash
cd ocean_server
node run-railway-migration.js
```

### Option 3: With npm (if you add the script)
```bash
cd ocean_server
npm run railway-migration
```

## 🔧 Prerequisites

Make sure you have the required dependencies:
```bash
npm install mysql2
```

## 📡 Database Connection

The migration connects to your Railway MySQL database:
- **Host**: yamabiko.proxy.rlwy.net
- **Port**: 37286
- **Database**: railway
- **User**: root

## ⚠️ Important Notes

### 🔒 Safety Features:
- **Idempotent**: Safe to run multiple times
- **Conditional**: Only adds columns/indexes if they don't exist
- **Backup**: Consider backing up your database before running

### 🗑️ Data Changes:
- **Clears existing categories**: All old categories will be deleted
- **Replaces with universal**: New universal categories will be inserted
- **Preserves products**: Product data remains unchanged

## 📊 What You'll See

The migration will show:
1. ✅ Connection confirmation
2. 📝 Migration progress
3. 🔍 Verification of new categories
4. 📋 List of all created categories

## 🎯 After Migration

### Phase 2: Backend API Updates
1. Update `productController.js` to use new categories
2. Add custom category creation endpoints
3. Update all controllers that use categories
4. Test the new system

### Phase 3: Frontend Updates
1. Update category selection UI
2. Add "Create Custom Category" option
3. Update all forms that use categories

## 🆘 Troubleshooting

### Common Issues:
- **Connection Error**: Check Railway database credentials
- **Permission Error**: Ensure database user has ALTER privileges
- **Column Exists**: Migration is idempotent, safe to re-run

### Getting Help:
- Check the console output for detailed error messages
- Verify your Railway database is accessible
- Ensure you have the latest migration files

## 🎉 Success!

After successful migration, you'll have:
- ✅ 11 universal categories ready to use
- ✅ Support for custom user categories
- ✅ Proper database structure for the new system
- ✅ Ready for Phase 2 (Backend API updates)

---

**Ready to migrate? Run:** `node railway-universal-categories-migration.js`
