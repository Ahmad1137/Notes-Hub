import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { uploadNote, editNote } from "../services/api";
import { toast } from "react-toastify";
import Layout from "../components/Layout";

export default function UploadNote() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // If editing, note data will be here
  const editingNote = location.state?.note;

  const [title, setTitle] = useState(editingNote?.title || "");
  const [subject, setSubject] = useState(editingNote?.subject || "");
  const [university, setUniversity] = useState(editingNote?.university || "");
  const [tags, setTags] = useState(editingNote?.tags?.join(", ") || "");
  const [visibility, setVisibility] = useState(
    editingNote?.visibility || "public"
  );
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setSubject(editingNote.subject);
      setUniversity(editingNote.university);
      setTags(editingNote.tags?.join(", "));
      setVisibility(editingNote.visibility);
    }
  }, [editingNote]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subject", subject);
      formData.append("university", university);
      formData.append("tags", tags);
      formData.append("visibility", visibility);

      // If user selects a new file, append it
      if (file) formData.append("file", file);

      if (editingNote) {
        await editNote(editingNote._id, formData, token);
        toast.success("Note updated successfully!");
      } else {
        await uploadNote(formData, token);
        toast.success("Note uploaded successfully!");
      }

      navigate("/my-notes");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">
          {editingNote ? "Edit Note" : "Upload a Note"}
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            className="w-full p-2 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Subject"
            className="w-full p-2 border rounded"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="University"
            className="w-full p-2 border rounded"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Tags (comma separated)"
            className="w-full p-2 border rounded"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          <input
            type="file"
            accept="application/pdf"
            className="w-full p-2 border rounded"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                {editingNote ? "Updating..." : "Uploading..."}
              </>
            ) : (
              editingNote ? "Update Note" : "Upload Note"
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
