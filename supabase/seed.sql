-- PromptCraft Studio — seed data
-- Creates a demo user/profile and 5 sample prompt templates.
-- Run automatically by `supabase db reset`, or paste into the SQL editor after schema.sql.

-- Demo auth user (password: "password123"). The on_auth_user_created trigger creates the profile.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'demo@promptcraft.studio',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"promptsmith","avatar_url":"https://api.dicebear.com/9.x/shapes/svg?seed=promptsmith"}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.profiles (id, username, avatar_url)
values (
  '11111111-1111-1111-1111-111111111111',
  'promptsmith',
  'https://api.dicebear.com/9.x/shapes/svg?seed=promptsmith'
)
on conflict (id) do nothing;

insert into public.prompts (id, user_id, title, description, template_text, variables, tags, likes_count, is_public)
values
(
  'aaaaaaaa-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Code Reviewer',
  'Thorough, constructive code review with prioritized findings.',
  $tpl$You are a senior {{language}} engineer performing a code review.

Review the following code for correctness, readability, performance, and security. Prioritize findings as Critical / Major / Minor and suggest concrete fixes with short code snippets.

```{{language}}
{{code}}
```

Focus especially on: {{focus_areas}}$tpl$,
  '[{"name":"language","type":"string","description":"Programming language of the snippet","default":"TypeScript"},{"name":"code","type":"text","description":"The code to review"},{"name":"focus_areas","type":"string","description":"Comma-separated areas to emphasize","default":"error handling, edge cases"}]'::jsonb,
  array['engineering','code-review','quality'],
  42,
  true
),
(
  'aaaaaaaa-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Blog Post Outline',
  'Generate a structured outline for a long-form blog post.',
  $tpl$Create a detailed outline for a {{word_count}}-word blog post titled "{{title}}" aimed at {{audience}}.

Include:
- A hook for the introduction
- 4–6 H2 sections, each with 2–3 supporting bullet points
- A conclusion with a clear call to action
- 3 suggested SEO keywords

Tone: {{tone}}$tpl$,
  '[{"name":"title","type":"string","description":"Working title of the post"},{"name":"audience","type":"string","description":"Who the post is for","default":"technical founders"},{"name":"word_count","type":"number","description":"Target length","default":1500},{"name":"tone","type":"string","description":"Writing tone","default":"conversational but authoritative"}]'::jsonb,
  array['writing','marketing','content'],
  31,
  true
),
(
  'aaaaaaaa-0000-0000-0000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'SQL Query Builder',
  'Translate a plain-English question into an optimized SQL query.',
  $tpl$You are an expert {{dialect}} database engineer.

Given the schema below, write a single, efficient SQL query that answers the question. Explain any assumptions in one short paragraph after the query, and note which indexes would help.

Schema:
{{schema}}

Question: {{question}}$tpl$,
  '[{"name":"dialect","type":"string","description":"SQL dialect","default":"PostgreSQL"},{"name":"schema","type":"text","description":"CREATE TABLE statements or a schema summary"},{"name":"question","type":"string","description":"Plain-English question to answer"}]'::jsonb,
  array['engineering','sql','data'],
  27,
  true
),
(
  'aaaaaaaa-0000-0000-0000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  'Meeting Notes Summarizer',
  'Turn a raw transcript into decisions, action items, and open questions.',
  $tpl$Summarize the meeting transcript below for {{audience}}.

Output in Markdown with these sections:
1. **TL;DR** — 2 sentences max
2. **Decisions** — bulleted
3. **Action items** — table with Owner, Task, Due date (use "TBD" if unknown)
4. **Open questions**

Transcript:
{{transcript}}$tpl$,
  '[{"name":"audience","type":"string","description":"Who will read the summary","default":"the whole team"},{"name":"transcript","type":"text","description":"Raw meeting transcript or notes"}]'::jsonb,
  array['productivity','summarization','business'],
  19,
  true
),
(
  'aaaaaaaa-0000-0000-0000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  'Product Description Writer',
  'Persuasive e-commerce copy with features, benefits, and a CTA.',
  $tpl$Write a product description for "{{product_name}}" sold to {{target_customer}}.

Key features: {{features}}

Requirements:
- Open with a one-line benefit-driven headline
- 2 short paragraphs (max 120 words total) that turn features into benefits
- A bulleted list of 3–5 specs
- End with a call to action
- Brand voice: {{brand_voice}}$tpl$,
  '[{"name":"product_name","type":"string","description":"Name of the product"},{"name":"target_customer","type":"string","description":"Ideal customer","default":"busy professionals"},{"name":"features","type":"text","description":"Comma-separated list of features"},{"name":"brand_voice","type":"string","description":"Tone of voice","default":"warm and confident"}]'::jsonb,
  array['marketing','ecommerce','copywriting'],
  15,
  true
)
on conflict (id) do nothing;
