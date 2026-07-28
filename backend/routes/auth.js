const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");
const { hashPassword, verifyPassword, generateToken } = require("../utils/authHelper");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Helper handler for user sign-up / registration
const handleSignUp = async (req, res) => {
  try {
    let { name, email, password, schoolName, role } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter all required fields: name, email, and password.",
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

    // 5. Create new user instance
    const newUser = new User({
      name: name.trim(),
      email,
      password,
      schoolName: schoolName && schoolName.trim() ? schoolName.trim() : "General School",
      role: role && ["Admin", "Educator", "Student"].includes(role) ? role : "Educator",
    });

    // 6. Save user document into MongoDB
    await newUser.save();

    // 7. Generate authentication token including user role
    const token = generateToken({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    // 8. Return success response (HTTP 201 Created)
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: {
        id: newUser._id,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        schoolName: newUser.schoolName,
        role: newUser.role,
        createdAt: newUser.createdAt,
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

// @route   POST /api/auth/signup, /api/auth/register, /signup, /register
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

    const isMatch = typeof user.matchPassword === "function" 
      ? user.matchPassword(password) 
      : verifyPassword(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const userRole = user.role || "Educator";

    const token = generateToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: userRole,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        schoolName: user.schoolName,
        role: userRole,
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

// @route   PUT /api/auth/profile
// @desc    Update current authenticated user's profile info
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email, schoolName, role, phone, bio, avatar, subjects } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (name) user.name = name.trim();
    if (email) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        return res.status(400).json({ message: "Please enter a valid email address." });
      }
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email: trimmedEmail });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: "This email address is already in use by another account." });
      }
      user.email = trimmedEmail;
    }

    if (schoolName !== undefined) user.schoolName = schoolName.trim();
    if (role !== undefined && req.user.role === "Admin") {
      if (["Admin", "Educator", "Student"].includes(role.trim())) {
        user.role = role.trim();
      }
    }
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (subjects !== undefined) user.subjects = Array.isArray(subjects) ? subjects : [subjects];

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        schoolName: user.schoolName,
        role: user.role || "Educator",
        phone: user.phone || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
        subjects: user.subjects || [],
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update profile." });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change authenticated user password with current password verification
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current password and new password are required for verification." });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from your current password." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found in system directory." });
    }

    const isMatch = typeof user.matchPassword === "function"
      ? user.matchPassword(currentPassword)
      : verifyPassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect. Identity verification failed." });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully after identity verification!",
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update password." });
  }
});

// ==================== ADMIN ROUTES ====================

// @route   GET /users
// @desc    Get list of all users (Admin only)
router.get("/users", authMiddleware, authorizeRoles("Admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /users/:id/role
// @desc    Update a user's role (Admin only)
router.put("/users/:id/role", authMiddleware, authorizeRoles("Admin"), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !["Admin", "Educator", "Student"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /users/:id
// @desc    Delete user account (Admin only)
router.delete("/users/:id", authMiddleware, authorizeRoles("Admin"), async (req, res) => {
  try {
    if (req.params.id === req.user.id || req.params.id === req.user._id) {
      return res.status(400).json({ message: "Admin cannot delete their own active account." });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: "User account deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
