import React, { useState } from "react";
import { registerUser } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaExclamationCircle,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { validateForm, sanitizeInput, getPasswordStrength } from "../utils/validation";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone_no: "",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, checks: {}, strength: 'weak' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setForm({ ...form, [name]: sanitizedValue });
    
    // Update password strength in real-time
    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(sanitizedValue));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    
    // Validate field on blur
    const validation = validateForm(form, 'register');
    if (validation.errors[name]) {
      setErrors({ ...errors, [name]: validation.errors[name] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(form, 'register');
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ name: true, email: true, password: true, phone_no: true, address: true });
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await registerUser(form);
      toast.success("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
      
      // Set server errors
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach(error => {
          if (error.includes('Name') || error.includes('name')) {
            serverErrors.name = error;
          } else if (error.includes('Email') || error.includes('email')) {
            serverErrors.email = error;
          } else if (error.includes('Password') || error.includes('password')) {
            serverErrors.password = error;
          } else if (error.includes('Phone') || error.includes('phone')) {
            serverErrors.phone_no = error;
          } else if (error.includes('Address') || error.includes('address')) {
            serverErrors.address = error;
          }
        });
        setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const PasswordStrengthIndicator = () => {
    const { checks, strength } = passwordStrength;
    const strengthColors = {
      weak: 'text-red-500',
      medium: 'text-yellow-500',
      strong: 'text-green-500'
    };

    if (!form.password) return null;

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Password Strength:</span>
          <span className={`text-sm font-medium ${strengthColors[strength]}`}>
            {strength.charAt(0).toUpperCase() + strength.slice(1)}
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <div className={`flex items-center ${checks.length ? 'text-green-600' : 'text-gray-400'}`}>
            {checks.length ? <FaCheck className="w-3 h-3 mr-1" /> : <FaTimes className="w-3 h-3 mr-1" />}
            At least 8 characters
          </div>
          <div className={`flex items-center ${checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
            {checks.uppercase ? <FaCheck className="w-3 h-3 mr-1" /> : <FaTimes className="w-3 h-3 mr-1" />}
            One uppercase letter
          </div>
          <div className={`flex items-center ${checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
            {checks.lowercase ? <FaCheck className="w-3 h-3 mr-1" /> : <FaTimes className="w-3 h-3 mr-1" />}
            One lowercase letter
          </div>
          <div className={`flex items-center ${checks.number ? 'text-green-600' : 'text-gray-400'}`}>
            {checks.number ? <FaCheck className="w-3 h-3 mr-1" /> : <FaTimes className="w-3 h-3 mr-1" />}
            One number
          </div>
          <div className={`flex items-center ${checks.special ? 'text-green-600' : 'text-gray-400'}`}>
            {checks.special ? <FaCheck className="w-3 h-3 mr-1" /> : <FaTimes className="w-3 h-3 mr-1" />}
            One special character (@$!%*?&)
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-primary-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaGraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Student Notes Hub
          </h1>
          <p className="text-gray-600">
            Create your account to start sharing and discovering notes
          </p>
        </div>

        {/* Register Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`input-field pl-10 ${errors.name && touched.name ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && touched.name && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationCircle className="w-4 h-4 mr-1" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`input-field pl-10 ${errors.email && touched.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && touched.email && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationCircle className="w-4 h-4 mr-1" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`input-field pl-10 pr-10 ${errors.password && touched.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && touched.password && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationCircle className="w-4 h-4 mr-1" />
                  <span>{errors.password}</span>
                </div>
              )}
              <PasswordStrengthIndicator />
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone_no"
                  value={form.phone_no}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`input-field pl-10 ${errors.phone_no && touched.phone_no ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your phone number start with +92"
                />
              </div>
              {errors.phone_no && touched.phone_no && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationCircle className="w-4 h-4 mr-1" />
                  <span>{errors.phone_no}</span>
                </div>
              )}
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`input-field pl-10 ${errors.address && touched.address ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your address"
                />
              </div>
              {errors.address && touched.address && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationCircle className="w-4 h-4 mr-1" />
                  <span>{errors.address}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
            >
              Sign in to your account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-primary-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
