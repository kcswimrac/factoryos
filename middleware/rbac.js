/**
 * RBAC Middleware — Project-level permissions
 *
 * Roles (highest → lowest):
 *   admin  — full access: manage members, project settings, all mutations
 *   editor — create/edit nodes, requirements, DOE, 8D, advance phases
 *   viewer — read-only: can browse everything, cannot mutate
 *
 * Demo projects are always read-only for unauthenticated users.
 * Authenticated users who are not project members get 403.
 *
 * Usage:
 *   const { requireRole, getProjectRole } = require('../middleware/rbac');
 *
 *   router.post('/', requireRole('editor'), handler);  // editor or above
 *   router.delete('/', requireRole('admin'), handler); // admin only
 */

const ROLE_RANK = { viewer: 1, editor: 2, admin: 3 };

/**
 * Get a user's effective role on a project.
 * Returns null if the user has no access.
 *
 * @param {object} pool   - pg Pool
 * @param {number} projectId
 * @param {number|null} userId
 * @returns {Promise<string|null>} role string or null
 */
async function getProjectRole(pool, projectId, userId) {
  if (!userId) return null;

  const result = await pool.query(`
    SELECT pm.role
    FROM project_members pm
    WHERE pm.project_id = $1 AND pm.user_id = $2
    LIMIT 1
  `, [projectId, userId]);

  return result.rows[0]?.role ?? null;
}

/**
 * Look up a project_id from a node id (direct).
 */
async function getProjectForNode(pool, nodeId) {
  if (!nodeId) return null;
  const r = await pool.query('SELECT project_id FROM nodes WHERE id = $1', [Number(nodeId)]);
  return r.rows[0]?.project_id ? Number(r.rows[0].project_id) : null;
}

/**
 * Look up a project_id from a requirement id.
 */
async function getProjectForRequirement(pool, requirementId) {
  if (!requirementId) return null;
  const r = await pool.query(`
    SELECT n.project_id FROM requirements req
    JOIN nodes n ON n.id = req.node_id
    WHERE req.id = $1
  `, [Number(requirementId)]);
  return r.rows[0]?.project_id ? Number(r.rows[0].project_id) : null;
}

/**
 * Look up a project_id from a requirement trace id.
 */
async function getProjectForTrace(pool, traceId) {
  if (!traceId) return null;
  const r = await pool.query(`
    SELECT n.project_id FROM requirement_traces rt
    JOIN requirements req ON req.id = rt.requirement_id
    JOIN nodes n ON n.id = req.node_id
    WHERE rt.id = $1
  `, [Number(traceId)]);
  return r.rows[0]?.project_id ? Number(r.rows[0].project_id) : null;
}

/**
 * Look up a project_id from a DOE study id.
 */
async function getProjectForDoeStudy(pool, studyId) {
  if (!studyId) return null;
  const r = await pool.query(`
    SELECT n.project_id FROM doe_studies s
    LEFT JOIN nodes n ON n.id = s.node_id
    WHERE s.id = $1
  `, [Number(studyId)]);
  return r.rows[0]?.project_id ? Number(r.rows[0].project_id) : null;
}

/**
 * Resolve project_id from:
 *   1. req.params.projectId                — direct project param
 *   2. req.body.project_id / req.query.project_id
 *   3. req.body.node_id / req.query.node_id → look up node.project_id
 *   4. req.params.id as node_id            — e.g. /api/nodes/:id routes
 *   5. req.params.nodeId                   — /api/nodes/:nodeId/phases
 *
 * Returns null if unresolvable.
 */
async function resolveProjectId(pool, req) {
  // Direct project param
  if (req.params.projectId && Number.isInteger(Number(req.params.projectId))) {
    return Number(req.params.projectId);
  }

  // Body or query — explicit project_id
  if (req.body?.project_id) return Number(req.body.project_id);
  if (req.query?.project_id) return Number(req.query.project_id);

  // Resolve through explicit node_id from body/query/params
  const bodyNodeId = req.body?.node_id || req.query?.node_id || req.params?.nodeId;
  if (bodyNodeId && Number.isInteger(Number(bodyNodeId))) {
    const projectId = await getProjectForNode(pool, Number(bodyNodeId));
    if (projectId) return projectId;
  }

  // req.params.id — treat as node id on /api/nodes/:id routes
  const paramId = req.params.id;
  if (paramId && Number.isInteger(Number(paramId))) {
    const projectId = await getProjectForNode(pool, Number(paramId));
    if (projectId) return projectId;
  }

  return null;
}

/**
 * Middleware factory: enforce minimum role on a project route.
 *
 * @param {string} minRole — 'viewer' | 'editor' | 'admin'
 *
 * Attaches req.projectRole and req.projectId for downstream use.
 */
function requireRole(minRole) {
  return async (req, res, next) => {
    const pool = req.app.locals.pool;
    const userId = req.user?.id ?? null;

    // Resolve which project we're operating on
    const projectId = await resolveProjectId(pool, req);

    if (!projectId) {
      // Can't resolve project → allow through (route handles its own auth)
      return next();
    }

    // Check if it's a demo project — demos are always readable, never writable
    const projectRow = await pool.query(
      'SELECT is_demo FROM projects WHERE id = $1', [projectId]
    );
    const project = projectRow.rows[0];

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.is_demo) {
      if (minRole === 'viewer') {
        req.projectRole = 'viewer';
        req.projectId = projectId;
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Demo projects are read-only'
      });
    }

    // Get actual role
    const role = await getProjectRole(pool, projectId, userId);

    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
      return res.status(403).json({
        success: false,
        message: `Requires ${minRole} role (you are ${role})`
      });
    }

    req.projectRole = role;
    req.projectId = projectId;
    next();
  };
}

/**
 * Lightweight helper: attach projectRole to req without blocking.
 * Useful for GET routes that want to include role in response.
 */
async function attachProjectRole(pool, req, projectId) {
  const userId = req.user?.id ?? null;
  if (!userId || !projectId) return null;
  return getProjectRole(pool, projectId, userId);
}

module.exports = {
  requireRole,
  getProjectRole,
  resolveProjectId,
  attachProjectRole,
  getProjectForNode,
  getProjectForRequirement,
  getProjectForTrace,
  getProjectForDoeStudy,
  ROLE_RANK
};
