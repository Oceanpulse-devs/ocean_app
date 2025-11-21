const { Auction, AuctionBid, UserTable, Notification } = require('../../models');
const { Op } = require('sequelize');
const { emitToAuction, emitToUser } = require('../socket/auctionSocketHandler');

// Simple notification function (same as in auctionController)
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
    console.log(`📧 Auto-bid notification created for user ${userId}: ${title}`);
  } catch (error) {
    console.error('Error creating auto-bid notification:', error);
  }
};

class AutoBidService {
  /**
   * Process auto-bids for outbid users
   * @param {string} auctionId - The auction ID
   * @param {number} newCurrentPrice - The new current price after manual bid
   * @param {number} minimumBidIncrement - Minimum bid increment for the auction
   * @param {string} auctionTitle - Auction title for notifications
   * @returns {Promise<{bidsPlaced: number, finalPrice: number, iterations: number}>}
   */
  static async processAutoBids(auctionId, newCurrentPrice, minimumBidIncrement, auctionTitle) {
    const MAX_ITERATIONS = 10; // Prevent infinite loops
    let iterations = 0;
    let currentPrice = parseFloat(newCurrentPrice);
    let bidsPlaced = [];
    
    console.log(`🤖 Starting auto-bid processing for auction ${auctionId}, current price: ${currentPrice}`);
    
    while (iterations < MAX_ITERATIONS) {
      iterations++;
      console.log(`🤖 Auto-bid iteration ${iterations}, current price: ${currentPrice}`);
      
      // Find all outbid bidders with active auto-bids that can still bid
      const autoBidders = await AuctionBid.findAll({
        where: {
          auctionId,
          isAutoBid: true,
          status: 'outbid',
          maxAutoBidAmount: {
            [Op.gte]: currentPrice + minimumBidIncrement
          }
        },
        include: [{
          model: UserTable,
          as: 'bidder',
          attributes: ['id', 'fullName']
        }],
        order: [
          ['maxAutoBidAmount', 'DESC'], // Highest max first
          ['createdAt', 'ASC'] // Then earliest
        ]
      });
      
      if (autoBidders.length === 0) {
        console.log(`🤖 No more eligible auto-bidders, stopping at iteration ${iterations}`);
        break; // No more auto-bids to process
      }
      
      console.log(`🤖 Found ${autoBidders.length} eligible auto-bidders`);
      
      let roundBidsPlaced = 0;
      
      // Process each eligible auto-bidder
      for (const autoBid of autoBidders) {
        const maxAmount = parseFloat(autoBid.maxAutoBidAmount);
        const nextBidAmount = Math.min(
          currentPrice + minimumBidIncrement,
          maxAmount
        );
        
        // Only bid if it's higher than current price and within max
        if (nextBidAmount > currentPrice && nextBidAmount <= maxAmount) {
          try {
            // Reload auction to get latest price
            const auction = await Auction.findByPk(auctionId);
            if (!auction || auction.status !== 'active') {
              console.log(`🤖 Auction ${auctionId} is no longer active, stopping auto-bid processing`);
              break;
            }
            
            // Double-check current price hasn't changed
            const actualCurrentPrice = parseFloat(auction.currentPrice);
            if (nextBidAmount <= actualCurrentPrice) {
              console.log(`🤖 Skipping auto-bid: calculated amount ${nextBidAmount} <= current price ${actualCurrentPrice}`);
              continue;
            }
            
            // Place the auto-bid
            const newBid = await AuctionBid.create({
              auctionId,
              bidderId: autoBid.bidderId,
              bidAmount: nextBidAmount,
              isAutoBid: true,
              maxAutoBidAmount: autoBid.maxAutoBidAmount,
              ipAddress: 'system',
              userAgent: 'auto-bid-service'
            });
            
            console.log(`🤖 Auto-bid placed: User ${autoBid.bidderId} bid ₦${nextBidAmount} (max: ₦${maxAmount})`);
            
            // Update auction
            await auction.update({
              currentPrice: nextBidAmount,
              totalBids: auction.totalBids + 1
            });
            
            // Update unique bidders count
            const uniqueBidders = await AuctionBid.count({
              where: { auctionId },
              distinct: true,
              col: 'bidderId'
            });
            await auction.update({ uniqueBidders });
            
            // Check if reserve is met
            if (auction.reservePrice && nextBidAmount >= auction.reservePrice && !auction.isReserveMet) {
              await auction.update({ isReserveMet: true });
            }
            
            // Update previous winning bid status
            await AuctionBid.update(
              { status: 'outbid', isWinningBid: false },
              {
                where: {
                  auctionId,
                  id: { [Op.ne]: newBid.id },
                  status: 'active'
                }
              }
            );
            
            // Set new bid as winning
            await newBid.update({ isWinningBid: true, status: 'active' });
            
            // Check if auto-bid limit reached
            const isLimitReached = nextBidAmount >= maxAmount;
            
            // Notify user
            await createAuctionNotification(
              autoBid.bidderId,
              isLimitReached 
                ? 'Auto-Bid Limit Reached'
                : 'Auto-Bid Placed',
              isLimitReached
                ? `Your auto-bid reached its maximum (₦${maxAmount.toFixed(2)}) on "${auctionTitle}". Current price: ₦${nextBidAmount.toFixed(2)}`
                : `Your auto-bid placed a bid of ₦${nextBidAmount.toFixed(2)} on "${auctionTitle}". Current price: ₦${nextBidAmount.toFixed(2)}`,
              'auction',
              'auto_bid'
            );

            // Emit socket events
            try {
              // Reload auction to get updated values
              await auction.reload();

              // Emit auto-bid placed event to auction room
              emitToAuction(auctionId, 'auction:auto_bid_placed', {
                auctionId,
                bid: {
                  id: newBid.id,
                  bidderId: autoBid.bidderId,
                  bidAmount: nextBidAmount,
                  isAutoBid: true,
                  isLimitReached,
                  createdAt: newBid.createdAt
                },
                currentPrice: nextBidAmount,
                totalBids: auction.totalBids,
                uniqueBidders: auction.uniqueBidders,
                isReserveMet: auction.isReserveMet
              });

              // Emit price update
              emitToAuction(auctionId, 'auction:price_updated', {
                auctionId,
                currentPrice: nextBidAmount,
                totalBids: auction.totalBids,
                uniqueBidders: auction.uniqueBidders
              });

              // Emit to auto-bidder
              emitToUser(autoBid.bidderId, 'auction:auto_bid_placed', {
                auctionId,
                bid: {
                  id: newBid.id,
                  bidAmount: nextBidAmount,
                  isLimitReached
                },
                auction: {
                  id: auction.id,
                  title: auctionTitle
                }
              });
            } catch (socketError) {
              console.error('Error emitting socket events for auto-bid:', socketError);
              // Don't fail the auto-bid if socket emission fails
            }
            
            bidsPlaced.push({
              bidderId: autoBid.bidderId,
              bidderName: autoBid.bidder?.fullName || 'Unknown',
              amount: nextBidAmount,
              isLimitReached
            });
            
            currentPrice = nextBidAmount;
            roundBidsPlaced++;
          } catch (error) {
            console.error(`❌ Error placing auto-bid for user ${autoBid.bidderId}:`, error);
            // Continue with next auto-bidder
          }
        } else {
          console.log(`🤖 Skipping auto-bid: User ${autoBid.bidderId} - next amount ${nextBidAmount} not valid (current: ${currentPrice}, max: ${maxAmount})`);
        }
      }
      
      // If no bids were placed this round, break
      if (roundBidsPlaced === 0) {
        console.log(`🤖 No bids placed in iteration ${iterations}, stopping`);
        break;
      }
      
      console.log(`🤖 Iteration ${iterations} complete: ${roundBidsPlaced} bids placed, new price: ${currentPrice}`);
    }
    
    if (iterations >= MAX_ITERATIONS) {
      console.warn(`⚠️ Auto-bid processing reached max iterations (${MAX_ITERATIONS}) for auction ${auctionId}`);
    }
    
    console.log(`✅ Auto-bid processing complete: ${bidsPlaced.length} total bids placed, final price: ₦${currentPrice.toFixed(2)}`);
    
    return {
      bidsPlaced: bidsPlaced.length,
      finalPrice: currentPrice,
      iterations,
      bids: bidsPlaced
    };
  }
}

module.exports = AutoBidService;

