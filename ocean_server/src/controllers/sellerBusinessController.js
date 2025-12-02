const db = require('../../models');

/**
 * Update seller business information (inline from profile page).
 * Allows editing a subset of seller fields without touching verification status.
 */
const updateBusinessInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      businessName,
      businessDescription,
      businessEmail,
      businessPhone,
      businessAddress,
      website,
      country,
      state,
      selectedCategories,
      selectedSubcategories,
    } = req.body;

    // Basic validations for key fields (frontend will also validate)
    if (businessName !== undefined && businessName.trim().length < 2) {
      return res.status(400).json({ message: 'Business name is too short' });
    }

    if (businessEmail !== undefined && businessEmail.trim() !== '') {
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(businessEmail.trim())) {
        return res.status(400).json({ message: 'Invalid business email' });
      }
    }

    if (businessPhone !== undefined && businessPhone.trim() !== '') {
      const digitsOnly = businessPhone.replace(/\D/g, '');
      if (digitsOnly.length < 7) {
        return res.status(400).json({ message: 'Invalid business phone number' });
      }
    }

    // Find seller record
    const seller = await db.SellersTable.findOne({ where: { userId } });
    if (!seller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const updateData = {};

    if (businessName !== undefined) updateData.businessName = businessName.trim();
    if (businessDescription !== undefined) updateData.businessDescription = businessDescription.trim();
    if (businessEmail !== undefined) updateData.businessEmail = businessEmail.trim();
    if (businessPhone !== undefined) {
      updateData.businessPhone = businessPhone.trim();
      // Keep phoneNumber in sync with businessPhone if provided
      updateData.phoneNumber = businessPhone.trim();
    }
    if (businessAddress !== undefined) updateData.businessAddress = businessAddress.trim();
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;

    // selectedCategories / selectedSubcategories are JSON-compatible structures from frontend
    if (selectedCategories !== undefined) updateData.selectedCategories = selectedCategories;
    if (selectedSubcategories !== undefined) updateData.selectedSubcategories = selectedSubcategories;

    await seller.update(updateData);

    // Optionally mirror some fields into UserTable (businessName, website)
    const userUpdateData = {};
    if (businessName !== undefined) userUpdateData.businessName = businessName.trim();
    if (website !== undefined) {
      const trimmedWebsite = (website || '').trim();
      // If website is blank, store null instead of empty string to satisfy notEmpty validator
      userUpdateData.website = trimmedWebsite === '' ? null : trimmedWebsite;
    }

    if (Object.keys(userUpdateData).length > 0) {
      const user = await db.UserTable.findByPk(userId);
      if (user) {
        await user.update(userUpdateData);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Business information updated successfully',
    });
  } catch (error) {
    console.error('Error updating business info:', error);
    return res.status(500).json({
      message: 'Error updating business info',
      error: error.message,
    });
  }
};

module.exports = { updateBusinessInfo };


