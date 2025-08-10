import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NoteDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [note, setNote] = useState(null);

  useEffect(() => {
    const fetchNote = async () => {
      const res = await fetch(`/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNote(data);
    };
    fetchNote();
  }, [id, token]);

  if (!note) return <div className="text-center mt-10">Loading note...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{note.title}</h1>
      <p className="mb-4 text-gray-700">{note.description}</p>
      <iframe
        src={note.fileUrl}
        title="PDF Viewer"
        className="w-full h-[600px] border rounded-lg"
      />
    </div>
  );
};

export default NoteDetail;
