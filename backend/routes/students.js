const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");

// CREATE (Admin, Educator)
router.post("/", authMiddleware, authorizeRoles("Admin", "Educator"), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ALL (Admin, Educator)
router.get("/", authMiddleware, authorizeRoles("Admin", "Educator"), async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ONE (Admin, Educator)
router.get("/:id", authMiddleware, authorizeRoles("Admin", "Educator"), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE (Admin, Educator)
router.put("/:id", authMiddleware, authorizeRoles("Admin", "Educator"), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE (Admin, Educator)
router.delete("/:id", authMiddleware, authorizeRoles("Admin", "Educator"), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Student Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;