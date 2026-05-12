# DQL Detective

An interactive, open-source platform for learning **Dynatrace Query Language (DQL)** and **Dynatrace Pattern Language (DPL)** through hands-on cases, a query sandbox, arcade mini-games, and real-time data visualizations.

> **Disclaimer:** This is an independent, open-source project built by a Dynatrace enthusiast in collaboration with AI. It is **not affiliated with, endorsed by, funded, or approved by Dynatrace** in any way.

---

## Features

- **60+ Interactive Cases** — Solve real-world observability incidents across DQL, DPL, and combined tracks.
- **Query Sandbox** — Write and execute DQL pipelines freely with instant feedback.
- **Visualize Mode** — Watch how each DQL command transforms data with animated visual signatures.
- **Arcade** — Timer rush, pipeline builder, and quiz game modes to reinforce learning.
- **Codex** — Built-in reference guide for DQL commands, operators, and functions.
- **Leaderboard** — Compete with others on learning XP and arcade scores.
- **Progress Sync** — Your progress is saved to your account and synced across sessions.

---

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand (with localStorage persistence)
- **Auth & Database:** [Supabase](https://supabase.com/) (Auth + Postgres)
- **3D Scene:** Three.js + React Three Fiber (login screen)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Editor:** Monaco Editor

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (recommended: 20)
- A [Supabase](https://supabase.com/) project (free tier works fine)

### Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
app/              # Next.js App Router pages + API routes
components/       # React components (screens, panes, modals, arcade, tour)
lib/
  auth/           # Supabase auth hooks
  store/          # Zustand state management
  api/            # Profile & leaderboard CRUD
  dql/            # Scenario definitions, query engine, parser
  dpl/            # DPL parser and matchers
  supabase/       # Supabase client setup
  types/          # TypeScript type definitions
public/           # Static assets
grail-basin/      # Vite + Three.js 3D login scene (sub-project)
```

---

## Contributing & Collaboration

This project is open-source under the MIT License. Contributions, suggestions, and collaboration ideas are welcome.

**Reach out:** [maheedhartalluri@gmail.com](mailto:maheedhartalluri@gmail.com)

## Support the Project

If you find DQL Detective useful and want to support its continued development, you can buy the developer a coffee at the live site:

**[stackwise-ai.com](https://stackwise-ai.com)** — Click the "Buy me a coffee" button in the app.

All support goes toward building more cases, features, and keeping the platform free for everyone.

---

## License

[MIT](LICENSE) — Copyright (c) 2025 maheedhar132

Please credit the original author when using or modifying this project.
