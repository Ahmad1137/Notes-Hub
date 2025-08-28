import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getProfile, updateProfile } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_no: "",
    address: "",
    profilePic: null,
  });
  const { updateUser } = useAuth();

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getProfile();
        setProfile(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone_no: data.phone_no || "",
          address: data.address || "",
          profilePic: null,
        });
        setImagePreview(data.profilePic || null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profilePic: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("phone_no", formData.phone_no);
      form.append("address", formData.address);
      if (formData.profilePic) {
        form.append("profilePic", formData.profilePic);
      }

      const { data } = await updateProfile(form);
      toast.success("Profile updated successfully!");
      setProfile(data.user);
      
      // Update user in context with new profile picture
      updateUser({
        ...data.user,
        profilePic: data.user.profilePic
      });
      
      // Update image preview with new profile picture
      if (data.user.profilePic) {
        setImagePreview(data.user.profilePic);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="text-center mt-10">Loading...</div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6 mt-8">
        <h1 className="text-2xl font-bold mb-6 text-center">My Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <img
              src={imagePreview || "/default-avatar.png"}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-3 text-sm"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="border rounded w-full p-2"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="border rounded w-full p-2 bg-gray-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone No</label>
            <input
              type="text"
              name="phone_no"
              value={formData.phone_no}
              onChange={handleChange}
              className="border rounded w-full p-2"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="border rounded w-full p-2"
              rows={3}
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={updating}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {updating ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Profile;
