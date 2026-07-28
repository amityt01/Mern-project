const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { authMiddleware } = require("../middleware/auth");

// @route   GET /api/notifications
// @desc    Get all in-app notifications for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "name email schoolName")
      .populate("folder", "name description")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count for the logged-in user
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @route   PATCH /api/notifications/:id/read
// @desc    Mark a single notification as read
const markReadHandler = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID format." });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    const recipientId = notification.recipient && notification.recipient._id
      ? notification.recipient._id.toString()
      : notification.recipient ? notification.recipient.toString() : "";

    if (recipientId !== req.user.id) {
      return res.status(403).json({ message: "Access denied. Notification is not yours." });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.put("/:id/read", authMiddleware, markReadHandler);
router.patch("/:id/read", authMiddleware, markReadHandler);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications for logged-in user as read
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    const unreadList = await Notification.find({ recipient: req.user.id, read: false });
    for (let notif of unreadList) {
      notif.read = true;
      await notif.save();
    }

    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID format." });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    const recipientId = notification.recipient && notification.recipient._id
      ? notification.recipient._id.toString()
      : notification.recipient ? notification.recipient.toString() : "";

    if (recipientId !== req.user.id) {
      return res.status(403).json({ message: "Access denied. Notification is not yours." });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
