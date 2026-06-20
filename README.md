# n8n-co-worker

A Claude Code **skill** that turns an agent into a competent n8n co-worker — it can **build, review, and debug** n8n workflows, not just audit them.

The skill itself is a single file: [`SKILL.md`](./SKILL.md). It was produced by a multi-agent *blind gauntlet* process, documented in [`docs/blind-gauntlet.md`](./docs/blind-gauntlet.md), with the reproducible workflow in [`gauntlet/`](./gauntlet).

## What it does

When loaded, the skill gives the agent working knowledge of:

- **Build** — workflow JSON anatomy (nodes / connections / `typeVersion`), the expression language (`$json`, `$node`, `$items`, Code node JS & Python), Set/Edit Fields, IF/Switch/Merge/Loop routing, plus a worked annotated webhook workflow.
- **AI workflows** — the LangChain cluster-node model (root nodes + typed `ai_*` ports), `$fromAI()`, the resource-locator (`__rl`) format, sub-workflow-as-tool, and a full runnable RAG Tools-Agent example (ingestion + query).
- **Review / audit** — structured checklists for error handling, security (webhook HMAC, credential scoping, SSRF, expression injection), and performance/structure, plus an anti-pattern catalog.
- **Debug** — a common-bugs triage table and version/deprecation awareness (typeVersion behavior shifts).
- **Operate** — the REST API + CLI for programmatic workflow management, and self-hosted vs cloud differences.

## Install (Claude Code)

Skills live in `~/.claude/skills/<name>/`. To install:

```bash
git clone https://github.com/Vanguadm/n8n-co-worker.git
mkdir -p ~/.claude/skills/n8n-workflow-engineer
cp n8n-co-worker/SKILL.md ~/.claude/skills/n8n-workflow-engineer/SKILL.md
```

Restart Claude Code. The skill auto-loads when you mention building, reviewing, or debugging an n8n workflow (see the `description` triggers in `SKILL.md`).

> The skill's registered/folder name is **`n8n-workflow-engineer`**; this repository is named `n8n-co-worker`.

## Accuracy note

n8n's node parameters and environment-variable names shift across versions. The skill flags version-sensitive claims inline and lists open items to verify against your own instance (SSRF / file-access env vars, agent `typeVersion`, `respondToWebhook` shape, n8n 2.0 migration). Treat generated JSON as a strong draft to validate, not as gospel.

## How it was built — the Blind Gauntlet

This skill started as a narrow, audit-only `n8n-workflow-reviewer`. It was rebuilt and broadened through a **20-20-20-10 blind gauntlet**: 3 rounds of 20 independent *blind* builder agents (each blind to the existing skill and to each other, each pinned to a distinct design lens), culled to the top 5 each round, then a semifinal trim and **10 final judges** (accuracy weighted ×2) selecting a winner, followed by a synthesis pass that grafts the best ideas from the runners-up.

- **83 agents · ~2.97M tokens · ~1h53m.**
- The accuracy weighting caught and removed several hallucinated facts before deploy.
- Full method, leaderboard, and reproducible script: **[docs/blind-gauntlet.md](./docs/blind-gauntlet.md)**.

## Repo layout

```
SKILL.md                              the skill (drop into ~/.claude/skills/)
docs/blind-gauntlet.md                the method used to build it
gauntlet/blind-gauntlet.workflow.js   reproducible Claude Code Workflow script
LICENSE
```

## License

See [LICENSE](./LICENSE).
