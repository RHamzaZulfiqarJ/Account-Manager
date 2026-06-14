"use client";

import Navbar from "@/components/Navbar";
import CursorTracker from "@/components/CursorTracker";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="chronos-page min-h-screen overflow-x-hidden">
            <CursorTracker />
            <Navbar />

            <main className="custom-scrollbar min-h-screen px-4 pb-10 pt-24 sm:px-6 md:px-10 lg:px-14 xl:px-20">
                <div className="mx-auto w-full max-w-[1500px]">{children}</div>
            </main>
        </div>
    );
}
