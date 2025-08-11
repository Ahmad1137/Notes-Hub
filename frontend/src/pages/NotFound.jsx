import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout"; // Assuming you have a Layout component

const NotFound = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-gray-600 mt-2 mb-4">Page not found.</p>
        <Link to="/" className="text-blue-500 hover:underline">
          Go Home
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
