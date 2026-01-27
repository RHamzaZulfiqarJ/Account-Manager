"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, ChevronDown } from "lucide-react"

export default function Navbar() {

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

  return (
    <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between glass z-40">

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />

          <input
            type="text"
            placeholder="Search campaigns, posts, or keywords..."
            className="w-full bg-gray-900/50 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all text-sm"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-6 ml-4">

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full border-2 border-gray-950" />
        </button>

        <div className="h-8 w-px bg-white/5" />

        {/* Profile */}
        <button className="flex items-center gap-3 pl-2 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center border-2 border-white/10 group-hover:border-purple-500/50 transition-all overflow-hidden">
            <Image
              src="https://picsum.photos/seed/user1/40/40"
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>

          <div className="text-left hidden lg:block">
            <p className="text-sm font-semibold text-white">
              {loading ? "Loading..." : `${user.firstName} ${user.lastName}`}
            </p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              Admin Manager
            </p>
          </div>

          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  )
}
