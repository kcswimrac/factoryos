const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Build OpenAI client using Polsia AI proxy
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://polsia.com/ai/openai/v1',
  });
}

// Phase display names
const PHASE_LABELS = {
  requirements: 'Requirements',
  rnd: 'R&D',
  design_cad: 'Design/CAD',
  data_collection: 'Data Collection',
  analysis_cae: 'Analysis/CAE',
  testing_validation: 'Testing/Validation',
  correlation: 'Correlation',
};

// Phase-specific guidance hints
const PHASE_HINTS = {
  requirements: 'Focus on completeness: every function needs a verifiable requirement. Check all SHALL requirements have a verification method.',
  rnd: 'At least 2 design options must be compared. A comparison matrix with criteria and scores is expected.',
  design_cad: 'A CAD file or hosted URL (Onshape/Fusion360) is required. Manufacturability and serviceability notes are best practice.',
  data_collection: 'Each data point needs a measurement method, tool, value, and confidence level. Raw data without context is not engineering.',
  analysis_cae: 'Analysis entries need assumptions stated, method documented (FEA/CFD/hand-calc), and confidence level. Uncited results cannot be defended.',
  testing_validation: 'Test results must be linked to requirements. Untested requirements cannot be verified. Pass/fail must be explicit.',
  correlation: 'Correlation closes the loop: predicted vs actual values. Gaps > 10% need an explanation.',
};

// ── Shared: Gather node context from DB ──────────────────────────────────────
async function buildNodeContext(pool, nodeId) {
  // 1. Fetch node
  const nodeResult = await pool.query(
    'SELECT n.*, p.name AS parent_name, p.type AS parent_type FROM nodes n LEFT JOIN nodes p ON n.parent_id = p.id WHERE n.id = $1',
    [nodeId]
  );
  if (nodeResult.rows.length === 0) return null;
  const node = nodeResult.rows[0];

  // 2. Fetch children count
  const childrenResult = await pool.query(
    'SELECT COUNT(*) AS cnt FROM nodes WHERE parent_id = $1',
    [nodeId]
  );
  const childCount = parseInt(childrenResult.rows[0].cnt, 10);

  // 3. Fetch phases
  const phasesResult = await pool.query(
    'SELECT phase, status, started_at, completed_at FROM node_phases WHERE node_id = $1 ORDER BY phase_order',
    [nodeId]
  );
  const phases = phasesResult.rows;

  // Determine active/current phase
  const activePhase = phases.find(p => p.status === 'in_progress')
    || phases.find(p => p.status === 'not_started')
    || phases[phases.length - 1];

  const completedPhases = phases.filter(p => p.status === 'complete').map(p => p.phase);
  const phasesInitialized = phases.length > 0;

  // 4. Fetch phase artifacts for all phases
  const artifactsResult = await pool.query(
    'SELECT phase, artifact_type, artifact_key, data FROM phase_artifacts WHERE node_id = $1',
    [nodeId]
  );
  const artifactsByPhase = {};
  for (const row of artifactsResult.rows) {
    if (!artifactsByPhase[row.phase]) artifactsByPhase[row.phase] = [];
    artifactsByPhase[row.phase].push({ type: row.artifact_type, key: row.artifact_key, data: row.data });
  }

  // 5. Fetch requirements
  const reqResult = await pool.query(
    'SELECT r.*, COUNT(rt.id) AS trace_count FROM requirements r LEFT JOIN requirement_traces rt ON rt.requirement_id = r.id WHERE r.node_id = $1 GROUP BY r.id',
    [nodeId]
  );
  const requirements = reqResult.rows;
  const reqTotal = requirements.length;
  const reqVerified = requirements.filter(r => r.status === 'verified').length;
  const reqWithTraces = requirements.filter(r => parseInt(r.trace_count, 10) > 0).length;
  const reqMissingVerification = requirements.filter(r => !r.verification_method).length;

  // 6. Build summaries
  const currentPhaseLabel = activePhase ? (PHASE_LABELS[activePhase.phase] || activePhase.phase) : 'Not initialized';
  const phaseHint = activePhase ? (PHASE_HINTS[activePhase.phase] || '') : '';

  const phaseSummary = phasesInitialized
    ? phases.map(p => `  - ${PHASE_LABELS[p.phase] || p.phase}: ${p.status}`).join('\n')
    : '  (Lifecycle not yet initialized)';

  const artifactSummary = Object.entries(artifactsByPhase).map(([phase, arts]) => {
    const artLines = arts.map(a => `    · ${a.type}/${a.key}: ${JSON.stringify(a.data).slice(0, 120)}`).join('\n');
    return `  ${PHASE_LABELS[phase] || phase}:\n${artLines}`;
  }).join('\n') || '  (No artifacts recorded)';

  const reqSummary = reqTotal === 0
    ? '  No requirements attached'
    : [
        `  Total: ${reqTotal}`,
        `  Verified: ${reqVerified}/${reqTotal}`,
        `  With traceability records: ${reqWithTraces}/${reqTotal}`,
        `  Missing verification method: ${reqMissingVerification}`,
        requirements.slice(0, 10).map(r =>
          `  · [${r.priority?.toUpperCase() || 'SHALL'}] ${r.req_id} — ${r.title} (${r.status}${r.verification_method ? ', ' + r.verification_method : ', NO VERIFY METHOD'})${parseInt(r.trace_count,10) > 0 ? ' [traced]' : ' [no traces]'}`
        ).join('\n'),
      ].filter(Boolean).join('\n');

  const contextBlock = `NODE
  Name: ${node.name}
  Part Number: ${node.part_number}
  Type: ${node.type}
  Description: ${node.description || '(none)'}
  Parent: ${node.parent_name ? `${node.parent_name} (${node.parent_type})` : 'Root level'}
  Children: ${childCount}

PHASE LIFECYCLE
  Current phase: ${currentPhaseLabel} (${activePhase?.status || 'N/A'})
  Completed phases: ${completedPhases.length > 0 ? completedPhases.map(p => PHASE_LABELS[p] || p).join(', ') : 'None'}
  All phases:
${phaseSummary}

REQUIREMENTS (${reqTotal} total)
${reqSummary}

ARTIFACTS
${artifactSummary}`;

  return {
    node,
    childCount,
    phases,
    activePhase,
    completedPhases,
    phasesInitialized,
    artifactsByPhase,
    requirements,
    reqTotal,
    reqVerified,
    reqWithTraces,
    reqMissingVerification,
    currentPhaseLabel,
    phaseHint,
    contextBlock,
  };
}

