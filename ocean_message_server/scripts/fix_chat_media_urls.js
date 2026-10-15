const { sequelize, Message } = require('../models');
const { Op } = require('sequelize');
const { sanitizeMediaUrl } = require('../src/utils/urlHelper');

async function fixChatMediaUrls() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Find all messages that have a mediaUrl containing 'cloudflarestorage.com' or missing 'ocean_app'
    const messages = await Message.findAll({
      where: {
        mediaUrl: {
          [Op.ne]: null
        }
      }
    });

    console.log(`🔍 Checking ${messages.length} message(s) with mediaUrl...`);
    let updatedCount = 0;

    for (const msg of messages) {
      const originalUrl = msg.mediaUrl;
      const cleanUrl = sanitizeMediaUrl(originalUrl);

      if (cleanUrl && cleanUrl !== originalUrl) {
        console.log(`\n🔄 Fixing Message [${msg.id}]:`);
        console.log(`   From: ${originalUrl}`);
        console.log(`   To:   ${cleanUrl}`);
        
        await msg.update({ mediaUrl: cleanUrl });
        updatedCount++;
      }
    }

    console.log(`\n🎉 Done! Successfully updated ${updatedCount} message media URL(s).`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing chat media URLs:', err);
    process.exit(1);
  }
}

fixChatMediaUrls();
