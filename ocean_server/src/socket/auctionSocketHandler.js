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

  // Helper function to get and emit active viewer count
  const emitActiveViewerCount = (auctionId) => {
    const io = getIO();
    if (!io) return;
    
    const room = io.sockets.adapter.rooms.get(`auction:${auctionId}`);
    const activeViewerCount = room ? room.size : 0;
    
    // Emit to all users in the auction room
    io.to(`auction:${auctionId}`).emit('auction:viewer_count_updated', {
      auctionId,
      activeViewerCount
    });
    
    console.log(`👁️ Active viewers for auction ${auctionId}: ${activeViewerCount}`);
  };

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

      // Get active viewer count and emit - use a small delay to ensure room is updated
      // Socket.IO's join() is synchronous but room updates might need a moment
      setTimeout(() => {
        const io = getIO();
        const room = io?.sockets.adapter.rooms.get(`auction:${auctionId}`);
        const activeViewerCount = room ? room.size : 1; // Default to 1 if room doesn't exist yet
        
        socket.emit('joined_auction', {
          auctionId,
          isWatching: !!watcher,
          activeViewerCount
        });
        
        // Emit updated viewer count to all users in the room
        emitActiveViewerCount(auctionId);
      }, 100); // Small delay to ensure room is fully updated
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
        
        // Emit updated viewer count after leaving
        emitActiveViewerCount(auctionId);
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
    // Note: Socket.IO automatically removes disconnected sockets from rooms,
    // so we don't need to manually emit viewer count updates here
    // The room size will be updated automatically on the next join/leave
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

