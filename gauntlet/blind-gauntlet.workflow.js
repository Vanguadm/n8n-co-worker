export const meta = {
  name: 'n8n-skill-blind-gauntlet',
  description: 'Blind 20-20-20-10 gauntlet to author the best n8n Claude-Code skill: 3 rounds of 20 blind builders culled each round, semifinal trim, 10 final judges, synthesis',
  phases: [
    { title: 'Round 1', detail: '20 blind builders + cull to 5' },
    { title: 'Round 2', detail: '20 blind builders + cull to 5' },
    { title: 'Round 3', detail: '20 blind builders + cull to 5' },
    { title: 'Semifinal', detail: 'trim 15 finalists to 5' },
    { title: 'Final Judges', detail: '10 judges rank finalists' },
    { title: 'Synthesis', detail: 'merge winner + grafts', model: 'opus' },
  ],
}

const BRIEF = [
  'TARGET: Author the single best Claude Code "skill" for working with n8n (the workflow automation tool). Output a COMPLETE SKILL.md (YAML frontmatter + full markdown body) ready to drop into ~/.claude/skills/.',
  '',
  'CONTEXT: An existing skill only AUDITS workflows (read-only review). It is competent but narrow. Known gaps you should consider addressing (you are NOT required to keep any existing structure):',
  '- Review-only: no help BUILDING/CREATING workflows or generating workflow JSON.',
  '- No coverage of n8n expression language: $json, $node, $items, $input, $workflow, $execution, $now, $vars; the Code node (JS/Python); Set / Edit Fields.',
  '- No coverage of modern n8n: AI Agent node, LangChain/AI nodes, vector stores, sub-workflow-as-tool, chat triggers.',
  '- No version/deprecation awareness (node typeVersion, n8n version differences, deprecated nodes).',
  '- Thin on security: webhook auth, credential scoping, expression injection, SSRF in HTTP Request.',
  '- No concrete good-vs-bad workflow JSON examples.',
  '- No programmatic creation guidance (n8n REST API, import/export, version control) or self-hosted vs cloud differences.',
  '- Discovery only triggers on review/debug intents, not BUILD intents.',
  '',
  'REQUIREMENTS (all mandatory):',
  '- Valid frontmatter: name uses letters/numbers/hyphens only; description starts with "Use when..."; third person; TRIGGERS ONLY (no summary of the workflow/process); under 1024 chars.',
  '- Genuinely useful to an agent that must BUILD, REVIEW, and DEBUG n8n workflows.',
  '- ACCURACY over coverage: do NOT invent node names, parameters, or n8n features. If unsure or version-sensitive, say so and list it in riskyClaims.',
  '- Token-aware: keep SKILL.md tight; push heavy reference into a described "Supporting files" section (describe their intended contents) rather than inlining everything.',
  '- Concrete over vague: include at least one real worked example (annotated JSON or exact node config).',
  '',
  'YOU ARE BLIND: you cannot see the existing skill text or any other author’s draft. Produce your strongest independent take from this brief alone.',
].join('\n')

const RUBRIC = [
  'Score each dimension 0-5 unless noted:',
  '- Accuracy (correct, real n8n nodes/params/features; zero invention) [WEIGHT x2]',
  '- Build usefulness (helps generate/construct workflows + valid JSON)',
  '- Review usefulness (audits workflows for errors and best practices)',
  '- Debug usefulness (diagnoses failures from errors / partial info)',
  '- Modern coverage (AI Agent/LangChain nodes, expressions, Code node) WITHOUT bloat',
  '- Discovery/triggering (frontmatter description quality across build+review+debug)',
  '- Token efficiency & structure (tight, scannable, good supporting-file use)',
  '- Concreteness (worked examples, exact fixes, good-vs-bad JSON)',
  'Penalize hard: invented/incorrect facts, bloat, vague advice, broken frontmatter rules.',
].join('\n')

