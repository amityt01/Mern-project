const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Folder = require("../models/Folder");
const User = require("../models/User");
const Resource = require("../models/Resource");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");

/**
 * Helper function to determine a user's access level for a collaborative folder.
 * Returns: "owner" | "write" | "read" | null
 */
const getFolderAccess = (folder, userId, userRole) => {
  if (!folder || !userId) return null;
  const uid = userId.toString();

  // Admin role grants full owner access
  if (userRole === "Admin") {
    return "owner";
  }

  const ownerId = folder.owner && folder.owner._id ? folder.owner._id.toString() : folder.owner ? folder.owner.toString() : "";
  if (ownerId === uid) {
    return "owner";
  }

  if (Array.isArray(folder.sharedWith)) {
    const share = folder.sharedWith.find((s) => {
      if (!s || !s.user) return false;
      const sUserId = s.user._id ? s.user._id.toString() : s.user.toString();
      return sUserId === uid;
    });
    return share ? share.permission : null;
  }

  return null;
};

// @route   GET /api/folders
// @desc    Get all folders owned by or shared with current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === "Admin"
      ? {}
      : {
          $or: [
            { owner: req.user.id },
            { "sharedWith.user": req.user.id }
          ]
        };

    const folders = await Folder.find(query)
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
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required." });
    }

    const newFolder = await Folder.create({
      name: name.trim(),
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
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

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

    const access = getFolderAccess(folder, req.user.id, req.user.role);
    if (!access) {
      return res.status(403).json({ message: "Access denied. Folder is not shared with you." });
    }

    res.json({ folder, access });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Handler for updating folder metadata (name, description)
const updateFolderHandler = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id, req.user.role);
    if (access !== "owner" && access !== "write") {
      return res.status(403).json({ message: "You do not have write access to this folder." });
    }

    const { name, description } = req.body;
    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Folder name cannot be empty." });
      }
      folder.name = name.trim();
    }
    if (description !== undefined) {
      folder.description = description;
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
};

// @route   PUT /api/folders/:id
// @route   PATCH /api/folders/:id
// @desc    Update folder details (Owner or write permission)
router.put("/:id", authMiddleware, updateFolderHandler);
router.patch("/:id", authMiddleware, updateFolderHandler);

// @route   DELETE /api/folders/:id
// @desc    Delete a folder (Only owner can delete)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id, req.user.role);
    if (access !== "owner") {
      return res.status(403).json({ message: "Only the folder owner can delete this folder." });
    }

    await Folder.findByIdAndDelete(req.params.id);
    res.json({ message: "Folder deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/folders/:id/share
// @desc    Share folder with another educator by email or userId
router.post("/:id/share", authMiddleware, async (req, res) => {
  try {
    const { email, userId, permission } = req.body; // permission: "read" or "write"
    
    if ((!email && !userId) || !permission) {
      return res.status(400).json({ message: "Please specify teacher's email/ID and permission." });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id, req.user.role);
    if (access !== "owner") {
      return res.status(403).json({ message: "Only the folder owner can share it." });
    }

    let targetUser = null;
    if (userId) {
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid user ID format." });
      }
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase() });
    }

    if (!targetUser) {
      return res.status(404).json({ message: "Educator with specified email or ID is not registered." });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot share a folder with yourself." });
    }

    // Check if already shared
    const isAlreadyShared = folder.sharedWith.some((s) => {
      const sUserId = s.user && s.user._id ? s.user._id.toString() : s.user.toString();
      return sUserId === targetUser._id.toString();
    });
    if (isAlreadyShared) {
      // Update permission
      folder.sharedWith = folder.sharedWith.map((s) => {
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

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id, req.user.role);
    if (access !== "owner" && access !== "write") {
      return res.status(403).json({ message: "You do not have write access to this folder." });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if resource is already in folder
    const alreadyInFolder = folder.resources.some((r) => {
      const rId = r && r._id ? r._id.toString() : r.toString();
      return rId === resourceId.toString();
    });

    if (alreadyInFolder) {
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
// @desc    Remove a resource from a folder (Owner or write permission)
router.delete("/:id/resources/:resourceId", authMiddleware, async (req, res) => {
  try {
    const { resourceId } = req.params;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id, req.user.role);
    if (access !== "owner" && access !== "write") {
      return res.status(403).json({ message: "You do not have write access to this folder." });
    }

    folder.resources = folder.resources.filter((id) => {
      const rId = id && id._id ? id._id.toString() : id.toString();
      return rId !== resourceId.toString();
    });
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

    if (!folderId || !mongoose.isValidObjectId(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    if (!userId && !email) {
      return res.status(400).json({ message: "User ID or email is required for invitation." });
    }

    if (userId && !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id, req.user.role);
    if (access !== "owner") {
      return res.status(403).json({ message: "Only the folder owner can invite users to this folder." });
    }

    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase() });
    }

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot invite yourself to your own folder." });
    }

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
// @desc    Remove a user from a collaborative folder
const removeUserHandler = async (req, res) => {
  try {
    const folderId = req.params.id || req.params.folderId;
    const userId = req.params.userId || req.body.userId || req.query.userId || req.body.user;

    if (!folderId || !mongoose.isValidObjectId(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id, req.user.role);
    if (access !== "owner" && req.user.id !== userId.toString()) {
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

// @desc    Update permission for a collaborator in a folder
const updatePermissionHandler = async (req, res) => {
  try {
    const folderId = req.params.id || req.params.folderId;
    const userId = req.params.userId || req.body.userId;
    const permission = req.body.permission;

    if (!permission || !["read", "write"].includes(permission)) {
      return res.status(400).json({ message: "Permission must be 'read' or 'write'." });
    }

    if (!folderId || !mongoose.isValidObjectId(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID format." });
    }

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const access = getFolderAccess(folder, req.user.id, req.user.role);
    if (access !== "owner") {
      return res.status(403).json({ message: "Only the folder owner can update collaborator permissions." });
    }

    const shareIndex = folder.sharedWith.findIndex((s) => {
      if (!s.user) return false;
      const sUserId = s.user._id ? s.user._id.toString() : s.user.toString();
      return sUserId === userId.toString();
    });

    if (shareIndex === -1) {
      return res.status(404).json({ message: "User is not a collaborator on this folder." });
    }

    folder.sharedWith[shareIndex].permission = permission;
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

// Route registrations for Updating Collaborator Permission
router.put("/:id/collaborators/:userId/permission", authMiddleware, updatePermissionHandler);
router.post("/:id/collaborators/:userId/permission", authMiddleware, updatePermissionHandler);
router.put("/:id/permissions/:userId", authMiddleware, updatePermissionHandler);
router.patch("/:id/collaborators/:userId", authMiddleware, updatePermissionHandler);

// Route registrations for Remove
router.delete("/:id/invite/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/collaborators/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/remove/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/share/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/users/:userId", authMiddleware, removeUserHandler);
router.delete("/:id/invite", authMiddleware, removeUserHandler);

module.exports = router;
module.exports.getFolderAccess = getFolderAccess;
