# Unified Feed System Migration

This migration implements a unified feed system where all marketplace items (products, auctions, group buys, swap deals) automatically appear in the main feed.

## 📋 What This Migration Does

### Database Changes
- **Adds 8 new columns** to the `posts` table for unified feed functionality
- **Creates 5 performance indexes** for optimal query performance
- **Creates 6 database triggers** for automatic feed post creation
- **Creates 3 update triggers** for real-time feed synchronization

### Features Implemented
- ✅ **Auto-sync**: All marketplace items automatically create feed posts
- ✅ **Content categorization**: Posts are tagged by content type (product, auction, group_buy, swap_deal, distress_sale)
- ✅ **Media handling**: Images are automatically linked to feed posts
- ✅ **Priority system**: Boosted/featured items appear first in feed
- ✅ **Real-time updates**: Changes to items sync back to feed posts

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)

```bash
# Make the script executable
chmod +x deploy-unified-feed.sh

# Run the deployment script
./deploy-unified-feed.sh
```

### Option 2: Manual Deployment

```bash
# Run the migration directly
node run-unified-feed-migration.js
```

### Option 3: Direct SQL Execution

```bash
# Execute the SQL file directly on your database
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < migrations/2024-12-19-unified-feed-system.sql
```

## 🔧 Environment Variables

The migration uses these environment variables (Railway provides these automatically):

```bash
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_PORT=3306
```

## 📊 Migration Contents

### 1. Posts Table Schema Changes
- `content_type` - Type of content (post, product, group_buy, swap_deal, auction, distress_sale)
- `source_id` - ID of the original item
- `source_table` - Original table name
- `auto_generated` - Whether auto-created
- `original_created_at` - Original creation date
- `feed_metadata` - Additional metadata in JSON
- `feed_visible` - Show in feed
- `feed_priority` - Priority score for ordering

### 2. Database Triggers
- `tr_product_to_feed` - Creates feed post when product is created
- `tr_auction_to_feed` - Creates feed post when auction is created
- `tr_group_buy_to_feed` - Creates feed post when group buy is created
- `tr_swap_deal_to_feed` - Creates feed post when swap deal is created
- `tr_product_update_feed` - Updates feed post when product changes
- `tr_auction_update_feed` - Updates feed post when auction changes
- `tr_group_buy_update_feed` - Updates feed post when group buy changes

### 3. Performance Indexes
- `idx_posts_content_type` - Content type filtering
- `idx_posts_source` - Source table and ID lookup
- `idx_posts_feed_visible` - Feed visibility filtering
- `idx_posts_feed_priority` - Priority-based ordering
- `idx_posts_auto_generated` - Auto-generated post filtering

## 🧪 Testing the Migration

After deployment, test the system by:

1. **Create a product** → Should appear in `/api/home-feed` with `contentType: 'product'`
2. **Create an auction** → Should appear in `/api/home-feed` with `contentType: 'auction'`
3. **Create a group buy** → Should appear in `/api/home-feed` with `contentType: 'group_buy'`
4. **Create a swap deal** → Should appear in `/api/home-feed` with `contentType: 'swap_deal'`
5. **Create a distress sale** → Should appear in `/api/home-feed` with `contentType: 'distress_sale'`

## 🔍 Verification Queries

Run these queries to verify the migration:

```sql
-- Check new columns
DESCRIBE posts;

-- Check triggers
SHOW TRIGGERS LIKE '%feed%';

-- Check indexes
SHOW INDEX FROM posts;

-- Check auto-generated posts
SELECT content_type, COUNT(*) as count 
FROM posts 
WHERE auto_generated = TRUE 
GROUP BY content_type;
```

## 🚨 Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS tr_product_to_feed;
DROP TRIGGER IF EXISTS tr_auction_to_feed;
DROP TRIGGER IF EXISTS tr_group_buy_to_feed;
DROP TRIGGER IF EXISTS tr_swap_deal_to_feed;
DROP TRIGGER IF EXISTS tr_product_update_feed;
DROP TRIGGER IF EXISTS tr_auction_update_feed;
DROP TRIGGER IF EXISTS tr_group_buy_update_feed;

-- Drop indexes
DROP INDEX IF EXISTS idx_posts_content_type ON posts;
DROP INDEX IF EXISTS idx_posts_source ON posts;
DROP INDEX IF EXISTS idx_posts_feed_visible ON posts;
DROP INDEX IF EXISTS idx_posts_feed_priority ON posts;
DROP INDEX IF EXISTS idx_posts_auto_generated ON posts;

-- Drop columns (be careful - this will delete data!)
ALTER TABLE posts DROP COLUMN content_type;
ALTER TABLE posts DROP COLUMN source_id;
ALTER TABLE posts DROP COLUMN source_table;
ALTER TABLE posts DROP COLUMN auto_generated;
ALTER TABLE posts DROP COLUMN original_created_at;
ALTER TABLE posts DROP COLUMN feed_metadata;
ALTER TABLE posts DROP COLUMN feed_visible;
ALTER TABLE posts DROP COLUMN feed_priority;
```

## 📞 Support

If you encounter any issues:

1. Check the error messages in the migration output
2. Verify your database connection settings
3. Ensure you have the necessary permissions
4. Check that the required tables exist (products, auctions, group_buys, swap_deals, posts, postmedia)

## 🎉 Success!

Once deployed, your unified feed system will:

- **Automatically sync** all marketplace items to the main feed
- **Categorize content** by type for proper display
- **Handle media** automatically
- **Prioritize content** based on boost/feature status
- **Update in real-time** when items change

The system is now ready for production! 🚀
