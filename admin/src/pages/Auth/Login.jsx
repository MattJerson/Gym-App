import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Shield,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("🔐 Attempting login with:", email);

      // Sign in with Supabase
      const {
        data: { user },
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("❌ Auth sign-in failed:", signInError);
        throw signInError;
      }

      console.log("✅ Auth successful, user:", user?.id);

      // Check if user is admin
      console.log("🔍 Checking admin status for user:", user.id);
      const { data: profile, error: profileError } = await supabase
        .from("registration_profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      console.log("📋 Profile query result:", { profile, profileError });

      if (profileError) {
        console.error("❌ Profile fetch error:", profileError);
        await supabase.auth.signOut();
        throw new Error(
          `Profile Error: ${profileError.message} (Code: ${profileError.code})`
        );
      }

      if (!profile?.is_admin) {
        console.error("❌ User is not admin:", profile);
        await supabase.auth.signOut();
        throw new Error("Unauthorized: Admin access required");
      }

      console.log("✅ Admin verified, redirecting to dashboard");
      // Success - redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(
        err.message || "Failed to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-100 to-transparent rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-gray-100 to-transparent rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          {/* Gradient header bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800"></div>

          {/* Header */}
          <div className="p-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-5 shadow-lg relative group">
              <Shield className="w-10 h-10 text-white transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-gray-500 font-medium">Gym App Administration</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 rounded-xl shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-red-900 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 ml-1"
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail
                    className={`w-5 h-5 transition-all duration-200 ${
                      focusedField === "email"
                        ? "text-slate-900 scale-110"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 ml-1"
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock
                    className={`w-5 h-5 transition-all duration-200 ${
                      focusedField === "password"
                        ? "text-slate-900 scale-110"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-8 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Login to Admin Panel</span>
                  <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-2 text-center">
            <div className="flex items-center justify-center gap-2 py-4 px-6 bg-gray-50 rounded-xl border border-gray-100">
              <Lock className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600 font-medium">
                Secure Admin-Only Access
              </p>
            </div>
          </div>
        </div>

        {/* Floating shadow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-3xl opacity-30 blur-2xl -z-10"></div>
      </div>
    </div>
  );
}
