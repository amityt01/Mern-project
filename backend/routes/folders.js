const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Folder = require("../models/Folder");
const User = require("../models/User");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");

// Helper to check folder access
const getFolderAccess = (folder, userId) => {
  const ownerId = folder.owner && folder.owner._id ? folder.owner._id.toString() : folder.owner.toString();
  if (ownerId === userId) {
    return "owner";
  }
  const share = folder.sharedWith.find(s => {
    if (!s.user) return false;
    const sUserId = s.user._id ? s.user._id.toString() : s.user.toString();
    return sUserId === userId;
  });
  return share ? share.permission : null;
};


// @route   GET /api/folders
// @desc    Get all folders owned by or shared with current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const folders = await Folder.find({
      $or: [
        { owner: req.user.id },
        { "sharedWith.user": req.user.id }
      ]
    })
      .populate("owner", "name schoolName email")
      .populate("sharedWith.user", "name schoolName email")
      .populate("resources", "title category subject gradeLevel")
      .sort({ createdAt: -1 });

    res.json(folders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/folders/shared
// @desc    Get folders shared with current user
router.get("/shared", authMiddleware, async (req, res) => {
  try {
    const folders = await Folder.find({
      "sharedWith.user": req.user.id
    })
      .populate("owner", "name schoolName email")
      .populate("sharedWith.user", "name schoolName email")
      .populate("resources", "title category subject gradeLevel")
      .sort({ createdAt: -1 });

    const sharedFolders = folders.filter((folder) => {
      const ownerId = folder.owner && folder.owner._id ? folder.owner._id.toString() : folder.owner ? folder.owner.toString() : "";
      return ownerId !== req.user.id;
    });

    res.json(sharedFolders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/folders
// @desc    Create a new folder (Admin, Educator)
router.post("/", authMiddleware, authorizeRoles("Admin", "Educator"), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Folder name is required." });
    }

    const newFolder = await Folder.create({
      name,
      description: description || "",
      owner: req.user.id,
      sharedWith: [],
      resources: []
    });

    const populatedFolder = await Folder.findById(newFolder._id)
      .populate("owner", "name schoolName email")
      .populate("sharedWith.user", "name schoolName email")
      .populate("resources");

    res.status(201).json(populatedFolder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/folders/:id
// @desc    Get folder details and resources
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate("owner", "name schoolName email")
      .populate("sharedWith.user", "name schoolName email")
      .populate({
        path: "resources",
        populate: {
          path: "author",
          select: "name schoolName"
        }
      });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id);
    if (!access) {
      return res.status(403).json({ message: "Access denied. Folder is not shared with you." });
    }

    res.json({ folder, access });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/folders/:id
// @desc    Delete a folder (Only owner can delete)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (folder.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the folder owner can delete this folder." });
    }

    await Folder.findByIdAndDelete(req.params.id);
    res.json({ message: "Folder deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/folders/:id/share
// @desc    Share folder with another educator by email
router.post("/:id/share", authMiddleware, async (req, res) => {
  try {
    const { email, permission } = req.body; // permission: "read" or "write"
    
    if (!email || !permission) {
      return res.status(400).json({ message: "Please specify teacher's email and permission." });
    }

    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (folder.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the folder owner can share it." });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ message: "Educator with this email is not registered." });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot share a folder with yourself." });
    }

    // Check if already shared
    const isAlreadyShared = folder.sharedWith.some(s => {
      const sUserId = s.user && s.user._id ? s.user._id.toString() : s.user.toString();
      return sUserId === targetUser._id.toString();
    });
    if (isAlreadyShared) {
      // Update permission
      folder.sharedWith = folder.sharedWith.map(s => {
        const sUserId = s.user && s.user._id ? s.user._id.toString() : s.user.toString();
        return sUserId === targetUser._id.toString() ? { user: targetUser._id, permission } : s;
      });
    } else {
      // Add new share
      folder.sharedWith.push({ user: targetUser._id, permission });
    }

    await folder.save();

    const updatedFolder = await Folder.findById(req.params.id)
      .populate("owner", "name schoolName email")
      .populate("sharedWith.user", "name schoolName email")
      .populate("resources");

    res.json(updatedFolder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/folders/:id/resources
// @desc    Add a resource to a folder (Owner or write permission)
router.post("/:id/resources", authMiddleware, async (req, res) => {
  try {
    const { resourceId } = req.body;
    if (!resourceId) {
      return res.status(400).json({ message: "Resource ID is required." });
    }

    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id);
    if (access !== "owner" && access !== "write") {
      return res.status(403).json({ message: "You do not have write access to this folder." });
    }

    // Check if resource is already in folder
    if (folder.resources.includes(resourceId)) {
      return res.status(400).json({ message: "Resource is already in this folder." });
    }

    folder.resources.push(resourceId);
    await folder.save();

    const updatedFolder = await Folder.findById(req.params.id)
      .populate("owner", "name schoolName email")
      .populate("sharedWith.user", "name schoolName email")
      .populate({
        path: "resources",
        populate: {
          path: "author",
          select: "name schoolName"
        }
      });

    res.json(updatedFolder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/folders/:id/resources/:resourceId
// @desc    Remove a resource from a folder
router.delete("/:id/resources/:resourceId", authMiddleware, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id);
    if (access !== "owner" && access !== "write") {
      return res.status(403).json({ message: "You do not have write access to this folder." });
    }

    folder.resources = folder.resources.filter(id => id.toString() !== resourceId);
    await folder.save();

    const updatedFolder = await Folder.findById(req.params.id)
      .populate("owner", "name schoolName email")
      .populate("sharedWith.user", "name schoolName email")
      .populate({
        path: "resources",
        populate: {
          path: "author",
          select: "name schoolName"
        }
      });

    res.json(updatedFolder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/folders/:id/invite
// @route   POST /api/folders/:id/invite/:userId
// @desc    Invite a user to a collaborative folder
const inviteUserHandler = async (req, res) => {
  try {
    const folderId = req.params.id || req.params.folderId;
    let userId = req.params.userId || req.body.userId || req.body.user || req.body.id;
    const email = req.body.email;
    const permission = req.body.permission || "read";

    // Validate folder ID format
    if (!folderId || !mongoose.isValidObjectId(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    // Validate user ID or email presence and format
    if (!userId && !email) {
      return res.status(400).json({ message: "User ID or email is required for invitation." });
    }

    if (userId && !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // Check if folder exists
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Authorize: Only folder owner (or Admin) can invite users
    const ownerId = folder.owner && folder.owner._id ? folder.owner._id.toString() : folder.owner.toString();
    if (ownerId !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only the folder owner can invite users to this folder." });
    }

    // Find target user
    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase() });
    }

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-invitation
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot invite yourself to your own folder." });
    }

    // Prevent duplicate invitations
    const isAlreadyInvited = folder.sharedWith.some((s) => {
      if (!s.user) return false;
      const sUserId = s.user._id ? s.user._id.toString() : s.user.toString();
      return sUserId === targetUser._id.toString();
    });

    if (isAlreadyInvited) {
      return res.status(400).json({ message: "User is already invited to this folder." });
    }

    folder.sharedWith.push({ user: targetUser._id, permission });
    await folder.save();

    const updatedFolder = await Folder.findById(folderId)
      .populate("owner", "name schoolName email")
      .populate("sharedWith.user", "name schoolName email")
      .populate("resources");

    return res.status(200).json(updatedFolder);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// @route   DELETE /api/folders/:id/invite/:userId
// @route   DELETE /api/folders/:id/remove/:userId
// @route   DELETE /api/folders/:id/collaborators/:userId
// @route   DELETE /api/folders/:id/share/:userId
// @route   DELETE /api/folders/:id/users/:userId
// @desc    Remove a user from a collaborative folder
const removeUserHandler = async (req, res) => {
  try {
    const folderId = req.params.id || req.params.folderId;
    const userId = req.params.userId || req.body.userId || req.query.userId || req.body.user;

    // Validate folder ID format
    if (!folderId || !mongoose.isValidObjectId(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    // Validate user ID format
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // Check if folder exists
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Authorize: Only folder owner (or Admin or user removing self) can remove user
    const ownerId = folder.owner && folder.owner._id ? folder.owner._id.toString() : folder.owner.toString();
    if (ownerId !== req.user.id && req.user.role !== "Admin" && req.user.id !== userId.toString()) {
      return res.status(403).json({ message: "Only the folder owner can remove users from this folder." });
    }

    const existingIndex = folder.sharedWith.findIndex((s) => {
      if (!s.user) return false;
      const sUserId = s.user._id ? s.user._id.toString() : s.user.toString();
      return sUserId === userId.toString();
    });

    if (existingIndex === -1) {
      return res.status(404).json({ message: "User is not a collaborator on this folder." });
    }

    folder.sharedWith.splice(existingIndex, 1);
    await folder.save();

    const updatedFolder = await Folder.findById(folderId)
      .populate("owner", "name schoolName email")
      .populate("sharedWith.user", "name schoolName email")
      .populate("resources");

    return res.status(200).json(updatedFolder);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Route registrations for Invite
router.post("/:id/invite", authMiddleware, inviteUserHandler);
router.post("/:id/invite/:userId", authMiddleware, inviteUserHandler);
router.post("/:id/collaborators", authMiddleware, inviteUserHandler);

// Route registrations for Remove
router.delete("/:id/invite/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/collaborators/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/remove/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/share/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/users/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/invite", authMiddleware, removeUserHandler);

module.exports = router;
