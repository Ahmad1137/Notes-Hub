import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import {
  getNotesById,
  createComment,
  getCommentsNotes,
  createBookmark,
  getBookmarks,
} from "../services/api";
import {
  FaFilePdf,
  FaUser,
  FaTags,
  FaUniversity,
  FaThumbsUp,
  FaThumbsDown,
  FaBookmark,
  FaCalendar,
  FaArrowLeft,
  FaDownload,
  FaEye,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { getFileUrl } from "../utils/fileUtils";

const NoteDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    fetchNoteDetails();
    checkBookmarkStatus();
  }, [id]);

  const fetchNoteDetails = async () => {
    try {
      setLoading(true);
      const [noteRes, commentsRes] = await Promise.all([
        getNotesById(id),
        getCommentsNotes(id),
      ]);

      setNote(noteRes.data);
      setComments(commentsRes.data || []);

      // Check if user has voted
      if (noteRes.data.voters) {
        const vote = noteRes.data.voters.find((v) => v.user === user?.id);
        setUserVote(vote?.vote || null);
      }
    } catch (error) {
      console.error("Error fetching note details:", error);
      toast.error("Failed to load note details");
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const { data } = await getBookmarks();
      const bookmarkedIds = data.map(
        (bookmark) => bookmark.note?._id || bookmark._id
      );
      setIsBookmarked(bookmarkedIds.includes(id));
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: newC } = await createComment(id, newComment);
      newC.user = { name: user?.name || "You" };
      setComments((prev) => [...prev, newC]);
      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleBookmark = async () => {
    try {
      await createBookmark(id, {});
      setIsBookmarked(true);
      toast.success("Note bookmarked successfully");
    } catch (error) {
      console.error("Error bookmarking note:", error);
      toast.error("Failed to bookmark note");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  if (!note) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Note Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The note you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/notes" className="btn-primary">
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to Notes
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              to="/notes"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to Notes
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Note Header */}
              <div className="card p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FaFilePdf className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {note.title}
                      </h1>
                      <p className="text-lg text-gray-600">{note.subject}</p>
                    </div>
                  </div>
                  {user && (
                    <button
                      onClick={handleBookmark}
                      className={`p-2 rounded-lg transition-colors ${
                        isBookmarked
                          ? "text-red-500 hover:bg-red-50"
                          : "text-gray-400 hover:bg-gray-50"
                      }`}
                      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                    >
                      <FaBookmark className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Note Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <FaUniversity className="w-4 h-4 mr-2" />
                    <span>{note.university}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaUser className="w-4 h-4 mr-2" />
                    <span>By {note.uploadedBy?.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaCalendar className="w-4 h-4 mr-2" />
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaEye className="w-4 h-4 mr-2" />
                    <span>{note.views || 0} views</span>
                  </div>
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FaThumbsUp className="w-4 h-4 text-green-500" />
                    <span>{note.upvotes || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaThumbsDown className="w-4 h-4 text-red-500" />
                    <span>{note.downvotes || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaBookmark className="w-4 h-4 text-blue-500" />
                    <span>{comments.length} comments</span>
                  </div>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Document Preview
                  </h2>
                  <a
                    href={getFileUrl(note.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center"
                  >
                    <FaDownload className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <iframe
                    src={getFileUrl(note.fileUrl)}
                    title="PDF Viewer"
                    className="w-full h-[600px] border rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Comments ({comments.length})
                </h2>

                {/* Add Comment */}
                {user && (
                  <div className="mb-6">
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="input-field resize-none"
                          rows="3"
                        />
                      </div>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="btn-primary self-end disabled:opacity-50"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {comment.user?.name || "Anonymous"}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Note Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Visibility
                    </label>
                    <p className="text-sm text-gray-900 capitalize">
                      {note.visibility}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Upload Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      File Size
                    </label>
                    <p className="text-sm text-gray-900">PDF Document</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <a
                    href={getFileUrl(note.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    <FaDownload className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>

                  {user && (
                    <button
                      onClick={handleBookmark}
                      className={`w-full flex items-center justify-center ${
                        isBookmarked ? "btn-danger" : "btn-secondary"
                      }`}
                    >
                      <FaBookmark className="w-4 h-4 mr-2" />
                      {isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NoteDetail;
