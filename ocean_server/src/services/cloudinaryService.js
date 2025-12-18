const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

class CloudinaryService {
    constructor() {
        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }

    /**
     * Upload a single file to Cloudinary
     * @param {Buffer|string} file - File buffer or base64 string
     * @param {string} folder - Folder path in Cloudinary
     * @param {Object} options - Additional upload options
     * @returns {Promise<Object>} Upload result
     */
    async uploadFile(file, folder = 'ocean-app', options = {}) {
        try {
            const uploadOptions = {
                folder,
                resource_type: 'auto',
                quality: 'auto',
                fetch_format: 'auto',
                ...options
            };

            let uploadResult;
            
            if (Buffer.isBuffer(file)) {
                // Convert buffer to stream for Cloudinary
                const stream = Readable.from(file);
                uploadResult = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        uploadOptions,
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.pipe(uploadStream);
                });
            } else if (typeof file === 'string') {
                // Handle base64 or URL
                uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
            } else {
                throw new Error('Invalid file format. Expected Buffer or string.');
            }

            // Extract eager transformations if available (for video thumbnails)
            const eager = uploadResult.eager || [];
            
            return {
                success: true,
                publicId: uploadResult.public_id,
                url: uploadResult.secure_url,
                thumbnailUrl: eager.length > 0 
                    ? (eager[0].secure_url || eager[0].url)
                    : this.generateThumbnailUrl(uploadResult.secure_url, uploadResult.resource_type, uploadResult.public_id),
                eager: eager, // Include eager transformations in response
                format: uploadResult.format,
                resourceType: uploadResult.resource_type,
                size: uploadResult.bytes,
                width: uploadResult.width,
                height: uploadResult.height,
                duration: uploadResult.duration // for videos
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            return {
                success: false,
                error: error.message,
                errorDetails: {
                    http_code: error.http_code,
                    name: error.name
                }
            };
        }
    }

    /**
     * Upload multiple files to Cloudinary
     * @param {Array} files - Array of file buffers or strings
     * @param {string} folder - Folder path in Cloudinary
     * @param {Object} options - Additional upload options
     * @returns {Promise<Array>} Array of upload results
     */
    async uploadMultipleFiles(files, folder = 'ocean-app', options = {}) {
        try {
            const uploadPromises = files.map((file, index) => {
                const fileFolder = `${folder}/${index + 1}`;
                return this.uploadFile(file, fileFolder, options);
            });

            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error) {
            console.error('Multiple files upload error:', error);
            return files.map(() => ({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * Upload post media with specific optimizations
     * @param {Buffer|string} file - File to upload
     * @param {string} postId - Post ID for organization
     * @returns {Promise<Object>} Upload result
     */
    async uploadPostMedia(file, postId) {
        const folder = `ocean-app/posts/${postId}`;
        
        const options = {
            transformation: [
                { quality: 'auto:good', fetch_format: 'auto' },
                { width: 1200, height: 1200, crop: 'limit' }
            ],
            eager: [
                { width: 800, height: 600, crop: 'fill', quality: 'auto:good' },
                { width: 400, height: 300, crop: 'fill', quality: 'auto:good' }
            ],
            eager_async: true
        };

        return await this.uploadFile(file, folder, options);
    }

    /**
     * Upload buyer need media with specific optimizations
     * @param {Buffer|string} file - File to upload
     * @param {string} buyerNeedId - Buyer Need ID for organization
     * @returns {Promise<Object>} Upload result
     */
    async uploadBuyerNeedMedia(file, buyerNeedId) {
        const folder = `ocean-app/buyer-needs/${buyerNeedId}`;
        
        const options = {
            transformation: [
                { quality: 'auto:good', fetch_format: 'auto' },
                { width: 1200, height: 1200, crop: 'limit' }
            ],
            eager: [
                { width: 800, height: 600, crop: 'fill', quality: 'auto:good' },
                { width: 400, height: 300, crop: 'fill', quality: 'auto:good' }
            ],
            eager_async: true
        };

        return await this.uploadFile(file, folder, options);
    }

    /**
     * Upload product images with e-commerce optimizations
     * @param {Buffer|string} file - File to upload
     * @param {string} productId - Product ID for organization
     * @returns {Promise<Object>} Upload result
     */
    async uploadProductImage(file, productId) {
        const folder = `ocean-app/products/${productId}`;
        
        const options = {
            transformation: [
                { quality: 'auto:best', fetch_format: 'auto' },
                { width: 1000, height: 1000, crop: 'fill' }
            ],
            eager: [
                { width: 800, height: 800, crop: 'fill', quality: 'auto:good' },
                { width: 400, height: 400, crop: 'fill', quality: 'auto:good' },
                { width: 200, height: 200, crop: 'fill', quality: 'auto:good' }
            ],
            eager_async: true
        };

        return await this.uploadFile(file, folder, options);
    }

    /**
     * Upload AR model file (GLB) to Cloudinary
     * @param {Buffer|string} file - GLB file to upload
     * @param {string} productId - Product ID for organization
     * @returns {Promise<Object>} Upload result
     */
    async uploadARModel(file, productId) {
        const folder = `ocean-app/products/${productId}/ar-models`;
        
        const options = {
            resource_type: 'raw', // GLB files are raw files, not images
            // No transformations for 3D models
        };

        return await this.uploadFile(file, folder, options);
    }

    /**
     * Upload AR model file (GLB) for Auction
     * @param {Buffer|string} file - GLB file to upload
     * @param {string} auctionId - Auction ID for organization
     * @returns {Promise<Object>} Upload result
     */
    async uploadAuctionARModel(file, auctionId) {
        const folder = `ocean-app/auctions/${auctionId}/ar-models`;
        
        const options = {
            resource_type: 'raw', // GLB files are raw files, not images
            // No transformations for 3D models
        };

        return await this.uploadFile(file, folder, options);
    }

    /**
     * Upload AR model file (GLB) for Swap Deal
     * @param {Buffer|string} file - GLB file to upload
     * @param {string} swapDealId - Swap Deal ID for organization
     * @returns {Promise<Object>} Upload result
     */
    async uploadSwapDealARModel(file, swapDealId) {
        const folder = `ocean-app/swap-deals/${swapDealId}/ar-models`;
        
        const options = {
            resource_type: 'raw', // GLB files are raw files, not images
            // No transformations for 3D models
        };

        return await this.uploadFile(file, folder, options);
    }

    /**
     * Upload AR model file (GLB) for Group Buy
     * @param {Buffer|string} file - GLB file to upload
     * @param {string|number} groupBuyId - Group Buy ID for organization
     * @returns {Promise<Object>} Upload result
     */
    async uploadGroupBuyARModel(file, groupBuyId) {
        const folder = `ocean-app/group-buys/${groupBuyId}/ar-models`;
        
        const options = {
            resource_type: 'raw', // GLB files are raw files, not images
            // No transformations for 3D models
        };

        return await this.uploadFile(file, folder, options);
    }

    /**
     * Upload AR model file (GLB) for Distress Sale (uses Product model)
     * @param {Buffer|string} file - GLB file to upload
     * @param {string} productId - Product ID for organization
     * @returns {Promise<Object>} Upload result
     */
    async uploadDistressSaleARModel(file, productId) {
        // Distress Sale uses Product model, so reuse product AR upload
        return await this.uploadARModel(file, productId);
    }

    /**
     * Upload profile picture with face detection
     * @param {Buffer|string} file - File to upload
     * @param {string} userId - User ID for organization
     * @returns {Promise<Object>} Upload result
     */
    async uploadProfilePicture(file, userId) {
        const folder = `ocean-app/profiles/${userId}`;
        
        const options = {
            transformation: [
                { quality: 'auto:good', fetch_format: 'auto' },
                { width: 400, height: 400, crop: 'fill', gravity: 'face' }
            ],
            eager: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto:good' },
                { width: 100, height: 100, crop: 'fill', gravity: 'face', quality: 'auto:good' }
            ],
            eager_async: true
        };

        return await this.uploadFile(file, folder, options);
    }

    /**
     * Upload seller verification documents
     * @param {Buffer|string} file - File to upload
     * @param {string} sellerId - Seller ID for organization
     * @param {string} documentType - Type of document (NIN, ElectricBill, IDCard, etc.)
     * @returns {Promise<Object>} Upload result
     */
    async uploadSellerDocument(file, sellerId, documentType) {
        const folder = `ocean-app/seller-verification/${sellerId}/${documentType}`;
        
        const options = {
            transformation: [
                { quality: 'auto:best', fetch_format: 'auto' },
                { width: 1200, height: 1200, crop: 'limit' } // Keep aspect ratio
            ],
            eager: [
                { width: 800, height: 600, crop: 'fill', quality: 'auto:good' },
                { width: 400, height: 300, crop: 'fill', quality: 'auto:good' }
            ],
            eager_async: true
        };

        return await this.uploadFile(file, folder, options);
    }

    /**
     * Generate thumbnail URL for videos (fallback method)
     * @param {string} originalUrl - Original Cloudinary URL
     * @param {string} resourceType - Resource type (image/video)
     * @param {string} publicId - Cloudinary public ID (optional, for better URL generation)
     * @returns {string} Thumbnail URL
     */
    generateThumbnailUrl(originalUrl, resourceType, publicId = null) {
        if (resourceType === 'video') {
            // Generate video thumbnail by extracting frame at 5 seconds
            // Transformation: so_5 = start offset 5 seconds, convert to JPG
            if (publicId) {
                // Use Cloudinary URL helper for more reliable thumbnail generation
                return cloudinary.url(publicId, {
                    resource_type: 'video',
                    transformation: [
                        { start_offset: '5' }, // Extract frame at 5 seconds
                        { width: 400, height: 300, crop: 'fill', format: 'jpg', quality: 'auto:good' }
                    ]
                });
            }
            // Fallback: use URL manipulation (less reliable but works)
            return originalUrl.replace('/upload/', '/upload/so_5,w_400,h_300,c_fill,f_jpg,q_auto:good/');
        }
        // For images, return an optimized version
        return originalUrl.replace('/upload/', '/upload/w_400,h_300,c_fill,q_auto:good/');
    }

    /**
     * Delete file from Cloudinary
     * @param {string} publicId - Public ID of the file to delete
     * @returns {Promise<Object>} Deletion result
     */
    async deleteFile(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return {
                success: true,
                result
            };
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get file information from Cloudinary
     * @param {string} publicId - Public ID of the file
     * @returns {Promise<Object>} File information
     */
    async getFileInfo(publicId) {
        try {
            const result = await cloudinary.api.resource(publicId);
            return {
                success: true,
                info: result
            };
        } catch (error) {
            console.error('Cloudinary get info error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new CloudinaryService();

