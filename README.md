# CommonScents

A luxury fragrance discovery platform. Search 70,000+ perfumes, build your collection, discover affordable alternatives, and explore the world of scent.

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 (React, TypeScript, Tailwind) | SSR, App Router, modern UI |
| Database | Supabase (PostgreSQL) | Data, Auth, Storage, RLS |
| ETL | Python (pandas) | Offline data processing |
| UI Components | shadcn/ui + Magic UI | Luxury design system |
| Animations | Framer Motion | Smooth transitions, scroll-driven effects |

## Project Structure

```
CommonScents_v1/
├── apps/web/                    # Next.js frontend
│   └── src/
│       ├── app/                 # Routes (/, /search, /fragrance/[id])
│       ├── components/          # React components
│       │   ├── home/            # Homepage sections
│       │   ├── layout/          # Shared layout
│       │   └── ui/              # shadcn + Magic UI components
│       └── lib/                 # Supabase client, types, utilities
├── scripts/
│   ├── etl/                     # Python data pipeline
│   │   ├── data_processing.py   # Main ETL runner
│   │   ├── clean_raw_data.py    # Data cleaning + concentration extraction
│   │   ├── infer_metadata.py    # Day/night + season inference
│   │   ├── sync_to_supabase.py  # Push to Supabase
│   │   ├── load_dataframes.py   # CSV loading utilities
│   │   └── download_dataset.py  # Kaggle dataset download
│   └── price_fetch/             # Pricing pipeline (future)
├── supabase/
│   └── migrations/              # SQL schema + RLS policies
│       └── 001_initial_schema.sql
├── data/                        # CSV datasets (gitignored if large)
├── styles/                      # Aceternity UI reference components
└── functions/                   # Legacy Python (archived)
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

Visit `http://localhost:3000`.

### 2. Environment Variables

Copy `.env.example` to `.env` at the project root and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

### 3. Database Setup

Run the migration SQL in your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, indexes, triggers, and RLS policies.

### 4. ETL Pipeline

```bash
cd scripts/etl
pip install -r requirements.txt
python data_processing.py       # Clean raw CSV
python sync_to_supabase.py      # Push to Supabase
```

## Key Features

- **Immersive Homepage**: 6-section scroll narrative with 3D spinning bottle animation
- **Full-Text Search**: PostgreSQL `tsvector` + `pg_trgm` fuzzy matching
- **Fragrance Detail Pages**: Notes, accords, ratings, time/season, pricing
- **User Accounts**: Supabase Auth with profile, ratings, collections, wishlists
- **Similar & Clones**: Algorithmic similarity + curated clone/inspiration pairs
- **Price Estimates**: Google Custom Search + community reports
- **Market Segments**: Niche, Designer, Middle Eastern, Mid Tier categorization

## Design

The visual language draws from luxury fragrance boutiques — warm ivory and gold palette, serif headings (Cormorant Garamond), clean sans body (DM Sans), and considered motion design.

## Tech Stack Details

- **shadcn/ui**: Command, Card, Dialog, Sheet, Badge, Separator, Avatar, Tooltip, Input
- **Magic UI**: Marquee, BlurFade, NumberTicker, ShimmerButton
- **Framer Motion**: Page transitions, scroll-driven animations, staggered reveals
