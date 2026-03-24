/**
 * Discovery Workspace — AI Assist Routes
 *
 * Mounted under /api/projects/:projectId/discovery (mergeParams: true)
 *
 *   POST /ai/suggest-tags        — AI suggests tag groupings
 *   POST /ai/suggest-architecture — AI proposes subsystem breakdown
 *   POST /ai/whats-next          — AI reviews maturity/confidence → next actions
 */

const express = require('express');
const router  = express.Router({ mergeParams: true });
let OpenAI;
try { OpenAI = require('openai'); } catch (e) { OpenAI = null; }
const { getProjectRole } = require('../middleware/rbac');

function getOpenAI() {
  if (!OpenAI || !process.env.OPENAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://polsia.com/ai/openai/v1',
  });
}

async function callAI(system, user, taskTag, maxTokens = 1800) {
  const openai = getOpenAI();
  if (!openai) {
    return JSON.stringify({ error: 'AI not configured', hint: 'Set OPENAI_API_KEY environment variable' });
  }
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.4,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  }, { headers: { 'x-task': taskTag } });
  const raw = completion.choices[0]?.message?.content || '{}';
  try { return JSON.parse(raw); }
  catch (e) { return { error: 'Parse failed', raw: raw.slice(0, 400) }; }
}

// ── Access guard ───────────────────────────────────────────────────────────────
async function requireAccess(req, res) {
  const pool      = req.app.locals.pool;
  const userId    = req.user?.id || null;
  const projectId = parseInt(req.params.projectId);

  if (!projectId || isNaN(projectId)) {
    res.status(400).json({ success: false, message: 'Invalid project id' });
    return null;
  }

  const [prRows] = await pool.query(
    `SELECT p.*, t.is_demo FROM projects p LEFT JOIN teams t ON t.id = p.team_id WHERE p.id = ?`,
    [projectId]
  );
  if (!prRows.length) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return null;
  }
  if (prRows[0].is_demo) return { projectId, role: 'viewer' };

  const role = await getProjectRole(pool, projectId, userId);
  if (!role) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return null;
  }
  return { projectId, role };
}

// ── Shared: fetch context ─────────────────────────────────────────────────────
async function fetchContext(pool, projectId) {
  const [rows] = await pool.query(
    `SELECT id, type, title, description, maturity, confidence, tags, promoted_node_id
     FROM discovery_objects
     WHERE project_id = ?
     ORDER BY type, title`,
    [projectId]
  );
  return rows;
}

function buildSummary(objects) {
  const byType = {};
  objects.forEach(o => {
    if (!byType[o.type]) byType[o.type] = [];
    byType[o.type].push(o);
  });

  const lines = [];
  Object.entries(byType).forEach(([type, objs]) => {
    lines.push(`\n${type.replace(/_/g, ' ').toUpperCase()} (${objs.length}):`);
    objs.forEach(o => {
      const promoted = o.promoted_node_id ? ' [PROMOTED]' : '';
      const tags = Array.isArray(o.tags) && o.tags.length ? ` | tags: ${o.tags.join(', ')}` : '';
      lines.push(`  - [${o.id}] "${o.title}" | maturity: ${o.maturity} | confidence: ${o.confidence}${tags}${promoted}`);
      if (o.description) lines.push(`    ${o.description.slice(0, 120)}`);
    });
  });
  return lines.join('\n');
}

