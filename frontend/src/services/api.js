import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const loginUser = (data) => API.post("/auth/login", data);
export const registerUser = (data) => API.post("/auth/register", data);

// Notes
export const uploadNote = (data) => API.post("/notes/upload", data);
export const getAllNotes = () => API.get("/notes");
export const getMyNotes = () => API.get("/notes/my-notes");
export const getNotesById = (id) => API.get(`/notes/${id}`);
export const editNote = (id, data) => API.put(`/notes/${id}`, data);
export const deleteNote = (id) => API.delete(`/notes/${id}`);
export const Notesupvote = (id) => API.post(`/notes/${id}/upvote`);
export const Notesdownvote = (id) => API.post(`/notes/${id}/downvote`);
export const NotesComment = (id, data) =>
  API.post(`/notes/${id}/comments`, data);
export const NotesBookmark = (id, data) =>
  API.post(`/notes/${id}/bookmark`, data);
export const searchNotes = (query) => API.get(`/notes/search?q=${query}`);
