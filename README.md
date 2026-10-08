# Revwi

Course review webapp with invite-only accounts, Supabase-backed banks, and a side-view Three.js Grove (year → course → assessment). The quiz surface keeps the verified DevNet reviewer interaction model.

## Run locally

1. Install Node.js and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill Supabase keys when using auth and server attempts.
3. Run `npm run dev` and open the URL shown (Network URL works on phone).
4. Paths:
   - `/` Grove year selection
   - `/u/3` 3rd Year courses
   - `/c/it0123` DEVELOPMENT NETWORK assessment path
   - `/c/it0123/sa2` SA2 setup, then the Chronicle reviewer

Without Supabase, navigation and the local reviewer work. Run migrations and `npm run seed` after `supabase db push` to sync Postgres.

## Invite-only accounts

1. In Supabase Auth, set the Site URL to your app origin. Add `https://your-app.example/auth/callback` and `https://your-app.example/auth/confirm` to the allowed redirect URLs, plus both local URLs for development. Set `NEXT_PUBLIC_SITE_URL` to the same origin.
2. In Auth settings, turn off **Allow new users to sign up** for the whole project. Admin invitations can still create users, while a first-time Google login cannot create an orphan account. Keep email/password sign-in enabled. Enable the Google provider with its OAuth credentials, and enable manual identity linking so invited students can connect Google after accepting an invitation.
3. Configure a working SMTP sender for invitation delivery. Set the hosted project's **Invite user** email template to the contents of `supabase/templates/invite.html`. The template sends the token hash to the server route so the session is stored in cookies.
4. Apply migrations and seed. Invite the initial admin through Supabase Auth's user dashboard, accept the invitation, then promote that user's profile in the SQL editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where user_id = (select id from auth.users where email = 'admin@example.com');
   ```

5. That admin can invite students from Ledger. Students accept their emailed link and choose a password or connect Google at `/welcome`.

An invited user has a profile; an unrelated OAuth signup does not. RLS requires a profile before any course or bank content is visible. Invitation delivery and Google sign-in need live provider credentials to test end to end. [Supabase invitation guide](https://supabase.com/docs/guides/auth/users#inviting-users) and [email template guide](https://supabase.com/docs/guides/auth/auth-email-templates#redirecting-the-user-to-a-server-side-endpoint) describe the hosted settings.

If an orphan Auth user was created before signups were disabled, remove that uninvited user in the Supabase Auth dashboard before inviting the same email. Confirm there is no `profiles` row first; removing an established student would also remove their attempts.

After seeding and accepting one student invitation, run `supabase/tests/security-smoke.sql` in the SQL editor. It checks RLS and publication rules inside a transaction that rolls back its test rows.

## Scripts

- `npm run validate:bank` checks all curation positions and question keys.
- `npm run build` validates the bank and builds Next.js.
- `npm run seed` loads year levels, IT0123, assessments, and questions (requires service role key).

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) system design
- [DESIGN.md](DESIGN.md) Grove, Chronicle, and Ledger visual spec
- [PRODUCT.md](PRODUCT.md) product summary

## Legacy Vite entry

The previous Vite entry (`index.html`, `src/main.tsx`) remains for reference; production dev server is Next.js.