const LENSES = [
  'Builder-first: optimize for generating correct workflow JSON from a plain-English spec.',
  'Reviewer/auditor-first: deep best-practice audit across error/perf/structure categories.',
  'Debugger-first: diagnosing failing workflows from errors, logs, and partial info.',
  'AI-workflows specialist: AI Agent node, LangChain nodes, RAG/vector stores, tools.',
  'Expression-language expert: master $json/$node/$items/$input and the Code node.',
  'Security-first: credentials, webhook auth, expression injection, SSRF, least privilege.',
  'Beginner-friendly teacher: scaffold a non-expert to a working, safe workflow.',
  'Expert-terse: minimal tokens, maximal signal for a senior automation engineer.',
  'Example-driven: teach via annotated good-vs-bad JSON snippets.',
  'Production-reliability: error workflows, retries, idempotency, monitoring, alerting.',
  'Performance/cost: API-call minimization, batching, pagination, execution efficiency.',
  'Maintainability/architecture: naming, sub-workflows, sticky notes, env config.',
  'Integration-recipe: common stacks (webhook->HTTP->Slack/DB/Sheets/Airtable) patterns.',
  'Programmatic/devops: n8n REST API, import/export, version control of workflows, CI.',
  'Self-hosted vs cloud: deployment-aware guidance, queue mode, env vars, scaling.',
  'Decision-routing: when to use which node (IF/Switch/Merge/Loop/Code/Execute Workflow).',
  'Discovery-optimized: nail triggering across build, review, and debug intents.',
  'Holistic generalist: balanced build+review+debug, no single bias.',
  'Anti-pattern hunter: catalog n8n footguns and their exact fixes.',
  'Workflow-lifecycle: design -> build -> test -> harden -> maintain, end to end.',
]

const CANDIDATE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['skillMarkdown', 'abstract', 'selfScores', 'riskyClaims'],
  properties: {
    skillMarkdown: { type: 'string', description: 'The COMPLETE SKILL.md: YAML frontmatter + full markdown body.' },
    abstract: { type: 'string', description: 'Up to 120 words: your design approach, scope, and why it is the best.' },
    selfScores: {
      type: 'object', additionalProperties: false,
      required: ['accuracy', 'build', 'review', 'debug', 'modern', 'discovery', 'efficiency', 'concreteness'],
      properties: {
        accuracy: { type: 'number' }, build: { type: 'number' }, review: { type: 'number' },
        debug: { type: 'number' }, modern: { type: 'number' }, discovery: { type: 'number' },
        efficiency: { type: 'number' }, concreteness: { type: 'number' },
      },
    },
    riskyClaims: { type: 'array', items: { type: 'string' }, description: 'n8n facts you are NOT fully sure about / version-sensitive. Empty array if none.' },
  },
}

const CULL_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['ranking'],
  properties: {
    ranking: {
      type: 'array', description: 'Your top 6 candidates, best first.',
      items: {
        type: 'object', additionalProperties: false, required: ['id', 'score', 'why'],
        properties: { id: { type: 'string' }, score: { type: 'number', description: '0-10' }, why: { type: 'string' } },
      },
    },
  },
}

const JUDGE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['ballot', 'winner', 'grafts'],
  properties: {
    ballot: {
      type: 'array', description: 'All finalists ranked, rank 1 = best.',
      items: {
        type: 'object', additionalProperties: false, required: ['fid', 'rank', 'total'],
        properties: { fid: { type: 'string' }, rank: { type: 'number' }, total: { type: 'number', description: 'weighted 0-100' } },
      },
    },
    winner: { type: 'string', description: 'fid of the single best finalist.' },
    grafts: { type: 'array', items: { type: 'string' }, description: 'Specific strong sections/ideas from NON-winning finalists worth merging into the winner.' },
  },
}

const SYNTH_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['name', 'finalSkillMarkdown', 'changelog', 'openQuestions'],
  properties: {
    name: { type: 'string', description: 'kebab-case skill folder name (letters/numbers/hyphens only).' },
    finalSkillMarkdown: { type: 'string', description: 'The complete final SKILL.md.' },
    changelog: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
}

const selfTotal = (c) => {
  const s = c.selfScores || {}
  return Object.keys(s).reduce((a, k) => a + (Number(s[k]) || 0), 0)
}

function builderPrompt(round, i, lens) {
  return BRIEF +
    '\n\n---\nROUND ' + round + ' / BUILDER #' + i +
    '\nYOUR ASSIGNED LENS: ' + lens +
    '\nCommit to your lens (bring an angle distinct from the obvious) while still meeting EVERY requirement above. Do not collapse into a bland generic skill unless your lens is the generalist.' +
    '\nReturn: skillMarkdown (complete SKILL.md with real frontmatter + body), a <=120 word abstract, honest selfScores (0-5 each), and riskyClaims.'
}

