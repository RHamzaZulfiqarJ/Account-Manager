"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, PlugZap, Trash2 } from "lucide-react";
import { PLATFORMS } from "@/libs/platform";

interface AccountCardProps {
    platform: string;
    username: string;
    connectedAt?: string;
    loadingDelete?: boolean;
    onDisconnect?: () => void;
}

export default function StatCard({ platform, username, connectedAt, loadingDelete, onDisconnect }: AccountCardProps) {
    const platformInfo = PLATFORMS[platform as keyof typeof PLATFORMS];
    const Icon = platformInfo?.icon || PlugZap;

    return (
        <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="chronos-panel overflow-hidden"
        >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--chronos-line)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                        <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--chronos-ink)]">
                            {platformInfo?.name || platform}
                        </p>
                        <p className="mt-1 truncate text-xs text-[var(--chronos-muted)]">Connected account</p>
                    </div>
                </div>

                <span className="chronos-pill border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Live
                </span>
            </div>

            <div className="px-4 py-4">
                <h3 className="truncate text-xl font-light tracking-[-0.05em] text-[var(--chronos-ink)]">
                    @{username}
                </h3>

                <p className="mt-2 text-xs leading-5 text-[var(--chronos-muted)]">
                    {connectedAt
                        ? `Connected ${new Date(connectedAt).toLocaleDateString()}`
                        : "Ready for publishing and account actions."}
                </p>
            </div>

            <div className="border-t border-[var(--chronos-line)] px-4 py-3">
                <button
                    type="button"
                    onClick={onDisconnect}
                    disabled={loadingDelete}
                    className="chronos-button chronos-button-soft w-full border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                >
                    {loadingDelete ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                    ) : (
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    )}
                    Disconnect
                </button>
            </div>
        </motion.div>
    );
}
