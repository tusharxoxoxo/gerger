# Material Request Tracker

A Material Request Tracker for construction projects with React, TypeScript, Supabase, and AI-powered suggestions.

## Features

- Material request CRUD with status workflow
- Multi-tenancy with Row Level Security
- AI-powered material suggestions & priority recommendations
- CSV/Excel export

## Tech Stack

React 18 + TypeScript, Vite, shadcn-ui, Tailwind CSS, Supabase, React Query, OpenAI (optional)

## Quick Setup

### 1. Install Dependencies

```bash
npm install   # or: bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_OPENAI_API_KEY` - (Optional) For AI features

### 3. Database Setup

Run these migrations in Supabase SQL Editor (in order):
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auto_company_assignment.sql`

### 4. Run

```bash
npm run dev   # or: bun run dev
```

Open `http://localhost:5173`

## Build

```bash
npm run build
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No company assigned" | Run both migrations; company auto-assigns on signup |
| RLS errors | Verify user is linked to a company in `user_companies` |
| AI not working | Optional - app uses fallback heuristics without API key |
