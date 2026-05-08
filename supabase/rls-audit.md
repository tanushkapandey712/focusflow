# FocusFlow RLS Audit

FocusFlow uses Supabase Auth plus Row Level Security for all user-owned app data.
The frontend must use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
Do not expose a service-role key in browser code or `VITE_*` environment variables.

## Protected Tables

Each table has RLS enabled and policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
Every policy requires the row owner to match the authenticated user:

```sql
auth.uid() = user_id
```

Covered tables:

- `profiles`
- `subjects`
- `units`
- `topics`
- `goals`
- `sessions`

## Parent Ownership Checks

Child tables also validate their parent links on `INSERT` and `UPDATE`:

- `units.subject_id` must reference a subject owned by `auth.uid()`.
- `topics.unit_id` must reference a unit owned by `auth.uid()`.
- `sessions.unit_id` and `sessions.topic_id`, when present, must reference rows owned by `auth.uid()`.

This prevents a malicious client from attaching its own row to another user's syllabus data.

## Frontend Query Rule

All frontend data service fetches must pass the current Supabase Auth user id and include
`.eq("user_id", userId)` or an equivalent owner filter. Mutations must write `user_id` from
the current session, not from user-editable UI state.

## Manual Success Test

1. Sign in as User A and create a subject, unit, topic, goal, session, and profile row.
2. Sign in as User B in another browser or incognito session.
3. Try to fetch User A rows by id or by table scan from the Supabase client.
4. Confirm User B receives no rows and cannot update or delete User A rows.
5. Confirm normal CRUD still works for User B's own rows.
