import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import {
  FaFilePdf,
  FaBookmark,
  FaThumbsUp,
  FaThumbsDown,
  FaEye,
  FaUpload,
  FaChartLine,
  FaCalendar,
  FaUniversity,
  FaTags,
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaChartBar,
  FaChartArea,
} from "react-icons/fa";
import { getUserStats, getPublicNotes } from "../services/api";
import { toast } from "react-toastify";

export default function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalNotes: 0,
    myNotes: 0,
    bookmarks: 0,
    totalViews: 0,
  });
  const [myNotes, setMyNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30"); // days

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [statsRes, notesRes] = await Promise.all([
        getUserStats(),
        getPublicNotes({ uploadedBy: user?.id }),
      ]);

      setStats(
        statsRes.data || {
          totalNotes: 0,
          myNotes: 0,
          bookmarks: 0,
          totalViews: 0,
        }
      );

      setMyNotes(notesRes.data?.data || []);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics data
  const calculateAnalytics = () => {
    const now = new Date();
    const daysAgo = new Date(
      now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000
    );

    const recentNotes = myNotes.filter(
      (note) => new Date(note.createdAt) >= daysAgo
    );
    const totalUpvotes = myNotes.reduce(
      (sum, note) => sum + (note.upvotes || 0),
      0
    );
    const totalDownvotes = myNotes.reduce(
      (sum, note) => sum + (note.downvotes || 0),
      0
    );
    const totalViews = myNotes.reduce(
      (sum, note) => sum + (note.views || 0),
      0
    );

    // Calculate average engagement
    const avgUpvotes =
      myNotes.length > 0 ? (totalUpvotes / myNotes.length).toFixed(1) : 0;
    const avgDownvotes =
      myNotes.length > 0 ? (totalDownvotes / myNotes.length).toFixed(1) : 0;
    const avgViews =
      myNotes.length > 0 ? (totalViews / myNotes.length).toFixed(1) : 0;

    // Subject distribution
    const subjectStats = {};
    myNotes.forEach((note) => {
      subjectStats[note.subject] = (subjectStats[note.subject] || 0) + 1;
    });

    // University distribution
    const universityStats = {};
    myNotes.forEach((note) => {
      universityStats[note.university] =
        (universityStats[note.university] || 0) + 1;
    });

    return {
      recentNotes,
      totalUpvotes,
      totalDownvotes,
      totalViews,
      avgUpvotes,
      avgDownvotes,
      avgViews,
      subjectStats,
      universityStats,
    };
  };

  const analytics = calculateAnalytics();

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color }) => (
    <div className={`card p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className={`p-3 rounded-full ${
            color.includes("blue")
              ? "bg-blue-100"
              : color.includes("green")
              ? "bg-green-100"
              : color.includes("purple")
              ? "bg-purple-100"
              : color.includes("orange")
              ? "bg-orange-100"
              : "bg-gray-100"
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
                : color.includes("orange")
                ? "text-orange-600"
                : "text-gray-600"
            }`}
          />
        </div>
      </div>
      {trend && (
        <div
          className={`flex items-center mt-3 text-sm ${
            trend > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend > 0 ? (
            <FaArrowUp className="w-3 h-3 mr-1" />
          ) : (
            <FaArrowDown className="w-3 h-3 mr-1" />
          )}
          <span>{Math.abs(trend)}% from last period</span>
        </div>
      )}
    </div>
  );

  const ChartCard = ({ title, children }) => (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Track your notes performance and engagement metrics
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={FaFilePdf}
              title="Total Notes"
              value={stats.myNotes}
              subtitle={`${analytics.recentNotes.length} in last ${timeRange} days`}
              color="bg-gradient-to-r from-blue-50 to-blue-100"
            />
            <StatCard
              icon={FaThumbsUp}
              title="Total Upvotes"
              value={analytics.totalUpvotes}
              subtitle={`${analytics.avgUpvotes} avg per note`}
              color="bg-gradient-to-r from-green-50 to-green-100"
            />
            <StatCard
              icon={FaEye}
              title="Total Views"
              value={analytics.totalViews}
              subtitle={`${analytics.avgViews} avg per note`}
              color="bg-gradient-to-r from-purple-50 to-purple-100"
            />
            <StatCard
              icon={FaBookmark}
              title="Bookmarks"
              value={stats.bookmarks}
              subtitle="Your saved notes"
              color="bg-gradient-to-r from-orange-50 to-orange-100"
            />
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Subject Distribution */}
            <ChartCard title="Notes by Subject">
              <div className="space-y-3">
                {Object.entries(analytics.subjectStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([subject, count]) => (
                    <div
                      key={subject}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                        <span className="font-medium text-gray-900">
                          {subject}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{
                              width: `${(count / stats.myNotes) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </ChartCard>

            {/* University Distribution */}
            <ChartCard title="Notes by University">
              <div className="space-y-3">
                {Object.entries(analytics.universityStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([university, count]) => (
                    <div
                      key={university}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="font-medium text-gray-900">
                          {university}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(count / stats.myNotes) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </ChartCard>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <ChartCard title="Engagement Rate">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stats.myNotes > 0
                    ? (
                        (analytics.totalUpvotes / analytics.totalViews) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-sm text-gray-600">Upvotes per view</p>
                <div className="mt-4 flex items-center justify-center text-sm text-green-600">
                  <FaChartBar className="w-4 h-4 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Average Views">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analytics.avgViews}
                </div>
                <p className="text-sm text-gray-600">Per note</p>
                <div className="mt-4 flex items-center justify-center text-sm text-green-600">
                  <FaChartBar className="w-4 h-4 mr-1" />
                  <span>+8% from last month</span>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Note Quality Score">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.myNotes > 0
                    ? (
                        (analytics.totalUpvotes /
                          (analytics.totalUpvotes + analytics.totalDownvotes)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-sm text-gray-600">Positive feedback</p>
                <div className="mt-4 flex items-center justify-center text-sm text-green-600">
                  <FaChartBar className="w-4 h-4 mr-1" />
                  <span>+5% from last month</span>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Recent Activity */}
          <ChartCard title="Recent Notes Performance">
            <div className="space-y-4">
              {analytics.recentNotes.slice(0, 5).map((note) => (
                <div
                  key={note._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaFilePdf className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {note.title}
                      </h4>
                      <p className="text-sm text-gray-600">{note.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <FaThumbsUp className="w-4 h-4 text-green-500" />
                      <span>{note.upvotes || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaEye className="w-4 h-4 text-blue-500" />
                      <span>{note.views || 0}</span>
                    </div>
                    <div className="text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </Layout>
  );
}
