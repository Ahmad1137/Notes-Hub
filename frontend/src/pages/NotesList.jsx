"use client";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function NotesList() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/notes/public?search=${search}&subject=${subject}`
      );
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [search, subject]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-1/2 p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300"
            />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="p-3 border rounded-lg shadow-sm"
            >
              <option value="">All Subjects</option>
              <option value="math">Math</option>
              <option value="physics">Physics</option>
              <option value="computer-science">Computer Science</option>
              {/* Add more subjects dynamically if needed */}
            </select>
          </div>

          {/* Notes Grid */}
          {loading ? (
            <p className="text-center text-gray-500">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-center text-gray-500">No notes found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{note.subject}</p>
                  <p className="text-gray-600 line-clamp-3 mb-4">
                    {note.description}
                  </p>
                  <Link
                    to={`/notes/${note._id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
