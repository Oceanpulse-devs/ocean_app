const { Readable } = require('stream');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
        this.r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || null;
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
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);
          resolve({
            success: true,
            url: result.secure_url || result.url,
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
   * Upload buffer to Cloudflare R2
   */
  async uploadToR2(fileBuffer, folder = 'chat_media', options = {}) {
    if (!this.s3Client) {
      throw new Error('Cloudflare R2 is not configured on message server.');
    }

    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const ext = options.filename ? path.extname(options.filename) : (options.mimetype ? `.${options.mimetype.split('/')[1]}` : '.jpg');
    const filename = `${uuidv4()}${ext}`;
    const key = `${folder}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.r2Bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: options.mimetype || 'image/jpeg'
    });

    await this.s3Client.send(command);

    const publicUrl = this.r2PublicUrl 
      ? `${this.r2PublicUrl.replace(/\/$/, '')}/${key}`
      : `https://${this.r2Bucket}.${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      success: true,
      url: publicUrl,
      publicId: key,
      key: key
    };
  }
}

module.exports = new MessageStorageService();
