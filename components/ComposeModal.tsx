"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Image,
  Video,
  Link,
  Sparkles,
  Send,
  Calendar,
} from "lucide-react"
import { generateCaption } from "@/services/geminiService"

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ComposeModal({
  isOpen,
  onClose,
}: ComposeModalProps) {
  const [content, setContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [platform, setPlatform] = useState("instagram")

  const handleAIGenerate = async () => {
    setIsGenerating(true)

    try {
      const prompt =
        content ||
        "Create a catchy social media caption for a summer sale."

      const suggestion = await generateCaption(prompt)

      if (suggestion) setContent(suggestion)
    } catch (error) {
      console.error("AI generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass rounded-3xl z-[101] shadow-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                Compose Post
              </h2>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              {/* Platforms */}
              <div className="flex gap-4">
                {["instagram", "twitter", "linkedin", "facebook"].map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all border ${
                        platform === p
                          ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20"
                          : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's happening? Share something amazing..."
                  className="w-full h-48 bg-gray-900/50 border border-white/5 rounded-2xl p-6 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none leading-relaxed"
                />

                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 ${
                        isGenerating ? "animate-spin" : ""
                      }`}
                    />
                    {isGenerating
                      ? "AI Thinking..."
                      : "AI Suggest"}
                  </button>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex gap-4 pt-4">
                <button className="flex-1 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all">
                  <Calendar className="w-5 h-5" />
                  Schedule
                </button>

                <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/20 active:scale-95 transition-all">
                  Post Now
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
