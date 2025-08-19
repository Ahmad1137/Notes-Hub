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

// ================== REGISTER ==================
router.post("/register", async (req, res) => {
  const { name, email, password, phone_no, address } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
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
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

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
