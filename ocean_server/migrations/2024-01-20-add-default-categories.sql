-- Migration: Add default product categories
-- Date: 2024-01-20
-- Description: Add default categories for the app

-- Create product_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parentId INT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    sortOrder INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parentId) REFERENCES product_categories(id) ON DELETE CASCADE
);

-- Insert default categories
INSERT IGNORE INTO product_categories (name, description, icon, parentId, sortOrder) VALUES
-- Main Categories
('Electronics', 'Electronic devices and gadgets', '📱', NULL, 1),
('Fashion', 'Clothing, shoes, and accessories', '👗', NULL, 2),
('Home & Garden', 'Home improvement and garden items', '🏠', NULL, 3),
('Automotive', 'Cars, motorcycles, and auto parts', '🚗', NULL, 4),
('Sports', 'Sports equipment and fitness gear', '⚽', NULL, 5),
('Books', 'Books, magazines, and educational materials', '📚', NULL, 6),
('Health & Beauty', 'Health products and beauty items', '💄', NULL, 7),
('Toys & Games', 'Toys, games, and entertainment', '🎮', NULL, 8),
('Jewelry', 'Jewelry and watches', '💍', NULL, 9),
('Art & Collectibles', 'Art, antiques, and collectibles', '🎨', NULL, 10);

-- Insert Electronics subcategories
INSERT IGNORE INTO product_categories (name, description, icon, parentId, sortOrder) VALUES
('Smartphones', 'Mobile phones and accessories', '📱', 1, 1),
('Laptops', 'Laptops and computers', '💻', 1, 2),
('Tablets', 'Tablets and e-readers', '📱', 1, 3),
('Audio', 'Headphones, speakers, and audio equipment', '🎧', 1, 4),
('Gaming', 'Gaming consoles and accessories', '🎮', 1, 5),
('Cameras', 'Cameras and photography equipment', '📷', 1, 6);

-- Insert Fashion subcategories
INSERT IGNORE INTO product_categories (name, description, icon, parentId, sortOrder) VALUES
('Men\'s Clothing', 'Men\'s apparel and accessories', '👔', 2, 1),
('Women\'s Clothing', 'Women\'s apparel and accessories', '👗', 2, 2),
('Shoes', 'Footwear for men and women', '👟', 2, 3),
('Bags', 'Handbags, backpacks, and luggage', '👜', 2, 4),
('Accessories', 'Jewelry, watches, and other accessories', '⌚', 2, 5);


