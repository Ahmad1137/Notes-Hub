const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const Comment = require("../models/Comment");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// ----------------- helper to read optional token -----------------
function getUserIdFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // your JWT uses userId so return that
    return decoded.userId || decoded.id || decoded.user;
  } catch (err) {
    return null;
  }
}

// ----------------- multer (file upload with validation) -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}); // 10 MB

// ----------------- PAGINATED / FILTERED GET /api/notes -----------------
/*
Query params:
 - page (default 1), limit (default 12)
 - q (text search across title/subject/university/tags)
 - subject, university
 - tags (comma separated)
 - sortBy: latest | top (most upvotes) | down (most downvotes)
*/
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 100); // max 100
    const skip = (page - 1) * limit;

    const q = req.query.q;
    const subject = req.query.subject;
    const university = req.query.university;
    const tags = req.query.tags
      ? req.query.tags.split(",").map((t) => t.trim())
      : null;
    const sortBy = req.query.sortBy || "latest";

    const userId = getUserIdFromHeader(req);

    const baseFilter = userId
      ? { $or: [{ visibility: "public" }, { uploadedBy: userId }] } // public + your own private
      : { visibility: "public" }; // only public for guests

    const filters = { ...baseFilter };
    if (subject) filters.subject = subject;
    if (university) filters.university = university;
    if (tags) filters.tags = { $in: tags };
    if (q) {
      // text index will help; fallback to regex if text index not available
      filters.$text = { $search: q };
    }

    let sort = { createdAt: -1 };
    if (sortBy === "top") sort = { upvotes: -1 };
    else if (sortBy === "down") sort = { downvotes: -1 };

    const [notes, total] = await Promise.all([
      Note.find(filters)
        .populate("uploadedBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Note.countDocuments(filters),
    ]);

    res.json({
      data: notes,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Get Notes Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- My notes -----------------
router.get("/my-notes", authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ uploadedBy: req.user.userId }).populate(
      "uploadedBy",
      "name email"
    );
    res.json(notes);
  } catch (err) {
    console.error("Get My Notes Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Search & Filter Notes API
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { keyword, subject, university, visibility } = req.query;

    let query = {};

    // Visibility rules
    if (visibility) {
      query.visibility = visibility; // public/private
    } else {
      // If user not logged in, only show public notes
      if (!req.user) {
        query.visibility = "public";
      } else {
        // Show public + user's own notes
        query.$or = [{ visibility: "public" }, { uploadedBy: req.user.userId }];
      }
    }

    // Keyword search
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { subject: { $regex: keyword, $options: "i" } },
        { university: { $regex: keyword, $options: "i" } },
        { tags: { $regex: keyword, $options: "i" } },
      ];
    }

    // Subject filter
    if (subject) {
      query.subject = subject;
    }

    // University filter
    if (university) {
      query.university = university;
    }

    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error("Search Notes Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// ----------------- GET single note -----------------
router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "uploadedBy",
      "name email"
    );
    if (!note) return res.status(404).json({ message: "Note not found" });

    // if note private → only owner can view
    if (note.visibility === "private") {
      const userId = getUserIdFromHeader(req);
      if (!userId || note.uploadedBy._id.toString() !== userId) {
        return res.status(403).json({ message: "This note is private" });
      }
    }

    res.json(note);
  } catch (err) {
    console.error("Get Note Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- Upload route (JSON fileUrl) -----------------
router.post("/upload", authMiddleware, async (req, res) => {
  try {
    const { title, fileUrl, subject, university, tags, visibility } = req.body;
    if (!title || !fileUrl || !subject || !university) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    // per-user daily limit: e.g., 20 notes/day
    const dailyLimit = 20;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const countToday = await Note.countDocuments({
      uploadedBy: req.user.userId,
      createdAt: { $gte: today, $lt: tomorrow },
    });
    if (countToday >= dailyLimit) {
      return res
        .status(429)
        .json({ message: `Daily upload limit reached (${dailyLimit})` });
    }

    const note = new Note({
      title,
      fileUrl,
      subject,
      university,
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((t) => t.trim())
        : [],
      visibility: visibility || "public",
      uploadedBy: req.user.userId,
    });

    await note.save();
    res.status(201).json({ message: "Note uploaded successfully", note });
  } catch (error) {
    console.error("Upload Note Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- Upload file route (multipart/form-data, stores file locally) -----------------
router.post(
  "/upload-file",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "PDF file is required" });

      const { title, subject, university, tags, visibility } = req.body;
      if (!title || !subject || !university) {
        return res
          .status(400)
          .json({ message: "title, subject, university are required" });
      }

      // per-user daily limit check (same as above)
      const dailyLimit = 20;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const countToday = await Note.countDocuments({
        uploadedBy: req.user.userId,
        createdAt: { $gte: today, $lt: tomorrow },
      });
      if (countToday >= dailyLimit) {
        // delete file if limit exceeded
        return res
          .status(429)
          .json({ message: `Daily upload limit reached (${dailyLimit})` });
      }

      const fileUrl = req.file.filename; // you serve via express.static('uploads')
      const note = new Note({
        title,
        fileUrl: `/uploads/${fileUrl}`, // store accessible path or just filename depending on frontend
        subject,
        university,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        visibility: visibility || "public",
        uploadedBy: req.user.userId,
      });

      await note.save();
      res.status(201).json({ message: "File uploaded and note saved", note });
    } catch (err) {
      console.error("Upload-file Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ----------------- EDIT NOTE -----------------
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.uploadedBy.toString() !== req.user.userId)
      return res.status(403).json({ message: "You cannot edit this note" });

    const {
      title,
      fileUrl,
      subject,
      university,
      tags,
      visibility,
      commentsEnabled,
    } = req.body;
    note.title = title || note.title;
    note.fileUrl = fileUrl || note.fileUrl;
    note.subject = subject || note.subject;
    note.university = university || note.university;
    note.tags = tags || note.tags;
    note.visibility = visibility || note.visibility;
    if (typeof commentsEnabled === "boolean")
      note.commentsEnabled = commentsEnabled;

    await note.save();
    res.json({ message: "Note updated", note });
  } catch (err) {
    console.error("Edit Note Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- DELETE NOTE -----------------
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.uploadedBy.toString() !== req.user.userId)
      return res.status(403).json({ message: "You cannot delete this note" });
    await note.deleteOne();
    res.json({ message: "Note deleted" });
  } catch (err) {
    console.error("Delete Note Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- Voting (single unified endpoint) -----------------
async function handleVote(note, userId, voteType) {
  // voteType is "upvote" or "downvote"
  const existing = note.voters.find((v) => v.user.toString() === userId);
  if (existing) {
    if (existing.vote === voteType) {
      // remove vote
      note.voters = note.voters.filter((v) => v.user.toString() !== userId);
      if (voteType === "upvote") note.upvotes = Math.max(0, note.upvotes - 1);
      else note.downvotes = Math.max(0, note.downvotes - 1);
    } else {
      // switch vote
      if (voteType === "upvote") {
        note.upvotes++;
        note.downvotes = Math.max(0, note.downvotes - 1);
      } else {
        note.downvotes++;
        note.upvotes = Math.max(0, note.upvotes - 1);
      }
      existing.vote = voteType;
    }
  } else {
    note.voters.push({ user: userId, vote: voteType });
    if (voteType === "upvote") note.upvotes++;
    else note.downvotes++;
  }
  await note.save();
  return { upvotes: note.upvotes, downvotes: note.downvotes };
}

router.post("/:id/upvote", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    const result = await handleVote(note, req.user.userId, "upvote");
    res.json({ message: "Vote updated", ...result });
  } catch (err) {
    console.error("Upvote Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/downvote", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    const result = await handleVote(note, req.user.userId, "downvote");
    res.json({ message: "Vote updated", ...result });
  } catch (err) {
    console.error("Downvote Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- Comments -----------------
// Get comments for note
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ note: req.params.id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error("Get Comments Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add comment
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (!note.commentsEnabled)
      return res
        .status(403)
        .json({ message: "Comments are disabled for this note" });

    if (!text || text.trim() === "")
      return res.status(400).json({ message: "Comment text required" });

    const comment = new Comment({
      note: req.params.id,
      user: req.user.userId,
      text,
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    console.error("Add Comment Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete comment (owner of comment OR owner of note can delete)
router.delete(
  "/:noteId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.commentId);
      if (!comment)
        return res.status(404).json({ message: "Comment not found" });

      const note = await Note.findById(req.params.noteId);
      if (!note) return res.status(404).json({ message: "Note not found" });

      if (
        comment.user.toString() !== req.user.userId &&
        note.uploadedBy.toString() !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ message: "You cannot delete this comment" });
      }

      await comment.deleteOne();
      res.json({ message: "Comment deleted" });
    } catch (err) {
      console.error("Delete Comment Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ----------------- Bookmarks (toggle) -----------------
router.post("/:id/bookmark", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const noteId = req.params.id;
    const exists = user.bookmarks.some((b) => b.toString() === noteId);
    if (exists) {
      user.bookmarks = user.bookmarks.filter((b) => b.toString() !== noteId);
      await user.save();
      return res.json({ message: "Removed from bookmarks" });
    } else {
      user.bookmarks.push(noteId);
      await user.save();
      return res.json({ message: "Added to bookmarks" });
    }
  } catch (err) {
    console.error("Bookmark Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/bookmarks/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: "bookmarks",
      populate: { path: "uploadedBy", select: "name email" },
    });
    res.json(user.bookmarks);
  } catch (err) {
    console.error("Get Bookmarks Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
