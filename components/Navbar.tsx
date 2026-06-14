"use client";

import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    AlertTriangle,
    BarChart3,
    Bell,
    CalendarClock,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    LayoutDashboard,
    Loader2,
    LogOut,
    Menu,
    MessageCircle,
    MoreHorizontal,
    RefreshCw,
    Send,
    Trash2,
    UserCircle,
    X,
} from "lucide-react";
import { BsTwitterX } from "react-icons/bs";
import { SiMastodon, SiThreads } from "react-icons/si";
import AppLogo from "@/components/AppLogo";
import ThemeToggle from "@/components/ThemeToggle";

type User = {
    firstName: string;
    lastName: string;
    email?: string;
};

type NavItem = {
    label: string;
    href: string;
    icon: ElementType;
};

type NotificationItem = {
    id: string;
    title: string;
    text: string;
    time: string;
    type: "failed" | "pending" | "processing" | "posted";
    read: boolean;
};

type PostRecord = {
    id: string;
    content: string;
    status: string;
    scheduledAt?: string | null;
    postedAt?: string | null;
    createdAt: string;
    errorMessage?: string | null;
    socialAccount?: {
        accountUsername?: string;
        platform?: string;
    };
};

const primaryNav: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Publishing",
        href: "/publishing",
        icon: CalendarClock,
    },
    {
        label: "WhatsApp",
        href: "/whatsapp",
        icon: MessageCircle,
    },
    {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
    },
];

const moreNav: NavItem[] = [
    {
        label: "Twitter / X",
        href: "/twitter",
        icon: BsTwitterX,
    },
    {
        label: "Mastodon",
        href: "/mastodon",
        icon: SiMastodon,
    },
    {
        label: "Threads",
        href: "/threads",
        icon: SiThreads,
    },
];

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/publishing": "Publishing",
    "/whatsapp": "WhatsApp",
    "/analytics": "Analytics",
    "/twitter": "Twitter / X",
    "/mastodon": "Mastodon",
    "/threads": "Threads",
};

const READ_NOTIFICATIONS_KEY = "mimico:read-notifications";
const DELETED_NOTIFICATIONS_KEY = "mimico:deleted-notifications";

const formatTime = (value?: string | null) => {
    if (!value) {
        return "N/A";
    }

    return new Date(value).toLocaleString();
};

const normalizePlatform = (platform?: string) => {
    if (!platform) {
        return "Social";
    }

    if (platform.toLowerCase() === "twitter") {
        return "Twitter / X";
    }

    if (platform.toLowerCase() === "mastodon") {
        return "Mastodon";
    }

    if (platform.toLowerCase() === "threads") {
        return "Threads";
    }

    return platform;
};

const readStorageArray = (key: string) => {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return [];
        }

        const parsed = JSON.parse(value);

        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
        return [];
    }
};

