const db = require('../../models');
const {
    Report,
    UserTable,
    Post,
    Product,
    Video,
    Auction,
    SwapDeal,
    PostComment,
    SellersTable
} = db;
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('./notificationController');

// Helper function to notify all admins
const notifyAllAdmins = async (title, message, category = 'report', metadata = null) => {
    try {
        // Get all admin users
        const adminUsers = await UserTable.findAll({
            where: { accountType: 'admin' },
            attributes: ['id']
        });

        // Send notification to all admins
        const notificationPromises = adminUsers.map(admin => 
            createNotification(
                admin.id,
                title,
                message,
                'info',
                category,
                metadata
            )
        );

        await Promise.all(notificationPromises);
        console.log(`✅ Notified ${adminUsers.length} admin(s) about new report`);
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
};

class ReportController {
    // Create a new report
    static async createReport(req, res) {
        try {
            const reporterId = req.user.id;
            const {
                reportType,
                reportedUserId,
                itemId,
                reason,
                description
            } = req.body;

            // Validate required fields
            if (!reportType || !reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Report type and reason are required'
                });
            }

            // Validate report type enum
            const validReportTypes = [
                'user', 'seller', 'post', 'product', 'video', 
                'auction', 'swap_deal', 'distress_sale', 'bulk_purchase', 'comment'
            ];
            if (!validReportTypes.includes(reportType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type'
                });
            }

            // Validate reason enum
            const validReasons = [
                'spam', 'inappropriate_content', 'scam_fraud', 
                'harassment', 'fake_product', 'copyright_violation', 'other'
            ];
            if (!validReasons.includes(reason)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid reason'
                });
            }

            // Validate and check if reported item exists
            if (reportType === 'user' || reportType === 'seller') {
                if (!reportedUserId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Reported user ID is required for user/seller reports'
                    });
                }

                // Prevent self-reporting
                if (reportedUserId === reporterId) {
                    return res.status(400).json({
                        success: false,
                        message: 'You cannot report yourself'
                    });
                }

                // Check if reported user exists
                const reportedUser = await UserTable.findByPk(reportedUserId);
                if (!reportedUser) {
                    return res.status(404).json({
                        success: false,
                        message: 'Reported user not found'
                    });
                }
            } else {
                // For content reports, itemId is required
                if (!itemId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Item ID is required for content reports'
                    });
                }

                // Validate that the item exists based on report type
                let itemExists = false;
                let itemOwnerId = null;

                switch (reportType) {
                    case 'post':
                        const post = await Post.findByPk(itemId);
                        if (post) {
                            itemExists = true;
                            itemOwnerId = post.userId;
                        }
                        break;
                    case 'product':
                        const product = await Product.findByPk(itemId);
                        if (product) {
                            itemExists = true;
                            const seller = await SellersTable.findByPk(product.sellerId);
                            itemOwnerId = seller?.userId || null;
                        }
                        break;
                    case 'video':
                        const video = await Video.findByPk(itemId);
                        if (video) {
                            itemExists = true;
                            itemOwnerId = video.userId;
                        }
                        break;
                    case 'auction':
                        const auction = await Auction.findByPk(itemId);
                        if (auction) {
                            itemExists = true;
                            const seller = await SellersTable.findByPk(auction.sellerId);
                            itemOwnerId = seller?.userId || null;
                        }
                        break;
                    case 'swap_deal':
                        const swapDeal = await SwapDeal.findByPk(itemId);
                        if (swapDeal) {
                            itemExists = true;
                            itemOwnerId = swapDeal.sellerId;
                        }
                        break;
                    case 'distress_sale':
                        // Distress sales are products with isDistressSale: true
                        const distressSale = await Product.findOne({
                            where: {
                                id: itemId,
                                isDistressSale: true
                            }
                        });
                        if (distressSale) {
                            itemExists = true;
                            const seller = await SellersTable.findByPk(distressSale.sellerId);
                            itemOwnerId = seller?.userId || null;
                        }
                        break;
                    case 'bulk_purchase':
                        // Bulk purchases are posts with category 'bulk_purchase'
                        const bulkPost = await Post.findOne({
                            where: {
                                id: itemId,
                                category: 'bulk_purchase'
                            }
                        });
                        if (bulkPost) {
                            itemExists = true;
                            itemOwnerId = bulkPost.userId;
                        }
                        break;
                    case 'comment':
                        const comment = await PostComment.findByPk(itemId);
                        if (comment) {
                            itemExists = true;
                            itemOwnerId = comment.userId;
                        }
                        break;
                }

                if (!itemExists) {
                    return res.status(404).json({
                        success: false,
                        message: 'Reported item not found'
                    });
                }

                // Set reportedUserId from item owner if not provided
                if (!reportedUserId && itemOwnerId) {
                    // Prevent self-reporting
                    if (itemOwnerId === reporterId) {
                        return res.status(400).json({
                            success: false,
                            message: 'You cannot report your own content'
                        });
                    }
                } else if (reportedUserId === reporterId) {
                    return res.status(400).json({
                        success: false,
                        message: 'You cannot report your own content'
                    });
                }
            }

            // Check for duplicate report (same reporter, type, and item within last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const duplicateReport = await Report.findOne({
                where: {
                    reporterId,
                    reportType,
                    [Op.or]: [
                        { itemId: itemId || null },
                        { reportedUserId: reportedUserId || null }
                    ],
                    createdAt: {
                        [Op.gte]: thirtyDaysAgo
                    },
                    status: {
                        [Op.in]: ['pending', 'reviewed']
                    }
                }
            });

            if (duplicateReport) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already reported this item recently. Please wait for admin review.'
                });
            }

            // Create report
            const report = await Report.create({
                id: uuidv4(),
                reporterId,
                reportedUserId: reportedUserId || null,
                reportType,
                itemId: itemId || null,
                reason,
                description: description?.trim() || null,
                status: 'pending'
            });

            // Fetch created report with user data
            const createdReport = await Report.findByPk(report.id, {
                include: [
                    {
                        model: UserTable,
                        as: 'reporter',
                        attributes: ['id', 'fullName', 'profilePicture']
                    },
                    {
                        model: UserTable,
                        as: 'reportedUser',
                        attributes: ['id', 'fullName', 'profilePicture'],
                        required: false
                    }
                ]
            });

            // Notify admins about new report
            const reportTypeLabels = {
                'user': 'User',
                'seller': 'Seller',
                'post': 'Post',
                'product': 'Product',
                'video': 'Video',
                'auction': 'Auction',
                'swap_deal': 'Swap Deal',
                'distress_sale': 'Distress Sale',
                'bulk_purchase': 'Bulk Purchase',
                'comment': 'Comment'
            };

            const reasonLabels = {
                'spam': 'Spam',
                'inappropriate_content': 'Inappropriate Content',
                'scam_fraud': 'Scam/Fraud',
                'harassment': 'Harassment',
                'fake_product': 'Fake Product',
                'copyright_violation': 'Copyright Violation',
                'other': 'Other'
            };

            await notifyAllAdmins(
                'New Report Submitted',
                `A new ${reportTypeLabels[reportType] || reportType} report has been submitted for ${reasonLabels[reason] || reason}. Please review it in the admin dashboard.`,
                'report',
                {
                    type: 'report_new',
                    relatedEntityId: report.id,
                    senderId: reporterId,
                    reportId: report.id,
                    reportType: reportType,
                    reason: reason,
                    reporterId: reporterId,
                    reportedUserId: reportedUserId,
                    itemId: itemId,
                    description: description
                }
            );

            // Notify reporter that their report was received
            await createNotification(
                reporterId,
                'Report Submitted Successfully',
                `Your report has been received and is under review. We'll notify you once it's been reviewed.`,
                'success',
                'report',
                {
                    type: 'report_submitted',
                    relatedEntityId: report.id,
                    reportId: report.id,
                    reportType: reportType,
                    status: 'pending'
                }
            );

            res.status(201).json({
                success: true,
                message: 'Report submitted successfully. Our team will review it shortly.',
                data: ReportController._formatReport(createdReport)
            });
        } catch (error) {
            console.error('Error creating report:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating report',
                error: error.message
            });
        }
    }

    // Get user's reports
    static async getMyReports(req, res) {
        try {
            const reporterId = req.user.id;
            const { page = 1, limit = 20, status } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const whereClause = { reporterId };

            if (status && status !== 'all') {
                whereClause.status = status;
            }

            const { count, rows: reports } = await Report.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: UserTable,
                        as: 'reporter',
                        attributes: ['id', 'fullName', 'profilePicture']
                    },
                    {
                        model: UserTable,
                        as: 'reportedUser',
                        attributes: ['id', 'fullName', 'profilePicture'],
                        required: false
                    },
                    {
                        model: UserTable,
                        as: 'resolver',
                        attributes: ['id', 'fullName'],
                        required: false
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset
            });

            res.json({
                success: true,
                data: reports.map(report => ReportController._formatReport(report)),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Error fetching user reports:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching reports',
                error: error.message
            });
        }
    }

    // Get specific report
    static async getReport(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const isAdmin = req.user.role === 'admin';

            const report = await Report.findByPk(id, {
                include: [
                    {
                        model: UserTable,
                        as: 'reporter',
                        attributes: ['id', 'fullName', 'profilePicture']
                    },
                    {
                        model: UserTable,
                        as: 'reportedUser',
                        attributes: ['id', 'fullName', 'profilePicture'],
                        required: false
                    },
                    {
                        model: UserTable,
                        as: 'resolver',
                        attributes: ['id', 'fullName'],
                        required: false
                    }
                ]
            });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            // Check if user has permission to view this report
            if (!isAdmin && report.reporterId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view this report'
                });
            }

            res.json({
                success: true,
                data: ReportController._formatReport(report, isAdmin)
            });
        } catch (error) {
            console.error('Error fetching report:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching report',
                error: error.message
            });
        }
    }

    // Admin: Get all reports with filters
    static async getAllReports(req, res) {
        try {
            const {
                page = 1,
                limit = 50,
                status,
                reportType,
                reason,
                startDate,
                endDate
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const whereClause = {};

            if (status && status !== 'all') {
                whereClause.status = status;
            }
            if (reportType && reportType !== 'all') {
                whereClause.reportType = reportType;
            }
            if (reason && reason !== 'all') {
                whereClause.reason = reason;
            }
            if (startDate && endDate) {
                whereClause.createdAt = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            const { count, rows: reports } = await Report.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: UserTable,
                        as: 'reporter',
                        attributes: ['id', 'fullName', 'email', 'profilePicture']
                    },
                    {
                        model: UserTable,
                        as: 'reportedUser',
                        attributes: ['id', 'fullName', 'email', 'profilePicture'],
                        required: false
                    },
                    {
                        model: UserTable,
                        as: 'resolver',
                        attributes: ['id', 'fullName'],
                        required: false
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset
            });

            res.json({
                success: true,
                data: reports.map(report => ReportController._formatReport(report, true)),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Error fetching all reports:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching reports',
                error: error.message
            });
        }
    }

    // Admin: Update report status
    static async updateReportStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, adminNotes } = req.body;
            const adminId = req.user.id;

            // Validate status
            const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid status is required'
                });
            }

            const report = await Report.findByPk(id);
            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            // Update report
            report.status = status;
            if (adminNotes) {
                report.adminNotes = adminNotes.trim();
            }

            // Set resolved_by and resolved_at if status is resolved or dismissed
            if (status === 'resolved' || status === 'dismissed') {
                report.resolvedBy = adminId;
                report.resolvedAt = new Date();
            } else {
                report.resolvedBy = null;
                report.resolvedAt = null;
            }

            await report.save();

            // Fetch updated report
            const updatedReport = await Report.findByPk(id, {
                include: [
                    {
                        model: UserTable,
                        as: 'reporter',
                        attributes: ['id', 'fullName', 'profilePicture']
                    },
                    {
                        model: UserTable,
                        as: 'reportedUser',
                        attributes: ['id', 'fullName', 'profilePicture'],
                        required: false
                    },
                    {
                        model: UserTable,
                        as: 'resolver',
                        attributes: ['id', 'fullName'],
                        required: false
                    }
                ]
            });

            // Notify reporter if status changed to resolved or dismissed
            if (status === 'resolved' || status === 'dismissed') {
                const resolutionMessage = status === 'resolved'
                    ? `Your report has been reviewed and resolved. Thank you for helping keep our community safe.`
                    : `Your report has been reviewed and dismissed. If you have additional concerns, please contact support.`;

                await createNotification(
                    report.reporterId,
                    `Report ${status === 'resolved' ? 'Resolved' : 'Dismissed'}`,
                    resolutionMessage,
                    status === 'resolved' ? 'success' : 'info',
                    'report',
                    {
                        type: status === 'resolved' ? 'report_resolved' : 'report_dismissed',
                        relatedEntityId: report.id,
                        senderId: adminId,
                        reportId: report.id,
                        reportType: report.reportType,
                        status: status,
                        resolvedBy: adminId,
                        resolvedAt: report.resolvedAt
                    }
                );
            }

            res.json({
                success: true,
                message: 'Report status updated successfully',
                data: ReportController._formatReport(updatedReport, true)
            });
        } catch (error) {
            console.error('Error updating report status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating report status',
                error: error.message
            });
        }
    }

    // Admin: Resolve report (convenience method)
    static async resolveReport(req, res) {
        try {
            const { id } = req.params;
            const { adminNotes, action } = req.body; // action: 'resolved' or 'dismissed'
            const adminId = req.user.id;

            const report = await Report.findByPk(id);
            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            const finalStatus = action === 'dismissed' ? 'dismissed' : 'resolved';

            // Update report
            report.status = finalStatus;
            report.resolvedBy = adminId;
            report.resolvedAt = new Date();
            if (adminNotes) {
                report.adminNotes = adminNotes.trim();
            }

            await report.save();

            // Fetch updated report
            const updatedReport = await Report.findByPk(id, {
                include: [
                    {
                        model: UserTable,
                        as: 'reporter',
                        attributes: ['id', 'fullName', 'profilePicture']
                    },
                    {
                        model: UserTable,
                        as: 'reportedUser',
                        attributes: ['id', 'fullName', 'profilePicture'],
                        required: false
                    },
                    {
                        model: UserTable,
                        as: 'resolver',
                        attributes: ['id', 'fullName'],
                        required: false
                    }
                ]
            });

            // Notify reporter about resolution
            const resolutionMessage = finalStatus === 'resolved' 
                ? `Your report has been reviewed and resolved. Thank you for helping keep our community safe.`
                : `Your report has been reviewed and dismissed. If you have additional concerns, please contact support.`;

            await createNotification(
                report.reporterId,
                `Report ${finalStatus === 'resolved' ? 'Resolved' : 'Dismissed'}`,
                resolutionMessage,
                finalStatus === 'resolved' ? 'success' : 'info',
                'report',
                {
                    type: finalStatus === 'resolved' ? 'report_resolved' : 'report_dismissed',
                    relatedEntityId: report.id,
                    senderId: adminId,
                    reportId: report.id,
                    reportType: report.reportType,
                    status: finalStatus,
                    resolvedBy: adminId,
                    resolvedAt: report.resolvedAt
                }
            );

            res.json({
                success: true,
                message: `Report ${finalStatus} successfully`,
                data: ReportController._formatReport(updatedReport, true)
            });
        } catch (error) {
            console.error('Error resolving report:', error);
            res.status(500).json({
                success: false,
                message: 'Error resolving report',
                error: error.message
            });
        }
    }

    // Admin: Get report statistics
    static async getReportStats(req, res) {
        try {
            const { startDate, endDate } = req.query;

            const whereClause = {};
            if (startDate && endDate) {
                whereClause.createdAt = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            // Get total counts by status
            const statusCounts = await Report.findAll({
                where: whereClause,
                attributes: [
                    'status',
                    [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
                ],
                group: ['status'],
                raw: true
            });

            // Get counts by report type
            const typeCounts = await Report.findAll({
                where: whereClause,
                attributes: [
                    'reportType',
                    [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
                ],
                group: ['reportType'],
                raw: true
            });

            // Get counts by reason
            const reasonCounts = await Report.findAll({
                where: whereClause,
                attributes: [
                    'reason',
                    [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
                ],
                group: ['reason'],
                raw: true
            });

            // Get total count
            const totalCount = await Report.count({ where: whereClause });

            // Format results
            const stats = {
                total: totalCount,
                byStatus: statusCounts.reduce((acc, item) => {
                    acc[item.status] = parseInt(item.count);
                    return acc;
                }, {}),
                byType: typeCounts.reduce((acc, item) => {
                    acc[item.reportType] = parseInt(item.count);
                    return acc;
                }, {}),
                byReason: reasonCounts.reduce((acc, item) => {
                    acc[item.reason] = parseInt(item.count);
                    return acc;
                }, {})
            };

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error fetching report stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching report statistics',
                error: error.message
            });
        }
    }

    // Helper: Format report for response
    static _formatReport(report, includeAdminNotes = false) {
        const reportData = report.toJSON ? report.toJSON() : report;
        const reporter = reportData.reporter || {};
        const reportedUser = reportData.reportedUser || {};
        const resolver = reportData.resolver || {};

        return {
            id: reportData.id,
            reporter: {
                id: reporter.id,
                name: reporter.fullName || 'Unknown',
                avatar: reporter.profilePicture || null
            },
            reportedUser: reportedUser.id ? {
                id: reportedUser.id,
                name: reportedUser.fullName || 'Unknown',
                avatar: reportedUser.profilePicture || null
            } : null,
            reportType: reportData.reportType,
            itemId: reportData.itemId,
            reason: reportData.reason,
            description: reportData.description,
            status: reportData.status,
            adminNotes: includeAdminNotes ? reportData.adminNotes : undefined,
            resolver: resolver.id ? {
                id: resolver.id,
                name: resolver.fullName || 'Unknown'
            } : null,
            resolvedAt: reportData.resolvedAt,
            createdAt: reportData.createdAt,
            updatedAt: reportData.updatedAt
        };
    }
}

module.exports = ReportController;

