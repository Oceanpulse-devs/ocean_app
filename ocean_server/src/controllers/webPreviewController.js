const db = require('../../models');

const getBaseUrl = (req) => {
  return (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
};

const renderPreviewHtml = (data) => {
  const { title, description, imageUrl, url } = data;
  const logoFallback = `${data.baseUrl}/public/bluewhale.png`;
  const finalImage = imageUrl || logoFallback;
  const safeTitle = (title || 'BlueWhale Marketplace').replace(/"/g, '&quot;');
  const safeDesc = (description || 'Explore products, auctions, and deals on BlueWhale Marketplace.').replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle} - BlueWhale Marketplace</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- OpenGraph Metadata for WhatsApp, Facebook & Social Cards -->
  <meta property="og:site_name" content="BlueWhale" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${safeTitle} | BlueWhale" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${finalImage}" />
  <meta property="og:url" content="${url}" />
  
  <!-- Twitter Card Metadata -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${finalImage}" />
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #0b1020;
      color: #e5e7eb;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .card {
      background: #151a2b;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 24px;
      max-width: 480px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    img {
      width: 100%;
      max-height: 260px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    h1 { font-size: 1.25rem; margin: 0 0 8px; color: #ffffff; }
    p { font-size: 0.9rem; color: #9ca3af; margin: 0 0 20px; }
    .btn {
      display: inline-block;
      background: #00b7ff;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${finalImage}" alt="${safeTitle}" />
    <h1>${safeTitle}</h1>
    <p>${safeDesc}</p>
    <a href="${url}" class="btn">Open in BlueWhale App</a>
  </div>
</body>
</html>`;
};

module.exports = {
  getProductPreview: async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const productId = req.params.id;
      const product = await db.Product.findByPk(productId);
      
      let imageUrl = null;
      if (product && product.images) {
        try {
          const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
          imageUrl = Array.isArray(imgs) ? imgs[0] : imgs;
        } catch (e) {
          imageUrl = product.images;
        }
      }

      const html = renderPreviewHtml({
        title: product ? product.title || product.name : 'Product Listing',
        description: product ? (product.description || `Price: ₦${product.price ? Number(product.price).toLocaleString() : 'N/A'}`) : 'Check out this item on BlueWhale Marketplace',
        imageUrl: imageUrl,
        url: `${baseUrl}/products/${productId}`,
        baseUrl
      });
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (err) {
      return res.redirect('/');
    }
  },

  getDistressSalePreview: async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const saleId = req.params.id;
      const item = await db.Product.findOne({ where: { id: saleId, isDistressSale: true } }) || await db.Product.findByPk(saleId);
      
      let imageUrl = null;
      if (item && item.images) {
        try {
          const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
          imageUrl = Array.isArray(imgs) ? imgs[0] : imgs;
        } catch (e) {
          imageUrl = item.images;
        }
      }

      const html = renderPreviewHtml({
        title: item ? `${item.title || item.name} - Distress Sale` : 'Distress Sale',
        description: item ? `Special Distress Sale on BlueWhale! Price: ₦${item.price ? Number(item.price).toLocaleString() : 'N/A'}` : 'Check out this distress sale on BlueWhale Marketplace',
        imageUrl: imageUrl,
        url: `${baseUrl}/distress-sales/${saleId}`,
        baseUrl
      });
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (err) {
      return res.redirect('/');
    }
  },

  getAuctionPreview: async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const auctionId = req.params.id;
      const auction = await db.Auction ? await db.Auction.findByPk(auctionId) : null;
      
      const html = renderPreviewHtml({
        title: auction ? `${auction.title || 'Live Auction'} - BlueWhale` : 'Live Auction',
        description: auction ? `Live bidding item on BlueWhale! Starting price: ₦${auction.startingPrice ? Number(auction.startingPrice).toLocaleString() : 'N/A'}` : 'Join live auction bidding on BlueWhale Marketplace',
        imageUrl: auction ? auction.imageUrl : null,
        url: `${baseUrl}/auctions/${auctionId}`,
        baseUrl
      });
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (err) {
      return res.redirect('/');
    }
  },

  getGenericPreview: async (req, res) => {
    const baseUrl = getBaseUrl(req);
    const html = renderPreviewHtml({
      title: 'BlueWhale Marketplace',
      description: 'Buy, sell, swap, and bid on products with real-time updates on BlueWhale.',
      imageUrl: `${baseUrl}/public/bluewhale.png`,
      url: `${baseUrl}${req.originalUrl}`,
      baseUrl
    });
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }
};
