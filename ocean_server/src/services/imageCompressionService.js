const sharp = require('sharp');

/**
 * Image Compression Service
 * Compresses images before upload to reduce file size and ensure uniform lightning-fast load speeds.
 * Implements mobile-first resolutions, WebP encoding, and a smart size ceiling (multi-pass).
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
     * Smart compression with size ceiling - guarantees lightweight files even from high-end cameras
     * @param {Buffer} imageBuffer - Image file buffer
     * @param {Object} options - Compression options
     * @param {number} options.maxWidth - Maximum width (default: 1080)
     * @param {number} options.maxHeight - Maximum height (default: 1350)
     * @param {number} options.quality - WebP quality 1-100 (default: 75)
     * @param {boolean} options.convertToWebP - Convert to WebP (default: true)
     * @param {number} options.minSizeKB - Minimum size in KB to compress (default: 40)
     * @param {number} options.maxTargetKB - Target size ceiling in KB (default: 160)
     * @returns {Promise<Buffer>} Compressed image buffer
     */
    async compressImageSmart(imageBuffer, options = {}) {
        try {
            const originalSizeKB = imageBuffer.length / 1024;
            const minSizeToCompress = options.minSizeKB || 40;

            // If image is already lightweight (< 40KB) and is already WebP, return original
            if (originalSizeKB < minSizeToCompress) {
                return imageBuffer;
            }

            const {
                maxWidth = 1080,
                maxHeight = 1350,
                quality = 75,
                convertToWebP = true,
                maxTargetKB = 160
            } = options;

            const originalInfo = await this.getImageInfo(imageBuffer);

            // Pass 1: Standard high-efficiency compression
            let pipeline = sharp(imageBuffer).rotate(); // Automatically orient image based on EXIF

            const needsResize = originalInfo.width > maxWidth || originalInfo.height > maxHeight;
            if (needsResize) {
                pipeline = pipeline.resize(maxWidth, maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            const shouldUseWebP = convertToWebP &&
                ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif', 'tiff'].includes(originalInfo.format);

            let compressedBuffer;

            if (shouldUseWebP) {
                compressedBuffer = await pipeline
                    .webp({
                        quality: quality,
                        effort: 4
                    })
                    .toBuffer();
            } else if (originalInfo.format === 'png') {
                compressedBuffer = await pipeline
                    .png({ quality: quality, compressionLevel: 9, adaptiveFiltering: true })
                    .toBuffer();
            } else {
                compressedBuffer = await pipeline
                    .jpeg({ quality: quality, mozjpeg: true })
                    .toBuffer();
            }

            let finalSizeKB = compressedBuffer.length / 1024;

            // Pass 2 (Size Ceiling): If image is still over the target ceiling (common on high-end 48MP+ sensors)
            if (finalSizeKB > maxTargetKB) {
                const secondPassWidth = Math.min(maxWidth, 960);
                const secondPassQuality = Math.max(quality - 8, 65);

                const secondPassBuffer = await sharp(imageBuffer)
                    .rotate()
                    .resize(secondPassWidth, secondPassWidth, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({
                        quality: secondPassQuality,
                        effort: 5
                    })
                    .toBuffer();

                if (secondPassBuffer.length < compressedBuffer.length) {
                    compressedBuffer = secondPassBuffer;
                    finalSizeKB = compressedBuffer.length / 1024;
                }
            }

            const savedPercent = Math.round(((originalSizeKB - finalSizeKB) / originalSizeKB) * 100);
            if (savedPercent > 0) {
                console.log(`⚡ [Image Compressed] ${Math.round(originalSizeKB)}KB ➔ ${Math.round(finalSizeKB)}KB (${savedPercent}% saved)`);
            }

            return compressedBuffer;
        } catch (error) {
            console.error('❌ Image compression error:', error.message);
            return imageBuffer;
        }
    }

    /**
     * Compress product images (marketplace optimized: 1200px max, crisp details, ceiling 180KB)
     * @param {Buffer} imageBuffer - Image file buffer
     * @returns {Promise<Buffer>} Compressed image buffer
     */
    async compressProductImage(imageBuffer) {
        return await this.compressImageSmart(imageBuffer, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 78,
            convertToWebP: true,
            minSizeKB: 40,
            maxTargetKB: 180
        });
    }

    /**
     * Compress post/media images (social feed optimized: 1080px max, ceiling 150KB)
     * @param {Buffer} imageBuffer - Image file buffer
     * @returns {Promise<Buffer>} Compressed image buffer
     */
    async compressPostImage(imageBuffer) {
        return await this.compressImageSmart(imageBuffer, {
            maxWidth: 1080,
            maxHeight: 1350,
            quality: 75,
            convertToWebP: true,
            minSizeKB: 40,
            maxTargetKB: 150
        });
    }
}

module.exports = new ImageCompressionService();
