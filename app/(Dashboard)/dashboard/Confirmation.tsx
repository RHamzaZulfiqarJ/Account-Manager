"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, AlertTriangle } from "lucide-react"

interface ConfirmationProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function Confirmation({
  isOpen,
  onConfirm,
  onCancel,
}: ConfirmationProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass rounded-3xl z-[101] shadow-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                Confirm Deletion
              </h2>

              <button
                onClick={onCancel}
                className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-4 text-center">
              <p className="text-white text-lg font-semibold">
                Are you sure you want to disconnect this account?
              </p>

              <p className="text-sm text-gray-400">
                This action will remove the account from your dashboard.
                You can reconnect it anytime later.
              </p>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={onCancel}
                  className="cursor-pointer flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={onConfirm}
                  className="cursor-pointer flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/20 transition"
                >
                  Yes, disconnect
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
