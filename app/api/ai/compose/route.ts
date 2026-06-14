export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { verifyToken } from "@/libs/jwt";
import { PLATFORM_RULES } from "@/libs/platform-rules";

const platformSchema = z.enum(["twitter", "mastodon", "threads"]);

const toneSchema = z.enum(["professional", "friendly", "casual", "confident", "persuasive", "funny", "simple"]);

const aiComposeSchema = z.object({
    action: z.enum(["caption", "grammar", "tone", "hashtags", "events"]),
    idea: z.string().trim().max(700).optional(),
    content: z.string().trim().max(3000).optional(),
    event: z.string().trim().max(300).optional(),
    date: z.string().trim().max(80).optional(),
    timezone: z.string().trim().max(80).optional(),
    tone: toneSchema.optional(),
    platforms: z.array(platformSchema).min(1).max(3),
});

type Platform = z.infer<typeof platformSchema>;
type Tone = z.infer<typeof toneSchema>;

const TONE_LABELS: Record<Tone, string> = {
    professional: "Professional",
    friendly: "Friendly",
    casual: "Casual",
    confident: "Confident",
    persuasive: "Persuasive",
    funny: "Funny",
    simple: "Simple",
};

const getGeminiKey = () => {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
};

const extractJson = (text: string): Record<string, unknown> => {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);

        if (!match) {
            throw new Error("AI returned an invalid response");
        }

        return JSON.parse(match[0]);
    }
};

const normalizeText = (value: unknown, maxLength: number) => {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maxLength);
};

const normalizeChanges = (value: unknown) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6);
};

