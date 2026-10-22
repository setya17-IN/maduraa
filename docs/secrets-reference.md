# Secrets Reference

Never commit real credentials.

| Variable | Location | Purpose | Required |
|---|---|---|---|
| VITE_SUPABASE_URL | `.env.local` (repository root) | Supabase project URL used by the frontend | Frontend |
| VITE_SUPABASE_ANON_KEY | `.env.local` (repository root) | Supabase publishable/anon key used by the frontend | Frontend |
| PORT | `server/.env` | Backend server port | Development |
| DATABASE_URL | `server/.env` | PostgreSQL connection URI | Backend |
| JWT_SECRET | `server/.env` | Secret used to sign backend JWTs | Backend |
| CLIENT_URL | `server/.env` | Frontend origin allowed by backend CORS | Backend |
| NODE_ENV | `server/.env` | Backend runtime environment | Development |

Use the root `.env.example` for frontend variables and `server/.env.example` for backend variables. Copy them to `.env.local` and `server/.env` respectively. Never put backend secrets in frontend environment files or commit real credentials.
