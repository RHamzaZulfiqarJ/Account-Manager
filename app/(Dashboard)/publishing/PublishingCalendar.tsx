"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Plus,
    Send,
    Trash2,
    X,
} from "lucide-react";
import { PLATFORMS } from "@/libs/platform";

type Post = {
    id: string;
    content: string;
    status: "pending" | "processing" | "posted" | "failed";
    scheduledAt: string | null;
    postedAt: string | null;
    createdAt: string;
    socialAccount: {
        id: string;
        platform: keyof typeof PLATFORMS;
        accountUsername: string;
    };
};

type Props = {
    posts: Post[];
    onCompose: () => void;
    onDelete: (post: Post) => Promise<void>;
    deletingPostId: string | null;
};

const STATUS_DOT: Record<Post["status"], string> = {
    posted: "bg-[var(--chronos-olive)]",
    pending: "bg-[var(--chronos-olive-soft)]",
    processing: "bg-[var(--chronos-muted)]",
    failed: "bg-[var(--chronos-danger)]",
};

const STATUS_BADGE: Record<Post["status"], string> = {
    posted: "border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]",
    pending: "border-[var(--chronos-olive-soft)] text-[var(--chronos-body)]",
    processing: "border-[var(--chronos-line-strong)] text-[var(--chronos-muted)]",
    failed: "border-[var(--chronos-danger)] text-[var(--chronos-danger)]",
};

