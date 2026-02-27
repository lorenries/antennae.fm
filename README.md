# antennae.fm

`antennae.fm` is a small internet radio web app. It streams audio from curated stations, shows live track metadata, and updates clients in real time over GraphQL subscriptions.

## Project structure

- `client/`: Next.js frontend (TypeScript) using `urql` + WebSocket subscriptions.
- `server/`: Express + Apollo GraphQL API (TypeScript) that proxies station streams and publishes metadata events.
- `docker-compose.yml`: local Redis + API setup.

## How it works

- The backend keeps persistent connections to upstream radio streams defined in `server/src/stations.ts`.
- It exposes:
  - GraphQL over HTTP at `/graphql`
  - GraphQL subscriptions over WebSocket at `/subscriptions`
  - Audio proxy endpoint at `/stream/:id`
- Metadata is emitted to subscribed clients via PubSub:
  - In-memory PubSub by default
  - Redis-backed PubSub when `REDIS_URL` is set
- The frontend queries available streams, subscribes to metadata updates per stream, and plays audio through the proxy endpoint URL returned by GraphQL.

## Prerequisites

- Node.js 12.x (the repo is pinned to `12.18.3` via Volta in both apps)
- Yarn 1.x
- Docker (optional, for Redis/API local stack)

## Environment variables

### Client (`client/`)

Configured via `client/next.config.js`:

- `API_ROOT` (default: `https://api.antennae.fm`)
- `WS_ROOT` (default: `wss://api.antennae.fm`)

For local development, set:

- `API_ROOT=http://localhost:8000`
- `WS_ROOT=ws://localhost:8000`

### Server (`server/`)

- `PORT` (default: `8000`)
- `API_ROOT` (used when building stream URLs in GraphQL responses; default: `http://localhost:8000`)
- `REDIS_URL` (optional; enables Redis-backed GraphQL PubSub)
- `REDIS_HOST`, `REDIS_PORT` (used by Docker Compose service environment)

Note: `server/prisma/schema.prisma` references `DATABASE_URL`, but the current runtime stream/GraphQL flow does not use Prisma in the checked-in server code.

## Setup

Install dependencies:

```bash
cd client && yarn
cd ../server && yarn
```

## Run locally

### Option A: run client + server directly

1. Start the API:

```bash
cd server
yarn start
```

2. In a second terminal, start the frontend (pointing to local API):

```bash
cd client
API_ROOT=http://localhost:8000 WS_ROOT=ws://localhost:8000 yarn dev
```

3. Open `http://localhost:3000`.

### Option B: run API + Redis with Docker Compose

```bash
docker compose up --build
```

Then run the frontend separately:

```bash
cd client
API_ROOT=http://localhost:8000 WS_ROOT=ws://localhost:8000 yarn dev
```

## Useful commands

### Client

```bash
cd client
yarn dev      # start Next.js dev server
yarn build    # production build + static export
yarn start    # serve exported static output from out/
yarn lint     # eslint
```

### Server

```bash
cd server
yarn start    # ts-node-dev src/index.ts
yarn build    # compile TypeScript to dist/
```

## Deployment notes

- `server/Dockerfile` builds and runs the API with `pm2-runtime`.
- `heroku.yml` points Heroku container deploys at `server/Dockerfile`.
- The client is configured for static export (`next export`) and can be served as static assets.

