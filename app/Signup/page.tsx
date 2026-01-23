"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Share2,
  Lock,
  Mail,
  User,
  ArrowRight,
  Check,
  ArrowLeft,
} from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      router.push("/login")
    }, 1200)
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
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl glass p-10 rounded-[40px] border border-white/10 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30 mb-6">
            <Share2 className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl font-black text-white">
            Create Account
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Join the future of social management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">
                First Name
              </label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Alex"
                  className="w-full bg-gray-900 border border-white/5 rounded-2xl py-5 pl-14 pr-5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm text-white"
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">
                Last Name
              </label>
              <input
                type="text"
                required
                placeholder="Rivera"
                className="w-full bg-gray-900 border border-white/5 rounded-2xl py-5 px-5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm text-white"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="email"
                required
                placeholder="alex@sproutpulse.com"
                className="w-full bg-gray-900 border border-white/5 rounded-2xl py-5 pl-14 pr-5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm text-white"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                className="w-full bg-gray-900 border border-white/5 rounded-2xl py-5 pl-14 pr-5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm text-white"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 text-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create Account <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/Login")}
              className="text-purple-500 font-black hover:text-purple-400 transition-colors cursor-pointer hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
