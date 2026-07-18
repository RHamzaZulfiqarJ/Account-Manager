<div align="center">

# 🪄 MIMICO
### AI-Powered Social Media Management Platform

A centralized, AI-assisted workspace for creators, businesses, and teams to compose, refine, schedule, and publish content across multiple social platforms — including WhatsApp Business — from one controlled dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-orange)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4)
![Docker](https://img.shields.io/badge/Deployment-Vercel%20%2F%20Supabase-000000)

</div>

---

# 📖 Overview

MIMICO is a production-grade social media management platform built to eliminate the friction of manual, multi-platform publishing.

Every social channel has its own tone, character limits, and posting rhythm — managing that manually across accounts means constant tool-switching, rewritten captions, and lost track of what's queued, scheduled, or failed. MIMICO solves this by combining OAuth-based platform integration, an AI content studio powered by Gemini, and a visual publishing calendar into one guided workflow, from idea to delivery.

---

# ✨ Features

- 🔐 Secure Authentication (JWT + OAuth)
- 🔗 Multi-Platform Account Connection (Twitter/X, Threads, Mastodon, WhatsApp Business)
- ✍️ AI Caption Generator
- 📝 Grammar Improvement Engine
- 🎭 Tone Rewrite (7 styles)
- #️⃣ Hashtag Generator
- 🔄 Platform-Specific Content Rewriting
- 📊 AI Post Score (readiness & engagement scoring)
- 📅 Event-Based Content Suggestions
- 🗓️ Visual Publishing Calendar
- 💬 WhatsApp Business Templates & Delivery Logs
- 🌓 Light / Dark Theme
- 📱 Fully Responsive Dashboard

---

# 🏗️ System Architecture

```
                   +------------------+
                   |  Next.js Frontend|
                   +--------+---------+
                            |
                     REST API Requests
                            |
                            ▼
                   +------------------+
                   |    API Routes    |
                   +--------+---------+
                            |
       +--------------------+---------------------+
       |                    |                      |
       ▼                    ▼                      ▼
 PostgreSQL /         Gemini AI / NLP        Social Platform APIs
 Supabase (Prisma)      Engine                + OAuth Providers
       |                    |                      |
       +--------------------+----------------------+
                            |
                            ▼
                     Cron Scheduler
                (queued & scheduled posts)
```

---

# 🧠 AI / NLP Engine

MIMICO's AI layer receives structured input — an idea or draft, tone preference, target platforms, and event/date context — and returns a structured, editable response inserted directly into the composer. Nothing is auto-published without human review.

```
User Draft / Idea
        │
        ▼
AI Request Layer   → validation, rate limits, action type
        │
        ▼
Gemini 2.5 Flash    → caption, grammar, tone, hashtags, event suggestions
        │
        ▼
Structured Result   → JSON response returned to composer
        │
        ▼
Human Review        → accept, edit, schedule, or publish
```

**Implemented capabilities:**
- Caption generation from short-form ideas
- Grammar correction with intent preservation
- Tone transformation across seven styles
- Hashtag recommendation with relevance filtering
- Platform-aware content rewriting and length adaptation
- Engagement/readiness scoring (clarity, length, CTA quality, hashtag relevance)
- Event and date-driven content suggestions

**Planned:**
- Sentiment analysis
- Trend detection & audience targeting
- Auto-reply suggestions
- Content performance prediction
- Brand voice memory across campaigns
- AI-generated weekly/monthly content calendars

---

# 🛠️ Tech Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- MUI, Lucide, React Icons
- Framer Motion, Three.js

## Backend

- Next.js API Routes / Node.js Runtime
- Zod (schema validation)
- Cron routes / node-cron (scheduling)

## Database / ORM

- Prisma 7
- PostgreSQL / Supabase PostgreSQL

## AI / NLP

- `@google/genai`
- Gemini 2.5 Flash

## Authentication

- JWT (cookie-based sessions)
- bcrypt
- OAuth (Twitter/X, Threads, Mastodon, WhatsApp Business)

## Deployment

- Vercel / Render
- Supabase

---

# 🗄️ Database Design

```
User ──< SocialAccount ──< ScheduledPost
  │            │
  │            └──< WhatsAppScheduledMessage ──< WhatsAppMessageLog
  └──< WhatsAppContact
```

| Entity | Purpose |
|---|---|
| **Users** | Credentials/OAuth details, password reset data, ownership relations |
| **Social Accounts** | Platform identity, access/refresh tokens, expiry, status |
| **Scheduled Posts** | Content, schedule time, status, retry count, error metadata |
| **WhatsApp Contacts** | Contact records tied to a user and connected account |
| **WhatsApp Scheduled Messages** | Template, recipient, schedule time, delivery status |
| **WhatsApp Message Log** | Message direction, payload, response, status, success/error state |

---

# 📂 Project Structure

```
Mimico
│
├── app/                  # Next.js app router (dashboard, composer, calendar)
├── components/           # Reusable UI components
├── lib/                  # DB client, AI helpers, utilities
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── api/ (or app/api/)    # Auth, OAuth, AI, posts, cron routes
├── public/               # Static assets
└── docker-compose.yml
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/RHamzaZulfiqarJ/Mimico.git

cd Mimico
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mimico"

# Auth
JWT_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# OAuth
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

---

## Setup Database

```bash
npx prisma generate

npx prisma migrate dev
```

---

# ▶ Run Development Server

```bash
npm run dev
```

App:

```
http://localhost:3000
```

---

# 🗓️ Publishing Workflow

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

# 📸 Screenshots

Add screenshots here.

```
screenshots/

├── dashboard.png
├── composer.png
├── ai-studio.png
├── calendar.png
├── whatsapp.png
└── settings.png
```

---

# 🔐 Security

- Password hashing via **bcrypt**, session handling via **JWT cookies**
- **OAuth**-based account connections with per-platform token isolation
- **Zod** schema validation on all AI and platform-facing requests
- Session-protected API routes for all sensitive actions
- Controlled access/refresh token handling with expiry tracking
- Environment-based secret management for all API keys and credentials
- Structured error handling for unauthorized access, invalid input, and third-party API failures

---

# 🎯 Future Improvements

- Analytics dashboard with post performance charts
- AI-generated content calendar (weekly/monthly planning)
- Team collaboration, roles, and approval workflows
- Sentiment analysis and trend detection
- Auto-reply suggestions for comments and DMs
- Audience targeting and competitor analysis
- Additional platform integrations (LinkedIn, Instagram, Bluesky)
- Native mobile app

---

# 📜 License

Specify your license here (e.g., MIT).

---

<div align="center">

### ⭐ If you like this project, consider giving it a star!

Made with ❤️ using Next.js, Prisma, PostgreSQL & Gemini AI.

**Developed by [Hamza Zulfiqar](https://github.com/RHamzaZulfiqarJ)**

</div>
