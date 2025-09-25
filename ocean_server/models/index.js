'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const db = {};

// Use our custom database configuration
const sequelize = require(__dirname + '/../config/database');

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
const SubscriptionPlan = require('./SubscriptionPlan');
const UserSubscription = require('./UserSubscription');
const SubscriptionUsage = require('./SubscriptionUsage');
const PromotionalBoost = require('./PromotionalBoost');

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
  db.SubscriptionPlan = SubscriptionPlan(sequelize, Sequelize.DataTypes);
  db.UserSubscription = UserSubscription(sequelize, Sequelize.DataTypes);
  db.SubscriptionUsage = SubscriptionUsage(sequelize, Sequelize.DataTypes);
  db.PromotionalBoost = PromotionalBoost(sequelize, Sequelize.DataTypes);

// Set up associations
const setupAssociations = () => {
  // User associations
  db.UserTable.hasMany(db.Post, { foreignKey: 'userId', as: 'posts' });
  db.UserTable.hasMany(db.Auction, { foreignKey: 'sellerId', as: 'auctions' });
  db.UserTable.hasMany(db.GroupBuy, { foreignKey: 'creator_id', as: 'createdGroupBuys' });
  db.UserTable.hasOne(db.SellersTable, { foreignKey: 'userId', as: 'seller' });
  
  // User Follow associations
  db.UserTable.hasMany(db.UserFollows, { foreignKey: 'userId', as: 'following' });
  db.UserTable.hasMany(db.UserFollows, { foreignKey: 'followsUserId', as: 'followers' });
  
  // UserFollows associations
  db.UserFollows.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  db.UserFollows.belongsTo(db.UserTable, { foreignKey: 'followsUserId', as: 'followedUser' });
  
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
  db.Product.belongsTo(db.SellersTable, { foreignKey: 'sellerId', as: 'seller' });
  db.SellersTable.hasMany(db.Product, { foreignKey: 'sellerId', as: 'products' });
  
  // ProductCategory associations
  db.ProductCategory.hasMany(db.GroupBuy, { foreignKey: 'category_id', as: 'groupBuys' });
  
  // ProductCategory self-referencing associations for parent-child categories
  db.ProductCategory.hasMany(db.ProductCategory, { foreignKey: 'parentId', as: 'subcategories' });
  db.ProductCategory.belongsTo(db.ProductCategory, { foreignKey: 'parentId', as: 'parent' });
  
  // ProductCategory association with UserTable for custom categories
  db.ProductCategory.belongsTo(db.UserTable, { foreignKey: 'createdBy', as: 'creator' });
  
  // SavedProduct associations
  db.SavedProduct.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });
  db.SavedProduct.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  db.Product.hasMany(db.SavedProduct, { foreignKey: 'productId', as: 'savedProducts' });
  
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
  db.SellerDocument.belongsTo(db.SellersTable, { foreignKey: 'sellerId', as: 'seller' });
  
  // SellersTable associations
  db.SellersTable.belongsTo(db.UserTable, { foreignKey: 'userId', as: 'user' });
  db.SellersTable.hasMany(db.SellerDocument, { foreignKey: 'sellerId', as: 'documents' });
  
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

  // Subscription System associations
  // SubscriptionPlan associations
  db.SubscriptionPlan.hasMany(db.UserSubscription, { foreignKey: 'plan_id', as: 'subscriptions' });
  
  // UserSubscription associations
  db.UserSubscription.belongsTo(db.SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
  db.UserSubscription.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  db.UserSubscription.hasMany(db.SubscriptionUsage, { foreignKey: 'subscription_id', as: 'usage' });
  db.UserSubscription.hasMany(db.PromotionalBoost, { foreignKey: 'subscription_id', as: 'boosts' });
  
  // SubscriptionUsage associations
  db.SubscriptionUsage.belongsTo(db.UserSubscription, { foreignKey: 'subscription_id', as: 'subscription' });
  db.SubscriptionUsage.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // PromotionalBoost associations
  db.PromotionalBoost.belongsTo(db.UserSubscription, { foreignKey: 'subscription_id', as: 'subscription' });
  db.PromotionalBoost.belongsTo(db.UserTable, { foreignKey: 'user_id', as: 'user' });
  
  // UserTable subscription associations
  db.UserTable.hasMany(db.UserSubscription, { foreignKey: 'user_id', as: 'subscriptions' });
  db.UserTable.hasMany(db.SubscriptionUsage, { foreignKey: 'user_id', as: 'usageHistory' });
  db.UserTable.hasMany(db.PromotionalBoost, { foreignKey: 'user_id', as: 'boosts' });
};

// Setup associations
setupAssociations();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
