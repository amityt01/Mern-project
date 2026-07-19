const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    required: true,
    enum: ["Worksheet", "Lesson Plan", "Activity", "Study Guide"],
  },
  subject: {
    type: String,
    required: true,
    enum: ["Math", "Science", "English", "Social Studies", "Other"],
  },
  gradeLevel: {
    type: String,
    required: true,
    enum: ["Primary", "Middle", "High"],
  },
  content: {
    type: String,
    required: true, // Stores the lesson material text or worksheet questions
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Resource", resourceSchema);
