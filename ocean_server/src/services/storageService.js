const cloudinaryService = require('./cloudinaryService');
const r2StorageService = require('./r2StorageService');

/**
 * Unified Storage Service
 * Dynamically routes upload and file management operations between
 * Cloudflare R2 and Cloudinary based on the STORAGE_PROVIDER environment variable.
 * 
 * - STORAGE_PROVIDER=r2 (or rs): Routes to Cloudflare R2 (ideal for self-hosted VPS / Coolify)
 * - STORAGE_PROVIDER=cloudinary (or unset): Routes to Cloudinary (Railway, Render, local default)
 */
class StorageService {
    constructor() {
        this.cloudinaryService = cloudinaryService;
        this.r2StorageService = r2StorageService;
    }

    /**
     * Get the active storage provider name ('r2' or 'cloudinary')
     * @returns {string}
     */
    getActiveProviderName() {
        const provider = (process.env.STORAGE_PROVIDER || 'cloudinary').trim().toLowerCase();
        if (provider === 'r2' || provider === 'rs') {
            if (this.r2StorageService.isR2Configured()) {
                return 'r2';
            }
            console.warn('⚠️ STORAGE_PROVIDER is set to R2, but R2 credentials are incomplete. Falling back to Cloudinary.');
        }
        return 'cloudinary';
    }

    /**
     * Get the active service instance
     * @returns {Object} Active storage service
     */
    getActiveService() {
        const provider = this.getActiveProviderName();
        return provider === 'r2' ? this.r2StorageService : this.cloudinaryService;
    }

    async uploadFile(file, folder, options) {
        return await this.getActiveService().uploadFile(file, folder, options);
    }

    async uploadMultipleFiles(files, folder, options) {
        return await this.getActiveService().uploadMultipleFiles(files, folder, options);
    }

    async uploadPostMedia(file, postId) {
        return await this.getActiveService().uploadPostMedia(file, postId);
    }

    async uploadBuyerNeedMedia(file, buyerNeedId) {
        return await this.getActiveService().uploadBuyerNeedMedia(file, buyerNeedId);
    }

    async uploadProductImage(file, productId) {
        return await this.getActiveService().uploadProductImage(file, productId);
    }

    async uploadARModel(file, productId) {
        return await this.getActiveService().uploadARModel(file, productId);
    }

    async uploadAuctionARModel(file, auctionId) {
        return await this.getActiveService().uploadAuctionARModel(file, auctionId);
    }

    async uploadSwapDealARModel(file, swapDealId) {
        return await this.getActiveService().uploadSwapDealARModel(file, swapDealId);
    }

    async uploadGroupBuyARModel(file, groupBuyId) {
        return await this.getActiveService().uploadGroupBuyARModel(file, groupBuyId);
    }

    async uploadDistressSaleARModel(file, productId) {
        return await this.getActiveService().uploadDistressSaleARModel(file, productId);
    }

    async uploadProfilePicture(file, userId) {
        return await this.getActiveService().uploadProfilePicture(file, userId);
    }

    async uploadSellerDocument(file, sellerId, documentType) {
        return await this.getActiveService().uploadSellerDocument(file, sellerId, documentType);
    }

    generateThumbnailUrl(originalUrl, resourceType, publicId) {
        return this.getActiveService().generateThumbnailUrl(originalUrl, resourceType, publicId);
    }

    async deleteFile(publicId) {
        // If publicId belongs to R2 (or provider is R2), route to R2
        const provider = this.getActiveProviderName();
        if (provider === 'r2') {
            const r2Result = await this.r2StorageService.deleteFile(publicId);
            if (r2Result.success) return r2Result;
        }
        return await this.cloudinaryService.deleteFile(publicId);
    }

    async getFileInfo(publicId) {
        return await this.getActiveService().getFileInfo(publicId);
    }
}

module.exports = new StorageService();
