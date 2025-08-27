# 🚂 Railway Deployment Guide for Ocean App Backend

## Prerequisites
- [Railway account](https://railway.app/)
- [Git repository](https://github.com/) with your code
- MySQL database (Railway provides this)

## Step 1: Set Up Railway Project

1. **Go to [Railway.app](https://railway.app/)**
2. **Sign up/Login** with GitHub
3. **Create New Project** → "Deploy from GitHub repo"
4. **Select your Ocean app repository**

## Step 2: Add MySQL Database

1. **In your Railway project dashboard:**
   - Click **"New"** → **"Database"** → **"MySQL"**
   - Railway will automatically create a MySQL database
   - **Copy the connection details** (you'll need these for environment variables)

## Step 3: Configure Environment Variables

1. **Go to your service** → **"Variables" tab**
2. **Add these environment variables:**

```bash
# Database Configuration (from Railway MySQL)
DB_USERNAME=your_railway_mysql_username
DB_PASSWORD=your_railway_mysql_password
DB_NAME=your_railway_database_name
DB_HOST=your_railway_mysql_host
DB_PORT=3306

# Node Environment
NODE_ENV=production
PORT=5000

# Session Secret (generate a secure random string)
SESSION_SECRET=your_very_secure_session_secret_here

# Frontend URL (update this with your actual frontend domain)
FRONTEND_URL=https://your-frontend-domain.com

# Redis (if you're using Redis)
REDIS_URL=your_redis_url

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Step 4: Deploy Your Backend

1. **Railway will automatically detect** your Node.js app
2. **Build will start automatically** when you push to GitHub
3. **Check the build logs** for any errors
4. **Your backend will be available** at: `https://your-app-name.railway.app`

## Step 5: Test Your Backend

1. **Health Check:** Visit `https://your-app-name.railway.app/health`
2. **Should return:** `{"status":"OK","timestamp":"...","uptime":...}`

## Step 6: Update Frontend Configuration

1. **Update your frontend API base URL** to point to your Railway backend
2. **Test authentication endpoints** from your frontend
3. **Verify CORS is working** between frontend and backend

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check if all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **Database Connection Errors:**
   - Double-check environment variables
   - Ensure MySQL database is running

3. **CORS Issues:**
   - Update `FRONTEND_URL` environment variable
   - Check if your frontend domain is in the CORS origins

4. **Port Issues:**
   - Railway automatically sets `PORT` environment variable
   - Your app should use `process.env.PORT`

## Next Steps

After successful deployment:
1. **Test all your API endpoints**
2. **Update your frontend** to use the new backend URL
3. **Monitor your Railway dashboard** for performance
4. **Set up custom domain** if needed

## Support

- **Railway Docs:** [docs.railway.app](https://docs.railway.app/)
- **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
- **Check build logs** in Railway dashboard for detailed error messages

---

🎉 **Your Ocean app backend is now ready for production!**
