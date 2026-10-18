# Maduraa System Architecture

## Baseline

```
FIGMA
  ↓
React + TypeScript
  ↓
Tailwind CSS
  ↓
Supabase
 ├─ Authentication
 ├─ PostgreSQL Database
 ├─ Storage
 └─ Row Level Security
  ↓
Vercel
```

## Repository workspaces

- `client/` — React, TypeScript, dan Vite frontend (`src/`, `public/`, `index.html`)
- `server/` — backend/database integration workspace
- `docs/` — architecture, database, API, security, and testing documentation
