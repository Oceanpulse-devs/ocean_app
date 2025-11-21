const { Auction, AuctionBid, AuctionWatcher, SellersTable, UserTable, Notification } = require('../../models');
const { Op } = require('sequelize');
const axios = require('axios');
const { emitToAuction, emitToUser, emitToSeller } = require('../socket/auctionSocketHandler');

// Simple notification function
const createAuctionNotification = async (userId, title, message, type = 'auction', category = 'system') => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
      category,
      isRead: false,
      isEmailSent: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to create DM for auction winner
const createAuctionWinnerDM = async (sellerId, winnerId, auction, winningBidAmount) => {
  try {
    let messageServerUrl = process.env.MESSAGE_SERVER_URL || 'https://messageserver-production-88ba.up.railway.app';
    messageServerUrl = messageServerUrl.replace(/\/$/, '');
    
    // Get auction image
    const auctionImage = auction.images && Array.isArray(auction.images) && auction.images.length > 0
      ? auction.images[0]
      : null;

    // Build metadata for conversation
    const metadata = {
      productId: auction.id,
      productName: auction.title,
      productImage: auctionImage,
      productType: 'auction',
      auctionWin: {
        auctionId: auction.id,
        auctionTitle: auction.title,
        winningBidAmount: winningBidAmount,
        currency: 'NGN',
        endedAt: auction.endTime,
      }
    };

    // Create conversation via message server
    const response = await axios.post(
      `${messageServerUrl}/api/conversations`,
      {
        type: 'direct',
        participants: [sellerId, winnerId],
        metadata: metadata
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || 'internal-token'}`
        },
        timeout: 10000
      }
    );

    const conversationId = response.data.conversationId || response.data.id || response.data.data?.id;

    // Send system message
    if (conversationId) {
      await axios.post(
        `${messageServerUrl}/api/messages`,
        {
          conversationId,
          content: `🎉 Congratulations! You won the auction "${auction.title}" with a winning bid of ₦${winningBidAmount}. Let's coordinate the details!`,
          type: 'system',
          senderId: sellerId,
          referenceType: 'auction',
          referenceId: auction.id,
          referenceTitle: auction.title,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || 'internal-token'}`
          },
          timeout: 10000
        }
      );
      
      console.log(`✅ Created DM between seller ${sellerId} and winner ${winnerId} for auction ${auction.id}`);
    }

    return conversationId;
  } catch (error) {
    console.error('Error creating auction winner DM:', error.message);
    // Don't fail the auction ending if DM creation fails
    return null;
  }
};

class AuctionScheduler {
  /**
   * Check and end expired auctions
   */
  static async checkAndEndAuctions() {
    try {
      const now = new Date();
      
      // Find all active auctions that have passed their end time
      const expiredAuctions = await Auction.findAll({
        where: {
          status: 'active',
          endTime: {
            [Op.lte]: now
          }
        },
        include: [
          {
            model: SellersTable,
            as: 'seller',
            include: [{
              model: UserTable,
              as: 'user',
              attributes: ['id', 'fullName']
            }]
          }
        ]
      });

      if (expiredAuctions.length === 0) {
        return { ended: 0, errors: 0 };
      }

      let endedCount = 0;
      let errorCount = 0;

      for (const auction of expiredAuctions) {
        try {
          // Find the winning bid
          const winningBid = await AuctionBid.findOne({
            where: {
              auctionId: auction.id,
              isWinningBid: true,
              status: 'active'
            },
            include: [{
              model: UserTable,
              as: 'bidder',
              attributes: ['id', 'fullName']
            }]
          });

          // Update auction status
          const updateData = { status: 'ended' };
          
          if (winningBid) {
            updateData.winnerId = winningBid.bidderId;
            updateData.winningBidAmount = winningBid.bidAmount;
            
            // Update bid status
            await winningBid.update({ status: 'won' });
            
            // Create DM between seller and winner
            if (auction.seller && auction.seller.user) {
              await createAuctionWinnerDM(
                auction.seller.user.id,
                winningBid.bidderId,
                auction,
                winningBid.bidAmount
              );
            }

            // Optional: Create notification (as requested, notification is optional)
            // await createAuctionNotification(
            //   winningBid.bidderId,
            //   '🎉 You Won!',
            //   `Congratulations! You won the auction "${auction.title}" with a bid of ${winningBid.bidAmount}.`,
            //   'auction',
            //   'won'
            // );
          }

          await auction.update(updateData);

          // Emit socket events
          try {
            // Emit to auction room (status changed to ended)
            emitToAuction(auction.id, 'auction:status_changed', {
              auctionId: auction.id,
              status: 'ended',
              previousStatus: 'active',
              reason: 'time_expired'
            });

            // Emit auction ended event
            emitToAuction(auction.id, 'auction:ended', {
              auctionId: auction.id,
              auction: {
                id: auction.id,
                title: auction.title,
                status: 'ended',
                endTime: auction.endTime
              },
              winner: winningBid ? {
                id: winningBid.bidderId,
                name: winningBid.bidder.fullName,
                bidAmount: winningBid.bidAmount
              } : null
            });

            // Emit to winner if exists
            if (winningBid) {
              emitToUser(winningBid.bidderId, 'auction:ended', {
                auctionId: auction.id,
                winner: {
                  id: winningBid.bidderId,
                  bidAmount: winningBid.bidAmount
                },
                auction: {
                  id: auction.id,
                  title: auction.title
                }
              });

              emitToUser(winningBid.bidderId, 'auction:winner_selected', {
                auctionId: auction.id,
                winner: {
                  id: winningBid.bidderId,
                  bidAmount: winningBid.bidAmount
                },
                auction: {
                  id: auction.id,
                  title: auction.title
                }
              });
            }

            // Emit to seller
            if (auction.seller && auction.seller.id) {
              emitToSeller(auction.seller.id, 'auction:ended', {
                auctionId: auction.id,
                auction: {
                  id: auction.id,
                  title: auction.title,
                  status: 'ended'
                },
                winner: winningBid ? {
                  id: winningBid.bidderId,
                  name: winningBid.bidder.fullName,
                  bidAmount: winningBid.bidAmount
                } : null
              });
            }
          } catch (socketError) {
            console.error('Error emitting socket events for ended auction:', socketError);
            // Don't fail the auction ending if socket emission fails
          }

          // Notify seller (optional)
          // if (auction.seller && auction.seller.user) {
          //   const message = winningBid
          //     ? `Your auction "${auction.title}" ended. Winner: ${winningBid.bidder.fullName} (${winningBid.bidAmount})`
          //     : `Your auction "${auction.title}" ended with no bids.`;
          //   
          //   await createAuctionNotification(
          //     auction.seller.user.id,
          //     'Auction Ended',
          //     message,
          //     'auction',
          //     'ended'
          //   );
          // }

          endedCount++;
          console.log(`✅ Ended auction: ${auction.id} - ${auction.title}${winningBid ? ` (Winner: ${winningBid.bidder.fullName})` : ' (No bids)'}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Error ending auction ${auction.id}:`, error);
        }
      }

      return { ended: endedCount, errors: errorCount };
    } catch (error) {
      console.error('Error in checkAndEndAuctions:', error);
      return { ended: 0, errors: 0 };
    }
  }

  /**
   * Schedule automatic checks
   */
  static scheduleChecks() {
    // Run immediately on startup
    this.checkAndEndAuctions();

    // Schedule to run every 1 minute
    setInterval(() => {
      this.checkAndEndAuctions();
    }, 60 * 1000); // 1 minute

    console.log('⏰ Auction scheduler initialized - checking every 1 minute');
  }
}

module.exports = AuctionScheduler;