const writeStorageArray = (key: string, value: string[]) => {
    localStorage.setItem(key, JSON.stringify(Array.from(new Set(value))));
};

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();

    const profileRef = useRef<HTMLDivElement | null>(null);
    const moreRef = useRef<HTMLDivElement | null>(null);
    const notificationRef = useRef<HTMLDivElement | null>(null);

    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [notificationLoading, setNotificationLoading] = useState(false);

    const pageTitle = useMemo(() => {
        const matchedRoute = Object.keys(pageTitles)
            .sort((a, b) => b.length - a.length)
            .find((route) => pathname === route || pathname.startsWith(`${route}/`));

        return matchedRoute ? pageTitles[matchedRoute] : "Workspace";
    }, [pathname]);

    const initials = useMemo(() => {
        if (!user) {
            return "MO";
        }

        return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "MO";
    }, [user]);

    const unreadCount = useMemo(() => {
        return notifications.filter((item) => !item.read).length;
    }, [notifications]);

    const allMobileNav = useMemo(() => [...primaryNav, ...moreNav], []);

    const isActiveRoute = (href: string) => {
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const loadUser = async () => {
        try {
            setLoadingUser(true);

            const res = await fetch("/api/auth/user");

            if (!res.ok) {
                setUser(null);
                return;
            }

            const data = await res.json();
            setUser(data.user || null);
        } catch {
            setUser(null);
        } finally {
            setLoadingUser(false);
        }
    };

    const loadNotifications = async () => {
        try {
            setNotificationLoading(true);

            const readIds = readStorageArray(READ_NOTIFICATIONS_KEY);
            const deletedIds = readStorageArray(DELETED_NOTIFICATIONS_KEY);

            const res = await fetch("/api/posts");

            if (!res.ok) {
                setNotifications([]);
                return;
            }

            const data = await res.json();
            const posts: PostRecord[] = data.posts || [];

            const items = posts
                .filter((post) => {
                    const status = post.status.toLowerCase();
                    return status === "failed" || status === "processing" || status === "pending";
                })
                .filter((post) => !deletedIds.includes(post.id))
                .sort((a, b) => {
                    const aTime = new Date(a.postedAt || a.scheduledAt || a.createdAt).getTime();
                    const bTime = new Date(b.postedAt || b.scheduledAt || b.createdAt).getTime();

                    return bTime - aTime;
                })
                .slice(0, 8)
                .map((post) => {
                    const status = post.status.toLowerCase() as NotificationItem["type"];
                    const platform = normalizePlatform(post.socialAccount?.platform);
                    const username = post.socialAccount?.accountUsername
                        ? `@${post.socialAccount.accountUsername}`
                        : "Account";

                    return {
                        id: post.id,
                        type: status,
                        read: readIds.includes(post.id),
                        title:
                            status === "failed"
                                ? `${platform} post failed`
                                : status === "processing"
                                  ? `${platform} post processing`
                                  : `${platform} post queued`,
                        text: post.errorMessage || `${username} · ${post.content}`,
                        time: formatTime(post.postedAt || post.scheduledAt || post.createdAt),
                    };
                });

            setNotifications(items);
        } catch {
            setNotifications([]);
        } finally {
            setNotificationLoading(false);
        }
    };

    const markNotificationAsRead = (id: string) => {
        const readIds = readStorageArray(READ_NOTIFICATIONS_KEY);
        writeStorageArray(READ_NOTIFICATIONS_KEY, [...readIds, id]);

        setNotifications((current) =>
            current.map((item) => {
                if (item.id !== id) {
                    return item;
                }

                return {
                    ...item,
                    read: true,
                };
            }),
        );
    };

    const deleteNotification = (id: string) => {
        const deletedIds = readStorageArray(DELETED_NOTIFICATIONS_KEY);
        writeStorageArray(DELETED_NOTIFICATIONS_KEY, [...deletedIds, id]);

        setNotifications((current) => current.filter((item) => item.id !== id));
    };

    const markAllNotificationsAsRead = () => {
        const readIds = readStorageArray(READ_NOTIFICATIONS_KEY);
        const nextReadIds = [...readIds, ...notifications.map((item) => item.id)];

        writeStorageArray(READ_NOTIFICATIONS_KEY, nextReadIds);

        setNotifications((current) =>
            current.map((item) => ({
                ...item,
                read: true,
            })),
        );
    };

    const clearAllNotifications = () => {
        const deletedIds = readStorageArray(DELETED_NOTIFICATIONS_KEY);
        const nextDeletedIds = [...deletedIds, ...notifications.map((item) => item.id)];

        writeStorageArray(DELETED_NOTIFICATIONS_KEY, nextDeletedIds);
        setNotifications([]);
    };

    const openNotification = (id: string) => {
        markNotificationAsRead(id);
        setNotificationOpen(false);
        router.push("/publishing");
    };

    const toggleNotifications = () => {
        setNotificationOpen((current) => {
            const next = !current;

            if (next) {
                setProfileOpen(false);
                setMoreOpen(false);
                loadNotifications();
            }

            return next;
        });
    };

    const logout = async () => {
        await fetch("/api/auth/logout", {
            method: "POST",
        });

        router.push("/login");
    };

    useEffect(() => {
        loadUser();
        loadNotifications();
    }, []);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }

            if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
                setMoreOpen(false);
            }

            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationOpen(false);
            }
        };

        window.addEventListener("mousedown", handler);

        return () => {
            window.removeEventListener("mousedown", handler);
        };
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setMoreOpen(false);
        setProfileOpen(false);
        setNotificationOpen(false);
    }, [pathname]);

    return (
        <header className="fixed left-0 right-0 top-0 z-[80] border-b border-[var(--chronos-line)] bg-[var(--chronos-canvas)]/82 backdrop-blur-2xl">
            <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20">
                <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="group flex min-w-0 items-center gap-3 text-left"
                >
                    <AppLogo size="md" />

                    <span className="hidden min-w-0 sm:block">
                        <span className="block truncate text-sm font-medium text-[var(--chronos-ink)] transition duration-700 group-hover:text-[var(--chronos-olive)]">
                            MIMICO
                        </span>
                        <span className="chronos-label mt-1 block truncate">{pageTitle}</span>
                    </span>
                </button>

                <nav className="hidden items-center gap-2 xl:flex">
                    {primaryNav.map((item) => (
                        <NavButton
                            key={item.href}
                            item={item}
                            active={isActiveRoute(item.href)}
                            onClick={() => router.push(item.href)}
                        />
                    ))}

                    <div ref={moreRef} className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen((current) => !current);
                                setNotificationOpen(false);
                                setProfileOpen(false);
                            }}
                            className={`chronos-button h-10 ${moreNav.some((item) => isActiveRoute(item.href)) ? "" : "chronos-button-soft"}`}
                        >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                            More
                            <ChevronDown
                                className={`h-4 w-4 transition duration-700 ${moreOpen ? "rotate-180" : ""}`}
                                strokeWidth={1.75}
                            />
                        </button>

                        {moreOpen && (
                            <Dropdown className="right-0 mt-3 w-64">
                                {moreNav.map((item) => (
                                    <DropdownItem
                                        key={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        active={isActiveRoute(item.href)}
                                        onClick={() => router.push(item.href)}
                                    />
                                ))}
                            </Dropdown>
                        )}
                    </div>
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                    <div ref={notificationRef} className="relative">
                        <button
                            type="button"
                            onClick={toggleNotifications}
                            className={`chronos-button relative w-14 px-0 ${notificationOpen ? "" : "chronos-button-soft"}`}
                        >
                            <Bell className="h-4 w-4" strokeWidth={1.75} />

                            {unreadCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--chronos-canvas)] bg-[var(--chronos-danger)] px-1 text-[10px] font-medium text-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {notificationOpen && (
                            <Dropdown className="right-0 mt-3 w-[calc(100vw-2rem)] max-w-[420px]">
                                <div className="flex items-center justify-between gap-3 border-b border-[var(--chronos-line)] p-4">
                                    <div>
                                        <p className="chronos-label">Notifications</p>
                                        <h3 className="mt-1 text-lg font-light tracking-[-0.05em] text-[var(--chronos-ink)]">
                                            Publishing alerts
                                        </h3>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={loadNotifications}
                                        disabled={notificationLoading}
                                        className="chronos-button w-14 px-0"
                                    >
                                        {notificationLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                                        )}
                                    </button>
                                </div>

                                {notifications.length > 0 && (
                                    <div className="flex gap-2 border-b border-[var(--chronos-line)] p-3">
                                        <button
                                            type="button"
                                            onClick={markAllNotificationsAsRead}
                                            className="chronos-button chronos-button-soft h-9 flex-1"
                                        >
                                            <Check className="h-4 w-4" strokeWidth={1.75} />
                                            Mark all read
                                        </button>

                                        <button
                                            type="button"
                                            onClick={clearAllNotifications}
                                            className="chronos-button chronos-button-soft h-9 flex-1 border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                                        >
                                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                                            Clear all
                                        </button>
                                    </div>
                                )}

                                {notificationLoading ? (
                                    <div className="flex items-center justify-center gap-3 p-6">
                                        <Loader2
                                            className="h-4 w-4 animate-spin text-[var(--chronos-olive)]"
                                            strokeWidth={1.75}
                                        />
                                        <span className="chronos-label">Loading alerts</span>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-6 text-center">
                                        <CheckCircle2
                                            className="mx-auto h-7 w-7 text-[var(--chronos-olive)]"
                                            strokeWidth={1.75}
                                        />
                                        <p className="mt-3 text-sm font-medium text-[var(--chronos-ink)]">
                                            No active alerts
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-[var(--chronos-muted)]">
                                            Failed, processing, and queued posts will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="max-h-[360px] overflow-y-auto">
                                        {notifications.map((item) => (
                                            <NotificationRow
                                                key={item.id}
                                                item={item}
                                                onOpen={() => openNotification(item.id)}
                                                onRead={() => markNotificationAsRead(item.id)}
                                                onDelete={() => deleteNotification(item.id)}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="border-t border-[var(--chronos-line)] p-3">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/publishing")}
                                        className="chronos-button chronos-button-soft w-full"
                                    >
                                        Open publishing
                                        <Send className="h-4 w-4" strokeWidth={1.75} />
                                    </button>
                                </div>
                            </Dropdown>
                        )}
                    </div>

                    <ThemeToggle />

                    <div ref={profileRef} className="relative hidden sm:block">
                        <button
                            type="button"
                            onClick={() => {
                                setProfileOpen((current) => !current);
                                setNotificationOpen(false);
                                setMoreOpen(false);
                            }}
                            className="flex h-10 items-center gap-3 rounded-full border border-[var(--chronos-line-strong)] bg-[var(--chronos-olive)]/5 px-2 pr-3 transition hover:border-[var(--chronos-olive)]"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--chronos-olive)] text-xs font-semibold text-[#090A0D]">
                                {loadingUser ? "..." : initials}
                            </span>

                            <span className="hidden max-w-[130px] truncate text-xs font-medium text-[var(--chronos-ink)] md:block">
                                {user ? `${user.firstName} ${user.lastName}` : "Operator"}
                            </span>

                            <ChevronDown
                                className={`h-4 w-4 text-[var(--chronos-muted)] transition duration-700 ${profileOpen ? "rotate-180" : ""}`}
                                strokeWidth={1.75}
                            />
                        </button>

                        {profileOpen && (
                            <Dropdown className="right-0 mt-3 w-72">
                                <div className="border-b border-[var(--chronos-line)] p-4">
                                    <p className="truncate text-sm font-medium text-[var(--chronos-ink)]">
                                        {user ? `${user.firstName} ${user.lastName}` : "Operator"}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-[var(--chronos-muted)]">
                                        {user?.email || "Workspace user"}
                                    </p>
                                </div>

                                <DropdownItem icon={Send} label="New post" onClick={() => router.push("/publishing")} />
                                <DropdownItem
                                    icon={UserCircle}
                                    label="Dashboard"
                                    onClick={() => router.push("/dashboard")}
                                />
                                <DropdownItem icon={LogOut} label="Logout" danger onClick={logout} />
                            </Dropdown>
                        )}
                    </div>

                    <div className="flex xl:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileOpen((current) => !current)}
                            className="chronos-button w-14 px-0 xl:hidden"
                        >
                            {mobileOpen ? (
                                <X className="h-4 w-4" strokeWidth={1.75} />
                            ) : (
                                <Menu className="h-4 w-4" strokeWidth={1.75} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {mobileOpen && (
                <div className="border-t border-[var(--chronos-line)] bg-[var(--chronos-sheet)]/96 px-4 py-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl xl:hidden">
                    <div className="mx-auto max-w-[1600px] space-y-2">
                        {allMobileNav.map((item) => (
                            <button
                                key={item.href}
                                type="button"
                                onClick={() => router.push(item.href)}
                                className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3 text-left text-sm transition ${
                                    isActiveRoute(item.href)
                                        ? "border-[var(--chronos-olive)] bg-[var(--chronos-olive)]/10 text-[var(--chronos-ink)]"
                                        : "border-[var(--chronos-line)] text-[var(--chronos-muted)] hover:border-[var(--chronos-olive)] hover:text-[var(--chronos-ink)]"
                                }`}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {item.label}
                            </button>
                        ))}

                        <div className="grid gap-3 pt-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => router.push("/publishing")}
                                className="chronos-button w-full"
                            >
                                <Send className="h-4 w-4" strokeWidth={1.75} />
                                New post
                            </button>

                            <button
                                type="button"
                                onClick={logout}
                                className="chronos-button chronos-button-soft w-full border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                            >
                                <LogOut className="h-4 w-4" strokeWidth={1.75} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
    const Icon = item.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`chronos-button h-10 ${active ? "" : "chronos-button-soft"}`}
        >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {item.label}
        </button>
    );
}

function Dropdown({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`absolute z-[120] overflow-hidden rounded-[24px] border border-[var(--chronos-line-strong)] bg-[var(--chronos-sheet)]/96 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl ${className}`}
        >
            {children}
        </div>
    );
}

function DropdownItem({
    icon: Icon,
    label,
    active,
    danger,
    onClick,
}: {
    icon: ElementType;
    label: string;
    active?: boolean;
    danger?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[var(--chronos-olive)]/5 ${
                danger
                    ? "text-[var(--chronos-danger)]"
                    : active
                      ? "text-[var(--chronos-olive-soft)]"
                      : "text-[var(--chronos-muted)] hover:text-[var(--chronos-ink)]"
            }`}
        >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {label}

            {active && <CheckCircle2 className="ml-auto h-4 w-4 text-[var(--chronos-olive)]" strokeWidth={1.75} />}
        </button>
    );
}

function NotificationRow({
    item,
    onOpen,
    onRead,
    onDelete,
}: {
    item: NotificationItem;
    onOpen: () => void;
    onRead: () => void;
    onDelete: () => void;
}) {
    const Icon = item.type === "failed" ? AlertTriangle : item.type === "processing" ? Loader2 : Clock;

    return (
        <div
            className={`border-b border-[var(--chronos-line)] p-4 transition last:border-b-0 hover:bg-[var(--chronos-olive)]/5 ${
                item.read ? "opacity-60" : ""
            }`}
        >
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={onOpen}
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                        item.type === "failed"
                            ? "border-[var(--chronos-danger)]/45 text-[var(--chronos-danger)]"
                            : "border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]"
                    }`}
                >
                    <Icon
                        className={`h-4 w-4 ${item.type === "processing" ? "animate-spin" : ""}`}
                        strokeWidth={1.75}
                    />
                </button>

                <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-2">
                        {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--chronos-danger)]" />}
                        <span className="block truncate text-sm font-medium text-[var(--chronos-ink)]">
                            {item.title}
                        </span>
                    </span>

                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--chronos-muted)]">
                        {item.text}
                    </span>

                    <span className="mt-2 block text-[10px] uppercase tracking-[0.14em] text-[var(--chronos-muted)]">
                        {item.time}
                    </span>
                </button>
            </div>

            <div className="mt-3 flex gap-2 pl-12">
                <button
                    type="button"
                    onClick={onRead}
                    disabled={item.read}
                    className="chronos-button chronos-button-soft h-8 px-3 text-[10px]"
                >
                    <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {item.read ? "Read" : "Mark read"}
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    className="chronos-button chronos-button-soft h-8 border-[var(--chronos-danger)] px-3 text-[10px] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Delete
                </button>
            </div>
        </div>
    );
}
