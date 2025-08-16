// Utility function to get the correct file URL
export const getFileUrl = (fileUrl) => {
  if (!fileUrl) return "";

  // If fileUrl already starts with http, return as is
  if (fileUrl.startsWith("http")) {
    return fileUrl;
  }

  // For development, use localhost:5000
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL || "https://your-production-domain.com"
      : "http://localhost:5000";

  // Ensure fileUrl starts with /
  const cleanFileUrl = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;

  return `${baseUrl}${cleanFileUrl}`;
};

// Utility function to get file name from fileUrl
export const getFileName = (fileUrl) => {
  if (!fileUrl) return "";
  return fileUrl.split("/").pop() || "";
};

// Utility function to check if file is PDF
export const isPdfFile = (fileUrl) => {
  if (!fileUrl) return false;
  const fileName = getFileName(fileUrl);
  return fileName.toLowerCase().endsWith(".pdf");
};