// ── Shared: Base engineering system prompt ────────────────────────────────────
const BASE_SYSTEM = `You are an expert engineering process coach embedded inside Factory-OS, a hardware engineering design lifecycle tool.

Engineering context:
- 7-phase lifecycle: Requirements → R&D → Design/CAD → Data Collection → Analysis/CAE → Testing/Validation → Correlation
- Hard gates enforce artifact completion before advancing phases
- Requirements have priority (SHALL/SHOULD/MAY), verification methods (test/inspection/analysis/demonstration), and status
- Traceability links requirements to phase evidence
- DOE (Design of Experiments) studies document structured experiments
- 8D reports handle systematic problem-solving investigations

You are NOT a generic assistant. You enforce engineering discipline like a senior engineer who has shipped hardware products. Be direct, specific, and opinionated. Reference the actual node data in all responses.`;

// ── MODE 1: Review My Node ────────────────────────────────────────────────────
function buildMode1Prompts(ctx) {
  const system = `${BASE_SYSTEM}

Phase hint for current phase: ${ctx.phaseHint}

Return ONLY valid JSON. No markdown. No explanation. Exact schema:
{
  "headline": "One-sentence status summary",
  "status": "on_track" | "needs_attention" | "blocked",
  "insights": [
    {
      "type": "warning" | "suggestion" | "good",
      "title": "Short title (4-6 words)",
      "body": "1-2 sentences with specific action the engineer should take right now"
    }
  ],
  "next_action": "The single most important thing to do right now (imperative sentence, specific)"
}

Rules:
- 3-5 insights maximum
- Be direct and specific — reference actual data from the context
- "good" items only if something is genuinely well done
- Warnings take priority
- If lifecycle not initialized, that's the #1 blocker
- Don't suggest things that are already done`;

  const user = `Analyze this engineering node and provide guidance.\n\n${ctx.contextBlock}`;
  return { system, user };
}

// ── MODE 2: Guide Me ──────────────────────────────────────────────────────────
function buildMode2Prompts(ctx) {
  const system = `${BASE_SYSTEM}

Your task: Generate a precise, step-by-step walkthrough of what the engineer should do next in the current phase. Be phase-aware and proactive — identify gaps in the node's current data.

Return ONLY valid JSON. No markdown. No explanation. Exact schema:
{
  "phase": "Current phase name",
  "phase_status": "on_track" | "needs_work" | "blocked",
  "summary": "One sentence: where this node is in the phase",
  "steps": [
    {
      "order": 1,
      "title": "Short imperative title (3-6 words)",
      "detail": "Specific instruction — what exactly to do, referencing this node's data",
      "status": "done" | "in_progress" | "todo",
      "why": "Why this step matters for this node specifically"
    }
  ],
  "gaps": [
    "Specific missing artifact or incomplete item (e.g., REQ-0003 has no verification method)"
  ]
}

Rules:
- Steps must be specific to THIS node's data, not generic
- Mark steps as "done" if the artifact already exists
- 4-8 steps max
- gaps[] lists concrete missing items the engineer must address
- If lifecycle not initialized, first step is always to initialize it`;

  const user = `Generate a step-by-step guide for what to do next on this node.\n\n${ctx.contextBlock}`;
  return { system, user };
}

