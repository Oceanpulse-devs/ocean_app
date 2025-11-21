const { Auction, AuctionWatcher, SellersTable } = require('../../models');

// Store Socket.IO instance globally (will be set from server.js)
let ioInstance = null;

// Function to set the Socket.IO instance
const setIOInstance = (io) => {
  ioInstance = io;
};

// Get the Socket.IO instance
const getIO = () => {
  if (!ioInstance) {
    console.warn('⚠️ Socket.IO instance not initialized. Events will not be emitted.');
  }
  return ioInstance;
};

// Socket handler for auction events
const auctionSocketHandler = (io, socket) => {
  console.log(`🔌 Auction socket handler initialized for user: ${socket.userId}`);

  // Join user to their personal room for notifications
  socket.join(`user:${socket.userId}`);

  // Handle joining an auction room (when user views auction detail page)
  socket.on('join_auction', async (data) => {
    try {
      const { auctionId } = data;

      if (!auctionId) {
        socket.emit('error', { message: 'Auction ID is required' });
        return;
      }

      // Verify auction exists
      const auction = await Auction.findByPk(auctionId);
      if (!auction) {
        socket.emit('error', { message: 'Auction not found' });
        return;
      }

      // Join the auction room
      socket.join(`auction:${auctionId}`);
      console.log(`👥 User ${socket.userId} joined auction room: ${auctionId}`);

      // If user is watching the auction, they're already in the room
      const watcher = await AuctionWatcher.findOne({
        where: { auctionId, userId: socket.userId }
      });

      socket.emit('joined_auction', {
        auctionId,
        isWatching: !!watcher
      });
    } catch (error) {
      console.error('Error joining auction room:', error);
      socket.emit('error', { message: 'Failed to join auction room' });
    }
  });

  // Handle leaving an auction room
  socket.on('leave_auction', (data) => {
    try {
      const { auctionId } = data;

      if (auctionId) {
        socket.leave(`auction:${auctionId}`);
        console.log(`👋 User ${socket.userId} left auction room: ${auctionId}`);
      }
    } catch (error) {
      console.error('Error leaving auction room:', error);
    }
  });

  // Handle joining seller room (for sellers to receive notifications about their auctions)
  socket.on('join_seller_room', async (data) => {
    try {
      const seller = await SellersTable.findOne({
        where: { userId: socket.userId }
      });

      if (seller) {
        socket.join(`seller:${seller.id}`);
        console.log(`👤 Seller ${socket.userId} joined seller room: ${seller.id}`);
        socket.emit('joined_seller_room', { sellerId: seller.id });
      } else {
        socket.emit('error', { message: 'User is not a seller' });
      }
    } catch (error) {
      console.error('Error joining seller room:', error);
      socket.emit('error', { message: 'Failed to join seller room' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User ${socket.userId} disconnected from auction socket`);
  });
};

// Helper functions to emit events
const emitToAuction = (auctionId, event, data) => {
  const io = getIO();
  if (io) {
    io.to(`auction:${auctionId}`).emit(event, data);
    console.log(`📡 Emitted ${event} to auction:${auctionId}`);
  }
};

const emitToUser = (userId, event, data) => {
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    console.log(`📡 Emitted ${event} to user:${userId}`);
  }
};

const emitToSeller = (sellerId, event, data) => {
  const io = getIO();
  if (io) {
    io.to(`seller:${sellerId}`).emit(event, data);
    console.log(`📡 Emitted ${event} to seller:${sellerId}`);
  }
};

const emitToAll = (event, data) => {
  const io = getIO();
  if (io) {
    io.emit(event, data);
    console.log(`📡 Emitted ${event} to all connected clients`);
  }
};

module.exports = {
  auctionSocketHandler,
  setIOInstance,
  getIO,
  emitToAuction,
  emitToUser,
  emitToSeller,
  emitToAll
};

