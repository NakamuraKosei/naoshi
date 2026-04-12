# Naoshi

AIで書いたレポートを、ちゃんと人間の言葉に。

日本の大学生のための、日本語特化AIテキストヒューマナイザー。

## Tech Stack

- **Frontend**: Next.js 16 (App Router) / TypeScript / Tailwind CSS v4
- **Auth**: Supabase Auth (Magic Link + Google OAuth)
- **DB**: Supabase Postgres (RLS)
- **AI**: Anthropic Claude Sonnet 4
- **Payment**: Stripe (Checkout / Customer Portal / Webhooks)
- **Hosting**: Vercel

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in the values (see `.env.local.example` for descriptions).

### 3. Supabase

- Create project at [supabase.com](https://supabase.com)
- Run migration: `supabase/migrations/0001_init.sql`
- Auth > URL Configuration: add redirect URL `http://localhost:3001/auth/callback`
- Auth > Providers: enable Google (optional)

### 4. Stripe

- Create 3 products/prices (Light weekly, Heavy monthly, Heavy yearly)
- Set price IDs in `.env.local`
- For local webhook testing: `stripe listen --forward-to localhost:3001/api/stripe/webhook`

### 5. Run

```bash
npm run dev -- -p 3001
```

## Project Structure

```
src/
  app/
    (marketing)/     # LP, pricing, login, legal pages
    (app)/           # Authenticated: /app, /account, /history
    api/             # Route handlers: humanize, auth, stripe
    auth/            # Client-side auth callback
  components/
    ui/              # Button, Card, Input, Textarea, Badge
    layout/          # SiteHeader, SiteFooter, HeaderNav
    marketing/       # PricingPlans, FAQ, FeatureCard, StepCard
    brand/           # Logo
    hero-converter   # LP conversion UI
    login-modal      # Auth modal
    limit-modal      # Quota exceeded modal
  lib/
    supabase/        # Client, server, service, middleware
    stripe/          # Stripe client, price mapping
    usage/           # Plans, check-limit, record-usage
    humanize/        # Prompt loader
prompts/
  humanize-system-prompt.md  # AI conversion prompt (source of truth)
supabase/
  migrations/        # DB schema
test-results/        # M4 quality test templates
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (webhooks) |
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `MOCK_HUMANIZE` | No | Set to `1` for mock mode (no API calls) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_PRICE_LIGHT_WEEKLY` | Yes | Stripe price ID for Light plan |
| `STRIPE_PRICE_HEAVY_MONTHLY` | Yes | Stripe price ID for Heavy monthly |
| `STRIPE_PRICE_HEAVY_YEARLY` | Yes | Stripe price ID for Heavy yearly |

## Deploy to Vercel

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add all environment variables
4. Deploy
5. Update Supabase redirect URLs and Stripe webhook URL to production domain
