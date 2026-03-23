/**
 * Migration: Remove all AI-generated renders from demo projects.
 * Deletes every node_renders record whose URL points to /images/demo/,
 * which are exclusively the AI-generated renders inserted by the demo seed.
 * User-uploaded renders (base64, source_type='base64') and any real CAD
 * renders with external URLs are unaffected.
 */

module.exports = {
  name: '20260323000013_remove_demo_renders',
  up: async (conn) => {
    await conn.query(`
      DELETE FROM node_renders
      WHERE source_type = 'url'
        AND url LIKE '/images/demo/%'
    `);
  },
  down: async (conn) => {
    // No rollback — demo renders are re-inserted by running the demo seed again.
  }
};
