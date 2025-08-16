import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import {
  FaFilePdf,
  FaBookmark,
  FaThumbsUp,
  FaEye,
  FaUpload,
  FaChartLine,
  FaGraduationCap,
  FaSearch,
  FaUsers,
  FaClock,
} from "react-icons/fa";
import { getPublicNotes, getUserStats } from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalNotes: 0,
    myNotes: 0,
    bookmarks: 0,
    totalViews: 0,
  });
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [notesRes, statsRes] = await Promise.all([
        getPublicNotes({ limit: 6 }),
        getUserStats(),
      ]);

      setRecentNotes(notesRes.data?.data || []);
      setStats(
        statsRes.data || {
          totalNotes: 0,
          myNotes: 0,
          bookmarks: 0,
          totalViews: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, link }) => (
    <Link to={link} className="block">
      <div
        className={`card p-6 hover:shadow-lg transition-all duration-300 group ${color}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div
            className={`p-3 rounded-full ${
              color.includes("blue")
                ? "bg-blue-100"
                : color.includes("green")
                ? "bg-green-100"
                : color.includes("purple")
                ? "bg-purple-100"
                : "bg-orange-100"
            }`}
          >
            <Icon
              className={`w-6 h-6 ${
                color.includes("blue")
                  ? "text-blue-600"
                  : color.includes("green")
                  ? "text-green-600"
                  : color.includes("purple")
                  ? "text-purple-600"
                  : "text-orange-600"
              }`}
            />
          </div>
        </div>
      </div>
    </Link>
  );

  const QuickActionCard = ({ icon: Icon, title, description, link, color }) => (
    <Link to={link} className="block">
      <div className="card p-6 hover:shadow-lg transition-all duration-300 group">
        <div className={`p-3 rounded-full w-fit mb-4 ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
        <div className="mt-4 text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform duration-200">
          Get Started →
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 text-lg">
              Here's what's happening with your notes and resources
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={FaFilePdf}
              title="Total Notes"
              value={stats.totalNotes}
              color="bg-gradient-to-r from-blue-50 to-blue-100"
              link="/notes"
            />
            <StatCard
              icon={FaUpload}
              title="My Notes"
              value={stats.myNotes}
              color="bg-gradient-to-r from-green-50 to-green-100"
              link="/My-Notes"
            />
            <StatCard
              icon={FaBookmark}
              title="Bookmarks"
              value={stats.bookmarks}
              color="bg-gradient-to-r from-purple-50 to-purple-100"
              link="/bookmarks"
            />
            <StatCard
              icon={FaEye}
              title="Total Views"
              value={stats.totalViews}
              color="bg-gradient-to-r from-orange-50 to-orange-100"
              link="/analytics"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickActionCard
                icon={FaUpload}
                title="Upload Note"
                description="Share your study materials with the community"
                link="/upload"
                color="bg-primary-600"
              />
              <QuickActionCard
                icon={FaSearch}
                title="Browse Notes"
                description="Discover notes from other students"
                link="/notes"
                color="bg-green-600"
              />
              <QuickActionCard
                icon={FaGraduationCap}
                title="My Profile"
                description="Manage your account and preferences"
                link="/profile"
                color="bg-purple-600"
              />
            </div>
          </div>

          {/* Recent Notes */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Notes</h2>
              <Link
                to="/notes"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentNotes.map((note) => (
                <Link key={note._id} to={`/note/${note._id}`} className="block">
                  <div className="card p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FaFilePdf className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <FaThumbsUp className="w-4 h-4" />
                        <span>{note.upvotes}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{note.subject}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{note.university}</span>
                      <span>
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Community Stats */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Community Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                  <FaUsers className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Active Users
                </h3>
                <p className="text-2xl font-bold text-primary-600">1,234</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                  <FaFilePdf className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Resources
                </h3>
                <p className="text-2xl font-bold text-green-600">5,678</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
                  <FaChartLine className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Growth Rate
                </h3>
                <p className="text-2xl font-bold text-purple-600">+15%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
