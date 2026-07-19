const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");
const authMiddleware = require("../middleware/auth");

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
// @desc    Create a resource (authenticated)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, category, subject, gradeLevel, content } = req.body;

    if (!title || !category || !subject || !gradeLevel || !content) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    const newResource = await Resource.create({
      title,
      description,
      category,
      subject,
      gradeLevel,
      content,
      author: req.user.id,
    });

    const populatedResource = await Resource.findById(newResource._id).populate("author", "name schoolName");
    res.status(201).json(populatedResource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/resources/:id
// @desc    Update a resource (authenticated, must be the author)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    let resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check ownership
    if (resource.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized. You can only edit your own resources." });
    }

    resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("author", "name schoolName");

    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource (authenticated, must be the author)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check ownership
    if (resource.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized. You can only delete your own resources." });
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/resources/:id/download
// @desc    Increment download/usage count for a resource (no auth required to facilitate sharing)
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
