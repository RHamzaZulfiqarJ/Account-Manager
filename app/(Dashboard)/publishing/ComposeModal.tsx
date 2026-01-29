"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Send,
  Calendar,
} from "lucide-react"
import { PLATFORMS } from "@/libs/platform";

interface ComposeModalProps {
  selectedAccounts: string[];
  setSelectedAccounts: (accounts: string[] | ((prev: string[]) => string[])) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ComposeModal({
  selectedAccounts,
  setSelectedAccounts,
  isOpen,
  onClose,
}: ComposeModalProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Array<{ id: string; platform: keyof typeof PLATFORMS; accountUsername: string }>>([]);

  useEffect(() => {
    async function loadAccounts() {
      const res = await fetch("/api/accounts");

      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
      }
    }

    loadAccounts();
  }, []);

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev: string[]) => {
      if (prev.includes(id)) {
        return prev.filter((accId) => accId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  async function handlePostNow() {
    if (!content.trim()) {
      setError("Post content is required");
      return;
    }

    if (selectedAccounts.length === 0) {
      setError("Select at least one account");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          accountIds: selectedAccounts,
          scheduledAt: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create post");
      }

      // reset UI
      setSelectedAccounts([]);
      setContent("");
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSchedule(date: Date) {
    if (!content || selectedAccounts.length === 0) return;

    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        accountIds: selectedAccounts,
        scheduledAt: date.toISOString(),
      }),
    });

    onClose();
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
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
                onClick={() => {
                  if (!loading) onClose();
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">

            {accounts.length === 0 && (
              <p className="text-gray-400">
                No accounts connected yet.
              </p>
            )}
            {accounts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accounts.map((acc) => {
                  const platform = PLATFORMS[acc.platform as keyof typeof PLATFORMS];
                  const Icon = platform?.icon;

                  return (
                    <button
                      key={acc.id}
                      onClick={() => toggleAccount(acc.id)}
                      className={`p-4 border rounded-2xl text-left transition-all capitalize w-full cursor-pointer ${
                        selectedAccounts.includes(acc.id)
                          ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20"
                          : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${platform.color}`} />
                        <div>
                          <p className="font-semibold capitalize">
                            {platform.name}
                          </p>
                          <p className="text-xs opacity-70">
                            @{acc.accountUsername}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

              {/* Textarea */}
              <div className="relative">
                {error && (
                  <p className="text-red-400 text-sm">
                    {error}
                  </p>
                )}
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setError(null);
                  }}
                  placeholder="What's happening? Share something amazing..."
                  className="w-full h-48 bg-gray-900/50 border border-white/5 rounded-2xl p-6 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none leading-relaxed"
                />
              </div>

              {/* Footer buttons */}
              <div className="flex gap-4 pt-4">
                <button 
                  disabled={loading}
                  onClick={() => handleSchedule(new Date())}
                  className="flex-1 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all">
                  <Calendar className="w-5 h-5" /> {loading ? "Scheduling..." : "Schedule Post"}
                </button>

                <button 
                  disabled={loading}
                  onClick={handlePostNow} 
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/20 active:scale-95 transition-all">
                    {loading ? "Posting..." : "Post Now"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
