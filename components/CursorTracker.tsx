"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function CursorTracker() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-purple-500/50 pointer-events-none z-[9999]"
        animate={{ x: mousePos.x - 16, y: mousePos.y - 16 }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 250,
          mass: 0.5,
        }}
      />

      {/* Center dot */}
      <motion.div
        className="fixed top-0 left-0 w-1 h-1 bg-purple-500 rounded-full pointer-events-none z-[9999]"
        animate={{ x: mousePos.x - 2, y: mousePos.y - 2 }}
        transition={{
          type: "spring",
          damping: 10,
          stiffness: 500,
          mass: 0.1,
        }}
      />

      {/* Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.05), transparent 80%)`,
        }}
      />
    </>
  )
}
