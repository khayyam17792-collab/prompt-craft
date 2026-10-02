# PromptCraft Studio

Full-stack prompt engineering workspace built with **React (Vite) · Node.js/Express · Supabase**.

```
promptcraft-studio/
├── client/   # React 19 + Vite, React Router, Tailwind CSS v4, Lucide icons, Supabase JS
└── server/   # Node.js + Express 5, Supabase JS (service-role client)
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

## UI base

Dark-mode glassmorphic theme defined in `client/src/index.css` via Tailwind v4 `@theme` tokens and
custom utilities (`glass`, `glass-strong`, `glass-hover`, `text-gradient`). Reusable primitives live in
`client/src/components/` (`GlassCard`, `Button`, `Sidebar`, `Header`).
