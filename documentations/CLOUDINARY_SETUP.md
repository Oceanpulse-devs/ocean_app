# Cloudinary Setup Guide

## Required Environment Variables

You need to create a `.env` file in the `ocean_server` directory with the following variables:

```env
# Database Configuration
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASSWORD=password
DB_NAME=railway
DB_PORT=3306

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

## How to Get Cloudinary Credentials

1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Go to your Dashboard
4. Copy the following from your Dashboard:
   - Cloud Name
   - API Key
   - API Secret

## Why This is Needed

The image upload functionality requires Cloudinary to:
- Store images in the cloud
- Generate optimized URLs
- Provide thumbnail versions
- Handle image transformations

Without these environment variables, the `cloudinaryService.uploadPostMedia()` function will fail, and images won't be uploaded or saved to the database.

## Current Issue

The backend is currently failing to upload images because:
1. No `.env` file exists
2. Cloudinary environment variables are not set
3. `cloudinaryService.uploadPostMedia()` returns `{ success: false, error: "..." }`
4. Images are not saved to the database
5. Home feed shows no images

## Solution

Create the `.env` file with your Cloudinary credentials, and the image upload will work immediately.