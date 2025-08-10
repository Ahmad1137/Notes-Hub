import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const MyNotes = () => {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const fetchNotes = async () => {
      const res = await fetch("/api/notes/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotes(data);
    };
    fetchNotes();
  }, [token]);

  const deleteNote = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await fetch(`/api/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotes(notes.filter((n) => n._id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Notes</h1>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {notes.map((note) => (
          <div
            key={note._id}
            className="border rounded-lg p-4 flex flex-col justify-between shadow"
          >
            <h2 className="font-semibold">{note.title}</h2>
            <p className="text-sm text-gray-600">{note.subject}</p>
            <div className="mt-3 flex justify-between">
              <Link
                to={`/note/${note._id}`}
                className="text-blue-500 hover:underline"
              >
                View
              </Link>
              <button
                onClick={() => deleteNote(note._id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyNotes;
