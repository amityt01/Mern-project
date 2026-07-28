const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Resource = require("../models/Resource");
const Folder = require("../models/Folder");
const { authMiddleware, authorizeRoles, authorizePermissions, optionalAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { exportUsageCsv } = require("./analytics");
const { getFolderAccess } = require("./folders");

// @route   GET /api/resources/export
// @route   GET /api/resources/export-csv
// @route   GET /api/resources/csv
// @desc    Generate and download CSV usage report for resources within selected date range
if (exportUsageCsv) {
  router.get("/export", optionalAuth, exportUsageCsv);
  router.get("/export-csv", optionalAuth, exportUsageCsv);
  router.get("/csv", optionalAuth, exportUsageCsv);
}

// @route   GET /api/resources
// @desc    Get all resources with optional query filters (category, subject, gradeLevel, search) (Public / Optional Auth)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { category, subject, gradeLevel, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (gradeLevel) query.gradeLevel = gradeLevel;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const resources = await Resource.find(query)
      .populate("author", "name schoolName")
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/resources/top
// @desc    Get top 5 performing resources sorted by download count (Public / Optional Auth)
router.get("/top", optionalAuth, async (req, res) => {
  try {
    const topResources = await Resource.find()
      .populate("author", "name schoolName")
      .sort({ downloadCount: -1 })
      .limit(5);

    const result = topResources.map((resItem) => {
      const obj = resItem.toObject ? resItem.toObject() : { ...resItem };
      if (obj.views === undefined || obj.views === null || obj.views === 0) {
        obj.views = (obj.downloadCount || 0) * 3 + 12;
      }
      return obj;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/resources/upload
// @desc    Upload resource file and return file metadata / store in MongoDB (Protected: Admin, Educator)
router.post("/upload", authMiddleware, authorizeRoles("Admin", "Educator"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    res.status(201).json({
      message: "File uploaded successfully",
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.fileUrl || `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/resources/:id
// @desc    Get details of a single resource (Public / Optional Auth)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid resource ID format." });
    }

    const resource = await Resource.findById(req.params.id).populate("author", "name schoolName");
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/resources
// @desc    Create a resource with optional file upload (Protected: Admin, Educator)
router.post("/", authMiddleware, authorizeRoles("Admin", "Educator"), upload.single("file"), async (req, res) => {
  try {
    const { title, description, category, subject, gradeLevel } = req.body;
    let content = req.body.content;

    if (!title || !category || !subject || !gradeLevel) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    let fileName = req.body.fileName || "";
    let originalName = req.body.originalName || fileName;
    let filePath = req.body.filePath || "";
    let fileSize = req.body.fileSize ? Number(req.body.fileSize) : 0;
    let fileType = req.body.fileType || "";

    if (req.file) {
      fileName = req.file.filename;
      originalName = req.file.originalname;
      filePath = req.file.fileUrl || `/uploads/${req.file.filename}`;
      fileSize = req.file.size;
      fileType = req.file.mimetype;
      if (!content) {
        content = `Attached file: ${req.file.originalname}`;
      }
    }

    if (!content && !fileName) {
      return res.status(400).json({ message: "Please provide lesson content or attach an educational file." });
    }

    const newResource = await Resource.create({
      title: title.trim(),
      description: description || "",
      category,
      subject,
      gradeLevel,
      content: content || "Educational resource attachment",
      author: req.user.id,
      fileName,
      originalName,
      filePath,
      fileSize,
      fileType,
    });

    const populatedResource = await Resource.findById(newResource._id).populate("author", "name schoolName");
    res.status(201).json(populatedResource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Handler for updating a resource
const updateResourceHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate resource ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid resource ID format." });
    }

    let resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check ownership, Admin role, or write access to folder containing this resource
    const authorId = resource.author ? (resource.author._id || resource.author).toString() : "";
    const userId = (req.user.id || req.user._id || "").toString();
    const isOwner = authorId === userId;
    const isAdmin = req.user.role === "Admin";

    let hasFolderWriteAccess = false;
    if (!isOwner && !isAdmin && Folder) {
      const folders = await Folder.find({ resources: id });
      hasFolderWriteAccess = folders.some((folder) => {
        const access = getFolderAccess(folder, userId, req.user.role);
        return access === "owner" || access === "write";
      });
    }

    if (!isOwner && !isAdmin && !hasFolderWriteAccess) {
      return res.status(403).json({ message: "Unauthorized. You do not have permission to modify this resource." });
    }

    // Validate input data if provided
    const { title, description, category, subject, gradeLevel, content } = req.body;

    if (title !== undefined && (!title || typeof title !== "string" || !title.trim())) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }

    const ALLOWED_CATEGORIES = ["Worksheet", "Lesson Plan", "Activity", "Study Guide"];
    if (category !== undefined && !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(", ")}` });
    }

    const ALLOWED_SUBJECTS = ["Math", "Science", "English", "Social Studies", "Other"];
    if (subject !== undefined && !ALLOWED_SUBJECTS.includes(subject)) {
      return res.status(400).json({ message: `Invalid subject. Must be one of: ${ALLOWED_SUBJECTS.join(", ")}` });
    }

    const ALLOWED_GRADE_LEVELS = ["Primary", "Middle", "High"];
    if (gradeLevel !== undefined && !ALLOWED_GRADE_LEVELS.includes(gradeLevel)) {
      return res.status(400).json({ message: `Invalid grade level. Must be one of: ${ALLOWED_GRADE_LEVELS.join(", ")}` });
    }

    // Prepare metadata update fields
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (subject !== undefined) updateData.subject = subject;
    if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
    if (content !== undefined) updateData.content = content;

    // Preserve existing file metadata if no new file is uploaded
    if (req.file) {
      updateData.fileName = req.file.filename;
      updateData.originalName = req.file.originalname;
      updateData.filePath = req.file.fileUrl || `/uploads/${req.file.filename}`;
      updateData.fileSize = req.file.size;
      updateData.fileType = req.file.mimetype;
    } else {
      updateData.fileName = resource.fileName;
      updateData.originalName = resource.originalName;
      updateData.filePath = resource.filePath;
      updateData.fileSize = resource.fileSize;
      updateData.fileType = resource.fileType;
    }

    resource = await Resource.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("author", "name schoolName");

    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   PUT /api/resources/:id
// @route   PATCH /api/resources/:id
// @desc    Update a resource (Protected: Admin, Educator; must be author, Admin, or have folder write access)
router.put("/:id", authMiddleware, authorizeRoles("Admin", "Educator"), upload.single("file"), updateResourceHandler);
router.patch("/:id", authMiddleware, authorizeRoles("Admin", "Educator"), upload.single("file"), updateResourceHandler);

// @route   DELETE /api/resources/:id
// @desc    Delete a resource (Protected: Admin, Educator; must be author, Admin, or have folder write access)
router.delete("/:id", authMiddleware, authorizeRoles("Admin", "Educator"), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate resource ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid resource ID format." });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check ownership, Admin role, or write access to folder containing this resource
    const userId = (req.user.id || req.user._id || "").toString();
    const authorId = resource.author ? (resource.author._id || resource.author).toString() : "";
    const isOwner = authorId === userId;
    const isAdmin = req.user.role === "Admin";

    let hasFolderWriteAccess = false;
    if (!isOwner && !isAdmin && Folder) {
      const folders = await Folder.find({ resources: id });
      hasFolderWriteAccess = folders.some((folder) => {
        const access = getFolderAccess(folder, userId, req.user.role);
        return access === "owner" || access === "write";
      });
    }

    if (!isOwner && !isAdmin && !hasFolderWriteAccess) {
      return res.status(403).json({ message: "Unauthorized. You do not have permission to delete this resource." });
    }

    await Resource.findByIdAndDelete(id);

    // Remove reference from folders
    if (Folder) {
      await Folder.updateMany({ resources: id }, { $pull: { resources: id } });
    }

    res.json({ message: "Resource deleted successfully", id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error while deleting resource" });
  }
});

// @route   POST /api/resources/:id/download
// @desc    Increment download/usage count for a resource (Public / Optional Auth)
router.post("/:id/download", optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid resource ID format." });
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    ).populate("author", "name schoolName");

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ downloadCount: resource.downloadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
