"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";

type ConfirmationProps = {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
};

export default function Confirmation({
    isOpen,
    onConfirm,
    onCancel,
    title = "Disconnect account?",
    description = "This removes the account from your workspace. It will not delete the account from the original platform.",
    confirmText = "Disconnect",
    cancelText = "Cancel",
}: ConfirmationProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
                    />

                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.98 }}
                            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--chronos-line-strong)] bg-[var(--chronos-sheet)]/95 text-[var(--chronos-ink)] shadow-[0_30px_140px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
                        >
                            <div className="flex items-center justify-between gap-4 border-b border-[var(--chronos-line)] px-5 py-4">
                                <div>
                                    <p className="chronos-label">Confirmation</p>
                                    <h2 className="mt-1 text-2xl font-extralight tracking-[-0.06em] text-[var(--chronos-ink)]">
                                        {title}
                                    </h2>
                                </div>

                                <button type="button" onClick={onCancel} className="chronos-button h-11 w-11 px-0">
                                    <X className="h-4 w-4" strokeWidth={1.75} />
                                </button>
                            </div>

                            <div className="p-5">
                                <div className="rounded-[22px] border border-[var(--chronos-danger)]/35 bg-[var(--chronos-danger)]/5 p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-danger)]/45 text-[var(--chronos-danger)]">
                                            <ShieldAlert className="h-5 w-5" strokeWidth={1.75} />
                                        </span>

                                        <div>
                                            <p className="text-sm font-medium text-[var(--chronos-ink)]">
                                                Action required
                                            </p>
                                            <p className="mt-2 text-sm leading-7 text-[var(--chronos-muted)]">
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={onCancel}
                                        className="chronos-button chronos-button-soft w-full"
                                    >
                                        {cancelText}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onConfirm}
                                        className="chronos-button w-full border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                                    >
                                        <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                                        {confirmText}
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
