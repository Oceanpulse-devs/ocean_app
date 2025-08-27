# Cloudinary Setup Guide for Ocean App

## 1. Install Dependencies

First, install the Cloudinary package:

```bash
npm install cloudinary
```

## 2. Environment Variables

Add these environment variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 3. Get Cloudinary Credentials

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to your Dashboard
3. Copy your:
   - Cloud Name
   - API Key
   - API Secret

## 4. Update Multer Configuration

Make sure your multer configuration is set to use memory storage for Cloudinary:

```javascript
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});
```

## 5. Usage Examples

### Upload Post Media
```javascript
const cloudinaryService = require('../services/cloudinaryService');

// In your controller
const uploadResult = await cloudinaryService.uploadPostMedia(file.buffer, postId);
```

### Upload Product Images
```javascript
const uploadResult = await cloudinaryService.uploadProductImage(file.buffer, productId);
```

### Upload Profile Picture
```javascript
const uploadResult = await cloudinaryService.uploadProfilePicture(file.buffer, userId);
```

## 6. Features

The Cloudinary service provides:

- **Automatic Optimization**: Images and videos are automatically optimized
- **Multiple Formats**: Automatic format conversion (WebP, AVIF)
- **Responsive Images**: Multiple sizes for different devices
- **Video Support**: Video compression and thumbnail generation
- **Organized Storage**: Files are organized in folders by type and ID
- **Error Handling**: Comprehensive error handling and validation

## 7. File Structure in Cloudinary

```
ocean-app/
├── posts/
│   └── {postId}/
│       ├── 1/
│       ├── 2/
│       └── ...
├── products/
│   └── {productId}/
│       ├── 1/
│       ├── 2/
│       └── ...
└── profiles/
    └── {userId}/
        └── profile.jpg
```

## 8. Benefits

- **Performance**: Global CDN with 200+ locations
- **Cost-Effective**: Generous free tier (25GB storage + 25GB bandwidth/month)
- **Automatic Optimization**: No manual image processing needed
- **Scalable**: Handles high traffic and large file uploads
- **Developer Friendly**: Simple API and comprehensive documentation

## 9. Troubleshooting

### Common Issues:

1. **Upload Fails**: Check your API credentials and cloud name
2. **File Too Large**: Increase the file size limit in multer
3. **Invalid File Type**: Check the file filter in multer configuration
4. **Memory Issues**: Ensure multer is using memory storage

### Error Messages:

- `Missing required fields`: Check environment variables
- `Invalid file format`: Verify file type validation
- `Upload failed`: Check Cloudinary service status and credentials

## 10. Security Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **File Validation**: Always validate file types and sizes
3. **Access Control**: Implement proper authentication for uploads
4. **Rate Limiting**: Consider implementing upload rate limiting
5. **File Scanning**: Consider virus scanning for uploaded files

