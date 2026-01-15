const sharp = require('sharp');

/**
 * Image Compression Service
 * Compresses images before upload to reduce file size and improve upload speed
 * Similar to videoCompressionService but for images using Sharp
 */
class ImageCompressionService {
    /**
     * Get image metadata (width, height, format, size)
     * @param {Buffer} imageBuffer - Image file buffer
     * @returns {Promise<{width: number, height: number, format: string, size: number}>}
     */
    async getImageInfo(imageBuffer) {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            return {
                width: metadata.width || 0,
                height: metadata.height || 0,
                format: metadata.format || 'unknown',
                size: imageBuffer.length
            };
        } catch (error) {
            console.error('Error getting image info:', error);
            throw error;
        }
    }

    /**
     * Smart compression - only compress if image is large enough to benefit
     * @param {Buffer} imageBuffer - Image file buffer
     * @param {Object} options - Compression options
     * @param {number} options.maxWidth - Maximum width (default: 1920)
     * @param {number} options.maxHeight - Maximum height (default: 1920)
     * @param {number} options.quality - JPEG/WebP quality 1-100 (default: 85)
     * @param {boolean} options.convertToWebP - Convert to WebP if beneficial (default: true)
     * @param {number} options.minSizeKB - Minimum size in KB to compress (default: 150)
     * @returns {Promise<Buffer>} Compressed image buffer (or original if already optimized)
     */
    async compressImageSmart(imageBuffer, options = {}) {
        try {
            const originalSizeKB = imageBuffer.length / 1024;
            const minSizeToCompress = options.minSizeKB || 150; // Only compress if > 150KB

            // If image is already small, return original
            if (originalSizeKB < minSizeToCompress) {
                console.log(`✅ Image already small (${originalSizeKB.toFixed(2)}KB), no compression needed`);
                return imageBuffer;
            }

            const {
                maxWidth = 1920,
                maxHeight = 1920,
                quality = 85,
                convertToWebP = true
            } = options;

            // Get original image info
            const originalInfo = await this.getImageInfo(imageBuffer);
            const originalSizeKB2 = originalInfo.size / 1024;
            
            console.log(`📸 Compressing image: ${originalInfo.width}x${originalInfo.height}, ${originalSizeKB2.toFixed(2)}KB, format: ${originalInfo.format}`);

            // Start with sharp pipeline
            let pipeline = sharp(imageBuffer);

            // Resize if needed (maintain aspect ratio)
            const needsResize = originalInfo.width > maxWidth || originalInfo.height > maxHeight;
            if (needsResize) {
                pipeline = pipeline.resize(maxWidth, maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
                console.log(`📸 Resizing to max ${maxWidth}x${maxHeight} (maintaining aspect ratio)`);
            }

            // Determine output format
            const shouldUseWebP = convertToWebP && 
                (originalInfo.format === 'jpeg' || originalInfo.format === 'jpg' || originalInfo.format === 'png');
            
            let outputFormat = originalInfo.format;
            if (shouldUseWebP) {
                outputFormat = 'webp';
                console.log(`📸 Converting to WebP for better compression`);
            }

            // Compress based on format
            let compressedBuffer;
            
            if (outputFormat === 'webp') {
                compressedBuffer = await pipeline
                    .webp({ 
                        quality: quality,
                        effort: 4 // Balance between compression time and file size (0-6)
                    })
                    .toBuffer();
            } else if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
                compressedBuffer = await pipeline
                    .jpeg({ 
                        quality: quality,
                        mozjpeg: true // Use mozjpeg for better compression
                    })
                    .toBuffer();
            } else if (outputFormat === 'png') {
                // PNG compression (lossless)
                compressedBuffer = await pipeline
                    .png({ 
                        quality: quality,
                        compressionLevel: 9, // Max compression (0-9)
                        adaptiveFiltering: true
                    })
                    .toBuffer();
            } else {
                // For other formats, just resize if needed
                compressedBuffer = await pipeline.toBuffer();
            }

            const compressedSizeKB = compressedBuffer.length / 1024;
            const compressionRatio = ((1 - compressedBuffer.length / imageBuffer.length) * 100).toFixed(1);
            
            console.log(`✅ Image compressed: ${originalSizeKB2.toFixed(2)}KB → ${compressedSizeKB.toFixed(2)}KB (${compressionRatio}% reduction)`);

            return compressedBuffer;
        } catch (error) {
            console.error('❌ Image compression error:', error);
            // Return original buffer if compression fails
            return imageBuffer;
        }
    }

    /**
     * Compress product images (e-commerce optimized)
     * @param {Buffer} imageBuffer - Image file buffer
     * @returns {Promise<Buffer>} Compressed image buffer
     */
    async compressProductImage(imageBuffer) {
        return await this.compressImageSmart(imageBuffer, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 85, // High quality for product images
            convertToWebP: true,
            minSizeKB: 150
        });
    }

    /**
     * Compress post/media images (social media optimized)
     * @param {Buffer} imageBuffer - Image file buffer
     * @returns {Promise<Buffer>} Compressed image buffer
     */
    async compressPostImage(imageBuffer) {
        return await this.compressImageSmart(imageBuffer, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 80, // Slightly lower quality for posts
            convertToWebP: true,
            minSizeKB: 200
        });
    }
}

module.exports = new ImageCompressionService();
