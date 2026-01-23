"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Calendar } from "lucide-react";

const barData = [
  { platform: "Facebook", engagement: 4000, reach: 2400 },
  { platform: "Instagram", engagement: 7000, reach: 5500 },
  { platform: "Twitter", engagement: 3000, reach: 4800 },
  { platform: "LinkedIn", engagement: 2000, reach: 3000 },
  { platform: "TikTok", engagement: 8500, reach: 9000 },
];

const pieData = [
  { name: "Organic", value: 450 },
  { name: "Paid", value: 300 },
  { name: "Referral", value: 250 },
];

const COLORS = ["#8b5cf6", "#6366f1", "#4f46e5"];

export default function AnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Performance</h1>
          <p className="text-gray-400">
            Deep dive into your social ecosystem metrics.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
            <Calendar className="w-4 h-4" /> Last 30 Days
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-600/20">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="glass p-8 rounded-3xl border border-white/5">
          <h3 className="text-xl font-bold mb-8">
            Engagement by Platform
          </h3>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={12}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="platform"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                />
                <Bar
                  dataKey="engagement"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="reach"
                  fill="#60a5fa"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass p-8 rounded-3xl border border-white/5">
          <h3 className="text-xl font-bold mb-8">Traffic Sources</h3>

          <div className="flex flex-col md:flex-row items-center justify-around h-[350px]">
            <div className="w-full h-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-6 w-full md:w-1/3">
              {pieData.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i] }}
                    />
                    <span className="text-sm font-medium text-gray-400">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {item.value}k
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="glass p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-purple-900/10 to-transparent">
        <h3 className="text-xl font-bold mb-6">
          Audience Demographics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Top Region", value: "USA, New York", icon: "🌍" },
            { label: "Avg Age", value: "24-34 Years", icon: "👤" },
            { label: "Gender Split", value: "52% F / 48% M", icon: "🚻" },
            { label: "Peak Time", value: "18:00 - 21:00", icon: "🕒" },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <span className="text-2xl">{item.icon}</span>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                {item.label}
              </p>
              <p className="text-lg font-bold text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
