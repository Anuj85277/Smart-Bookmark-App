
# Smart Bookmark App

Live Demo (Production):  
👉 https://smart-bookmark-app-brown-zeta.vercel.app/

This is a Next.js project bootstrapped with `create-next-app`.

## Getting Started (Local Setup)

First, install dependencies:

```bash
npm install
```
Then, run the development server:

```bash
npm run dev
```

Open http://localhost:3000
 with your browser to see the result.

You can start editing the page by modifying app/page.tsx.
The page auto-updates as you edit the file.

Tech Stack

Next.js (App Router)

Supabase (Auth, Database, Realtime)

Tailwind CSS

Google OAuth

Vercel (Production Hosting)

Problems Faced & How I Solved Them

Google OAuth redirecting to localhost in production

Fixed by updating Supabase Auth → URL Configuration with Vercel domain.

Bookmarks not inserting/updating due to RLS

Solved by adding Supabase Row Level Security policies for select, insert, update, delete using auth.uid() = user_id.

Supabase client errors / env not working on Vercel

Fixed by adding NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.

Realtime updates not reflecting

Solved by subscribing to postgres_changes with user-specific filters.