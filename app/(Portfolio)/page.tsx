"use client";

import { useState, type ElementType, type MouseEvent } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    ArrowUpRight,
    BrainCircuit,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Clock,
    Command,
    Gauge,
    Layers3,
    LockKeyhole,
    Menu,
    MessageCircle,
    Orbit,
    RadioTower,
    Send,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Workflow,
    X,
    Zap,
    type LucideIcon,
} from "lucide-react";
import { BsTwitterX } from "react-icons/bs";
import { SiMastodon, SiThreads, SiWhatsapp } from "react-icons/si";
import AppLogo from "@/components/AppLogo";
import ThemeToggle from "@/components/ThemeToggle";

type NavItem = {
    label: string;
    id: string;
};

type Feature = {
    index: string;
    icon: LucideIcon;
    title: string;
    text: string;
};

type WorkflowItem = {
    number: string;
    title: string;
    text: string;
};

type PlatformItem = {
    name: string;
    signal: string;
    text: string;
    icon: ElementType;
};

type Capability = {
    title: string;
    text: string;
};

const navItems: NavItem[] = [
    { label: "Overview", id: "overview" },
    { label: "Studio", id: "studio" },
    { label: "Workflow", id: "workflow" },
    { label: "Platforms", id: "platforms" },
    { label: "Security", id: "security" },
];

const metrics = [
    { value: "04", label: "Platform layers" },
    { value: "AI", label: "Content studio" },
    { value: "24/7", label: "Scheduling rhythm" },
];

const features: Feature[] = [
    {
        index: "01",
        icon: Layers3,
        title: "A quieter command layer for loud social work.",
        text: "MIMICO keeps social publishing, WhatsApp messaging, schedules, failures, and account signals in one controlled system without turning the interface into a noisy spreadsheet.",
    },
    {
        index: "02",
        icon: BrainCircuit,
        title: "AI writing tools built directly into the flow.",
        text: "Generate captions, improve grammar, rewrite tone, create hashtags, prepare event-based suggestions, and adapt posts for different platforms without leaving the composer.",
    },
    {
        index: "03",
        icon: CalendarClock,
        title: "A publishing calendar with real operational value.",
        text: "Move from scattered drafts to a visible timeline. Track queued posts, scheduled work, posted content, and failures from a calendar and list view.",
    },
    {
        index: "04",
        icon: MessageCircle,
        title: "WhatsApp Business beside social publishing.",
        text: "Templates, contacts, scheduled messages, and delivery logs sit beside your social workflows so communication stays centralized.",
    },
];

const workflow: WorkflowItem[] = [
    {
        number: "001",
        title: "Connect",
        text: "Attach Twitter / X, Threads, Mastodon, and WhatsApp Business through focused integration screens.",
    },
    {
        number: "002",
        title: "Compose",
        text: "Write manually or use AI tools for captions, tone, grammar, hashtags, and platform-specific rewrites.",
    },
    {
        number: "003",
        title: "Schedule",
        text: "Post instantly or schedule content into a calendar that keeps upcoming work visible.",
    },
    {
        number: "004",
        title: "Monitor",
        text: "Review processing, posted, queued, failed, and completed activity from clean signal streams.",
    },
];

const platforms: PlatformItem[] = [
    {
        name: "Twitter / X",
        signal: "Fast publishing",
        text: "Connect accounts, publish short-form updates, track post states, and keep account-level posting clean.",
        icon: BsTwitterX,
    },
    {
        name: "Instagram Threads",
        signal: "Creator surface",
        text: "Prepare creator-first posts and keep Threads separated from other publishing workflows.",
        icon: SiThreads,
    },
    {
        name: "Mastodon",
        signal: "Federated layer",
        text: "Handle Mastodon as its own platform with account and instance-aware separation.",
        icon: SiMastodon,
    },
    {
        name: "WhatsApp Business",
        signal: "Message engine",
        text: "Manage templates, contacts, scheduled sends, failed messages, and delivery records.",
        icon: SiWhatsapp,
    },
];

