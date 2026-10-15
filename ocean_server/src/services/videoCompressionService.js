const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

class VideoCompressionService {
    /**
     * Get video resolution and duration using FFprobe
     * @param {string} videoPath - Path to video file
     * @returns {Promise<{width: number, height: number, duration: number}>}
     */
    async getVideoInfo(videoPath) {
        return new Promise((resolve, reject) => {
            exec(
                `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration -of json "${videoPath}"`,
                (error, stdout) => {
                    if (error) {
                        reject(error);
                    } else {
                        try {
                            const data = JSON.parse(stdout);
                            const stream = data.streams?.[0];
                            const format = data.format;
                            resolve({
                                width: stream?.width || 1920,
                                height: stream?.height || 1080,
                                duration: parseFloat(format?.duration) || 60
                            });
                        } catch (e) {
                            reject(e);
                        }
                    }
                }
            );
        });
    }

    /**
     * Compress video while maintaining resolution and quality
     * @param {Buffer} videoBuffer - Video file buffer
     * @param {number} targetSizeMB - Target size in MB (default: 35MB to stay under 40MB limit)
     * @returns {Promise<Buffer>} Compressed video buffer
     */
    async compressVideo(videoBuffer, targetSizeMB = 35) {
        const tempDir = path.join(__dirname, '../../temp');
        await fs.mkdir(tempDir, { recursive: true });
        
        const inputPath = path.join(tempDir, `input_${uuidv4()}.mp4`);
        const outputPath = path.join(tempDir, `output_${uuidv4()}.mp4`);
        
        try {
            // Write buffer to temp file
            await fs.writeFile(inputPath, videoBuffer);
            
            // Get video information
            const { width, height, duration } = await this.getVideoInfo(inputPath);
            console.log(`📹 Original video: ${width}x${height}, ${duration.toFixed(1)}s`);
            
            // Determine resolution category
            const isHD = (width >= 1280 && height >= 720);
            const isFullHD = (width >= 1920 && height >= 1080);
            
            // Calculate target bitrate based on resolution and target size
            // Formula: (targetSizeMB * 8 * 1024) / duration_in_seconds (in kbps)
            const targetBitrate = Math.floor((targetSizeMB * 8 * 1024) / duration);
            
            // Quality settings based on resolution
            // CRF (Constant Rate Factor): Lower = better quality
            // 23 = high quality (for 1080p)
            // 25 = medium-high quality (for 720p)
            // 28 = medium quality (for lower resolutions)
            const crf = isFullHD ? 23 : (isHD ? 25 : 28);
            
            // Build FFmpeg command with quality-preserving settings
            let ffmpegCommand = `ffmpeg -i "${inputPath}" `;
            
            // Only scale if resolution exceeds 1080p (maintain up to 1080p)
            if (width > 1920 || height > 1080) {
                ffmpegCommand += `-vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" `;
                console.log(`📹 Scaling down from ${width}x${height} to max 1920x1080`);
            } else {
                console.log(`📹 Maintaining resolution: ${width}x${height}`);
            }
            
            // Video encoding settings
            // -preset medium: good balance of speed/quality
            // -crf: constant rate factor (lower = better quality)
            // -maxrate/bufsize: bitrate limits for quality control
            // -movflags +faststart: web optimization (allows streaming)
            ffmpegCommand += `-c:v libx264 -preset medium -crf ${crf} `;
            ffmpegCommand += `-maxrate ${targetBitrate}k -bufsize ${targetBitrate * 2}k `;
            ffmpegCommand += `-c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
            
            const qualityLabel = crf <= 23 ? 'High' : (crf <= 25 ? 'Medium-High' : 'Medium');
            console.log(`📹 Compressing with CRF ${crf} (${qualityLabel} quality), target bitrate: ${targetBitrate}k`);
            
            // Execute compression
            await new Promise((resolve, reject) => {
                exec(ffmpegCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error('FFmpeg error:', error);
                        console.error('FFmpeg stderr:', stderr);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
            
            // Read compressed video
            const compressedBuffer = await fs.readFile(outputPath);
            const originalSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);
            const compressedSizeMB = (compressedBuffer.length / (1024 * 1024)).toFixed(2);
            const compressionRatio = ((1 - compressedBuffer.length / videoBuffer.length) * 100).toFixed(1);
            
            console.log(`✅ Video compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${compressionRatio}% reduction)`);
            console.log(`   Resolution maintained: ${width}x${height}`);
            
            // Cleanup temp files
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});
            
            return compressedBuffer;
        } catch (error) {
            // Cleanup on error
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});
            throw error;
        }
    }

    /**
     * Smart compression - only compress if needed, maintain maximum quality
     * @param {Buffer} videoBuffer - Video file buffer
     * @param {number} targetSizeMB - Target size in MB (default: 35MB)
     * @returns {Promise<Buffer>} Compressed video buffer (or original if already under limit)
     */
    async compressVideoSmart(videoBuffer, targetSizeMB = 35) {
        const originalSizeMB = videoBuffer.length / (1024 * 1024);
        
        // If already under target, return original
        if (originalSizeMB <= targetSizeMB) {
            console.log(`✅ Video already under ${targetSizeMB}MB (${originalSizeMB.toFixed(2)}MB), no compression needed`);
            return videoBuffer;
        }
        
        // Compress with quality-preserving settings
        return await this.compressVideo(videoBuffer, targetSizeMB);
    }

    /**
     * Extract a poster frame / thumbnail from video buffer as WebP
     * @param {Buffer} videoBuffer
     * @returns {Promise<Buffer|null>} WebP thumbnail buffer
     */
    async generateThumbnail(videoBuffer) {
        const tempDir = path.join(__dirname, '../../temp');
        await fs.mkdir(tempDir, { recursive: true });
        
        const inputPath = path.join(tempDir, `thumb_in_${uuidv4()}.mp4`);
        const posterPath = path.join(tempDir, `thumb_out_${uuidv4()}.jpg`);
        
        try {
            await fs.writeFile(inputPath, videoBuffer);
            
            await new Promise((resolve, reject) => {
                exec(`ffmpeg -ss 00:00:00.500 -i "${inputPath}" -vframes 1 -q:v 2 "${posterPath}"`, (error) => {
                    if (error) {
                        // Fallback: grab frame 0
                        exec(`ffmpeg -i "${inputPath}" -vframes 1 -q:v 2 "${posterPath}"`, (err2) => {
                            if (err2) reject(err2);
                            else resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            });

            const jpgBuffer = await fs.readFile(posterPath);
            const webpBuffer = await sharp(jpgBuffer)
                .resize(720, 1280, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80, effort: 4 })
                .toBuffer();

            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(posterPath).catch(() => {});
            return webpBuffer;
        } catch (err) {
            console.warn('⚠️ Could not extract video thumbnail:', err.message);
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(posterPath).catch(() => {});
            return null;
        }
    }
}

module.exports = new VideoCompressionService();

