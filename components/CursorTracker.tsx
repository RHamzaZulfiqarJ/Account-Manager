"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorTracker() {
    const [mounted, setMounted] = useState(false);
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    const smoothX = useSpring(mouseX, {
        stiffness: 90,
        damping: 28,
        mass: 0.7,
    });

    const smoothY = useSpring(mouseY, {
        stiffness: 90,
        damping: 28,
        mass: 0.7,
    });

    useEffect(() => {
        setMounted(true);

        const handleMouseMove = (event: MouseEvent) => {
            mouseX.set(event.clientX);
            mouseY.set(event.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [mouseX, mouseY]);

    if (!mounted) {
        return null;
    }

    return (
        <>
            <motion.div
                className="pointer-events-none fixed left-0 top-0 z-[200] hidden h-8 w-8 rounded-full border border-[var(--chronos-olive)]/45 mix-blend-difference md:block"
                style={{
                    x: smoothX,
                    y: smoothY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />

            <motion.div
                className="pointer-events-none fixed left-0 top-0 z-[201] hidden h-1.5 w-1.5 rounded-full bg-[var(--chronos-olive)] md:block"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />

            <motion.div
                className="pointer-events-none fixed inset-0 z-0 hidden md:block"
                style={{
                    background: `radial-gradient(520px at ${smoothX.get()}px ${smoothY.get()}px, rgba(142, 161, 89, 0.055), transparent 72%)`,
                }}
            />
        </>
    );
}
