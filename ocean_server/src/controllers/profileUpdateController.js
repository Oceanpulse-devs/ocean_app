const { UserTable } = require('../../models');

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, bio, location, website, profilePicture, coverPicture } = req.body;

    const currentUser = await UserTable.findOne({ where: { id: userId } });
    
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (coverPicture !== undefined) updateData.coverPicture = coverPicture;

    await UserTable.update(updateData, { where: { id: userId } });

    const updatedUser = await UserTable.findOne({ where: { id: userId } });

    return res.status(200).json({
      message: "Profile updated successfully",
      profileInfo: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
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
