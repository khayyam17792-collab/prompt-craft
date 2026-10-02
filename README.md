# PromptCraft Studio

Full-stack prompt engineering workspace built with **React (Vite) · Node.js/Express · Supabase**.

```
promptcraft-studio/
├── client/    # React 19 + Vite, React Router, Tailwind CSS v4, Lucide icons, Supabase JS
├── server/    # Node.js + Express 5, Supabase JS (service-role + RLS-scoped clients)
└── supabase/  # schema.sql (tables, RLS, functions) and seed.sql (demo data)
```

## Getting started

```bash
# Node >= 20 (see .nvmrc)
npm install

cp client/.env.example client/.env
cp server/.env.example server/.env
# fill in your Supabase keys

npm run dev          # client on http://localhost:5173, server on http://localhost:4000
```

The Vite dev server proxies `/api/*` to the Express server.

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Run client + server concurrently         |
| `npm run build`   | Production build of the client           |
| `npm run lint`    | Lint both workspaces (oxlint)            |
| `npm start`       | Start the Express server                 |

## Environment variables

| Variable                    | Where           | Notes                                              |
| --------------------------- | --------------- | -------------------------------------------------- |
| `VITE_SUPABASE_URL`         | client, server  | Supabase project URL                               |
| `VITE_SUPABASE_ANON_KEY`    | client, server  | Public anon key (safe for the browser)             |
| `SUPABASE_SERVICE_ROLE_KEY` | server only     | Bypasses RLS — never load it into the Vite bundle  |

## Database

Apply `supabase/schema.sql` then `supabase/seed.sql` in the Supabase SQL editor, or with the CLI:

```bash
supabase db reset   # applies schema + seed to a local Supabase stack
```

| Table      | Notes                                                                                   |
| ---------- | --------------------------------------------------------------------------------------- |
| `profiles` | 1:1 with `auth.users`; auto-created by the `on_auth_user_created` trigger               |
| `prompts`  | `variables` (jsonb), `tags` (text[]), `likes_count`, `is_public`; owned via `user_id`   |

RLS: anyone can read `prompts` where `is_public = true` (owners also see their private rows);
insert/update/delete require `auth.uid() = user_id`. `increment_prompt_likes(uuid)` is a
`security definer` RPC for authenticated users. Seed creates `demo@promptcraft.studio` / `password123`.

## API (`server/index.js`)

Authenticated routes expect `Authorization: Bearer <supabase access token>`; the server builds an
RLS-scoped client from that token so policies are enforced in the database.

| Method   | Path                      | Auth | Description                                              |
| -------- | ------------------------- | ---- | -------------------------------------------------------- |
| `GET`    | `/api/health`             |      | Service status                                           |
| `GET`    | `/api/prompts`            |      | Public prompts — `?q=&tag=&sort=newest|oldest|popular&limit=&offset=` |
| `GET`    | `/api/prompts/tags`       |      | Distinct public tags with counts                         |
| `GET`    | `/api/prompts/:id`        |      | One public prompt (owners can fetch their private ones)  |
| `GET`    | `/api/profiles/:username` |      | Profile with its public prompts                          |
| `GET`    | `/api/me`                 | yes  | Caller's profile                                         |
| `PATCH`  | `/api/me`                 | yes  | Update `username` / `avatar_url`                         |
| `GET`    | `/api/me/prompts`         | yes  | Caller's prompts, including private                      |
| `POST`   | `/api/prompts`            | yes  | Create prompt (`title`, `template_text`, `description`, `variables`, `tags`, `is_public`) |
| `PATCH`  | `/api/prompts/:id`        | yes  | Update own prompt                                        |
| `DELETE` | `/api/prompts/:id`        | yes  | Delete own prompt                                        |
| `POST`   | `/api/prompts/:id/like`   | yes  | Increment `likes_count`                                  |

## UI base

Dark-mode glassmorphic theme defined in `client/src/index.css` via Tailwind v4 `@theme` tokens and
custom utilities (`glass`, `glass-strong`, `glass-hover`, `text-gradient`). Reusable primitives live in
`client/src/components/` (`GlassCard`, `Button`, `Sidebar`, `Header`).
