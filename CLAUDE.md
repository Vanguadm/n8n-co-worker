# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is **not an application** — it is a single Claude Code *skill*. The deliverable is [`SKILL.md`](./SKILL.md): a ~570-line reference that makes an agent a competent n8n co-worker (build / review / debug n8n workflows). There is **no build, lint, or test toolchain**; "the product" is the Markdown file and its accuracy.

The skill's registered/folder name is **`n8n-workflow-engineer`** (the GitHub repo is `n8n-co-worker`). **This repository root is also the live skill directory** (`~/.claude/skills/n8n-workflow-engineer/`), so editing `SKILL.md` here changes the installed skill immediately for the local user.

| File | Role |
|------|------|
| `SKILL.md` | The skill. Frontmatter (`name` + folded `description`) then 17 numbered sections + a "Build From Scratch" quick reference. |
| `gauntlet/blind-gauntlet.workflow.js` | The reproducible process that *generated* the current `SKILL.md` (see below). |
| `docs/blind-gauntlet.md` | Human-readable writeup of that process + this run's results. |
| `README.md` | Public overview / install instructions. |

## Improving the skill — the blind gauntlet

Substantive improvements are made by **competition, not single-pass editing**. The mechanism is `gauntlet/blind-gauntlet.workflow.js`, a Claude Code **Workflow** script (run via the `Workflow` tool, which requires explicit user opt-in):

- 3 rounds × 20 *blind* builders (each blind to the current `SKILL.md` and to each other, each pinned to a distinct design `LENS`) → cull to top 5/round → semifinal trim → **10 judges** (accuracy weighted ×2) → 1 synthesis agent merges the winner + grafts.
- To re-target it (different skill, different emphasis), edit only the `BRIEF`, `LENSES`, and `RUBRIC` constants at the top; everything downstream is generic.
- ~80+ agents per run is expected and intended. Builders run on Sonnet (cheap diversity); final judges + synthesis on Opus.

After any gauntlet, **do a human vetting pass before deploying** — synthesis reliably leaks artifacts (e.g. a rubric word landing in the `description`, a non-spec frontmatter key, plausible-but-wrong JSON). The 10-judge panel is the verification step in lieu of formal RED subagent tests.

## Editing disciplines (these cause real defects if ignored)

- **Accuracy over coverage.** n8n node names, parameters, and env-var names are version-sensitive. **Never invent them.** Flag anything uncertain inline; the skill maintains an explicit "verify against your instance" posture. Known landmines that have already bitten this skill:
  - Retry is a **node-level** setting (`retryOnFail` / `maxTries` / `waitBetweenTries`, siblings of `parameters`) — *not* `parameters.options.retry`.
  - `N8N_BLOCK_ENV_ACCESS_IN_NODE` only blocks `$env` inside the Code node; it is **not** an SSRF/network control. SSRF uses `N8N_SSRF_BLOCKED_IP_RANGES`.
  - All LangChain node `type` strings use the `@n8n/n8n-nodes-langchain.*` prefix; base nodes use `n8n-nodes-base.*`.
- **Frontmatter is `name` + `description` only.** `description` must start with "Use when…", be third person, list triggers only (no workflow summary), and stay under 1024 chars. Do **not** add non-spec keys (a `triggers:` array slipped in once and had to be removed).
- **Token discipline.** Keep `SKILL.md` tight. Heavy reference belongs in supporting files. §17 lists planned supporting files that **do not exist yet** — don't reference them as if present, and don't inline their full contents.

## Deploy / conventions

- Deploy (when the repo lives elsewhere): `cp SKILL.md ~/.claude/skills/n8n-workflow-engineer/SKILL.md`, then restart Claude Code.
- Default branch is **`main`**. Gauntlet finalists are kept locally as `candidate/F1..F5` branches off the baseline for side-by-side diffing (`git diff main candidate/F3`); only `main` is pushed.
- Do **not** add a `Co-Authored-By: Claude` trailer to commits.
