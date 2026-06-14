"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Calendar,
    CalendarClock,
    CheckCircle2,
    Clock,
    FileText,
    Layers3,
    List,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Send,
    Trash2,
    X,
} from "lucide-react";
import ComposeModal from "@/app/(Dashboard)/publishing/ComposeModal";
import PublishingCalendar from "@/app/(Dashboard)/publishing/PublishingCalendar";
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

type StatusFilter = "all" | "pending" | "processing" | "posted" | "failed";
type PlatformFilter = "all" | "twitter" | "mastodon" | "threads";
type TypeFilter = "all" | "scheduled" | "immediate";

const platformOptions: { label: string; value: PlatformFilter }[] = [
    { label: "All Platforms", value: "all" },
    { label: "Twitter / X", value: "twitter" },
    { label: "Mastodon", value: "mastodon" },
    { label: "Threads", value: "threads" },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: "All Status", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Processing", value: "processing" },
    { label: "Posted", value: "posted" },
    { label: "Failed", value: "failed" },
];

const typeOptions: { label: string; value: TypeFilter }[] = [
    { label: "All Types", value: "all" },
    { label: "Scheduled", value: "scheduled" },
    { label: "Immediate", value: "immediate" },
];

const getPostTime = (post: Post) => {
    return post.postedAt || post.scheduledAt || post.createdAt;
};

const getTimingLabel = (post: Post) => {
    if (post.status === "posted") {
        return "Posted";
    }

    if (post.scheduledAt) {
        return "Scheduled";
    }

    return "Queued";
};

const getStatusStyle = (status: Post["status"]) => {
    if (status === "posted") {
        return "border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]";
    }

    if (status === "pending") {
        return "border-[var(--chronos-olive-soft)] text-[var(--chronos-body)]";
    }

    if (status === "processing") {
        return "border-[var(--chronos-line-strong)] text-[var(--chronos-muted)]";
    }

    return "border-[var(--chronos-danger)] text-[var(--chronos-danger)]";
};

