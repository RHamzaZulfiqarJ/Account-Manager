"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AppLogo from "@/components/AppLogo";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const cleanEmail = email.trim();

            if (!cleanEmail) {
                throw new Error("Email address is required");
            }

            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: cleanEmail }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || data?.message || "Request failed");
            }

            setMessage(data?.message || "If this email exists, a reset link has been sent.");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="chronos-page min-h-screen overflow-hidden px-4 py-5 sm:px-6 md:px-10 lg:px-14 xl:px-20">
            <AuthTopBar backLabel="Login" onBack={() => router.push("/login")} />

            <section className="mx-auto grid min-h-[calc(100vh-40px)] w-full max-w-[1180px] items-center gap-12 pt-24 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-20">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden min-w-0 lg:block"
                >
                    <div className="chronos-line mb-8" />
                    <p className="chronos-label">Recovery / Email checkpoint</p>

                    <h1 className="mt-7 max-w-4xl text-[clamp(3rem,6vw,5.4rem)] font-extralight leading-[0.9] tracking-[-0.085em] text-[var(--chronos-ink)]">
                        Recover access without breaking flow.
                    </h1>

                    <p className="chronos-subtitle mt-7 max-w-2xl">
                        Enter your email and MIMICO will send a secure reset link if the account exists.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                    className="w-full min-w-0"
                >
                    <AuthCard>
                        <AuthBrand label="Recovery" />

                        <div className="mb-7">
                            <p className="chronos-label">Password reset</p>
                            <h2 className="mt-3 text-4xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)] sm:text-5xl">
                                Email checkpoint
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-[var(--chronos-muted)]">
                                We will send a reset link if the email exists in your workspace.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AuthField label="Email address" icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="you@example.com"
                                    className="h-12 w-full pl-11 pr-4 text-sm"
                                />
                            </AuthField>

                            {message && <AuthSuccess message={message} />}
                            {error && <AuthAlert message={error} />}

                            <button
                                type="submit"
                                disabled={loading || Boolean(message)}
                                className="chronos-button w-full"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                ) : (
                                    <Send className="h-4 w-4" strokeWidth={1.75} />
                                )}
                                {message ? "Link sent" : "Send reset link"}
                            </button>
                        </form>

                        <div className="mt-7 border-t border-[var(--chronos-line)] pt-6 text-center">
                            <p className="text-sm text-[var(--chronos-muted)]">
                                Remembered your password?{" "}
                                <button
                                    type="button"
                                    onClick={() => router.push("/login")}
                                    className="font-medium text-[var(--chronos-ink)] underline-offset-4 transition hover:text-[var(--chronos-olive)] hover:underline"
                                >
                                    Sign in
                                </button>
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

function AuthField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="chronos-label">{label}</label>

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

function AuthSuccess({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 rounded-[20px] border border-[var(--chronos-olive)]/40 bg-[var(--chronos-olive)]/8 p-4 text-sm leading-6 text-[var(--chronos-body)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chronos-olive)]" strokeWidth={1.75} />
            <span>{message}</span>
        </div>
    );
}
