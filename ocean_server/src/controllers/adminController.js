const {UserTable, SellersTable, SellerDocument} = require('../../models')
const { sendSellerApplicationNotification, sendAccountStatusNotification, sendAdminNotification } = require('./notificationController')

// Admin functions for seller management
const approveSeller = async(req,res)=>{
    const {sellerId, adminNotes} = req.body;

    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        if(!sellerId){
            return res.status(400).json({message:"Seller ID is required"})
        }

        const seller = await SellersTable.findOne({where: {id: sellerId}});
        if(!seller){
            return res.status(404).json({message:"Seller not found"})
        }

        if(seller.verificationStatus === 'approved'){
            return res.status(400).json({message:"Seller is already approved"})
        }

        // Update seller verification status
        await SellersTable.update({
            verificationStatus: 'approved',
            verifiedAt: new Date(),
            isVerified: true
        }, {where: {id: sellerId}});

        // Update seller document status
        await SellerDocument.update({
            status: 'approved',
            verifiedAt: new Date()
        }, {where: {sellerId: sellerId}});

        // Update user account type
        await UserTable.update({
            accountType: 'seller'
        }, {where: {id: seller.userId}});

        // Send notification to seller
        await sendSellerApplicationNotification(seller.userId, 'approved');

        res.status(200).json({
            message: "Seller approved successfully",
            sellerId: sellerId
        });
    } catch (error) {
        res.status(500).json({message:"Error approving seller", error: error.message})
    }
};

const rejectSeller = async(req,res)=>{
    const {sellerId, rejectionReason, adminNotes} = req.body;

    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        if(!sellerId || !rejectionReason){
            return res.status(400).json({message:"Seller ID and rejection reason are required"})
        }

        const seller = await SellersTable.findOne({where: {id: sellerId}});
        if(!seller){
            return res.status(404).json({message:"Seller not found"})
        }

        if(seller.verificationStatus === 'rejected'){
            return res.status(400).json({message:"Seller is already rejected"})
        }

        // Update seller verification status
        await SellersTable.update({
            verificationStatus: 'rejected',
            verifiedAt: new Date()
        }, {where: {id: sellerId}});

        // Update seller document status
        await SellerDocument.update({
            status: 'rejected',
            verifiedAt: new Date()
        }, {where: {sellerId: sellerId}});

        // Update user account type back to buyer
        await UserTable.update({
            accountType: 'buyer'
        }, {where: {id: seller.userId}});

        // Send notification to seller
        await sendSellerApplicationNotification(seller.userId, 'rejected', rejectionReason);

        res.status(200).json({
            message: "Seller rejected successfully",
            sellerId: sellerId,
            rejectionReason: rejectionReason
        });
    } catch (error) {
        res.status(500).json({message:"Error rejecting seller", error: error.message})
    }
};

const getPendingSellers = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const pendingSellers = await SellersTable.findAll({
            where: {verificationStatus: 'pending'},
            include: [{
                model: SellerDocument,
                as: 'documents',
                attributes: ['documentType', 'documentNumber', 'documentImage', 'status', 'submittedAt']
            }],
            order: [['createdAt', 'ASC']]
        });

        res.status(200).json({
            message: "Pending sellers retrieved successfully",
            sellers: pendingSellers
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving pending sellers", error: error.message})
    }
};

