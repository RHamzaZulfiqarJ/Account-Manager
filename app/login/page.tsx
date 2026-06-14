"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AppLogo from "@/components/AppLogo";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");

        try {
            if (!email || !password) {
                throw new Error("Email and password are required");
            }

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.message || data?.error || "Invalid email or password");
            }

            router.push("/dashboard");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="chronos-page min-h-screen overflow-hidden px-4 py-5 sm:px-6 md:px-10 lg:px-14 xl:px-20">
            <AuthTopBar backLabel="Home" onBack={() => router.push("/")} />

            <section className="mx-auto grid min-h-[calc(100vh-40px)] w-full max-w-[1320px] items-center gap-12 pt-24 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-20">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden min-w-0 lg:block"
                >
                    <div className="chronos-line mb-8" />
                    <p className="chronos-label">Secure access / Returning operator</p>

                    <h1 className="mt-7 max-w-4xl text-[clamp(3rem,6vw,5.8rem)] font-extralight leading-[0.9] tracking-[-0.085em] text-[var(--chronos-ink)]">
                        Return to your publishing control room.
                    </h1>

                    <p className="chronos-subtitle mt-7 max-w-2xl">
                        Sign in to manage your channels, schedule content, monitor failed posts, and keep every social
                        workflow under control.
                    </p>

                    <div className="mt-12 grid max-w-2xl gap-6 border-t border-[var(--chronos-line)] pt-8 sm:grid-cols-3">
                        <AuthSignal value="01" label="Unified cockpit" />
                        <AuthSignal value="AI" label="Content tools" />
                        <AuthSignal value="24/7" label="Scheduling" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                    className="w-full min-w-0"
                >
                    <AuthCard>
                        <AuthBrand label="Account access" />

                        <div className="mb-7">
                            <p className="chronos-label">Sign in</p>
                            <h2 className="mt-3 text-4xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)] sm:text-5xl">
                                Welcome back
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-[var(--chronos-muted)]">
                                Use your credentials or continue with Google.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AuthField label="Email address" icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    className="h-12 w-full pl-11 pr-4 text-sm"
                                />
                            </AuthField>

                            <AuthField
                                label="Password"
                                action={
                                    <button
                                        type="button"
                                        onClick={() => router.push("/forgot-password")}
                                        className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--chronos-muted)] transition duration-700 hover:text-[var(--chronos-olive)]"
                                    >
                                        Forgot?
                                    </button>
                                }
                                icon={<Lock className="h-4 w-4" strokeWidth={1.75} />}
                            >
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Enter password"
                                    className="h-12 w-full pl-11 pr-4 text-sm"
                                />
                            </AuthField>

                            {error && <AuthAlert message={error} />}

                            <button type="submit" disabled={loading} className="chronos-button w-full">
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                ) : (
                                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                                )}
                                Sign in
                            </button>

                            <div className="flex items-center gap-4 py-1">
                                <div className="h-px flex-1 bg-[var(--chronos-line)]" />
                                <span className="chronos-label">or</span>
                                <div className="h-px flex-1 bg-[var(--chronos-line)]" />
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href = "/api/auth/oauth/google";
                                }}
                                className="chronos-button chronos-button-soft w-full"
                            >
                                <FaGoogle className="h-4 w-4" />
                                Continue with Google
                            </button>
                        </form>

                        <div className="mt-7 border-t border-[var(--chronos-line)] pt-6 text-center">
                            <p className="text-sm text-[var(--chronos-muted)]">
                                New to MIMICO?{" "}
                                <button
                                    type="button"
                                    onClick={() => router.push("/signup")}
                                    className="font-medium text-[var(--chronos-ink)] underline-offset-4 transition hover:text-[var(--chronos-olive)] hover:underline"
                                >
                                    Create workspace
                                </button>
                            </p>
                        </div>

                        <div className="mt-6 flex items-start gap-3 rounded-[22px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-4">
                            <ShieldCheck
                                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chronos-olive)]"
                                strokeWidth={1.75}
                            />
                            <p className="text-xs leading-6 text-[var(--chronos-muted)]">
                                Your session is protected and platform access stays separated by integration.
                            </p>
                        </div>
                    </AuthCard>
                </motion.div>
            </section>
        </main>
    );
}

function AuthTopBar({ backLabel, onBack }: { backLabel: string; onBack: () => void }) {
    return (
        <div className="fixed left-4 right-4 top-5 z-20 flex items-center justify-between gap-3 sm:left-6 sm:right-6 md:left-10 md:right-10 lg:left-14 lg:right-14 xl:left-20 xl:right-20">
            <button type="button" onClick={onBack} className="chronos-button chronos-button-soft">
                <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                {backLabel}
            </button>

            <ThemeToggle />
        </div>
    );
}

function AuthCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-[28px] border border-[var(--chronos-line-strong)] bg-[var(--chronos-sheet)]/76 p-5 shadow-[0_30px_140px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-7 md:p-8">
            {children}
        </div>
    );
}

function AuthBrand({ label }: { label: string }) {
    return (
        <div className="mb-9 flex items-center gap-3">
            <AppLogo size="md" />
            <div>
                <p className="text-sm font-medium text-[var(--chronos-ink)]">MIMICO</p>
                <p className="chronos-label mt-1">{label}</p>
            </div>
        </div>
    );
}

function AuthField({
    label,
    icon,
    action,
    children,
}: {
    label: string;
    icon: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
                <label className="chronos-label">{label}</label>
                {action}
            </div>

            <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--chronos-muted)]">
                    {icon}
                </span>
                {children}
            </div>
        </div>
    );
}

function AuthAlert({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 rounded-[20px] border border-[var(--chronos-danger)]/40 bg-[var(--chronos-danger)]/5 p-4 text-sm leading-6 text-[var(--chronos-danger)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>{message}</span>
        </div>
    );
}

function AuthSignal({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <p className="text-4xl font-extralight tracking-[-0.08em] text-[var(--chronos-ink)]">{value}</p>
            <p className="chronos-label mt-4">{label}</p>
        </div>
    );
}
