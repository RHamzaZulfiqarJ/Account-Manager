"use client";

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    Copy,
    Hash,
    Loader2,
    Send,
    Sparkles,
    Wand2,
    X,
} from "lucide-react";
import { PLATFORMS } from "@/libs/platform";
import { PLATFORM_RULES } from "@/libs/platform-rules";

const SOCIAL_PLATFORMS = ["twitter", "mastodon", "threads"] as const;

type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

type SocialAccount = {
    id: string;
    platform: SocialPlatform;
    accountUsername: string;
};

type ComposeModalProps = {
    selectedAccounts: string[];
    setSelectedAccounts: (accounts: string[] | ((prev: string[]) => string[])) => void;
    isOpen: boolean;
    onClose: () => void;
    defaultPlatform?: SocialPlatform | "all";
};

type AiLoading = "caption" | "grammar" | "tone" | "hashtags" | "events" | null;
type Tone = "professional" | "friendly" | "casual" | "confident" | "persuasive" | "funny" | "simple";

type AiResult =
    | {
          type: "caption";
          title: string;
          text: string;
          characters: number;
          limit: number;
          platform?: SocialPlatform;
      }
    | {
          type: "grammar";
          title: string;
          text: string;
          characters: number;
          limit: number;
          changes: string[];
      }
    | {
          type: "tone";
          title: string;
          text: string;
          characters: number;
          limit: number;
          changes: string[];
      }
    | {
          type: "hashtags";
          title: string;
          text: string;
          characters: number;
          limit: number;
      }
    | {
          type: "event";
          title: string;
          text: string;
          characters: number;
          limit: number;
      };

const tones: Tone[] = ["professional", "friendly", "casual", "confident", "persuasive", "funny", "simple"];

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong";
};

const getMinScheduleDateTime = () => {
    const date = new Date(Date.now() + 60_000);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);

    return local.toISOString().slice(0, 16);
};

const isSocialPlatform = (platform: string): platform is SocialPlatform => {
    return SOCIAL_PLATFORMS.includes(platform as SocialPlatform);
};

