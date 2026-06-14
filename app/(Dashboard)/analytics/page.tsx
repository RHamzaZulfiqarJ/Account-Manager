"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    Layers3,
    Loader2,
    MessageCircle,
    RefreshCw,
    Send,
    TrendingUp,
    Users,
    XCircle,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    ApiClientError,
    whatsappClient,
    type WhatsAppAccount,
    type WhatsAppMessageLog,
    type WhatsAppScheduledMessage,
    type WhatsAppTemplate,
} from "@/libs/whatsapp/client";

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
    retryCount?: number;
    errorMessage?: string | null;
    createdAt: string;
    socialAccount: {
        id: string;
        accountUsername: string;
        platform: string;
    };
};

type RangeFilter = "7" | "30" | "90" | "all";

type WhatsAppSummary = {
    account: WhatsAppAccount;
    contacts: number;
    templates: number;
    approvedTemplates: number;
    queued: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
    successfulLogs: number;
    failedLogs: number;
    recentMessages: WhatsAppScheduledMessage[];
    recentLogs: WhatsAppMessageLog[];
    templateItems: WhatsAppTemplate[];
};

type Notice = {
    type: "success" | "error";
    message: string;
} | null;

type ActivityItem = {
    id: string;
    title: string;
    subtitle: string;
    status: string;
    platform: string;
    time: string;
    rawTime: number;
    danger?: boolean;
};

const socialPlatforms = ["twitter", "mastodon", "threads"];

const rangeOptions: { label: string; value: RangeFilter }[] = [
    { label: "7D", value: "7" },
    { label: "30D", value: "30" },
    { label: "90D", value: "90" },
    { label: "All", value: "all" },
];

const chartColors = [
    "var(--chronos-olive)",
    "var(--chronos-olive-soft)",
    "var(--chronos-muted)",
    "var(--chronos-danger)",
];

const getErrorMessage = (error: unknown) => {
    if (error instanceof ApiClientError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong";
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

    if (value === "whatsapp") {
        return "WhatsApp";
    }

    return platform;
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return "N/A";
    }

    return new Date(value).toLocaleString();
};

const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getShortDateLabel = (key: string) => {
    const date = new Date(`${key}T00:00:00`);

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
};

const getSocialPostTime = (post: SocialPost) => {
    return post.postedAt || post.scheduledAt || post.createdAt;
};

const getWhatsAppMessageTime = (message: WhatsAppScheduledMessage) => {
    return message.sentAt || message.scheduledAt || message.createdAt;
};

const isInRange = (value: string | null | undefined, range: RangeFilter) => {
    if (!value || range === "all") {
        return true;
    }

    const days = Number(range);
    const time = new Date(value).getTime();
    const min = Date.now() - days * 24 * 60 * 60 * 1000;

    return time >= min;
};

const buildEmptyTrend = (range: RangeFilter) => {
    const days = range === "all" ? 30 : Number(range);

    return Array.from({ length: days }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - index));

        const key = getDateKey(date);

        return {
            key,
            date: getShortDateLabel(key),
            social: 0,
            whatsapp: 0,
            failures: 0,
        };
    });
};

const getStatusClass = (status: string) => {
    const value = status.toLowerCase();

    if (value === "posted" || value === "sent" || value === "approved" || value === "success") {
        return "border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]";
    }

    if (value === "pending" || value === "queued" || value === "processing") {
        return "border-[var(--chronos-olive-soft)] text-[var(--chronos-body)]";
    }

    if (value === "failed" || value === "rejected") {
        return "border-[var(--chronos-danger)] text-[var(--chronos-danger)]";
    }

    return "border-[var(--chronos-line-strong)] text-[var(--chronos-muted)]";
};

