"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, Lock, Mail, User } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AppLogo from "@/components/AppLogo";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");

    const passwordScore = useMemo(() => {
        let score = 0;

        if (password.length >= 8) {
            score += 1;
        }

        if (/[A-Z]/.test(password)) {
            score += 1;
        }

        if (/[0-9]/.test(password)) {
            score += 1;
        }

        if (/[^A-Za-z0-9]/.test(password)) {
            score += 1;
        }

        return score;
    }, [password]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(event.currentTarget);
        const firstName = String(formData.get("firstName") || "").trim();
        const lastName = String(formData.get("lastName") || "").trim();
        const email = String(formData.get("email") || "").trim();

        try {
            if (!firstName || !lastName || !email || !password) {
                throw new Error("All fields are required");
            }

            if (password.length < 8) {
                throw new Error("Password must be at least 8 characters");
            }

            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, password }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.message || data?.error || "Signup failed");
            }

            router.push("/dashboard");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Signup failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="chronos-page min-h-screen overflow-hidden px-4 py-5 sm:px-6 md:px-10 lg:px-14 xl:px-20">
            <AuthTopBar backLabel="Home" onBack={() => router.push("/")} />

            <section className="mx-auto grid min-h-[calc(100vh-40px)] w-full max-w-[1320px] items-center gap-12 pt-24 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-20">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden min-w-0 lg:block"
                >
                    <div className="chronos-line mb-8" />
                    <p className="chronos-label">Workspace creation / First setup</p>

                    <h1 className="mt-7 max-w-4xl text-[clamp(3rem,6vw,5.8rem)] font-extralight leading-[0.9] tracking-[-0.085em] text-[var(--chronos-ink)]">
                        Build your social operating layer.
                    </h1>

                    <p className="chronos-subtitle mt-7 max-w-2xl">
                        Create a workspace for content creation, platform integrations, scheduling, WhatsApp workflows,
                        and post intelligence.
                    </p>

                    <div className="mt-12 space-y-5 border-t border-[var(--chronos-line)] pt-8">
                        <TrustLine text="Secure authentication and Google OAuth support" />
                        <TrustLine text="AI caption, grammar, tone, hashtag, and score tools" />
                        <TrustLine text="Publishing calendar and platform-specific workflows" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                    className="w-full min-w-0"
                >
                    <AuthCard>
                        <AuthBrand label="New workspace" />

                        <div className="mb-7">
                            <p className="chronos-label">Create account</p>
                            <h2 className="mt-3 text-4xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)] sm:text-5xl">
                                Start clean
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-[var(--chronos-muted)]">
                                Create your account and enter the workspace.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <AuthField label="First name" icon={<User className="h-4 w-4" strokeWidth={1.75} />}>
                                    <input
                                        type="text"
                                        name="firstName"
                                        required
                                        placeholder="Alex"
                                        className="h-12 w-full pl-11 pr-4 text-sm"
                                    />
                                </AuthField>

                                <AuthField label="Last name" icon={<User className="h-4 w-4" strokeWidth={1.75} />}>
                                    <input
                                        type="text"
                                        name="lastName"
                                        required
                                        placeholder="Doe"
                                        className="h-12 w-full pl-11 pr-4 text-sm"
                                    />
                                </AuthField>
                            </div>

                            <AuthField label="Email address" icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="you@example.com"
                                    className="h-12 w-full pl-11 pr-4 text-sm"
                                />
                            </AuthField>

                            <AuthField label="Password" icon={<Lock className="h-4 w-4" strokeWidth={1.75} />}>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="At least 8 characters"
                                    className="h-12 w-full pl-11 pr-4 text-sm"
                                />
                            </AuthField>

                            <PasswordMeter score={passwordScore} />

                            {error && <AuthAlert message={error} />}

                            <button type="submit" disabled={loading} className="chronos-button w-full">
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                ) : (
                                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                                )}
                                Create account
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
                                Already registered?{" "}
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

function PasswordMeter({ score }: { score: number }) {
    const label = score <= 1 ? "Weak" : score <= 3 ? "Good" : "Strong";

    return (
        <div className="rounded-[22px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-4">
            <div className="mb-3 flex items-center justify-between">
                <p className="chronos-label">Password strength</p>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--chronos-olive)]">{label}</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((item) => (
                    <div
                        key={item}
                        className="h-1 rounded-full"
                        style={{
                            background: score >= item ? "var(--chronos-olive)" : "var(--chronos-line-strong)",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function TrustLine({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                <Check className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <p className="text-sm leading-7 text-[var(--chronos-muted)]">{text}</p>
        </div>
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
