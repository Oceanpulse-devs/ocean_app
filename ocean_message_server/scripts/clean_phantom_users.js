const { sequelize, UserReference, Conversation, ConversationParticipant, Message } = require('../models');
const { Op } = require('sequelize');

async function cleanPhantomUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Find phantom users: id not standard UUID, or fullName like 'User %', or email like '%@temp.com'
    const allUsers = await UserReference.findAll();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const phantomUsers = allUsers.filter(u => {
      const isBadId = !uuidRegex.test(u.id);
      const isTempEmail = u.email && u.email.endsWith('@temp.com');
      const isGenericUserName = u.fullName === 'User' || (u.fullName && u.fullName.startsWith('User '));
      return isBadId || (isTempEmail && isGenericUserName);
    });

    console.log(`🔍 Found ${phantomUsers.length} phantom user(s):`, phantomUsers.map(u => ({ id: u.id, fullName: u.fullName, email: u.email })));

    for (const phantom of phantomUsers) {
      console.log(`\n🧹 Processing phantom user: [${phantom.id}] - ${phantom.fullName}`);

      // Find conversations involving this phantom user
      const participations = await ConversationParticipant.findAll({
        where: { userId: phantom.id }
      });

      const conversationIds = [...new Set(participations.map(p => p.conversationId))];
      console.log(`   Found ${conversationIds.length} conversation(s) linked to this phantom user.`);

      for (const convId of conversationIds) {
        // Delete messages in this conversation
        const deletedMsgs = await Message.destroy({ where: { conversationId: convId } });
        console.log(`   - Deleted ${deletedMsgs} messages in conversation ${convId}`);

        // Delete participants
        const deletedParts = await ConversationParticipant.destroy({ where: { conversationId: convId } });
        console.log(`   - Deleted ${deletedParts} participant rows for conversation ${convId}`);

        // Delete conversation
        await Conversation.destroy({ where: { id: convId } });
        console.log(`   - Deleted conversation ${convId}`);
      }

      // Delete the phantom user reference record
      await phantom.destroy();
      console.log(`   ✅ Removed phantom UserReference: ${phantom.id}`);
    }

    console.log('\n🎉 Phantom user cleanup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanPhantomUsers();
