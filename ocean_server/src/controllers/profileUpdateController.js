const { UserTable } = require('../../models');
const cloudinaryService = require('../services/cloudinaryService');

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, bio, location, website } = req.body;

    const currentUser = await UserTable.findOne({ where: { id: userId } });
    
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;

    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
      try {
        const profilePictureFile = req.files.profilePicture[0]; // multer array format
        const uploadResult = await cloudinaryService.uploadFile(
          profilePictureFile.buffer,
          `ocean-app/profiles/${userId}/profile-picture`,
          {
            resource_type: 'image',
            quality: 'auto',
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' }
            ]
          }
        );
        
        if (uploadResult.success) {
          updateData.profilePicture = uploadResult.url;
          console.log('Profile picture uploaded:', uploadResult.url);
        } else {
          console.error('Profile picture upload failed:', uploadResult.error);
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        return res.status(500).json({ 
          message: "Error uploading profile picture", 
          error: error.message 
        });
      }
    }

    // Handle cover picture upload
    if (req.files && req.files.coverPicture) {
      try {
        const coverPictureFile = req.files.coverPicture[0]; // multer array format
        const uploadResult = await cloudinaryService.uploadFile(
          coverPictureFile.buffer,
          `ocean-app/profiles/${userId}/cover-picture`,
          {
            resource_type: 'image',
            quality: 'auto',
            transformation: [
              { width: 1200, height: 400, crop: 'fill' }
            ]
          }
        );
        
        if (uploadResult.success) {
          updateData.coverPicture = uploadResult.url;
          console.log('Cover picture uploaded:', uploadResult.url);
        } else {
          console.error('Cover picture upload failed:', uploadResult.error);
        }
      } catch (error) {
        console.error('Error uploading cover picture:', error);
        return res.status(500).json({ 
          message: "Error uploading cover picture", 
          error: error.message 
        });
      }
    }

    // Handle JSON-based image uploads (for backward compatibility)
    if (req.body.profilePicture && req.body.profilePicture.startsWith('data:')) {
      try {
        const uploadResult = await cloudinaryService.uploadFile(
          req.body.profilePicture,
          `ocean-app/profiles/${userId}/profile-picture`,
          {
            resource_type: 'image',
            quality: 'auto',
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' }
            ]
          }
        );
        
        if (uploadResult.success) {
          updateData.profilePicture = uploadResult.url;
        }
      } catch (error) {
        console.error('Error uploading profile picture from JSON:', error);
      }
    }

    if (req.body.coverPicture && req.body.coverPicture.startsWith('data:')) {
      try {
        const uploadResult = await cloudinaryService.uploadFile(
          req.body.coverPicture,
          `ocean-app/profiles/${userId}/cover-picture`,
          {
            resource_type: 'image',
            quality: 'auto',
            transformation: [
              { width: 1200, height: 400, crop: 'fill' }
            ]
          }
        );
        
        if (uploadResult.success) {
          updateData.coverPicture = uploadResult.url;
        }
      } catch (error) {
        console.error('Error uploading cover picture from JSON:', error);
      }
    }

    await UserTable.update(updateData, { where: { id: userId } });

    const updatedUser = await UserTable.findOne({ where: { id: userId } });

    return res.status(200).json({
      message: "Profile updated successfully",
      profileInfo: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.accountType,
        profilePicture: updatedUser.profilePicture || "/default-avatar.jpg",
        coverPicture: updatedUser.coverPicture || "/default-cover.jpg",
        bio: updatedUser.bio || "Ocean App user",
        location: updatedUser.location || "Not specified",
        website: updatedUser.website || null
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

module.exports = { updateProfile };
