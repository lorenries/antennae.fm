# AGENTS.md - Guidelines for Coding Assistant

## Project Nature

- `antennae.fm` is a small internet radio web app.
- It is split into two Node/TypeScript apps:
  - `client/`: Next.js frontend using `urql` and GraphQL subscriptions over WebSocket.
  - `server/`: Express + Apollo GraphQL API that proxies radio streams and emits live metadata.
- `docker-compose.yml` provides local Redis and API services.

## Environment

- Node.js `12.18.3` (pinned via Volta in both apps; engine target is Node 12.x).
- Yarn 1.x package management.
- TypeScript in both `client/` and `server/`.
- Optional Redis for production-like GraphQL PubSub behavior.

## Project Structure

```
client/             — Next.js app (pages, UI, audio hooks, GraphQL client)
server/             — Express/Apollo GraphQL + stream proxy + metadata publishing
server/src/         — core backend modules (schema, resolvers, streams, stations, pubsub)
docker-compose.yml  — local Redis + API stack
README.md           — canonical setup/run documentation
```

## Development Commands

### Install dependencies

```bash
cd client && yarn
cd ../server && yarn
```

### Run locally

```bash
# Terminal 1
cd server
yarn start

# Terminal 2
cd client
API_ROOT=http://localhost:8000 WS_ROOT=ws://localhost:8000 yarn dev
```

### Docker-backed API + Redis

```bash
docker compose up --build
```

### Build and quality checks

```bash
cd client && yarn lint && yarn build
cd ../server && yarn build
```

## Coding Guidelines

- Prefer minimal, targeted changes over broad rewrites.
- Keep naming consistent: camelCase for variables/functions, PascalCase for components/types.
- Keep imports at the top of files (no inline imports).
- Do not swallow errors; handle them explicitly with clear messages.
- For GraphQL changes:
  - Keep `server/src/schema.ts` and `server/src/resolvers.ts` aligned.
  - Preserve subscription behavior and topic naming consistency.
- For stream changes:
  - Update `server/src/stations.ts` as source of truth for station definitions.
  - Avoid breaking the `/stream/:id` proxy path contract used by the client.

## Testing and Validation Expectations

- There is no comprehensive automated test suite currently configured at repo root.
- For most changes, validate by:
  - `client`: `yarn lint` and `yarn build`
  - `server`: `yarn build`
  - Manual smoke check of GraphQL query/subscription flow when backend behavior changes.
- If you introduce non-trivial logic, add tests where practical rather than skipping validation.

## Workflow Preferences

- Use plan mode for multi-step or architecture-impacting work before editing.
- Keep commits scoped and descriptive (`feat:`, `fix:`, `chore:` style).
- Do not run destructive git commands unless explicitly requested.
- Do not push or create PRs unless the user asks.

## Git Commit Guidelines

- Write clear, concise commit messages with conventional prefixes (`feat:`, `fix:`, `chore:`).
- Focus commit messages on what changed and why.
- Before pushing, validate relevant parts of the project:
  - `client`: `yarn lint && yarn build`
  - `server`: `yarn build`
- If a push is requested, run `git pull --rebase` first when appropriate.

## Task and PR Workflow (for larger requests)

When the user asks for a long-running task or multi-step project, use this workflow:

### 1. Plan

- Switch to plan mode before implementation.
- Break work into small, reviewable tasks.
- Confirm the plan with the user when scope is non-trivial.

### 2. Create GitHub Issue (if requested)

```bash
gh issue create --title "feat: <short description>" --body "$(cat <<'EOF'
## Summary
<1-2 sentence overview>

## Tasks
- [ ] Task 1
- [ ] Task 2
EOF
)"
```

### 3. Implement per task

1. **Worktree** - prefer isolated feature worktrees:
   ```bash
   git worktree add ../antennae-feat-<issue-number>-<short-slug> -b feat/<issue-number>-<short-slug> main
   ```
2. **Code** - implement with focused, incremental commits.
3. **Validate** - run:
   ```bash
   cd client && yarn lint && yarn build
   cd ../server && yarn build
   ```
4. **Push** - when requested:
   ```bash
   git push -u origin HEAD
   ```

### 4. Open Pull Request (when requested)

```bash
gh pr create --title "feat: <description>" --body "$(cat <<'EOF'
## Summary
<what this PR does>

Closes #<issue-number>

## Open Questions
- (remove if none)
EOF
)"
```

- If blocking open questions remain, do not merge.
- If no blockers remain, merge and update related issue checklist items.

### 5. Merge and Clean Up (when requested)

- `gh pr merge --squash --delete-branch`
- `git worktree remove ../antennae-feat-<issue-number>-<short-slug>`
- Close issue when all tasks are complete: `gh issue close <number>`

### Key Principles

- Use worktrees rather than switching the main checkout for feature tasks.
- Keep one branch per task.
- Prefer small, atomic commits.

## Notes for Agents

- Existing runtime centers on stream proxying + metadata subscriptions; Prisma schema may exist but is not part of the current request flow.
- Default to preserving existing API shape unless the user explicitly asks for schema/contract changes.
