const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class AwsS3Service {
    constructor() {
        // Check if AWS credentials are configured
        this.isConfigured = !!(
            process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY &&
            process.env.AWS_S3_BUCKET &&
            process.env.AWS_REGION
        );

        if (this.isConfigured) {
            this.s3Client = new S3Client({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                }
            });
            this.bucketName = process.env.AWS_S3_BUCKET;
            this.region = process.env.AWS_REGION || 'us-east-1';
            console.log('✅ AWS S3 service initialized');
        } else {
            console.log('⚠️ AWS S3 credentials not configured, service will not be available');
        }
    }

    /**
     * Upload video to S3
     * @param {Buffer} fileBuffer - Video file buffer
     * @param {string} folder - Folder path in S3 (e.g., 'ocean-app/videos/userId')
     * @param {Object} options - Additional options (mimetype, etc.)
     * @returns {Promise<Object>} Upload result matching Cloudinary format
     */
    async uploadVideo(fileBuffer, folder = 'ocean-app/videos', options = {}) {
        if (!this.isConfigured) {
            throw new Error('AWS S3 is not configured');
        }

        try {
            // Generate unique filename
            const fileExtension = this.getFileExtension(options.mimetype || 'video/mp4');
            const fileName = `${uuidv4()}.${fileExtension}`;
            const key = folder ? `${folder}/${fileName}` : fileName;

            // Upload to S3
            const uploadCommand = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: options.mimetype || 'video/mp4',
                CacheControl: 'max-age=31536000' // Cache for 1 year
            });

            await this.s3Client.send(uploadCommand);

            // Generate public URL
            const videoUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
            
            // For thumbnails, we'll use a placeholder or generate one later
            // For now, return the video URL as thumbnail (can be improved with Lambda/FFmpeg)
            const thumbnailUrl = videoUrl; // TODO: Generate actual thumbnail

            return {
                success: true,
                publicId: key, // Use S3 key as publicId equivalent
                url: videoUrl,
                thumbnailUrl: thumbnailUrl,
                format: fileExtension,
                resourceType: 'video',
                size: fileBuffer.length,
                duration: null // Duration would need to be extracted separately
            };
        } catch (error) {
            console.error('AWS S3 upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete video from S3
     * @param {string} key - S3 key (publicId equivalent)
     * @returns {Promise<Object>} Deletion result
     */
    async deleteVideo(key) {
        if (!this.isConfigured) {
            throw new Error('AWS S3 is not configured');
        }

        try {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            await this.s3Client.send(deleteCommand);

            return {
                success: true
            };
        } catch (error) {
            console.error('AWS S3 delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get file extension from mimetype
     * @param {string} mimetype - MIME type
     * @returns {string} File extension
     */
    getFileExtension(mimetype) {
        const extensions = {
            'video/mp4': 'mp4',
            'video/quicktime': 'mov',
            'video/x-msvideo': 'avi',
            'video/webm': 'webm',
            'video/ogg': 'ogg',
            'video/x-matroska': 'mkv'
        };
        return extensions[mimetype] || 'mp4';
    }

    /**
     * Check if AWS S3 is configured
     * @returns {boolean}
     */
    isAwsConfigured() {
        return this.isConfigured;
    }
}

module.exports = new AwsS3Service();