function cullPrompt(round, j, listing) {
  return 'You are cull-judge #' + j + ' for round ' + round + ' of a blind gauntlet selecting the best n8n Claude-Code skill.\n' +
    'You see ABSTRACTS + self-scores only (full text withheld at this stage). Judge design soundness, scope usefulness (build+review+debug), modern-n8n awareness, and accuracy discipline (penalize many risky/unsure claims).\n\n' +
    'RUBRIC:\n' + RUBRIC + '\n\nCANDIDATES:\n' + listing + '\n\n' +
    'Return your top 6 candidate ids (best first) with a 0-10 score and one-line why for each. Use the EXACT ids shown.'
}

function semiPrompt(j, listing) {
  return 'You are semifinal-judge #' + j + '. From the surviving pool across all 3 rounds, pick the 6 strongest to advance to final judging.\n\n' +
    'RUBRIC:\n' + RUBRIC + '\n\nPOOL:\n' + listing + '\n\n' +
    'Return top 6 ids (best first) with a 0-10 score + one-line why. Use the EXACT ids shown.'
}

function judgePrompt(j, finalText) {
  return 'You are final-judge #' + j + ' in a blind gauntlet selecting the single best n8n Claude-Code skill. Read the FULL text of every finalist below and rank them.\n\n' +
    'RUBRIC (ACCURACY is weighted DOUBLE; an invented node/param or wrong n8n fact is a serious penalty):\n' + RUBRIC + '\n\n' +
    'Act as a harsh senior n8n engineer. Verify claims against your own n8n knowledge; downgrade anything that looks invented or version-confused. Reward concrete worked examples and clean discovery/frontmatter.\n\n' +
    'FINALISTS:\n' + finalText + '\n\n' +
    'Return a full ranked ballot (rank 1 = best) with a weighted total 0-100 per fid, the winner fid, and grafts = specific strong sections/ideas from NON-winning finalists worth merging into the winner.'
}

function synthPrompt(winnerMd, runnersUp, grafts) {
  return 'You are the synthesis lead. The gauntlet selected a WINNING n8n skill. Produce the FINAL, production-ready SKILL.md using the winner as the backbone and grafting in the specific strong ideas the judges flagged from runners-up — only where they add real value without bloat or contradiction.\n\n' +
    'HARD RULES:\n' +
    '- Frontmatter valid: name (letters/numbers/hyphens), description starts with "Use when...", third person, TRIGGERS ONLY (no workflow summary), under 1024 chars.\n' +
    '- ACCURACY over coverage. Remove or hedge any claim you cannot stand behind about real n8n nodes/params/features. Do NOT invent.\n' +
    '- Keep it token-tight; push heavy reference into a described "Supporting files" section rather than inlining everything.\n' +
    '- Preserve the winner’s best worked example(s).\n\n' +
    'JUDGE-FLAGGED GRAFTS:\n- ' + (grafts.length ? grafts.join('\n- ') : '(none)') + '\n\n' +
    '===== WINNER (backbone) =====\n' + winnerMd + '\n\n' +
    '===== RUNNERS-UP (graft source) =====\n' + runnersUp + '\n\n' +
    'Return: name (kebab-case), finalSkillMarkdown (complete), changelog (what you merged/changed vs the winner), openQuestions (anything needing human / n8n-version verification).'
}

async function runRound(round) {
  const phaseName = 'Round ' + round
  phase(phaseName)
  const built = await parallel(LENSES.map((lens, i) => () =>
    agent(builderPrompt(round, i, lens), {
      label: 'build:R' + round + '-' + i, phase: phaseName,
      schema: CANDIDATE_SCHEMA, model: 'sonnet', effort: 'medium',
    })
  ))
  const cands = built.map((c, i) => c ? Object.assign({}, c, { id: 'R' + round + '-' + i }) : null).filter(Boolean)
  if (!cands.length) { log('Round ' + round + ': all builders failed'); return [] }
  const listing = cands.map(c =>
    '### ' + c.id + '\nself-total: ' + selfTotal(c) + '\nabstract: ' + c.abstract +
    '\nrisky-claims: ' + ((c.riskyClaims && c.riskyClaims.length) ? c.riskyClaims.join(' | ') : 'none')
  ).join('\n\n')
  const panels = await parallel([0, 1, 2].map(j => () =>
    agent(cullPrompt(round, j, listing), {
      label: 'cull:R' + round + '-j' + j, phase: phaseName,
      schema: CULL_SCHEMA, model: 'sonnet', effort: 'low',
    })
  ))
  const score = {}
  panels.filter(Boolean).forEach(p => (p.ranking || []).forEach(r => {
    if (r && r.id) score[r.id] = (score[r.id] || 0) + (Number(r.score) || 1)
  }))
  const ranked = cands.map(c => ({ c, s: score[c.id] || 0 })).sort((a, b) => b.s - a.s)
  const top = ranked.slice(0, 5).map(x => x.c)
  log('Round ' + round + ': ' + cands.length + ' built, carried ' + top.length + ' forward')
  return top
}