const capabilities: Capability[] = [
    {
        title: "Caption generator",
        text: "Turn a rough idea into usable post copy for your connected platforms.",
    },
    {
        title: "Grammar improvement",
        text: "Clean weak phrasing, mistakes, and unclear structure before publishing.",
    },
    {
        title: "Tone rewrite",
        text: "Shift the same message into professional, friendly, casual, confident, persuasive, funny, or simple tone.",
    },
    {
        title: "Hashtag generator",
        text: "Generate focused hashtag sets without stuffing the post with random tags.",
    },
    {
        title: "Event suggestions",
        text: "Use seasonal, date-based, or campaign-based ideas to keep content timely.",
    },
    {
        title: "Post score",
        text: "Evaluate clarity, length, readability, platform fit, and publishing readiness.",
    },
];

const signalRows = [
    { label: "Campaign teaser", channel: "Twitter / X", status: "Queued", time: "09:30" },
    { label: "Product reminder", channel: "WhatsApp", status: "Ready", time: "11:00" },
    { label: "Founder update", channel: "Threads", status: "Draft", time: "14:45" },
    { label: "Community dispatch", channel: "Mastodon", status: "Scheduled", time: "18:15" },
];

const studioCards = [
    { icon: BrainCircuit, label: "Caption AI", value: "Generate" },
    { icon: Sparkles, label: "Tone Rewrite", value: "Refine" },
    { icon: TrendingUp, label: "Post Score", value: "Analyze" },
];