// ── POST .../ai/suggest-tags ──────────────────────────────────────────────────
router.post('/ai/suggest-tags', async (req, res) => {
  const ctx = await requireAccess(req, res);
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;

  try {
    const objects = await fetchContext(pool, projectId);
    const active  = objects.filter(o => !o.promoted_node_id);

    if (active.length < 2) {
      return res.status(400).json({ success: false, message: 'Need at least 2 objects to suggest groupings.' });
    }

    const summary = buildSummary(active);

    const system = `You are an expert systems engineer. The user has a Discovery Workspace with raw design objects. Analyze them and suggest functional tag groupings to help organize thinking.

Return ONLY valid JSON:
{
  "tag_groups": [
    {
      "tag": "short-kebab-tag (2-3 words)",
      "label": "Human-readable label",
      "rationale": "Why these objects belong together",
      "color": "#hexcolor",
      "object_ids": [1, 2, 3]
    }
  ],
  "reasoning": "Overall grouping strategy (1-2 sentences)"
}

Rules:
- 2-6 groups max, min 2 objects per group
- Tags are kebab-case, short (e.g. "propulsion", "control-system", "structural")
- Colors should be visually distinct
- Group by function, not by object type`;

    const user = `Suggest functional tag groups:\n${summary}`;
    const result = await callAI(system, user, 'factoryos-disc-suggest-tags');
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[DiscAI] suggest-tags error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST .../ai/suggest-architecture ─────────────────────────────────────────
router.post('/ai/suggest-architecture', async (req, res) => {
  const ctx = await requireAccess(req, res);
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;

  try {
    const objects = await fetchContext(pool, projectId);
    const active  = objects.filter(o => !o.promoted_node_id);

    if (active.length < 3) {
      return res.status(400).json({ success: false, message: 'Need at least 3 objects to suggest an architecture.' });
    }

    const summary = buildSummary(active);

    const system = `You are a senior systems architect. Analyze discovery objects and propose a system architecture breakdown. Be opinionated — pick one architecture, don't hedge.

Return ONLY valid JSON:
{
  "architecture_name": "Short name",
  "description": "2-3 sentences on the approach",
  "subsystems": [
    {
      "name": "Subsystem name",
      "description": "What it does",
      "node_type_suggestion": "SYS|SUBSYS|SUBASSY",
      "object_ids": [1, 2],
      "confidence": "high|medium|low"
    }
  ],
  "gaps": ["Missing element (e.g., no control system defined)"],
  "promotion_candidates": [
    { "object_id": 1, "object_title": "...", "suggested_node_type": "SUBSYS", "reason": "..." }
  ],
  "reasoning": "Architectural rationale (2-3 sentences)"
}

Valid node_type_suggestion values: SYS, ASSY, SUBSYS, SUBASSY, COMP, PURCH`;

    const user = `Propose a system architecture:\n${summary}`;
    const result = await callAI(system, user, 'factoryos-disc-suggest-arch', 2200);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[DiscAI] suggest-architecture error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST .../ai/whats-next ────────────────────────────────────────────────────
router.post('/ai/whats-next', async (req, res) => {
  const ctx = await requireAccess(req, res);
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;

  try {
    const objects = await fetchContext(pool, projectId);
    if (!objects.length) {
      return res.status(400).json({ success: false, message: 'No discovery objects yet.' });
    }

    const active   = objects.filter(o => !o.promoted_node_id);
    const promoted = objects.filter(o =>  o.promoted_node_id);
    const summary  = buildSummary(active);

    const system = `You are a senior systems engineer reviewing a Discovery Workspace. Tell the engineer exactly what to do next. Be direct.

Return ONLY valid JSON:
{
  "overall_status": "exploring|converging|ready_to_promote|stalled",
  "summary": "2-3 sentences on overall health",
  "promote_now": [
    { "object_id": 1, "object_title": "...", "suggested_node_type": "SUBSYS", "reason": "..." }
  ],
  "test_next": [
    { "object_id": 1, "object_title": "...", "action": "Specific experiment to run", "why": "..." }
  ],
  "deprioritize": [
    { "object_id": 1, "object_title": "...", "reason": "Why to de-prioritize" }
  ],
  "add_missing": ["Specific missing design area"],
  "next_action": "Single most important thing to do right now (imperative)"
}

Rules:
- promote_now: only promotable/formal objects with medium+ confidence
- test_next: developing/raw objects needing validation
- deprioritize: raw/low-confidence objects with unclear value
- Be direct — reference actual object titles`;

    const user = `Review this discovery workspace:\n${summary}\n\nAlready promoted: ${promoted.length} objects`;
    const result = await callAI(system, user, 'factoryos-disc-whats-next', 1800);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[DiscAI] whats-next error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
