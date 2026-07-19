const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");
const Folder = require("../models/Folder");
const User = require("../models/User");

// @route   GET /api/analytics
// @desc    Get dashboard analytics
router.get("/", async (req, res) => {
  try {
    const totalResources = await Resource.countDocuments();
    const totalFolders = await Folder.countDocuments();
    const totalTeachers = await User.countDocuments();

    // Sum of all downloadCount
    const downloadStats = await Resource.aggregate([
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: "$downloadCount" }
        }
      }
    ]);
    const totalDownloads = downloadStats.length > 0 ? downloadStats[0].totalDownloads : 0;

    // Resource breakdown by category
    const categoryStats = await Resource.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    // Resource breakdown by subject
    const subjectStats = await Resource.aggregate([
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 }
        }
      }
    ]);

    // Top downloaded resources
    const topResources = await Resource.find()
      .populate("author", "name schoolName")
      .sort({ downloadCount: -1 })
      .limit(5);

    res.json({
      totalResources,
      totalFolders,
      totalTeachers,
      totalDownloads,
      categories: categoryStats,
      subjects: subjectStats,
      topResources
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
