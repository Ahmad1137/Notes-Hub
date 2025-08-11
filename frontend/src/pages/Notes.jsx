import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getPublicNotes,
  Notesupvote,
  Notesdownvote,
  createComment,
  getCommentsNotes,
} from "../services/api";
import {
  FaFilePdf,
  FaUser,
  FaTags,
  FaUniversity,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [comments, setComments] = useState({}); // store comments per noteId
  const [newComment, setNewComment] = useState({}); // store draft comment per noteId

  const BACKEND_URL = "http://localhost:5000";
  const token = localStorage.getItem("token");
  const currentUserId = token
    ? JSON.parse(atob(token.split(".")[1])).userId
    : null;
  const isLoggedIn = Boolean(token);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await getPublicNotes();
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
          console.log("Fetched comments for note", note._id, commentsArray);
        } catch (err) {
          console.error("Error fetching comments for note", note._id, err);
        }
      });
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setNotes([]);
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
      fetchNotes(); // refresh notes (and votes)
    } catch (err) {
      console.error("Voting error:", err);
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

              return (
                <div
                  key={note._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col"
                >
                  <h2 className="text-2xl font-semibold mb-3 text-indigo-800">
                    {note.title}
                  </h2>

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

                  {/* Comments */}
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-700 mb-2">
                      Comments
                    </h3>
                    <div className="space-y-1 mb-3 max-h-32 overflow-y-auto border p-2 rounded">
                      {(comments[note._id] || []).length > 0 ? (
                        comments[note._id].map((c) => (
                          <div
                            key={c._id || `${note._id}-${Math.random()}`}
                            className="text-sm"
                          >
                            <strong>{c.user?.name || "Unknown"}:</strong>{" "}
                            {c.text}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">
                          No comments yet.
                        </p>
                      )}
                    </div>

                    {isLoggedIn && (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newComment[note._id] || ""}
                          onChange={(e) =>
                            setNewComment((prev) => ({
                              ...prev,
                              [note._id]: e.target.value,
                            }))
                          }
                          className="flex-1 border rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => handleAddComment(note._id)}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Post
                        </button>
                      </div>
                    )}
                  </div>

                  <a
                    href={`${BACKEND_URL}${note.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition"
                  >
                    <FaFilePdf className="mr-2" /> View PDF
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
