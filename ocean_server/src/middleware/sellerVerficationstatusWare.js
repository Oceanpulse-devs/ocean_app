const { UserTable, SellersTable } = require('../../models');

const updateRoleBasedOnVerification = async (req, res, next) => {
  try {
    const id = req.user.id;

    const sellerData = await SellersTable.findOne({ where: { userId: id } });

    if (!sellerData) {
      return next();
    }

    if (sellerData.verificationStatus === "approved") {
      await UserTable.update({ accountType: 'seller' }, { where: { id } });
    } else if (sellerData.verificationStatus === "rejected") {
      await UserTable.update({ accountType: 'buyer' }, { where: { id } });
      await SellersTable.destroy({ where: { userId: id } });
    }

    next();
  } catch (error) {
    console.error("Error updating account type based on verification:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = updateRoleBasedOnVerification;
// This middleware checks the seller's verification status and updates the user's account type accordingly.
// If the seller is approved, the account type is set to 'seller'.