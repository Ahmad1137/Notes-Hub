const express = require("express");
const fs = require("fs");
const router = express.Router();
const Note = require("../models/Note");
const Comment = require("../models/Comment");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cloudinary = require("../config/cloudinary.js");
const uploadpdf = multer({ dest: "temp/" });

// Ensure temp directory exists for multer
try {
  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
} catch (e) {
  console.warn("Could not ensure temp directory:", e?.message);
}

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

// ----------------- multer (legacy local uploads) kept for temp if needed -----------------
// We now upload to Cloudinary; keep local config only if needed elsewhere

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

// ----------------- GET public notes (no auth) -----------------
// server/routes/notes.js

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

    // Start with an $and array to combine all conditions
    let query = { $and: [] };

    // Step 1: Visibility rules
    if (visibility) {
      query.$and.push({ visibility });
    } else {
      if (!req.user) {
        query.$and.push({ visibility: "public" });
      } else {
        query.$and.push({
          $or: [{ visibility: "public" }, { uploadedBy: req.user.userId }],
        });
      }
    }

    // Step 2: Keyword search
    if (keyword) {
      query.$and.push({
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { subject: { $regex: keyword, $options: "i" } },
          { university: { $regex: keyword, $options: "i" } },
          { tags: { $regex: keyword, $options: "i" } },
        ],
      });
    }

    // Step 3: Subject filter
    if (subject) {
      query.$and.push({ subject });
    }

    // Step 4: University filter
    if (university) {
      query.$and.push({ university });
    }

    // If no filters at all, fallback to empty {}
    const finalQuery = query.$and.length > 0 ? query : {};

    const notes = await Note.find(finalQuery).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error("Search Notes Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const notes = await Note.find({ visibility: "public" })
      .populate("uploadedBy", "name") // assuming uploadedBy is a user ID
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching public notes" });
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

// router.post(
//   "/upload",
//   authMiddleware,
//   upload.single("file"), // will handle if file is uploaded; else req.file is undefined
//   async (req, res) => {
//     try {
//       let { title, fileUrl, subject, university, tags, visibility } = req.body;

//       // If a file is uploaded, override fileUrl with uploaded file path
//       if (req.file) {
//         fileUrl = `/uploads/${req.file.filename}`;
//       }

//       // Validate required fields
//       if (!title || !fileUrl || !subject || !university) {
//         return res.status(400).json({
//           message:
//             "All required fields (title, fileUrl, subject, university) must be filled",
//         });
//       }

//       // per-user daily limit check
//       const dailyLimit = 20;
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const tomorrow = new Date(today);
//       tomorrow.setDate(today.getDate() + 1);

//       const countToday = await Note.countDocuments({
//         uploadedBy: req.user.userId,
//         createdAt: { $gte: today, $lt: tomorrow },
//       });
//       if (countToday >= dailyLimit) {
//         // If file was uploaded but limit reached, optionally delete file from disk here
//         return res
//           .status(429)
//           .json({ message: `Daily upload limit reached (${dailyLimit})` });
//       }

//       // Prepare tags array
//       tags = tags
//         ? Array.isArray(tags)
//           ? tags
//           : tags.split(",").map((t) => t.trim())
//         : [];

//       const note = new Note({
//         title,
//         fileUrl,
//         subject,
//         university,
//         tags,
//         visibility: visibility || "public",
//         uploadedBy: req.user.userId,
//       });

//       await note.save();

//       res.status(201).json({ message: "Note uploaded successfully", note });
//     } catch (error) {
//       console.error("Upload Note Error:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// keep using multer for temporary file handling

// router.post(
//   "/upload",
//   authMiddleware,
//   uploadpdf.single("file"),
//   async (req, res) => {
//     try {
//       let { title, fileUrl, subject, university, tags, visibility } = req.body;

//       // If file uploaded, push it to Cloudinary
//       if (req.file) {
//         const uploadResult = await cloudinary.uploader.upload(req.file.path, {
//           folder: "notes-hub",
//           resource_type: "auto", // 👈 auto-detects (PDF, image, etc.)
//           format: "pdf", // 👈 ensures proper extension for iframe
//         });

//         fileUrl = uploadResult.secure_url;

//         // remove temp file
//         fs.unlinkSync(req.file.path);
//       }

//       if (!title || !fileUrl || !subject || !university) {
//         return res.status(400).json({
//           message:
//             "All required fields (title, fileUrl, subject, university) must be filled",
//         });
//       }

//       // daily upload limit check
//       const dailyLimit = 20;
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const tomorrow = new Date(today);
//       tomorrow.setDate(today.getDate() + 1);

//       const countToday = await Note.countDocuments({
//         uploadedBy: req.user.userId,
//         createdAt: { $gte: today, $lt: tomorrow },
//       });
//       if (countToday >= dailyLimit) {
//         return res
//           .status(429)
//           .json({ message: `Daily upload limit reached (${dailyLimit})` });
//       }

//       // process tags
//       tags = tags
//         ? Array.isArray(tags)
//           ? tags
//           : tags.split(",").map((t) => t.trim())
//         : [];

//       const note = new Note({
//         title,
//         fileUrl,
//         subject,
//         university,
//         tags,
//         visibility: visibility || "public",
//         uploadedBy: req.user.userId,
//       });

//       await note.save();

//       res.status(201).json({ message: "Note uploaded successfully", note });
//     } catch (error) {
//       console.error("Upload Note Error:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// ----------------- EDIT NOTE -----------------

router.post(
  "/upload",
  authMiddleware,
  uploadpdf.single("file"),
  async (req, res) => {
    try {
      let { title, fileUrl, subject, university, tags, visibility } = req.body;

      // If file uploaded, push it to Cloudinary
      if (req.file) {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "notes-hub",
          resource_type: "auto", // ✅ auto handles PDF & images
          format: "pdf", // ✅ forces .pdf extension
        });

        fileUrl = uploadResult.secure_url;

        // remove temp file
        fs.unlinkSync(req.file.path);
      }

      if (!title || !fileUrl || !subject || !university) {
        return res.status(400).json({
          message:
            "All required fields (title, fileUrl, subject, university) must be filled",
        });
      }

      // daily upload limit check
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

      // process tags
      tags = tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((t) => t.trim())
        : [];

      const note = new Note({
        title,
        fileUrl,
        subject,
        university,
        tags,
        visibility: visibility || "public",
        uploadedBy: req.user.userId,
      });

      await note.save();

      res.status(201).json({ message: "Note uploaded successfully", note });
    } catch (error) {
      console.error("Upload Note Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/:id",
  authMiddleware,
  uploadpdf.single("file"),
  async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).json({ message: "Note not found" });
      if (note.uploadedBy.toString() !== req.user.userId)
        return res.status(403).json({ message: "You cannot edit this note" });

      // Destructure from req.body (text fields)
      const { title, subject, university, tags, visibility, commentsEnabled } =
        req.body;

      // Update text fields if provided
      note.title = title || note.title;
      note.subject = subject || note.subject;
      note.university = university || note.university;
      note.visibility = visibility || note.visibility;
      if (typeof commentsEnabled === "boolean")
        note.commentsEnabled = commentsEnabled;

      // Parse tags if provided as string
      if (tags) {
        note.tags = Array.isArray(tags)
          ? tags
          : tags.split(",").map((t) => t.trim());
      }

      // Handle file upload and update fileUrl using Cloudinary
      if (req.file) {
        // Upload new file to cloudinary
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "notes-hub",
          resource_type: "auto",
        });
        note.fileUrl = uploadResult.secure_url;
        // remove temp file
        fs.unlink(req.file.path, () => {});
      } else if (req.body.fileUrl) {
        // Optional: If frontend wants to update fileUrl without upload
        note.fileUrl = req.body.fileUrl;
      }

      await note.save();

      res.json({ message: "Note updated", note });
    } catch (err) {
      console.error("Edit Note Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

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
