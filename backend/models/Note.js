const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    fileUrl: { type: String, required: true }, // URL or path to PDF
    subject: { type: String, required: true },
    university: { type: String, required: true },
    tags: [String],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    voters: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        vote: { type: String, enum: ["upvote", "downvote"] },
      },
    ],
    commentsEnabled: { type: Boolean, default: true }, // new field to allow disabling comments
  },
  { timestamps: true }
);

// optional text index for quick search over title/subject/university
noteSchema.index({
  title: "text",
  subject: "text",
  university: "text",
  tags: "text",
});

module.exports = mongoose.model("Note", noteSchema);
