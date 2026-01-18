const awsS3Service = require('./awsS3Service');
const cloudinaryService = require('./cloudinaryService');

/**
 * Unified video upload service
 * - Checks if AWS credentials are configured
 * - If AWS is configured → uses AWS S3
 * - If AWS is not configured → falls back to Cloudinary
 * - Returns consistent response format
 */
class VideoUploadService {
    /**
     * Upload video file
     * @param {Buffer} fileBuffer - Video file buffer
     * @param {string} folder - Folder path
     * @param {Object} options - Upload options (mimetype, etc.)
     * @returns {Promise<Object>} Upload result
     */
    async uploadVideo(fileBuffer, folder = 'ocean-app/videos', options = {}) {
        // Check if AWS is configured
        if (awsS3Service.isAwsConfigured()) {
            console.log('📹 Using AWS S3 for video upload');
            try {
                const result = await awsS3Service.uploadVideo(fileBuffer, folder, options);
                if (result.success) {
                    return result;
                } else {
                    // If AWS fails, fall back to Cloudinary
                    console.log('⚠️ AWS S3 upload failed, falling back to Cloudinary:', result.error);
                    return await this.uploadToCloudinary(fileBuffer, folder, options);
                }
            } catch (error) {
                console.error('❌ AWS S3 upload error, falling back to Cloudinary:', error.message);
                return await this.uploadToCloudinary(fileBuffer, folder, options);
            }
        } else {
            // AWS not configured, use Cloudinary
            console.log('📹 Using Cloudinary for video upload (AWS not configured)');
            return await this.uploadToCloudinary(fileBuffer, folder, options);
        }
    }

    /**
     * Upload video to Cloudinary (fallback)
     * @param {Buffer} fileBuffer - Video file buffer
     * @param {string} folder - Folder path
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    async uploadToCloudinary(fileBuffer, folder, options = {}) {
        const uploadOptions = {
            resource_type: 'video',
            quality: 'auto',
            ...options
        };

        // Add eager transformations for thumbnail if not already specified
        if (!uploadOptions.eager) {
            uploadOptions.eager = [
                {
                    format: 'jpg',
                    width: 400,
                    height: 300,
                    crop: 'fill',
                    quality: 'auto:good',
                    start_offset: '5'
                }
            ];
            uploadOptions.eager_async = true;
        }

        // Add timeout for video uploads
        if (!uploadOptions.timeout) {
            uploadOptions.timeout = 300000; // 5 minutes
        }

        return await cloudinaryService.uploadFile(fileBuffer, folder, uploadOptions);
    }

    /**
     * Delete video
     * @param {string} publicId - Public ID or S3 key
     * @param {string} url - Video URL (to determine if it's AWS or Cloudinary)
     * @returns {Promise<Object>} Deletion result
     */
    async deleteVideo(publicId, url) {
        // Check if URL is from AWS S3
        if (url && url.includes('amazonaws.com')) {
            if (awsS3Service.isAwsConfigured()) {
                console.log('🗑️ Deleting video from AWS S3');
                return await awsS3Service.deleteVideo(publicId);
            }
        }

        // Default to Cloudinary
        console.log('🗑️ Deleting video from Cloudinary');
        return await cloudinaryService.deleteFile(publicId);
    }

    /**
     * Check if AWS is configured
     * @returns {boolean}
     */
    isAwsConfigured() {
        return awsS3Service.isAwsConfigured();
    }
}

module.exports = new VideoUploadService();
