import React, { useState, useContext } from "react";
import { loginUser } from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGraduationCap,
  FaExclamationCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { validateForm, sanitizeInput } from "../utils/validation";
import "../index.css";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setForm({ ...form, [name]: sanitizedValue });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    
    // Validate field on blur
    const validation = validateForm({ [name]: form[name], password: form.password, email: form.email }, 'login');
    if (validation.errors[name]) {
      setErrors({ ...errors, [name]: validation.errors[name] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(form, 'login');
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ email: true, password: true });
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await loginUser(form);
      login(res.data.user, res.data.token);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
      
      // Set server errors
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach(error => {
          if (error.includes('email') || error.includes('Email')) {
            serverErrors.email = error;
          } else if (error.includes('password') || error.includes('Password')) {
            serverErrors.password = error;
          }
        });
        setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaGraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to access your student notes hub
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter your password"
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
                  Signing in...
                </div>
              ) : (
                "Sign In"
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
                  New to Student Notes Hub?
                </span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our{" "}
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

export default LoginPage;
