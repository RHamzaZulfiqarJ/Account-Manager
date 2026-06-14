"use client";

import { useMemo, useState, type ElementType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Link2, Loader2, ShieldCheck, X } from "lucide-react";
import { PLATFORMS } from "@/libs/platform";

type Platform = "threads" | "twitter" | "mastodon";

type AddAccountModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

type PlatformOption = {
    value: Platform;
    title: string;
    description: string;
    route: string;
    icon: ElementType;
};

export default function AddAccountModal({ isOpen, onClose }: AddAccountModalProps) {
    const [platform, setPlatform] = useState<Platform>("threads");
    const [connecting, setConnecting] = useState(false);

    const platformOptions = useMemo<PlatformOption[]>(() => {
        return [
            {
                value: "threads",
                title: PLATFORMS.threads.name,
                description: "Connect creator publishing surface.",
                route: "/api/auth/oauth/threads",
                icon: PLATFORMS.threads.icon,
            },
            {
                value: "twitter",
                title: PLATFORMS.twitter.name,
                description: "Connect short-form publishing account.",
                route: "/api/auth/oauth/twitter",
                icon: PLATFORMS.twitter.icon,
            },
            {
                value: "mastodon",
                title: PLATFORMS.mastodon.name,
                description: "Connect federated publishing account.",
                route: "/api/auth/oauth/mastodon",
                icon: PLATFORMS.mastodon.icon,
            },
        ];
    }, []);

    const selectedPlatform = platformOptions.find((item) => item.value === platform) || platformOptions[0];

    const connectionHandler = () => {
        setConnecting(true);
        window.location.href = selectedPlatform.route;
    };

    const closeSafely = () => {
        if (!connecting) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSafely}
                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
                    />

                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.98 }}
                            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-xl overflow-hidden rounded-[28px] border border-[var(--chronos-line-strong)] bg-[var(--chronos-sheet)]/95 text-[var(--chronos-ink)] shadow-[0_30px_140px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
                        >
                            <div className="flex items-center justify-between gap-4 border-b border-[var(--chronos-line)] px-5 py-4">
                                <div>
                                    <p className="chronos-label">Integration</p>
                                    <h2 className="mt-1 text-2xl font-extralight tracking-[-0.06em] text-[var(--chronos-ink)]">
                                        Connect account
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeSafely}
                                    disabled={connecting}
                                    className="chronos-button h-11 w-11 px-0"
                                >
                                    <X className="h-4 w-4" strokeWidth={1.75} />
                                </button>
                            </div>

                            <div className="space-y-4 p-5">
                                <div className="grid gap-3">
                                    {platformOptions.map((item) => {
                                        const Icon = item.icon;
                                        const selected = platform === item.value;

                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                disabled={connecting}
                                                onClick={() => setPlatform(item.value)}
                                                className={`group flex w-full items-center gap-4 rounded-[22px] border p-4 text-left transition ${
                                                    selected
                                                        ? "border-[var(--chronos-olive)] bg-[var(--chronos-olive)]/10"
                                                        : "border-[var(--chronos-line)] bg-transparent hover:border-[var(--chronos-olive)] hover:bg-[var(--chronos-olive)]/5"
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                                                        selected
                                                            ? "border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]"
                                                            : "border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]"
                                                    }`}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium text-[var(--chronos-ink)]">
                                                        {item.title}
                                                    </span>
                                                    <span className="mt-1 block text-xs leading-5 text-[var(--chronos-muted)]">
                                                        {item.description}
                                                    </span>
                                                </span>

                                                {selected && (
                                                    <CheckCircle2
                                                        className="h-5 w-5 shrink-0 text-[var(--chronos-olive)]"
                                                        strokeWidth={1.75}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="rounded-[22px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-4">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck
                                            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chronos-olive)]"
                                            strokeWidth={1.75}
                                        />

                                        <div>
                                            <p className="text-sm font-medium text-[var(--chronos-ink)]">
                                                OAuth redirect required
                                            </p>
                                            <p className="mt-1 text-xs leading-6 text-[var(--chronos-muted)]">
                                                You will be redirected to {selectedPlatform.title} to approve access.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={closeSafely}
                                        disabled={connecting}
                                        className="chronos-button chronos-button-soft w-full"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={connectionHandler}
                                        disabled={connecting}
                                        className="chronos-button w-full"
                                    >
                                        {connecting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                        ) : (
                                            <Link2 className="h-4 w-4" strokeWidth={1.75} />
                                        )}
                                        Connect
                                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