export default function LandingPage() {
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const { scrollYProgress } = useScroll();
    const scaleProgress = useSpring(scrollYProgress, {
        stiffness: 90,
        damping: 30,
        restDelta: 0.001,
    });

    const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
    const frameY = useTransform(scrollYProgress, [0, 1], ["0%", "-5%"]);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 60, damping: 18 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 60, damping: 18 });

    const heroRotateX = useTransform(smoothMouseY, [-300, 300], [3, -3]);
    const heroRotateY = useTransform(smoothMouseX, [-300, 300], [-3, 3]);

    const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        mouseX.set(event.clientX - rect.left - rect.width / 2);
        mouseY.set(event.clientY - rect.top - rect.height / 2);
    };

    const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
        event.preventDefault();
        setMobileOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <main className="chronos-page relative min-h-screen w-full overflow-x-hidden" onMouseMove={handleMouseMove}>
            <motion.div
                className="fixed left-0 right-0 top-0 z-[140] h-px origin-left bg-[var(--chronos-olive)]"
                style={{ scaleX: scaleProgress }}
            />

            <motion.div style={{ y: backgroundY }} className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute left-1/2 top-[-18rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[var(--chronos-olive)]/20 blur-[110px] sm:h-[42rem] sm:w-[42rem]" />
                <div className="absolute right-[-18rem] top-[18rem] h-[28rem] w-[28rem] rounded-full bg-[var(--chronos-olive-soft)]/10 blur-[120px] sm:h-[38rem] sm:w-[38rem]" />
                <div className="absolute bottom-[-18rem] left-[-18rem] h-[30rem] w-[30rem] rounded-full bg-[var(--chronos-olive-dark)]/24 blur-[130px] sm:h-[42rem] sm:w-[42rem]" />
            </motion.div>

            <nav className="fixed left-0 right-0 top-0 z-[120] border-b border-[var(--chronos-line)] bg-[var(--chronos-canvas)]/75 backdrop-blur-2xl">
                <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-3 px-4 sm:h-24 sm:px-6 md:px-10 lg:px-14 xl:px-20">
                    <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="group flex min-w-0 items-center gap-3 text-left"
                    >
                        <AppLogo size="md" />

                        <span className="min-w-0">
                            <span className="block truncate text-sm font-medium tracking-[-0.03em] text-[var(--chronos-ink)] transition duration-700 group-hover:translate-x-1">
                                MIMICO
                            </span>
                        </span>
                    </button>

                    <div className="hidden items-center gap-7 xl:flex">
                        {navItems.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                onClick={(event) => scrollToSection(event, item.id)}
                                className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--chronos-muted)] transition duration-700 hover:translate-x-1 hover:text-[var(--chronos-olive)]"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <ThemeToggle />

                        <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="chronos-button chronos-button-soft hidden sm:inline-flex"
                        >
                            Login
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push("/signup")}
                            className="chronos-button hidden lg:inline-flex"
                        >
                            Enter
                            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                        </button>

                        <div className="sm:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileOpen((current) => !current)}
                                className="chronos-button w-14 px-0"
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
                    <div className="border-t border-[var(--chronos-line)] bg-[var(--chronos-sheet)] px-4 py-4 sm:px-6 xl:hidden">
                        <div className="mx-auto max-w-[1600px] space-y-1">
                            {navItems.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={(event) => scrollToSection(event, item.id)}
                                    className="flex rounded-full px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--chronos-muted)] transition duration-700 hover:bg-white/5 hover:text-[var(--chronos-ink)]"
                                >
                                    {item.label}
                                </a>
                            ))}

                            <div className="grid gap-3 pt-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => router.push("/login")}
                                    className="chronos-button chronos-button-soft w-full"
                                >
                                    Login
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.push("/signup")}
                                    className="chronos-button w-full"
                                >
                                    Enter workspace
                                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <section className="relative z-10 px-4 pb-20 pt-32 sm:px-6 sm:pb-24 sm:pt-40 md:px-10 lg:px-14 lg:pb-32 lg:pt-48 xl:px-20">
                <div className="mx-auto grid max-w-[1600px] gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:items-center xl:gap-20">
                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="min-w-0"
                    >
                        <div className="chronos-line mb-8" />

                        <p className="chronos-label">MIMICO / Olive command interface</p>

                        <h1 className="mt-7 max-w-6xl text-[clamp(2.75rem,14vw,7.2rem)] font-extralight leading-[0.88] tracking-[-0.095em] text-[var(--chronos-ink)] sm:text-[clamp(3.5rem,10vw,7.2rem)]">
                            Social publishing with cinematic control.
                        </h1>

                        <p className="chronos-subtitle mt-7 max-w-2xl">
                            MIMICO gives creators, teams, and operators one calm workspace to compose, schedule,
                            analyze, and publish content across social channels and WhatsApp Business.
                        </p>

                        <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
                            <button
                                type="button"
                                onClick={() => router.push("/signup")}
                                className="chronos-button w-full sm:w-auto"
                            >
                                Start now
                                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                            </button>

                            <a
                                href="#overview"
                                onClick={(event) => scrollToSection(event, "overview")}
                                className="chronos-button chronos-button-soft w-full sm:w-auto"
                            >
                                Explore system
                                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                            </a>
                        </div>

                        <div className="mt-12 grid gap-6 border-t border-[var(--chronos-line)] pt-7 sm:grid-cols-3 lg:max-w-3xl">
                            {metrics.map((metric) => (
                                <div key={metric.label} className="min-w-0">
                                    <p className="text-4xl font-extralight tracking-[-0.08em] text-[var(--chronos-ink)] md:text-5xl">
                                        {metric.value}
                                    </p>
                                    <p className="chronos-label mt-3">{metric.label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        style={{ y: frameY, rotateX: heroRotateX, rotateY: heroRotateY }}
                        initial={{ opacity: 0, y: 34, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="relative min-w-0 [transform-style:preserve-3d]"
                    >
                        <CinematicFrame />
                    </motion.div>
                </div>
            </section>

            <MarqueeBand />

            <PageSection id="overview">
                <SectionHeader
                    label="Overview"
                    title="Not a noisy dashboard. A focused operating surface."
                    text="The interface is designed to make complex social operations feel slow, precise, and deliberate. You get visibility without the usual SaaS clutter."
                />

                <div className="mt-12 sm:mt-14">
                    {features.map((feature, index) => (
                        <FeatureRow key={feature.title} feature={feature} index={index} />
                    ))}
                </div>
            </PageSection>

            <PageSection id="studio">
                <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
                    <SectionHeader
                        label="AI Studio"
                        title="Draft faster. Publish cleaner."
                        text="The content studio helps with the parts that slow creators down: writing, rewriting, checking, scoring, and adapting posts."
                    />

                    <div className="min-w-0 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            {studioCards.map((card, index) => {
                                const Icon = card.icon;

                                return (
                                    <motion.div
                                        key={card.label}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
                                        className="chronos-panel p-5"
                                    >
                                        <Icon className="h-5 w-5 text-[var(--chronos-olive)]" strokeWidth={1.75} />
                                        <p className="mt-8 text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)]">
                                            {card.value}
                                        </p>
                                        <p className="chronos-label mt-4">{card.label}</p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div>
                            {capabilities.map((capability, index) => (
                                <CapabilityRow key={capability.title} capability={capability} index={index} />
                            ))}
                        </div>
                    </div>
                </div>
            </PageSection>

            <PageSection id="workflow">
                <SectionHeader
                    label="Workflow"
                    title="A clean path from idea to delivery."
                    text="Every interaction follows a calm operational sequence. Connect accounts, compose content, schedule posts, and monitor movement."
                />

                <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {workflow.map((item, index) => (
                        <WorkflowBlock key={item.number} item={item} index={index} />
                    ))}
                </div>
            </PageSection>

            <PageSection id="platforms">
                <SectionHeader
                    label="Platforms"
                    title="Each channel gets its own surface."
                    text="MIMICO keeps platforms separated where they should be separate and unified where you need one operational signal."
                />

                <div className="mt-12 sm:mt-14">
                    {platforms.map((platform, index) => (
                        <PlatformRow key={platform.name} platform={platform} index={index} />
                    ))}
                </div>
            </PageSection>

            <PageSection id="security">
                <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
                    <SectionHeader
                        label="Security"
                        title="Sharp control with clear boundaries."
                        text="Account actions, OAuth connections, platform rules, and publishing limitations stay readable and separated."
                    />

                    <div className="min-w-0 space-y-4 sm:space-y-6">
                        <SecurityLine
                            icon={ShieldCheck}
                            title="Secure workspace entry"
                            text="Authentication stays focused, cinematic, and separated from operational screens."
                        />
                        <SecurityLine
                            icon={LockKeyhole}
                            title="Platform boundaries"
                            text="Each integration keeps its own rules, tokens, platform limits, and posting behavior."
                        />
                        <SecurityLine
                            icon={Workflow}
                            title="Visible execution flow"
                            text="Post status, queues, failures, and delivery movement remain simple to read."
                        />
                        <SecurityLine
                            icon={Zap}
                            title="Less decision fatigue"
                            text="The app removes clutter so users can decide what to publish, where to publish, and when to publish."
                        />
                    </div>
                </div>
            </PageSection>

            <section className="relative z-10 px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-28 lg:px-14 xl:px-20">
                <div className="mx-auto max-w-[1500px]">
                    <div className="chronos-line mb-8" />

                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                        <div className="min-w-0">
                            <p className="chronos-label">Final signal</p>

                            <h2 className="mt-6 max-w-5xl text-[clamp(2.3rem,11vw,5.8rem)] font-extralight leading-[0.92] tracking-[-0.085em] text-[var(--chronos-ink)] sm:text-[clamp(2.8rem,7vw,5.8rem)]">
                                Build a calmer publishing system.
                            </h2>

                            <p className="chronos-subtitle mt-7 max-w-2xl">
                                Start with one workspace, connect your platforms, and turn scattered content work into a
                                controlled system.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <button
                                type="button"
                                onClick={() => router.push("/signup")}
                                className="chronos-button w-full"
                            >
                                Create account
                                <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push("/login")}
                                className="chronos-button chronos-button-soft w-full"
                            >
                                Open workspace
                                <Command className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="relative z-10 border-t border-[var(--chronos-line)] px-4 py-10 sm:px-6 md:px-10 lg:px-14 xl:px-20">
                <div className="mx-auto flex max-w-[1500px] flex-col gap-8 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <AppLogo size="md" />
                        <div>
                            <p className="text-sm font-medium text-[var(--chronos-ink)]">MIMICO</p>
                            <p className="chronos-label mt-1">Social account manager</p>
                        </div>
                    </div>

                    <p className="max-w-md text-sm leading-7 text-[var(--chronos-muted)]">
                        Olive-toned cinematic interface for publishing, scheduling, messaging, and platform operations.
                    </p>
                </div>
            </footer>
        </main>
    );
}

function PageSection({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <section id={id} className="relative z-10 px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-28 lg:px-14 xl:px-20">
            <div className="mx-auto max-w-[1500px]">{children}</div>
        </section>
    );
}

function CinematicFrame() {
    return (
        <div className="relative mx-auto w-full max-w-[620px] animate-chronos-float lg:max-w-none">
            <div className="absolute -inset-6 rounded-full bg-[var(--chronos-olive)]/10 blur-[70px] sm:-inset-10 sm:blur-[90px]" />

            <div className="relative overflow-hidden rounded-[26px] border border-[var(--chronos-line-strong)] bg-[var(--chronos-sheet)]/72 p-3 shadow-[0_30px_140px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:rounded-[34px] sm:p-4">
                <div className="overflow-hidden rounded-[20px] border border-[var(--chronos-line)] bg-[var(--chronos-canvas)]/70 sm:rounded-[26px]">
                    <div className="flex flex-col gap-3 border-b border-[var(--chronos-line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--chronos-ink)]">Operations Signal</p>
                            <p className="mt-1 text-xs text-[var(--chronos-muted)]">
                                Live publishing and messaging layer
                            </p>
                        </div>

                        <span className="chronos-pill w-fit border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]">
                            Online
                        </span>
                    </div>

                    <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="min-w-0 xl:border-r xl:border-[var(--chronos-line)]">
                            <div className="grid grid-cols-1 border-b border-[var(--chronos-line)] sm:grid-cols-3">
                                <SignalMetric icon={Clock} label="Pending" value="18" />
                                <SignalMetric icon={CheckCircle2} label="Posted" value="126" />
                                <SignalMetric icon={Gauge} label="Health" value="97%" />
                            </div>

                            <div>
                                {signalRows.map((row) => (
                                    <div
                                        key={row.label}
                                        className="grid gap-4 border-b border-[var(--chronos-line)] px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5 sm:py-5"
                                    >
                                        <div className="flex min-w-0 items-center gap-4">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-muted)] sm:h-11 sm:w-11">
                                                <RadioTower className="h-4 w-4" strokeWidth={1.75} />
                                            </span>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-[var(--chronos-ink)]">
                                                    {row.label}
                                                </p>
                                                <p className="mt-1 truncate text-xs text-[var(--chronos-muted)]">
                                                    {row.channel}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-left sm:text-right">
                                            <p className="text-sm text-[var(--chronos-body)]">{row.status}</p>
                                            <p className="mt-1 text-xs text-[var(--chronos-muted)]">{row.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 sm:p-5">
                            <div className="relative mx-auto flex aspect-square max-w-[220px] items-center justify-center rounded-full border border-[var(--chronos-line)]">
                                <div className="absolute inset-4 rounded-full border border-[var(--chronos-line)] animate-chronos-orbit" />
                                <div className="flex h-[74%] w-[74%] items-center justify-center rounded-full border border-[var(--chronos-line-strong)]">
                                    <div className="flex h-[52%] w-[52%] items-center justify-center rounded-full border border-[var(--chronos-olive)] bg-[var(--chronos-olive)]/10 animate-chronos-pulse">
                                        <Orbit
                                            className="h-7 w-7 text-[var(--chronos-olive-soft)] sm:h-8 sm:w-8"
                                            strokeWidth={1.35}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <MiniSignal label="Twitter / X" value="86%" />
                                <MiniSignal label="WhatsApp" value="94%" />
                                <MiniSignal label="Threads" value="72%" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MarqueeBand() {
    const items = [
        "AI Caption Generator",
        "Grammar Improvement",
        "Tone Rewrite",
        "Hashtag Generator",
        "Post Score",
        "Event Suggestions",
        "Publishing Calendar",
        "WhatsApp Templates",
    ];

    return (
        <div className="relative z-10 w-full overflow-hidden border-y border-[var(--chronos-line)] py-4 sm:py-5">
            <div className="flex w-max gap-8 animate-chronos-marquee sm:gap-10">
                {[...items, ...items].map((item, index) => (
                    <span
                        key={`${item}-${index}`}
                        className="chronos-label whitespace-nowrap text-[var(--chronos-olive-soft)]"
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}

function SignalMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="border-b border-[var(--chronos-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:p-5 sm:last:border-r-0">
            <Icon className="mb-5 h-5 w-5 text-[var(--chronos-olive)] sm:mb-7" strokeWidth={1.75} />
            <p className="text-3xl font-extralight tracking-[-0.08em] text-[var(--chronos-ink)] md:text-4xl">{value}</p>
            <p className="chronos-label mt-3">{label}</p>
        </div>
    );
}

function MiniSignal({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-xs text-[var(--chronos-muted)]">{label}</span>
                <span className="text-xs text-[var(--chronos-body)]">{value}</span>
            </div>

            <div className="h-px bg-[var(--chronos-line)]">
                <div className="h-px bg-[var(--chronos-olive)]" style={{ width: value }} />
            </div>
        </div>
    );
}

function SectionHeader({ label, title, text }: { label: string; title: string; text: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0"
        >
            <div className="chronos-line mb-8" />
            <p className="chronos-label">{label}</p>
            <h2 className="mt-5 max-w-5xl text-[clamp(2.15rem,10vw,5.5rem)] font-extralight leading-[0.94] tracking-[-0.08em] text-[var(--chronos-ink)] sm:text-[clamp(2.65rem,6vw,5.5rem)]">
                {title}
            </h2>
            <p className="chronos-subtitle mt-6 max-w-2xl">{text}</p>
        </motion.div>
    );
}

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
            className="chronos-row group grid min-w-0 gap-6 py-8 sm:gap-8 md:grid-cols-[82px_minmax(0,1fr)_48px] md:items-center lg:grid-cols-[100px_minmax(0,1fr)_72px]"
        >
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--chronos-olive)]">{feature.index}</p>

            <div className="min-w-0">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)] transition duration-700 group-hover:border-[var(--chronos-olive)] group-hover:text-[var(--chronos-olive-soft)]">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>

                <h3 className="max-w-4xl text-2xl font-light tracking-[-0.055em] text-[var(--chronos-ink)] sm:text-3xl md:text-4xl">
                    {feature.title}
                </h3>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--chronos-muted)]">{feature.text}</p>
            </div>

            <ArrowUpRight
                className="hidden h-6 w-6 justify-self-end text-[var(--chronos-muted)] transition duration-700 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--chronos-olive)] md:block"
                strokeWidth={1.5}
            />
        </motion.div>
    );
}

function CapabilityRow({ capability, index }: { capability: Capability; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: index * 0.055 }}
            className="chronos-row grid min-w-0 gap-3 py-6 md:grid-cols-[200px_minmax(0,1fr)]"
        >
            <p className="text-lg font-light tracking-[-0.05em] text-[var(--chronos-ink)]">{capability.title}</p>
            <p className="text-sm leading-7 text-[var(--chronos-muted)]">{capability.text}</p>
        </motion.div>
    );
}

