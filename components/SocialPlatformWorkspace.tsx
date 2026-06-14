"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Loader2,
    PlusCircle,
    Power,
    RefreshCw,
    Search,
    Send,
    XCircle,
} from "lucide-react";

type SocialAccount = {
    id: string;
    platform: string;
    accountUsername: string;
    instanceUrl?: string | null;
    createdAt: string;
};

type ScheduledPost = {
    id: string;
    content: string;
    scheduledAt: string | null;
    postedAt: string | null;
    status: string;
    retryCount: number;
    errorMessage: string | null;
    createdAt: string;
    socialAccount: {
        accountUsername: string;
        platform: string;
    };
};

type Notice = {
    type: "success" | "error";
    message: string;
} | null;

type SocialPlatformWorkspaceProps = {
    platform: "twitter" | "mastodon" | "threads";
    title: string;
    subtitle: string;
    route: string;
    connectUrl: string;
    composeUrl: string;
    icon: ElementType;
    connectedValues: string[];
    connectedMessage: string;
    disconnectedMessage: string;
    errorMessages: Record<string, string>;
    emptyAccountText: string;
    emptyPostText: string;
    ruleText: string;
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return "N/A";
    }

    return new Date(value).toLocaleString();
};

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong";
};

const getStatusClass = (status: string) => {
    const value = status.toLowerCase();

    if (value === "posted") {
        return "border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]";
    }

    if (value === "pending" || value === "processing") {
        return "border-[var(--chronos-olive-soft)] text-[var(--chronos-body)]";
    }

    if (value === "failed") {
        return "border-[var(--chronos-danger)] text-[var(--chronos-danger)]";
    }

    return "border-[var(--chronos-line-strong)] text-[var(--chronos-muted)]";
};