const r1 = await runRound(1)
const r2 = await runRound(2)
const r3 = await runRound(3)
const pool = [...r1, ...r2, ...r3]
log('Pool after 3 rounds: ' + pool.length + ' finalists')

phase('Semifinal')
const semiListing = pool.map(c =>
  '### ' + c.id + '\nself-total: ' + selfTotal(c) + '\nabstract: ' + c.abstract +
  '\nrisky-claims: ' + ((c.riskyClaims && c.riskyClaims.length) ? c.riskyClaims.join(' | ') : 'none')
).join('\n\n')
const semiPanels = await parallel([0, 1, 2].map(j => () =>
  agent(semiPrompt(j, semiListing), { label: 'semi-j' + j, phase: 'Semifinal', schema: CULL_SCHEMA, model: 'sonnet', effort: 'medium' })
))
const semiScore = {}
semiPanels.filter(Boolean).forEach(p => (p.ranking || []).forEach(r => {
  if (r && r.id) semiScore[r.id] = (semiScore[r.id] || 0) + (Number(r.score) || 1)
}))
const finalists = pool.map(c => ({ c, s: semiScore[c.id] || 0 })).sort((a, b) => b.s - a.s).slice(0, 5).map(x => x.c)
finalists.forEach((c, i) => { c.fid = 'F' + (i + 1) })
log('Semifinal selected: ' + finalists.map(c => c.fid + '(' + c.id + ')').join(', '))

phase('Final Judges')
const finalText = finalists.map(c => '===== CANDIDATE ' + c.fid + ' (origin ' + c.id + ') =====\n' + c.skillMarkdown).join('\n\n')
const ballots = await parallel(Array.from({ length: 10 }, (_, j) => () =>
  agent(judgePrompt(j, finalText), { label: 'judge-' + j, phase: 'Final Judges', schema: JUDGE_SCHEMA, effort: 'high' })
))
const borda = {}
const allGrafts = []
ballots.filter(Boolean).forEach(b => {
  (b.ballot || []).forEach(x => { if (x && x.fid) borda[x.fid] = (borda[x.fid] || 0) + Math.max(0, 6 - (Number(x.rank) || 6)) })
  ;(b.grafts || []).forEach(g => { if (g) allGrafts.push(g) })
})
const leaderboard = finalists.map(c => ({ fid: c.fid, origin: c.id, pts: borda[c.fid] || 0 })).sort((a, b) => b.pts - a.pts)
const winner = finalists.find(c => c.fid === leaderboard[0].fid) || finalists[0]
log('Winner: ' + winner.fid + ' (origin ' + winner.id + '), ' + (leaderboard[0] ? leaderboard[0].pts : 0) + ' Borda pts')

phase('Synthesis')
const runnersUp = finalists.filter(c => c.fid !== winner.fid).map(c => '===== ' + c.fid + ' =====\n' + c.skillMarkdown).join('\n\n')
const dedupGrafts = Array.from(new Set(allGrafts))
const synth = await agent(synthPrompt(winner.skillMarkdown, runnersUp, dedupGrafts), {
  label: 'synthesis', phase: 'Synthesis', schema: SYNTH_SCHEMA, effort: 'high',
})

return {
  leaderboard,
  winnerOrigin: winner.id,
  finalName: synth ? synth.name : null,
  finalSkillMarkdown: synth ? synth.finalSkillMarkdown : winner.skillMarkdown,
  changelog: synth ? synth.changelog : [],
  openQuestions: synth ? synth.openQuestions : [],
  topGrafts: dedupGrafts.slice(0, 25),
  finalists: finalists.map(c => ({ fid: c.fid, origin: c.id, abstract: c.abstract, skillMarkdown: c.skillMarkdown })),
}
