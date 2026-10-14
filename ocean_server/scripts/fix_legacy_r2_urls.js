/**
 * Standalone Script: Fix Legacy Cloudflare R2 URLs in Database
 * 
 * Usage:
 *   node scripts/fix_legacy_r2_urls.js
 * 
 * This script scans database tables for legacy private S3 endpoint URLs
 * (*.r2.cloudflarestorage.com/...) and updates them to the public CDN domain
 * configured in CLOUDFLARE_R2_PUBLIC_URL.
 */

require('dotenv').config();
const { Op } = require('sequelize');
const db = require('../models');
const r2StorageService = require('../src/services/r2StorageService');
const redisClient = require('../src/config/redisdb');

async function fixLegacyUrls() {
    console.log('🚀 Starting legacy R2 URL migration...');
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (!publicUrl) {
        console.error('❌ Error: CLOUDFLARE_R2_PUBLIC_URL is not defined in environment variables.');
        process.exit(1);
    }

    console.log(`📡 Target Public CDN URL: ${publicUrl}`);
    const searchPattern = '%.r2.cloudflarestorage.com%';
    let totalUpdated = 0;

    try {
        // 1. Fix User profilePicture and coverPicture
        const { UserTable } = db;
        if (UserTable) {
            const users = await UserTable.findAll({
                where: {
                    [Op.or]: [
                        { profilePicture: { [Op.like]: searchPattern } },
                        { coverPicture: { [Op.like]: searchPattern } }
                    ]
                }
            });

            console.log(`🔍 Found ${users.length} users with legacy R2 URLs.`);
            for (const user of users) {
                const oldPic = user.profilePicture;
                const oldCover = user.coverPicture;
                const newPic = r2StorageService.sanitizePublicUrl(oldPic);
                const newCover = r2StorageService.sanitizePublicUrl(oldCover);

                await user.update({
                    profilePicture: newPic,
                    coverPicture: newCover
                });
                totalUpdated++;
                console.log(`   ✅ User [${user.id} - ${user.fullName || 'User'}]:`);
                if (oldPic && oldPic !== newPic) console.log(`      Avatar: ${oldPic} -> ${newPic}`);
                if (oldCover && oldCover !== newCover) console.log(`      Cover:  ${oldCover} -> ${newCover}`);
            }
        }

        // 2. Fix SellerVerificationLog nimcPhotoUrl
        const { SellerVerificationLog } = db;
        if (SellerVerificationLog) {
            const logs = await SellerVerificationLog.findAll({
                where: {
                    nimcPhotoUrl: { [Op.like]: searchPattern }
                }
            });
            console.log(`🔍 Found ${logs.length} seller verification logs with legacy R2 URLs.`);
            for (const log of logs) {
                const newUrl = r2StorageService.sanitizePublicUrl(log.nimcPhotoUrl);
                await log.update({ nimcPhotoUrl: newUrl });
                totalUpdated++;
            }
        }

        // 3. Fix SellerDocument documentImage
        const { SellerDocument } = db;
        if (SellerDocument) {
            const docs = await SellerDocument.findAll({
                where: {
                    documentImage: { [Op.like]: searchPattern }
                }
            });
            console.log(`🔍 Found ${docs.length} seller documents with legacy R2 URLs.`);
            for (const doc of docs) {
                const newUrl = r2StorageService.sanitizePublicUrl(doc.documentImage);
                await doc.update({ documentImage: newUrl });
                totalUpdated++;
            }
        }

        // 4. Invalidate Redis feed caches
        if (redisClient && typeof redisClient.keys === 'function') {
            try {
                const keys = await redisClient.keys('homeFeed:*');
                if (keys && keys.length > 0) {
                    await redisClient.del(keys);
                    console.log(`🧹 Flushed ${keys.length} stale Redis homeFeed cache keys.`);
                }
            } catch (redisErr) {
                console.warn('⚠️ Redis cache flush skipped:', redisErr.message);
            }
        }

        console.log(`\n🎉 Migration complete! Total records updated: ${totalUpdated}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running migration:', error);
        process.exit(1);
    }
}

fixLegacyUrls();
