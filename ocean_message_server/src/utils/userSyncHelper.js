const axios = require('axios');
const { UserReference } = require('../../models');
const { sanitizeProfilePicture } = require('./urlHelper');

/**
 * Validates that an ID matches the standard UUID v4/v1 format.
 * Prevents dummy or misconfigured strings like 'user', 'users', 'undefined', etc.
 */
const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id.trim());
};

/**
 * Synchronizes user data from the Main Server to the local UserReference replica table.
 * 
 * CRITICAL RULE:
 * If the user does not exist on the Main Server, this function returns null.
 * It NEVER creates an imaginary or fallback user record.
 */
const syncUserFromMainServer = async (userId) => {
  if (!isValidUUID(userId)) {
    console.warn(`⛔ [syncUserFromMainServer] Invalid UUID rejected: "${userId}"`);
    return null;
  }

  try {
    const mainServerUrl = process.env.MAIN_SERVER_URL || 'https://mainserver-production-7ad9.up.railway.app';

    // 1. Check if user already exists in messaging replica table
    const existingUser = await UserReference.findByPk(userId);
    if (existingUser) {
      // If businessName or sellerId is missing but user is a seller, try to fetch and update it
      if (existingUser.accountType === 'seller' && (!existingUser.businessName || !existingUser.sellerId)) {
        try {
          const response = await axios.get(`${mainServerUrl}/api/user/${userId}`, {
            timeout: 5000,
            headers: { 'User-Agent': 'MessagingServer/1.0' }
          });

          if (response.data && response.data.data) {
            const data = response.data.data;
            const updateData = {};

            if (data.businessName && data.verificationStatus === 'approved' && !existingUser.businessName) {
              updateData.businessName = data.businessName;
            } else if (data.verificationStatus !== 'approved' && existingUser.businessName) {
              updateData.businessName = null;
            }

            if (data.sellerId && !existingUser.sellerId) {
              updateData.sellerId = data.sellerId;
            }

            if (Object.keys(updateData).length > 0) {
              await existingUser.update(updateData);
            }
          }
        } catch (error) {
          // Ignore background update failure
        }
      }
      return existingUser;
    }

    // 2. Fetch from main server user endpoint
    let userData = null;
    try {
      const response = await axios.get(`${mainServerUrl}/api/user/${userId}`, {
        timeout: 5000,
        headers: { 'User-Agent': 'MessagingServer/1.0' }
      });

      if (response.data && response.data.data) {
        const data = response.data.data;
        userData = data;

        if (data.businessName && data.verificationStatus !== 'approved') {
          userData.businessName = null;
        }

        if ((data.accountType === 'seller' || data.role === 'seller') && data.sellerId) {
          userData.sellerId = data.sellerId;
        }
      }
    } catch (userError) {
      // User not found in users endpoint, attempt seller endpoint
      try {
        const sellerResponse = await axios.get(`${mainServerUrl}/api/admin/sellers/${userId}`, {
          timeout: 5000,
          headers: { 'User-Agent': 'MessagingServer/1.0' }
        });

        if (sellerResponse.data && sellerResponse.data.data) {
          const sellerData = sellerResponse.data.data;
          const displayName = (sellerData.verificationStatus === 'approved' && sellerData.businessName)
            ? sellerData.businessName
            : (sellerData.fullName || 'Unknown Seller');

          userData = {
            id: sellerData.userId || sellerData.id || userId,
            fullName: sellerData.fullName || displayName,
            email: sellerData.businessEmail || `${userId}@verified.ocean`,
            profilePicture: sanitizeProfilePicture(sellerData.businessLogo || sellerData.profilePicture) || null,
            role: 'seller',
            accountStatus: 'active',
            businessName: (sellerData.verificationStatus === 'approved' && sellerData.businessName)
              ? sellerData.businessName
              : null,
            sellerId: sellerData.id || sellerData.sellerId || null
          };
        }
      } catch (sellerError) {
        // Seller endpoint also failed
      }
    }

    // 3. If valid user data found, persist in UserReference
    if (userData && userData.fullName) {
      const newUser = await UserReference.create({
        id: userData.id || userId,
        fullName: userData.fullName,
        email: userData.email || `${userId}@verified.ocean`,
        password: 'synced_user_ocean',
        profilePicture: sanitizeProfilePicture(userData.profilePicture) || null,
        accountType: userData.role || userData.accountType || 'buyer',
        accountStatus: userData.accountStatus || 'active',
        username: userData.username || null,
        bio: userData.bio || null,
        location: userData.location || null,
        website: userData.website || null,
        emailVerified: userData.emailVerified || false,
        businessName: userData.businessName || null,
        sellerId: userData.sellerId || null
      });

      console.log('✅ User successfully synced from Main Server to Messaging:', newUser.id);
      return newUser;
    }

    // 4. User does not exist on main server -> DO NOT create fallback!
    console.warn(`⛔ [syncUserFromMainServer] User ${userId} does not exist on main server. Refusing to create imaginary user.`);
    return null;

  } catch (error) {
    console.error('❌ Error in syncUserFromMainServer:', error.message);
    return null;
  }
};

module.exports = {
  isValidUUID,
  syncUserFromMainServer
};
