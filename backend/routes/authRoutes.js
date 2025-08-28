const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const cloudinary = require("../config/cloudinary.js");
const User = require("../models/User");
const Note = require("../models/Note");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ================== Multer temp storage for Profile Pics (Cloudinary) ==================
const profileUpload = multer({
  dest: "temp/",
  limits: { fileSize: 2 * 1024 * 1024 },
});

// ================== VALIDATION HELPERS ==================
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,2}[\s\-]?[\(]?[\d]{1,4}[\)]?[\s\-]?[\d]{1,4}[\s\-]?[\d]{1,9}$/;
  return phoneRegex.test(phone);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/\s+/g, ' ');
};

// ================== REGISTER ==================
router.post("/register", async (req, res) => {
  let { name, email, password, phone_no, address } = req.body;

  try {
    // Sanitize inputs
    name = sanitizeInput(name);
    email = sanitizeInput(email);
    phone_no = sanitizeInput(phone_no);
    address = sanitizeInput(address);

    // Validation
    const errors = [];

    if (!name || name.length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (name && name.length > 50) {
      errors.push("Name must be less than 50 characters");
    }

    if (!email) {
      errors.push("Email is required");
    } else if (!validateEmail(email)) {
      errors.push("Please enter a valid email address");
    }

    if (!password) {
      errors.push("Password is required");
    } else if (!validatePassword(password)) {
      errors.push("Password must be at least 8 characters with uppercase, lowercase, number and special character");
    }

    if (!phone_no) {
      errors.push("Phone number is required");
    } else if (!validatePhone(phone_no)) {
      errors.push("Please enter a valid phone number");
    }

    if (!address || address.length < 5) {
      errors.push("Address must be at least 5 characters long");
    }
    if (address && address.length > 200) {
      errors.push("Address must be less than 200 characters");
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone_no,
      address,
    });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
});

// ================== LOGIN ==================
router.post("/login", async (req, res) => {
  let { email, password } = req.body;

  try {
    // Sanitize inputs
    email = sanitizeInput(email);

    // Validation
    const errors = [];

    if (!email) {
      errors.push("Email is required");
    } else if (!validateEmail(email)) {
      errors.push("Please enter a valid email address");
    }

    if (!password) {
      errors.push("Password is required");
    } else if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// ================== GET PROFILE ==================
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================== UPDATE PROFILE ==================
router.put(
  "/profile",
  authMiddleware,
  profileUpload.single("profilePic"),
  async (req, res) => {
    try {
      const { name, phone_no, address } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) return res.status(404).json({ message: "User not found" });

      user.name = name || user.name;
      user.phone_no = phone_no || user.phone_no;
      user.address = address || user.address;

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "notes-hub/profile",
          resource_type: "image",
          transformation: [
            { width: 256, height: 256, crop: "fill", gravity: "face" },
          ],
        });
        user.profilePic = result.secure_url;
        // cleanup temp file
        try {
          require("fs").unlinkSync(req.file.path);
        } catch (e) {}
      }

      await user.save();

      res.json({
        message: "Profile updated",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone_no: user.phone_no,
          address: user.address,
          profilePic: user.profilePic,
        },
      });
    } catch (err) {
      console.error("Update Profile Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ================== GET USER STATS ==================
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's notes count
    const myNotes = await Note.countDocuments({ uploadedBy: userId });

    // Get total notes count (public + user's private)
    const totalNotes = await Note.countDocuments({
      $or: [{ visibility: "public" }, { uploadedBy: userId }],
    });

    // Get user's bookmarks count
    const user = await User.findById(userId).populate("bookmarks");
    const bookmarks = user.bookmarks ? user.bookmarks.length : 0;

    // Get total views (sum of upvotes and downvotes for user's notes)
    const userNotes = await Note.find({ uploadedBy: userId });
    const totalViews = userNotes.reduce(
      (sum, note) => sum + (note.upvotes || 0) + (note.downvotes || 0),
      0
    );

    res.json({
      totalNotes,
      myNotes,
      bookmarks,
      totalViews,
    });
  } catch (err) {
    console.error("Get User Stats Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
