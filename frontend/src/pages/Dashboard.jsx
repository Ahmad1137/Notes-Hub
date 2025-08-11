import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout"; // Assuming you have a Layout component

export default function Dashboard() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            📊 Dashboard
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold mb-2">📄 My Notes</h2>
              <p className="text-gray-600 mb-4">
                View, upload, and manage your notes & resources.
              </p>
              <Link
                to="/notes"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Notes
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold mb-2">📚 Resources</h2>
              <p className="text-gray-600 mb-4">
                Explore useful study resources shared by others.
              </p>
              <Link
                to="/resources"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Browse Resources
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold mb-2">⚙️ Profile</h2>
              <p className="text-gray-600 mb-4">
                Update your account information & settings.
              </p>
              <Link
                to="/profile"
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
