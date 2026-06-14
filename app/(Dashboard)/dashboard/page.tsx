"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    Clock,
    FileText,
    Layers3,
    Loader2,
    MessageCircle,
    RefreshCw,
    Send,
    Share2,
    Users,
} from "lucide-react";
import { BsTwitterX } from "react-icons/bs";
import { SiMastodon, SiThreads, SiWhatsapp } from "react-icons/si";
import {
    ApiClientError,
    whatsappClient,
    type WhatsAppAccount,
    type WhatsAppScheduledMessage,
} from "@/libs/whatsapp/client";

type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
};

type SocialAccount = {
    id: string;
    platform: string;
    accountUsername: string;
    createdAt: string;
};

type SocialPost = {
    id: string;
    content: string;
    scheduledAt: string | null;
    postedAt: string | null;
    status: string;
    errorMessage?: string | null;
    createdAt: string;
    socialAccount: {
        accountUsername: string;
        platform: string;
    };
};

type WhatsAppSummary = {
    account: WhatsAppAccount;
    contacts: number;
    templates: number;
    approvedTemplates: number;
    queued: number;
    sent: number;
    failed: number;
    recentQueued: WhatsAppScheduledMessage[];
    recentFailed: WhatsAppScheduledMessage[];
};

type ActivityItem = {
    id: string;
    title: string;
    platform: string;
    text: string;
    status: string;
    time: string;
    failed: boolean;
    source: "social" | "whatsapp";
};

const getErrorMessage = (error: unknown) => {
    if (error instanceof ApiClientError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong";
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return "N/A";
    }

    return new Date(value).toLocaleString();
};

const normalizePlatform = (platform: string) => {
    const value = platform.toLowerCase();

    if (value === "twitter") {
        return "Twitter / X";
    }

    if (value === "mastodon") {
        return "Mastodon";
    }

    if (value === "threads") {
        return "Threads";
    }

    return platform;
};

const normalizeStatus = (status: string) => {
    const value = status.toLowerCase();

    if (value === "posted" || value === "sent") {
        return "Completed";
    }

    if (value === "pending" || value === "queued") {
        return "Queued";
    }

    if (value === "processing") {
        return "Processing";
    }

    if (value === "failed") {
        return "Failed";
    }

    return status;
};

