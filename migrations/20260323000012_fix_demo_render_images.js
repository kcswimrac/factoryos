/**
 * Migration: Fix demo project rendered view images
 *
 * The previous seed used Unsplash photo IDs that resolve to completely wrong
 * images (Apple Watch, man with industrial lights instead of Baja SAE vehicles).
 *
 * This migration replaces ALL demo render URLs with local AI-generated images
 * served from /images/demo/ (static assets committed to the repo).
 *
 * Safe to run multiple times (idempotent by design — updates exact URL matches).
 */

exports.up = async (conn) => {
  // Helper: update renders matching a specific OLD url or a label pattern
  // within demo projects only.
  //
  // Strategy: UPDATE directly by URL for the clearly-wrong ones,
  // and by (label, project slug) for comprehensive coverage.

  // ── Step 1: Fix by exact bad URL (the Apple Watch + man-with-tools photos) ───
  const BAD_URL_FIXES = [
    // "man with industrial light" photo — used as Full Vehicle Isometric (Baja + Truck)
    {
      old_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      new_url_baja:  '/images/demo/baja-full-isometric.png',
      new_url_truck: '/images/demo/truck-34-front.png',
    },
    // "Apple Watch" photo — used as 3/4 Front View, Drill Pattern, Torque Blend
    {
      old_url: 'https://images.unsplash.com/photo-1517420879524-86d64ac2f339?w=800&q=80',
      new_url_baja:  '/images/demo/baja-34-front.png',
      new_url_truck: '/images/demo/drone-pcb.png', // torque blend architecture = PCB/electronics
    },
  ];

  for (const fix of BAD_URL_FIXES) {
    // Fix in Baja SAE project
    await conn.query(`
      UPDATE node_renders SET url = ?
      WHERE url = ?
        AND node_id IN (
          SELECT n.id FROM nodes n
          JOIN projects p ON n.project_id = p.id
          WHERE p.slug = 'baja-sae-2025' AND p.is_demo = 1
        )
    `, [fix.new_url_baja, fix.old_url]);

    // Fix in Heavy Motion / truck project
    await conn.query(`
      UPDATE node_renders SET url = ?
      WHERE url = ?
        AND node_id IN (
          SELECT n.id FROM nodes n
          JOIN projects p ON n.project_id = p.id
          WHERE p.is_demo = 1 AND p.slug != 'baja-sae-2025' AND p.slug != 'drone-demo'
        )
    `, [fix.new_url_truck, fix.old_url]);

    // Fix any remaining (fallback for drone or other projects)
    await conn.query(`
      UPDATE node_renders SET url = ?
      WHERE url = ?
    `, [fix.new_url_baja, fix.old_url]);
  }

  // ── Step 2: Replace ALL Unsplash URLs in demo renders with local images ────
  // Map each Unsplash photo ID -> appropriate local image

  const URL_MAP = [
    // Baja SAE vehicle renders
    ['https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',  '/images/demo/baja-roll-cage.png'],
    ['https://images.unsplash.com/photo-1609592424750-01d4c5cdb0a4?w=800&q=80',  '/images/demo/baja-fea-stress.png'],
    ['https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=800&q=80',     '/images/demo/baja-suspension.png'],
    ['https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&q=80',  '/images/demo/baja-fea-stress.png'],
    ['https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80',  '/images/demo/baja-gearbox.png'],
    ['https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&q=80',     '/images/demo/baja-gearbox.png'],
    ['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80',  '/images/demo/baja-brake-rotor.png'],
    ['https://images.unsplash.com/photo-1609952048180-7b35ea6b083b?w=800&q=80',  '/images/demo/baja-fea-stress.png'],

    // Drone renders
    ['https://images.unsplash.com/photo-1551739440-5919e2929c39?w=800&q=80',     '/images/demo/drone-isometric.png'],
    ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80',  '/images/demo/drone-top-down.png'],
    ['https://images.unsplash.com/photo-1568209865332-a15790aed756?w=800&q=80',  '/images/demo/drone-isometric.png'],
    ['https://images.unsplash.com/photo-1581092162861-6efa8ba0d0f8?w=800&q=80',  '/images/demo/drone-isometric.png'],
    ['https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',  '/images/demo/drone-pcb.png'],
    ['https://images.unsplash.com/photo-1630893675082-4e8c1c87c8cf?w=800&q=80',  '/images/demo/drone-pcb.png'],
    ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',  '/images/demo/drone-pcb.png'],
    ['https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&q=80',  '/images/demo/drone-pcb.png'],
    ['https://images.unsplash.com/photo-1563720223185-11069b1ee8f1?w=800&q=80',  '/images/demo/drone-isometric.png'],
    ['https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80',  '/images/demo/drone-pcb.png'],
    ['https://images.unsplash.com/photo-1593941707882-a5bba53b0998?w=800&q=80',  '/images/demo/truck-battery-pack.png'],

    // Truck renders
    ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80',  '/images/demo/truck-full-isometric.png'],
  ];

  for (const [old_url, new_url] of URL_MAP) {
    await conn.query(
      `UPDATE node_renders SET url = ? WHERE url = ?`,
      [new_url, old_url]
    );
  }
};

exports.down = async (conn) => {
  // No point reverting to broken URLs — leave local images in place on rollback
};

exports.name = '20260323000012_fix_demo_render_images';
