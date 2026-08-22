# Supabase setup

For local development run `npx supabase start` and `npx supabase db reset`. The CLI applies every file in `migrations/` in timestamp order and then loads `seed.sql`.

For a hosted demo project, link the CLI and run `npx supabase db push`. Load `seed.sql` only into a disposable demo environment because it creates fixed fictional accounts. Configure Auth Site URL and `/auth/callback` redirect URLs before testing verification or password reset. The `employee-documents` private bucket and its policies are created by the migration.

Never expose the service-role key to the browser or use it to bypass RLS in ordinary application flows.
