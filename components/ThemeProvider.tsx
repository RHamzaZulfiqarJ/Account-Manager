"use client";

import { useEffect } from "react";

type Theme = "dark" | "light";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        const activeTheme = storedTheme || "dark";

        document.documentElement.setAttribute("data-theme", activeTheme);
    }, []);

    return <>{children}</>;
}
