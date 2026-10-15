const awsS3Service = require('./awsS3Service');
const cloudinaryService = require('./cloudinaryService');
const r2StorageService = require('./r2StorageService');
const videoCompressionService = require('./videoCompressionService');

/**
 * Unified video upload service
 * - If STORAGE_PROVIDER=r2: Uses Cloudflare R2
 * - Otherwise: Uses Cloudinary as primary (auto thumbnails, video processing)
 * - If Cloudinary fails → falls back to AWS S3 (if configured)
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
        const provider = (process.env.STORAGE_PROVIDER || 'cloudinary').trim().toLowerCase();
        const isR2 = provider === 'r2' || provider === 'rs';
        
        if (isR2 && r2StorageService.isR2Configured()) {
            console.log('📹 Using Cloudflare R2 for video upload');

            // 1. Optimize video buffer with faststart/compression if large
            let processedBuffer = fileBuffer;
            try {
                if (fileBuffer.length > 8 * 1024 * 1024) {
                    console.log('📹 Video exceeds 8MB, applying smart compression...');
                    processedBuffer = await videoCompressionService.compressVideoSmart(fileBuffer, 25);
                }
            } catch (vErr) {
                console.warn('⚠️ Video compression warning, uploading original buffer:', vErr.message);
                processedBuffer = fileBuffer;
            }

            // 2. Extract a poster thumbnail frame
            let posterUrl = null;
            try {
                const posterBuffer = await videoCompressionService.generateThumbnail(processedBuffer);
                if (posterBuffer) {
                    const posterResult = await r2StorageService.uploadFile(posterBuffer, `${folder}/posters`, {
                        contentType: 'image/webp',
                        resource_type: 'image'
                    });
                    if (posterResult && posterResult.success) {
                        posterUrl = posterResult.url;
                        console.log('✅ Generated video poster thumbnail on R2:', posterUrl);
                    }
                }
            } catch (pErr) {
                console.warn('⚠️ Video poster extraction warning:', pErr.message);
            }

            // 3. Upload video to R2
            const result = await r2StorageService.uploadFile(processedBuffer, folder, {
                resource_type: 'video',
                mimetype: options.mimetype || 'video/mp4',
                cacheControl: 'public, max-age=31536000, immutable',
                ...options
            });

            if (result.success) {
                if (posterUrl) {
                    result.thumbnailUrl = posterUrl;
                }
                return result;
            }
            console.warn('⚠️ R2 video upload failed, attempting fallback:', result.error);
        }

        // Try Cloudinary (primary for non-R2 - has auto thumbnails and video processing)
        console.log('📹 Using Cloudinary for video upload');
        try {
            const result = await this.uploadToCloudinary(fileBuffer, folder, options);
            if (result.success) {
                return result;
            } else {
                // If Cloudinary fails and AWS is configured, try AWS as backup
                if (awsS3Service.isAwsConfigured()) {
                    console.log('⚠️ Cloudinary upload failed, falling back to AWS S3:', result.error);
                    return await awsS3Service.uploadVideo(fileBuffer, folder, options);
                } else {
                    // No backup available
                    return result;
                }
            }
        } catch (error) {
            console.error('❌ Cloudinary upload error:', error.message);
            // If Cloudinary fails and AWS is configured, try AWS as backup
            if (awsS3Service.isAwsConfigured()) {
                console.log('⚠️ Falling back to AWS S3 after Cloudinary error');
                try {
                    return await awsS3Service.uploadVideo(fileBuffer, folder, options);
                } catch (awsError) {
                    console.error('❌ AWS S3 backup also failed:', awsError.message);
                    return {
                        success: false,
                        error: `Both Cloudinary and AWS S3 failed: ${error.message}`
                    };
                }
            } else {
                // No backup available
                return {
                    success: false,
                    error: error.message
                };
            }
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
        // Check if URL is from Cloudflare R2
        if (url && (url.includes('r2.cloudflarestorage.com') || (process.env.CLOUDFLARE_R2_PUBLIC_URL && url.includes(process.env.CLOUDFLARE_R2_PUBLIC_URL)))) {
            if (r2StorageService.isR2Configured()) {
                console.log('🗑️ Deleting video from Cloudflare R2');
                return await r2StorageService.deleteFile(publicId);
            }
        }

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
