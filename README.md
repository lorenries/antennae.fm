# antennae.fm

`antennae.fm` is now a single Next.js application (App Router) that serves the UI and backend endpoints from one codebase.

## Stack

- Next.js (latest)
- React + TypeScript
- Tailwind CSS (v4 via `@tailwindcss/postcss`)
- Biome (formatting + linting)
- pnpm

## Architecture

- `app/page.tsx`: radio UI
- `app/api/stations`: station list endpoint
- `app/api/stream/[id]`: audio stream proxy endpoint
- `app/api/metadata/[id]`: SSE metadata endpoint
- `src/lib/radio.ts`: metadata monitor + pub/sub for station updates
- `src/lib/stations.ts`: station definitions

The old split setup (`client/` + `server/`) has been removed.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Production

```bash
pnpm build
pnpm start
```

## Quality

```bash
pnpm lint
pnpm format
pnpm typecheck
```
