/**
 * Migration: Remove stale "Edison Hybrid Transit Truck" demo project
 *
 * When the demo seed was updated to "HM-600 Hybrid Truck" (slug: hm-600-hybrid-truck),
 * the old project (slug: edison-hybrid-truck) wasn't cleaned up, leaving Heavy Motion
 * Industries showing 2 projects instead of 1.
 *
 * This migration removes the old project and its associated nodes.
 */

exports.up = async (conn) => {
  // Nullify parent_id references before deleting nodes (RESTRICT FK)
  await conn.query(`
    UPDATE nodes SET parent_id = NULL
    WHERE project_id IN (
      SELECT id FROM projects WHERE slug = 'edison-hybrid-truck'
    )
  `);

  // Delete the nodes
  await conn.query(`
    DELETE FROM nodes
    WHERE project_id IN (
      SELECT id FROM projects WHERE slug = 'edison-hybrid-truck'
    )
  `);

  // Delete the project (cascades to doe_studies, eightd_reports, project_members,
  // project_invites, discovery_objects, discovery_architectures)
  await conn.query(`
    DELETE FROM projects WHERE slug = 'edison-hybrid-truck'
  `);
};

exports.down = async (conn) => {
  // No rollback — this was stale demo data, not schema
};
