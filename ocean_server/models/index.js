'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Add sequelize instance to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import all models
const UserTable = require('./UserTable');
const Post = require('./Post');
const PostComment = require('./PostComment');
const PostLike = require('./PostLike');
const PostMedia = require('./PostMedia');
const PostShare = require('./PostShare');
const Product = require('./Product');
const ProductCategory = require('./ProductCategory');
const SavedProduct = require('./SavedProduct');
const SavedPost = require('./SavedPost');
const UserFollows = require('./UserFollows');
const Auction = require('./Auction');
const AuctionBid = require('./AuctionBid');
const AuctionWatcher = require('./AuctionWatcher');
const Conversation = require('./Conversation');
const ConversationParticipant = require('./ConversationParticipant');
const Message = require('./Message');
const MessageReaction = require('./MessageReaction');
const Notification = require('./Notification');
const SellerDocument = require('./SellerDocument');
const SellersTable = require('./SellersTable');
const ShareStats = require('./ShareStats');
const GroupBuy = require('./GroupBuy');
const GroupBuyParticipant = require('./GroupBuyParticipant');
const SwapDeal = require('./SwapDeal');
const BuyerNeed = require('./BuyerNeed');
const BuyerNeedResponse = require('./BuyerNeedResponse');
const MarketAnalytics = require('./MarketAnalytics');
const SearchAnalytics = require('./SearchAnalytics');
const UserBehaviorAnalytics = require('./UserBehaviorAnalytics');
const AdvancedNotification = require('./AdvancedNotification');
const UserNotificationPreference = require('./UserNotificationPreference');
const NotificationTemplate = require('./NotificationTemplate');
const HeavyDistributor = require('./HeavyDistributor');
const DistributorReview = require('./DistributorReview');
const DistributorInquiry = require('./DistributorInquiry');

// Initialize all models
db.UserTable = UserTable(sequelize, Sequelize.DataTypes);
db.Post = Post(sequelize, Sequelize.DataTypes);
db.PostComment = PostComment(sequelize, Sequelize.DataTypes);
db.PostLike = PostLike(sequelize, Sequelize.DataTypes);
db.PostMedia = PostMedia(sequelize, Sequelize.DataTypes);
db.PostShare = PostShare(sequelize, Sequelize.DataTypes);
db.Product = Product(sequelize, Sequelize.DataTypes);
db.ProductCategory = ProductCategory(sequelize, Sequelize.DataTypes);
db.SavedProduct = SavedProduct(sequelize, Sequelize.DataTypes);
db.SavedPost = SavedPost(sequelize, Sequelize.DataTypes);
db.UserFollows = UserFollows(sequelize, Sequelize.DataTypes);
db.Auction = Auction(sequelize, Sequelize.DataTypes);
db.AuctionBid = AuctionBid(sequelize, Sequelize.DataTypes);
db.AuctionWatcher = AuctionWatcher(sequelize, Sequelize.DataTypes);
db.Conversation = Conversation(sequelize, Sequelize.DataTypes);
db.ConversationParticipant = ConversationParticipant(sequelize, Sequelize.DataTypes);
db.Message = Message(sequelize, Sequelize.DataTypes);
db.MessageReaction = MessageReaction(sequelize, Sequelize.DataTypes);
db.Notification = Notification(sequelize, Sequelize.DataTypes);
db.SellerDocument = SellerDocument(sequelize, Sequelize.DataTypes);
db.SellersTable = SellersTable(sequelize, Sequelize.DataTypes);
db.ShareStats = ShareStats(sequelize, Sequelize.DataTypes);
  db.GroupBuy = GroupBuy(sequelize, Sequelize.DataTypes);
  db.GroupBuyParticipant = GroupBuyParticipant(sequelize, Sequelize.DataTypes);
  db.SwapDeal = SwapDeal(sequelize, Sequelize.DataTypes);
  db.BuyerNeed = BuyerNeed(sequelize, Sequelize.DataTypes);
  db.BuyerNeedResponse = BuyerNeedResponse(sequelize, Sequelize.DataTypes);
  db.MarketAnalytics = MarketAnalytics(sequelize, Sequelize.DataTypes);
  db.SearchAnalytics = SearchAnalytics(sequelize, Sequelize.DataTypes);
  db.UserBehaviorAnalytics = UserBehaviorAnalytics(sequelize, Sequelize.DataTypes);
  db.AdvancedNotification = AdvancedNotification(sequelize, Sequelize.DataTypes);
  db.UserNotificationPreference = UserNotificationPreference(sequelize, Sequelize.DataTypes);
  db.NotificationTemplate = NotificationTemplate(sequelize, Sequelize.DataTypes);
  db.HeavyDistributor = HeavyDistributor(sequelize, Sequelize.DataTypes);
  db.DistributorReview = DistributorReview(sequelize, Sequelize.DataTypes);
  db.DistributorInquiry = DistributorInquiry(sequelize, Sequelize.DataTypes);

