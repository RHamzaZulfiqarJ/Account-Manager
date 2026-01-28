"use client"

import { motion } from "framer-motion"
import { CheckCircle, X } from "lucide-react"
import { BsTwitterX } from "react-icons/bs";

interface AccountCardProps {
  platform: string
  username: string
  connectedAt?: string
  loadingDelete?: boolean
  onDisconnect?: () => void
}

export default function StatCard({
  platform,
  username,
  connectedAt,
  loadingDelete,
  onDisconnect,
}: AccountCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ y: -4 }}
      className="
        glass p-6 rounded-2xl
        border border-white/10
        transition-all duration-300
        group
      "
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <BsTwitterX className="text-white" />
          <p className="text-sm uppercase tracking-wide text-gray-400">
            {platform}
          </p>
        </div>

        <CheckCircle className="text-emerald-500 w-5 h-5" />
      </div>

      {/* Username */}
      <h3 className="text-xl font-semibold text-white mb-5 transition">
        @{username}
      </h3>

      {/* Actions */}
      <button
        onClick={onDisconnect}
        disabled={loadingDelete}
        className="text-lg text-white hover:bg-rose-500 transition-all duration-300 bg-red-600 w-full p-2 rounded-2xl cursor-pointer"
      >
        {loadingDelete ? "Disconnecting..." : "Disconnect"}
      </button>

      {/* Connected At */}
      {connectedAt && (
        <p className="text-sm text-gray-400 mt-4 -mb-3 text-end">
          Connected on {new Date(connectedAt).toLocaleDateString()}
        </p>
      )}

    </motion.div>
  )
}
