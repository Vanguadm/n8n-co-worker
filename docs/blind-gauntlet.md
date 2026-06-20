# The Blind Gauntlet (20-20-20-10)

How [`SKILL.md`](../SKILL.md) in this repo was produced — a reproducible multi-agent method for authoring or improving a single high-stakes artifact (here, a Claude Code skill) by **competition** rather than single-pass generation.

## Why

A single agent writing a skill anchors on its first idea and on whatever already exists. The blind gauntlet instead generates many independent attempts, makes them compete under adversarial judging, and synthesizes a winner from the best of the field. **"Blind"** means builders never see the existing artifact or each other's drafts — so the field stays genuinely diverse instead of converging on one template.

## The shape: 20-20-20-10

| Phase | Agents | What happens |
|-------|--------|--------------|
| Round 1 | 20 builders | Each gets the shared brief + a distinct design *lens*; writes a complete `SKILL.md` blind. A 3-judge panel culls to the top 5 (scored on abstracts + self-scores). |
| Round 2 | 20 builders | Same, fresh field. Cull to top 5. |
| Round 3 | 20 builders | Same, fresh field. Cull to top 5. |
| Semifinal | 3 judges | Trim the 15 survivors to 5 finalists. |
| Final | 10 judges | Read all 5 finalists *in full*, rank by rubric (accuracy ×2), Borda-aggregate → winner + "grafts" worth stealing from runners-up. |
| Synthesis | 1 agent | Merge winner (backbone) + judge-flagged grafts → final `SKILL.md`. |

The headline "20-20-20-10" is the three builder rounds plus the final judge panel. Builders ran on a fast model (Sonnet) for cheap diversity; final judges and synthesis on the stronger model (Opus), where discrimination matters.

## The brief (what every builder optimized for)

Builders were told to produce the single best n8n Claude-Code skill — useful for **building, reviewing, and debugging** — under hard requirements: valid skill frontmatter, **accuracy over coverage** (no invented nodes/params; flag anything version-sensitive), token-tight, and at least one real worked example. They were given the *gaps* in the old audit-only skill but **not its text**.

## Design lenses (forced diversity)

Each builder slot was pinned to a different lens so 60 builders didn't all write the same skill:

> builder-first · reviewer-first · debugger-first · AI-workflows · expression-language · security · beginner-teacher · expert-terse · example-driven · production-reliability · performance/cost · maintainability · integration-recipe · programmatic/devops · self-hosted-vs-cloud · decision-routing · discovery-optimized · generalist · anti-pattern-hunter · workflow-lifecycle

## Judging rubric

Scored 0–5 per dimension, **accuracy weighted ×2**: accuracy (real nodes/params, zero invention), build usefulness, review usefulness, debug usefulness, modern coverage (AI/LangChain, expressions, Code node) without bloat, discovery/triggering, token efficiency/structure, concreteness. Heavy penalties for invented facts, bloat, vague advice, and broken frontmatter rules.

## Results (this run)

**83 agents · ~2.97M output tokens · ~1h53m · 1,206 tool uses.**

Winner: **F5** — a round-3 reviewer/auditor-first builder, 40 Borda points.

| Finalist | Origin | Lens | Borda |
|----------|--------|------|-------|
| **F5 (winner)** | R3-1 | reviewer / auditor-first | 40 |
| F3 | R3-7 | expert-terse, full-lifecycle | 34 |
| F1 | R3-3 | AI-workflows specialist | 33 |
| F4 | R2-3 | AI-workflows specialist | 30 |
| F2 | R2-18 | anti-pattern hunter | 13 |

Synthesis used F5 as the backbone and grafted in: F4's resource-locator / RAG-as-tool detail, F2's anti-pattern catalog, and F3's `typeVersion` behavior tables + debug-triage table.

## What the accuracy weighting caught

Because accuracy was weighted double and judges were instructed to refute invented facts, the field's hallucinations were removed before deploy:

- A fabricated `CVE-2025-68613` + "fixed in v1.122.0" claim — **dropped**.
- A bogus commit-hash citation — **dropped**.
- An invented SSRF env var and a misapplied one (`N8N_BLOCK_ENV_ACCESS_IN_NODE` only blocks `$env` inside the Code node; it is *not* a network-egress control) — **corrected** to the doc-verified `N8N_SSRF_BLOCKED_IP_RANGES`.
- LangChain node types — **normalized** to the `@n8n/n8n-nodes-langchain.*` prefix.

A final human pass added four fixes the agents missed: removed a rubric word (`Third person.`) that leaked into the frontmatter `description`, removed a non-spec `triggers:` key, corrected HTTP retry to the node-level shape (`retryOnFail` / `maxTries` / `waitBetweenTries`, not `options.retry`), and reworded the supporting-files section so it doesn't promise files that don't exist yet.

## Reproduce it

The exact orchestration is in [`../gauntlet/blind-gauntlet.workflow.js`](../gauntlet/blind-gauntlet.workflow.js) — a Claude Code **Workflow** script (run via the `Workflow` tool). To adapt it to a different skill or artifact, edit the `BRIEF`, `LENSES`, and `RUBRIC` constants at the top and re-run; everything downstream (rounds, culling, judging, synthesis) is generic.

Built with Claude Code's multi-agent Workflow orchestration (Opus 4.8).