export default function PublishingPage() {
    const [view, setView] = useState<"list" | "calendar">("list");
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

    const loadPosts = async () => {
        try {
            setLoadingPosts(true);
            setError(null);

            const res = await fetch("/api/posts");

            if (!res.ok) {
                throw new Error("Failed to load posts");
            }

            const data = await res.json();
            setPosts(data.posts || []);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setLoadingPosts(false);
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const closeCompose = () => {
        setIsComposeOpen(false);
        setSelectedAccounts([]);
        loadPosts();
    };

    const filteredPosts = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return posts.filter((post) => {
            const platform = post.socialAccount.platform;
            const platformName = PLATFORMS[platform]?.name || platform;

            const matchesSearch =
                !normalizedSearch ||
                post.content.toLowerCase().includes(normalizedSearch) ||
                post.socialAccount.accountUsername.toLowerCase().includes(normalizedSearch) ||
                platformName.toLowerCase().includes(normalizedSearch) ||
                post.status.toLowerCase().includes(normalizedSearch);

            const matchesStatus = statusFilter === "all" || post.status === statusFilter;
            const matchesPlatform = platformFilter === "all" || platform === platformFilter;

            const matchesType =
                typeFilter === "all" ||
                (typeFilter === "scheduled" && Boolean(post.scheduledAt) && post.status !== "posted") ||
                (typeFilter === "immediate" && (!post.scheduledAt || post.status === "posted"));

            return matchesSearch && matchesStatus && matchesPlatform && matchesType;
        });
    }, [posts, searchQuery, statusFilter, platformFilter, typeFilter]);

    const stats = useMemo(() => {
        return {
            total: posts.length,
            filtered: filteredPosts.length,
            scheduled: posts.filter((post) => post.scheduledAt && post.status !== "posted").length,
            pending: posts.filter((post) => post.status === "pending").length,
            processing: posts.filter((post) => post.status === "processing").length,
            posted: posts.filter((post) => post.status === "posted").length,
            failed: posts.filter((post) => post.status === "failed").length,
        };
    }, [posts, filteredPosts]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 || statusFilter !== "all" || platformFilter !== "all" || typeFilter !== "all";

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setPlatformFilter("all");
        setTypeFilter("all");
    };

    const deletePost = async (post: Post) => {
        if (post.status === "processing") {
            setError("This post is currently processing and cannot be deleted.");
            return;
        }

        const confirmed = window.confirm(
            post.status === "posted"
                ? "This removes the post from app history only. It will not delete it from the platform."
                : "Delete this scheduled post?",
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingPostId(post.id);
            setError(null);

            const res = await fetch(`/api/posts/${post.id}`, {
                method: "DELETE",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || "Failed to delete post");
            }

            setPosts((current) => current.filter((item) => item.id !== post.id));
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to delete post");
        } finally {
            setDeletingPostId(null);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="chronos-panel flex items-center gap-3 px-5 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--chronos-olive)]" strokeWidth={1.75} />
                    <span className="chronos-label">Loading publishing</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="chronos-panel p-5 sm:p-6"
            >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="chronos-label">Publishing</p>
                        <h1 className="mt-2 text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)] sm:text-4xl">
                            Content operations
                        </h1>
                        <p className="mt-2 text-sm text-[var(--chronos-muted)]">
                            Compose, schedule, filter, delete and monitor posts.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex rounded-full border border-[var(--chronos-line)] p-1">
                            <button
                                type="button"
                                onClick={() => setView("list")}
                                className={`chronos-button h-10 px-4 ${view === "list" ? "" : "chronos-button-soft"}`}
                            >
                                <List className="h-4 w-4" strokeWidth={1.75} />
                                List
                            </button>

                            <button
                                type="button"
                                onClick={() => setView("calendar")}
                                className={`chronos-button h-10 px-4 ${view === "calendar" ? "" : "chronos-button-soft"}`}
                            >
                                <Calendar className="h-4 w-4" strokeWidth={1.75} />
                                Calendar
                            </button>
                        </div>

                        <button type="button" onClick={() => setIsComposeOpen(true)} className="chronos-button">
                            <Plus className="h-4 w-4" strokeWidth={1.75} />
                            Compose
                        </button>

                        <button type="button" onClick={loadPosts} className="chronos-button chronos-button-soft">
                            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                            Refresh
                        </button>
                    </div>
                </div>
            </motion.section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard title="Total" value={stats.total} icon={Layers3} />
                <StatCard title="Filtered" value={stats.filtered} icon={Search} />
                <StatCard title="Scheduled" value={stats.scheduled} icon={CalendarClock} />
                <StatCard title="Queued" value={stats.pending + stats.processing} icon={Clock} />
                <StatCard title="Posted" value={stats.posted} icon={CheckCircle2} />
                <StatCard title="Failed" value={stats.failed} icon={AlertTriangle} danger={stats.failed > 0} />
            </section>

            <section className="chronos-panel overflow-hidden">
                <div className="grid gap-4 border-b border-[var(--chronos-line)] p-4 xl:grid-cols-[minmax(0,1fr)_190px_170px_170px_auto]">
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--chronos-muted)]"
                            strokeWidth={1.75}
                        />

                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search content, account, status or platform..."
                            className="h-11 w-full pl-11 pr-10 text-sm"
                        />

                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--chronos-muted)] hover:text-[var(--chronos-ink)]"
                            >
                                <X className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                        )}
                    </div>

                    <SelectField
                        value={platformFilter}
                        onChange={(value) => setPlatformFilter(value as PlatformFilter)}
                    >
                        {platformOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)}>
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField value={typeFilter} onChange={(value) => setTypeFilter(value as TypeFilter)}>
                        {typeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </SelectField>

                    <button
                        type="button"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        className="chronos-button chronos-button-soft"
                    >
                        Clear
                    </button>
                </div>

                {error && (
                    <div className="m-4 rounded-[20px] border border-[var(--chronos-danger)]/40 bg-[var(--chronos-danger)]/5 p-4 text-sm text-[var(--chronos-danger)]">
                        {error}
                    </div>
                )}

                {loadingPosts ? (
                    <div className="flex items-center justify-center gap-3 px-6 py-16">
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--chronos-olive)]" strokeWidth={1.75} />
                        <span className="chronos-label">Refreshing posts</span>
                    </div>
                ) : posts.length === 0 ? (
                    <EmptyState icon={Send} title="No posts yet" text="Compose your first post." />
                ) : filteredPosts.length === 0 ? (
                    <EmptyState icon={Search} title="No results" text="Change search or filters." />
                ) : view === "calendar" ? (
                    <PublishingCalendar
                        posts={filteredPosts}
                        onCompose={() => setIsComposeOpen(true)}
                        onDelete={deletePost}
                        deletingPostId={deletingPostId}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px] text-left">
                            <thead className="border-b border-[var(--chronos-line)] text-xs uppercase tracking-[0.14em] text-[var(--chronos-muted)]">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Account</th>
                                    <th className="px-5 py-4 font-medium">Content</th>
                                    <th className="px-5 py-4 font-medium">Timing</th>
                                    <th className="px-5 py-4 font-medium">Status</th>
                                    <th className="px-5 py-4 text-right font-medium">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--chronos-line)]">
                                {filteredPosts.map((post, index) => (
                                    <PostRow
                                        key={post.id}
                                        post={post}
                                        index={index}
                                        isDeleting={deletingPostId === post.id}
                                        onDelete={() => deletePost(post)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <ComposeModal
                selectedAccounts={selectedAccounts}
                setSelectedAccounts={setSelectedAccounts}
                isOpen={isComposeOpen}
                onClose={closeCompose}
            />
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    danger,
}: {
    title: string;
    value: number;
    icon: ElementType;
    danger?: boolean;
}) {
    return (
        <div className="chronos-panel p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="chronos-label">{title}</p>
                <Icon
                    className={`h-4 w-4 ${danger ? "text-[var(--chronos-danger)]" : "text-[var(--chronos-olive)]"}`}
                    strokeWidth={1.75}
                />
            </div>

            <p className="text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)]">{value}</p>
        </div>
    );
}

function SelectField({
    value,
    onChange,
    children,
}: {
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
}) {
    return (
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full px-4 text-sm">
            {children}
        </select>
    );
}

function PostRow({
    post,
    index,
    isDeleting,
    onDelete,
}: {
    post: Post;
    index: number;
    isDeleting: boolean;
    onDelete: () => void;
}) {
    const platform = PLATFORMS[post.socialAccount.platform];
    const Icon = platform?.icon || Send;
    const postTime = getPostTime(post);

    return (
        <motion.tr
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.02 }}
            className="transition hover:bg-[var(--chronos-olive)]/5"
        >
            <td className="px-5 py-4 align-top">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                        <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--chronos-ink)]">
                            @{post.socialAccount.accountUsername}
                        </p>
                        <p className="mt-1 text-xs text-[var(--chronos-muted)]">
                            {platform?.name || post.socialAccount.platform}
                        </p>
                    </div>
                </div>
            </td>

            <td className="max-w-md px-5 py-4 align-top">
                <p className="line-clamp-2 text-sm leading-6 text-[var(--chronos-muted)]">{post.content}</p>
            </td>

            <td className="px-5 py-4 align-top">
                <p className="text-sm text-[var(--chronos-ink)]">{getTimingLabel(post)}</p>
                <p className="mt-1 text-xs text-[var(--chronos-muted)]">{new Date(postTime).toLocaleString()}</p>
            </td>

            <td className="px-5 py-4 align-top">
                <span className={`chronos-pill ${getStatusStyle(post.status)}`}>{post.status}</span>
            </td>

            <td className="px-5 py-4 text-right align-top">
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting || post.status === "processing"}
                    className="chronos-button chronos-button-soft h-9 border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                >
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                    ) : (
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    )}
                    Delete
                </button>
            </td>
        </motion.tr>
    );
}

function EmptyState({ icon: Icon, title, text }: { icon: ElementType; title: string; text: string }) {
    return (
        <div className="p-10 text-center">
            <Icon className="mx-auto h-8 w-8 text-[var(--chronos-olive)]" strokeWidth={1.75} />
            <h3 className="mt-4 text-2xl font-extralight tracking-[-0.06em] text-[var(--chronos-ink)]">{title}</h3>
            <p className="mt-2 text-sm text-[var(--chronos-muted)]">{text}</p>
        </div>
    );
}
