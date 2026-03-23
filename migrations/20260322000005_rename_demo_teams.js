/**
 * Migration: Rename demo teams to approved names
 *
 * Old (joke) names → New (approved) names:
 *   South Harmon Institute of Technology  → Full Send Polytechnic
 *   Definitely Not DARPA, LLC             → Greyline Technologies
 *   Torque & Pray Heavy Industries        → Heavy Motion Industries
 */
module.exports = {
  name: 'rename_demo_teams',
  up: async (client) => {
    await client.query(`
      UPDATE teams SET name = 'Full Send Polytechnic',  slug = 'full-send',   description = 'Collegiate engineering team building the Baja SAE 2025 off-road vehicle.' WHERE slug = 'shit'
    `);
    await client.query(`
      UPDATE teams SET name = 'Greyline Technologies',  slug = 'greyline',    description = 'Autonomous systems and defense drone development team.' WHERE slug = 'darpa-llc'
    `);
    await client.query(`
      UPDATE teams SET name = 'Heavy Motion Industries', slug = 'heavy-motion', description = 'High-voltage hybrid powertrain development team.' WHERE slug = 'torque-pray'
    `);
  },
  down: async (client) => {
    await client.query(`
      UPDATE teams SET name = 'South Harmon Institute of Technology', slug = 'shit',       description = 'Collegiate engineering team building the Baja SAE 2025 off-road vehicle.' WHERE slug = 'full-send'
    `);
    await client.query(`
      UPDATE teams SET name = 'Definitely Not DARPA, LLC',           slug = 'darpa-llc',  description = 'Autonomous systems research team. Totally civilian.'                   WHERE slug = 'greyline'
    `);
    await client.query(`
      UPDATE teams SET name = 'Torque & Pray Heavy Industries',       slug = 'torque-pray', description = 'High-voltage hybrid powertrain development team.'                    WHERE slug = 'heavy-motion'
    `);
  }
};