// Set up associations
const setupAssociations = () => {
  // User associations
  db.UserTable.hasMany(db.Post, { foreignKey: 'userId', as: 'posts' });
  db.UserTable.hasMany(db.Product, { foreignKey: 'sellerId', as: 'products' });
  db.UserTable.hasMany(db.Auction, { foreignKey: 'sellerId', as: 'auctions' });
  db.UserTable.hasMany(db.GroupBuy, { foreignKey: 'creatorId', as: 'createdGroupBuys' });
  db.UserTable.hasOne(db.SellersTable, { foreignKey: 'userId', as: 'seller' });
  
  // User Follow associations
  db.UserTable.hasMany(db.UserFollows, { foreignKey: 'userId', as: 'following' });
  db.UserTable.hasMany(db.UserFollows, { foreignKey: 'followsUserId', as: 'followers' });
  
  // Post associations
  db.Post.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  db.Post.hasMany(db.PostComment, { foreignKey: 'postId', as: 'comments' });
  db.Post.hasMany(db.PostLike, { foreignKey: 'postId', as: 'likes' });
  db.Post.hasMany(db.PostMedia, { foreignKey: 'postId', as: 'media' });
  db.Post.hasMany(db.PostShare, { foreignKey: 'postId', as: 'shares' });
  
  // PostComment associations
  db.PostComment.belongsTo(db.Post, { foreignKey: 'postId', as: 'post' });
  db.PostComment.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // PostLike associations
  db.PostLike.belongsTo(db.Post, { foreignKey: 'postId', as: 'post' });
  db.PostLike.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // PostMedia associations
  db.PostMedia.belongsTo(db.Post, { foreignKey: 'postId', as: 'post' });
  
  // PostShare associations
  db.PostShare.belongsTo(db.Post, { foreignKey: 'postId', as: 'post' });
  db.PostShare.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // Product associations
  db.Product.belongsTo(db.UserTable, { foreignKey: 'sellerId', as: 'seller' });
  
  // ProductCategory associations
  db.ProductCategory.hasMany(db.GroupBuy, { foreignKey: 'categoryId', as: 'groupBuys' });
  
  // SavedProduct associations
  db.SavedProduct.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });
  db.SavedProduct.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // SavedPost associations
  db.SavedPost.belongsTo(db.Post, { foreignKey: 'postId', as: 'post' });
  db.SavedPost.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  

  
  // Auction associations
  db.Auction.belongsTo(db.UserTable, { foreignKey: 'sellerId', as: 'seller' });
  db.Auction.hasMany(db.AuctionBid, { foreignKey: 'auctionId', as: 'bids' });
  db.Auction.hasMany(db.AuctionWatcher, { foreignKey: 'auctionId', as: 'watchers' });
  
  // AuctionBid associations
  db.AuctionBid.belongsTo(db.Auction, { foreignKey: 'auctionId', as: 'auction' });
  db.AuctionBid.belongsTo(db.UserTable, { foreignKey: 'bidderId', as: 'bidder' });
  
  // AuctionWatcher associations
  db.AuctionWatcher.belongsTo(db.Auction, { foreignKey: 'auctionId', as: 'auction' });
  db.AuctionWatcher.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // Conversation associations
  db.Conversation.hasMany(db.ConversationParticipant, { foreignKey: 'conversationId', as: 'participants' });
  db.Conversation.hasMany(db.Message, { foreignKey: 'conversationId', as: 'messages' });
  
  // ConversationParticipant associations
  db.ConversationParticipant.belongsTo(db.Conversation, { foreignKey: 'conversationId', as: 'conversation' });
  db.ConversationParticipant.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // Message associations
  db.Message.belongsTo(db.Conversation, { foreignKey: 'conversationId', as: 'conversation' });
  db.Message.belongsTo(db.UserTable, { foreignKey: 'senderId', as: 'sender' });
  db.Message.hasMany(db.MessageReaction, { foreignKey: 'messageId', as: 'reactions' });
  
  // MessageReaction associations
  db.MessageReaction.belongsTo(db.Message, { foreignKey: 'messageId', as: 'message' });
  db.MessageReaction.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // Notification associations
  db.Notification.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // SellerDocument associations
  db.SellerDocument.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // SellersTable associations
  db.SellersTable.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // GroupBuy associations
  db.GroupBuy.belongsTo(db.UserTable, { foreignKey: 'creatorId', as: 'creator' });
  db.GroupBuy.belongsTo(db.UserTable, { foreignKey: 'sellerId', as: 'seller' });
  db.GroupBuy.belongsTo(db.ProductCategory, { foreignKey: 'categoryId', as: 'groupBuyCategory' });
  db.GroupBuy.hasMany(db.GroupBuyParticipant, { foreignKey: 'groupBuyId', as: 'participants' });
  
  // GroupBuyParticipant associations
  db.GroupBuyParticipant.belongsTo(db.GroupBuy, { foreignKey: 'groupBuyId', as: 'groupBuy' });
  db.GroupBuyParticipant.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  
  // SwapDeal associations
  db.SwapDeal.belongsTo(db.UserTable, { foreignKey: 'initiatorId', as: 'initiator' });
  db.SwapDeal.belongsTo(db.UserTable, { foreignKey: 'responderId', as: 'responder' });
  db.SwapDeal.belongsTo(db.Product, { foreignKey: 'initiatorItemId', as: 'initiatorItem' });
  db.SwapDeal.belongsTo(db.Product, { foreignKey: 'responderItemId', as: 'responderItem' });

  // Buyer Need associations
  db.BuyerNeed.belongsTo(db.UserTable, { foreignKey: 'buyerId', as: 'buyer' });
  db.BuyerNeed.belongsTo(db.ProductCategory, { foreignKey: 'categoryId', as: 'category' });
  db.BuyerNeed.hasMany(db.BuyerNeedResponse, { foreignKey: 'buyerNeedId', as: 'responses' });
  
  // Buyer Need Response associations
  db.BuyerNeedResponse.belongsTo(db.BuyerNeed, { foreignKey: 'buyerNeedId', as: 'buyerNeed' });
  db.BuyerNeedResponse.belongsTo(db.UserTable, { foreignKey: 'sellerId', as: 'seller' });
  
  // User associations for buyer needs
  db.UserTable.hasMany(db.BuyerNeed, { foreignKey: 'buyerId', as: 'buyerNeeds' });
  db.UserTable.hasMany(db.BuyerNeedResponse, { foreignKey: 'sellerId', as: 'sellerResponses' });
  
  // ProductCategory associations for buyer needs
  db.ProductCategory.hasMany(db.BuyerNeed, { foreignKey: 'categoryId', as: 'buyerNeeds' });

  // Market Analytics associations
  db.MarketAnalytics.belongsTo(db.ProductCategory, { foreignKey: 'categoryId', as: 'category' });
  db.ProductCategory.hasMany(db.MarketAnalytics, { foreignKey: 'categoryId', as: 'marketMetrics' });
  
  // Search Analytics associations
  db.SearchAnalytics.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  db.SearchAnalytics.belongsTo(db.ProductCategory, { foreignKey: 'categoryId', as: 'category' });
  db.UserTable.hasMany(db.SearchAnalytics, { foreignKey: 'userId', as: 'searchHistory' });
  db.ProductCategory.hasMany(db.SearchAnalytics, { foreignKey: 'categoryId', as: 'searchAnalytics' });
  
  // User Behavior Analytics associations
  db.UserBehaviorAnalytics.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  db.UserTable.hasMany(db.UserBehaviorAnalytics, { foreignKey: 'userId', as: 'behaviorHistory' });

  // Advanced Notifications associations
  db.AdvancedNotification.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  db.UserTable.hasMany(db.AdvancedNotification, { foreignKey: 'userId', as: 'notifications' });
  
  // User Notification Preferences associations
  db.UserNotificationPreference.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  db.UserTable.hasMany(db.UserNotificationPreference, { foreignKey: 'userId', as: 'notificationPreferences' });
  
  // Heavy Distributor associations
  db.HeavyDistributor.belongsTo(db.SellersTable, { foreignKey: 'supplierId', as: 'supplier' });
  db.SellersTable.hasOne(db.HeavyDistributor, { foreignKey: 'supplierId', as: 'distributorListing' });
  
  // Distributor Review associations
  db.DistributorReview.belongsTo(db.HeavyDistributor, { foreignKey: 'distributorId', as: 'distributor' });
  db.DistributorReview.belongsTo(db.UserTable, { foreignKey: 'reviewerId', as: 'reviewer' });
  db.HeavyDistributor.hasMany(db.DistributorReview, { foreignKey: 'distributorId', as: 'reviews' });
  db.UserTable.hasMany(db.DistributorReview, { foreignKey: 'reviewerId', as: 'distributorReviews' });
  
  // Distributor Inquiry associations
  db.DistributorInquiry.belongsTo(db.HeavyDistributor, { foreignKey: 'distributorId', as: 'distributor' });
  db.DistributorInquiry.belongsTo(db.UserTable, { foreignKey: 'inquirerId', as: 'inquirer' });
  db.HeavyDistributor.hasMany(db.DistributorInquiry, { foreignKey: 'distributorId', as: 'inquiries' });
  db.UserTable.hasMany(db.DistributorInquiry, { foreignKey: 'inquirerId', as: 'distributorInquiries' });
};

// Setup associations
setupAssociations();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
