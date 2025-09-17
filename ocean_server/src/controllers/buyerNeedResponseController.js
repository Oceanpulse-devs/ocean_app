const db = require('../../models');
const { Op } = require('sequelize');

class BuyerNeedResponseController {
  // Create a response to a buyer need
  async createResponse(req, res) {
    try {
      const { buyer_need_id } = req.params;
      const {
        message,
        offer_price,
        currency,
        response_type,
        delivery_time,
        warranty_info,
        return_policy,
        contact_method
      } = req.body;

      const seller_id = req.user.id;

      // Validate required fields
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      // Check if buyer need exists and is active
      const buyerNeed = await db.BuyerNeed.findByPk(buyer_need_id);
      if (!buyerNeed) {
        return res.status(404).json({
          success: false,
          message: 'Buyer need not found'
        });
      }

      if (buyerNeed.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot respond to inactive buyer need'
        });
      }

      // Check if buyer need has expired
      if (buyerNeed.expires_at && new Date(buyerNeed.expires_at) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Buyer need has expired'
        });
      }

      // Check if seller is not the buyer
      if (buyerNeed.buyer_id === seller_id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot respond to your own buyer need'
        });
      }

      // Check if seller has already responded
      const existingResponse = await db.BuyerNeedResponse.findOne({
        where: { buyer_need_id, seller_id }
      });

      if (existingResponse) {
        return res.status(400).json({
          success: false,
          message: 'You have already responded to this buyer need'
        });
      }

      // Validate offer price if provided
      if (offer_price) {
        if (buyerNeed.budget_min && parseFloat(offer_price) < parseFloat(buyerNeed.budget_min)) {
          return res.status(400).json({
            success: false,
            message: 'Offer price is below buyer\'s minimum budget'
          });
        }
        if (buyerNeed.budget_max && parseFloat(offer_price) > parseFloat(buyerNeed.budget_max)) {
          return res.status(400).json({
            success: false,
            message: 'Offer price is above buyer\'s maximum budget'
          });
        }
      }

      const response = await db.BuyerNeedResponse.create({
        buyer_need_id,
        seller_id,
        message,
        offer_price: offer_price ? parseFloat(offer_price) : null,
        currency: currency || 'USD',
        response_type: response_type || 'offer',
        delivery_time,
        warranty_info,
        return_policy,
        contact_method: contact_method || 'message',
        status: 'pending'
      });

      // Increment response count on buyer need
      await buyerNeed.increment('responses_count');

      // Update buyer need status to in_progress if it was active
      if (buyerNeed.status === 'active') {
        await buyerNeed.update({ status: 'in_progress' });
      }

      res.status(201).json({
        success: true,
        message: 'Response created successfully',
        data: response
      });

    } catch (error) {
      console.error('Error creating response:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all responses for a buyer need
  async getResponsesByBuyerNeed(req, res) {
    try {
      const { buyer_need_id } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { buyer_need_id };

      if (status) whereClause.status = status;

      const { count, rows } = await db.BuyerNeedResponse.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'username', 'profilePicture', 'location']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching responses:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get a specific response by ID
  async getResponseById(req, res) {
    try {
      const { id } = req.params;

      const response = await db.BuyerNeedResponse.findByPk(id, {
        include: [
          {
            model: db.UserTable,
            as: 'seller',
            attributes: ['id', 'username', 'profilePicture', 'email', 'location']
          },
          {
            model: db.BuyerNeed,
            as: 'buyerNeed',
            attributes: ['id', 'title', 'description', 'buyer_id']
          }
        ]
      });

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Error fetching response:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update a response
  async updateResponse(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user_id = req.user.id;

      const response = await db.BuyerNeedResponse.findByPk(id);
      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      // Check if user is the seller
      if (response.seller_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the seller can update this response'
        });
      }

      // Prevent updates if response is already accepted/rejected
      if (['accepted', 'rejected'].includes(response.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update response that is already accepted or rejected'
        });
      }

      // Only allow certain fields to be updated
      const allowedUpdates = [
        'message', 'offer_price', 'delivery_time', 'warranty_info', 
        'return_policy', 'contact_method'
      ];
      const filteredUpdates = {};
      
      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredUpdates[field] = updateData[field];
        }
      });

      await response.update(filteredUpdates);

      res.json({
        success: true,
        message: 'Response updated successfully',
        data: response
      });

    } catch (error) {
      console.error('Error updating response:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Accept a response (buyer action)
  async acceptResponse(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const response = await db.BuyerNeedResponse.findByPk(id, {
        include: [{
          model: db.BuyerNeed,
          as: 'buyerNeed'
        }]
      });

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      // Check if user is the buyer
      if (response.buyerNeed.buyer_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can accept this response'
        });
      }

      // Check if response is still pending
      if (response.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Response is no longer pending'
        });
      }

      // Update response status
      await response.update({ status: 'accepted' });

      // Update buyer need status to fulfilled
      await response.buyerNeed.update({ status: 'fulfilled' });

      // Reject all other responses for this buyer need
      await db.BuyerNeedResponse.update(
        { status: 'rejected' },
        { 
          where: { 
            buyer_need_id: response.buyer_need_id,
            id: { [Op.ne]: id }
          }
        }
      );

      res.json({
        success: true,
        message: 'Response accepted successfully',
        data: response
      });

    } catch (error) {
      console.error('Error accepting response:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Reject a response (buyer action)
  async rejectResponse(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const response = await db.BuyerNeedResponse.findByPk(id, {
        include: [{
          model: db.BuyerNeed,
          as: 'buyerNeed'
        }]
      });

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      // Check if user is the buyer
      if (response.buyerNeed.buyer_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can reject this response'
        });
      }

      // Check if response is still pending
      if (response.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Response is no longer pending'
        });
      }

      await response.update({ status: 'rejected' });

      res.json({
        success: true,
        message: 'Response rejected successfully',
        data: response
      });

    } catch (error) {
      console.error('Error rejecting response:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Withdraw a response (seller action)
  async withdrawResponse(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const response = await db.BuyerNeedResponse.findByPk(id);
      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      // Check if user is the seller
      if (response.seller_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the seller can withdraw this response'
        });
      }

      // Check if response is still pending
      if (response.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot withdraw response that is no longer pending'
        });
      }

      await response.update({ status: 'withdrawn' });

      // Decrement response count on buyer need
      const buyerNeed = await db.BuyerNeed.findByPk(response.buyer_need_id);
      if (buyerNeed) {
        await buyerNeed.decrement('responses_count');
        
        // If no more responses, revert to active status
        if (buyerNeed.responses_count === 0) {
          await buyerNeed.update({ status: 'active' });
        }
      }

      res.json({
        success: true,
        message: 'Response withdrawn successfully',
        data: response
      });

    } catch (error) {
      console.error('Error withdrawing response:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get seller's responses
  async getSellerResponses(req, res) {
    try {
      const seller_id = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { seller_id };

      if (status) whereClause.status = status;

      const { count, rows } = await db.BuyerNeedResponse.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.BuyerNeed,
            as: 'buyerNeed',
            attributes: ['id', 'title', 'description', 'status', 'expires_at']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching seller responses:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Mark response as read (buyer action)
  async markResponseAsRead(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const response = await db.BuyerNeedResponse.findByPk(id, {
        include: [{
          model: db.BuyerNeed,
          as: 'buyerNeed'
        }]
      });

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      // Check if user is the buyer
      if (response.buyerNeed.buyer_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can mark this response as read'
        });
      }

      await response.update({ is_read: true });

      res.json({
        success: true,
        message: 'Response marked as read',
        data: response
      });

    } catch (error) {
      console.error('Error marking response as read:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Provide buyer feedback on response
  async provideFeedback(req, res) {
    try {
      const { id } = req.params;
      const { feedback } = req.body;
      const user_id = req.user.id;

      if (!feedback || !['positive', 'neutral', 'negative'].includes(feedback)) {
        return res.status(400).json({
          success: false,
          message: 'Valid feedback is required (positive, neutral, or negative)'
        });
      }

      const response = await db.BuyerNeedResponse.findByPk(id, {
        include: [{
          model: db.BuyerNeed,
          as: 'buyerNeed'
        }]
      });

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      // Check if user is the buyer
      if (response.buyerNeed.buyer_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can provide feedback on this response'
        });
      }

      await response.update({ buyer_feedback: feedback });

      res.json({
        success: true,
        message: 'Feedback provided successfully',
        data: response
      });

    } catch (error) {
      console.error('Error providing feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new BuyerNeedResponseController();
