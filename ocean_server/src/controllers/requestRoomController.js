const db = require('../../models');
const { Op } = require('sequelize');

class RequestRoomController {
  /**
   * Seller expresses interest in a buyer search insight
   * Gated: Tide and Surge plans only.
   * Limit: 3 daily slots max per seller globally.
   * Room limit: Max 10 sellers per room.
   */
  async expressInterest(req, res) {
    try {
      const { id: insightId } = req.params;
      const userId = req.user.id;

      // 1. Verify seller profile
      const seller = await db.SellersTable.findOne({
        where: { userId }
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message: 'Only registered sellers can express interest'
        });
      }

      // 2. Plan Access Check: Drift, Wave, Tide, and Surge plans allowed
      const { getUserActiveSubscription } = require('../middleware/subscriptionMiddleware');
      let activeSub = null;
      try {
        activeSub = await getUserActiveSubscription(userId);
      } catch (subErr) {
        console.warn('Subscription check warning:', subErr.message);
      }

      const planName = activeSub?.plan?.name?.toLowerCase() || '';
      // Dynamic daily slots per subscription tier: Drift=3, Wave=6, Tide=10, Surge=Unlimited
      const planLimits = { drift: 3, wave: 6, tide: 10, surge: 999999 };
      const dailySlotsTotal = planLimits[planName] || 0;

      if (dailySlotsTotal <= 0) {
        return res.status(403).json({
          success: false,
          message: 'Expressing Interest is available for subscribed sellers (Drift, Wave, Tide, and Surge). Please upgrade your plan to participate.'
        });
      }

      // 3. Daily Slot Quota Check
      const todayDate = new Date().toISOString().split('T')[0];
      let [slotRecord] = await db.SellerDailySlot.findOrCreate({
        where: { sellerId: userId },
        defaults: {
          sellerId: userId,
          dailySlotsTotal: dailySlotsTotal,
          dailySlotsUsed: 0,
          lastResetDate: todayDate
        }
      });

      // Reset daily counter if a new day has started or plan total changed
      if (slotRecord.lastResetDate !== todayDate) {
        await slotRecord.update({
          dailySlotsTotal: dailySlotsTotal,
          dailySlotsUsed: 0,
          lastResetDate: todayDate
        });
      } else if (slotRecord.dailySlotsTotal !== dailySlotsTotal) {
        await slotRecord.update({
          dailySlotsTotal: dailySlotsTotal
        });
      }

      if (planName !== 'surge' && slotRecord.dailySlotsUsed >= dailySlotsTotal) {
        return res.status(400).json({
          success: false,
          message: `Daily express interest slots exhausted. Maximum ${dailySlotsTotal} slots per day on your current plan.`
        });
      }

      // 4. Fetch Search Insight & Capacity
      const insight = await db.BuyerSearchInsight.findByPk(insightId);
      if (!insight) {
        return res.status(404).json({
          success: false,
          message: 'Buyer search insight not found'
        });
      }

      if (insight.user_id === userId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot express interest in your own search insight'
        });
      }

      if (insight.status !== 'OPEN' || insight.current_seller_count >= insight.max_seller_slots) {
        return res.status(400).json({
          success: false,
          message: 'Request room is full or no longer open'
        });
      }

      // 5. Find or Create Temporary Request Room (24 hours expiration)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      let [requestRoom] = await db.RequestRoom.findOrCreate({
        where: { insightId: insight.id },
        defaults: {
          insightId: insight.id,
          buyerId: insight.user_id || userId,
          status: 'ACTIVE',
          expiresAt: expiresAt
        }
      });

      // 6. Check if seller already expressed interest in this room
      const existingJoin = await db.RequestRoomSeller.findOne({
        where: {
          requestRoomId: requestRoom.id,
          sellerId: userId
        }
      });

      if (existingJoin) {
        return res.status(400).json({
          success: false,
          message: 'You have already expressed interest in this request room'
        });
      }

      // 7. Record interest & update counters
      await db.RequestRoomSeller.create({
        requestRoomId: requestRoom.id,
        sellerId: userId,
        joinedAt: new Date()
      });

      const updatedCount = insight.current_seller_count + 1;
      const newStatus = updatedCount >= insight.max_seller_slots ? 'CLOSED_FULL' : 'OPEN';

      await insight.update({
        current_seller_count: updatedCount,
        status: newStatus
      });

      await slotRecord.update({
        dailySlotsUsed: slotRecord.dailySlotsUsed + 1
      });

      const remainingSlots = planName === 'surge'
        ? 999999
        : Math.max(0, dailySlotsTotal - slotRecord.dailySlotsUsed);

      res.status(200).json({
        success: true,
        message: 'Interest expressed successfully',
        data: {
          roomId: requestRoom.id,
          remaining_slots: remainingSlots,
          current_seller_count: updatedCount,
          max_seller_slots: insight.max_seller_slots
        }
      });

    } catch (error) {
      console.error('Error expressing interest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to express interest',
        error: error.message
      });
    }
  }

  /**
   * Fetch seller's daily interest slots status
   */
  async getSellerDailySlots(req, res) {
    try {
      const userId = req.user.id;
      const { getUserActiveSubscription } = require('../middleware/subscriptionMiddleware');
      let activeSub = null;
      try {
        activeSub = await getUserActiveSubscription(userId);
      } catch (err) {
        console.warn('Subscription check error:', err.message);
      }

      const planName = activeSub?.plan?.name?.toLowerCase() || '';
      // Dynamic daily slots per subscription tier: Drift=3, Wave=6, Tide=10, Surge=Unlimited
      const planLimits = { drift: 3, wave: 6, tide: 10, surge: 999999 };
      const dailySlotsTotal = planLimits[planName] || 0;
      const isEligible = dailySlotsTotal > 0;

      const todayDate = new Date().toISOString().split('T')[0];
      let [slotRecord] = await db.SellerDailySlot.findOrCreate({
        where: { sellerId: userId },
        defaults: {
          sellerId: userId,
          dailySlotsTotal: dailySlotsTotal,
          dailySlotsUsed: 0,
          lastResetDate: todayDate
        }
      });

      if (slotRecord.lastResetDate !== todayDate) {
        await slotRecord.update({
          dailySlotsTotal: dailySlotsTotal,
          dailySlotsUsed: 0,
          lastResetDate: todayDate
        });
      } else if (slotRecord.dailySlotsTotal !== dailySlotsTotal) {
        await slotRecord.update({
          dailySlotsTotal: dailySlotsTotal
        });
      }

      const used = slotRecord.dailySlotsUsed;
      const remaining = planName === 'surge'
        ? 999999
        : (isEligible ? Math.max(0, dailySlotsTotal - used) : 0);

      res.json({
        success: true,
        data: {
          isEligible,
          planName: planName || 'free',
          total: dailySlotsTotal,
          used: used,
          remaining: remaining,
          lastResetDate: slotRecord.lastResetDate
        }
      });

    } catch (error) {
      console.error('Error fetching seller daily slots:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch seller daily slots',
        error: error.message
      });
    }
  }

  /**
   * Fetch temporary request room details including buyer and interested sellers list
   */
  async getRequestRoomDetails(req, res) {
    try {
      const { roomId } = req.params;

      const room = await db.RequestRoom.findByPk(roomId, {
        include: [
          {
            model: db.BuyerSearchInsight,
            as: 'insight',
            attributes: ['id', 'search_term', 'category_id', 'subcategory', 'status']
          },
          {
            model: db.UserTable,
            as: 'buyer',
            attributes: ['id', 'fullName', 'profilePicture', 'email']
          },
          {
            model: db.RequestRoomSeller,
            as: 'sellers',
            include: [
              {
                model: db.UserTable,
                as: 'seller',
                attributes: ['id', 'fullName', 'profilePicture', 'email'],
                include: [
                  {
                    model: db.SellersTable,
                    as: 'seller',
                    attributes: ['id', 'businessName', 'businessAddress', 'verificationStatus']
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Request room not found'
        });
      }

      const now = new Date();
      const expiresAt = new Date(room.expiresAt);
      const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

      const sellersList = (room.sellers || []).map(item => {
        const sellerProfile = item.seller?.seller; // SellersTable instance
        return {
          id: item.seller?.id || item.sellerId,
          businessName: sellerProfile?.businessName || item.seller?.fullName || 'Business Seller',
          fullName: item.seller?.fullName || null,
          profilePicture: item.seller?.profilePicture || null,
          verificationStatus: sellerProfile?.verificationStatus || null,
          joinedAt: item.joinedAt
        };
      });

      res.json({
        success: true,
        data: {
          id: room.id,
          insightId: room.insightId,
          searchTerm: room.insight?.search_term || '',
          category: room.insight?.category_id || null,
          subcategory: room.insight?.subcategory || null,
          buyer: room.buyer ? {
            id: room.buyer.id,
            fullName: room.buyer.fullName,
            profilePicture: room.buyer.profilePicture
          } : null,
          sellers: sellersList,
          status: room.status,
          expiresAt: room.expiresAt,
          remainingSeconds: remainingSeconds
        }
      });

    } catch (error) {
      console.error('Error fetching request room details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch request room details',
        error: error.message
      });
    }
  }

  /**
   * Buyer selects a seller from the room to initiate a 1-on-1 direct conversation
   */
  async selectSeller(req, res) {
    try {
      const { roomId } = req.params;
      const { sellerId } = req.body;
      const buyerUserId = req.user.id;

      if (!sellerId) {
        return res.status(400).json({
          success: false,
          message: 'sellerId is required in request body'
        });
      }

      const room = await db.RequestRoom.findByPk(roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Request room not found'
        });
      }

      if (room.buyerId !== buyerUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer who created this search request can select a seller'
        });
      }

      // Check if seller joined this room
      const roomSeller = await db.RequestRoomSeller.findOne({
        where: {
          requestRoomId: room.id,
          sellerId: sellerId
        }
      });

      if (!roomSeller) {
        return res.status(400).json({
          success: false,
          message: 'The selected seller has not expressed interest in this room'
        });
      }

      // Establish/Find 1-on-1 direct conversation
      let conversation = null;
      try {
        const directParticipants = await db.ConversationParticipant.findAll({
          where: { userId: [buyerUserId, sellerId] },
          attributes: ['conversationId'],
          group: ['conversationId']
        });

        if (directParticipants.length > 0) {
          const conversationIds = directParticipants.map(cp => cp.conversationId);
          conversation = await db.Conversation.findOne({
            where: {
              id: conversationIds,
              type: 'direct'
            }
          });
        }

        if (!conversation) {
          conversation = await db.Conversation.create({ type: 'direct' });
          await db.ConversationParticipant.bulkCreate([
            { conversationId: conversation.id, userId: buyerUserId, role: 'member' },
            { conversationId: conversation.id, userId: sellerId, role: 'member' }
          ]);
          console.log(`💬 Established direct conversation ${conversation.id} between buyer ${buyerUserId} and seller ${sellerId}`);
        }
      } catch (chatError) {
        console.error('Chat creation error:', chatError);
        return res.status(500).json({
          success: false,
          message: 'Failed to initiate conversation with seller',
          error: chatError.message
        });
      }

      // Mark request room completed and insight fulfilled
      await room.update({ status: 'COMPLETED' });
      await db.BuyerSearchInsight.update(
        { status: 'FULFILLED' },
        { where: { id: room.insightId } }
      );

      res.json({
        success: true,
        message: 'Seller selected successfully. Direct 1-on-1 conversation opened.',
        data: {
          chatId: conversation.id,
          sellerId: sellerId
        }
      });

    } catch (error) {
      console.error('Error selecting seller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to select seller',
        error: error.message
      });
    }
  }

  /**
   * Fetch all request rooms owned by the calling buyer
   */
  async getMyBuyerRooms(req, res) {
    try {
      const buyerUserId = req.user.id;

      const rooms = await db.RequestRoom.findAll({
        where: { buyerId: buyerUserId },
        include: [
          {
            model: db.BuyerSearchInsight,
            as: 'insight',
            attributes: ['id', 'search_term', 'category_id', 'subcategory', 'status', 'current_seller_count', 'max_seller_slots']
          },
          {
            model: db.RequestRoomSeller,
            as: 'sellers',
            attributes: ['id', 'sellerId', 'joinedAt']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      const now = new Date();
      const mappedRooms = rooms.map(room => {
        const expiresAt = new Date(room.expiresAt);
        const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        return {
          id: room.id,
          insightId: room.insightId,
          searchTerm: room.insight?.search_term || '',
          category: room.insight?.category_id || null,
          subcategory: room.insight?.subcategory || null,
          current_seller_count: room.insight?.current_seller_count || 0,
          max_seller_slots: room.insight?.max_seller_slots || 10,
          status: room.status,
          expiresAt: room.expiresAt,
          remainingSeconds: remainingSeconds
        };
      });

      res.json({
        success: true,
        data: {
          rooms: mappedRooms
        }
      });

    } catch (error) {
      console.error('Error fetching buyer rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch buyer request rooms',
        error: error.message
      });
    }
  }

  /**
   * Fetch all request rooms joined by the calling seller
   */
  async getJoinedSellerRooms(req, res) {
    try {
      const sellerUserId = req.user.id;

      const joinedRecords = await db.RequestRoomSeller.findAll({
        where: { sellerId: sellerUserId },
        include: [
          {
            model: db.RequestRoom,
            as: 'requestRoom',
            include: [
              {
                model: db.BuyerSearchInsight,
                as: 'insight',
                attributes: ['id', 'search_term', 'category_id', 'subcategory', 'status', 'current_seller_count', 'max_seller_slots']
              },
              {
                model: db.UserTable,
                as: 'buyer',
                attributes: ['id', 'fullName', 'profilePicture']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      const now = new Date();
      const mappedRooms = joinedRecords
        .map(record => {
          const room = record.requestRoom;
          if (!room) return null;
          const expiresAt = new Date(room.expiresAt);
          const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
          return {
            id: room.id,
            insightId: room.insightId,
            searchTerm: room.insight?.search_term || '',
            category: room.insight?.category_id || null,
            subcategory: room.insight?.subcategory || null,
            buyer: room.buyer ? {
              id: room.buyer.id,
              fullName: room.buyer.fullName,
              profilePicture: room.buyer.profilePicture
            } : null,
            joinedAt: record.joinedAt,
            status: room.status,
            expiresAt: room.expiresAt,
            remainingSeconds: remainingSeconds
          };
        })
        .filter(Boolean);

      res.json({
        success: true,
        data: {
          rooms: mappedRooms
        }
      });

    } catch (error) {
      console.error('Error fetching joined seller rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch seller joined rooms',
        error: error.message
      });
    }
  }
}

module.exports = new RequestRoomController();
