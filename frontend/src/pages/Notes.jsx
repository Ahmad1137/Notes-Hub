import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getPublicNotes } from "../services/api";
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

  useEffect(() => {
    fetchNotes();
  }, []);
  const BACKEND_URL = "http://localhost:5000";
  const fetchNotes = async () => {
    try {
      const res = await getPublicNotes();
      setNotes(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setNotes([]);
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
            {notes.map((note) => (
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
                  <span>Uploaded by: {note.uploadedBy?.name || "Unknown"}</span>
                </div>

                <p className="text-gray-500 text-sm mb-4">
                  Visibility:{" "}
                  <span className="capitalize">{note.visibility}</span>
                </p>

                <div className="flex space-x-4 text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <FaThumbsUp className="text-green-500" />
                    <span>{note.upvotes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaThumbsDown className="text-red-500" />
                    <span>{note.downvotes}</span>
                  </div>
                </div>

                <a
                  href={`${BACKEND_URL}${note.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition"
                >
                  <FaFilePdf className="mr-2" /> View PDF
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