export default function DashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
    const [whatsAppAccounts, setWhatsAppAccounts] = useState<WhatsAppAccount[]>([]);
    const [whatsAppSummaries, setWhatsAppSummaries] = useState<WhatsAppSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadWhatsAppSummaries = async (accounts: WhatsAppAccount[]) => {
        const summaries = await Promise.all(
            accounts.map(async (account) => {
                try {
                    const [contacts, templates, queued, sent, failed] = await Promise.all([
                        whatsappClient.listContacts(account.id, { limit: 1 }),
                        whatsappClient.listTemplates(account.id, { limit: 100 }),
                        whatsappClient.listScheduledMessages(account.id, { limit: 5, status: "QUEUED" }),
                        whatsappClient.listScheduledMessages(account.id, { limit: 1, status: "SENT" }),
                        whatsappClient.listScheduledMessages(account.id, { limit: 5, status: "FAILED" }),
                    ]);

                    const approvedTemplates = templates.items.filter((template) => {
                        return template.status?.toUpperCase() === "APPROVED";
                    }).length;

                    return {
                        account,
                        contacts: contacts.total,
                        templates: templates.total,
                        approvedTemplates,
                        queued: queued.total,
                        sent: sent.total,
                        failed: failed.total,
                        recentQueued: queued.items,
                        recentFailed: failed.items,
                    };
                } catch {
                    return {
                        account,
                        contacts: 0,
                        templates: 0,
                        approvedTemplates: 0,
                        queued: 0,
                        sent: 0,
                        failed: 0,
                        recentQueued: [],
                        recentFailed: [],
                    };
                }
            }),
        );

        return summaries;
    };

    const loadDashboard = async () => {
        try {
            setRefreshing(true);
            setError("");

            const userRes = await fetch("/api/auth/user");

            if (!userRes.ok) {
                router.push("/login");
                return;
            }

            const userData = await userRes.json();
            setUser(userData.user);

            const [accountsRes, postsRes, whatsAppRes] = await Promise.all([
                fetch("/api/accounts"),
                fetch("/api/posts"),
                whatsappClient.listAccounts(),
            ]);

            const accountsData = accountsRes.ok ? await accountsRes.json() : { accounts: [] };
            const postsData = postsRes.ok ? await postsRes.json() : { posts: [] };

            const socialOnly = (accountsData.accounts || []).filter((account: SocialAccount) => {
                const platform = account.platform.toLowerCase();

                return platform === "twitter" || platform === "mastodon" || platform === "threads";
            });

            const whatsAppSummaryData = await loadWhatsAppSummaries(whatsAppRes.accounts);

            setSocialAccounts(socialOnly);
            setSocialPosts(postsData.posts || []);
            setWhatsAppAccounts(whatsAppRes.accounts);
            setWhatsAppSummaries(whatsAppSummaryData);
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const stats = useMemo(() => {
        const twitterAccounts = socialAccounts.filter((account) => account.platform.toLowerCase() === "twitter").length;
        const mastodonAccounts = socialAccounts.filter(
            (account) => account.platform.toLowerCase() === "mastodon",
        ).length;
        const threadsAccounts = socialAccounts.filter((account) => account.platform.toLowerCase() === "threads").length;

        const socialPending = socialPosts.filter((post) => {
            const status = post.status.toLowerCase();

            return status === "pending" || status === "processing";
        }).length;

        const socialPosted = socialPosts.filter((post) => post.status.toLowerCase() === "posted").length;
        const socialFailed = socialPosts.filter((post) => post.status.toLowerCase() === "failed").length;
        const scheduledPosts = socialPosts.filter(
            (post) => post.scheduledAt && post.status.toLowerCase() !== "posted",
        ).length;

        const whatsappContacts = whatsAppSummaries.reduce((total, item) => total + item.contacts, 0);
        const whatsappTemplates = whatsAppSummaries.reduce((total, item) => total + item.templates, 0);
        const approvedTemplates = whatsAppSummaries.reduce((total, item) => total + item.approvedTemplates, 0);
        const whatsappQueued = whatsAppSummaries.reduce((total, item) => total + item.queued, 0);
        const whatsappSent = whatsAppSummaries.reduce((total, item) => total + item.sent, 0);
        const whatsappFailed = whatsAppSummaries.reduce((total, item) => total + item.failed, 0);

        return {
            twitterAccounts,
            mastodonAccounts,
            threadsAccounts,
            whatsAppNumbers: whatsAppAccounts.length,
            totalAccounts: socialAccounts.length + whatsAppAccounts.length,
            scheduledPosts,
            pending: socialPending + whatsappQueued,
            completed: socialPosted + whatsappSent,
            failed: socialFailed + whatsappFailed,
            whatsappContacts,
            whatsappTemplates,
            approvedTemplates,
            socialPosts: socialPosts.length,
            whatsappMessages: whatsappQueued + whatsappSent + whatsappFailed,
        };
    }, [socialAccounts, socialPosts, whatsAppAccounts, whatsAppSummaries]);

    const healthScore = useMemo(() => {
        const total = stats.pending + stats.completed + stats.failed;

        if (total === 0) {
            return 100;
        }

        return Math.max(0, Math.round(((total - stats.failed) / total) * 100));
    }, [stats]);

    const activity = useMemo<ActivityItem[]>(() => {
        const whatsappFailed = whatsAppSummaries.flatMap((summary) => {
            return summary.recentFailed.map((message) => ({
                id: `wa-failed-${message.id}`,
                title: message.templateName || "WhatsApp template",
                platform: "WhatsApp",
                text: message.errorMessage || `Failed for ${message.recipientPhone}`,
                status: message.status,
                time: formatDateTime(message.updatedAt || message.scheduledAt),
                failed: true,
                source: "whatsapp" as const,
            }));
        });

        const whatsappQueued = whatsAppSummaries.flatMap((summary) => {
            return summary.recentQueued.map((message) => ({
                id: `wa-queued-${message.id}`,
                title: message.templateName || "WhatsApp template",
                platform: "WhatsApp",
                text: `Queued for ${message.recipientPhone}`,
                status: message.status,
                time: formatDateTime(message.scheduledAt),
                failed: false,
                source: "whatsapp" as const,
            }));
        });

        const social = socialPosts.slice(0, 8).map((post) => ({
            id: `post-${post.id}`,
            title: `@${post.socialAccount.accountUsername}`,
            platform: normalizePlatform(post.socialAccount.platform),
            text: post.errorMessage || post.content,
            status: post.status,
            time: formatDateTime(post.postedAt || post.scheduledAt || post.createdAt),
            failed: post.status.toLowerCase() === "failed",
            source: "social" as const,
        }));

        return [...whatsappFailed, ...whatsappQueued, ...social].slice(0, 10);
    }, [socialPosts, whatsAppSummaries]);

    const platformRows = useMemo(
        () => [
            {
                label: "Twitter / X",
                value: stats.twitterAccounts,
                posts: socialPosts.filter((post) => post.socialAccount.platform.toLowerCase() === "twitter").length,
                icon: BsTwitterX,
                route: "/twitter",
            },
            {
                label: "Mastodon",
                value: stats.mastodonAccounts,
                posts: socialPosts.filter((post) => post.socialAccount.platform.toLowerCase() === "mastodon").length,
                icon: SiMastodon,
                route: "/mastodon",
            },
            {
                label: "Threads",
                value: stats.threadsAccounts,
                posts: socialPosts.filter((post) => post.socialAccount.platform.toLowerCase() === "threads").length,
                icon: SiThreads,
                route: "/threads",
            },
            {
                label: "WhatsApp",
                value: stats.whatsAppNumbers,
                posts: stats.whatsappMessages,
                icon: SiWhatsapp,
                route: "/whatsapp",
            },
        ],
        [socialPosts, stats],
    );

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="chronos-panel flex items-center gap-3 px-5 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--chronos-olive)]" strokeWidth={1.75} />
                    <span className="chronos-label">Loading dashboard</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="chronos-panel p-5 sm:p-6"
            >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="chronos-label">Dashboard</p>

                        <h1 className="mt-2 text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)] sm:text-4xl">
                            Welcome back, {user?.firstName || "Operator"}
                        </h1>

                        <p className="mt-2 text-sm text-[var(--chronos-muted)]">
                            Accounts, publishing, WhatsApp and failures at a glance.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => router.push("/publishing")} className="chronos-button">
                            <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                            Compose
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push("/whatsapp")}
                            className="chronos-button chronos-button-soft"
                        >
                            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                            WhatsApp
                        </button>

                        <button
                            type="button"
                            onClick={loadDashboard}
                            disabled={refreshing}
                            className="chronos-button chronos-button-soft"
                        >
                            {refreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                            ) : (
                                <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                            )}
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-5 rounded-[20px] border border-[var(--chronos-danger)]/40 bg-[var(--chronos-danger)]/5 p-4 text-sm text-[var(--chronos-danger)]">
                        {error}
                    </div>
                )}
            </motion.section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Health" value={`${healthScore}%`} subtitle="System clarity" icon={BarChart3} />
                <StatCard title="Accounts" value={stats.totalAccounts} subtitle="Connected channels" icon={Share2} />
                <StatCard title="Queued" value={stats.pending} subtitle="Pending work" icon={Clock} />
                <StatCard
                    title="Failed"
                    value={stats.failed}
                    subtitle="Needs review"
                    icon={AlertTriangle}
                    danger={stats.failed > 0}
                />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <div className="chronos-panel overflow-hidden">
                    <PanelHeader
                        title="Publishing overview"
                        label="Social + WhatsApp"
                        action="Open publishing"
                        onAction={() => router.push("/publishing")}
                    />

                    <div className="grid gap-px bg-[var(--chronos-line)] sm:grid-cols-2 lg:grid-cols-4">
                        <MiniCard icon={FileText} label="Social posts" value={stats.socialPosts} />
                        <MiniCard icon={CalendarClock} label="Scheduled" value={stats.scheduledPosts} />
                        <MiniCard icon={Send} label="Completed" value={stats.completed} />
                        <MiniCard icon={MessageCircle} label="WA messages" value={stats.whatsappMessages} />
                    </div>

                    <StatusBar completed={stats.completed} pending={stats.pending} failed={stats.failed} />

                    <div className="grid gap-px bg-[var(--chronos-line)] sm:grid-cols-3">
                        <MiniCard icon={Users} label="WA contacts" value={stats.whatsappContacts} />
                        <MiniCard icon={Layers3} label="Templates" value={stats.whatsappTemplates} />
                        <MiniCard icon={CheckCircle2} label="Approved" value={stats.approvedTemplates} />
                    </div>
                </div>

                <div className="chronos-panel overflow-hidden">
                    <PanelHeader title="Platforms" label="Connected surfaces" />

                    <div className="divide-y divide-[var(--chronos-line)]">
                        {platformRows.map((platform) => (
                            <PlatformRow
                                key={platform.label}
                                icon={platform.icon}
                                label={platform.label}
                                value={platform.value}
                                posts={platform.posts}
                                onOpen={() => router.push(platform.route)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
                <div className="chronos-panel overflow-hidden">
                    <PanelHeader title="Recent activity" label="Latest 10 records" />

                    {activity.length === 0 ? (
                        <div className="p-6 text-sm text-[var(--chronos-muted)]">No recent activity yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left">
                                <thead className="border-b border-[var(--chronos-line)] text-xs uppercase tracking-[0.14em] text-[var(--chronos-muted)]">
                                    <tr>
                                        <th className="px-5 py-4 font-medium">Item</th>
                                        <th className="px-5 py-4 font-medium">Platform</th>
                                        <th className="px-5 py-4 font-medium">Status</th>
                                        <th className="px-5 py-4 font-medium">Time</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--chronos-line)]">
                                    {activity.map((item, index) => (
                                        <ActivityTableRow key={item.id} item={item} index={index} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="chronos-panel overflow-hidden">
                    <PanelHeader title="Quick actions" label="Shortcuts" />

                    <div className="space-y-3 p-4">
                        <QuickAction
                            icon={CalendarClock}
                            label="Create post"
                            text="Compose or schedule content"
                            onClick={() => router.push("/publishing")}
                        />
                        <QuickAction
                            icon={MessageCircle}
                            label="WhatsApp"
                            text="Open messaging workspace"
                            onClick={() => router.push("/whatsapp")}
                        />
                        <QuickAction
                            icon={Layers3}
                            label="Analytics"
                            text="View performance layer"
                            onClick={() => router.push("/analytics")}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function PanelHeader({
    title,
    label,
    action,
    onAction,
}: {
    title: string;
    label: string;
    action?: string;
    onAction?: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-[var(--chronos-line)] px-5 py-4">
            <div>
                <p className="chronos-label">{label}</p>
                <h2 className="mt-1 text-xl font-light tracking-[-0.05em] text-[var(--chronos-ink)]">{title}</h2>
            </div>

            {action && onAction && (
                <button type="button" onClick={onAction} className="chronos-button chronos-button-soft">
                    {action}
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    danger,
}: {
    title: string;
    value: number | string;
    subtitle: string;
    icon: ElementType;
    danger?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="chronos-panel p-5"
        >
            <div className="mb-6 flex items-center justify-between gap-4">
                <p className="chronos-label">{title}</p>
                <Icon
                    className={`h-5 w-5 ${danger ? "text-[var(--chronos-danger)]" : "text-[var(--chronos-olive)]"}`}
                    strokeWidth={1.75}
                />
            </div>

            <p className="text-4xl font-extralight tracking-[-0.08em] text-[var(--chronos-ink)]">{value}</p>
            <p className="mt-2 text-sm text-[var(--chronos-muted)]">{subtitle}</p>
        </motion.div>
    );
}

function MiniCard({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
    return (
        <div className="bg-[var(--chronos-sheet)]/60 p-5">
            <Icon className="h-5 w-5 text-[var(--chronos-olive)]" strokeWidth={1.75} />
            <p className="mt-5 text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)]">{value}</p>
            <p className="chronos-label mt-2">{label}</p>
        </div>
    );
}

function StatusBar({ completed, pending, failed }: { completed: number; pending: number; failed: number }) {
    const total = completed + pending + failed || 1;
    const completedPercent = (completed / total) * 100;
    const pendingPercent = (pending / total) * 100;
    const failedPercent = (failed / total) * 100;

    return (
        <div className="border-y border-[var(--chronos-line)] p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="chronos-label">Status distribution</p>

                <div className="flex flex-wrap gap-3 text-xs text-[var(--chronos-muted)]">
                    <span>Completed {completed}</span>
                    <span>Queued {pending}</span>
                    <span>Failed {failed}</span>
                </div>
            </div>

            <div className="flex h-2 overflow-hidden rounded-full bg-[var(--chronos-line)]">
                <div className="bg-[var(--chronos-olive)]" style={{ width: `${completedPercent}%` }} />
                <div className="bg-[var(--chronos-olive-soft)]" style={{ width: `${pendingPercent}%` }} />
                <div className="bg-[var(--chronos-danger)]" style={{ width: `${failedPercent}%` }} />
            </div>
        </div>
    );
}

function PlatformRow({
    icon: Icon,
    label,
    value,
    posts,
    onOpen,
}: {
    icon: ElementType;
    label: string;
    value: number;
    posts: number;
    onOpen: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[var(--chronos-olive)]/5"
        >
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                    <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[var(--chronos-ink)]">{label}</span>
                    <span className="mt-1 block text-xs text-[var(--chronos-muted)]">{posts} records</span>
                </span>
            </div>

            <span className="text-2xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)]">{value}</span>
        </button>
    );
}

function ActivityTableRow({ item, index }: { item: ActivityItem; index: number }) {
    return (
        <motion.tr
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.025 }}
            className="transition hover:bg-[var(--chronos-olive)]/5"
        >
            <td className="px-5 py-4">
                <div className="max-w-[360px]">
                    <p className="truncate text-sm font-medium text-[var(--chronos-ink)]">{item.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--chronos-muted)]">{item.text}</p>
                </div>
            </td>

            <td className="px-5 py-4 text-sm text-[var(--chronos-muted)]">{item.platform}</td>

            <td className="px-5 py-4">
                <span
                    className={`chronos-pill ${
                        item.failed
                            ? "border-[var(--chronos-danger)] text-[var(--chronos-danger)]"
                            : "border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]"
                    }`}
                >
                    {normalizeStatus(item.status)}
                </span>
            </td>

            <td className="px-5 py-4 text-xs uppercase tracking-[0.12em] text-[var(--chronos-muted)]">{item.time}</td>
        </motion.tr>
    );
}

function QuickAction({
    icon: Icon,
    label,
    text,
    onClick,
}: {
    icon: ElementType;
    label: string;
    text: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-4 rounded-[22px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-4 text-left transition hover:border-[var(--chronos-olive)] hover:bg-[var(--chronos-olive)]/10"
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[var(--chronos-ink)]">{label}</span>
                <span className="mt-1 block text-xs text-[var(--chronos-muted)]">{text}</span>
            </span>

            <ArrowUpRight className="h-4 w-4 text-[var(--chronos-muted)]" strokeWidth={1.75} />
        </button>
    );
}
