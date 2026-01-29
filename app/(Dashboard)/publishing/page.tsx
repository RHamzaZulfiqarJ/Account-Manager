"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Filter,
  MoreHorizontal,
  Clock,
  Send,
} from "lucide-react";

import ComposeModal from "@/app/(Dashboard)/publishing/ComposeModal";
import { PLATFORMS } from "@/libs/platform";
import { BsTwitterX } from "react-icons/bs";

export default function PublishingPage() {
  const [view, setView] = useState<"calendar" | "list">("list");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/posts")
      .then(res => res.json())
      .then(data => setPosts(data.posts));
  }, []);

  const closeCompose = async () => {
    setIsComposeOpen(false);
    setSelectedAccounts([]);

    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publishing</h1>
          <p className="text-gray-400">
            Manage and schedule your content across platforms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex p-1 bg-gray-900/50 rounded-xl border border-white/5">
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition-all ${
                view === "list"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
            </button>

            <button
              onClick={() => setView("calendar")}
              className={`p-2 rounded-lg transition-all ${
                view === "calendar"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Compose */}
          <button
            onClick={() => setIsComposeOpen(true)}
            className="cursor-pointer flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Publish Post
          </button>
        </div>
      </div>

      {/* Posts list */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-6">
            <h3 className="font-bold">All Scheduled Posts</h3>
          </div>

          <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {posts?.map((post, i) => {
            const time =
              post.status === "posted"
                ? post.postedAt
                : post.scheduledAt;

            const platform = PLATFORMS[post.socialAccount.platform as keyof typeof PLATFORMS];
            const Icon = platform?.icon ?? Send;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 flex items-center gap-6 hover:bg-white/20 transition-colors group"
              >
                <div
                  className={`p-3 rounded-xl bg-gray-900 border border-white/5`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                    {post.socialAccount.accountUsername}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.status === "posted" ? "Posted at" : "Scheduled for"} {new Date(time).toLocaleString()}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-800"></span>
                    <p className="text-sm text-gray-400 mt-1">
                      {post.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                      post.status === "posted"
                        ? "bg-emerald-500/10 text-emerald-500" : post.status === "pending"
                        ? "bg-gray-500/10 text-gray-400" : post.status === "processing"
                        ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {post.status}
                  </span>

                  <button className="p-2 text-gray-500 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <ComposeModal
        selectedAccounts={selectedAccounts}
        setSelectedAccounts={setSelectedAccounts}
        isOpen={isComposeOpen}
        onClose={closeCompose}
      />

    </motion.div>
  );
}
