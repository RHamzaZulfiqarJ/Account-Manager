"use client"

import Sidebar from "@/components/Sidebar"
import Navbar from "@/components/Navbar"
import { AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen overflow-hidden">

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">

        {/* Top Navbar */}
        <Navbar />

        {/* Page content */}
        <AnimatePresence mode="wait">
          <main
            key={pathname}
            className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar"
          >
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </AnimatePresence>

      </div>
    </div>
  )
}
