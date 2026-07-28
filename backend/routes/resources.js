const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");

// @route   GET /api/resources
// @desc    Get all resources with optional query filters (category, subject, gradeLevel, search)
router.get("/", async (req, res) => {
  try {
    const { category, subject, gradeLevel, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (gradeLevel) query.gradeLevel = gradeLevel;
    if (search) {
      query.title = { $regex: search, $options: "i" };
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
// @desc    Get top 5 performing resources sorted by download count
router.get("/top", async (req, res) => {
  try {
    const topResources = await Resource.find()
      .populate("author", "name schoolName")
      .sort({ downloadCount: -1 })
      .limit(5);

    res.json(topResources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/resources/upload
// @desc    Upload resource file and return file metadata / store in MongoDB
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
// @desc    Get details of a single resource
router.get("/:id", async (req, res) => {
  try {
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
// @desc    Create a resource with optional file upload (Admin, Educator)
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
      title,
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

// @route   PUT /api/resources/:id
// @desc    Update a resource (authenticated, must be author or Admin)
router.put("/:id", authMiddleware, authorizeRoles("Admin", "Educator"), upload.single("file"), async (req, res) => {
  try {
    let resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check ownership or Admin role
    const isOwner = resource.author.toString() === req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized. You can only edit your own resources." });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.fileName = req.file.filename;
      updateData.originalName = req.file.originalname;
      updateData.filePath = req.file.fileUrl || `/uploads/${req.file.filename}`;
      updateData.fileSize = req.file.size;
      updateData.fileType = req.file.mimetype;
    }

    resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate("author", "name schoolName");

    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource (authenticated, must be author or Admin)
router.delete("/:id", authMiddleware, authorizeRoles("Admin", "Educator"), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check ownership or Admin role
    const isOwner = resource.author.toString() === req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized. You can only delete your own resources." });
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/resources/:id/download
// @desc    Increment download/usage count for a resource
router.post("/:id/download", async (req, res) => {
  try {
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
