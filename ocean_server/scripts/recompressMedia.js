/**
 * BlueWhale Media Recompression Maintenance Tool
 * 
 * Scans previously uploaded images across Posts, Products, and Buyer Needs.
 * Downloads heavy images (> 160 KB), recompresses them using Sharp to mobile-first WebP (< 150 KB),
 * and overwrites them on Cloudflare R2 (preserving the exact same public URL).
 * 
 * Usage:
 *   node scripts/recompressMedia.js --dry-run   (Analyze without modifying files)
 *   node scripts/recompressMedia.js --live      (Recompress and overwrite heavy assets on R2)
 */

require('dotenv').config();
const axios = require('axios');
const sharp = require('sharp');
const db = require('../models');
const r2StorageService = require('../src/services/r2StorageService');
const imageCompressionService = require('../src/services/imageCompressionService');

const isLive = process.argv.includes('--live');
const isDryRun = !isLive;

const SIZE_CEILING_KB = 160; // Any image above 160KB will be optimized

async function fetchBuffer(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'BlueWhale-MediaOptimizer/1.0'
            }
        });
        return Buffer.from(response.data);
    } catch (err) {
        return null;
    }
}

function extractR2Key(url) {
    if (!url || typeof url !== 'string') return null;

    // Custom domain: https://media.bluewhalemarketplace.com/<folder>/<filename>
    // or R2 pub: https://pub-<hash>.r2.dev/<folder>/<filename>
    try {
        const parsed = new URL(url);
        // Remove leading slash
        const key = parsed.pathname.replace(/^\/+/, '');
        return key || null;
    } catch {
        return null;
    }
}

async function processImage(url, sourceLabel) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return { status: 'invalid' };
    }

    const buffer = await fetchBuffer(url);
    if (!buffer) {
        return { status: 'failed_fetch', url };
    }

    const sizeKB = buffer.length / 1024;
    if (sizeKB <= SIZE_CEILING_KB) {
        return { status: 'already_optimized', sizeKB };
    }

    // Heavy image detected! Recompress
    const compressedBuffer = await imageCompressionService.compressImageSmart(buffer, {
        maxWidth: 1080,
        maxHeight: 1350,
        quality: 75,
        maxTargetKB: 140
    });

    const newSizeKB = compressedBuffer.length / 1024;
    const savedKB = sizeKB - newSizeKB;
    const percentSaved = Math.round((savedKB / sizeKB) * 100);

    if (isLive) {
        const r2Key = extractR2Key(url);
        if (r2Key && r2StorageService.isR2Configured()) {
            const { PutObjectCommand } = require('@aws-sdk/client-s3');
            await r2StorageService.s3Client.send(new PutObjectCommand({
                Bucket: r2StorageService.bucketName,
                Key: r2Key,
                Body: compressedBuffer,
                ContentType: 'image/webp',
                CacheControl: 'public, max-age=31536000, immutable'
            }));
            console.log(`✅ [LIVE OVERWRITE] (${sourceLabel}): ${Math.round(sizeKB)}KB ➔ ${Math.round(newSizeKB)}KB (${percentSaved}% saved) - ${url}`);
        } else {
            console.log(`⚠️ [LIVE SKIPPED - NOT R2] (${sourceLabel}): ${Math.round(sizeKB)}KB ➔ ${Math.round(newSizeKB)}KB - URL: ${url}`);
        }
    } else {
        console.log(`🔍 [DRY RUN] Would optimize (${sourceLabel}): ${Math.round(sizeKB)}KB ➔ ${Math.round(newSizeKB)}KB (${percentSaved}% saved) - ${url}`);
    }

    return {
        status: 'optimized',
        originalKB: sizeKB,
        newKB: newSizeKB,
        savedKB: savedKB
    };
}

async function run() {
    console.log(`===================================================`);
    console.log(`🚀 BlueWhale Media Recompression Engine`);
    console.log(`   Mode: ${isLive ? '🔴 LIVE (Will overwrite files on R2)' : '🟢 DRY RUN (Scan & calculate only)'}`);
    console.log(`   Size Ceiling: > ${SIZE_CEILING_KB} KB`);
    console.log(`===================================================\n`);

    let totalScanned = 0;
    let totalHeavy = 0;
    let totalSavedKB = 0;

    // 1. Scan Post Media
    try {
        console.log('📦 Scanning Post Media images...');
        const postMedia = await db.PostMedia.findAll({
            where: { mediaType: 'image' },
            attributes: ['id', 'mediaUrl'],
            limit: 500
        });

        for (const item of postMedia) {
            totalScanned++;
            const res = await processImage(item.mediaUrl, 'Post');
            if (res.status === 'optimized') {
                totalHeavy++;
                totalSavedKB += res.savedKB;
            }
        }
    } catch (err) {
        console.warn('⚠️ Error querying PostMedia:', err.message);
    }

    // 2. Scan Products
    try {
        console.log('\n📦 Scanning Product images...');
        const products = await db.Product.findAll({
            attributes: ['id', 'images'],
            limit: 500
        });

        for (const product of products) {
            const images = Array.isArray(product.images) ? product.images : [];
            for (const img of images) {
                const url = typeof img === 'string' ? img : (img?.url || img?.mediaUrl);
                if (url) {
                    totalScanned++;
                    const res = await processImage(url, 'Product');
                    if (res.status === 'optimized') {
                        totalHeavy++;
                        totalSavedKB += res.savedKB;
                    }
                }
            }
        }
    } catch (err) {
        console.warn('⚠️ Error querying Products:', err.message);
    }

    // 3. Scan Buyer Need Media
    try {
        console.log('\n📦 Scanning Buyer Need Media images...');
        const buyerNeeds = await db.BuyerNeedMedia.findAll({
            attributes: ['id', 'mediaUrl'],
            limit: 500
        });

        for (const item of buyerNeeds) {
            totalScanned++;
            const res = await processImage(item.mediaUrl, 'BuyerNeed');
            if (res.status === 'optimized') {
                totalHeavy++;
                totalSavedKB += res.savedKB;
            }
        }
    } catch (err) {
        console.warn('⚠️ Error querying BuyerNeedMedia:', err.message);
    }

    console.log('\n===================================================');
    console.log('🏁 Recompression Summary:');
    console.log(`   Total Images Scanned:     ${totalScanned}`);
    console.log(`   Heavy Images Found:       ${totalHeavy}`);
    console.log(`   Bandwidth Saved:          ${(totalSavedKB / 1024).toFixed(2)} MB`);
    if (isDryRun) {
        console.log('\n💡 To perform the actual optimization on Cloudflare R2, run:');
        console.log('   node scripts/recompressMedia.js --live');
    } else {
        console.log('\n🎉 Live optimization complete! Mobile users will now experience immediate loading.');
    }
    console.log('===================================================\n');

    process.exit(0);
}

run().catch((err) => {
    console.error('Fatal error running recompression:', err);
    process.exit(1);
});