// ── MODE 3: Help Me Solve ─────────────────────────────────────────────────────
function buildMode3Prompts(ctx, problem) {
  const system = `${BASE_SYSTEM}

Your task: The engineer has described a problem. Provide structured, engineering-discipline problem-solving guidance. Draw on the node's context — what phase they're in, what requirements exist, what has been tested or analyzed. Do NOT give generic advice.

Return ONLY valid JSON. No markdown. No explanation. Exact schema:
{
  "problem_restatement": "Restate the problem precisely in engineering terms",
  "root_cause_hypotheses": [
    {
      "hypothesis": "Specific root cause hypothesis",
      "evidence_for": "Evidence from node context supporting this",
      "evidence_against": "Evidence from node context contradicting this",
      "priority": "high" | "medium" | "low"
    }
  ],
  "recommended_approach": "What structured method to use (DOE, 8D, FEA, hand-calc, etc.) and why",
  "relevant_requirements": ["REQ-0001: title — why relevant", "..."],
  "suggested_tools": ["DOE study", "8D Report", "FEA analysis", "..."],
  "next_steps": [
    "Step 1: specific action",
    "Step 2: specific action"
  ],
  "watch_out": "One key risk or assumption that could derail the investigation"
}

Rules:
- Reference specific requirements, phases, and artifacts from the node context
- "suggested_tools" maps to Factory-OS features (DOE Studies, 8D Reports, Analysis/CAE phase)
- Be opinionated about the recommended approach — pick one, explain why
- 3-5 next steps max`;

  const user = `The engineer has described this problem:\n\n"${problem}"\n\nNode context:\n\n${ctx.contextBlock}`;
  return { system, user };
}

// ── MODE 4: Compare Options ───────────────────────────────────────────────────
function buildMode4Prompts(ctx, options) {
  const optionLabels = options.map((o, i) => `Option ${String.fromCharCode(65 + i)}: ${o.name}${o.description ? ' — ' + o.description : ''}`).join('\n');
  const criteriaStr = options[0]?.criteria ? `Evaluation criteria provided: ${options[0].criteria}` : 'Use engineering best practices for criteria (requirement coverage, risk, cost, manufacturability, testability)';

  const system = `${BASE_SYSTEM}

Your task: Generate a structured engineering comparison of 2-3 design options. Evaluate against the node's actual requirements and engineering constraints. Produce a decision matrix and clear recommendation.

Return ONLY valid JSON. No markdown. No explanation. Exact schema:
{
  "winner": "Option A" | "Option B" | "Option C",
  "recommendation": "2-3 sentences explaining why the winner is the best choice for THIS node",
  "matrix": [
    {
      "criterion": "Criterion name",
      "weight": "high" | "medium" | "low",
      "rationale": "Why this criterion matters for this node",
      "scores": {
        "A": { "score": 8, "max": 10, "notes": "Specific notes referencing node data" },
        "B": { "score": 6, "max": 10, "notes": "Specific notes" },
        "C": { "score": 7, "max": 10, "notes": "Specific notes (omit if only 2 options)" }
      }
    }
  ],
  "requirement_coverage": [
    {
      "req_id": "REQ-001",
      "req_title": "...",
      "best_option": "A",
      "notes": "Which option best satisfies this requirement and why"
    }
  ],
  "risks": [
    {
      "option": "A",
      "risk": "Specific risk",
      "severity": "high" | "medium" | "low",
      "mitigation": "How to address"
    }
  ]
}

Rules:
- Weight "high" for SHALL requirements, "medium" for SHOULD, "low" for MAY
- Scores are 1-10
- Tie-break using highest-weighted criteria
- Reference actual requirements from the node context
- Include 4-6 criteria in the matrix`;

  const user = `Compare these design options for the following node:\n\n${optionLabels}\n\n${criteriaStr}\n\nNode context:\n\n${ctx.contextBlock}`;
  return { system, user };
}

