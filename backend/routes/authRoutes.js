const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ================== Multer Storage for Profile Pics ==================
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/profile/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
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
        user.profilePic = `/uploads/profile/${req.file.filename}`;
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

module.exports = router;
