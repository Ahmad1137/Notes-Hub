import axios from "axios";

const API = axios.create({
  baseURL: "https://notes-hub-tjkp.onrender.com/api",
  // baseURL: "http://localhost:5000/api",
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const loginUser = (data) => API.post("/auth/login", data);
export const registerUser = (data) => API.post("/auth/register", data);
//profiles
// Profile
export const getProfile = () => API.get("/auth/profile");
export const updateProfile = (formData) =>
  API.put("/auth/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// User Stats
export const getUserStats = () => API.get("/auth/stats");

// Notes
export const uploadNote = (data) => API.post("/notes/upload", data);
// export const uploadFile = (data) => API.post("/notes/upload-file", data);
export const getAllNotes = () => API.get("/notes");
export const getPublicNotes = (params = {}) => API.get("/notes", { params });
export const getMyNotes = () => API.get("/notes/my-notes");
export const getNotesById = (id) => API.get(`/notes/${id}`);
export const editNote = (id, data) => API.put(`/notes/${id}`, data);
export const deleteNote = (id) => API.delete(`/notes/${id}`);
export const Notesupvote = (id) => API.post(`/notes/${id}/upvote`);
export const Notesdownvote = (id) => API.post(`/notes/${id}/downvote`);
export const createComment = (noteId, text) =>
  API.post(`/notes/${noteId}/comments`, { text });
export const getCommentsNotes = (id) => API.get(`/notes/${id}/comments`);
export const createBookmark = (id, data) =>
  API.post(`/notes/${id}/bookmark`, data);
export const removeBookmark = (id) => API.delete(`/notes/${id}/bookmark`);
export const getBookmarks = () => API.get("/notes/bookmarks/me");
export const searchNotes = async (query) => {
  try {
    const res = await API.get("/notes/search", { params: query });
    return res.data;
  } catch (err) {
    console.error("Search API Error:", err);
    return [];
  }
};
