@echo off
echo 🚀 Starting Railway Database Migration
echo ======================================

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found. Please create one with your Railway database credentials.
    pause
    exit /b 1
)

REM Install mysql2 if not already installed
echo 📦 Installing mysql2 dependency...
npm install mysql2

REM Run the migration
echo ⏳ Running migration...
node run_migration_railway.js

echo ✅ Migration script completed!
echo.
echo 📋 What was added to your Railway database:
echo    • username column to users table
echo    • lastActive column to users table
echo    • likes column to products table
echo    • postSubType, minBudget, maxBudget, category, condition columns to posts table
echo    • user_follows table
echo    • saved_products table
echo    • saved_posts table
echo    • notifications table
echo.
echo 🎉 Your Railway database is now synced with your local changes!
pause