const normalizeHashtags = (value: unknown) => {
    if (!Array.isArray(value)) {
        return [];
    }

    const tags = value
        .filter((item) => typeof item === "string")
        .map((item) => {
            const clean = item.trim().replace(/\s+/g, "");

            if (!clean) {
                return "";
            }

            const tag = clean.startsWith("#") ? clean : `#${clean}`;

            return tag.replace(/[^A-Za-z0-9_#]/g, "");
        })
        .filter((item) => item.length > 1 && item.length <= 40);

    return Array.from(new Set(tags)).slice(0, 10);
};

const joinHashtagsWithinLimit = (tags: string[], limit: number) => {
    const selected: string[] = [];

    for (const tag of tags) {
        const next = [...selected, tag].join(" ");

        if (next.length <= limit) {
            selected.push(tag);
        }
    }

    return selected.join(" ");
};

const getSmallestLimit = (platforms: Platform[]) => {
    return Math.min(...platforms.map((platform) => PLATFORM_RULES[platform].maxLength));
};

const getPlatformLines = (platforms: Platform[]) => {
    return platforms
        .map((platform) => {
            const rule = PLATFORM_RULES[platform];

            return `${rule.label}: maximum ${rule.maxLength} characters`;
        })
        .join("\n");
};

const createCaptionPrompt = (sourceText: string, platforms: Platform[]) => {
    return `You are an expert social media marketing copywriter with deep knowledge of world affairs, current events, culture, and audience psychology.
Craft powerful, ready-to-publish captions that feel human, timely, and platform-native.

Core directive:
- If the idea references real-world topics (countries, conflicts, news events, public figures, cultural moments), treat them in their real-world context — not as sports or entertainment unless explicitly stated.
- Write as a knowledgeable, engaging commentator — not a generic content generator.

Rules:
- Return only valid JSON.
- No markdown.
- Generate one caption for each requested platform, tailored to that platform's style and audience.
- Keep every caption inside its platform character limit.
- Make captions specific, non-generic, and genuinely engaging — avoid filler phrases.
- Include a clear call-to-action only when it naturally fits the context.
- Use emojis sparingly and only when they strengthen the message.
- Do not invent fake stats, false claims, prices, dates, or guarantees.
- Do not mention any app name or platform brand in the caption content.

Requested platforms:
${getPlatformLines(platforms)}

User idea or draft:
${sourceText}

JSON shape:
{"suggestions":[{"platform":"twitter","caption":"..."}]}`;
};

const createGrammarPrompt = (sourceText: string, platforms: Platform[]) => {
    return `You are an expert social media editor and marketing writer who understands how great writing drives engagement.
Polish the user's post by fixing spelling, grammar, punctuation, and sentence flow — while keeping its authentic voice intact.

Core directive:
- Preserve the author's intent and tone. Do not sanitize, water down, or make the post sound corporate.
- If the post references real-world topics (news, geopolitics, public figures, culture), preserve that context accurately — do not soften or redirect it.

Rules:
- Return only valid JSON.
- No markdown.
- Fix grammar, spelling, punctuation, and awkward phrasing without changing the core message.
- Do not add fake claims, prices, stats, dates, or guarantees.
- Do not add hashtags unless the original text already has hashtags.
- Do not inflate the post length unnecessarily.
- Keep the improved text within the strictest selected platform limit.
- The result must feel natural, authentic, and ready to publish immediately.
- Describe each change made in the "changes" array in plain English.

Requested platforms:
${getPlatformLines(platforms)}

Original post:
${sourceText}

JSON shape:
{"improvedText":"...","changes":["..."]}`;
};

const createTonePrompt = (sourceText: string, platforms: Platform[], tone: Tone) => {
    return `You are an expert social media marketing copywriter who specializes in voice, tone, and audience engagement.
Rewrite the user's post with a distinctly ${TONE_LABELS[tone]} tone — the shift should be immediately noticeable and feel authentic, not forced.

Core directive:
- If the post references real-world topics (geopolitics, news, public figures, cultural events), preserve that context accurately — the tone change should affect HOW it is said, not WHAT is being said.
- A ${TONE_LABELS[tone]} tone must feel genuinely ${TONE_LABELS[tone].toLowerCase()} — not just labelled that way.

Rules:
- Return only valid JSON.
- No markdown.
- Preserve the original meaning and factual content.
- The rewrite must be ready to publish as-is.
- Keep it within the strictest selected platform character limit.
- Do not add fake stats, false claims, prices, dates, or guarantees.
- Do not add hashtags unless the original already contains hashtags.
- Use emojis only if they genuinely complement the ${TONE_LABELS[tone].toLowerCase()} tone.
- Describe each meaningful change made in the "changes" array in plain English.
- Do not mention any app name or platform brand in the rewritten post.

Requested platforms:
${getPlatformLines(platforms)}

Original post:
${sourceText}

JSON shape:
{"tone":"${tone}","text":"...","changes":["..."]}`;
};

const createHashtagPrompt = (sourceText: string, platforms: Platform[]) => {
    const maxTags = platforms.includes("twitter") ? 4 : 8;

    return `You are an expert social media marketing strategist and hashtag analyst with up-to-date knowledge of trending topics, world events, geopolitics, and cultural conversations.
Generate the most effective and contextually relevant hashtags for the user's post.

Core directive:
- If the post references real-world topics (countries, conflicts, news events, public figures), generate hashtags that reflect those REAL-WORLD conversations — not sports or entertainment unless explicitly stated.
- Prioritize hashtags that are actually used by informed audiences discussing this topic on social media.

Rules:
- Return only valid JSON.
- No markdown.
- Generate a maximum of ${maxTags} hashtags — quality over quantity.
- Every hashtag must be directly relevant to the post's actual content and real-world context.
- Do not use spaces inside hashtags.
- Avoid spam hashtags like #followforfollow, #likeforlike, #viral, #trending, #explore unless they are genuinely the best fit.
- Prefer specific, topic-driven hashtags over vague generic ones.
- Do not invent fictional company names, campaign names, or event names.
- Hashtags must be clean, accurate, and ready to publish.

Requested platforms:
${getPlatformLines(platforms)}

Post or idea:
${sourceText}

JSON shape:
{"hashtags":["#ExampleOne","#ExampleTwo"]}`;
};

const createEventPrompt = (
    sourceText: string,
    platforms: Platform[],
    event: string,
    date: string,
    timezone: string,
) => {
    return `You are an expert social media marketing strategist with deep knowledge of world affairs, current events, geopolitics, culture, and trending news.
Generate 4 compelling, real-world-aware social media post suggestions based on the event or topic provided.

Core directive:
- When given a topic involving countries, regions, groups, or entities (e.g., "Iran vs USA"), treat it as a REAL-WORLD context — geopolitical tensions, conflicts, historical events, cultural dynamics, news stories — NOT as a sports match or game unless the user explicitly mentions sports.
- Research and reflect the actual real-world significance, background, and implications of the topic.
- Posts must feel like they were written by a knowledgeable human commentator, not a generic bot.

Rules:
- Return only valid JSON.
- No markdown.
- Generate exactly 4 suggestions.
- Each suggestion must be ready to publish as-is.
- Keep each caption within the strictest selected platform limit.
- Write in a voice that is informed, engaging, and appropriate for social media audiences.
- Use real-world facts, tensions, timelines, or sentiments tied to the event — do not genericize the topic.
- If no major event is identifiable, fall back to day-based ideas: Monday motivation, weekend reflections, Friday energy, topical awareness posts, etc.
- Do not invent fake stats, false claims, prices, fake discounts, or guarantees.
- Do not refer to any app name or platform brand in the post content.
- Use emojis sparingly and only when they genuinely enhance the message.
- Vary post angles across the 4 suggestions: e.g., awareness/commentary, historical context, audience question/poll angle, call-to-action or share-worthy angle.

Requested platforms:
${getPlatformLines(platforms)}

Current date:
${date || "Not provided"}

Timezone:
${timezone || "Not provided"}

Event or topic (treat as real-world context, not sports unless specified):
${event || "Not provided"}

Additional context or existing post draft:
${sourceText || "Not provided"}

JSON shape:
{"suggestions":[{"title":"...","caption":"..."}]}`;
};

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            verifyToken(token);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = aiComposeSchema.safeParse(await req.json());

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid AI request",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const apiKey = getGeminiKey();

        if (!apiKey) {
            return NextResponse.json({ error: "Missing Gemini API key" }, { status: 500 });
        }

        const { action, idea, content, platforms, tone, event, date, timezone } = parsed.data;

        const sourceText =
            action === "caption"
                ? idea || content
                : action === "hashtags"
                  ? content || idea
                  : action === "events"
                    ? content || idea || event || ""
                    : content;

        if (action !== "events" && !sourceText) {
            return NextResponse.json({ error: "Write some content first" }, { status: 400 });
        }

        if (action === "tone" && !tone) {
            return NextResponse.json({ error: "Select a tone first" }, { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey });
        const cleanSourceText = sourceText || "";

        const prompt =
            action === "caption"
                ? createCaptionPrompt(cleanSourceText, platforms)
                : action === "grammar"
                  ? createGrammarPrompt(cleanSourceText, platforms)
                  : action === "tone"
                    ? createTonePrompt(cleanSourceText, platforms, tone as Tone)
                    : action === "hashtags"
                      ? createHashtagPrompt(cleanSourceText, platforms)
                      : createEventPrompt(cleanSourceText, platforms, event || idea || "", date || "", timezone || "");

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature:
                    action === "caption"
                        ? 0.85
                        : action === "events"
                          ? 0.8
                          : action === "tone"
                            ? 0.65
                            : action === "hashtags"
                              ? 0.5
                              : 0.25,
                responseMimeType: "application/json",
            },
        });

        const json = extractJson(result.text || "");

        if (action === "caption") {
            const suggestions = Array.isArray(json.suggestions) ? json.suggestions : [];

            const cleanSuggestions = suggestions
                .map((item) => {
                    const data = item as Record<string, unknown>;
                    const platform = platformSchema.safeParse(data.platform);

                    if (!platform.success || !platforms.includes(platform.data)) {
                        return null;
                    }

                    const limit = PLATFORM_RULES[platform.data].maxLength;
                    const caption = normalizeText(data.caption, limit);

                    if (!caption) {
                        return null;
                    }

                    return {
                        platform: platform.data,
                        label: PLATFORM_RULES[platform.data].label,
                        caption,
                        characters: caption.length,
                        limit,
                    };
                })
                .filter(Boolean);

            if (cleanSuggestions.length === 0) {
                return NextResponse.json({ error: "AI could not generate a usable caption" }, { status: 502 });
            }

            return NextResponse.json({ suggestions: cleanSuggestions });
        }

        const limit = getSmallestLimit(platforms);

        if (action === "grammar") {
            const improvedText = normalizeText(json.improvedText, limit);

            if (!improvedText) {
                return NextResponse.json({ error: "AI could not improve this post" }, { status: 502 });
            }

            return NextResponse.json({
                improvement: {
                    text: improvedText,
                    characters: improvedText.length,
                    limit,
                    changes: normalizeChanges(json.changes),
                },
            });
        }

        if (action === "tone") {
            const rewrittenText = normalizeText(json.text, limit);

            if (!rewrittenText) {
                return NextResponse.json({ error: "AI could not rewrite this post" }, { status: 502 });
            }

            return NextResponse.json({
                toneRewrite: {
                    tone: tone as Tone,
                    label: TONE_LABELS[tone as Tone],
                    text: rewrittenText,
                    characters: rewrittenText.length,
                    limit,
                    changes: normalizeChanges(json.changes),
                },
            });
        }

        if (action === "events") {
            const suggestions = Array.isArray(json.suggestions) ? json.suggestions : [];

            const cleanSuggestions = suggestions
                .map((item) => {
                    const data = item as Record<string, unknown>;
                    const title = normalizeText(data.title, 80);
                    const caption = normalizeText(data.caption, limit);

                    if (!title || !caption) {
                        return null;
                    }

                    return {
                        title,
                        caption,
                        characters: caption.length,
                        limit,
                    };
                })
                .filter(Boolean)
                .slice(0, 4);

            if (cleanSuggestions.length === 0) {
                return NextResponse.json({ error: "AI could not generate event suggestions" }, { status: 502 });
            }

            return NextResponse.json({ eventSuggestions: cleanSuggestions });
        }

        const tags = normalizeHashtags(json.hashtags);
        const text = joinHashtagsWithinLimit(tags, limit);

        if (!text) {
            return NextResponse.json({ error: "AI could not generate hashtags" }, { status: 502 });
        }

        return NextResponse.json({
            hashtags: {
                tags: text.split(" ").filter(Boolean),
                text,
                characters: text.length,
                limit,
            },
        });
    } catch (error) {
        console.error("AI COMPOSE ERROR:", error);

        return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 });
    }
}