export default function SocialPlatformWorkspace({
    platform,
    title,
    subtitle,
    route,
    connectUrl,
    composeUrl,
    icon: Icon,
    connectedValues,
    connectedMessage,
    disconnectedMessage,
    errorMessages,
    emptyAccountText,
    emptyPostText,
    ruleText,
}: SocialPlatformWorkspaceProps) {
    const router = useRouter();
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [notice, setNotice] = useState<Notice>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const platformPosts = useMemo(() => {
        return posts.filter((post) => post.socialAccount.platform.toLowerCase() === platform);
    }, [posts, platform]);

    const filteredPosts = useMemo(() => {
        const search = searchQuery.trim().toLowerCase();

        if (!search) {
            return platformPosts;
        }

        return platformPosts.filter((post) => {
            return (
                post.content.toLowerCase().includes(search) ||
                post.status.toLowerCase().includes(search) ||
                post.socialAccount.accountUsername.toLowerCase().includes(search) ||
                String(post.errorMessage || "")
                    .toLowerCase()
                    .includes(search)
            );
        });
    }, [platformPosts, searchQuery]);

    const stats = useMemo(() => {
        return {
            accounts: accounts.length,
            total: platformPosts.length,
            pending: platformPosts.filter((post) => post.status === "pending").length,
            processing: platformPosts.filter((post) => post.status === "processing").length,
            posted: platformPosts.filter((post) => post.status === "posted").length,
            failed: platformPosts.filter((post) => post.status === "failed").length,
        };
    }, [accounts, platformPosts]);

    const showNotice = (type: "success" | "error", message: string) => {
        setNotice({ type, message });

        window.setTimeout(() => {
            setNotice(null);
        }, 3500);
    };

    const loadData = async () => {
        try {
            setActionLoading("refresh");

            const [accountsRes, postsRes] = await Promise.all([fetch("/api/accounts"), fetch("/api/posts")]);

            if (!accountsRes.ok) {
                throw new Error("Failed to load accounts");
            }

            if (!postsRes.ok) {
                throw new Error("Failed to load posts");
            }

            const accountsData = await accountsRes.json();
            const postsData = await postsRes.json();

            const platformAccounts = (accountsData.accounts || []).filter((account: SocialAccount) => {
                return account.platform.toLowerCase() === platform;
            });

            setAccounts(platformAccounts);
            setPosts(postsData.posts || []);
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setLoading(false);
            setActionLoading("");
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const connected = params.get("connected");
        const error = params.get("error");

        loadData();

        if (connected && connectedValues.includes(connected)) {
            showNotice("success", connectedMessage);
            router.replace(route);
        }

        if (error) {
            showNotice("error", errorMessages[error] || `${title} connection failed`);
            router.replace(route);
        }
    }, []);

    const handleConnect = () => {
        window.location.href = connectUrl;
    };

    const handleDisconnect = async (account: SocialAccount) => {
        const confirmed = window.confirm(`Disconnect ${title} account @${account.accountUsername}?`);

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(account.id);

            const res = await fetch(`/api/accounts/${account.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Failed to disconnect account");
            }

            await loadData();
            showNotice("success", disconnectedMessage);
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="chronos-panel flex items-center gap-3 px-5 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--chronos-olive)]" strokeWidth={1.75} />
                    <span className="chronos-label">Loading {title}</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
        >
            <section className="chronos-panel overflow-hidden">
                <div className="flex flex-col gap-5 border-b border-[var(--chronos-line)] p-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                            <Icon className="h-5 w-5" />
                        </span>

                        <div className="min-w-0">
                            <p className="chronos-label">Platform workspace</p>
                            <h1 className="mt-1 text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)] sm:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--chronos-muted)]">{subtitle}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={handleConnect} className="chronos-button">
                            <PlusCircle className="h-4 w-4" strokeWidth={1.75} />
                            Connect
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push(composeUrl)}
                            className="chronos-button chronos-button-soft"
                        >
                            <Send className="h-4 w-4" strokeWidth={1.75} />
                            Compose
                        </button>

                        <button
                            type="button"
                            onClick={loadData}
                            disabled={actionLoading === "refresh"}
                            className="chronos-button chronos-button-soft"
                        >
                            {actionLoading === "refresh" ? (
                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                            ) : (
                                <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                            )}
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid gap-px bg-[var(--chronos-line)] sm:grid-cols-2 xl:grid-cols-6">
                    <Metric label="Accounts" value={stats.accounts} icon={Icon} />
                    <Metric label="Posts" value={stats.total} icon={FileText} />
                    <Metric label="Pending" value={stats.pending} icon={Clock} />
                    <Metric label="Processing" value={stats.processing} icon={CalendarClock} />
                    <Metric label="Posted" value={stats.posted} icon={CheckCircle2} />
                    <Metric label="Failed" value={stats.failed} icon={AlertTriangle} danger={stats.failed > 0} />
                </div>

                {notice && (
                    <div
                        className={`m-4 flex items-start gap-3 rounded-[20px] border p-4 text-sm ${
                            notice.type === "success"
                                ? "border-[var(--chronos-olive)]/40 bg-[var(--chronos-olive)]/8 text-[var(--chronos-body)]"
                                : "border-[var(--chronos-danger)]/40 bg-[var(--chronos-danger)]/5 text-[var(--chronos-danger)]"
                        }`}
                    >
                        {notice.type === "success" ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                        ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                        )}
                        {notice.message}
                    </div>
                )}
            </section>

            <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="chronos-panel overflow-hidden">
                    <PanelHeader title="Connected accounts" label={`${accounts.length} accounts`} />

                    {accounts.length === 0 ? (
                        <EmptyState icon={Icon} title={`No ${title} account`} text={emptyAccountText} />
                    ) : (
                        <div className="divide-y divide-[var(--chronos-line)]">
                            {accounts.map((account) => (
                                <AccountRow
                                    key={account.id}
                                    account={account}
                                    icon={Icon}
                                    loading={actionLoading === account.id}
                                    onDisconnect={() => handleDisconnect(account)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="chronos-panel overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-[var(--chronos-line)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="chronos-label">{filteredPosts.length} records</p>
                            <h2 className="mt-1 text-xl font-light tracking-[-0.05em] text-[var(--chronos-ink)]">
                                Posts
                            </h2>
                        </div>

                        <div className="relative w-full lg:w-[320px]">
                            <Search
                                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--chronos-muted)]"
                                strokeWidth={1.75}
                            />
                            <input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search posts..."
                                className="h-10 w-full pl-11 pr-4 text-sm"
                            />
                        </div>
                    </div>

                    {platformPosts.length === 0 ? (
                        <EmptyState icon={Icon} title={`No ${title} posts`} text={emptyPostText} />
                    ) : filteredPosts.length === 0 ? (
                        <EmptyState icon={Search} title="No results" text="Change your search query." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] text-left">
                                <thead className="border-b border-[var(--chronos-line)] text-xs uppercase tracking-[0.14em] text-[var(--chronos-muted)]">
                                    <tr>
                                        <th className="px-5 py-4 font-medium">Account</th>
                                        <th className="px-5 py-4 font-medium">Content</th>
                                        <th className="px-5 py-4 font-medium">Timing</th>
                                        <th className="px-5 py-4 font-medium">Status</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--chronos-line)]">
                                    {filteredPosts.map((post, index) => (
                                        <PostRow key={post.id} post={post} index={index} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            <section className="chronos-panel p-4">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                        <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                    </span>

                    <div>
                        <p className="text-sm font-medium text-[var(--chronos-ink)]">{title} page rule</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--chronos-muted)]">{ruleText}</p>
                    </div>
                </div>
            </section>
        </motion.div>
    );
}

function Metric({
    label,
    value,
    icon: Icon,
    danger,
}: {
    label: string;
    value: number;
    icon: ElementType;
    danger?: boolean;
}) {
    return (
        <div className="bg-[var(--chronos-sheet)]/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="chronos-label">{label}</p>
                <Icon
                    className={`h-4 w-4 ${danger ? "text-[var(--chronos-danger)]" : "text-[var(--chronos-olive)]"}`}
                />
            </div>

            <p className="text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)]">{value}</p>
        </div>
    );
}

function PanelHeader({ title, label }: { title: string; label: string }) {
    return (
        <div className="border-b border-[var(--chronos-line)] px-5 py-4">
            <p className="chronos-label">{label}</p>
            <h2 className="mt-1 text-xl font-light tracking-[-0.05em] text-[var(--chronos-ink)]">{title}</h2>
        </div>
    );
}

function AccountRow({
    account,
    icon: Icon,
    loading,
    onDisconnect,
}: {
    account: SocialAccount;
    icon: ElementType;
    loading: boolean;
    onDisconnect: () => void;
}) {
    return (
        <div className="p-4 transition hover:bg-[var(--chronos-olive)]/5">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                    <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--chronos-ink)]">@{account.accountUsername}</p>

                    {account.instanceUrl && (
                        <p className="mt-1 truncate text-xs text-[var(--chronos-muted)]">{account.instanceUrl}</p>
                    )}

                    <p className="mt-1 text-xs text-[var(--chronos-muted)]">
                        Connected {formatDateTime(account.createdAt)}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onDisconnect}
                disabled={loading}
                className="chronos-button chronos-button-soft mt-4 w-full border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                ) : (
                    <Power className="h-4 w-4" strokeWidth={1.75} />
                )}
                Disconnect
            </button>
        </div>
    );
}

function PostRow({ post, index }: { post: ScheduledPost; index: number }) {
    return (
        <motion.tr
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.025 }}
            className="transition hover:bg-[var(--chronos-olive)]/5"
        >
            <td className="px-5 py-4 align-top">
                <p className="text-sm font-medium text-[var(--chronos-ink)]">@{post.socialAccount.accountUsername}</p>
                <p className="mt-1 text-xs text-[var(--chronos-muted)]">Retries: {post.retryCount || 0}</p>
            </td>

            <td className="max-w-md px-5 py-4 align-top">
                <p className="line-clamp-2 text-sm leading-6 text-[var(--chronos-muted)]">
                    {post.errorMessage || post.content}
                </p>
            </td>

            <td className="px-5 py-4 align-top">
                <p className="text-xs text-[var(--chronos-muted)]">Scheduled: {formatDateTime(post.scheduledAt)}</p>
                <p className="mt-1 text-xs text-[var(--chronos-muted)]">Posted: {formatDateTime(post.postedAt)}</p>
            </td>

            <td className="px-5 py-4 align-top">
                <span className={`chronos-pill ${getStatusClass(post.status)}`}>{post.status}</span>
            </td>
        </motion.tr>
    );
}

function EmptyState({ icon: Icon, title, text }: { icon: ElementType; title: string; text: string }) {
    return (
        <div className="p-10 text-center">
            <Icon className="mx-auto h-8 w-8 text-[var(--chronos-olive)]" />
            <h3 className="mt-4 text-xl font-light tracking-[-0.05em] text-[var(--chronos-ink)]">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--chronos-muted)]">{text}</p>
        </div>
    );
}
