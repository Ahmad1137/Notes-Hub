import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getBookmarks, removeBookmark } from "../services/api";
import {
  FaFilePdf,
  FaBookmark,
  FaThumbsUp,
  FaThumbsDown,
  FaTrash,
  FaUser,
  FaTags,
  FaUniversity,
  FaCalendar,
  FaEye,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { getFileUrl } from "../utils/fileUtils";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const { data } = await getBookmarks();
      setBookmarks(data || []);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (noteId) => {
    try {
      await removeBookmark(noteId);
      setBookmarks((prev) =>
        prev.filter(
          (bookmark) => bookmark.note?._id !== noteId && bookmark._id !== noteId
        )
      );
      toast.success("Bookmark removed successfully");
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast.error("Failed to remove bookmark");
    }
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const note = bookmark.note || bookmark;
    if (filter === "all") return true;
    if (filter === "recent") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(note.createdAt) > oneWeekAgo;
    }
    return true;
  });

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
        <FaBookmark className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No bookmarks yet
      </h3>
      <p className="text-gray-600 mb-4">
        Start exploring notes and bookmark the ones you find useful!
      </p>
      <a href="/notes" className="btn-primary inline-flex items-center">
        Browse Notes
      </a>
    </div>
  );

  const BookmarkCard = ({ bookmark }) => {
    const note = bookmark.note || bookmark;
    const isBookmarked = true; // Since this is the bookmarks page

    return (
      <div className="card p-6 hover:shadow-lg transition-all duration-300">
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleRemoveBookmark(note._id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove bookmark"
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>

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

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <FaThumbsUp className="w-4 h-4 text-green-500" />
              <span>{note.upvotes || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaThumbsDown className="w-4 h-4 text-red-500" />
              <span>{note.downvotes || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaEye className="w-4 h-4 text-blue-500" />
              <span>{note.views || 0}</span>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Bookmarks
                </h1>
                <p className="text-gray-600">
                  Your saved notes and resources ({bookmarks.length} total)
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="all">All Bookmarks</option>
                  <option value="recent">Recent (Last 7 days)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookmarks Grid */}
          {filteredBookmarks.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark._id || bookmark.note?._id}
                  bookmark={bookmark}
                />
              ))}
            </div>
          )}

          {/* Stats */}
          {bookmarks.length > 0 && (
            <div className="mt-8 card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bookmark Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {bookmarks.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Bookmarks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {
                      bookmarks.filter((b) => {
                        const note = b.note || b;
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        return new Date(note.createdAt) > oneWeekAgo;
                      }).length
                    }
                  </p>
                  <p className="text-sm text-gray-600">Added This Week</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(bookmarks.map((b) => (b.note || b).subject)).size}
                  </p>
                  <p className="text-sm text-gray-600">Different Subjects</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
