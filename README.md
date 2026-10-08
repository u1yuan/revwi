# Revwi

Course review webapp with RBAC, Supabase-backed banks, and Three.js navigation (year → course planet → assessment moons). The quiz surface keeps the verified DevNet reviewer interaction model.

## Run locally

1. Install Node.js and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill Supabase keys when using auth and server attempts.
3. Run `npm run dev` and open the URL shown (Network URL works on phone).
4. Paths:
   - `/` multiverse (Void)
   - `/u/3` 3rd Year universe
   - `/c/it0123` DEVELOPMENT NETWORK planet
   - `/c/it0123/sa2/play` Chronicle reviewer (122-question bank)

Without Supabase, navigation and the local reviewer work. Run migrations and `npm run seed` after `supabase db push` to sync Postgres.

## Scripts

- `npm run validate:bank` checks all curation positions and question keys.
- `npm run build` validates the bank and builds Next.js.
- `npm run seed` loads year levels, IT0123, assessments, and questions (requires service role key).

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) system design
- [DESIGN.md](DESIGN.md) Void vs Chronicle visual spec
- [PRODUCT.md](PRODUCT.md) product summary

## Legacy Vite entry

The previous Vite entry (`index.html`, `src/main.tsx`) remains for reference; production dev server is Next.js.
