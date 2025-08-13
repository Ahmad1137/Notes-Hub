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
} from "react-icons/fa";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [comments, setComments] = useState({});
  const [showAllComments, setShowAllComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [bookmarkedNotes, setBookmarkedNotes] = useState([]); // ✅ store bookmarked note IDs

  const BACKEND_URL = "http://localhost:5000";
  const token = localStorage.getItem("token");
  const currentUserId = token
    ? JSON.parse(atob(token.split(".")[1])).userId
    : null;
  const isLoggedIn = Boolean(token);

  useEffect(() => {
    fetchNotes();
    if (isLoggedIn) {
      fetchBookmarks(); // ✅ also load bookmarks
    }
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await getPublicNotes();
      const fetchedNotes = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];
      setNotes(fetchedNotes);

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
      setNotes([]);
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
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleVote = async (id, type) => {
    if (!isLoggedIn) return;
    try {
      if (type === "upvote") {
        await Notesupvote(id);
      } else {
        await Notesdownvote(id);
      }
      fetchNotes();
    } catch (err) {
      console.error("Voting error:", err);
    }
  };

  const handleBookmark = async (noteId) => {
    if (!isLoggedIn) return;
    try {
      await createBookmark(noteId, {});
      fetchBookmarks(); // refresh bookmark list
    } catch (err) {
      console.error("Error bookmarking note:", err);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-indigo-700">
          All Notes
        </h1>

        {notes.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-12">
            No notes found.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => {
              const userVote = note.voters?.find(
                (v) => v.user === currentUserId
              );
              const hasVoted = Boolean(userVote);
              const isBookmarked = bookmarkedNotes.includes(note._id); // ✅ check bookmark status

              return (
                <div
                  key={note._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold mb-3 text-indigo-800">
                      {note.title}
                    </h2>
                    {isLoggedIn && (
                      <button
                        onClick={() => handleBookmark(note._id)}
                        className={`text-xl ${
                          isBookmarked ? "text-green-500" : "text-gray-400"
                        }`}
                        title={isBookmarked ? "Bookmarked" : "Add Bookmark"}
                      >
                        <FaBookmark />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center text-gray-600 mb-2 space-x-2">
                    <FaUniversity className="text-indigo-500" />
                    <span className="font-medium">
                      {note.university || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-2 space-x-2">
                    <FaTags className="text-indigo-500" />
                    <span>{note.tags?.join(", ") || "N/A"}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-2 space-x-2">
                    <FaUser className="text-indigo-500" />
                    <span>
                      Uploaded by: {note.uploadedBy?.name || "Unknown"}
                    </span>
                  </div>

                  <p className="text-gray-500 text-sm mb-4">
                    Visibility:{" "}
                    <span className="capitalize">{note.visibility}</span>
                  </p>

                  {/* Voting */}
                  <div className="flex space-x-4 text-gray-600 mb-4">
                    <button
                      disabled={!isLoggedIn || hasVoted}
                      onClick={() => handleVote(note._id, "upvote")}
                      className={`flex items-center space-x-1 ${
                        hasVoted ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <FaThumbsUp className="text-green-500" />
                      <span>{note.upvotes}</span>
                    </button>

                    <button
                      disabled={!isLoggedIn || hasVoted}
                      onClick={() => handleVote(note._id, "downvote")}
                      className={`flex items-center space-x-1 ${
                        hasVoted ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <FaThumbsDown className="text-red-500" />
                      <span>{note.downvotes}</span>
                    </button>
                  </div>

                  <a
                    href={`${BACKEND_URL}${note.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition"
                  >
                    <FaFilePdf className="mr-2" /> View PDF
                  </a>

                  {/* Comments Section */}
                  <div className="mt-6">
                    <h3 className="text-lg font-bold mb-4">Comments</h3>

                    {/* Add New Comment */}
                    {isLoggedIn && (
                      <div className="flex items-start space-x-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                          {JSON.parse(localStorage.getItem("user"))
                            ?.name?.charAt(0)
                            .toUpperCase() || "U"}
                        </div>

                        <div className="flex-1">
                          <textarea
                            value={newComment[note._id] || ""}
                            onChange={(e) =>
                              setNewComment({
                                ...newComment,
                                [note._id]: e.target.value,
                              })
                            }
                            placeholder="Write a comment..."
                            className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <button
                            onClick={() => handleAddComment(note._id)}
                            className="mt-2 px-4 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comment List */}
                    <div className="space-y-4">
                      {comments[note._id]?.length > 0 ? (
                        (showAllComments[note._id]
                          ? comments[note._id] // all comments
                          : comments[note._id].slice(-1)
                        ) // latest only
                          .map((c) => (
                            <div
                              key={c._id}
                              className="flex items-start space-x-3"
                            >
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                                {c.user?.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <div className="bg-gray-100 p-3 rounded-xl flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold">
                                    {c.user?.name || "Unknown User"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(c.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-800">{c.text}</p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 text-sm">
                          No comments yet. Be the first!
                        </p>
                      )}

                      {/* Toggle Read more / Read less */}
                      {comments[note._id]?.length > 1 && (
                        <button
                          onClick={() =>
                            setShowAllComments((prev) => ({
                              ...prev,
                              [note._id]: !prev[note._id], // toggle
                            }))
                          }
                          className="text-indigo-600 text-sm hover:underline"
                        >
                          {showAllComments[note._id]
                            ? "Read less"
                            : "Read more comments"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
