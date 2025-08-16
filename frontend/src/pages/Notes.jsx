import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getPublicNotes,
  Notesupvote,
  Notesdownvote,
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
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaComment,
  FaCalendar,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { getFileUrl } from "../utils/fileUtils";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [comments, setComments] = useState({});
  const [showAllComments, setShowAllComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [bookmarkedNotes, setBookmarkedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: "",
    university: "",
    sortBy: "latest",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const BACKEND_URL = "http://localhost:5000";
  const token = localStorage.getItem("token");
  const currentUserId = token
    ? JSON.parse(atob(token.split(".")[1])).userId
    : null;
  const isLoggedIn = Boolean(token);

  useEffect(() => {
    fetchNotes();
    if (isLoggedIn) {
      fetchBookmarks();
    }
  }, [filters]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.subject) params.subject = filters.subject;
      if (filters.university) params.university = filters.university;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.search) params.q = filters.search;

      const res = await getPublicNotes(params);
      const fetchedNotes = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];
      setNotes(fetchedNotes);

      // Fetch comments for each note
      fetchedNotes.forEach(async (note) => {
        try {
          const { data } = await getCommentsNotes(note._id);
          const commentsArray = Array.isArray(data)
            ? data
            : data.comments || [];
          setComments((prev) => ({
            ...prev,
            [note._id]: commentsArray,
          }));
        } catch (err) {
          console.error("Error fetching comments for note", note._id, err);
        }
      });
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      toast.error("Failed to load notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const { data } = await getBookmarks();
      const bookmarkedIds = data.map(
        (bookmark) => bookmark.note?._id || bookmark._id
      );
      setBookmarkedNotes(bookmarkedIds);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    }
  };

  const handleAddComment = async (noteId) => {
    if (!newComment[noteId]?.trim()) return;
    try {
      const { data: newC } = await createComment(noteId, newComment[noteId]);
      newC.user = {
        name: JSON.parse(localStorage.getItem("user"))?.name || "You",
      };
      setComments((prev) => ({
        ...prev,
        [noteId]: [...(prev[noteId] || []), newC],
      }));
      setNewComment((prev) => ({ ...prev, [noteId]: "" }));
      toast.success("Comment added successfully");
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error("Failed to add comment");
    }
  };

  const handleVote = async (id, type) => {
    if (!isLoggedIn) {
      toast.error("Please login to vote");
      return;
    }
    try {
      if (type === "upvote") {
        await Notesupvote(id);
        toast.success("Upvoted successfully");
      } else {
        await Notesdownvote(id);
        toast.success("Downvoted successfully");
      }
      fetchNotes();
    } catch (err) {
      console.error("Voting error:", err);
      toast.error("Failed to vote");
    }
  };

  const handleBookmark = async (noteId) => {
    if (!isLoggedIn) {
      toast.error("Please login to bookmark");
      return;
    }
    try {
      await createBookmark(noteId, {});
      fetchBookmarks();
      toast.success("Bookmarked successfully");
    } catch (err) {
      console.error("Error bookmarking note:", err);
      toast.error("Failed to bookmark");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      subject: "",
      university: "",
      sortBy: "latest",
      search: "",
    });
  };

  const NoteCard = ({ note }) => {
    const userVote = note.voters?.find((v) => v.user === currentUserId);
    const hasVoted = Boolean(userVote);
    const isBookmarked = bookmarkedNotes.includes(note._id);
    const noteComments = comments[note._id] || [];

    return (
      <div className="card p-6 hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaFilePdf className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {note.title}
              </h3>
              <p className="text-sm text-gray-600">{note.subject}</p>
            </div>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => handleBookmark(note._id)}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? "text-red-500 hover:bg-red-50"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <FaBookmark className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <FaUniversity className="w-4 h-4 mr-2" />
            <span>{note.university}</span>
          </div>

          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <FaTags className="w-4 h-4 mr-2" />
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="text-gray-500 text-xs">
                    +{note.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <FaUser className="w-4 h-4 mr-1" />
              <span>{note.uploadedBy?.name || "Unknown"}</span>
            </div>
            <div className="flex items-center">
              <FaCalendar className="w-4 h-4 mr-1" />
              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <button
              disabled={!isLoggedIn || hasVoted}
              onClick={() => handleVote(note._id, "upvote")}
              className={`flex items-center space-x-1 transition-colors ${
                hasVoted
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-green-600"
              }`}
            >
              <FaThumbsUp className="w-4 h-4 text-green-500" />
              <span>{note.upvotes || 0}</span>
            </button>
            <button
              disabled={!isLoggedIn || hasVoted}
              onClick={() => handleVote(note._id, "downvote")}
              className={`flex items-center space-x-1 transition-colors ${
                hasVoted
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-red-600"
              }`}
            >
              <FaThumbsDown className="w-4 h-4 text-red-500" />
              <span>{note.downvotes || 0}</span>
            </button>
            <div className="flex items-center space-x-1">
              <FaComment className="w-4 h-4 text-blue-500" />
              <span>{noteComments.length}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={getFileUrl(note.fileUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              View PDF
            </a>
            <a href={`/note/${note._id}`} className="btn-primary text-sm">
              View Details
            </a>
          </div>
        </div>

        {/* Comments Section */}
        {note.commentsEnabled && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="space-y-3">
              {noteComments
                .slice(0, showAllComments[note._id] ? undefined : 2)
                .map((comment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.user?.name || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                ))}

              {noteComments.length > 2 && (
                <button
                  onClick={() =>
                    setShowAllComments((prev) => ({
                      ...prev,
                      [note._id]: !prev[note._id],
                    }))
                  }
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {showAllComments[note._id]
                    ? "Show less"
                    : `Show ${noteComments.length - 2} more comments`}
                </button>
              )}

              {isLoggedIn && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment[note._id] || ""}
                    onChange={(e) =>
                      setNewComment((prev) => ({
                        ...prev,
                        [note._id]: e.target.value,
                      }))
                    }
                    className="flex-1 input-field text-sm"
                  />
                  <button
                    onClick={() => handleAddComment(note._id)}
                    disabled={!newComment[note._id]?.trim()}
                    className="btn-primary text-sm px-3 disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Browse Notes
            </h1>
            <p className="text-gray-600">
              Discover and explore study materials shared by students
            </p>
          </div>

          {/* Search and Filters */}
          <div className="card p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search notes, subjects, universities..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center space-x-2"
              >
                <FaFilter className="w-4 h-4" />
                <span>Filters</span>
              </button>

              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="input-field w-auto"
              >
                <option value="latest">Latest</option>
                <option value="top">Most Upvoted</option>
                <option value="down">Most Downvoted</option>
              </select>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by subject..."
                      value={filters.subject}
                      onChange={(e) =>
                        handleFilterChange("subject", e.target.value)
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by university..."
                      value={filters.university}
                      onChange={(e) =>
                        handleFilterChange("university", e.target.value)
                      }
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="btn-secondary text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
              {notes.length} note{notes.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Notes Grid */}
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <FaFilePdf className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No notes found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters
              </p>
              <button onClick={clearFilters} className="btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <NoteCard key={note._id} note={note} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