// ── MODE 5: Generate Next Actions ─────────────────────────────────────────────
function buildMode5Prompts(ctx) {
  const system = `${BASE_SYSTEM}

Your task: Look at the node's current state and generate a prioritized, specific action list of what needs to happen next. Actions must be concrete — reference specific requirements, artifacts, and phases. "Run thermal analysis on REQ-0003" not "do more testing".

Return ONLY valid JSON. No markdown. No explanation. Exact schema:
{
  "phase_readiness": "on_track" | "needs_work" | "blocked",
  "readiness_summary": "One sentence on overall readiness to advance",
  "priority_actions": [
    {
      "priority": 1,
      "action": "Specific, imperative action statement",
      "reason": "Why this is the next most important thing",
      "effort": "low" | "medium" | "high",
      "references": "Specific requirement ID, phase, or artifact this relates to",
      "factory_os_module": "doe" | "8d" | "requirements" | "phase_artifact" | "none"
    }
  ],
  "blockers": [
    "Specific blocker preventing phase completion (if any)"
  ],
  "quick_wins": [
    "Low-effort action that can be done immediately"
  ]
}

Rules:
- 5-8 priority actions
- Sorted by impact × urgency
- factory_os_module indicates which Factory-OS feature is relevant
- quick_wins[] are the 1-3 easiest things with immediate value
- blockers[] are hard gates preventing phase advancement
- Reference actual req IDs, phases, and artifacts from the context`;

  const user = `Generate a prioritized next-action list for this engineering node.\n\n${ctx.contextBlock}`;
  return { system, user };
}

// ── Helper: Call OpenAI ───────────────────────────────────────────────────────
async function callAI(system, user, taskTag, maxTokens = 1200) {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.3,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  }, { headers: { 'x-task': taskTag } });

  const raw = completion.choices[0]?.message?.content || '{}';
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { error: 'Parse failed', raw: raw.slice(0, 300) };
  }
}

// ── GET /api/nodes/:id/ai-guidance?mode=review|guide|next_actions ─────────────
router.get('/:id/ai-guidance', async (req, res) => {
  const pool = req.app.locals.pool;
  const nodeId = parseInt(req.params.id, 10);
  const mode = req.query.mode || 'review';

  if (!nodeId || isNaN(nodeId)) {
    return res.status(400).json({ success: false, message: 'Invalid node ID' });
  }

  try {
    const ctx = await buildNodeContext(pool, nodeId);
    if (!ctx) {
      return res.status(404).json({ success: false, message: 'Node not found' });
    }

    let prompts, guidance, taskTag;

    if (mode === 'guide') {
      prompts = buildMode2Prompts(ctx);
      taskTag = 'factoryos-ai-guide-me';
    } else if (mode === 'next_actions') {
      prompts = buildMode5Prompts(ctx);
      taskTag = 'factoryos-ai-next-actions';
    } else {
      // Default: mode === 'review'
      prompts = buildMode1Prompts(ctx);
      taskTag = 'factoryos-ai-guidance';
    }

    guidance = await callAI(prompts.system, prompts.user, taskTag);

    return res.json({
      success: true,
      node_id: nodeId,
      node_name: ctx.node.name,
      current_phase: ctx.currentPhaseLabel,
      mode,
      guidance,
    });
  } catch (err) {
    console.error('[AI Guidance] GET Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to generate guidance: ' + err.message });
  }
});

// ── POST /api/nodes/:id/ai-guidance — modes requiring input (3 & 4) ──────────
router.post('/:id/ai-guidance', async (req, res) => {
  const pool = req.app.locals.pool;
  const nodeId = parseInt(req.params.id, 10);
  const { mode, problem, options } = req.body;

  if (!nodeId || isNaN(nodeId)) {
    return res.status(400).json({ success: false, message: 'Invalid node ID' });
  }

  if (!mode || !['help_me_solve', 'compare_options'].includes(mode)) {
    return res.status(400).json({ success: false, message: 'POST mode must be help_me_solve or compare_options' });
  }

  try {
    const ctx = await buildNodeContext(pool, nodeId);
    if (!ctx) {
      return res.status(404).json({ success: false, message: 'Node not found' });
    }

    let guidance, taskTag;

    if (mode === 'help_me_solve') {
      if (!problem || typeof problem !== 'string' || problem.trim().length < 10) {
        return res.status(400).json({ success: false, message: 'Problem description required (min 10 characters)' });
      }
      const prompts = buildMode3Prompts(ctx, problem.trim());
      taskTag = 'factoryos-ai-help-solve';
      guidance = await callAI(prompts.system, prompts.user, taskTag, 1400);

    } else if (mode === 'compare_options') {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ success: false, message: 'At least 2 options required' });
      }
      const filteredOptions = options.slice(0, 3).filter(o => o.name && o.name.trim());
      if (filteredOptions.length < 2) {
        return res.status(400).json({ success: false, message: 'At least 2 named options required' });
      }
      const prompts = buildMode4Prompts(ctx, filteredOptions);
      taskTag = 'factoryos-ai-compare-options';
      guidance = await callAI(prompts.system, prompts.user, taskTag, 1600);
    }

    return res.json({
      success: true,
      node_id: nodeId,
      node_name: ctx.node.name,
      current_phase: ctx.currentPhaseLabel,
      mode,
      guidance,
    });
  } catch (err) {
    console.error('[AI Guidance] POST Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to generate guidance: ' + err.message });
  }
});

module.exports = router;
