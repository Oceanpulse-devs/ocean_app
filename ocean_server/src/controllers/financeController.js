const db = require('../../models');
const { Op } = require('sequelize');

class FinanceController {
  /**
   * Get financial summary (total revenue, monthly revenue, transaction count, average)
   * GET /api/admin/finances/summary
   */
  async getFinancialSummary(req, res) {
    try {
      const { period = 'all' } = req.query; // 'all', 'month', 'year'

      // Calculate date range
      let dateFilter = {};
      if (period === 'month') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        dateFilter = {
          createdAt: {
            [Op.gte]: startOfMonth
          }
        };
      } else if (period === 'year') {
        const startOfYear = new Date();
        startOfYear.setMonth(0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        dateFilter = {
          createdAt: {
            [Op.gte]: startOfYear
          }
        };
      }

      // Get total revenue (sum of all active subscriptions)
      const totalRevenueResult = await db.sequelize.query(
        `SELECT COALESCE(SUM(amount_paid), 0) as total
         FROM user_subscriptions
         WHERE status = 'active'
         AND amount_paid IS NOT NULL`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      const totalRevenue = parseFloat(totalRevenueResult[0]?.total || 0);

      // Get monthly revenue (this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const monthlyRevenueResult = await db.sequelize.query(
        `SELECT COALESCE(SUM(amount_paid), 0) as total
         FROM user_subscriptions
         WHERE status = 'active'
         AND created_at >= :startOfMonth
         AND amount_paid IS NOT NULL`,
        {
          replacements: { startOfMonth: startOfMonth.toISOString() },
          type: db.sequelize.QueryTypes.SELECT
        }
      );
      const monthlyRevenue = parseFloat(monthlyRevenueResult[0]?.total || 0);

      // Get transaction count
      const transactionCount = await db.UserSubscription.count({
        where: {
          ...dateFilter,
          status: { [Op.in]: ['active', 'expired', 'cancelled'] }
        }
      });

      // Get average transaction amount
      const avgTransactionResult = await db.sequelize.query(
        `SELECT COALESCE(AVG(amount_paid), 0) as avg
         FROM user_subscriptions
         WHERE status = 'active'
         AND amount_paid IS NOT NULL`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      const avgTransaction = parseFloat(avgTransactionResult[0]?.avg || 0);

      // Calculate growth (compare this month to last month)
      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      const endOfLastMonth = new Date(startOfMonth);
      
      const lastMonthRevenueResult = await db.sequelize.query(
        `SELECT COALESCE(SUM(amount_paid), 0) as total
         FROM user_subscriptions
         WHERE status = 'active'
         AND created_at >= :startOfLastMonth
         AND created_at < :endOfLastMonth
         AND amount_paid IS NOT NULL`,
        {
          replacements: {
            startOfLastMonth: startOfLastMonth.toISOString(),
            endOfLastMonth: endOfLastMonth.toISOString()
          },
          type: db.sequelize.QueryTypes.SELECT
        }
      );
      const lastMonthRevenue = parseFloat(lastMonthRevenueResult[0]?.total || 0);
      const growth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        data: {
          totalRevenue,
          monthlyRevenue,
          transactionCount,
          avgTransaction,
          growth: parseFloat(growth),
          currency: 'NGN'
        }
      });
    } catch (error) {
      console.error('Error getting financial summary:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get transactions list with pagination and filters
   * GET /api/admin/finances/transactions
   */
  async getTransactions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        search,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt[Op.lte] = new Date(endDate);
        }
      }

      // Search by payment reference or user email
      let includeUser = false;
      if (search) {
        includeUser = true;
        whereClause[Op.or] = [
          { paymentReference: { [Op.like]: `%${search}%` } },
          { '$user.email$': { [Op.like]: `%${search}%` } }
        ];
      }

      // Build include array
      const include = [
        {
          model: db.UserTable,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'username'],
          required: includeUser
        },
        {
          model: db.SubscriptionPlan,
          as: 'plan',
          attributes: ['id', 'name', 'price'],
          required: false
        }
      ];

      // Get transactions
      const { count, rows: transactions } = await db.UserSubscription.findAndCountAll({
        where: whereClause,
        include,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Format transactions
      const formattedTransactions = transactions.map(tx => {
        const txData = tx.toJSON();
        return {
          id: txData.id,
          userId: txData.userId,
          sellerId: txData.user?.id, // User ID as sellerId for compatibility
          amount: parseFloat(txData.amountPaid || 0),
          currency: txData.currency || 'NGN',
          status: txData.status,
          type: 'subscription', // All transactions are subscription payments
          description: txData.plan ? `Subscription: ${txData.plan.name}` : 'Subscription payment',
          paymentMethod: txData.paymentMethod || 'N/A',
          createdAt: txData.createdAt,
          completedAt: txData.status === 'active' ? txData.startDate : null,
          user: txData.user,
          plan: txData.plan,
          metadata: {
            planId: txData.planId,
            paymentReference: txData.paymentReference,
            autoRenew: txData.autoRenew
          }
        };
      });

      res.json({
        success: true,
        data: {
          transactions: formattedTransactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get revenue breakdown by period
   * GET /api/admin/finances/revenue-breakdown
   */
  async getRevenueBreakdown(req, res) {
    try {
      const { period = '30d' } = req.query; // '7d', '30d', '90d', '1y'

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get daily revenue
      const days = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
      const dailyRevenue = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

        const revenueResult = await db.sequelize.query(
          `SELECT COALESCE(SUM(amount_paid), 0) as total
           FROM user_subscriptions
           WHERE status = 'active'
           AND created_at >= :date
           AND created_at < :nextDate
           AND amount_paid IS NOT NULL`,
          {
            replacements: {
              date: date.toISOString().split('T')[0] + ' 00:00:00',
              nextDate: nextDate.toISOString().split('T')[0] + ' 00:00:00'
            },
            type: db.sequelize.QueryTypes.SELECT
          }
        );

        dailyRevenue.push({
          date: date.toISOString().split('T')[0],
          revenue: parseFloat(revenueResult[0]?.total || 0)
        });
      }

      // Get revenue by plan
      const revenueByPlanResult = await db.sequelize.query(
        `SELECT 
           sp.name as plan_name,
           sp.id as plan_id,
           COALESCE(SUM(us.amount_paid), 0) as total_revenue,
           COUNT(us.id) as subscription_count
         FROM subscription_plans sp
         LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
         WHERE us.status = 'active'
         AND us.amount_paid IS NOT NULL
         AND us.created_at >= :startDate
         GROUP BY sp.id, sp.name
         ORDER BY total_revenue DESC`,
        {
          replacements: { startDate: startDate.toISOString() },
          type: db.sequelize.QueryTypes.SELECT
        }
      );

      res.json({
        success: true,
        data: {
          dailyRevenue,
          revenueByPlan: revenueByPlanResult.map(row => ({
            planId: row.plan_id,
            planName: row.plan_name,
            revenue: parseFloat(row.total_revenue || 0),
            subscriptionCount: parseInt(row.subscription_count || 0)
          })),
          period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting revenue breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new FinanceController();

