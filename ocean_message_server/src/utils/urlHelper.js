/**
 * URL sanitization helpers for ocean_message_server
 * Ensures all profile pictures and media URLs returned to frontend are clean,
 * valid HTTP/HTTPS URLs and converts non-URL placeholders (like '👤', 'null', undefined)
 * to null so the frontend never hangs in an infinite loading state.
 */

const sanitizeProfilePicture = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (
    trimmed === '' ||
    trimmed === '👤' ||
    trimmed.toLowerCase() === 'null' ||
    trimmed.toLowerCase() === 'undefined'
  ) {
    return null;
  }

  const publicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-bd6344ad34d34e088cad7d84126a205c.r2.dev').replace(/\/+$/, '');
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bluewhale-media';

  // Fix raw Cloudflare S3 endpoints:
  // Handles virtual-hosted style: https://bluewhale-media.af732adc8fe86599fbe35ab3e20c28b0.r2.cloudflarestorage.com/<key>
  // Handles path style: https://af732adc8fe86599fbe35ab3e20c28b0.r2.cloudflarestorage.com/bluewhale-media/<key>
  let cleanUrl = trimmed;
  if (cleanUrl.includes('r2.cloudflarestorage.com')) {
    const bucketPattern = bucketName ? `(?:${bucketName}/)?` : '';
    const pattern = new RegExp(`https?://[^/]+\\.r2\\.cloudflarestorage\\.com/${bucketPattern}`, 'i');
    cleanUrl = cleanUrl.replace(pattern, `${publicUrl}/`);
  }

  // Self-heal any URLs where 'ocean_app/' was accidentally stripped from chat_media
  if (cleanUrl.includes('/chat_media/') && !cleanUrl.includes('/ocean_app/chat_media/')) {
    cleanUrl = cleanUrl.replace('/chat_media/', '/ocean_app/chat_media/');
  }

  // If not a full URL, check if it's a relative path / object key
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    if (cleanUrl.startsWith('/') || cleanUrl.includes('/')) {
      const normalizedPath = cleanUrl.replace(/^\/+/, '');
      return `${publicUrl}/${normalizedPath}`;
    }
    return null;
  }

  return cleanUrl;
};

const sanitizeMediaUrl = (url) => {
  return sanitizeProfilePicture(url);
};

module.exports = {
  sanitizeProfilePicture,
  sanitizeMediaUrl
};
