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

  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-bd6344ad34d34e088cad7d84126a205c.r2.dev';

  // Fix raw Cloudflare S3 endpoints
  if (trimmed.includes('r2.cloudflarestorage.com')) {
    return trimmed.replace(/^https?:\/\/[^\/]+\/[^\/]+\//, `${publicUrl.replace(/\/+$/, '')}/`);
  }

  // If not a full URL, check if it's a relative path / object key
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    if (trimmed.startsWith('/') || trimmed.includes('/')) {
      return `${publicUrl.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`;
    }
    return null;
  }

  return trimmed;
};

const sanitizeMediaUrl = (url) => {
  return sanitizeProfilePicture(url);
};

module.exports = {
  sanitizeProfilePicture,
  sanitizeMediaUrl
};
