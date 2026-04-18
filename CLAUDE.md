# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OUTFITY** is a full-stack SaaS application (Next.js 16+) for building and launching clothing brands with AI. Key integrations: OpenAI (ChatGPT API), Higgsfield (design generation, virtual try-on), Google Trends, brand intelligence APIs.

**Tech Stack:**
- Next.js 16+ (App Router, TypeScript, React 19)
- Tailwind CSS + Design System
- PostgreSQL + Prisma ORM
- NextAuth.js v5 (JWT auth with bcrypt)
- Stripe (payments), N8N (workflows), Supabase (fallback DB)

## Development Commands

### Quick Start
```bash
npm install
cp .env.example .env  # Configure environment variables
npm run dev          # Start dev server on localhost:3000
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes without migrations
npm run db:migrate   # Create and run migrations
npm run db:studio    # Interactive Prisma Studio
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run build        # Production build (requires 4GB+ memory)
npm run start        # Start production server
```

### Testing & Validation
```bash
npm run db:test      # Test Supabase connection
npm run test:e2e     # End-to-end tests
npm run test:blog    # Test blog workflow
npm run test:scraper # Test scraper functionality
```

### Utility Scripts
- `npm run db:seed-factories` — Seed factory database
- `npm run db:seed-products` — Seed products
- `npm run seed:trends` — Seed trends data
- `npm run migrate:brands` — Migrate brands to database
- `npm run check:db` — Check database status
- `npm run scrape:zalando` — Scrape Zalando trends

## Project Architecture

### Directory Structure
```
app/                    # Next.js App Router (routes + layout)
├── (auth)/            # Auth routes: signin, signup, forgot-password
├── (dashboard)/       # Protected dashboard routes
├── api/               # API routes (NextAuth, webhooks, AI integrations)
├── launch-map/        # Onboarding flow (4-phase structured)
├── design-studio/     # IA tech pack generation (Higgsfield + ChatGPT)
├── brands/            # Brand management
├── trends/            # Trends & market intelligence
└── hub/               # Sourcing hub, factory database

components/            # React components
├── layout/           # Header, Sidebar, Navigation
├── dashboard/        # Dashboard-specific components
├── brands/           # Brand builder, customization
├── design-studio/    # Design canvas, tech pack editor
├── launch-map/       # Onboarding flow components
├── common/           # Shared UI (alerts, modals, forms)
└── providers/        # Context providers (auth, theme, etc)

lib/                   # Business logic & utilities
├── api/              # API clients (OpenAI, Higgsfield, Google Trends)
├── auth.ts           # NextAuth configuration with Prisma adapter
├── ai-usage.ts       # Credits/token tracking system
├── brand-utils.ts    # Brand creation & customization helpers
├── email-templates.ts # Email notification templates
└── constants/        # Feature flags, configurations

prisma/               # Database schema
└── schema.prisma     # Postgres models (User, Brand, Product, etc)
```

### Key Data Models
- **User**: Auth, plan type, credits, referral system
- **Brand**: User's created brand with color palette, typography, logo
- **AIUsage**: Tracks token consumption by feature (brand design, tech packs)
- **Product**: Items in brand's product line
- **BlogPost**: Trend intelligence & competitor analysis
- **FashionBrand**: Competitor/market intelligence reference
- **Notification**: User notifications (email-based)
- **PushSubscription**: Browser push notification subscriptions

## Development Patterns

### API Routes Structure
- Routes handle authentication check via `getServerSession()` (NextAuth)
- Rate limiting via `AIUsage` model for feature-based credit consumption
- Request validation using TypeScript types (no explicit schema library)
- Error responses: `{ error: string, code?: string }` format

### AI Integration Points
1. **OpenAI (ChatGPT)**
   - Tech pack generation (fabric specs, production notes)
   - Brand positioning copy
   - Trend analysis and insights
   - Scripts for product descriptions

2. **Higgsfield API**
   - Design generation (AI visuals)
   - Virtual try-on/fitting simulations
   - Video generation from designs

3. **Google Trends + Web Scraping**
   - Trend signal detection
   - Competitor intelligence (Brand Spy module)
   - Market trend tracking
   - Optional: SimilarWeb, Wappalyzer APIs for deeper analysis

### Authentication & Authorization
- NextAuth.js v5 with Prisma adapter
- JWT-based sessions (stored in DB)
- Password hashing with bcrypt
- Protected routes via middleware
- Admin features: check `user.plan === "admin"`

### Component Architecture
- Functional components with hooks (React 19)
- Context API for global state (auth, theme, notifications)
- Composition over inheritance
- Tailwind utilities with custom design tokens

## Critical Environment Variables

**Required for development:**
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_URL` — App URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` — Generate via `openssl rand -base64 32`
- `OPENAI_API_KEY` — ChatGPT API key
- `HIGGSFIELD_API_KEY` — Design API key
- `CRON_SECRET` — Secret for scheduled jobs

**Optional (for advanced features):**
- `SIMILARWEB_API_KEY` — Brand intelligence (199€/month)
- `WAPPALYZER_API_KEY` — Tech stack detection (49€/month)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe payments
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — Fallback database

See `.env.example` for complete list.

## Testing & Debugging

### Database Debugging
```bash
npm run db:studio              # Interactive database browser
npx prisma db execute          # Run raw SQL
npm run db:test                # Connection test
```

### API Testing
- Use `curl` or Postman with auth headers from `next-auth` session
- Check `app/api/*/route.ts` for endpoint signatures
- Log using `console.log()` — appears in terminal with `npm run dev`

### Performance Hotspots
- Image optimization: use `next/image` with local storage for trends covers
- Database queries: minimize N+1 via Prisma `include` and `select`
- API calls: implement request caching with SWR (`lib/api/*`)
- Rate limiting: check `AIUsage` model before expensive operations

## Cursor/BMAD Integration

This project uses **BMAD-Method** agents and **SpecKit** (Spec-Driven Development):
- BMAD agents available via `@agent-name` in Cursor chat (e.g., `@dev`, `@architect`, `@pm`)
- Cursor commands in `.cursor/commands/` for specialized workflows
- Full Cursor rules in `.cursorrules` (SpecKit + BMAD hybrid)
- Available agents: `@analyst`, `@architect`, `@dev`, `@pm`, `@po`, `@qa`, `@sm`, `@ux-expert`

For SpecKit workflow: analyze → specify → plan → implement (see `.cursorrules`).

## Common Workflows

### Adding a New Feature Module
1. Create route in `app/your-module/`
2. Add Prisma model if needed
3. Create API endpoints in `app/api/your-module/`
4. Build components in `components/your-module/`
5. Wire UI in dashboard/navigation
6. Test with `npm run dev`

### Implementing AI Feature
1. Implement client function in `lib/api/` with OpenAI/Higgsfield
2. Create API route wrapper in `app/api/` with auth + rate limiting
3. Add frontend component with loading/error states
4. Track usage in `AIUsage` before consuming credits
5. Add error handling for API failures

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run db:migrate` to create migration
3. Confirm generated migration is correct
4. Commit migration file with schema changes

## Notes

- **Build memory**: `npm run build` requires 4GB+ heap space (uses `--max-old-space-size=4096`)
- **Next.js version**: Currently on 16.1.4 with App Router (not Pages Router)
- **Turbopack vs Webpack**: Try `npm run dev:turbo` for faster builds (optional)
- **Vercel deployment**: Railway.json and Vercel.json configs present for production
- **N8N automation**: Separate workflow engine for async tasks (see `N8N_INSTALLATION_GUIDE.md`)