export default function AnalyticsPage() {
    const [range, setRange] = useState<RangeFilter>("30");
    const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
    const [whatsAppAccounts, setWhatsAppAccounts] = useState<WhatsAppAccount[]>([]);
    const [whatsAppSummaries, setWhatsAppSummaries] = useState<WhatsAppSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);

    const showNotice = (type: "success" | "error", message: string) => {
        setNotice({ type, message });

        window.setTimeout(() => {
            setNotice(null);
        }, 3500);
    };

    const loadWhatsAppSummary = async (account: WhatsAppAccount): Promise<WhatsAppSummary> => {
        try {
            const [
                contacts,
                templates,
                queued,
                processing,
                sent,
                failed,
                cancelled,
                recentMessages,
                successfulLogs,
                failedLogs,
                recentLogs,
            ] = await Promise.all([
                whatsappClient.listContacts(account.id, { limit: 1 }),
                whatsappClient.listTemplates(account.id, { limit: 100 }),
                whatsappClient.listScheduledMessages(account.id, { limit: 1, status: "QUEUED" }),
                whatsappClient.listScheduledMessages(account.id, { limit: 1, status: "PROCESSING" }),
                whatsappClient.listScheduledMessages(account.id, { limit: 1, status: "SENT" }),
                whatsappClient.listScheduledMessages(account.id, { limit: 1, status: "FAILED" }),
                whatsappClient.listScheduledMessages(account.id, { limit: 1, status: "CANCELLED" }),
                whatsappClient.listScheduledMessages(account.id, { limit: 80 }),
                whatsappClient.listLogs(account.id, { limit: 1, success: true }),
                whatsappClient.listLogs(account.id, { limit: 1, success: false }),
                whatsappClient.listLogs(account.id, { limit: 50 }),
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
                processing: processing.total,
                sent: sent.total,
                failed: failed.total,
                cancelled: cancelled.total,
                successfulLogs: successfulLogs.total,
                failedLogs: failedLogs.total,
                recentMessages: recentMessages.items,
                recentLogs: recentLogs.items,
                templateItems: templates.items,
            };
        } catch {
            return {
                account,
                contacts: 0,
                templates: 0,
                approvedTemplates: 0,
                queued: 0,
                processing: 0,
                sent: 0,
                failed: 0,
                cancelled: 0,
                successfulLogs: 0,
                failedLogs: 0,
                recentMessages: [],
                recentLogs: [],
                templateItems: [],
            };
        }
    };

    const loadAnalytics = async () => {
        try {
            setRefreshing(true);

            const [accountsRes, postsRes, whatsAppAccountData] = await Promise.all([
                fetch("/api/accounts"),
                fetch("/api/posts"),
                whatsappClient.listAccounts().catch(() => ({ accounts: [] as WhatsAppAccount[] })),
            ]);

            if (!accountsRes.ok) {
                throw new Error("Failed to load accounts");
            }

            if (!postsRes.ok) {
                throw new Error("Failed to load posts");
            }

            const accountsData = await accountsRes.json();
            const postsData = await postsRes.json();

            const filteredSocialAccounts = (accountsData.accounts || []).filter((account: SocialAccount) => {
                return socialPlatforms.includes(account.platform.toLowerCase());
            });

            const summaries = await Promise.all(
                whatsAppAccountData.accounts.map((account) => loadWhatsAppSummary(account)),
            );

            setSocialAccounts(filteredSocialAccounts);
            setSocialPosts(postsData.posts || []);
            setWhatsAppAccounts(whatsAppAccountData.accounts);
            setWhatsAppSummaries(summaries);

            if (!loading) {
                showNotice("success", "Analytics refreshed");
            }
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const filteredSocialPosts = useMemo(() => {
        return socialPosts.filter((post) => isInRange(getSocialPostTime(post), range));
    }, [socialPosts, range]);

    const filteredWhatsAppMessages = useMemo(() => {
        return whatsAppSummaries
            .flatMap((summary) => summary.recentMessages)
            .filter((message) => isInRange(getWhatsAppMessageTime(message), range));
    }, [whatsAppSummaries, range]);

    const totals = useMemo(() => {
        const socialPending = socialPosts.filter((post) => post.status === "pending").length;
        const socialProcessing = socialPosts.filter((post) => post.status === "processing").length;
        const socialPosted = socialPosts.filter((post) => post.status === "posted").length;
        const socialFailed = socialPosts.filter((post) => post.status === "failed").length;

        const whatsappContacts = whatsAppSummaries.reduce((total, item) => total + item.contacts, 0);
        const whatsappTemplates = whatsAppSummaries.reduce((total, item) => total + item.templates, 0);
        const whatsappApprovedTemplates = whatsAppSummaries.reduce((total, item) => total + item.approvedTemplates, 0);
        const whatsappQueued = whatsAppSummaries.reduce((total, item) => total + item.queued, 0);
        const whatsappProcessing = whatsAppSummaries.reduce((total, item) => total + item.processing, 0);
        const whatsappSent = whatsAppSummaries.reduce((total, item) => total + item.sent, 0);
        const whatsappFailed = whatsAppSummaries.reduce((total, item) => total + item.failed, 0);
        const whatsappCancelled = whatsAppSummaries.reduce((total, item) => total + item.cancelled, 0);
        const successfulLogs = whatsAppSummaries.reduce((total, item) => total + item.successfulLogs, 0);
        const failedLogs = whatsAppSummaries.reduce((total, item) => total + item.failedLogs, 0);

        const totalWhatsAppMessages =
            whatsappQueued + whatsappProcessing + whatsappSent + whatsappFailed + whatsappCancelled;
        const totalFailures = socialFailed + whatsappFailed + failedLogs;
        const totalCompleted = socialPosted + whatsappSent;
        const totalInProgress = socialPending + socialProcessing + whatsappQueued + whatsappProcessing;
        const totalOutput = socialPosts.length + totalWhatsAppMessages;
        const cleanRate =
            totalOutput + failedLogs > 0
                ? Math.round(((totalOutput + failedLogs - totalFailures) / (totalOutput + failedLogs)) * 100)
                : 100;
        const templateApprovalRate =
            whatsappTemplates > 0 ? Math.round((whatsappApprovedTemplates / whatsappTemplates) * 100) : 0;
        const logSuccessRate =
            successfulLogs + failedLogs > 0 ? Math.round((successfulLogs / (successfulLogs + failedLogs)) * 100) : 0;

        return {
            channels: socialAccounts.length + whatsAppAccounts.length,
            socialPosts: socialPosts.length,
            whatsappMessages: totalWhatsAppMessages,
            whatsappContacts,
            whatsappTemplates,
            whatsappApprovedTemplates,
            socialPending,
            socialProcessing,
            socialPosted,
            socialFailed,
            whatsappQueued,
            whatsappProcessing,
            whatsappSent,
            whatsappFailed,
            whatsappCancelled,
            successfulLogs,
            failedLogs,
            totalFailures,
            totalCompleted,
            totalInProgress,
            totalOutput,
            cleanRate,
            templateApprovalRate,
            logSuccessRate,
        };
    }, [socialAccounts, socialPosts, whatsAppAccounts, whatsAppSummaries]);

    const platformData = useMemo(() => {
        const socialRows = socialPlatforms.map((platform) => {
            const accounts = socialAccounts.filter((account) => account.platform.toLowerCase() === platform).length;
            const posts = socialPosts.filter((post) => post.socialAccount.platform.toLowerCase() === platform);
            const completed = posts.filter((post) => post.status === "posted").length;
            const failed = posts.filter((post) => post.status === "failed").length;

            return {
                platform: normalizePlatform(platform),
                accounts,
                total: posts.length,
                completed,
                failed,
            };
        });

        return [
            ...socialRows,
            {
                platform: "WhatsApp",
                accounts: whatsAppAccounts.length,
                total: totals.whatsappMessages,
                completed: totals.whatsappSent,
                failed: totals.whatsappFailed,
            },
        ];
    }, [socialAccounts, socialPosts, whatsAppAccounts, totals]);

    const statusData = useMemo(() => {
        return [
            { name: "Completed", value: totals.totalCompleted },
            { name: "In progress", value: totals.totalInProgress },
            { name: "Failed", value: totals.totalFailures },
            { name: "Cancelled", value: totals.whatsappCancelled },
        ].filter((item) => item.value > 0);
    }, [totals]);

    const trendData = useMemo(() => {
        const base = buildEmptyTrend(range);
        const map = new Map(base.map((item) => [item.key, item]));

        filteredSocialPosts.forEach((post) => {
            const key = getDateKey(new Date(getSocialPostTime(post)));
            const item = map.get(key);

            if (item) {
                item.social += 1;

                if (post.status === "failed") {
                    item.failures += 1;
                }
            }
        });

        filteredWhatsAppMessages.forEach((message) => {
            const key = getDateKey(new Date(getWhatsAppMessageTime(message)));
            const item = map.get(key);

            if (item) {
                item.whatsapp += 1;

                if (message.status === "FAILED") {
                    item.failures += 1;
                }
            }
        });

        return Array.from(map.values());
    }, [filteredSocialPosts, filteredWhatsAppMessages, range]);

    const recentActivity = useMemo<ActivityItem[]>(() => {
        const socialItems = socialPosts.map((post) => ({
            id: `social-${post.id}`,
            title: `${normalizePlatform(post.socialAccount.platform)} post`,
            subtitle: post.errorMessage || post.content,
            status: post.status,
            platform: normalizePlatform(post.socialAccount.platform),
            time: formatDateTime(getSocialPostTime(post)),
            rawTime: new Date(getSocialPostTime(post)).getTime(),
            danger: post.status === "failed",
        }));

        const messageItems = whatsAppSummaries.flatMap((summary) => {
            return summary.recentMessages.map((message) => ({
                id: `message-${message.id}`,
                title: "WhatsApp template message",
                subtitle: `${message.templateName || "Template"} to ${message.recipientPhone}`,
                status: message.status,
                platform: "WhatsApp",
                time: formatDateTime(getWhatsAppMessageTime(message)),
                rawTime: new Date(getWhatsAppMessageTime(message)).getTime(),
                danger: message.status === "FAILED",
            }));
        });

        const logItems = whatsAppSummaries.flatMap((summary) => {
            return summary.recentLogs.map((log) => ({
                id: `log-${log.id}`,
                title: `WhatsApp ${log.direction.toLowerCase()} log`,
                subtitle: log.errorMessage || log.recipientPhone || "System log",
                status: log.success ? "success" : "failed",
                platform: "WhatsApp",
                time: formatDateTime(log.createdAt),
                rawTime: new Date(log.createdAt).getTime(),
                danger: !log.success,
            }));
        });

        return [...socialItems, ...messageItems, ...logItems].sort((a, b) => b.rawTime - a.rawTime).slice(0, 10);
    }, [socialPosts, whatsAppSummaries]);

    const nextScheduledItems = useMemo(() => {
        const now = Date.now();

        const socialScheduled = socialPosts
            .filter((post) => {
                return post.status === "pending" && post.scheduledAt && new Date(post.scheduledAt).getTime() >= now;
            })
            .map((post) => ({
                id: `social-next-${post.id}`,
                title: `${normalizePlatform(post.socialAccount.platform)} post`,
                subtitle: `@${post.socialAccount.accountUsername}`,
                time: post.scheduledAt || post.createdAt,
                platform: normalizePlatform(post.socialAccount.platform),
            }));

        const whatsappScheduled = whatsAppSummaries.flatMap((summary) => {
            return summary.recentMessages
                .filter((message) => message.status === "QUEUED" && new Date(message.scheduledAt).getTime() >= now)
                .map((message) => ({
                    id: `wa-next-${message.id}`,
                    title: "WhatsApp message",
                    subtitle: `${message.templateName || "Template"} to ${message.recipientPhone}`,
                    time: message.scheduledAt,
                    platform: "WhatsApp",
                }));
        });

        return [...socialScheduled, ...whatsappScheduled]
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
            .slice(0, 6);
    }, [socialPosts, whatsAppSummaries]);

    const exportCsv = () => {
        const rows = [
            ["Metric", "Value"],
            ["Connected channels", totals.channels],
            ["Total output", totals.totalOutput],
            ["Social posts", totals.socialPosts],
            ["WhatsApp messages", totals.whatsappMessages],
            ["Completed", totals.totalCompleted],
            ["In progress", totals.totalInProgress],
            ["Failures", totals.totalFailures],
            ["Clean rate", `${totals.cleanRate}%`],
            ["WhatsApp contacts", totals.whatsappContacts],
            ["WhatsApp templates", totals.whatsappTemplates],
            ["Approved templates", totals.whatsappApprovedTemplates],
            ["WhatsApp log success rate", `${totals.logSuccessRate}%`],
            [],
            ["Platform", "Accounts", "Total", "Completed", "Failed"],
            ...platformData.map((item) => [item.platform, item.accounts, item.total, item.completed, item.failed]),
        ];

        const csv = rows
            .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `mimico-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="chronos-panel flex items-center gap-3 px-5 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--chronos-olive)]" strokeWidth={1.75} />
                    <span className="chronos-label">Loading analytics</span>
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
                    <div>
                        <p className="chronos-label">Analytics</p>
                        <h1 className="mt-2 text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)] sm:text-4xl">
                            Operations intelligence
                        </h1>
                        <p className="mt-2 text-sm text-[var(--chronos-muted)]">
                            Real records only: posts, accounts, WhatsApp messages, templates, contacts and logs.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex rounded-full border border-[var(--chronos-line)] p-1">
                            {rangeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setRange(option.value)}
                                    className={`chronos-button h-10 px-4 ${
                                        range === option.value ? "" : "chronos-button-soft"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={loadAnalytics}
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

                        <button type="button" onClick={exportCsv} className="chronos-button">
                            <Download className="h-4 w-4" strokeWidth={1.75} />
                            Export
                        </button>
                    </div>
                </div>

                <div className="grid gap-px bg-[var(--chronos-line)] sm:grid-cols-2 xl:grid-cols-6">
                    <HeaderMetric label="Channels" value={totals.channels} />
                    <HeaderMetric label="Output" value={totals.totalOutput} />
                    <HeaderMetric label="Completed" value={totals.totalCompleted} />
                    <HeaderMetric label="Queued" value={totals.totalInProgress} />
                    <HeaderMetric label="Failures" value={totals.totalFailures} danger={totals.totalFailures > 0} />
                    <HeaderMetric label="Clean Rate" value={`${totals.cleanRate}%`} />
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

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Social posts"
                    value={totals.socialPosts}
                    text={`${totals.socialPosted} posted · ${totals.socialFailed} failed`}
                    icon={Send}
                    danger={totals.socialFailed > 0}
                />

                <MetricCard
                    title="WhatsApp"
                    value={totals.whatsappMessages}
                    text={`${totals.whatsappSent} sent · ${totals.whatsappFailed} failed`}
                    icon={MessageCircle}
                    danger={totals.whatsappFailed > 0}
                />

                <MetricCard
                    title="Contacts"
                    value={totals.whatsappContacts}
                    text={`${totals.whatsappTemplates} templates · ${totals.whatsappApprovedTemplates} approved`}
                    icon={Users}
                />

                <MetricCard
                    title="API logs"
                    value={`${totals.logSuccessRate}%`}
                    text={`${totals.successfulLogs} successful · ${totals.failedLogs} failed`}
                    icon={totals.failedLogs > 0 ? AlertTriangle : CheckCircle2}
                    danger={totals.failedLogs > 0}
                />
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Panel title="Activity trend" label={`${range === "all" ? "Latest records" : `${range} day range`}`}>
                    <div className="h-[310px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="socialFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chronos-olive)" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="var(--chronos-olive)" stopOpacity={0} />
                                    </linearGradient>

                                    <linearGradient id="whatsappFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chronos-olive-soft)" stopOpacity={0.28} />
                                        <stop offset="95%" stopColor="var(--chronos-olive-soft)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid stroke="var(--chronos-line)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "var(--chronos-muted)", fontSize: 11 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "var(--chronos-muted)", fontSize: 11 }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="social"
                                    name="Social"
                                    stroke="var(--chronos-olive)"
                                    fill="url(#socialFill)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="whatsapp"
                                    name="WhatsApp"
                                    stroke="var(--chronos-olive-soft)"
                                    fill="url(#whatsappFill)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="failures"
                                    name="Failures"
                                    stroke="var(--chronos-danger)"
                                    fill="transparent"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Status mix" label="Current distribution">
                    {statusData.length === 0 ? (
                        <EmptyState title="No status data" text="Create posts or messages to build distribution." />
                    ) : (
                        <div className="space-y-5">
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={58}
                                            outerRadius={88}
                                            paddingAngle={4}
                                        >
                                            {statusData.map((item, index) => (
                                                <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-2">
                                {statusData.map((item, index) => (
                                    <LegendRow
                                        key={item.name}
                                        label={item.name}
                                        value={item.value}
                                        color={chartColors[index % chartColors.length]}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Panel>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
                <Panel title="Platform breakdown" label="Accounts and records">
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={platformData}>
                                <CartesianGrid stroke="var(--chronos-line)" vertical={false} />
                                <XAxis
                                    dataKey="platform"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "var(--chronos-muted)", fontSize: 11 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "var(--chronos-muted)", fontSize: 11 }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="total" name="Total" fill="var(--chronos-olive)" radius={[8, 8, 0, 0]} />
                                <Bar
                                    dataKey="completed"
                                    name="Completed"
                                    fill="var(--chronos-olive-soft)"
                                    radius={[8, 8, 0, 0]}
                                />
                                <Bar
                                    dataKey="failed"
                                    name="Failed"
                                    fill="var(--chronos-danger)"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left">
                            <thead className="border-b border-[var(--chronos-line)] text-xs uppercase tracking-[0.14em] text-[var(--chronos-muted)]">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Platform</th>
                                    <th className="px-4 py-3 font-medium">Accounts</th>
                                    <th className="px-4 py-3 font-medium">Total</th>
                                    <th className="px-4 py-3 font-medium">Done</th>
                                    <th className="px-4 py-3 font-medium">Failed</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--chronos-line)]">
                                {platformData.map((item) => (
                                    <tr key={item.platform} className="transition hover:bg-[var(--chronos-olive)]/5">
                                        <td className="px-4 py-3 text-sm font-medium text-[var(--chronos-ink)]">
                                            {item.platform}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--chronos-muted)]">
                                            {item.accounts}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--chronos-muted)]">{item.total}</td>
                                        <td className="px-4 py-3 text-sm text-[var(--chronos-olive-soft)]">
                                            {item.completed}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--chronos-danger)]">
                                            {item.failed}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                <Panel title="Insights" label="Quick read">
                    <div className="space-y-3">
                        <InsightRow
                            icon={TrendingUp}
                            label="Busiest channel"
                            value={platformData.slice().sort((a, b) => b.total - a.total)[0]?.platform || "N/A"}
                            text={`${platformData.slice().sort((a, b) => b.total - a.total)[0]?.total || 0} tracked records`}
                        />

                        <InsightRow
                            icon={FileText}
                            label="Template health"
                            value={`${totals.whatsappApprovedTemplates}/${totals.whatsappTemplates}`}
                            text={`${totals.templateApprovalRate}% approval rate`}
                        />

                        <InsightRow
                            icon={Calendar}
                            label="Scheduled next"
                            value={nextScheduledItems.length}
                            text={nextScheduledItems.length > 0 ? "Upcoming queued work" : "No upcoming work"}
                        />

                        <InsightRow
                            icon={CheckCircle2}
                            label="Clean rate"
                            value={`${totals.cleanRate}%`}
                            text={totals.totalFailures > 0 ? "Failures need review" : "No failure pressure"}
                        />
                    </div>
                </Panel>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <Panel title="Recent activity" label="Latest 10 records">
                    {recentActivity.length === 0 ? (
                        <EmptyState
                            title="No activity yet"
                            text="Activity appears after publishing or sending WhatsApp messages."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left">
                                <thead className="border-b border-[var(--chronos-line)] text-xs uppercase tracking-[0.14em] text-[var(--chronos-muted)]">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Item</th>
                                        <th className="px-4 py-3 font-medium">Platform</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Time</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--chronos-line)]">
                                    {recentActivity.map((item, index) => (
                                        <ActivityRow key={item.id} item={item} index={index} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>

                <Panel title="Upcoming work" label="Next scheduled">
                    {nextScheduledItems.length === 0 ? (
                        <EmptyState
                            title="No upcoming work"
                            text="Schedule posts or WhatsApp messages to see them here."
                        />
                    ) : (
                        <div className="divide-y divide-[var(--chronos-line)]">
                            {nextScheduledItems.map((item) => (
                                <UpcomingRow key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </Panel>
            </section>
        </motion.div>
    );
}

function HeaderMetric({ label, value, danger }: { label: string; value: number | string; danger?: boolean }) {
    return (
        <div className="bg-[var(--chronos-sheet)]/70 p-4">
            <p className="chronos-label">{label}</p>
            <p
                className={`mt-2 text-3xl font-extralight tracking-[-0.07em] ${
                    danger ? "text-[var(--chronos-danger)]" : "text-[var(--chronos-ink)]"
                }`}
            >
                {value}
            </p>
        </div>
    );
}

function MetricCard({
    title,
    value,
    text,
    icon: Icon,
    danger,
}: {
    title: string;
    value: number | string;
    text: string;
    icon: ElementType;
    danger?: boolean;
}) {
    return (
        <div className="chronos-panel p-4">
            <div className="mb-5 flex items-center justify-between gap-3">
                <p className="chronos-label">{title}</p>
                <Icon
                    className={`h-4 w-4 ${danger ? "text-[var(--chronos-danger)]" : "text-[var(--chronos-olive)]"}`}
                    strokeWidth={1.75}
                />
            </div>

            <p className="text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)]">{value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--chronos-muted)]">{text}</p>
        </div>
    );
}

function Panel({ title, label, children }: { title: string; label: string; children: React.ReactNode }) {
    return (
        <div className="chronos-panel overflow-hidden">
            <div className="border-b border-[var(--chronos-line)] px-4 py-3">
                <p className="chronos-label">{label}</p>
                <h2 className="mt-1 text-xl font-light tracking-[-0.05em] text-[var(--chronos-ink)]">{title}</h2>
            </div>

            <div className="p-4">{children}</div>
        </div>
    );
}

function LegendRow({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 px-3 py-2">
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <span className="text-sm text-[var(--chronos-muted)]">{label}</span>
            </div>

            <span className="text-sm font-medium text-[var(--chronos-ink)]">{value}</span>
        </div>
    );
}

function InsightRow({
    icon: Icon,
    label,
    value,
    text,
}: {
    icon: ElementType;
    label: string;
    value: string | number;
    text: string;
}) {
    return (
        <div className="rounded-[20px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="chronos-label">{label}</p>
                    <p className="mt-2 text-2xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)]">
                        {value}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--chronos-muted)]">{text}</p>
                </div>

                <Icon className="h-5 w-5 shrink-0 text-[var(--chronos-olive)]" strokeWidth={1.75} />
            </div>
        </div>
    );
}

function ActivityRow({ item, index }: { item: ActivityItem; index: number }) {
    return (
        <motion.tr
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.025 }}
            className="transition hover:bg-[var(--chronos-olive)]/5"
        >
            <td className="px-4 py-3">
                <p className="max-w-[360px] truncate text-sm font-medium text-[var(--chronos-ink)]">{item.title}</p>
                <p className="mt-1 max-w-[360px] truncate text-xs text-[var(--chronos-muted)]">{item.subtitle}</p>
            </td>

            <td className="px-4 py-3 text-sm text-[var(--chronos-muted)]">{item.platform}</td>

            <td className="px-4 py-3">
                <span className={`chronos-pill ${getStatusClass(item.status)}`}>{item.status}</span>
            </td>

            <td className="px-4 py-3 text-xs uppercase tracking-[0.12em] text-[var(--chronos-muted)]">{item.time}</td>
        </motion.tr>
    );
}

function UpcomingRow({
    item,
}: {
    item: {
        id: string;
        title: string;
        subtitle: string;
        time: string;
        platform: string;
    };
}) {
    return (
        <div className="flex items-start gap-3 p-4 transition hover:bg-[var(--chronos-olive)]/5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                <Clock className="h-4 w-4" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--chronos-ink)]">{item.title}</p>
                <p className="mt-1 truncate text-xs text-[var(--chronos-muted)]">{item.subtitle}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="chronos-pill">{item.platform}</span>
                    <span className="text-xs text-[var(--chronos-muted)]">{formatDateTime(item.time)}</span>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-[20px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-6 text-center">
            <p className="text-sm font-medium text-[var(--chronos-ink)]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--chronos-muted)]">{text}</p>
        </div>
    );
}

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-[18px] border border-[var(--chronos-line-strong)] bg-[var(--chronos-sheet)]/95 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {label && (
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--chronos-muted)]">
                    {label}
                </p>
            )}

            <div className="space-y-1">
                {payload.map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between gap-6 text-xs">
                        <span style={{ color: item.color }}>{item.name}</span>
                        <span className="text-[var(--chronos-ink)]">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
