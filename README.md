<div align="center">

# MIMICO

**AI-Powered Social Media Management Platform**

Social publishing with cinematic control.

[Live Demo](https://www.mimico.live) · [Report Bug](#) · [Request Feature](#)

</div>

---

## Overview

MIMICO is a centralized, AI-assisted workspace for creators, businesses, and teams to compose, refine, schedule, and publish content across multiple social platforms — including WhatsApp Business — from a single controlled dashboard.

Managing social media manually breaks down fast once more than one platform is involved: every channel has its own tone, character limits, and posting rhythm, and tracking what's queued, scheduled, or failed becomes a full-time job on its own. MIMICO solves this by combining platform integration, an AI content studio, and a visual publishing calendar into one guided workflow — from idea to delivery.

---

## Table of Contents

- [Key Features](#key-features)
- [AI / NLP Engine](#ai--nlp-engine)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [Publishing Workflow](#publishing-workflow)
- [Getting Started](#getting-started)
- [Security](#security)
- [Roadmap](#roadmap)
- [License](#license)

---

## Key Features

### Account & Publishing Management
- **Secure Authentication** — signup, login, logout, password reset, and JWT-based session handling
- **Social Account Connection** — OAuth-based linking for Twitter/X, Threads, Mastodon, and WhatsApp Business
- **Post Composer** — a focused editor for writing, selecting target accounts, and previewing platform limits
- **Publishing Calendar** — visual scheduling with queued, scheduled, posted, and failed post tracking
- **Search, Filters & Management** — full post lifecycle management across table and calendar views

### AI Content Studio
- **AI Caption Generator** — converts a rough idea into a ready-to-publish caption
- **Grammar Improvement** — corrects spelling, punctuation, and sentence flow while preserving intent
- **Tone Rewrite** — reframes content as professional, friendly, casual, confident, persuasive, funny, or simple
- **Hashtag Generator** — produces relevant, non-spammy hashtag sets within platform limits
- **Platform-Specific Rewrite** — adapts style and length per selected platform
- **Post Score** — evaluates clarity, length, readability, and platform fit before publishing
- **Event-Based Suggestions** — timely content ideas driven by dates, topics, and campaigns

### WhatsApp Business
- Templates, contacts, and scheduled message delivery
- Delivery logs and message status tracking alongside social workflows

### Experience
- Fully responsive across desktop, tablet, and mobile
- Light and dark theme support
- Smooth, animated micro-interactions for a polished SaaS feel

---

## AI / NLP Engine

MIMICO's AI layer receives structured input — an idea or draft, tone preference, target platforms, and event/date context — and returns a structured, editable response inserted directly into the composer. The user always stays in the loop; nothing is auto-published without review.

```
User Draft / Idea
      │
      ▼
AI Request Layer  ───▶  validation, rate limits, action type
      │
      ▼
Gemini / NLP Engine  ───▶  caption, grammar, tone, hashtags, event suggestions
      │
      ▼
Structured Result  ───▶  JSON response returned to composer
      │
      ▼
Human Review  ───▶  accept, edit, schedule, or publish
```

**Capabilities implemented:**
- Caption generation from short-form ideas
- Grammar correction with intent preservation
- Tone transformation across seven styles
- Hashtag recommendation with relevance filtering
- Platform-aware content rewriting and length adaptation
- Engagement/readiness scoring (clarity, length, CTA quality, hashtag relevance)
- Event and date-driven content suggestions

**Planned:**
- Sentiment analysis
- Trend detection and audience targeting
- Auto-reply suggestions
- Content performance prediction
- Brand voice memory across campaigns
- AI-generated weekly/monthly content calendars

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4, MUI, Lucide, React Icons |
| **Animation** | Framer Motion, Three.js |
| **Backend** | Next.js API Routes / Node.js runtime |
| **Database / ORM** | Prisma 7 with PostgreSQL / Supabase PostgreSQL |
| **AI / NLP** | `@google/genai` — Gemini 2.5 Flash |
| **Authentication** | JWT (cookie-based), bcrypt, OAuth |
| **Validation** | Zod |
| **Scheduling** | Cron routes / node-cron |
| **Deployment** | Vercel / Render / Supabase |

---

## System Architecture

MIMICO follows a layered web application architecture. The Next.js frontend renders the dashboard, composer, and calendar; API routes handle authentication, OAuth callbacks, AI requests, scheduling, and publishing actions; Prisma connects the service layer to PostgreSQL (or Supabase). External integrations cover social platform APIs, OAuth providers, and the AI/NLP engine.

```
User Interface
      │
      ▼
Next.js Frontend
      │
      ▼
API Routes
      │
      ▼
Service Layer
      │
      ├──▶ PostgreSQL / Supabase
      ├──▶ OAuth Providers
      ├──▶ Gemini AI / NLP
      ├──▶ Cron Scheduler
      └──▶ Social Platform APIs
```

---

## Database Design

Core entities are modeled in Prisma with relational integrity, indexing, and cascade rules for reliable account ownership and efficient retrieval.

| Entity | Purpose |
|---|---|
| **Users** | Application users, credentials/OAuth details, password reset data, ownership relations |
| **Social Accounts** | Platform identity, access/refresh tokens, expiry, status, business metadata |
| **Scheduled Posts** | Content, schedule time, status, retry count, error/failure metadata |
| **WhatsApp Contacts** | Contact records tied to a user and connected social account |
| **WhatsApp Scheduled Messages** | Template, recipient, schedule time, delivery status, Meta message ID |
| **WhatsApp Message Log** | Message direction, payload, response, status code, success/error state |

```
User ──< SocialAccount ──< ScheduledPost
  │            │
  │            └──< WhatsAppScheduledMessage ──< WhatsAppMessageLog
  └──< WhatsAppContact
```

Sensitive tokens and identifiers are isolated in controlled entities and protected via environment configuration rather than hardcoded values.

---

## Publishing Workflow

| Step | Action |
|---|---|
| 1 | **Connect** — link a supported social account via OAuth |
| 2 | **Compose** — write manually or generate a caption with AI |
| 3 | **Improve** — apply grammar, tone, hashtags, platform rewrite, or scoring |
| 4 | **Select Platforms** — choose target accounts, verify character limits |
| 5 | **Review** — check clarity, engagement, and publish-readiness |
| 6 | **Publish or Schedule** — post immediately or queue for a future date/time |
| 7 | **Manage** — track, search, filter, or delete posts from the calendar/table view |

---

## Getting Started

### Prerequisites
- Node.js (LTS)
- PostgreSQL instance (local or Supabase-hosted)
- API credentials for each platform integration (Twitter/X, Threads, Mastodon, WhatsApp Business)
- Google GenAI (Gemini) API key

### Installation

```bash
git clone https://github.com/RHamzaZulfiqarJ/Mimico.git
cd Mimico
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mimico"

# Auth
JWT_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# OAuth — per platform
TWITTER_CLIENT_ID=""
TWITTER_CLIENT_SECRET=""
THREADS_CLIENT_ID=""
THREADS_CLIENT_SECRET=""
MASTODON_CLIENT_ID=""
MASTODON_CLIENT_SECRET=""
WHATSAPP_BUSINESS_API_KEY=""

# AI
GEMINI_API_KEY=""
```

### Database Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Security

- Password hashing via **bcrypt**, session handling via **JWT cookies**
- **OAuth**-based account connections with per-platform token isolation
- **Zod** schema validation on all AI and platform-facing requests
- Session-protected API routes for all sensitive actions
- Controlled access/refresh token handling with expiry tracking
- Environment-based secret management for all API keys and credentials
- Structured error handling for unauthorized access, invalid input, and third-party API failures

---

## Advantages & Limitations

**Advantages**
- Centralized control across all connected accounts
- Meaningful reduction in manual writing and publishing effort
- AI-assisted content improves consistency and quality
- Scalable foundation for a full social publishing product

**Limitations**
- Subject to third-party platform API rate limits and approval requirements
- Dependent on external AI and social platform availability
- AI-generated content requires human review before publishing
- Some integrations may require business verification

---

## Roadmap

- [ ] Analytics dashboard with post performance charts
- [ ] AI-generated content calendar (weekly/monthly planning)
- [ ] Team collaboration, roles, and approval workflows
- [ ] Sentiment analysis and trend detection
- [ ] Auto-reply suggestions for comments and DMs
- [ ] Audience targeting and competitor analysis
- [ ] Additional platform integrations (LinkedIn, Instagram, Bluesky)
- [ ] Native mobile app

---

## License

Specify your license here (e.g., MIT).

---

<div align="center">

Built by **Hamza Zulfiqar** and **Zafra Noor Ejaz**

</div>
