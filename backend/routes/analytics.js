const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");
const Folder = require("../models/Folder");
const User = require("../models/User");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");

// @route   GET /api/analytics
// @desc    Get dashboard analytics (Admin, Educator)
router.get("/", authMiddleware, authorizeRoles("Admin", "Educator"), async (req, res) => {
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

    // Resource aggregation by date for charting
    const dateStats = await Resource.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const resourcesByDate = dateStats.map((item) => ({
      date: item._id || "Unknown",
      count: item.count
    }));

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
      topResources,
      resourcesByDate
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
