const { Readable } = require('stream');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

/**
 * Message Server Storage Service
 * Supports both Cloudinary (default) and Cloudflare R2 based on STORAGE_PROVIDER.
 */
class MessageStorageService {
  constructor() {
    this.cloudinary = null;
    this.s3Client = null;
    this.initServices();
  }

  initServices() {
    // 1. Initialize Cloudinary
    try {
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      this.cloudinary = cloudinary;
    } catch (e) {
      console.warn('⚠️ Cloudinary package or config not available on message server:', e.message);
    }

    // 2. Initialize Cloudflare R2
    try {
      const { S3Client } = require('@aws-sdk/client-s3');
      const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
      const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bluewhale-media';
      const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || 
        (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null);

      if (accessKeyId && secretAccessKey && endpoint) {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey
          }
        });
        this.r2Bucket = bucketName;
        this.r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-bd6344ad34d34e088cad7d84126a205c.r2.dev';
      }
    } catch (e) {
      // S3 package optional
    }
  }

  isR2Active() {
    const provider = (process.env.STORAGE_PROVIDER || 'cloudinary').trim().toLowerCase();
    return (provider === 'r2' || provider === 'rs') && !!this.s3Client;
  }

  /**
   * Upload file buffer to active storage provider (Cloudinary or R2)
   * @param {Buffer} fileBuffer
   * @param {string} folder
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async uploadFile(fileBuffer, folder = 'ocean_app/chat_media', options = {}) {
    if (this.isR2Active()) {
      return await this.uploadToR2(fileBuffer, folder, options);
    }
    return await this.uploadToCloudinary(fileBuffer, folder, options);
  }

  /**
   * Upload buffer to Cloudinary
   */
  async uploadToCloudinary(fileBuffer, folder = 'ocean_app/chat_media', options = {}) {
    if (!this.cloudinary) {
      throw new Error('Cloudinary is not configured on message server. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
    }

    const uploadOptions = {
      folder: folder || 'ocean_app/chat_media',
      resource_type: options.resource_type || 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
      transformation: [
        { width: 1440, height: 1440, crop: 'limit' }
      ],
      eager: [
        { width: 250, height: 250, crop: 'limit', quality: 'auto:low', format: 'webp' }
      ],
      ...options
    };

    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);
          const thumbUrl = result.eager && result.eager[0] ? result.eager[0].secure_url : (result.secure_url || result.url);
          resolve({
            success: true,
            url: result.secure_url || result.url,
            thumbnailUrl: thumbUrl,
            publicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes
          });
        }
      );
      Readable.from(fileBuffer).pipe(uploadStream);
    });
  }

  /**
   * Upload buffer to Cloudflare R2 with Sharp WebP optimization and thumbnail generation
   */
  async uploadToR2(fileBuffer, folder = 'ocean_app/chat_media', options = {}) {
    if (!this.s3Client) {
      throw new Error('Cloudflare R2 is not configured on message server.');
    }

    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const id = uuidv4();
    let uploadBuffer = fileBuffer;
    let contentType = options.mimetype || 'image/jpeg';
    let ext = '.jpg';
    let thumbnailUrl = null;

    // Optimize images with Sharp to modern WebP (max 1080px with size ceiling)
    try {
      uploadBuffer = await sharp(fileBuffer)
        .rotate()
        .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75, effort: 4 })
        .toBuffer();

      // Ceiling check: if over 150KB, compress with pass-2
      if (uploadBuffer.length > 150 * 1024) {
        uploadBuffer = await sharp(fileBuffer)
          .rotate()
          .resize(960, 960, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 68, effort: 5 })
          .toBuffer();
      }

      contentType = 'image/webp';
      ext = '.webp';

      // Generate a lightweight 250px preview thumbnail
      const thumbBuffer = await sharp(uploadBuffer)
        .resize(250, 250, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 60, effort: 3 })
        .toBuffer();

      const thumbKey = `${folder}/thumb_${id}.webp`;
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.r2Bucket,
        Key: thumbKey,
        Body: thumbBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable'
      }));

      const publicBase = (this.r2PublicUrl || 'https://pub-bd6344ad34d34e088cad7d84126a205c.r2.dev').replace(/\/+$/, '');
      thumbnailUrl = `${publicBase}/${thumbKey}`;
    } catch (sharpError) {
      console.warn('⚠️ Sharp optimization for chat media skipped:', sharpError.message);
      uploadBuffer = fileBuffer;
      ext = options.filename ? path.extname(options.filename) : (options.mimetype ? `.${options.mimetype.split('/')[1]}` : '.jpg');
    }

    const key = `${folder}/${id}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.r2Bucket,
      Key: key,
      Body: uploadBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    });

    await this.s3Client.send(command);

    const publicBase = (this.r2PublicUrl || 'https://pub-bd6344ad34d34e088cad7d84126a205c.r2.dev').replace(/\/+$/, '');
    const publicUrl = `${publicBase}/${key}`;

    return {
      success: true,
      url: publicUrl,
      thumbnailUrl: thumbnailUrl || publicUrl,
      publicId: key,
      key: key,
      size: uploadBuffer.length
    };
  }
}

module.exports = new MessageStorageService();
