# AGENTS.md - Guidelines for Coding Assistant

## Project Nature

- `antennae.fm` is a single Next.js (App Router) internet radio app.
- The app serves both UI and backend endpoints from one codebase.
- Core runtime behavior:
  - Station listing via API route
  - Audio stream proxying for selected stations
  - Optional track metadata over SSE for supported streams

## Environment

- Node.js 20+
- pnpm 10+
- TypeScript
- Next.js + React
- Tailwind CSS
- Biome for formatting/linting

## Project Structure

```
app/                    — Next.js app router pages + API routes
app/api/stations/       — station listing endpoint
app/api/stream/[id]/    — stream proxy endpoint
app/api/metadata/[id]/  — SSE metadata endpoint
src/lib/stations.ts     — station source of truth
src/lib/radio.ts        — metadata service/parsing
src/hooks/useAudio.ts   — client playback hook
README.md               — setup/run documentation
```

## Development Commands

### Install dependencies

```bash
pnpm install
```

### Run locally

```bash
pnpm dev
```

### Build and quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Coding Guidelines

- Prefer minimal, targeted changes over broad rewrites.
- Keep naming consistent: camelCase for variables/functions, PascalCase for components/types.
- Keep imports at the top of files (no inline imports).
- Handle error paths explicitly.
- For stream changes:
  - Keep `src/lib/stations.ts` as source of truth.
  - Preserve `/api/stream/[id]` contract for proxied streams.
- For metadata changes:
  - Ensure unsupported streams gracefully fall back in UI.
  - Keep SSE payloads backward-compatible unless requested otherwise.

## Testing and Validation Expectations

- There is no comprehensive automated test suite currently configured.
- For most changes, validate with:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build` for integration-level confidence
- For playback/stream changes, perform a manual smoke test in browser.

## Workflow Preferences

- Use plan mode for multi-step or architecture-impacting work.
- Keep commits scoped and descriptive (`feat:`, `fix:`, `chore:` style).
- Do not run destructive git commands unless explicitly requested.
- Do not push or create PRs unless the user asks.

## Git Commit Guidelines

- Write clear, concise commit messages with conventional prefixes (`feat:`, `fix:`, `chore:`).
- Focus commit messages on what changed and why.
- Before pushing, validate relevant parts of the project:
  - `pnpm lint && pnpm typecheck && pnpm build`
- If a push is requested, run `git pull --rebase` first when appropriate.

## Task and PR Workflow (for larger requests)

When the user asks for a long-running task or multi-step project, use this workflow:

### 1. Plan

- Switch to plan mode before implementation.
- Break work into small, reviewable tasks.
- Confirm the plan with the user when scope is non-trivial.

### 2. Create GitHub Issue (if requested)

```bash
gh issue create --title "feat: <short description>" --body "$(cat <<'EOT'
## Summary
<1-2 sentence overview>

## Tasks
- [ ] Task 1
- [ ] Task 2
EOT
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
   pnpm lint && pnpm typecheck && pnpm build
   ```
4. **Push** - when requested:
   ```bash
   git push -u origin HEAD
   ```

### 4. Open Pull Request (when requested)

```bash
gh pr create --title "feat: <description>" --body "$(cat <<'EOT'
## Summary
<what this PR does>

Closes #<issue-number>

## Open Questions
- (remove if none)
EOT
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

- Prefer direct stream source updates in `src/lib/stations.ts` rather than ad hoc overrides.
- Keep playback resilient: unsupported metadata should never block audio playback.