export default function ComposeModal({
    selectedAccounts,
    setSelectedAccounts,
    isOpen,
    onClose,
    defaultPlatform = "all",
}: ComposeModalProps) {
    const [content, setContent] = useState("");
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [scheduleAt, setScheduleAt] = useState("");
    const [showScheduler, setShowScheduler] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiIdea, setAiIdea] = useState("");
    const [aiTone, setAiTone] = useState<Tone>("professional");
    const [aiLoading, setAiLoading] = useState<AiLoading>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiResults, setAiResults] = useState<AiResult[]>([]);

    const filteredAccounts = useMemo(() => {
        if (defaultPlatform === "all") {
            return accounts;
        }

        return accounts.filter((account) => account.platform === defaultPlatform);
    }, [accounts, defaultPlatform]);

    const selectedAccountObjects = useMemo(() => {
        return accounts.filter((account) => selectedAccounts.includes(account.id));
    }, [accounts, selectedAccounts]);

    const selectedPlatforms = useMemo(() => {
        return Array.from(new Set(selectedAccountObjects.map((account) => account.platform)));
    }, [selectedAccountObjects]);

    const aiTargetPlatforms = useMemo(() => {
        if (selectedPlatforms.length > 0) {
            return selectedPlatforms;
        }

        if (defaultPlatform !== "all") {
            return [defaultPlatform];
        }

        return [...SOCIAL_PLATFORMS];
    }, [defaultPlatform, selectedPlatforms]);

    const activeLimit = useMemo(() => {
        if (selectedPlatforms.length === 0) {
            return 500;
        }

        return Math.min(...selectedPlatforms.map((platform) => PLATFORM_RULES[platform]?.maxLength || 500));
    }, [selectedPlatforms]);

    const minScheduleDateTime = useMemo(() => getMinScheduleDateTime(), [isOpen]);
    const remainingCharacters = activeLimit - content.length;
    const isContentTooLong = remainingCharacters < 0;

    const selectedLabel = useMemo(() => {
        if (selectedAccountObjects.length === 0) {
            return "No account selected";
        }

        return `${selectedAccountObjects.length} selected`;
    }, [selectedAccountObjects]);

    const clearAiState = () => {
        setAiError(null);
        setAiResults([]);
    };

    const loadAccounts = async () => {
        try {
            setLoadingAccounts(true);
            setError(null);

            const res = await fetch("/api/accounts");

            if (!res.ok) {
                throw new Error("Failed to load accounts");
            }

            const data = await res.json();

            const socialOnly = (data.accounts || []).filter((account: SocialAccount) => {
                return isSocialPlatform(account.platform);
            });

            setAccounts(socialOnly);
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoadingAccounts(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadAccounts();
            setError(null);
            clearAiState();
        }
    }, [isOpen]);

    const toggleAccount = (id: string) => {
        setError(null);

        setSelectedAccounts((previous) => {
            if (previous.includes(id)) {
                return previous.filter((accountId) => accountId !== id);
            }

            return [...previous, id];
        });
    };

    const resetForm = () => {
        setContent("");
        setScheduleAt("");
        setShowScheduler(false);
        setSelectedAccounts([]);
        setError(null);
        setAiIdea("");
        setAiTone("professional");
        clearAiState();
    };

    const validatePost = (requiresSchedule: boolean) => {
        if (!content.trim()) {
            throw new Error("Post content is required");
        }

        if (selectedAccounts.length === 0) {
            throw new Error("Select at least one account");
        }

        if (isContentTooLong) {
            throw new Error(`Post is too long. Limit is ${activeLimit} characters.`);
        }

        if (requiresSchedule && !scheduleAt) {
            throw new Error("Select schedule date and time");
        }

        if (requiresSchedule && new Date(scheduleAt).getTime() <= Date.now() + 60_000) {
            throw new Error("Schedule time must be at least 1 minute in the future");
        }
    };

    const createPost = async (scheduledAt: string | null) => {
        const res = await fetch("/api/posts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: content.trim(),
                accountIds: selectedAccounts,
                scheduledAt,
            }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data?.error || "Failed to create post");
        }

        return data;
    };

    const requestAi = async (payload: Record<string, unknown>) => {
        const res = await fetch("/api/ai/compose", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data?.error || "AI request failed");
        }

        return data;
    };

    const handleGenerateCaption = async () => {
        try {
            const sourceText = aiIdea.trim() || content.trim();

            if (!sourceText) {
                setAiError("Write an idea or post content first");
                return;
            }

            setAiLoading("caption");
            clearAiState();

            const data = await requestAi({
                action: "caption",
                idea: sourceText,
                platforms: aiTargetPlatforms,
            });

            const results: AiResult[] = (data.suggestions || []).map(
                (suggestion: {
                    platform: SocialPlatform;
                    label: string;
                    caption: string;
                    characters: number;
                    limit: number;
                }) => ({
                    type: "caption",
                    title: suggestion.label,
                    text: suggestion.caption,
                    characters: suggestion.characters,
                    limit: suggestion.limit,
                    platform: suggestion.platform,
                }),
            );

            setAiResults(results);
        } catch (error) {
            setAiError(getErrorMessage(error));
        } finally {
            setAiLoading(null);
        }
    };

    const handleImproveGrammar = async () => {
        try {
            if (!content.trim()) {
                setAiError("Write post content first");
                return;
            }

            setAiLoading("grammar");
            clearAiState();

            const data = await requestAi({
                action: "grammar",
                content: content.trim(),
                platforms: aiTargetPlatforms,
            });

            if (!data.improvement) {
                throw new Error("AI could not improve this post");
            }

            setAiResults([
                {
                    type: "grammar",
                    title: "Improved Version",
                    text: data.improvement.text,
                    characters: data.improvement.characters,
                    limit: data.improvement.limit,
                    changes: data.improvement.changes || [],
                },
            ]);
        } catch (error) {
            setAiError(getErrorMessage(error));
        } finally {
            setAiLoading(null);
        }
    };

    const handleRewriteTone = async () => {
        try {
            if (!content.trim()) {
                setAiError("Write post content first");
                return;
            }

            setAiLoading("tone");
            clearAiState();

            const data = await requestAi({
                action: "tone",
                content: content.trim(),
                tone: aiTone,
                platforms: aiTargetPlatforms,
            });

            if (!data.toneRewrite) {
                throw new Error("AI could not rewrite this post");
            }

            setAiResults([
                {
                    type: "tone",
                    title: `${data.toneRewrite.label} Rewrite`,
                    text: data.toneRewrite.text,
                    characters: data.toneRewrite.characters,
                    limit: data.toneRewrite.limit,
                    changes: data.toneRewrite.changes || [],
                },
            ]);
        } catch (error) {
            setAiError(getErrorMessage(error));
        } finally {
            setAiLoading(null);
        }
    };

    const handleGenerateHashtags = async () => {
        try {
            const sourceText = content.trim() || aiIdea.trim();

            if (!sourceText) {
                setAiError("Write post content or an idea first");
                return;
            }

            setAiLoading("hashtags");
            clearAiState();

            const data = await requestAi({
                action: "hashtags",
                content: sourceText,
                platforms: aiTargetPlatforms,
            });

            if (!data.hashtags) {
                throw new Error("AI could not generate hashtags");
            }

            setAiResults([
                {
                    type: "hashtags",
                    title: "Suggested Hashtags",
                    text: data.hashtags.text,
                    characters: data.hashtags.characters,
                    limit: data.hashtags.limit,
                },
            ]);
        } catch (error) {
            setAiError(getErrorMessage(error));
        } finally {
            setAiLoading(null);
        }
    };

    const handleEventSuggestions = async () => {
        try {
            setAiLoading("events");
            clearAiState();

            const data = await requestAi({
                action: "events",
                content: content.trim(),
                idea: aiIdea.trim(),
                event: aiIdea.trim(),
                date: new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                platforms: aiTargetPlatforms,
            });

            if (!data.eventSuggestions) {
                throw new Error("AI could not generate event suggestions");
            }

            setAiResults(
                data.eventSuggestions.map(
                    (suggestion: { title: string; caption: string; characters: number; limit: number }) => ({
                        type: "event",
                        title: suggestion.title,
                        text: suggestion.caption,
                        characters: suggestion.characters,
                        limit: suggestion.limit,
                    }),
                ),
            );
        } catch (error) {
            setAiError(getErrorMessage(error));
        } finally {
            setAiLoading(null);
        }
    };

    const applyAiText = (text: string) => {
        setContent(text);
        setAiError(null);
        setError(null);
    };

    const appendHashtags = (text: string) => {
        const cleanText = text.trim();

        if (!cleanText) {
            return;
        }

        setContent((previous) => {
            const current = previous.trim();

            if (!current) {
                return cleanText;
            }

            if (current.includes(cleanText)) {
                return current;
            }

            return `${current}\n\n${cleanText}`;
        });

        setAiError(null);
        setError(null);
    };

    const copyAiText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setAiError(null);
        } catch {
            setAiError("Could not copy text");
        }
    };

    const handlePostNow = async () => {
        try {
            setLoading(true);
            setError(null);

            validatePost(false);
            await createPost(null);

            resetForm();
            onClose();
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async () => {
        try {
            setLoading(true);
            setError(null);

            validatePost(true);
            await createPost(new Date(scheduleAt).toISOString());

            resetForm();
            onClose();
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const closeSafely = () => {
        if (loading) {
            return;
        }

        resetForm();
        onClose();
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
                            className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[var(--chronos-line-strong)] bg-[var(--chronos-sheet)]/95 text-[var(--chronos-ink)] shadow-[0_30px_140px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
                        >
                            <div className="flex items-center justify-between gap-4 border-b border-[var(--chronos-line)] px-5 py-4">
                                <div>
                                    <p className="chronos-label">Composer</p>
                                    <h2 className="mt-1 text-2xl font-extralight tracking-[-0.06em] text-[var(--chronos-ink)]">
                                        Compose post
                                    </h2>
                                    <p className="mt-1 text-xs text-[var(--chronos-muted)]">{selectedLabel}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeSafely}
                                    disabled={loading}
                                    className="chronos-button w-15 px-0"
                                >
                                    <X className="h-4 w-4" strokeWidth={1.75} />
                                </button>
                            </div>

                            <div className="custom-scrollbar max-h-[calc(92vh-82px)] overflow-y-auto p-4 sm:p-5">
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                                    <div className="space-y-4">
                                        {error && <AlertBox type="error">{error}</AlertBox>}

                                        <Panel
                                            title="Post content"
                                            right={`${content.length}/${activeLimit}`}
                                            icon={<Send className="h-4 w-4" strokeWidth={1.75} />}
                                        >
                                            <textarea
                                                value={content}
                                                onChange={(event) => {
                                                    setContent(event.target.value);
                                                    setError(null);
                                                }}
                                                placeholder="Write your post..."
                                                className="h-48 w-full resize-none p-4 text-sm leading-7 sm:h-56"
                                            />

                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--chronos-muted)]">
                                                <span>Limit changes based on selected accounts.</span>
                                                <span
                                                    className={isContentTooLong ? "text-[var(--chronos-danger)]" : ""}
                                                >
                                                    {remainingCharacters} characters left
                                                </span>
                                            </div>
                                        </Panel>

                                        <Panel
                                            title="AI tools"
                                            icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
                                            right={aiLoading ? "Working" : "Ready"}
                                        >
                                            <div className="space-y-3">
                                                <input
                                                    value={aiIdea}
                                                    onChange={(event) => {
                                                        setAiIdea(event.target.value);
                                                        setAiError(null);
                                                    }}
                                                    placeholder="Optional idea, event, campaign, or context..."
                                                    className="h-11 w-full px-4 text-sm"
                                                />

                                                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                                                    <select
                                                        value={aiTone}
                                                        onChange={(event) => setAiTone(event.target.value as Tone)}
                                                        disabled={aiLoading !== null}
                                                        className="h-11 w-full px-4 text-sm capitalize"
                                                    >
                                                        {tones.map((tone) => (
                                                            <option key={tone} value={tone}>
                                                                {tone}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <AiButton
                                                        active={aiLoading === "tone"}
                                                        disabled={aiLoading !== null}
                                                        onClick={handleRewriteTone}
                                                        icon={Wand2}
                                                        label="Tone"
                                                    />
                                                    <AiButton
                                                        active={aiLoading === "grammar"}
                                                        disabled={aiLoading !== null}
                                                        onClick={handleImproveGrammar}
                                                        icon={Wand2}
                                                        label="Grammar"
                                                    />
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <AiButton
                                                        active={aiLoading === "caption"}
                                                        disabled={aiLoading !== null}
                                                        onClick={handleGenerateCaption}
                                                        icon={Sparkles}
                                                        label="Caption"
                                                    />
                                                    <AiButton
                                                        active={aiLoading === "hashtags"}
                                                        disabled={aiLoading !== null}
                                                        onClick={handleGenerateHashtags}
                                                        icon={Hash}
                                                        label="Hashtags"
                                                    />
                                                    <AiButton
                                                        active={aiLoading === "events"}
                                                        disabled={aiLoading !== null}
                                                        onClick={handleEventSuggestions}
                                                        icon={CalendarDays}
                                                        label="Events"
                                                    />
                                                </div>
                                            </div>

                                            {aiError && (
                                                <div className="mt-4">
                                                    <AlertBox type="error">{aiError}</AlertBox>
                                                </div>
                                            )}

                                            {aiResults.length > 0 && (
                                                <div className="mt-4 space-y-3">
                                                    {aiResults.map((result, index) => (
                                                        <AiResultCard
                                                            key={`${result.title}-${index}`}
                                                            result={result}
                                                            onUse={() => {
                                                                if (result.type === "hashtags") {
                                                                    appendHashtags(result.text);
                                                                    return;
                                                                }

                                                                applyAiText(result.text);
                                                            }}
                                                            onCopy={() => copyAiText(result.text)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </Panel>
                                    </div>

                                    <aside className="space-y-4">
                                        <Panel title="Accounts" right={String(selectedAccounts.length)}>
                                            {loadingAccounts ? (
                                                <div className="flex items-center justify-center p-8">
                                                    <Loader2
                                                        className="h-5 w-5 animate-spin text-[var(--chronos-olive)]"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                            ) : filteredAccounts.length === 0 ? (
                                                <div className="rounded-[20px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-4 text-sm text-[var(--chronos-muted)]">
                                                    No social account found.
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {filteredAccounts.map((account) => (
                                                        <AccountButton
                                                            key={account.id}
                                                            account={account}
                                                            selected={selectedAccounts.includes(account.id)}
                                                            onClick={() => toggleAccount(account.id)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </Panel>

                                        <Panel title="Schedule">
                                            <button
                                                type="button"
                                                disabled={loading || isContentTooLong}
                                                onClick={() => {
                                                    setShowScheduler((current) => !current);
                                                    setError(null);
                                                }}
                                                className="chronos-button chronos-button-soft w-full"
                                            >
                                                <Calendar className="h-4 w-4" strokeWidth={1.75} />
                                                {showScheduler ? "Hide schedule" : "Schedule"}
                                            </button>

                                            {showScheduler && (
                                                <input
                                                    type="datetime-local"
                                                    min={minScheduleDateTime}
                                                    value={scheduleAt}
                                                    onChange={(event) => {
                                                        setScheduleAt(event.target.value);
                                                        setError(null);
                                                    }}
                                                    className="mt-3 h-11 w-full px-4 text-sm"
                                                />
                                            )}

                                            <button
                                                type="button"
                                                disabled={loading || isContentTooLong || (showScheduler && !scheduleAt)}
                                                onClick={showScheduler ? handleSchedule : handlePostNow}
                                                className="chronos-button mt-3 w-full"
                                            >
                                                {loading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                                ) : showScheduler ? (
                                                    <Calendar className="h-4 w-4" strokeWidth={1.75} />
                                                ) : (
                                                    <Send className="h-4 w-4" strokeWidth={1.75} />
                                                )}
                                                {showScheduler ? "Confirm schedule" : "Post now"}
                                            </button>

                                            <div className="mt-4 flex items-start gap-3 rounded-[20px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-3">
                                                <Clock
                                                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chronos-olive)]"
                                                    strokeWidth={1.75}
                                                />
                                                <p className="text-xs leading-6 text-[var(--chronos-muted)]">
                                                    Post now publishes immediately. Schedule saves it for future
                                                    publishing.
                                                </p>
                                            </div>
                                        </Panel>
                                    </aside>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

function Panel({
    title,
    right,
    icon,
    children,
}: {
    title: string;
    right?: string;
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="chronos-panel overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--chronos-line)] px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--chronos-ink)]">
                    {icon}
                    {title}
                </h3>

                {right && <span className="chronos-pill">{right}</span>}
            </div>

            <div className="p-4">{children}</div>
        </section>
    );
}

function AlertBox({ type, children }: { type: "error" | "success"; children: ReactNode }) {
    return (
        <div
            className={`flex items-start gap-3 rounded-[20px] border p-4 text-sm ${
                type === "error"
                    ? "border-[var(--chronos-danger)]/40 bg-[var(--chronos-danger)]/5 text-[var(--chronos-danger)]"
                    : "border-[var(--chronos-olive)]/40 bg-[var(--chronos-olive)]/8 text-[var(--chronos-body)]"
            }`}
        >
            {type === "error" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            )}
            <span>{children}</span>
        </div>
    );
}

function AiButton({
    active,
    disabled,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    disabled: boolean;
    onClick: () => void;
    icon: ElementType;
    label: string;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="chronos-button chronos-button-soft w-full"
        >
            {active ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            ) : (
                <Icon className="h-4 w-4" strokeWidth={1.75} />
            )}
            {label}
        </button>
    );
}

function AccountButton({
    account,
    selected,
    onClick,
}: {
    account: SocialAccount;
    selected: boolean;
    onClick: () => void;
}) {
    const platform = PLATFORMS[account.platform];
    const Icon = platform?.icon || Send;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-[20px] border p-3 text-left transition ${
                selected
                    ? "border-[var(--chronos-olive)] bg-[var(--chronos-olive)]/10"
                    : "border-[var(--chronos-line)] bg-transparent hover:bg-[var(--chronos-olive)]/5"
            }`}
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--chronos-line-strong)] text-[var(--chronos-olive)]">
                <Icon className="h-4 w-4" />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--chronos-ink)]">
                    {platform?.name || account.platform}
                </span>
                <span className="mt-1 block truncate text-xs text-[var(--chronos-muted)]">
                    @{account.accountUsername}
                </span>
            </span>

            {selected && <CheckCircle2 className="h-4 w-4 text-[var(--chronos-olive)]" strokeWidth={1.75} />}
        </button>
    );
}

function AiResultCard({ result, onUse, onCopy }: { result: AiResult; onUse: () => void; onCopy: () => void }) {
    return (
        <div className="rounded-[20px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <span className="chronos-pill border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]">
                    {result.title}
                </span>

                <span className="text-xs text-[var(--chronos-muted)]">
                    {result.characters}/{result.limit}
                </span>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--chronos-muted)]">{result.text}</p>

            {"changes" in result && result.changes.length > 0 && (
                <div className="mt-3 rounded-[18px] border border-[var(--chronos-line)] p-3">
                    <p className="chronos-label mb-2">Changes</p>
                    <ul className="space-y-1 text-xs leading-5 text-[var(--chronos-muted)]">
                        {result.changes.map((change) => (
                            <li key={change}>• {change}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={onUse} className="chronos-button h-9">
                    {result.type === "hashtags" ? "Add" : "Use"}
                </button>

                <button type="button" onClick={onCopy} className="chronos-button chronos-button-soft h-9">
                    <Copy className="h-4 w-4" strokeWidth={1.75} />
                    Copy
                </button>
            </div>
        </div>
    );
}
