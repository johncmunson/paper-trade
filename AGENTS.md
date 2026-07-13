<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues are tracked as local Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five canonical label names. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses the single-context layout. See `docs/agents/domain.md`.

## Testing Layers

| Layer           | Testing dependencies                                                                       |
| --------------- | ------------------------------------------------------------------------------------------ |
| **Unit**        | `vitest`, optionally `@vitest/coverage-v8`; `msw` only for HTTP client/adapter boundaries. |
| **Integration** | `vitest`, optionally `@vitest/coverage-v8`.                                                |

## Additional notes

- Use `pnpm` and/or `pnpx` as opposed to `npm` or `yarn`.
- A dev server will always be running for you at `http://localhost:3000`
- If you ever need to run or execute Python, the command is `python3` and not `python`
- Never write db migrations manually. Instead, modify the db schema in `db/schema/` and then run `pnpm db:generate`.
- This project does not use CI. All testing, linting, and other checks are performed locally.
- Available subagents: planner, reviewer, researcher, scout, and worker. Agent skill files might mention other subagent types. Map them to one of the available subagents (task dependent).
