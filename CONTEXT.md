# EduVerse Context

## Product Vision
- **Mission** Equip learners and educators with an interactive, AI-assisted platform for discovering, organizing, and sharing educational resources.
- **Differentiator** Combine curated curriculum pathways with generative assistance that adapts to the learner’s goals and pace.

## Target Users
- **Learners** High-school and college students seeking guided learning journeys.
- **Educators** Teachers and mentors curating resources and tracking cohort progress.
- **Institutions** Schools and bootcamps needing lightweight LMS capabilities without infrastructure costs.

## Core Features (MVP)
- **Personalized Learning Paths** AI-assisted curriculum recommendations mapped to user goals.
- **Resource Library** Uploads, embeds, and tagging for documents, videos, and links.
- **Progress Tracking** Checkpoints, quizzes, and analytics dashboards.
- **Community Spaces** Discussion boards or chat for cohorts.
- **Admin Console** Manage cohorts, content, and platform settings.

## Tech Stack (Free-Tier Optimized)

### Frontend
- **Framework** `Next.js 14` (App Router + TypeScript) for SSR/SSG flexibility and Vercel-native deployment.
- **Styling** `Tailwind CSS` with `Headless UI`/`Radix UI` for accessible, customizable components without paid UI kits.
- **State/Data** `TanStack Query` for caching server data and `Zustand` for lightweight client state when needed.
- **Charts** `Recharts` (MIT) for progress visualizations.
- **Content Editing** `TipTap` (free core) for rich-text authoring.

### Backend & APIs
- **Runtime** Next.js Route Handlers / Server Actions to avoid separate backend hosting costs.
- **Edge Functions** Vercel Edge Functions for low-latency public APIs within free quotas.
- **Background Jobs** Vercel Cron & On-Demand ISR for scheduled syncs and cache refreshes.
- **Email/Notifications** `Resend` free tier (up to 3k emails/mo) or `Brevo` alternative if higher volume.
- **AI Services** Optional `OpenAI` or `Google Gemini` APIs; costs scale with usage and are the only expected paid items.

### Database & Storage
- **Primary DB** `Supabase` (Postgres) free tier: 500 MB storage, generous row limits, and built-in row-level security.
- **Realtime & Auth** Supabase Realtime channels for live collaboration and Supabase Auth for email/password + OAuth.
- **File Storage** Supabase Storage buckets (1 GB free). For larger media, fall back to `Cloudflare R2` (free egress) if needed later.
- **Caching/Search** `Upstash Redis` free tier for session caching and rate limiting; `Typesense Cloud` community plan for search if necessary.

### Analytics & Observability
- **Product Analytics** `PostHog` free plan (1M events/mo) or `Plausible Self-Hosted` on Vercel/Render free tier if events grow.
- **Error Monitoring** `Sentry` free tier (5k events/mo) for client and server error tracking.

### Hosting & DevOps
- **Deployment** Vercel Hobby plan (free) with GitHub integration for preview deployments.
- **Environment Management** `.env.local` for secrets; sync via Vercel Environment Variables.
- **CI/CD** GitHub Actions (2k free build minutes) for lint/test pipelines.

### Tooling
- **Language** TypeScript end-to-end for type safety.
- **Linting** ESLint + Prettier + TypeScript eslint plugin.
- **Testing** Vitest (unit) + Playwright (E2E) using GitHub Actions free minutes.
- **Design** Figma free plan for wireframes and design system.

## Free-Tier Considerations
- **Quota Monitoring** Enable Supabase usage alerts and Vercel analytics to avoid overages.
- **Data Exports** Automate weekly backups from Supabase to cloud storage (Supabase provides free point-in-time recovery within limits).
- **Graceful Degradation** Cache AI responses and apply request quotas to keep API costs predictable.
- **Scalability Path** If traction demands upgrades, migrate backend routes to dedicated Supabase Edge Functions or a container host (Railway/Render) while retaining same stack.

## Immediate Next Steps
- **Design** Create foundational Figma mocks for learner dashboard, resource library, and admin console.
- **Tech Setup** Scaffold Next.js project, configure Supabase project, and wire Vercel deployment.
- **Compliance** Draft privacy policy addressing storage of learner data and AI interactions.

# Context: EduVerse — The AI Gamified Study Universe

## Vision
EduVerse is an AI-powered, gamified learning ecosystem designed for Indian students preparing for school and competitive exams (like JEE, NEET, Boards). It merges study assistance, collaboration, and motivation into one super-app.

---

## Core Features

### 1. AI Doubt Solver
- Accepts text, voice, or image input.
- Solves academic questions (Maths, Physics, Chemistry) using NCERT context.
- Provides step-by-step explanations and visualizations.
- Offers “Explain Like I’m 15” simplification mode.

### 2. Study Groups & Friends
- Create or join friend circles.
- Collaborate on group quizzes, challenges, and shared study goals.
- Peer-matching system for similar learning levels.

### 3. Gamification
- XP, levels, badges, streaks, and StudyCoins.
- In-game marketplace for cosmetic upgrades.
- Competitive leaderboards.

### 4. Smart Scheduler
- User inputs free study hours.
- AI auto-generates adaptive study timetables.
- Syncs with calendar and progress tracking.
- Sends motivational nudges.

### 5. Productivity Tools
- Focus sessions with gamified “no distraction” challenges.
- Physics Unit Converter, Chemistry Periodic Table, Math Log Table.
- Cheat Sheet & Concept Map Generator (from NCERT PDFs).
- Offline mode for rural areas.

### 6. AI Study Buddy
- Virtual avatar grows stronger with study progress.
- Gives encouragement, feedback, and reminders.
- Can communicate via text or voice in Hinglish.

### 7. Visual & Voice AI
- OCR + AI for handwritten questions.
- Text-to-speech and speech-to-text features.
- Voice-based query solving in Hindi/English mix.

### 8. Community & Wellness
- Study groups, quizzes, leaderboards, and community challenges.
- Meditation timers, focus streaks, eye breaks.
- Tracks burnout and recommends relaxation.

---

## Personality of the App
- Friendly, encouraging, slightly humorous (“Bro, even Newton would be proud!”)
- Mixes Hindi + English (natural Hinglish tone).
- Prioritizes motivation and fun while keeping academic accuracy.

---


## Potential Future Expansions
- AR-enabled 3D molecule and physics concept viewer.
- Integration with EdTech APIs (NCERT, BYJU’s-style content).
- AI-generated question papers and test simulations.
- Parent dashboard for progress tracking.

---

### Motto
> “Study smart, play harder — your knowledge, your universe.”