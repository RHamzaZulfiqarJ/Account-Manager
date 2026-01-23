"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  change: string
  trend: "up" | "down"
  delay?: number
}

export default function StatCard({
  label,
  value,
  change,
  trend,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="glass p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-500 group cursor-default"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <p className="text-gray-400 text-sm font-medium">
          {label}
        </p>

        <div
          className={`p-1.5 rounded-lg ${
            trend === "up"
              ? "bg-emerald-500/10"
              : "bg-rose-500/10"
          }`}
        >
          {trend === "up" ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          )}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-3">
        <h3 className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">
          {value}
        </h3>

        <p
          className={`text-xs mb-1 font-semibold ${
            trend === "up"
              ? "text-emerald-500"
              : "text-rose-500"
          }`}
        >
          {trend === "up" ? "+" : ""}
          {change}%
        </p>
      </div>

      {/* Mini graph */}
      <div className="mt-4 h-8 flex items-end gap-1 overflow-hidden">
        {[40, 70, 45, 90, 65, 85, 55, 100].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{
              delay: delay + i * 0.05,
              duration: 0.8,
            }}
            className={`flex-1 rounded-t-sm ${
              trend === "up"
                ? "bg-emerald-500/20"
                : "bg-rose-500/20"
            }`}
          />
        ))}
      </div>
    </motion.div>
  )
}
