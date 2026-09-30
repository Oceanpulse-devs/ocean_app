const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Cloudflare R2 Object Storage Service
 * Provides high-speed, zero-egress-fee object storage compatible with AWS S3 API.
 * Matches CloudinaryService method signatures for seamless drop-in switching.
 */
class R2StorageService {
    constructor() {
        this.accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
        this.secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
        this.accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
        this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bluewhale-media';
        this.endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || 
            (this.accountId ? `https://${this.accountId}.r2.cloudflarestorage.com` : null);
        this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || null;

        this.isConfigured = !!(
            this.accessKeyId &&
            this.secretAccessKey &&
            this.bucketName &&
            this.endpoint
        );

        if (this.isConfigured) {
            this.s3Client = new S3Client({
                region: 'auto',
                endpoint: this.endpoint,
                credentials: {
                    accessKeyId: this.accessKeyId,
                    secretAccessKey: this.secretAccessKey
                }
            });
            console.log(`✅ Cloudflare R2 service initialized (Bucket: ${this.bucketName})`);
            if (this.publicUrl) {
                console.log(`🌐 Cloudflare R2 Public CDN / Domain: ${this.publicUrl}`);
            }
        } else {
            console.log('⚠️ Cloudflare R2 credentials incomplete, service will not be available');
        }
    }

    /**
     * Check if R2 is configured and ready
     * @returns {boolean}
     */
    isR2Configured() {
        return this.isConfigured;
    }

    /**
     * Construct the public access URL for a given object key
     * @param {string} key - Object key in bucket
     * @returns {string} Public URL
     */
    getPublicUrl(key) {
        if (this.publicUrl) {
            return `${this.publicUrl.replace(/\/+$/, '')}/${key}`;
        }
        // Fallback: direct R2 bucket endpoint format
        return `${this.endpoint.replace(/\/+$/, '')}/${this.bucketName}/${key}`;
    }

    /**
     * Detect MIME type from buffer magic numbers or filename
     * @param {Buffer} buffer - File buffer
     * @param {string} [filename=''] - Optional filename
     * @returns {string} Detected MIME type
     */
    detectMimeType(buffer, filename = '') {
        if (filename) {
            const ext = path.extname(filename).toLowerCase();
            const extMap = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.glb': 'model/gltf-binary',
                '.gltf': 'model/gltf+json',
                '.mp4': 'video/mp4',
                '.mov': 'video/quicktime',
                '.avi': 'video/x-msvideo',
                '.webm': 'video/webm',
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            };
            if (extMap[ext]) return extMap[ext];
        }

        if (buffer && buffer.length >= 4) {
            // Check magic bytes
            const hex = buffer.slice(0, 12).toString('hex').toLowerCase();
            if (hex.startsWith('ffd8ff')) return 'image/jpeg';
            if (hex.startsWith('89504e47')) return 'image/png';
            if (hex.startsWith('47494638')) return 'image/gif';
            if (hex.startsWith('52494646') && buffer.slice(8, 12).toString() === 'WEBP') return 'image/webp';
            if (hex.startsWith('25504446')) return 'application/pdf';
            if (hex.startsWith('46546c67')) return 'model/gltf-binary'; // glTF binary
            if (hex.startsWith('1a45dfa3')) return 'video/webm';
            // MP4 commonly has ftyp box at bytes 4..8
            if (buffer.length > 8 && buffer.slice(4, 8).toString() === 'ftyp') return 'video/mp4';
        }

