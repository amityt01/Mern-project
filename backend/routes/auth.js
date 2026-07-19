const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { hashPassword, verifyPassword, generateToken } = require("../utils/authHelper");

// @route   POST /register
// @desc    Register a teacher
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, schoolName } = req.body;

    if (!name || !email || !password || !schoolName) {
      return res.status(400).json({ message: "Please enter all fields." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    const hashedPassword = hashPassword(password);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      schoolName,
    });

    const token = generateToken({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        schoolName: newUser.schoolName,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /login
// @desc    Login teacher and get token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = generateToken({
      id: user._id,
      name: user.name,
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        schoolName: user.schoolName,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /me
// @desc    Get current authenticated user info
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
