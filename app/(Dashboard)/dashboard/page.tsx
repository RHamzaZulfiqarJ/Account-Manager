"use client"

import { motion } from "framer-motion"
import { redirect } from "next/navigation";
import StatCard from "@/components/StatCard"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const data = [
  { name: "Mon", followers: 4000, reach: 2400 },
  { name: "Tue", followers: 3000, reach: 1398 },
  { name: "Wed", followers: 2000, reach: 9800 },
  { name: "Thu", followers: 2780, reach: 3908 },
  { name: "Fri", followers: 1890, reach: 4800 },
  { name: "Sat", followers: 2390, reach: 3800 },
  { name: "Sun", followers: 3490, reach: 4300 },
]

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const res = await fetch("/api/auth/user");

      if (!res.ok) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setLoading(false);
    }

    loadUser();
  }, [router]);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-400">
            Your social campaigns are performing 12% better than last week.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl border border-white/5 hover:border-white/10 text-sm font-medium transition-all">
            Export Report
          </button>

          <button className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-600/20">
            Generate Insights
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Reach" value="2.4M" change="14.2" trend="up" delay={0.1} />
        <StatCard label="Engagement" value="184K" change="8.1" trend="up" delay={0.2} />
        <StatCard label="Followers" value="52.1K" change="2.4" trend="down" delay={0.3} />
        <StatCard label="Publishes" value="1,240" change="24.5" trend="up" delay={0.4} />
      </div>

      {/* Charts + Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Area chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Audience Growth</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Followers
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Reach
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="followers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="reach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  dy={10}
                />

                <YAxis hide />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  itemStyle={{
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="followers"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#followers)"
                />

                <Area
                  type="monotone"
                  dataKey="reach"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  fill="url(#reach)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Publishing queue */}
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-white">
            Publishing Queue
          </h3>

          <div className="space-y-4 flex-1">
            {[
              {
                time: "10:30 AM",
                title: "Product Launch Vid",
                icon: CheckCircle2,
                color: "text-emerald-500",
              },
              {
                time: "02:00 PM",
                title: "User Story - Jane",
                icon: Clock,
                color: "text-amber-500",
              },
              {
                time: "04:45 PM",
                title: "Flash Sale Promo",
                icon: AlertCircle,
                color: "text-rose-500",
              },
              {
                time: "08:00 PM",
                title: "Community AMA",
                icon: Clock,
                color: "text-amber-500",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group"
              >
                <div className="text-xs text-gray-500 font-medium w-16">
                  {item.time}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-gray-200 group-hover:text-purple-400">
                    {item.title}
                  </p>
                </div>

                <item.icon className={`w-4 h-4 ${item.color}`} />
              </motion.div>
            ))}
          </div>

          <button className="mt-6 w-full py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-medium transition-all flex items-center justify-center gap-2">
            View Calendar <Zap className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}