"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Loader2, Lock } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AppLogo from "@/components/AppLogo";

export default function ResetPasswordPage() {
    const router = useRouter();
    const params = useParams();
    const token = typeof params.token === "string" ? params.token : "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const passwordsMatch = useMemo(() => {
        if (!confirmPassword) {
            return true;
        }

        return password === confirmPassword;
    }, [password, confirmPassword]);

    const canSubmit = password.length >= 8 && confirmPassword.length >= 8 && passwordsMatch && !loading;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            if (!token) {
                throw new Error("Reset token is missing");
            }

            if (password.length < 8) {
                throw new Error("Password must be at least 8 characters");
            }

            if (password !== confirmPassword) {
                throw new Error("Passwords do not match");
            }

            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    password,
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.message || data?.error || "Password reset failed");
            }

            setMessage("Password reset successful. Redirecting to login...");
            setPassword("");
            setConfirmPassword("");

            window.setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="chronos-page min-h-screen overflow-hidden px-4 py-5 sm:px-6 md:px-10 lg:px-14 xl:px-20">
            <AuthTopBar backLabel="Login" onBack={() => router.push("/login")} />

            <section className="mx-auto grid min-h-[calc(100vh-40px)] w-full max-w-[1180px] items-center gap-12 pt-24 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-20">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden min-w-0 lg:block"
                >
                    <div className="chronos-line mb-8" />
                    <p className="chronos-label">Recovery / Final gate</p>

                    <h1 className="mt-7 max-w-4xl text-[clamp(3rem,6vw,5.4rem)] font-extralight leading-[0.9] tracking-[-0.085em] text-[var(--chronos-ink)]">
                        Set a new access key.
                    </h1>

                    <p className="chronos-subtitle mt-7 max-w-2xl">
                        Create a new password and return to your workspace. Keep it strong and memorable.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                    className="w-full min-w-0"
                >
                    <AuthCard>
                        <AuthBrand label="Password reset" />

                        <div className="mb-7">
                            <p className="chronos-label">New password</p>
                            <h2 className="mt-3 text-4xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)] sm:text-5xl">
                                Re-entry
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-[var(--chronos-muted)]">
                                Use at least 8 characters. Matching is checked before submission.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AuthField label="New password" icon={<Lock className="h-4 w-4" strokeWidth={1.75} />}>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="At least 8 characters"
                                    className="h-12 w-full pl-11 pr-4 text-sm"
                                />
                            </AuthField>

                            <AuthField
                                label="Confirm password"
                                icon={<KeyRound className="h-4 w-4" strokeWidth={1.75} />}
                            >
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    placeholder="Repeat new password"
                                    className="h-12 w-full pl-11 pr-4 text-sm"
                                />
                            </AuthField>

                            {!passwordsMatch && (
                                <div className="rounded-[20px] border border-[var(--chronos-danger)]/40 bg-[var(--chronos-danger)]/5 p-4 text-sm text-[var(--chronos-danger)]">
                                    Passwords do not match.
                                </div>
                            )}

                            {message && <AuthSuccess message={message} />}
                            {error && <AuthAlert message={error} />}

                            <button type="submit" disabled={!canSubmit} className="chronos-button w-full">
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                ) : (
                                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                                )}
                                Reset password
                            </button>
                        </form>
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