function WorkflowBlock({ item, index }: { item: WorkflowItem; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.09 }}
            className="min-w-0 border-t border-[var(--chronos-line)] pt-8"
        >
            <p className="chronos-label text-[var(--chronos-olive)]">{item.number}</p>

            <h3 className="mt-8 text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)]">{item.title}</h3>

            <p className="mt-5 text-sm leading-7 text-[var(--chronos-muted)]">{item.text}</p>
        </motion.div>
    );
}

function PlatformRow({ platform, index }: { platform: PlatformItem; index: number }) {
    const Icon = platform.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
            className="chronos-row group grid min-w-0 gap-5 py-8 md:grid-cols-[56px_minmax(0,1fr)_180px] md:items-center lg:grid-cols-[64px_minmax(0,1fr)_220px]"
        >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)] transition duration-700 group-hover:border-[var(--chronos-olive)] group-hover:text-[var(--chronos-olive-soft)] sm:h-14 sm:w-14">
                <Icon className="h-5 w-5" />
            </span>

            <div className="min-w-0">
                <h3 className="text-2xl font-light tracking-[-0.06em] text-[var(--chronos-ink)] sm:text-3xl md:text-4xl">
                    {platform.name}
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--chronos-muted)]">{platform.text}</p>
            </div>

            <p className="chronos-pill w-fit border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)] md:justify-self-end">
                {platform.signal}
            </p>
        </motion.div>
    );
}

function SecurityLine({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="chronos-row grid min-w-0 gap-5 py-7 sm:grid-cols-[52px_minmax(0,1fr)]"
        >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>

            <div className="min-w-0">
                <h3 className="text-xl font-light tracking-[-0.05em] text-[var(--chronos-ink)]">{title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--chronos-muted)]">{text}</p>
            </div>
        </motion.div>
    );
}
