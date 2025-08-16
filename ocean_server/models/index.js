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

// Set up associations
const setupAssociations = () => {
  // User associations
  db.UserTable.hasMany(db.Post, { foreignKey: 'user_id', as: 'posts' });
  db.UserTable.hasMany(db.Product, { foreignKey: 'seller_id', as: 'products' });
  db.UserTable.hasMany(db.Auction, { foreignKey: 'seller_id', as: 'auctions' });
  db.UserTable.hasMany(db.GroupBuy, { foreignKey: 'creator_id', as: 'createdGroupBuys' });
  db.UserTable.hasOne(db.SellersTable, { foreignKey: 'userId', as: 'seller' });
  
  // User Follow associations
  db.UserTable.hasMany(db.UserFollows, { foreignKey: 'userId', as: 'following' });
  db.UserTable.hasMany(db.UserFollows, { foreignKey: 'followsUserId', as: 'followers' });
  
  // Post associations
  db.Post.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  db.Post.hasMany(db.PostComment, { foreignKey: 'post_id', as: 'comments' });
  db.Post.hasMany(db.PostLike, { foreignKey: 'post_id', as: 'likes' });
  db.Post.hasMany(db.PostMedia, { foreignKey: 'post_id', as: 'media' });
  db.Post.hasMany(db.PostShare, { foreignKey: 'post_id', as: 'shares' });
  
  // PostComment associations
  db.PostComment.belongsTo(db.Post, { foreignKey: 'post_id', as: 'post' });
  db.PostComment.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // PostLike associations
  db.PostLike.belongsTo(db.Post, { foreignKey: 'post_id', as: 'post' });
  db.PostLike.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // PostMedia associations
  db.PostMedia.belongsTo(db.Post, { foreignKey: 'post_id', as: 'post' });
  
  // PostShare associations
  db.PostShare.belongsTo(db.Post, { foreignKey: 'post_id', as: 'post' });
  db.PostShare.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // Product associations
  db.Product.belongsTo(db.UserTable, { foreignKey: 'seller_id', as: 'seller' });
  
  // ProductCategory associations
  db.ProductCategory.hasMany(db.GroupBuy, { foreignKey: 'category_id', as: 'groupBuys' });
  
  // SavedProduct associations
  db.SavedProduct.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' });
  db.SavedProduct.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // SavedPost associations
  db.SavedPost.belongsTo(db.Post, { foreignKey: 'post_id', as: 'post' });
  db.SavedPost.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  

  
  // Auction associations
  db.Auction.belongsTo(db.UserTable, { foreignKey: 'seller_id', as: 'seller' });
  db.Auction.hasMany(db.AuctionBid, { foreignKey: 'auction_id', as: 'bids' });
  db.Auction.hasMany(db.AuctionWatcher, { foreignKey: 'auction_id', as: 'watchers' });
  
  // AuctionBid associations
  db.AuctionBid.belongsTo(db.Auction, { foreignKey: 'auction_id', as: 'auction' });
  db.AuctionBid.belongsTo(db.UserTable, { foreignKey: 'bidder_id', as: 'bidder' });
  
  // AuctionWatcher associations
  db.AuctionWatcher.belongsTo(db.Auction, { foreignKey: 'auction_id', as: 'auction' });
  db.AuctionWatcher.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // Conversation associations
  db.Conversation.hasMany(db.ConversationParticipant, { foreignKey: 'conversation_id', as: 'participants' });
  db.Conversation.hasMany(db.Message, { foreignKey: 'conversation_id', as: 'messages' });
  
  // ConversationParticipant associations
  db.ConversationParticipant.belongsTo(db.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
  db.ConversationParticipant.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // Message associations
  db.Message.belongsTo(db.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
  db.Message.belongsTo(db.UserTable, { foreignKey: 'sender_id', as: 'sender' });
  db.Message.hasMany(db.MessageReaction, { foreignKey: 'message_id', as: 'reactions' });
  
  // MessageReaction associations
  db.MessageReaction.belongsTo(db.Message, { foreignKey: 'message_id', as: 'message' });
  db.MessageReaction.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // Notification associations
  db.Notification.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // SellerDocument associations
  db.SellerDocument.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // SellersTable associations
  db.SellersTable.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // GroupBuy associations
  db.GroupBuy.belongsTo(db.UserTable, { foreignKey: 'creator_id', as: 'creator' });
  db.GroupBuy.belongsTo(db.UserTable, { foreignKey: 'seller_id', as: 'seller' });
  db.GroupBuy.belongsTo(db.ProductCategory, { foreignKey: 'category_id', as: 'groupBuyCategory' });
  db.GroupBuy.hasMany(db.GroupBuyParticipant, { foreignKey: 'group_buy_id', as: 'participants' });
  
  // GroupBuyParticipant associations
  db.GroupBuyParticipant.belongsTo(db.GroupBuy, { foreignKey: 'group_buy_id', as: 'groupBuy' });
  db.GroupBuyParticipant.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // SwapDeal associations
  db.SwapDeal.belongsTo(db.UserTable, { foreignKey: 'initiator_id', as: 'initiator' });
  db.SwapDeal.belongsTo(db.UserTable, { foreignKey: 'responder_id', as: 'responder' });
  db.SwapDeal.belongsTo(db.Product, { foreignKey: 'initiator_item_id', as: 'initiatorItem' });
  db.SwapDeal.belongsTo(db.Product, { foreignKey: 'responder_item_id', as: 'responderItem' });

  // Buyer Need associations
  db.BuyerNeed.belongsTo(db.UserTable, { foreignKey: 'buyer_id', as: 'buyer' });
  db.BuyerNeed.belongsTo(db.ProductCategory, { foreignKey: 'category_id', as: 'category' });
  db.BuyerNeed.hasMany(db.BuyerNeedResponse, { foreignKey: 'buyer_need_id', as: 'responses' });
  
  // Buyer Need Response associations
  db.BuyerNeedResponse.belongsTo(db.BuyerNeed, { foreignKey: 'buyer_need_id', as: 'buyerNeed' });
  db.BuyerNeedResponse.belongsTo(db.UserTable, { foreignKey: 'seller_id', as: 'seller' });
  
  // User associations for buyer needs
  db.UserTable.hasMany(db.BuyerNeed, { foreignKey: 'buyer_id', as: 'buyerNeeds' });
  db.UserTable.hasMany(db.BuyerNeedResponse, { foreignKey: 'seller_id', as: 'sellerResponses' });
  
  // ProductCategory associations for buyer needs
  db.ProductCategory.hasMany(db.BuyerNeed, { foreignKey: 'category_id', as: 'buyerNeeds' });

  // Market Analytics associations
  db.MarketAnalytics.belongsTo(db.ProductCategory, { foreignKey: 'category_id', as: 'category' });
  db.ProductCategory.hasMany(db.MarketAnalytics, { foreignKey: 'category_id', as: 'marketMetrics' });
  
  // Search Analytics associations
  db.SearchAnalytics.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  db.SearchAnalytics.belongsTo(db.ProductCategory, { foreignKey: 'category_id', as: 'category' });
  db.UserTable.hasMany(db.SearchAnalytics, { foreignKey: 'user_id', as: 'searchHistory' });
  db.ProductCategory.hasMany(db.SearchAnalytics, { foreignKey: 'category_id', as: 'searchAnalytics' });
  
  // User Behavior Analytics associations
  db.UserBehaviorAnalytics.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  db.UserTable.hasMany(db.UserBehaviorAnalytics, { foreignKey: 'user_id', as: 'behaviorHistory' });

  // Advanced Notifications associations
  db.AdvancedNotification.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  db.UserTable.hasMany(db.AdvancedNotification, { foreignKey: 'user_id', as: 'notifications' });
  
  // User Notification Preferences associations
  db.UserNotificationPreference.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  db.UserTable.hasMany(db.UserNotificationPreference, { foreignKey: 'user_id', as: 'notificationPreferences' });
};

// Setup associations
setupAssociations();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
