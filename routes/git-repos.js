/**
 * T4.1 + T4.2 + T4.4 + T4.5: Git Repositories, Firmware Modules, Builds, Code Reviews
 *
 * /api/git/repos               — T4.1 repo CRUD + commits
 * /api/git/firmware             — T4.2 firmware modules
 * /api/git/builds               — T4.4 build/deploy tracking
 * /api/git/compatibility        — T4.4 HW↔FW compatibility matrix
 * /api/git/code-reviews         — T4.5 PR linking to requirements
 */
const express = require('express');
const router = express.Router();

// ══════════════════════════════════════════════════════════════════════════════
// T4.1: Git Repository Linking
// ══════════════════════════════════════════════════════════════════════════════

// GET /repos?projectId=X — list repos for a project
router.get('/repos', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, nodeId } = req.query;
    let sql = 'SELECT * FROM git_repos WHERE 1=1';
    const params = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    if (nodeId) { sql += ' AND node_id = ?'; params.push(nodeId); }
    sql += ' ORDER BY repo_name';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /repos — link a new repository
router.post('/repos', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, nodeId, repoName, repoUrl, provider, defaultBranch, description, language } = req.body;

    const [result] = await pool.query(
      `INSERT INTO git_repos (project_id, node_id, repo_name, repo_url, provider, default_branch, description, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, nodeId || null, repoName, repoUrl, provider || 'github',
       defaultBranch || 'main', description || null, language || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /repos/:repoId — get repo with recent commits
router.get('/repos/:repoId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [repos] = await pool.query('SELECT * FROM git_repos WHERE id = ?', [req.params.repoId]);
    if (repos.length === 0) return res.status(404).json({ success: false, error: 'Repo not found' });

    const repo = repos[0];
    const [commits] = await pool.query(
      'SELECT * FROM git_commits WHERE repo_id = ? ORDER BY committed_at DESC LIMIT 50',
      [repo.id]
    );
    repo.recentCommits = commits;

    const [reviews] = await pool.query(
      'SELECT * FROM code_review_links WHERE repo_id = ? ORDER BY linked_at DESC LIMIT 20',
      [repo.id]
    );
    repo.codeReviews = reviews;

    res.json({ success: true, data: repo });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /repos/:repoId — update repo metadata
router.put('/repos/:repoId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['repo_name', 'repo_url', 'provider', 'default_branch', 'description',
                     'language', 'last_commit_sha', 'last_commit_message', 'last_commit_author', 'last_commit_at'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });
    params.push(req.params.repoId);
    await pool.query(`UPDATE git_repos SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Repo updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /repos/:repoId
router.delete('/repos/:repoId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const repoId = req.params.repoId;
    await pool.query('DELETE FROM code_review_links WHERE repo_id = ?', [repoId]);
    await pool.query('DELETE FROM git_commits WHERE repo_id = ?', [repoId]);
    await pool.query('DELETE FROM git_repos WHERE id = ?', [repoId]);
    res.json({ success: true, message: 'Repo and associated data deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /repos/:repoId/commits — batch import commits (from webhook or manual sync)
router.post('/repos/:repoId/commits', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { commits } = req.body;
    if (!Array.isArray(commits)) return res.status(400).json({ success: false, error: 'commits must be an array' });

    let imported = 0;
    for (const c of commits) {
      await pool.query(
        `INSERT INTO git_commits (repo_id, commit_sha, message, author_name, author_email, committed_at, branch, files_changed, insertions, deletions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE message = VALUES(message)`,
        [req.params.repoId, c.sha, c.message, c.authorName || c.author, c.authorEmail,
         c.committedAt || c.date, c.branch || null, c.filesChanged || 0,
         c.insertions || 0, c.deletions || 0]
      );
      imported++;
    }

    // Update last_commit on repo
    if (commits.length > 0) {
      const latest = commits[0];
      await pool.query(
        `UPDATE git_repos SET last_commit_sha = ?, last_commit_message = ?,
         last_commit_author = ?, last_commit_at = ? WHERE id = ?`,
        [latest.sha, latest.message, latest.authorName || latest.author,
         latest.committedAt || latest.date, req.params.repoId]
      );
    }

    res.json({ success: true, data: { imported } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /repos/:repoId/commits — list commits with filters
router.get('/repos/:repoId/commits', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { branch, since, until, limit } = req.query;
    let sql = 'SELECT * FROM git_commits WHERE repo_id = ?';
    const params = [req.params.repoId];
    if (branch) { sql += ' AND branch = ?'; params.push(branch); }
    if (since) { sql += ' AND committed_at >= ?'; params.push(since); }
    if (until) { sql += ' AND committed_at <= ?'; params.push(until); }
    sql += ` ORDER BY committed_at DESC LIMIT ${parseInt(limit) || 100}`;
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// T4.2: Firmware Modules
// ══════════════════════════════════════════════════════════════════════════════

router.get('/firmware', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { nodeId, repoId } = req.query;
    let sql = 'SELECT * FROM firmware_modules WHERE 1=1';
    const params = [];
    if (nodeId) { sql += ' AND node_id = ?'; params.push(nodeId); }
    if (repoId) { sql += ' AND repo_id = ?'; params.push(repoId); }
    sql += ' ORDER BY module_name';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/firmware', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { nodeId, repoId, moduleName, currentVersion, language, compiler, targetPlatform,
            flashSizeKb, ramUsageKb, entryPoint, buildCommand, flashCommand, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO firmware_modules (node_id, repo_id, module_name, current_version, language,
       compiler, target_platform, flash_size_kb, ram_usage_kb, entry_point, build_command, flash_command, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nodeId, repoId || null, moduleName, currentVersion || '0.0.1',
       language || null, compiler || null, targetPlatform || null,
       flashSizeKb || null, ramUsageKb || null, entryPoint || null,
       buildCommand || null, flashCommand || null, notes || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/firmware/:moduleId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['module_name', 'current_version', 'build_status', 'test_coverage_percent',
                     'language', 'compiler', 'target_platform', 'flash_size_kb', 'ram_usage_kb',
                     'entry_point', 'build_command', 'flash_command', 'notes', 'last_build_at'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });
    params.push(req.params.moduleId);
    await pool.query(`UPDATE firmware_modules SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Firmware module updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// T4.4: Build/Deploy Tracking
// ══════════════════════════════════════════════════════════════════════════════

router.get('/builds', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { moduleId } = req.query;
    if (!moduleId) return res.status(400).json({ success: false, error: 'moduleId required' });
    const [rows] = await pool.query(
      'SELECT * FROM firmware_builds WHERE module_id = ? ORDER BY created_at DESC LIMIT 50',
      [moduleId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/builds', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { moduleId, version, commitSha, buildStatus, testResults, binarySizeBytes, buildLog, builtBy } = req.body;

    const [result] = await pool.query(
      `INSERT INTO firmware_builds (module_id, version, commit_sha, build_status, test_results, binary_size_bytes, build_log, built_at, built_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [moduleId, version, commitSha || null, buildStatus || 'passed',
       JSON.stringify(testResults || null), binarySizeBytes || null,
       buildLog || null, builtBy || null]
    );

    // Update module current version and build status
    // Map build-level status to module-level status (passed→passing, failed→failing)
    const moduleStatus = { passed: 'passing', failed: 'failing', building: 'unstable' }[buildStatus] || 'unknown';
    await pool.query(
      'UPDATE firmware_modules SET current_version = ?, build_status = ?, last_build_at = NOW() WHERE id = ?',
      [version, moduleStatus, moduleId]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET individual firmware module
router.get('/firmware/:moduleId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM firmware_modules WHERE id = ?', [req.params.moduleId]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Module not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE firmware module
router.delete('/firmware/:moduleId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM firmware_builds WHERE module_id = ?', [req.params.moduleId]);
    await pool.query('DELETE FROM firmware_modules WHERE id = ?', [req.params.moduleId]);
    res.json({ success: true, message: 'Module and builds deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE firmware build
router.delete('/builds/:buildId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM firmware_builds WHERE id = ?', [req.params.buildId]);
    res.json({ success: true, message: 'Build deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// HW ↔ FW Compatibility Matrix
router.get('/compatibility', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId required' });

    const [rows] = await pool.query(
      'SELECT * FROM hw_fw_compatibility WHERE project_id = ? ORDER BY hw_revision, fw_version',
      [projectId]
    );

    // Build matrix view
    const hwRevisions = [...new Set(rows.map(r => r.hw_revision))];
    const fwVersions = [...new Set(rows.map(r => r.fw_version))];
    const matrix = {};
    rows.forEach(r => { matrix[`${r.hw_revision}|${r.fw_version}`] = r; });

    res.json({ success: true, data: { entries: rows, hwRevisions, fwVersions, matrix } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/compatibility', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, hwRevision, hwNodeId, fwVersion, fwModuleId,
            compatibility, releaseStatus, releaseNotes, releasedBy } = req.body;

    await pool.query(
      `INSERT INTO hw_fw_compatibility (project_id, hw_revision, hw_node_id, fw_version, fw_module_id,
       compatibility, release_status, release_notes, released_by, released_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${releaseStatus === 'released' ? 'NOW()' : 'NULL'})
       ON DUPLICATE KEY UPDATE compatibility = VALUES(compatibility), release_status = VALUES(release_status),
       release_notes = VALUES(release_notes), released_by = VALUES(released_by)`,
      [projectId, hwRevision, hwNodeId || null, fwVersion, fwModuleId || null,
       compatibility || 'untested', releaseStatus || 'development',
       releaseNotes || null, releasedBy || null]
    );

    res.json({ success: true, message: 'Compatibility entry saved' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE compatibility entry
router.delete('/compatibility/:compatId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM hw_fw_compatibility WHERE id = ?', [req.params.compatId]);
    res.json({ success: true, message: 'Compatibility entry deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// T4.5: Code Review Linking
// ══════════════════════════════════════════════════════════════════════════════

router.get('/code-reviews', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { repoId, requirementId } = req.query;
    let sql = 'SELECT * FROM code_review_links WHERE 1=1';
    const params = [];
    if (repoId) { sql += ' AND repo_id = ?'; params.push(repoId); }
    if (requirementId) { sql += ' AND requirement_id = ?'; params.push(requirementId); }
    sql += ' ORDER BY linked_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/code-reviews', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { repoId, requirementId, prNumber, prUrl, prTitle, prStatus,
            commitSha, reviewStatus, reviewer, verificationType, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO code_review_links (repo_id, requirement_id, pr_number, pr_url, pr_title,
       pr_status, commit_sha, review_status, reviewer, verification_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [repoId, requirementId || null, prNumber || null, prUrl || null, prTitle || null,
       prStatus || 'open', commitSha || null, reviewStatus || 'pending',
       reviewer || null, verificationType || 'implements', notes || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/code-reviews/:reviewId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['pr_status', 'review_status', 'reviewer', 'verification_type', 'notes', 'requirement_id'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });
    params.push(req.params.reviewId);
    await pool.query(`UPDATE code_review_links SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Code review link updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/code-reviews/:reviewId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM code_review_links WHERE id = ?', [req.params.reviewId]);
    res.json({ success: true, message: 'Code review link deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
