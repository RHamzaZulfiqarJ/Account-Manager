"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"
import { FaGoogle } from "react-icons/fa";
import {
  Share2,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Github,
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const email = form.email.value;
    const password = form.password.value;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Login failed");
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  }

  const handleOAuth = () => {
    window.location.href = "/api/auth/oauth/google"
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-950">

      {/* Back to Home */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/")}
        className="fixed top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-bold text-sm z-50 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </motion.button>

      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md glass p-10 rounded-[40px] border border-white/10 shadow-2xl relative"
      >
        {/* Logo */}
        <div
          className="flex flex-col items-center mb-10 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-600/40 mb-6">
            <Share2 className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl font-black text-white">
            Welcome back
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Ready to pulse your content?
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">
              Email Address
            </label>

            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-purple-400 transition-colors" />
              <input
                name="email"
                type="email"
                required
                placeholder="alex@sproutpulse.com"
                className="w-full bg-gray-900 border border-white/5 rounded-2xl py-5 pl-14 pr-5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm text-white"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
                Password
              </label>
              <button
                type="button"
                className="text-[10px] font-black text-purple-500 hover:text-purple-400 uppercase tracking-widest transition-colors"
              >
                Forgot?
              </button>
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full bg-gray-900 border border-white/5 rounded-2xl py-5 pl-14 pr-5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm text-white"
              />
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 text-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center gap-8">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px bg-white/5 flex-1" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">
              or connect via
            </span>
            <div className="h-px bg-white/5 flex-1" />
          </div>

          <button onClick={handleOAuth} className="w-full glass border-white/5 hover:bg-white/5 py-4 rounded-2xl flex items-center justify-center gap-3 text-lg font-bold transition-all text-white">
            <FaGoogle className="w-5 h-5" /> Sign in with Google
          </button>

          <p className="text-sm text-gray-500 font-medium">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-purple-500 font-black hover:text-purple-400 transition-colors hover:underline cursor-pointer"
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
