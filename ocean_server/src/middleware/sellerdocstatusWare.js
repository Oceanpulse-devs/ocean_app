// This middleware checks the seller's document verification status and updates the seller's verification status accordingly.
const { where } = require('sequelize');
const { SellerDocument, SellersTable } = require('../../models');

const updateVerificationStatusBasedOnDocuments = async (req, res, next) => {
    // console.log("Checking seller document status...");
  try {
    const id = req.user.id;

    const sellerData = await SellersTable.findOne({ where: { userId: id } });

    if (!sellerData) {
        console.log("No seller data found for user ID:", id);
      return next();
    }

    // Fetch the seller's document status
        const documents = await SellerDocument.findOne({ where: { sellerId: sellerData.id } });
        if (documents){
            if(documents.status === "approved") {
                await SellersTable.update({ verificationStatus: 'approved' }, { where: { id: sellerData.id } });
            }else if(documents.status === "pending"){
                await SellersTable.update({verificationStatus:'pending'},{where:{id: sellerData.id}})
            }
             else if(documents.status === "rejected") {
                await SellersTable.update({ verificationStatus: 'rejected' }, { where: { id: sellerData.id } });
                // await SellerDocument.destroy({ where: { sellerId: sellerData.id } });
            }
        }
    
    next();
  } catch (error) {
    console.error("Error updating verification status based on document status:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = updateVerificationStatusBasedOnDocuments;
// This middleware checks the seller's document verification status and updates the seller's verification status accordingly.
// If the document is approved, the verification status is set to 'approved'