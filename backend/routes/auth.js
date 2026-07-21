const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { hashPassword, verifyPassword, generateToken } = require("../utils/authHelper");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Helper handler for user sign-up / registration
const handleSignUp = async (req, res) => {
  try {
    let { name, email, password, schoolName } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password || !schoolName) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields: name, email, password, and schoolName.",
      });
    }

    email = email.trim().toLowerCase();
    
    // 2. Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address (e.g. teacher@school.org).",
      });
    }

    // 3. Validate password length
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      });
    }

    // 4. Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // 5. Hash password before saving to database
    const hashedPassword = hashPassword(password);

    // 6. Create and store user in MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      schoolName: schoolName.trim(),
    });

    // 7. Generate authentication token
    const token = generateToken({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });

    // 8. Return success response (HTTP 201 Created)
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        schoolName: newUser.schoolName,
      },
    });
  } catch (err) {
    // Return error response (HTTP 500 Server Error)
    return res.status(500).json({
      success: false,
      message: err.message || "An unexpected error occurred during user sign-up.",
    });
  }
};

// @route   POST /api/auth/signup & POST /api/auth/register
// @desc    Register / Sign-up user and store in MongoDB
router.post("/signup", handleSignUp);
router.post("/register", handleSignUp);

// @route   POST /login
// @desc    Login teacher and get token
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    email = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
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
