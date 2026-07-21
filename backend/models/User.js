const mongoose = require("mongoose");
const { hashPassword, verifyPassword } = require("../utils/authHelper");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  schoolName: {
    type: String,
    default: "General School",
    trim: true,
  },
  role: {
    type: String,
    default: "Educator",
    trim: true,
  },
  phone: {
    type: String,
    default: "",
    trim: true,
  },
  bio: {
    type: String,
    default: "",
    trim: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  subjects: {
    type: [String],
    default: ["General"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Mongoose Pre-Save Hook: Hash password before saving user to MongoDB
userSchema.pre("save", function () {
  // Only hash password if it has been modified or is new
  if (!this.isModified("password")) {
    return;
  }

  // Ensure password is not already hashed (salt:hash format with colon)
  if (this.password && !this.password.includes(":")) {
    this.password = hashPassword(this.password);
  }
});

// Method to verify/compare entered password against stored hashed password
userSchema.methods.matchPassword = function (enteredPassword) {
  return verifyPassword(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);


