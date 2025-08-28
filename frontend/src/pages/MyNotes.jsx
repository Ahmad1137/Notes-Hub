import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { toast } from "react-toastify";
import {
  getMyNotes,
  deleteNote as apiDeleteNote,
  editNote,
} from "../services/api";
import {
  FaFilePdf,
  FaUser,
  FaTags,
  FaUniversity,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";

export default function MyNotes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const res = await getMyNotes();
        console.log("Fetched My Notes:", res);
        setNotes(res.data); // adjust if API response differs
      } catch (err) {
        console.error("Error fetching my notes:", err);
        toast.error("Failed to load notes");
        setNotes([]);
      }
      setLoading(false);
    };

    fetchNotes();
  }, []);

  const deleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    setDeleting(id);
    try {
      await apiDeleteNote(id);
      setNotes(notes.filter((note) => note._id !== id));
      toast.success("Note deleted successfully");
    } catch (err) {
      console.error("Failed to delete note:", err);
      toast.error("Failed to delete note. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-indigo-700 text-center">
          My Notes
        </h1>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">
            You have no notes yet.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div
                key={note._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col"
              >
                <h2 className="text-2xl font-semibold mb-3 text-indigo-800">
                  {note.title}
                </h2>

                <p className="text-gray-700 mb-1">
                  Subject:{" "}
                  <span className="font-medium">{note.subject || "N/A"}</span>
                </p>

                <div className="flex items-center text-gray-600 mb-2 space-x-2">
                  <FaUniversity className="text-indigo-500" />
                  <span>{note.university || "N/A"}</span>
                </div>

                <div className="flex items-center text-gray-600 mb-2 space-x-2">
                  <FaTags className="text-indigo-500" />
                  <span>{note.tags?.join(", ") || "N/A"}</span>
                </div>

                <p className="text-gray-500 text-sm mb-2 capitalize">
                  Visibility: {note.visibility}
                </p>

                <div className="flex space-x-6 text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <FaThumbsUp className="text-green-500" />
                    <span>{note.upvotes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaThumbsDown className="text-red-500" />
                    <span>{note.downvotes}</span>
                  </div>
                </div>

                <div className="mt-auto flex justify-between items-center">
                  <Link
                    to={`/note/${note._id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => deleteNote(note._id)}
                    disabled={deleting === note._id}
                    className="text-red-600 hover:text-red-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    type="button"
                  >
                    {deleting === note._id ? (
                      <>
                        <div className="loading-spinner mr-1 w-3 h-3"></div>
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                  <button
                    type="button"
                    className="text-green-600 hover:text-green-800 font-semibold"
                    onClick={() => navigate("/upload", { state: { note } })}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