function getPostDate(post: Post): Date {
    return new Date(post.postedAt || post.scheduledAt || post.createdAt);
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isToday(date: Date) {
    return isSameDay(date, new Date());
}

export default function PublishingCalendar({ posts, onCompose, onDelete, deletingPostId }: Props) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
    const firstDayOfWeek = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

    // Build a map of date-string → posts for fast lookup
    const postsByDay = useMemo(() => {
        const map: Record<string, Post[]> = {};
        for (const post of posts) {
            const d = getPostDate(post);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const key = d.getDate().toString();
                (map[key] ??= []).push(post);
            }
        }
        return map;
    }, [posts, year, month]);

    const selectedDayPosts = useMemo(
        () =>
            selectedDay
                ? posts.filter((p) => isSameDay(getPostDate(p), selectedDay))
                : [],
        [posts, selectedDay],
    );

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear((y) => y - 1); }
        else setMonth((m) => m - 1);
    };

    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear((y) => y + 1); }
        else setMonth((m) => m + 1);
    };

    const monthLabel = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });
    const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Build calendar grid: leading empty cells + day cells
    const cells: (number | null)[] = [
        ...Array.from({ length: firstDayOfWeek }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <div className="flex flex-col lg:flex-row">
            {/* Calendar grid */}
            <div className="flex-1 p-4 sm:p-5">
                {/* Month navigation */}
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="chronos-button chronos-button-soft w-14 p-0"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                    </button>

                    <p className="text-sm font-medium tracking-[-0.02em] text-[var(--chronos-ink)]">
                        {monthLabel}
                    </p>

                    <button
                        type="button"
                        onClick={nextMonth}
                        className="chronos-button chronos-button-soft w-14 p-0"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                </div>

                {/* Weekday headers */}
                <div className="mb-1 grid grid-cols-7 text-center">
                    {WEEK_DAYS.map((d) => (
                        <div
                            key={d}
                            className="py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--chronos-muted)]"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden border border-[var(--chronos-line)] bg-[var(--chronos-line)]">
                    {cells.map((day, idx) => {
                        if (day === null) {
                            return <div key={`empty-${idx}`} className="bg-[var(--chronos-surface)] min-h-[72px]" />;
                        }

                        const dayPosts = postsByDay[day.toString()] ?? [];
                        const cellDate = new Date(year, month, day);
                        const isSelected = selectedDay ? isSameDay(cellDate, selectedDay) : false;
                        const todayCell = isToday(cellDate);

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => setSelectedDay(isSelected ? null : cellDate)}
                                className={`
                                    group relative flex min-h-[72px] flex-col items-start p-2 text-left transition-colors
                                    ${isSelected
                                        ? "bg-[var(--chronos-olive)]/10"
                                        : "bg-[var(--chronos-surface)] hover:bg-[var(--chronos-olive)]/5"
                                    }
                                `}
                            >
                                <span
                                    className={`
                                        flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                                        ${todayCell
                                            ? "bg-[var(--chronos-olive)] text-[#090A0D]"
                                            : "text-[var(--chronos-ink)]"
                                        }
                                    `}
                                >
                                    {day}
                                </span>

                                {dayPosts.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {dayPosts.slice(0, 3).map((p) => (
                                            <span
                                                key={p.id}
                                                className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[p.status]}`}
                                            />
                                        ))}
                                        {dayPosts.length > 3 && (
                                            <span className="text-[9px] leading-none text-[var(--chronos-muted)]">
                                                +{dayPosts.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {dayPosts.length > 0 && (
                                    <span className="absolute bottom-1.5 right-2 text-[9px] font-medium tracking-[0.04em] text-[var(--chronos-muted)]">
                                        {dayPosts.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                    {(["posted", "pending", "processing", "failed"] as Post["status"][]).map((s) => (
                        <div key={s} className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} />
                            <span className="text-xs capitalize text-[var(--chronos-muted)]">{s}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar: selected day detail */}
            <div className="w-full border-t border-[var(--chronos-line)] lg:w-[320px] lg:border-l lg:border-t-0">
                <AnimatePresence mode="wait">
                    {selectedDay ? (
                        <motion.div
                            key={selectedDay.toISOString()}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="flex h-full flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-[var(--chronos-line)] px-4 py-3">
                                <div>
                                    <p className="chronos-label">
                                        {selectedDay.toLocaleString("default", { weekday: "long" })}
                                    </p>
                                    <p className="mt-0.5 text-xl font-extralight tracking-[-0.05em] text-[var(--chronos-ink)]">
                                        {selectedDay.toLocaleString("default", { month: "long", day: "numeric" })}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedDay(null)}
                                    className="chronos-button chronos-button-soft h-8 w-8 p-0"
                                    aria-label="Close"
                                >
                                    <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                                </button>
                            </div>

                            {/* Posts list */}
                            <div className="flex-1 overflow-y-auto">
                                {selectedDayPosts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
                                        <Send
                                            className="h-7 w-7 text-[var(--chronos-olive)]"
                                            strokeWidth={1.5}
                                        />
                                        <p className="text-sm text-[var(--chronos-muted)]">
                                            No posts on this day.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={onCompose}
                                            className="chronos-button mt-1"
                                        >
                                            <Plus className="h-4 w-4" strokeWidth={1.75} />
                                            Compose
                                        </button>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-[var(--chronos-line)]">
                                        {selectedDayPosts.map((post) => {
                                            const platform = PLATFORMS[post.socialAccount.platform];
                                            const Icon = platform?.icon || Send;
                                            const isDeleting = deletingPostId === post.id;
                                            const postDate = getPostDate(post);

                                            return (
                                                <li key={post.id} className="p-4">
                                                    {/* Account row */}
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                                                            <Icon className="h-3.5 w-3.5" />
                                                        </span>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-medium text-[var(--chronos-ink)]">
                                                                @{post.socialAccount.accountUsername}
                                                            </p>
                                                            <p className="text-[10px] text-[var(--chronos-muted)]">
                                                                {platform?.name || post.socialAccount.platform}
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={`chronos-pill text-[10px] ${STATUS_BADGE[post.status]}`}
                                                        >
                                                            {post.status}
                                                        </span>
                                                    </div>

                                                    {/* Content */}
                                                    <p className="mt-2.5 line-clamp-3 text-xs leading-5 text-[var(--chronos-muted)]">
                                                        {post.content}
                                                    </p>

                                                    {/* Footer row */}
                                                    <div className="mt-3 flex items-center justify-between gap-2">
                                                        <p className="text-[10px] text-[var(--chronos-muted)]">
                                                            {postDate.toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </p>

                                                        <button
                                                            type="button"
                                                            onClick={() => onDelete(post)}
                                                            disabled={isDeleting || post.status === "processing"}
                                                            className="chronos-button chronos-button-soft h-7 border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                                                        >
                                                            {isDeleting ? (
                                                                <Loader2
                                                                    className="h-3 w-3 animate-spin"
                                                                    strokeWidth={1.75}
                                                                />
                                                            ) : (
                                                                <Trash2
                                                                    className="h-3 w-3"
                                                                    strokeWidth={1.75}
                                                                />
                                                            )}
                                                            Delete
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            {selectedDayPosts.length > 0 && (
                                <div className="border-t border-[var(--chronos-line)] p-3">
                                    <button
                                        type="button"
                                        onClick={onCompose}
                                        className="chronos-button chronos-button-soft w-full justify-center"
                                    >
                                        <Plus className="h-4 w-4" strokeWidth={1.75} />
                                        Compose another
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
                        >
                            <p className="text-sm text-[var(--chronos-muted)]">
                                Select a day to view posts.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