        return 'application/octet-stream';
    }

    /**
     * Map MIME type to file extension
     * @param {string} mimeType
     * @returns {string} File extension without leading dot
     */
    getExtension(mimeType) {
        const mimeMap = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/svg+xml': 'svg',
            'model/gltf-binary': 'glb',
            'model/gltf+json': 'gltf',
            'video/mp4': 'mp4',
            'video/quicktime': 'mov',
            'video/webm': 'webm',
            'video/x-msvideo': 'avi',
            'application/pdf': 'pdf'
        };
        return mimeMap[mimeType] || 'bin';
    }

    /**
     * Parse input file (Buffer, base64 data URI, raw base64, or file path) into a Buffer
     * @param {Buffer|string} file
     * @returns {{ buffer: Buffer, mime: string|null }}
     */
    parseFile(file) {
        if (Buffer.isBuffer(file)) {
            return { buffer: file, mime: null };
        }

        if (typeof file === 'string') {
            // Check for data URI (e.g. data:image/jpeg;base64,...)
            const dataUriMatch = file.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
            if (dataUriMatch) {
                return {
                    buffer: Buffer.from(dataUriMatch[2], 'base64'),
                    mime: dataUriMatch[1]
                };
            }

            // Check if it's an existing file path on disk
            try {
                if (fs.existsSync(file)) {
                    return {
                        buffer: fs.readFileSync(file),
                        mime: null
                    };
                }
            } catch (e) {
                // Not a valid path, continue
            }

            // Assume base64 string
            return {
                buffer: Buffer.from(file, 'base64'),
                mime: null
            };
        }

        throw new Error('Invalid file format. Expected Buffer or string.');
    }

    /**
     * Upload a single file to Cloudflare R2
     * @param {Buffer|string} file - File buffer or base64 string
     * @param {string} folder - Folder path in bucket
     * @param {Object} options - Additional upload options
     * @returns {Promise<Object>} Upload result matching Cloudinary format
     */
    async uploadFile(file, folder = 'ocean-app', options = {}) {
        if (!this.isConfigured) {
            return {
                success: false,
                error: 'Cloudflare R2 is not configured'
            };
        }

        try {
            const { buffer, mime: parsedMime } = this.parseFile(file);

            // Determine content type
            let contentType = options.contentType || options.mimetype || parsedMime;
            if (!contentType || contentType === 'application/octet-stream') {
                contentType = this.detectMimeType(buffer, options.filename || options.originalname || '');
            }

            // Raw AR 3D model detection
            if (options.resource_type === 'raw' && (folder.includes('ar-models') || options.extension === 'glb')) {
                contentType = 'model/gltf-binary';
            }

            const fileExtension = options.extension || this.getExtension(contentType);

            // Build unique key
            const cleanFolder = (folder || 'ocean-app').replace(/^\/+|\/+$/g, '');
            const fileBaseName = options.public_id 
                ? (options.public_id.includes('.') ? options.public_id : `${options.public_id}.${fileExtension}`)
                : `${uuidv4()}.${fileExtension}`;
            
            const key = options.keepFolderInPublicId === false 
                ? fileBaseName 
                : `${cleanFolder}/${fileBaseName}`;

            // Send to Cloudflare R2
            const putCommand = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: options.cacheControl || 'public, max-age=31536000, immutable'
            });

            await this.s3Client.send(putCommand);

            const publicUrl = this.getPublicUrl(key);

            // Extract image dimensions if sharp can parse it
            let width = null;
            let height = null;
            let format = fileExtension;

            if (contentType.startsWith('image/') && !contentType.includes('svg')) {
                try {
                    const metadata = await sharp(buffer).metadata();
                    width = metadata.width || null;
                    height = metadata.height || null;
                    format = metadata.format || fileExtension;
                } catch (sharpError) {
                    // Non-fatal if sharp cannot read dimensions
                }
            }

            const resourceType = options.resource_type || (
                contentType.startsWith('video/') ? 'video' :
                contentType.startsWith('image/') ? 'image' : 'raw'
            );

            return {
                success: true,
                publicId: key,
                url: publicUrl,
                thumbnailUrl: publicUrl,
                format: format,
                resourceType: resourceType,
                size: buffer.length,
                width: width,
                height: height,
                duration: null
            };
        } catch (error) {
            console.error('Cloudflare R2 upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Upload multiple files to R2
     * @param {Array} files - Array of file buffers or strings
     * @param {string} folder - Folder path in R2
     * @param {Object} options - Additional upload options
     * @returns {Promise<Array>} Array of upload results
     */
    async uploadMultipleFiles(files, folder = 'ocean-app', options = {}) {
        try {
            const uploadPromises = files.map((file, index) => {
                const fileFolder = `${folder}/${index + 1}`;
                return this.uploadFile(file, fileFolder, options);
            });
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Multiple files upload error in R2:', error);
            return files.map(() => ({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * Upload post media
     * @param {Buffer|string} file
     * @param {string} postId
     * @returns {Promise<Object>}
     */
    async uploadPostMedia(file, postId) {
        const folder = `ocean-app/posts/${postId}`;
        return await this.uploadFile(file, folder, { resource_type: 'auto' });
    }

    /**
     * Upload buyer need media
     * @param {Buffer|string} file
     * @param {string} buyerNeedId
     * @returns {Promise<Object>}
     */
    async uploadBuyerNeedMedia(file, buyerNeedId) {
        const folder = `ocean-app/buyer-needs/${buyerNeedId}`;
        return await this.uploadFile(file, folder, { resource_type: 'auto' });
    }

    /**
     * Upload product image
     * @param {Buffer|string} file
     * @param {string} productId
     * @returns {Promise<Object>}
     */
    async uploadProductImage(file, productId) {
        const folder = `ocean-app/products/${productId}`;
        return await this.uploadFile(file, folder, { resource_type: 'image' });
    }

    /**
     * Upload AR model file (GLB)
     * @param {Buffer|string} file
     * @param {string} productId
     * @returns {Promise<Object>}
     */
    async uploadARModel(file, productId) {
        const folder = `ocean-app/products/${productId}/ar-models`;
        return await this.uploadFile(file, folder, {
            resource_type: 'raw',
            extension: 'glb',
            contentType: 'model/gltf-binary'
        });
    }

    /**
     * Upload AR model for Auction
     * @param {Buffer|string} file
     * @param {string} auctionId
     * @returns {Promise<Object>}
     */
    async uploadAuctionARModel(file, auctionId) {
        const folder = `ocean-app/auctions/${auctionId}/ar-models`;
        return await this.uploadFile(file, folder, {
            resource_type: 'raw',
            extension: 'glb',
            contentType: 'model/gltf-binary'
        });
    }

    /**
     * Upload AR model for Swap Deal
     * @param {Buffer|string} file
     * @param {string} swapDealId
     * @returns {Promise<Object>}
     */
    async uploadSwapDealARModel(file, swapDealId) {
        const folder = `ocean-app/swap-deals/${swapDealId}/ar-models`;
        return await this.uploadFile(file, folder, {
            resource_type: 'raw',
            extension: 'glb',
            contentType: 'model/gltf-binary'
        });
    }

    /**
     * Upload AR model for Group Buy
     * @param {Buffer|string} file
     * @param {string|number} groupBuyId
     * @returns {Promise<Object>}
     */
    async uploadGroupBuyARModel(file, groupBuyId) {
        const folder = `ocean-app/group-buys/${groupBuyId}/ar-models`;
        return await this.uploadFile(file, folder, {
            resource_type: 'raw',
            extension: 'glb',
            contentType: 'model/gltf-binary'
        });
    }

    /**
     * Upload AR model for Distress Sale
     * @param {Buffer|string} file
     * @param {string} productId
     * @returns {Promise<Object>}
     */
    async uploadDistressSaleARModel(file, productId) {
        return await this.uploadARModel(file, productId);
    }

    /**
     * Upload profile picture
     * @param {Buffer|string} file
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    async uploadProfilePicture(file, userId) {
        const folder = `ocean-app/profiles/${userId}`;
        return await this.uploadFile(file, folder, { resource_type: 'image' });
    }

    /**
     * Upload seller verification document
     * @param {Buffer|string} file
     * @param {string} sellerId
     * @param {string} documentType
     * @returns {Promise<Object>}
     */
    async uploadSellerDocument(file, sellerId, documentType) {
        const folder = `ocean-app/seller-verification/${sellerId}/${documentType}`;
        return await this.uploadFile(file, folder);
    }

    /**
     * Generate thumbnail URL
     * @param {string} originalUrl
     * @param {string} resourceType
     * @param {string} [publicId=null]
     * @returns {string}
     */
    generateThumbnailUrl(originalUrl, resourceType, publicId = null) {
        return originalUrl;
    }

    /**
     * Delete file from Cloudflare R2
     * @param {string} publicId - Object key in bucket
     * @returns {Promise<Object>}
     */
    async deleteFile(publicId) {
        if (!this.isConfigured) {
            return { success: false, error: 'Cloudflare R2 is not configured' };
        }

        try {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: publicId
            });

            await this.s3Client.send(deleteCommand);
            return {
                success: true,
                result: 'ok'
            };
        } catch (error) {
            console.error('Cloudflare R2 delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get file metadata from Cloudflare R2
     * @param {string} publicId - Object key in bucket
     * @returns {Promise<Object>}
     */
    async getFileInfo(publicId) {
        if (!this.isConfigured) {
            return { success: false, error: 'Cloudflare R2 is not configured' };
        }

        try {
            const headCommand = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: publicId
            });

            const result = await this.s3Client.send(headCommand);
            return {
                success: true,
                info: {
                    public_id: publicId,
                    bytes: result.ContentLength,
                    content_type: result.ContentType,
                    etag: result.ETag,
                    last_modified: result.LastModified
                }
            };
        } catch (error) {
            console.error('Cloudflare R2 get info error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new R2StorageService();