// Get all sellers (admin only)
const getAllSellers = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const { status, category, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};
        if(status) whereClause.verificationStatus = status;
        if(category) whereClause.category = category;

        const sellers = await SellersTable.findAndCountAll({
            where: whereClause,
            include: [{
                model: SellerDocument,
                as: 'documents',
                attributes: ['documentType', 'documentNumber', 'status', 'submittedAt']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.status(200).json({
            message: "Sellers retrieved successfully",
            sellers: sellers.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(sellers.count / limit),
                totalSellers: sellers.count,
                sellersPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving sellers", error: error.message})
    }
};

// Get seller details by ID (admin only)
const getSellerById = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const { sellerId } = req.params;

        const seller = await SellersTable.findOne({
            where: { id: sellerId },
            include: [{
                model: SellerDocument,
                as: 'documents',
                attributes: ['documentType', 'documentNumber', 'documentImage', 'status', 'submittedAt', 'verifiedAt']
            }]
        });

        if(!seller){
            return res.status(404).json({message:"Seller not found"})
        }

        res.status(200).json({
            message: "Seller details retrieved successfully",
            seller: seller
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving seller details", error: error.message})
    }
};

// Suspend/Activate seller (admin only)
const toggleSellerStatus = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const { sellerId, action, reason } = req.body;

        if(!sellerId || !action){
            return res.status(400).json({message:"Seller ID and action are required"})
        }

        if(!['suspend', 'activate'].includes(action)){
            return res.status(400).json({message:"Action must be 'suspend' or 'activate'"})
        }

        const seller = await SellersTable.findOne({where: {id: sellerId}});
        if(!seller){
            return res.status(404).json({message:"Seller not found"})
        }

        const newStatus = action === 'suspend' ? 'suspended' : 'active';
        
        // Update seller status
        await SellersTable.update({
            verificationStatus: newStatus,
            verifiedAt: new Date()
        }, {where: {id: sellerId}});

        // Update user account status
        const userStatus = action === 'suspend' ? 'suspended' : 'active';
        await UserTable.update({
            accountStatus: userStatus
        }, {where: {id: seller.userId}});

        // Send notification to seller
        await sendAccountStatusNotification(seller.userId, action, reason);

        res.status(200).json({
            message: `Seller ${action}d successfully`,
            sellerId: sellerId,
            action: action,
            reason: reason
        });
    } catch (error) {
        res.status(500).json({message:"Error updating seller status", error: error.message})
    }
};

// Get all users (admin only)
const getAllUsers = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const { status, accountType, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};
        if(status) whereClause.accountStatus = status;
        if(accountType) whereClause.accountType = accountType;

        const users = await UserTable.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'fullName', 'email', 'accountType', 'accountStatus', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.status(200).json({
            message: "Users retrieved successfully",
            users: users.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(users.count / limit),
                totalUsers: users.count,
                usersPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving users", error: error.message})
    }
};

// Get user details by ID (admin only)
const getUserById = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const { userId } = req.params;

        const user = await UserTable.findOne({
            where: { id: userId },
            attributes: ['id', 'fullName', 'email', 'accountType', 'accountStatus', 'phoneNumber', 'address', 'country', 'state', 'createdAt']
        });

        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        // If user is a seller, get seller details too
        let sellerDetails = null;
        if(user.accountType === 'seller' || user.accountType === 'pending-seller') {
            sellerDetails = await SellersTable.findOne({
                where: { userId: userId },
                include: [{
                    model: SellerDocument,
                    as: 'documents',
                    attributes: ['documentType', 'documentNumber', 'status', 'submittedAt']
                }]
            });
        }

        res.status(200).json({
            message: "User details retrieved successfully",
            user: {
                ...user.toJSON(),
                sellerDetails
            }
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving user details", error: error.message})
    }
};

// Toggle user account status (suspend/activate any user)
const toggleUserStatus = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const { userId, action, reason } = req.body;

        if(!userId || !action){
            return res.status(400).json({message:"User ID and action are required"})
        }

        if(!['suspend', 'activate'].includes(action)){
            return res.status(400).json({message:"Action must be 'suspend' or 'activate'"})
        }

        const user = await UserTable.findOne({where: {id: userId}});
        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        // Prevent admin from suspending themselves
        if(userId === req.user.id){
            return res.status(400).json({message:"You cannot suspend your own account"})
        }

        const newStatus = action === 'suspend' ? 'suspended' : 'active';
        
        // Update user account status
        await UserTable.update({
            accountStatus: newStatus
        }, {where: {id: userId}});

        // If user is a seller, also update seller status
        if(user.accountType === 'seller' || user.accountType === 'pending-seller') {
            const seller = await SellersTable.findOne({where: {userId: userId}});
            if(seller) {
                await SellersTable.update({
                    verificationStatus: newStatus,
                    verifiedAt: new Date()
                }, {where: {userId: userId}});
            }
        }

        // Send notification to user
        await sendAccountStatusNotification(userId, action, reason);

        res.status(200).json({
            message: `User ${action}d successfully`,
            userId: userId,
            userEmail: user.email,
            action: action,
            reason: reason
        });
    } catch (error) {
        res.status(500).json({message:"Error updating user status", error: error.message})
    }
};

// Get admin dashboard stats
const getAdminStats = async(req,res)=>{
    try {
        // Check if user is admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({message:"Access denied. Admin privileges required."})
        }

        const [
            totalSellers,
            pendingSellers,
            approvedSellers,
            rejectedSellers,
            suspendedSellers,
            activeSellers,
            totalUsers,
            activeUsers,
            suspendedUsers,
            buyers,
            sellers
        ] = await Promise.all([
            SellersTable.count(),
            SellersTable.count({where: {verificationStatus: 'pending'}}),
            SellersTable.count({where: {verificationStatus: 'approved'}}),
            SellersTable.count({where: {verificationStatus: 'rejected'}}),
            SellersTable.count({where: {verificationStatus: 'suspended'}}),
            SellersTable.count({where: {verificationStatus: 'active'}}),
            UserTable.count(),
            UserTable.count({where: {accountStatus: 'active'}}),
            UserTable.count({where: {accountStatus: 'suspended'}}),
            UserTable.count({where: {accountType: 'buyer'}}),
            UserTable.count({where: {accountType: 'seller'}})
        ]);

        // Calculate percentages
        const totalProcessedSellers = totalSellers - pendingSellers; // Exclude pending from percentage calculations
        const approvalRate = totalProcessedSellers > 0 ? ((approvedSellers / totalProcessedSellers) * 100).toFixed(2) : 0;
        const suspensionRate = totalProcessedSellers > 0 ? ((suspendedSellers / totalProcessedSellers) * 100).toFixed(2) : 0;
        const rejectionRate = totalProcessedSellers > 0 ? ((rejectedSellers / totalProcessedSellers) * 100).toFixed(2) : 0;

        res.status(200).json({
            message: "Admin stats retrieved successfully",
            stats: {
                totalSellers,
                pendingSellers,
                approvedSellers,
                rejectedSellers,
                suspendedSellers,
                activeSellers,
                totalUsers,
                activeUsers,
                suspendedUsers,
                buyers,
                sellers,
                approvalRate,
                suspensionRate,
                rejectionRate,
                // Status breakdown for easy frontend display
                statusBreakdown: {
                    pending: pendingSellers,
                    approved: approvedSellers,
                    rejected: rejectedSellers,
                    suspended: suspendedSellers,
                    active: activeSellers
                },
                userBreakdown: {
                    total: totalUsers,
                    active: activeUsers,
                    suspended: suspendedUsers,
                    buyers: buyers,
                    sellers: sellers
                }
            }
        });
    } catch (error) {
        res.status(500).json({message:"Error retrieving admin stats", error: error.message})
    }
};

module.exports = {
    approveSeller,
    rejectSeller,
    getPendingSellers,
    getAllSellers,
    getSellerById,
    toggleSellerStatus,
    getAllUsers,
    getUserById,
    toggleUserStatus,
    getAdminStats
}; 