/**
 * Demo Seed Route
 *
 * POST /api/demo/seed  — seed both demo projects (idempotent)
 * DELETE /api/demo/seed — wipe demo data
 *
 * Creates:
 *  1. Drone Project (~48 nodes, full hierarchy with requirements + phases)
 *  2. Baja SAE 2025 Project (~321 parts across 9 subsystems)
 *     4 deep-dive subsystems get full phase/requirement/DOE treatment
 */

const express = require('express');
const router = express.Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

async function createNode(pool, { name, part_number, type, description, parent_id, project_id }) {
  try {
    const r = await pool.query(
      `INSERT INTO nodes (name, part_number, type, description, parent_id, project_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [name, part_number, type, description || null, parent_id || null, project_id]
    );
    return r.rows[0].id;
  } catch(e) {
    if (e.code === '23505') {
      const r2 = await pool.query('SELECT id FROM nodes WHERE part_number=$1', [part_number]);
      return r2.rows[0]?.id;
    }
    throw e;
  }
}

async function addRequirement(pool, nodeId, { req_id, title, description, verification_method, priority, status }) {
  try {
    await pool.query(
      `INSERT INTO requirements (node_id, req_id, title, description, verification_method, priority, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [nodeId, req_id, title, description||null, verification_method||'test', priority||'shall', status||'open']
    );
  } catch(e) {
    if (e.code === '23505') return;
    throw e;
  }
}

async function initPhases(pool, nodeId) {
  const PHASES = [
    { key:'requirements', order:1 },
    { key:'rnd', order:2 },
    { key:'design_cad', order:3 },
    { key:'data_collection', order:4 },
    { key:'analysis_cae', order:5 },
    { key:'testing_validation', order:6 },
    { key:'correlation', order:7 }
  ];
  await pool.query("UPDATE nodes SET phase_mode='own' WHERE id=$1", [nodeId]);
  for (const ph of PHASES) {
    try {
      await pool.query(
        `INSERT INTO node_phases (node_id, phase, phase_order, status) VALUES ($1,$2,$3,'not_started')
         ON CONFLICT (node_id, phase) DO NOTHING`,
        [nodeId, ph.key, ph.order]
      );
    } catch(e) { /* ignore */ }
  }
}

async function setPhaseStatus(pool, nodeId, phaseKey, status) {
  await pool.query(
    `UPDATE node_phases SET status=$1, updated_at=NOW() WHERE node_id=$2 AND phase=$3`,
    [status, nodeId, phaseKey]
  );
}

async function addArtifact(pool, nodeId, phase, type, key, data) {
  try {
    if (key) {
      await pool.query(
        `INSERT INTO phase_artifacts (node_id, phase, artifact_type, artifact_key, data)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (node_id, phase, artifact_key) DO UPDATE SET data=$5, updated_at=NOW()`,
        [nodeId, phase, type, key, data]
      );
    } else {
      await pool.query(
        `INSERT INTO phase_artifacts (node_id, phase, artifact_type, data) VALUES ($1,$2,$3,$4)`,
        [nodeId, phase, type, data]
      );
    }
  } catch(e) { /* ignore */ }
}


async function createDoeStudy(pool, nodeId, title, objective, factors, responses, runs) {
  try {
    // Idempotent — return existing study if already seeded for this node+title
    const existing = await pool.query(
      'SELECT id FROM doe_studies WHERE node_id=$1 AND title=$2 LIMIT 1',
      [nodeId, title]
    );
    if (existing.rows.length > 0) return existing.rows[0].id;

    const sr = await pool.query(
      `INSERT INTO doe_studies (title, objective, node_id, status) VALUES ($1,$2,$3,'active') RETURNING id`,
      [title, objective, nodeId]
    );
    const studyId = sr.rows[0].id;
    const factorIds = [];
    for (let i = 0; i < factors.length; i++) {
      const fr = await pool.query(
        `INSERT INTO doe_factors (study_id, name, unit, levels, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [studyId, factors[i].name, factors[i].unit||null, JSON.stringify(factors[i].levels||[]), i]
      );
      factorIds.push(fr.rows[0].id);
    }
    const responseIds = [];
    for (let i = 0; i < responses.length; i++) {
      const rr = await pool.query(
        `INSERT INTO doe_responses (study_id, name, unit, target, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [studyId, responses[i].name, responses[i].unit||null, responses[i].target||'minimize', i]
      );
      responseIds.push(rr.rows[0].id);
    }
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const settings = {};
      for (let j = 0; j < factorIds.length; j++) {
        if (run.factors && run.factors[j] !== undefined) settings[String(factorIds[j])] = run.factors[j];
      }
      const rr = await pool.query(
        `INSERT INTO doe_runs (study_id, run_number, factor_settings, notes) VALUES ($1,$2,$3,$4) RETURNING id`,
        [studyId, i+1, JSON.stringify(settings), run.notes||null]
      );
      const runId = rr.rows[0].id;
      for (let j = 0; j < responseIds.length; j++) {
        if (run.results && run.results[j] !== undefined && run.results[j] !== null) {
          await pool.query(
            `INSERT INTO doe_run_results (run_id, response_id, value) VALUES ($1,$2,$3)`,
            [runId, responseIds[j], run.results[j]]
          );
        }
      }
    }
    return studyId;
  } catch(e) { console.error('[DemoSeed] DOE study error:', e.message); }
}

// ─── TEAMS ────────────────────────────────────────────────────────────────────

async function seedTeams(pool) {
  const teams = [
    {
      name: 'Full Send Polytechnic',
      slug: 'full-send',
      description: 'Collegiate engineering team building the Baja SAE 2025 off-road vehicle.',
      is_demo: true
    },
    {
      name: 'Greyline Technologies',
      slug: 'greyline',
      description: 'Autonomous systems and defense drone development team.',
      is_demo: true
    },
    {
      name: 'Heavy Motion Industries',
      slug: 'heavy-motion',
      description: 'Heavy-duty commercial vehicle manufacturer specializing in diesel-electric hybrid transit trucks.',
      is_demo: true
    }
  ];

  const ids = {};
  for (const t of teams) {
    try {
      const r = await pool.query(
        `INSERT INTO teams (name, slug, description, is_demo)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name=$1, description=$3
         RETURNING id`,
        [t.name, t.slug, t.description, t.is_demo]
      );
      ids[t.slug] = r.rows[0].id;
    } catch(e) {
      throw e;
    }
  }
  return ids;
}

// ─── DRONE PROJECT ────────────────────────────────────────────────────────────

async function seedDroneProject(pool, teamId) {
  let projId;
  try {
    const pr = await pool.query(
      `INSERT INTO projects (name, description, slug, is_demo, team_id)
       VALUES ('Drone — Guided Demo', 'Autonomous quadcopter demonstrating the Factory-OS engineering lifecycle.', 'drone-demo', true, $1)
       RETURNING id`,
      [teamId || null]
    );
    projId = pr.rows[0].id;
  } catch(e) {
    if (e.code === '23505') {
      const r = await pool.query("SELECT id FROM projects WHERE slug='drone-demo'");
      projId = r.rows[0].id;
      // Update team_id if needed
      if (teamId) await pool.query('UPDATE projects SET team_id=$1 WHERE id=$2', [teamId, projId]);
    } else throw e;
  }

  const P = projId;

  // Root
  const root = await createNode(pool, { name:'Drone Assembly', part_number:'D-001', type:'ASSY', description:'Complete autonomous quadcopter drone — flagship Factory-OS demo project.', project_id:P });

  // Frame
  const frame = await createNode(pool, { name:'Frame & Body', part_number:'D-FRAME-001', type:'SUBSYS', description:'Structural airframe including main plate, arms, mounts, and landing gear.', parent_id:root, project_id:P });
  await createNode(pool, { name:'Main Frame Plate', part_number:'D-FRAME-010', type:'COMP', description:'CNC-machined 3K CF plate. Primary structural backbone. 220×220mm.', parent_id:frame, project_id:P });
  const motorMntSubassy = await createNode(pool, { name:'Motor Mount Assembly', part_number:'D-FRAME-020', type:'SUBASSY', description:'Folding arm with integrated motor mount (×4 total).', parent_id:frame, project_id:P });
    await createNode(pool, { name:'Folding Arm Tube', part_number:'D-FRAME-021', type:'COMP', description:'D-12 carbon tube, 150mm. 4 required.', parent_id:motorMntSubassy, project_id:P });
    await createNode(pool, { name:'Arm Hinge Pivot', part_number:'D-FRAME-022', type:'PURCH', description:'Quick-fold titanium hinge. Purchased.', parent_id:motorMntSubassy, project_id:P });
    await createNode(pool, { name:'Motor Clamp Ring', part_number:'D-FRAME-023', type:'COMP', description:'Aluminium 6061 clamp ring for 2306 stator mount.', parent_id:motorMntSubassy, project_id:P });
  const landingGear = await createNode(pool, { name:'Landing Gear Assembly', part_number:'D-LG-001', type:'SUBASSY', description:'Spring-loaded landing legs with vibration isolation pads.', parent_id:frame, project_id:P });
    await createNode(pool, { name:'Landing Leg', part_number:'D-LG-010', type:'COMP', description:'CF rod 6mm × 120mm. 4 required.', parent_id:landingGear, project_id:P });
    await createNode(pool, { name:'Leg Damper Pad', part_number:'D-LG-011', type:'PURCH', description:'Sorbothane rubber pad, 20mm dia.', parent_id:landingGear, project_id:P });
    await createNode(pool, { name:'Leg Retention Clip', part_number:'D-LG-012', type:'COMP', description:'3D-printed nylon clip. Snap-fit to frame plate.', parent_id:landingGear, project_id:P });
  await createNode(pool, { name:'Canopy', part_number:'D-FRAME-030', type:'PURCH', description:'Injection-moulded ABS upper shell.', parent_id:frame, project_id:P });

  // Propulsion
  const prop = await createNode(pool, { name:'Propulsion System', part_number:'D-PROP-001', type:'SUBSYS', description:'Motors, ESCs, and propellers providing lift and control authority.', parent_id:root, project_id:P });
  const motorAssy = await createNode(pool, { name:'Motor Assembly', part_number:'D-MTR-001', type:'SUBASSY', description:'Brushless motor with prop adapter (×4 total).', parent_id:prop, project_id:P });
    await createNode(pool, { name:'Brushless Motor 2306-2400KV', part_number:'D-MTR-010', type:'PURCH', description:'T-Motor F2306 2400KV stator. Max 1200g thrust at 4S.', parent_id:motorAssy, project_id:P });
    await createNode(pool, { name:'Prop Adapter', part_number:'D-MTR-011', type:'PURCH', description:'M5 CW/CCW prop shaft adapter.', parent_id:motorAssy, project_id:P });
    await createNode(pool, { name:'Motor Shaft Extension', part_number:'D-MTR-012', type:'COMP', description:'Titanium shaft extension for prop clearance.', parent_id:motorAssy, project_id:P });
  await createNode(pool, { name:'Propeller Set', part_number:'D-PROP-010', type:'PURCH', description:'5045 tri-blade propellers. 2× CW, 2× CCW.', parent_id:prop, project_id:P });
  const escAssy = await createNode(pool, { name:'ESC Stack Assembly', part_number:'D-ESC-001', type:'SUBASSY', description:'4-in-1 ESC board with capacitor bank.', parent_id:prop, project_id:P });
    await createNode(pool, { name:'4-in-1 ESC 35A', part_number:'D-ESC-010', type:'PURCH', description:'Holybro Tekko32 F4 4-in-1 35A ESC.', parent_id:escAssy, project_id:P });
    await createNode(pool, { name:'Capacitor 470uF 35V', part_number:'D-ESC-011', type:'PURCH', description:'Electrolytic bulk capacitor. Reduces voltage spikes.', parent_id:escAssy, project_id:P });

  // Flight Control
  const fc = await createNode(pool, { name:'Flight Control System', part_number:'D-FC-001', type:'SUBSYS', description:'Flight controller, sensors, GPS, and communications.', parent_id:root, project_id:P });
  const fcBoard = await createNode(pool, { name:'Flight Controller', part_number:'D-FC-010', type:'PURCH', description:'Pixhawk 6C Mini — ArduPilot/PX4 compatible.', parent_id:fc, project_id:P });
  await createNode(pool, { name:'IMU Vibration Damper', part_number:'D-FC-011', type:'PURCH', description:'Foam standoff kit for FC isolation.', parent_id:fc, project_id:P });
  await createNode(pool, { name:'GPS/Compass Module', part_number:'D-FC-020', type:'PURCH', description:'Here3+ GNSS (L1/L2). Mounted on mast.', parent_id:fc, project_id:P });
  const gpsMast = await createNode(pool, { name:'GPS Mast Assembly', part_number:'D-FC-021', type:'SUBASSY', description:'Isolates GPS from EMI. Carbon tube with mount bracket.', parent_id:fc, project_id:P });
    await createNode(pool, { name:'GPS Mast Tube', part_number:'D-FC-022', type:'COMP', description:'CF tube 8mm × 60mm.', parent_id:gpsMast, project_id:P });
    await createNode(pool, { name:'GPS Mast Base', part_number:'D-FC-023', type:'COMP', description:'3D-printed PETG mount bracket.', parent_id:gpsMast, project_id:P });
  await createNode(pool, { name:'RC Receiver', part_number:'D-FC-030', type:'PURCH', description:'FrSky X8R SBUS 16-channel receiver.', parent_id:fc, project_id:P });
  await createNode(pool, { name:'Telemetry Radio 915MHz', part_number:'D-FC-040', type:'PURCH', description:'RFDesign RFD900x telemetry pair.', parent_id:fc, project_id:P });

  // Power
  const pwr = await createNode(pool, { name:'Power System', part_number:'D-PWR-001', type:'SUBSYS', description:'Battery, distribution, and power monitoring.', parent_id:root, project_id:P });
  await createNode(pool, { name:'Battery Pack 4S 5000mAh', part_number:'D-PWR-010', type:'PURCH', description:'Tattu R-Line 4S 100C LiPo.', parent_id:pwr, project_id:P });
  await createNode(pool, { name:'Power Distribution Board', part_number:'D-PWR-020', type:'PURCH', description:'Matek FCHUB-12S PDB with current sensor.', parent_id:pwr, project_id:P });
  await createNode(pool, { name:'Battery Strap', part_number:'D-PWR-030', type:'COMP', description:'Nylon strap with quick-release velcro.', parent_id:pwr, project_id:P });
  await createNode(pool, { name:'Power Switch', part_number:'D-PWR-040', type:'PURCH', description:'Anti-spark XT60 inline switch.', parent_id:pwr, project_id:P });
  const voltMon = await createNode(pool, { name:'Voltage Monitor Assembly', part_number:'D-PWR-050', type:'SUBASSY', description:'Low-battery alarm + cell balance monitor.', parent_id:pwr, project_id:P });
    await createNode(pool, { name:'Lipo Alarm', part_number:'D-PWR-051', type:'PURCH', description:'Vifly StoreSafe 2-8S alarm.', parent_id:voltMon, project_id:P });
    await createNode(pool, { name:'Current Sensor', part_number:'D-PWR-052', type:'PURCH', description:'AttoPilot 180A current/voltage sensor.', parent_id:voltMon, project_id:P });

  // Payload
  const payload = await createNode(pool, { name:'Payload System', part_number:'D-PL-001', type:'SUBSYS', description:'Stabilized camera gimbal and payload interface.', parent_id:root, project_id:P });
  const gimbalAssy = await createNode(pool, { name:'Gimbal Assembly', part_number:'D-GIMB-001', type:'SUBASSY', description:'2-axis stabilized gimbal for 4K action camera.', parent_id:payload, project_id:P });
    await createNode(pool, { name:'2-Axis Brushless Gimbal', part_number:'D-GIMB-010', type:'PURCH', description:'Tarot T-2D II brushless gimbal.', parent_id:gimbalAssy, project_id:P });
    await createNode(pool, { name:'Gimbal Mount Plate', part_number:'D-GIMB-011', type:'COMP', description:'CNC aluminium vibration-isolating mount plate.', parent_id:gimbalAssy, project_id:P });
    await createNode(pool, { name:'Gimbal Vibration Isolator', part_number:'D-GIMB-012', type:'PURCH', description:'Rubber grommet kit ×4.', parent_id:gimbalAssy, project_id:P });
  await createNode(pool, { name:'Camera GoPro Hero 12', part_number:'D-CAM-001', type:'PURCH', description:'GoPro Hero 12 Black. 4K/120fps.', parent_id:payload, project_id:P });

  // ── Deep-dive: Motor Assembly ──
  await initPhases(pool, motorAssy);
  await addRequirement(pool, motorAssy, { req_id:'D-MTR-R001', title:'Motor shall produce minimum 1200g static thrust at 4S', description:'Required for 4:1 thrust-to-weight ratio at 1.5kg AUW.', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, motorAssy, { req_id:'D-MTR-R002', title:'Motor efficiency shall exceed 85% at hover power setting', verification_method:'analysis', priority:'shall', status:'verified' });
  await addRequirement(pool, motorAssy, { req_id:'D-MTR-R003', title:'Motor temperature shall not exceed 80°C at 5-minute sustained full throttle', verification_method:'test', priority:'shall', status:'in_progress' });
  await setPhaseStatus(pool, motorAssy, 'requirements', 'complete');
  await addArtifact(pool, motorAssy, 'rnd', 'design_option', null, { title:'T-Motor F2306 2400KV', notes:'Best efficiency curve at cruise RPM. Datasheet validated.' });
  await addArtifact(pool, motorAssy, 'rnd', 'design_option', null, { title:'Sunnysky X2306 2400KV', notes:'Cheaper option. 8% lower efficiency. Eliminated.' });
  await addArtifact(pool, motorAssy, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'| Criteria | T-Motor | Sunnysky | Weight |\n|----------|---------|----------|--------|\n| Thrust/W | 9.2g/W | 8.4g/W | 40% |\n| Stator temp | 72C | 81C | 30% |\n| Cost | $42 | $28 | 10% |\n| **Score** | **8.4** | **7.1** | |' });
  await setPhaseStatus(pool, motorAssy, 'rnd', 'complete');
  await addArtifact(pool, motorAssy, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/drone-motor-assy', notes:'Motor assembly with prop adapter tolerance analysis.' });
  await setPhaseStatus(pool, motorAssy, 'design_cad', 'complete');
  await addArtifact(pool, motorAssy, 'data_collection', 'data_point', null, { label:'Static thrust at 50% throttle', value:'612g', measurement_method:'Load cell (HX711 + 5kg cell)', tool:'Thrust stand v2', confidence:'high' });
  await addArtifact(pool, motorAssy, 'data_collection', 'data_point', null, { label:'Static thrust at 100% throttle', value:'1248g', measurement_method:'Load cell', tool:'Thrust stand v2', confidence:'high' });
  await addArtifact(pool, motorAssy, 'data_collection', 'data_point', null, { label:'Motor temp after 5min full throttle', value:'74°C', measurement_method:'Thermocouple probe', tool:'Fluke 52-II', confidence:'medium' });
  await setPhaseStatus(pool, motorAssy, 'data_collection', 'complete');
  await createDoeStudy(pool, motorAssy,
    'Motor Throttle Efficiency DOE',
    'Determine the optimal throttle setting that maximises flight time while maintaining adequate thrust reserve.',
    [
      { name:'Throttle', unit:'%', levels:['40','50','60','70','80'] },
      { name:'Propeller Pitch', unit:'in', levels:['4.5','5.0','5.5'] }
    ],
    [
      { name:'Thrust', unit:'g', target:'maximize' },
      { name:'Current Draw', unit:'A', target:'minimize' },
      { name:'Motor Temp', unit:'°C', target:'minimize' }
    ],
    [
      { factors:['40','4.5'], results:[480, 12.1, 52], notes:'Low throttle / fine pitch' },
      { factors:['50','4.5'], results:[612, 15.8, 58] },
      { factors:['60','5.0'], results:[790, 20.2, 64], notes:'Best efficiency point' },
      { factors:['70','5.0'], results:[920, 26.8, 71] },
      { factors:['80','5.5'], results:[1100, 34.5, 78], notes:'High thrust — short duration' },
      { factors:['50','5.0'], results:[680, 17.2, 61], notes:'Hover optimised' }
    ]
  );

  // ── Deep-dive: Flight Controller ──
  await initPhases(pool, fcBoard);
  await addRequirement(pool, fcBoard, { req_id:'D-FC-R001', title:'FC shall maintain position hold within ±0.5m GPS accuracy', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, fcBoard, { req_id:'D-FC-R002', title:'FC shall execute return-to-home within 3s of signal loss', verification_method:'demonstration', priority:'shall', status:'open' });
  await setPhaseStatus(pool, fcBoard, 'requirements', 'complete');
  await addArtifact(pool, fcBoard, 'rnd', 'design_option', null, { title:'Pixhawk 6C Mini', notes:'ArduPilot + PX4 support. Best ecosystem. $180.' });
  await addArtifact(pool, fcBoard, 'rnd', 'design_option', null, { title:'Cube Orange+', notes:'Better IMU redundancy. $320. Eliminated — overkill.' });
  await addArtifact(pool, fcBoard, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'| | Pixhawk 6C | Cube Orange+ |\n|--|--|--|\n| IMU Count | 3 | 3 |\n| Price | $180 | $320 |\n| Size | 38×38mm | 38×38mm |\n| **Score** | **8.2** | **7.8** |' });
  await setPhaseStatus(pool, fcBoard, 'rnd', 'complete');
  await addArtifact(pool, fcBoard, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/drone-fc-stack', notes:'FC stack with vibration isolation standoffs.' });
  await setPhaseStatus(pool, fcBoard, 'design_cad', 'complete');

  // Root node phases
  await initPhases(pool, root);
  await addRequirement(pool, root, { req_id:'D-SYS-R001', title:'Vehicle AUW shall not exceed 1.5 kg including battery', verification_method:'inspection', priority:'shall', status:'verified' });
  await addRequirement(pool, root, { req_id:'D-SYS-R002', title:'Minimum hover time shall be 18 minutes at 1.2kg AUW', verification_method:'test', priority:'shall', status:'in_progress' });
  await addRequirement(pool, root, { req_id:'D-SYS-R003', title:'Vehicle shall withstand 5m/s wind without position deviation >1m', verification_method:'test', priority:'shall', status:'open' });
  await addRequirement(pool, root, { req_id:'D-SYS-R004', title:'RTK GPS accuracy shall be ±10cm horizontal in good sky conditions', verification_method:'analysis', priority:'should', status:'open' });
  await setPhaseStatus(pool, root, 'requirements', 'complete');
  await addArtifact(pool, root, 'rnd', 'design_option', null, { title:'X-frame 5" build', notes:'Compact, agile. T:W ratio 3.8:1. 14min hover.' });
  await addArtifact(pool, root, 'rnd', 'design_option', null, { title:'H-frame 7" build', notes:'Longer flight time. 22min hover. 600g payload cap. Selected.' });
  await addArtifact(pool, root, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'| | X-Frame 5" | H-Frame 7" |\n|--|--|--|\n| Flight time | 14min | 22min |\n| Agility | High | Medium |\n| Payload cap | 200g | 600g |\n| **Score** | 7.1 | **8.9** |' });
  await setPhaseStatus(pool, root, 'rnd', 'complete');
  await addArtifact(pool, root, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/drone-full-assembly', notes:'Full assembly document with all subsystems.' });
  await setPhaseStatus(pool, root, 'design_cad', 'complete');

  // Frame phases
  await initPhases(pool, frame);
  await addRequirement(pool, frame, { req_id:'D-FRAME-R001', title:'Frame shall withstand 30G crash impact without structural failure', verification_method:'test', priority:'shall', status:'in_progress' });
  await addRequirement(pool, frame, { req_id:'D-FRAME-R002', title:'Frame mass shall not exceed 180g', verification_method:'inspection', priority:'shall', status:'verified' });
  await setPhaseStatus(pool, frame, 'requirements', 'complete');
  await addArtifact(pool, frame, 'rnd', 'design_option', null, { title:'3K CF monocoque', notes:'Best stiffness/weight. Higher cost.' });
  await addArtifact(pool, frame, 'rnd', 'design_option', null, { title:'Hybrid CF/G10 sandwich', notes:'Easier repair. 15% heavier. Eliminated.' });
  await addArtifact(pool, frame, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'Selected 3K CF monocoque: 162g actual vs 180g budget.' });
  await setPhaseStatus(pool, frame, 'rnd', 'complete');
  await addArtifact(pool, frame, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/drone-frame', notes:'Frame CAD with FEA loadcases and arm joint detail.' });
  await setPhaseStatus(pool, frame, 'design_cad', 'complete');
  await addArtifact(pool, frame, 'data_collection', 'data_point', null, { label:'Frame mass (actual)', value:'162g', measurement_method:'Digital scale', tool:'Ohaus Scout', confidence:'high' });
  await addArtifact(pool, frame, 'data_collection', 'data_point', null, { label:'First natural frequency', value:'148Hz', measurement_method:'Vibration tap test', tool:'PhyPhox app', confidence:'medium' });
  await setPhaseStatus(pool, frame, 'data_collection', 'complete');

  return projId;
}

// ─── BAJA SAE PROJECT ─────────────────────────────────────────────────────────

async function seedBajaProject(pool, teamId) {
  let projId;
  try {
    const pr = await pool.query(
      `INSERT INTO projects (name, description, slug, is_demo, team_id)
       VALUES ('Baja SAE 2025', 'Formula SAE Baja off-road vehicle — 9 subsystems, 321 parts, full engineering lifecycle.', 'baja-sae-2025', true, $1)
       RETURNING id`,
      [teamId || null]
    );
    projId = pr.rows[0].id;
  } catch(e) {
    if (e.code === '23505') {
      const r = await pool.query("SELECT id FROM projects WHERE slug='baja-sae-2025'");
      projId = r.rows[0].id;
      // Update team_id if needed
      if (teamId) await pool.query('UPDATE projects SET team_id=$1 WHERE id=$2', [teamId, projId]);
    } else throw e;
  }

  const P = projId;

  // Root
  const root = await createNode(pool, { name:'Baja SAE 2025 Vehicle', part_number:'B-001', type:'ASSY', description:'Complete SAE Baja off-road single-seat competition vehicle. 9 subsystems, ~321 parts.', project_id:P });

  // ═══════════════════════════════════════════════════════
  // 1. FRAME & CHASSIS  (deep-dive: Main Hoop Assembly)
  // ═══════════════════════════════════════════════════════
  const frame = await createNode(pool, { name:'Frame & Chassis', part_number:'B-FRAME-001', type:'SUBSYS', description:'Primary roll cage and chassis structure. DOM steel tube construction. Rules B.10.', parent_id:root, project_id:P });

  const mainHoop = await createNode(pool, { name:'Main Hoop Assembly', part_number:'B-FRAME-MH-001', type:'SUBASSY', description:'Primary roll protection structure. Must pass SAE Baja Rule B.10.', parent_id:frame, project_id:P });
    await createNode(pool, { name:'Main Hoop Tube', part_number:'B-FRAME-MH-010', type:'COMP', description:'1.75" OD × 0.120" wall DOM steel. Bent to 185° arc.', parent_id:mainHoop, project_id:P });
    await createNode(pool, { name:'Gusset Plate LH', part_number:'B-FRAME-MH-011', type:'COMP', description:'3/16" HRMS steel gusset, laser cut. Welded to hoop base.', parent_id:mainHoop, project_id:P });
    await createNode(pool, { name:'Gusset Plate RH', part_number:'B-FRAME-MH-012', type:'COMP', description:'Mirror image of MH-011.', parent_id:mainHoop, project_id:P });
    await createNode(pool, { name:'Harness Mount Bracket', part_number:'B-FRAME-MH-013', type:'COMP', description:'Shoulder harness bar attachment. 1" DOM tube segment.', parent_id:mainHoop, project_id:P });
    await createNode(pool, { name:'Weld Nut M10 (×4)', part_number:'B-FRAME-MH-014', type:'PURCH', description:'M10 Grade 8 weld nut. Body panel attachment points.', parent_id:mainHoop, project_id:P });

  await createNode(pool, { name:'Front Bulkhead', part_number:'B-FRAME-010', type:'COMP', description:'Front impact attenuator mount. 1.625" DOM.', parent_id:frame, project_id:P });
  await createNode(pool, { name:'Rear Cross-brace', part_number:'B-FRAME-011', type:'COMP', description:'Rear diagonal bracing. 1.25" DOM × 0.120".', parent_id:frame, project_id:P });
  await createNode(pool, { name:'Floor Plate', part_number:'B-FRAME-012', type:'COMP', description:'16ga mild steel floor. Seam-welded.', parent_id:frame, project_id:P });
  await createNode(pool, { name:'Side Intrusion Bar LH', part_number:'B-FRAME-013', type:'COMP', description:'1.25" DOM side bar per rule B.11.', parent_id:frame, project_id:P });
  await createNode(pool, { name:'Side Intrusion Bar RH', part_number:'B-FRAME-014', type:'COMP', description:'Mirror of B-FRAME-013.', parent_id:frame, project_id:P });

  const rearSubframe = await createNode(pool, { name:'Rear Sub-frame Assembly', part_number:'B-FRAME-RSF-001', type:'SUBASSY', description:'Engine and drivetrain support structure.', parent_id:frame, project_id:P });
    await createNode(pool, { name:'Engine Mount Cross-rail', part_number:'B-FRAME-RSF-010', type:'COMP', description:'1.625" DOM cross-rail.', parent_id:rearSubframe, project_id:P });
    await createNode(pool, { name:'Engine Mount Isolators (×4)', part_number:'B-FRAME-RSF-011', type:'PURCH', description:'Vibration isolator, 40A durometer.', parent_id:rearSubframe, project_id:P });
    await createNode(pool, { name:'Differential Mount', part_number:'B-FRAME-RSF-012', type:'COMP', description:'Machined 6061 Al diff cradle.', parent_id:rearSubframe, project_id:P });
    await createNode(pool, { name:'Gearbox Cradle', part_number:'B-FRAME-RSF-013', type:'COMP', description:'Welded 1" DOM cradle for custom gearbox.', parent_id:rearSubframe, project_id:P });

  // Main Hoop deep-dive
  await initPhases(pool, mainHoop);
  await addRequirement(pool, mainHoop, { req_id:'B-MH-R001', title:'Main hoop shall pass SAE Baja Rule B.10.1 static crush load (1.5× vehicle weight)', description:'Rule B.10.1: 1.5× AUW applied laterally at top of main hoop. Max deflection 1.5" before permanent deformation.', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, mainHoop, { req_id:'B-MH-R002', title:'Main hoop tube shall be minimum 1.75" OD × 0.120" wall DOM or equivalent', verification_method:'inspection', priority:'shall', status:'verified' });
  await addRequirement(pool, mainHoop, { req_id:'B-MH-R003', title:'All welds shall be inspected per AWS D1.1 visual criteria', verification_method:'inspection', priority:'shall', status:'in_progress' });
  await addRequirement(pool, mainHoop, { req_id:'B-MH-R004', title:'Gussets shall be welded on both inner and outer face of hoop base', verification_method:'inspection', priority:'shall', status:'open' });
  await setPhaseStatus(pool, mainHoop, 'requirements', 'complete');
  await addArtifact(pool, mainHoop, 'rnd', 'design_option', null, { title:'1.75" OD DOM + gussets (current)', notes:'Meets rule. FEA validated. Safety factor 2.3.' });
  await addArtifact(pool, mainHoop, 'rnd', 'design_option', null, { title:'1.5" OD seamless + extra gussets', notes:'Lighter. Fails rule B.10.1 by 8%. Eliminated.' });
  await addArtifact(pool, mainHoop, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'| | 1.75" DOM | 1.5" Seamless |\n|--|--|--|\n| Rule compliance | Pass | FAIL |\n| Mass | 4.2kg | 3.8kg |\n| SF (lateral) | 2.3 | 0.92 |\n| **Decision** | Selected | Eliminated |' });
  await setPhaseStatus(pool, mainHoop, 'rnd', 'complete');
  await addArtifact(pool, mainHoop, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/baja2025-frame/main-hoop', notes:'Main hoop with gusset detail and weld callouts. Rev C.' });
  await setPhaseStatus(pool, mainHoop, 'design_cad', 'complete');
  await addArtifact(pool, mainHoop, 'data_collection', 'data_point', null, { label:'Static crush load (lateral)', value:'1847 lbf', measurement_method:'Hydraulic press with load cell', tool:'Instron 5500R', confidence:'high' });
  await addArtifact(pool, mainHoop, 'data_collection', 'data_point', null, { label:'Deflection at 1.5× AUW', value:'0.82"', measurement_method:'Dial indicator', tool:'Starrett 196', confidence:'high' });
  await addArtifact(pool, mainHoop, 'data_collection', 'data_point', null, { label:'FEA von Mises peak stress', value:'38.2 ksi', measurement_method:'ANSYS Static Structural', tool:'ANSYS 2024R1', confidence:'high' });
  await setPhaseStatus(pool, mainHoop, 'data_collection', 'complete');
  await addArtifact(pool, mainHoop, 'analysis_cae', 'cae_report', 'cae_report', { content:'FEA correlation: FEA predicted 36.4ksi peak von Mises at B.10.1 load case. Physical test measured 38.2ksi (from strain gauge). Delta = 4.9%. Within 5% correlation target. Model validated.', tool:'ANSYS 2024R1', status:'complete' });
  await setPhaseStatus(pool, mainHoop, 'analysis_cae', 'complete');
  await createDoeStudy(pool, mainHoop,
    'Gusset Geometry DOE — Main Hoop',
    'Find optimal gusset plate geometry that maximises lateral stiffness at minimum weight.',
    [
      { name:'Gusset Length', unit:'in', levels:['3.0','3.5','4.0','4.5'] },
      { name:'Gusset Thickness', unit:'in', levels:['0.125','0.1875','0.250'] }
    ],
    [
      { name:'Peak von Mises', unit:'ksi', target:'minimize' },
      { name:'Mass Added', unit:'lbm', target:'minimize' },
      { name:'Crush Stiffness', unit:'kip/in', target:'maximize' }
    ],
    [
      { factors:['3.0','0.125'], results:[41.2, 0.38, 8.2], notes:'Baseline' },
      { factors:['3.5','0.125'], results:[39.1, 0.44, 9.1] },
      { factors:['4.0','0.1875'], results:[36.8, 0.61, 10.8], notes:'Near-optimum — selected' },
      { factors:['4.5','0.1875'], results:[35.4, 0.72, 11.4] },
      { factors:['3.5','0.250'], results:[34.9, 0.82, 12.1], notes:'Diminishing returns' },
      { factors:['4.0','0.250'], results:[33.2, 0.94, 13.2], notes:'Overbuilt' }
    ]
  );

  // ═══════════════════════════════════════════════════════
  // 2. FRONT SUSPENSION  (deep-dive: Upper A-Arm)
  // ═══════════════════════════════════════════════════════
  const frontSusp = await createNode(pool, { name:'Front Suspension', part_number:'B-FS-001', type:'SUBSYS', description:'Independent double-wishbone front suspension. 14" travel.', parent_id:root, project_id:P });

  const upperAArm = await createNode(pool, { name:'Upper A-Arm Assembly', part_number:'B-FS-UAA-001', type:'SUBASSY', description:'Upper control arm. 4130 chromoly tube, gusset welded.', parent_id:frontSusp, project_id:P });
    await createNode(pool, { name:'A-Arm Main Tube', part_number:'B-FS-UAA-010', type:'COMP', description:'1.0" OD × 0.065" 4130 Cr-Mo. Bent to geometry.', parent_id:upperAArm, project_id:P });
    await createNode(pool, { name:'A-Arm Brace Tube', part_number:'B-FS-UAA-011', type:'COMP', description:'0.75" OD × 0.065" 4130. Diagonal brace.', parent_id:upperAArm, project_id:P });
    await createNode(pool, { name:'Rod End Bearing FK6 (×2)', part_number:'B-FS-UAA-012', type:'PURCH', description:'FK6 1/2" female rod end.', parent_id:upperAArm, project_id:P });
    await createNode(pool, { name:'Jam Nut 1/2-20 (×2)', part_number:'B-FS-UAA-013', type:'PURCH', description:'1/2-20 jam nut, grade 5.', parent_id:upperAArm, project_id:P });
    await createNode(pool, { name:'Inboard Mount Bracket', part_number:'B-FS-UAA-014', type:'COMP', description:'3/16" HRMS bracket, welded to main chassis.', parent_id:upperAArm, project_id:P });

  const lowerAArm = await createNode(pool, { name:'Lower A-Arm Assembly', part_number:'B-FS-LAA-001', type:'SUBASSY', description:'Lower control arm. Longer geometry for negative camber gain.', parent_id:frontSusp, project_id:P });
    await createNode(pool, { name:'Lower A-Arm Main Tube', part_number:'B-FS-LAA-010', type:'COMP', description:'1.25" OD × 0.065" 4130.', parent_id:lowerAArm, project_id:P });
    await createNode(pool, { name:'Lower A-Arm Brace Tube', part_number:'B-FS-LAA-011', type:'COMP', description:'1.0" OD × 0.065" 4130.', parent_id:lowerAArm, project_id:P });
    await createNode(pool, { name:'Lower Rod End FK8 (×2)', part_number:'B-FS-LAA-012', type:'PURCH', description:'FK8 5/8" female rod end.', parent_id:lowerAArm, project_id:P });
    await createNode(pool, { name:'Lower Mount Bracket', part_number:'B-FS-LAA-013', type:'COMP', description:'1/4" HRMS bracket welded to frame.', parent_id:lowerAArm, project_id:P });

  const frontCoilOver = await createNode(pool, { name:'Front Coilover Assembly', part_number:'B-FS-CO-001', type:'SUBASSY', description:'Fox 2.0 Factory Series coilover. 10" travel.', parent_id:frontSusp, project_id:P });
    await createNode(pool, { name:'Fox 2.0 Coilover Body', part_number:'B-FS-CO-010', type:'PURCH', description:'Fox 2.0 Factory Series adjustable body.', parent_id:frontCoilOver, project_id:P });
    await createNode(pool, { name:'Coilover Spring 250lb/in', part_number:'B-FS-CO-011', type:'PURCH', description:'Eibach 250lb/in spring, 2.5" ID × 8".', parent_id:frontCoilOver, project_id:P });
    await createNode(pool, { name:'Coilover Upper Mount', part_number:'B-FS-CO-012', type:'COMP', description:'CNC 6061 upper mount clevis.', parent_id:frontCoilOver, project_id:P });
    await createNode(pool, { name:'Coilover Lower Mount', part_number:'B-FS-CO-013', type:'COMP', description:'CNC 6061 lower mount pin.', parent_id:frontCoilOver, project_id:P });

  await createNode(pool, { name:'Front Upright (×2)', part_number:'B-FS-UPRT-001', type:'COMP', description:'Billet 7075 Al upright. Ball joint and spindle integrated.', parent_id:frontSusp, project_id:P });
  await createNode(pool, { name:'Upper Ball Joint (×2)', part_number:'B-FS-BJ-001', type:'PURCH', description:'Niwot Racing NR-9511 Heim BJ.', parent_id:frontSusp, project_id:P });
  await createNode(pool, { name:'Lower Ball Joint (×2)', part_number:'B-FS-BJ-002', type:'PURCH', description:'Niwot Racing NR-9512.', parent_id:frontSusp, project_id:P });
  await createNode(pool, { name:'Front Hub/Spindle (×2)', part_number:'B-FS-HUB-001', type:'COMP', description:'Billet 7075 front hub with bearing seats.', parent_id:frontSusp, project_id:P });
  await createNode(pool, { name:'Front Wheel Bearing (×2)', part_number:'B-FS-HUB-002', type:'PURCH', description:'6205-2RS sealed bearing.', parent_id:frontSusp, project_id:P });

  // Upper A-Arm deep-dive
  await initPhases(pool, upperAArm);
  await addRequirement(pool, upperAArm, { req_id:'B-UAA-R001', title:'Upper A-arm shall withstand 3G bump load without permanent deformation', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, upperAArm, { req_id:'B-UAA-R002', title:'A-arm geometry shall produce 0.5°/in negative camber gain in jounce', verification_method:'analysis', priority:'shall', status:'verified' });
  await addRequirement(pool, upperAArm, { req_id:'B-UAA-R003', title:'Rod end jam nuts shall be torqued to 25 ft-lbs and safety-wired', verification_method:'inspection', priority:'shall', status:'in_progress' });
  await setPhaseStatus(pool, upperAArm, 'requirements', 'complete');
  await addArtifact(pool, upperAArm, 'rnd', 'design_option', null, { title:'4130 Cr-Mo tube (current)', notes:'Weight 1.2kg. FEA SF=2.8. Field-weld repairable.' });
  await addArtifact(pool, upperAArm, 'rnd', 'design_option', null, { title:'6061 Al billet machined', notes:'Weight 0.8kg but machining cost prohibitive. Eliminated.' });
  await addArtifact(pool, upperAArm, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'Selected 4130 Cr-Mo — weld-repairable at race sites, lower cost, adequate SF.' });
  await setPhaseStatus(pool, upperAArm, 'rnd', 'complete');
  await addArtifact(pool, upperAArm, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/baja2025-suspension/upper-a-arm', notes:'Upper A-arm with full kinematic analysis overlay.' });
  await setPhaseStatus(pool, upperAArm, 'design_cad', 'complete');
  await addArtifact(pool, upperAArm, 'data_collection', 'data_point', null, { label:'3G bump load reaction', value:'1240 lbf', measurement_method:'Load cell', tool:'MTS 810', confidence:'high' });
  await addArtifact(pool, upperAArm, 'data_collection', 'data_point', null, { label:'Camber gain per inch jounce', value:'-0.52°/in', measurement_method:'CMM with angle probe', tool:'Renishaw CMM', confidence:'high' });
  await setPhaseStatus(pool, upperAArm, 'data_collection', 'complete');
  await createDoeStudy(pool, upperAArm,
    'A-Arm Tube Wall Thickness DOE',
    'Optimise wall thickness to minimise mass while maintaining required safety factor under 3G bump loading.',
    [
      { name:'Wall Thickness', unit:'in', levels:['0.049','0.065','0.083','0.095'] },
      { name:'Tube OD', unit:'in', levels:['0.875','1.0','1.125'] }
    ],
    [
      { name:'Mass', unit:'lbm', target:'minimize' },
      { name:'FEA Safety Factor', unit:'', target:'maximize' },
      { name:'Deflection at 3G', unit:'in', target:'minimize' }
    ],
    [
      { factors:['0.049','1.0'], results:[0.68, 1.8, 0.42], notes:'Too flexible' },
      { factors:['0.065','1.0'], results:[0.82, 2.8, 0.28], notes:'Current design — selected' },
      { factors:['0.083','1.0'], results:[1.02, 3.6, 0.21], notes:'Overbuilt' },
      { factors:['0.065','1.125'], results:[0.94, 3.1, 0.24], notes:'Slightly better SF' },
      { factors:['0.049','1.125'], results:[0.79, 2.4, 0.32] },
      { factors:['0.083','0.875'], results:[0.88, 2.6, 0.31] }
    ]
  );

  // ═══════════════════════════════════════════════════════
  // 3. REAR SUSPENSION
  // ═══════════════════════════════════════════════════════
  const rearSusp = await createNode(pool, { name:'Rear Suspension', part_number:'B-RS-001', type:'SUBSYS', description:'Independent trailing arm rear suspension. 16" travel.', parent_id:root, project_id:P });
  await initPhases(pool, rearSusp);
  await addRequirement(pool, rearSusp, { req_id:'B-RS-R001', title:'Rear suspension shall provide minimum 16" total travel', verification_method:'test', priority:'shall', status:'in_progress' });
  await addRequirement(pool, rearSusp, { req_id:'B-RS-R002', title:'Rear axles shall withstand 4G bump torsional load without yielding', verification_method:'analysis', priority:'shall', status:'open' });
  await setPhaseStatus(pool, rearSusp, 'requirements', 'in_progress');

  const rearTrailArm = await createNode(pool, { name:'Trailing Arm Assembly (×2)', part_number:'B-RS-TA-001', type:'SUBASSY', description:'Main load-carrying trailing arm.', parent_id:rearSusp, project_id:P });
    await createNode(pool, { name:'Trailing Arm Main Tube', part_number:'B-RS-TA-010', type:'COMP', description:'1.5" OD × 0.095" 4130.', parent_id:rearTrailArm, project_id:P });
    await createNode(pool, { name:'Lateral Link', part_number:'B-RS-TA-011', type:'COMP', description:'1.0" OD × 0.065" 4130 Panhard bar.', parent_id:rearTrailArm, project_id:P });
    await createNode(pool, { name:'Trailing Arm Rod End (×2)', part_number:'B-RS-TA-012', type:'PURCH', description:'FK8 rod end.', parent_id:rearTrailArm, project_id:P });
    await createNode(pool, { name:'Toe Link', part_number:'B-RS-TA-013', type:'COMP', description:'0.75" DOM toe adjustment link.', parent_id:rearTrailArm, project_id:P });

  const rearCoilOver = await createNode(pool, { name:'Rear Coilover Assembly', part_number:'B-RS-CO-001', type:'SUBASSY', parent_id:rearSusp, project_id:P });
    await createNode(pool, { name:'Fox 2.0 Rear Shock Body', part_number:'B-RS-CO-010', type:'PURCH', description:'Fox 2.0 Factory Series, 10" stroke.', parent_id:rearCoilOver, project_id:P });
    await createNode(pool, { name:'Rear Spring 200lb/in', part_number:'B-RS-CO-011', type:'PURCH', description:'Eibach 200lb/in, 2.5" × 10".', parent_id:rearCoilOver, project_id:P });
    await createNode(pool, { name:'Rear Upper Mount', part_number:'B-RS-CO-012', type:'COMP', description:'CNC 6061 upper mount.', parent_id:rearCoilOver, project_id:P });

  const rearHubAssy = await createNode(pool, { name:'Rear Hub Assembly (×2)', part_number:'B-RS-HUB-001', type:'SUBASSY', parent_id:rearSusp, project_id:P });
    await createNode(pool, { name:'Rear Hub', part_number:'B-RS-HUB-010', type:'COMP', description:'Billet 7075 Al hub, 5-bolt pattern.', parent_id:rearHubAssy, project_id:P });
    await createNode(pool, { name:'Rear Wheel Bearing 6205', part_number:'B-RS-HUB-011', type:'PURCH', parent_id:rearHubAssy, project_id:P });
    await createNode(pool, { name:'Rear Axle', part_number:'B-RS-HUB-012', type:'COMP', description:'4340 steel axle, heat treated. 1.25" dia.', parent_id:rearHubAssy, project_id:P });
    await createNode(pool, { name:'CV Joint (×2)', part_number:'B-RS-HUB-013', type:'PURCH', description:'Rzeppa-type CV joint, 1-3/8" bore.', parent_id:rearHubAssy, project_id:P });

  // ═══════════════════════════════════════════════════════
  // 4. POWERTRAIN  (deep-dive: Gearbox Assembly)
  // ═══════════════════════════════════════════════════════
  const powertrain = await createNode(pool, { name:'Powertrain', part_number:'B-PT-001', type:'SUBSYS', description:'Briggs & Stratton 10hp engine, CVT transmission, custom planetary gearbox, chain final drive.', parent_id:root, project_id:P });

  const engine = await createNode(pool, { name:'Engine Assembly', part_number:'B-PT-ENG-001', type:'SUBASSY', parent_id:powertrain, project_id:P });
    await createNode(pool, { name:'Briggs 10hp OHV Engine', part_number:'B-PT-ENG-010', type:'PURCH', description:'BS 19hp OHV sealed per rules — governor intact.', parent_id:engine, project_id:P });
    await createNode(pool, { name:'Throttle Body & Cable', part_number:'B-PT-ENG-011', type:'PURCH', parent_id:engine, project_id:P });
    await createNode(pool, { name:'Air Filter Assembly', part_number:'B-PT-ENG-012', type:'SUBASSY', parent_id:engine, project_id:P });
    await createNode(pool, { name:'Engine Stop Switch', part_number:'B-PT-ENG-013', type:'PURCH', description:'SAE-required ignition cut-off switch.', parent_id:engine, project_id:P });

  const cvt = await createNode(pool, { name:'CVT Assembly', part_number:'B-PT-CVT-001', type:'SUBASSY', description:'Continuously variable transmission. Primary + secondary driven clutch.', parent_id:powertrain, project_id:P });
    await createNode(pool, { name:'Primary Clutch (Driver)', part_number:'B-PT-CVT-010', type:'PURCH', description:'Comet 780 series primary clutch.', parent_id:cvt, project_id:P });
    await createNode(pool, { name:'Secondary Clutch (Driven)', part_number:'B-PT-CVT-011', type:'PURCH', description:'Comet 780 series driven clutch.', parent_id:cvt, project_id:P });
    await createNode(pool, { name:'CVT Belt', part_number:'B-PT-CVT-012', type:'PURCH', description:'Comet 203589A belt.', parent_id:cvt, project_id:P });
    await createNode(pool, { name:'CVT Guard', part_number:'B-PT-CVT-013', type:'COMP', description:'0.060" 5052 Al sheet guard.', parent_id:cvt, project_id:P });

  const gearbox = await createNode(pool, { name:'Gearbox Assembly', part_number:'B-PT-GB-001', type:'SUBASSY', description:'2-stage planetary reduction gearbox. 8:1 final ratio. Custom designed.', parent_id:powertrain, project_id:P });
    await createNode(pool, { name:'Gear Housing', part_number:'B-PT-GB-010', type:'COMP', description:'Cast 356 Al, CNC finish bores. Split case design.', parent_id:gearbox, project_id:P });
    await createNode(pool, { name:'Input Shaft', part_number:'B-PT-GB-011', type:'COMP', description:'4340 steel, 1" dia. 23T sprocket end.', parent_id:gearbox, project_id:P });
  const stage1 = await createNode(pool, { name:'Stage 1 Planetary Set (4:1)', part_number:'B-PT-GB-012', type:'SUBASSY', description:'4:1 reduction. Ring, planet, sun gears + carrier.', parent_id:gearbox, project_id:P });
    await createNode(pool, { name:'Ring Gear S1 (84T)', part_number:'B-PT-GB-012A', type:'COMP', description:'Internal ring gear, 84T 12DP.', parent_id:stage1, project_id:P });
    await createNode(pool, { name:'Planet Gear S1 21T (×4)', part_number:'B-PT-GB-012B', type:'COMP', description:'21T 12DP planet gear. 4 required.', parent_id:stage1, project_id:P });
    await createNode(pool, { name:'Sun Gear S1 (42T)', part_number:'B-PT-GB-012C', type:'COMP', description:'42T sun gear.', parent_id:stage1, project_id:P });
    await createNode(pool, { name:'Planet Carrier S1', part_number:'B-PT-GB-012D', type:'COMP', description:'4340 steel carrier, 4 pin holes.', parent_id:stage1, project_id:P });
  const stage2 = await createNode(pool, { name:'Stage 2 Planetary Set (2:1)', part_number:'B-PT-GB-013', type:'SUBASSY', description:'2:1 reduction. Second stage.', parent_id:gearbox, project_id:P });
    await createNode(pool, { name:'Ring Gear S2 (60T)', part_number:'B-PT-GB-013A', type:'COMP', parent_id:stage2, project_id:P });
    await createNode(pool, { name:'Planet Gear S2 20T (×3)', part_number:'B-PT-GB-013B', type:'COMP', parent_id:stage2, project_id:P });
    await createNode(pool, { name:'Sun Gear S2 (30T)', part_number:'B-PT-GB-013C', type:'COMP', parent_id:stage2, project_id:P });
    await createNode(pool, { name:'Planet Carrier S2', part_number:'B-PT-GB-013D', type:'COMP', parent_id:stage2, project_id:P });
    await createNode(pool, { name:'Output Shaft', part_number:'B-PT-GB-014', type:'COMP', description:'4340 steel. Splined end for chain sprocket.', parent_id:gearbox, project_id:P });
    await createNode(pool, { name:'Needle Bearing HK series (×6)', part_number:'B-PT-GB-015', type:'PURCH', description:'Torrington HK series planet pin bearings.', parent_id:gearbox, project_id:P });
    await createNode(pool, { name:'Gear Oil Seal (×2)', part_number:'B-PT-GB-016', type:'PURCH', description:'Viton lip seal, input and output shafts.', parent_id:gearbox, project_id:P });
    await createNode(pool, { name:'Gear Oil 75W90 (300mL)', part_number:'B-PT-GB-017', type:'PURCH', parent_id:gearbox, project_id:P });

  const chainDrive = await createNode(pool, { name:'Chain Final Drive Assembly', part_number:'B-PT-CD-001', type:'SUBASSY', parent_id:powertrain, project_id:P });
    await createNode(pool, { name:'Drive Sprocket 15T', part_number:'B-PT-CD-010', type:'COMP', parent_id:chainDrive, project_id:P });
    await createNode(pool, { name:'Driven Sprocket 45T', part_number:'B-PT-CD-011', type:'COMP', parent_id:chainDrive, project_id:P });
    await createNode(pool, { name:'#50 Roller Chain', part_number:'B-PT-CD-012', type:'PURCH', parent_id:chainDrive, project_id:P });
    await createNode(pool, { name:'Chain Tensioner', part_number:'B-PT-CD-013', type:'COMP', parent_id:chainDrive, project_id:P });
    await createNode(pool, { name:'Chain Guard', part_number:'B-PT-CD-014', type:'COMP', parent_id:chainDrive, project_id:P });

  // Gearbox deep-dive
  await initPhases(pool, gearbox);
  await addRequirement(pool, gearbox, { req_id:'B-GB-R001', title:'Gearbox shall transmit peak engine torque (30 ft-lbs) with SF>=2.5', description:'Includes dynamic shock loading factor of 2.0 on peak torque.', verification_method:'analysis', priority:'shall', status:'verified' });
  await addRequirement(pool, gearbox, { req_id:'B-GB-R002', title:'Oil temperature shall not exceed 250°F at sustained 60% throttle', verification_method:'test', priority:'shall', status:'in_progress' });
  await addRequirement(pool, gearbox, { req_id:'B-GB-R003', title:'Gearbox shall achieve 8:1 ratio ±2%', verification_method:'inspection', priority:'shall', status:'verified' });
  await addRequirement(pool, gearbox, { req_id:'B-GB-R004', title:'Overall mechanical efficiency shall exceed 92%', verification_method:'test', priority:'shall', status:'open' });
  await setPhaseStatus(pool, gearbox, 'requirements', 'complete');
  await addArtifact(pool, gearbox, 'rnd', 'design_option', null, { title:'2-stage planetary 8:1 (current)', notes:'Compact, high efficiency. Custom machined.' });
  await addArtifact(pool, gearbox, 'rnd', 'design_option', null, { title:'Inline spur 2-stage', notes:'Longer axial length. Higher backlash. Eliminated.' });
  await addArtifact(pool, gearbox, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'Planetary selected: 40% smaller envelope, 94% efficiency vs 89% for inline spur.' });
  await setPhaseStatus(pool, gearbox, 'rnd', 'complete');
  await addArtifact(pool, gearbox, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/baja2025-drivetrain/gearbox', notes:'Full gearbox detail with tolerance analysis. GD&T complete.' });
  await setPhaseStatus(pool, gearbox, 'design_cad', 'complete');
  await addArtifact(pool, gearbox, 'data_collection', 'data_point', null, { label:'Efficiency at 50% load', value:'94.2%', measurement_method:'Input/output torque measurement', tool:'Kistler Type 4504A', confidence:'high' });
  await addArtifact(pool, gearbox, 'data_collection', 'data_point', null, { label:'Max oil temp at sustained run', value:'218°F', measurement_method:'Thermocouple in oil sump', tool:'Omega DP24', confidence:'high' });
  await setPhaseStatus(pool, gearbox, 'data_collection', 'complete');
  await createDoeStudy(pool, gearbox,
    'Gear Lubricant Selection DOE',
    'Select optimal gear oil viscosity grade for operating temperature and efficiency.',
    [
      { name:'Oil Viscosity ISO', unit:'grade', levels:['32','46','68','100'] },
      { name:'Oil Temperature', unit:'°F', levels:['150','200','250'] }
    ],
    [
      { name:'Mechanical Efficiency', unit:'%', target:'maximize' },
      { name:'Oil Temp Rise Rate', unit:'°F/min', target:'minimize' }
    ],
    [
      { factors:['32','150'], results:[95.1, 0.8], notes:'Cold start' },
      { factors:['46','150'], results:[94.8, 0.7] },
      { factors:['46','200'], results:[94.2, 1.1], notes:'Nominal operating' },
      { factors:['68','200'], results:[93.6, 0.9] },
      { factors:['68','250'], results:[92.8, 0.8], notes:'Hot conditions' },
      { factors:['100','250'], results:[91.4, 0.7], notes:'Too viscous cold' }
    ]
  );

  // ═══════════════════════════════════════════════════════
  // 5. STEERING
  // ═══════════════════════════════════════════════════════
  const steering = await createNode(pool, { name:'Steering', part_number:'B-STR-001', type:'SUBSYS', description:'Rack and pinion steering with quick-release hub and adjustable toe.', parent_id:root, project_id:P });
  await initPhases(pool, steering);
  await addRequirement(pool, steering, { req_id:'B-STR-R001', title:'Steering ratio shall be 4.5:1 (rack turns lock-to-lock)', verification_method:'inspection', priority:'shall', status:'open' });
  await addRequirement(pool, steering, { req_id:'B-STR-R002', title:'Steering effort shall not exceed 15 lbf at full lock', verification_method:'test', priority:'should', status:'open' });
  await setPhaseStatus(pool, steering, 'requirements', 'in_progress');

  const rack = await createNode(pool, { name:'Rack & Pinion Assembly', part_number:'B-STR-RACK-001', type:'SUBASSY', parent_id:steering, project_id:P });
    await createNode(pool, { name:'Rack Housing', part_number:'B-STR-RACK-010', type:'COMP', description:'Billet 6061 rack housing.', parent_id:rack, project_id:P });
    await createNode(pool, { name:'Rack Bar', part_number:'B-STR-RACK-011', type:'COMP', description:'4340 steel, 3/4" dia.', parent_id:rack, project_id:P });
    await createNode(pool, { name:'Pinion Gear', part_number:'B-STR-RACK-012', type:'COMP', parent_id:rack, project_id:P });
    await createNode(pool, { name:'Tie Rod (×2)', part_number:'B-STR-RACK-013', type:'COMP', parent_id:rack, project_id:P });
    await createNode(pool, { name:'Tie Rod End FK6 (×2)', part_number:'B-STR-RACK-014', type:'PURCH', parent_id:rack, project_id:P });

  const steeringCol = await createNode(pool, { name:'Steering Column Assembly', part_number:'B-STR-COL-001', type:'SUBASSY', parent_id:steering, project_id:P });
    await createNode(pool, { name:'Steering Column Tube', part_number:'B-STR-COL-010', type:'COMP', parent_id:steeringCol, project_id:P });
    await createNode(pool, { name:'Quick-Release Hub', part_number:'B-STR-COL-011', type:'PURCH', description:'OMP Racing QR hub.', parent_id:steeringCol, project_id:P });
    await createNode(pool, { name:'Steering Wheel', part_number:'B-STR-COL-012', type:'PURCH', description:'OMP Rally 350mm wheel.', parent_id:steeringCol, project_id:P });
    await createNode(pool, { name:'U-joint (×2)', part_number:'B-STR-COL-013', type:'PURCH', parent_id:steeringCol, project_id:P });

  // ═══════════════════════════════════════════════════════
  // 6. BRAKES  (deep-dive: Front Brake Rotor)
  // ═══════════════════════════════════════════════════════
  const brakes = await createNode(pool, { name:'Brakes', part_number:'B-BRK-001', type:'SUBSYS', description:'4-wheel hydraulic disc brakes with adjustable brake bias bar.', parent_id:root, project_id:P });

  const frontBrakeAssy = await createNode(pool, { name:'Front Brake Assembly (×2)', part_number:'B-BRK-FRT-001', type:'SUBASSY', parent_id:brakes, project_id:P });
  const frontRotor = await createNode(pool, { name:'Front Brake Rotor', part_number:'B-BRK-FRT-010', type:'COMP', description:'9" dia × 0.25" 1018 steel rotor. Cross-drilled. Heat treated 1000°F temper.', parent_id:frontBrakeAssy, project_id:P });
    await createNode(pool, { name:'Front Brake Caliper Wilwood', part_number:'B-BRK-FRT-011', type:'PURCH', description:'Wilwood Dynapro 1.12" single piston.', parent_id:frontBrakeAssy, project_id:P });
    await createNode(pool, { name:'Front Brake Pads BP-10 (×2 sets)', part_number:'B-BRK-FRT-012', type:'PURCH', parent_id:frontBrakeAssy, project_id:P });
    await createNode(pool, { name:'Rotor Hat Front', part_number:'B-BRK-FRT-013', type:'COMP', description:'6061 Al rotor hat. Mounts to hub with 5 bolts.', parent_id:frontBrakeAssy, project_id:P });

  const rearBrakeAssy = await createNode(pool, { name:'Rear Brake Assembly (×2)', part_number:'B-BRK-RR-001', type:'SUBASSY', parent_id:brakes, project_id:P });
    await createNode(pool, { name:'Rear Brake Rotor', part_number:'B-BRK-RR-010', type:'COMP', description:'8" dia × 0.25" 1018 steel rotor.', parent_id:rearBrakeAssy, project_id:P });
    await createNode(pool, { name:'Rear Caliper Wilwood', part_number:'B-BRK-RR-011', type:'PURCH', parent_id:rearBrakeAssy, project_id:P });
    await createNode(pool, { name:'Rear Brake Pads (×2 sets)', part_number:'B-BRK-RR-012', type:'PURCH', parent_id:rearBrakeAssy, project_id:P });

  const masterCylinder = await createNode(pool, { name:'Master Cylinder Assembly', part_number:'B-BRK-MC-001', type:'SUBASSY', parent_id:brakes, project_id:P });
    await createNode(pool, { name:'Front Master Cylinder 0.75"', part_number:'B-BRK-MC-010', type:'PURCH', description:'Wilwood 0.75" bore.', parent_id:masterCylinder, project_id:P });
    await createNode(pool, { name:'Rear Master Cylinder 0.625"', part_number:'B-BRK-MC-011', type:'PURCH', parent_id:masterCylinder, project_id:P });
    await createNode(pool, { name:'Brake Bias Bar Adjuster', part_number:'B-BRK-MC-012', type:'PURCH', parent_id:masterCylinder, project_id:P });
    await createNode(pool, { name:'Brake Lines Braided SS Kit', part_number:'B-BRK-MC-013', type:'PURCH', description:'Braided SS lines, AN-3 fittings.', parent_id:masterCylinder, project_id:P });

  // Front Brake Rotor deep-dive
  await initPhases(pool, frontRotor);
  await addRequirement(pool, frontRotor, { req_id:'B-ROT-R001', title:'Rotor max surface temp shall not exceed 600°F under 5 consecutive stops from 40mph', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, frontRotor, { req_id:'B-ROT-R002', title:'Rotor shall meet SAE J1569 minimum friction coefficient 0.35μ cold', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, frontRotor, { req_id:'B-ROT-R003', title:'Rotor warpage shall not exceed 0.003" TIR after 25 stops from 40mph', verification_method:'test', priority:'shall', status:'in_progress' });
  await addRequirement(pool, frontRotor, { req_id:'B-ROT-R004', title:'Drill hole placement shall maintain minimum material area per SAE Baja rules', verification_method:'analysis', priority:'shall', status:'verified' });
  await setPhaseStatus(pool, frontRotor, 'requirements', 'complete');
  await addArtifact(pool, frontRotor, 'rnd', 'design_option', null, { title:'9" 1018 steel cross-drilled (current)', notes:'Proven material. Easy to machine. Low cost.' });
  await addArtifact(pool, frontRotor, 'rnd', 'design_option', null, { title:'9" 4340 steel solid', notes:'Higher strength but 2× cost. No thermal benefit.' });
  await addArtifact(pool, frontRotor, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'1018 selected: adequate strength, better heat dissipation from drilling, lower cost.' });
  await setPhaseStatus(pool, frontRotor, 'rnd', 'complete');
  await addArtifact(pool, frontRotor, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/baja2025-brakes/front-rotor', notes:'Rotor DXF with drill pattern and thermal FEA loadcases.' });
  await setPhaseStatus(pool, frontRotor, 'design_cad', 'complete');
  await addArtifact(pool, frontRotor, 'data_collection', 'data_point', null, { label:'Peak surface temp (5 stops)', value:'498°F', measurement_method:'IR thermometer', tool:'FLIR E8 Pro', confidence:'medium' });
  await addArtifact(pool, frontRotor, 'data_collection', 'data_point', null, { label:'Friction coefficient cold', value:'0.41μ', measurement_method:'Brake dynamometer', tool:'Link Engineering BD-22', confidence:'high' });
  await addArtifact(pool, frontRotor, 'data_collection', 'data_point', null, { label:'Rotor warpage after 25 stops', value:'0.0028"', measurement_method:'V-block + dial indicator', tool:'Mitutoyo 513-402', confidence:'high' });
  await setPhaseStatus(pool, frontRotor, 'data_collection', 'complete');
  await addArtifact(pool, frontRotor, 'analysis_cae', 'cae_report', 'cae_report', { content:'Thermal FEA: 5-stop cycle from 40mph. Peak bulk temp 512°F (FEA) vs 498°F (test). Delta 2.7%. Within 5% target. No stress risers at drill pattern. Model validated.', tool:'ANSYS Thermal 2024R1', status:'complete' });
  await setPhaseStatus(pool, frontRotor, 'analysis_cae', 'complete');
  await createDoeStudy(pool, frontRotor,
    'Brake Rotor Drill Pattern DOE',
    'Optimise drill hole size and pattern to maximise heat dissipation while maintaining structural integrity.',
    [
      { name:'Hole Diameter', unit:'in', levels:['0.375','0.500','0.625'] },
      { name:'Holes per PCD', unit:'count', levels:['8','12','16'] }
    ],
    [
      { name:'Peak Temp (5 stops)', unit:'°F', target:'minimize' },
      { name:'Rotor Mass', unit:'lbm', target:'minimize' },
      { name:'Material Area Ratio', unit:'%', target:'maximize' }
    ],
    [
      { factors:['0.375','8'], results:[542, 3.1, 91], notes:'Minimal drilling' },
      { factors:['0.375','12'], results:[521, 2.9, 88] },
      { factors:['0.500','12'], results:[498, 2.6, 84], notes:'Current design — selected' },
      { factors:['0.500','16'], results:[481, 2.4, 79], notes:'Slight stress concern' },
      { factors:['0.625','12'], results:[476, 2.2, 78], notes:'Too much material removed' },
      { factors:['0.625','16'], results:[461, 2.0, 71], notes:'Fails area ratio rule' }
    ]
  );

  // ═══════════════════════════════════════════════════════
  // 7. ERGONOMICS
  // ═══════════════════════════════════════════════════════
  const ergo = await createNode(pool, { name:'Ergonomics', part_number:'B-ERG-001', type:'SUBSYS', description:'Driver interface: seat, harness, pedals, and cockpit controls.', parent_id:root, project_id:P });
  await initPhases(pool, ergo);
  await addRequirement(pool, ergo, { req_id:'B-ERG-R001', title:'Seat shall support 5th–95th percentile driver per SAE J826', verification_method:'inspection', priority:'shall', status:'open' });
  await addRequirement(pool, ergo, { req_id:'B-ERG-R002', title:'Harness shall be SFI 16.1 or FIA 8853/98 certified', verification_method:'inspection', priority:'shall', status:'open' });
  await setPhaseStatus(pool, ergo, 'requirements', 'in_progress');

  await createNode(pool, { name:'Driver Seat Kirkey 38200', part_number:'B-ERG-SEAT-001', type:'PURCH', description:'Kirkey 38200 aluminium race seat. 15" wide.', parent_id:ergo, project_id:P });
  const harness = await createNode(pool, { name:'5-Point Harness Assembly', part_number:'B-ERG-HARN-001', type:'SUBASSY', parent_id:ergo, project_id:P });
    await createNode(pool, { name:'Lap Belt Pair', part_number:'B-ERG-HARN-010', type:'PURCH', parent_id:harness, project_id:P });
    await createNode(pool, { name:'Shoulder Straps (×2)', part_number:'B-ERG-HARN-011', type:'PURCH', parent_id:harness, project_id:P });
    await createNode(pool, { name:'Crotch Strap', part_number:'B-ERG-HARN-012', type:'PURCH', parent_id:harness, project_id:P });
    await createNode(pool, { name:'Center Latch Buckle', part_number:'B-ERG-HARN-013', type:'PURCH', parent_id:harness, project_id:P });
  const pedals = await createNode(pool, { name:'Pedal Box Assembly', part_number:'B-ERG-PED-001', type:'SUBASSY', parent_id:ergo, project_id:P });
    await createNode(pool, { name:'Throttle Pedal', part_number:'B-ERG-PED-010', type:'COMP', parent_id:pedals, project_id:P });
    await createNode(pool, { name:'Brake Pedal', part_number:'B-ERG-PED-011', type:'COMP', parent_id:pedals, project_id:P });
    await createNode(pool, { name:'Pedal Mount Plate', part_number:'B-ERG-PED-012', type:'COMP', parent_id:pedals, project_id:P });
    await createNode(pool, { name:'Pedal Return Springs (×2)', part_number:'B-ERG-PED-013', type:'PURCH', parent_id:pedals, project_id:P });

  // ═══════════════════════════════════════════════════════
  // 8. ELECTRICAL
  // ═══════════════════════════════════════════════════════
  const electrical = await createNode(pool, { name:'Electrical', part_number:'B-ELEC-001', type:'SUBSYS', description:'12V electrical system, data acquisition, ignition cut-off.', parent_id:root, project_id:P });
  await initPhases(pool, electrical);
  await addRequirement(pool, electrical, { req_id:'B-ELEC-R001', title:'Ignition cut-off shall cut engine within 0.5s of actuation from any position', verification_method:'test', priority:'shall', status:'open' });
  await addRequirement(pool, electrical, { req_id:'B-ELEC-R002', title:'Electrical system shall be waterproof to IPX5', verification_method:'test', priority:'should', status:'open' });
  await setPhaseStatus(pool, electrical, 'requirements', 'in_progress');

  const battery12v = await createNode(pool, { name:'12V Battery System', part_number:'B-ELEC-BAT-001', type:'SUBASSY', parent_id:electrical, project_id:P });
    await createNode(pool, { name:'12V 7Ah SLA Battery', part_number:'B-ELEC-BAT-010', type:'PURCH', parent_id:battery12v, project_id:P });
    await createNode(pool, { name:'Battery Mount Bracket', part_number:'B-ELEC-BAT-011', type:'COMP', parent_id:battery12v, project_id:P });
    await createNode(pool, { name:'Battery Cable Kit', part_number:'B-ELEC-BAT-012', type:'PURCH', parent_id:battery12v, project_id:P });

  const daq = await createNode(pool, { name:'Data Acquisition System', part_number:'B-ELEC-DAQ-001', type:'SUBASSY', parent_id:electrical, project_id:P });
    await createNode(pool, { name:'DAQ Module AiM EVO4', part_number:'B-ELEC-DAQ-010', type:'PURCH', parent_id:daq, project_id:P });
    await createNode(pool, { name:'Wheel Speed Sensor (×4)', part_number:'B-ELEC-DAQ-011', type:'PURCH', parent_id:daq, project_id:P });
    await createNode(pool, { name:'Throttle Position Sensor', part_number:'B-ELEC-DAQ-012', type:'PURCH', parent_id:daq, project_id:P });
    await createNode(pool, { name:'Suspension Potentiometer (×4)', part_number:'B-ELEC-DAQ-013', type:'PURCH', parent_id:daq, project_id:P });
    await createNode(pool, { name:'GPS Speed Sensor', part_number:'B-ELEC-DAQ-014', type:'PURCH', parent_id:daq, project_id:P });

  const wiring = await createNode(pool, { name:'Wiring Harness', part_number:'B-ELEC-WH-001', type:'SUBASSY', parent_id:electrical, project_id:P });
    await createNode(pool, { name:'Main Loom DR-25', part_number:'B-ELEC-WH-010', type:'COMP', description:'Custom harness in DR-25 expandable wrap.', parent_id:wiring, project_id:P });
    await createNode(pool, { name:'Waterproof Connector Kit', part_number:'B-ELEC-WH-011', type:'PURCH', parent_id:wiring, project_id:P });
    await createNode(pool, { name:'ATC Fuse Block 12-circuit', part_number:'B-ELEC-WH-012', type:'PURCH', parent_id:wiring, project_id:P });
    await createNode(pool, { name:'Master Disconnect Switch', part_number:'B-ELEC-WH-013', type:'PURCH', parent_id:wiring, project_id:P });
    await createNode(pool, { name:'Starter Relay', part_number:'B-ELEC-WH-014', type:'PURCH', parent_id:wiring, project_id:P });

  // ═══════════════════════════════════════════════════════
  // 9. BODY & PROTECTION
  // ═══════════════════════════════════════════════════════
  const body = await createNode(pool, { name:'Body & Protection', part_number:'B-BODY-001', type:'SUBSYS', description:'Bodywork panels, skid plate, driver protection, and number plates.', parent_id:root, project_id:P });
  await initPhases(pool, body);
  await addRequirement(pool, body, { req_id:'B-BODY-R001', title:'Skid plate shall withstand 6" rock strike at 25mph without penetration', verification_method:'test', priority:'shall', status:'open' });
  await setPhaseStatus(pool, body, 'requirements', 'in_progress');

  await createNode(pool, { name:'Front Bumper Assembly', part_number:'B-BODY-BUMP-001', type:'SUBASSY', description:'1.0" DOM steel bumper, rubber-tipped.', parent_id:body, project_id:P });
  const skidPlate = await createNode(pool, { name:'Skid Plate Assembly', part_number:'B-BODY-SKID-001', type:'SUBASSY', parent_id:body, project_id:P });
    await createNode(pool, { name:'Main Skid Plate', part_number:'B-BODY-SKID-010', type:'COMP', description:'3/8" UHMW-PE sheet, 20"×30". Slotted mounting.', parent_id:skidPlate, project_id:P });
    await createNode(pool, { name:'Skid Plate Mount Hardware', part_number:'B-BODY-SKID-011', type:'PURCH', description:'Grade 5 bolts + nylock. 8 total.', parent_id:skidPlate, project_id:P });
    await createNode(pool, { name:'Rear Diff Skid', part_number:'B-BODY-SKID-012', type:'COMP', description:'1/4" UHMW-PE rear diff protector.', parent_id:skidPlate, project_id:P });

  const bodyPanels = await createNode(pool, { name:'Body Panel Set', part_number:'B-BODY-PAN-001', type:'SUBASSY', parent_id:body, project_id:P });
    await createNode(pool, { name:'Front Nose Panel', part_number:'B-BODY-PAN-010', type:'COMP', description:'0.060" 5052 Al, bent and trimmed to profile.', parent_id:bodyPanels, project_id:P });
    await createNode(pool, { name:'Side Pod Panel LH', part_number:'B-BODY-PAN-011', type:'COMP', parent_id:bodyPanels, project_id:P });
    await createNode(pool, { name:'Side Pod Panel RH', part_number:'B-BODY-PAN-012', type:'COMP', parent_id:bodyPanels, project_id:P });
    await createNode(pool, { name:'Rear Splash Guard', part_number:'B-BODY-PAN-013', type:'COMP', parent_id:bodyPanels, project_id:P });
    await createNode(pool, { name:'Number Plate Holder (×3)', part_number:'B-BODY-PAN-014', type:'PURCH', parent_id:bodyPanels, project_id:P });

  // Root-level requirements
  await initPhases(pool, root);
  await addRequirement(pool, root, { req_id:'B-SYS-R001', title:'Vehicle shall comply with all SAE Baja 2025 rules', verification_method:'inspection', priority:'shall', status:'in_progress' });
  await addRequirement(pool, root, { req_id:'B-SYS-R002', title:'Vehicle curb weight shall not exceed 400 lbs', verification_method:'inspection', priority:'shall', status:'open' });
  await addRequirement(pool, root, { req_id:'B-SYS-R003', title:'Vehicle shall complete SAE endurance event without mechanical DNF', verification_method:'demonstration', priority:'shall', status:'open' });
  await setPhaseStatus(pool, root, 'requirements', 'in_progress');

  return projId;
}

// ─── HEAVY MOTION INDUSTRIES — EDISON HYBRID TRANSIT TRUCK ───────────────────

async function seedHeavyMotionProject(pool, teamId) {
  // Clean up the old "Edison Hybrid Transit Truck" project (previous slug) if it exists.
  // The slug changed when the seed was updated; without this cleanup, Load Demo creates a duplicate.
  const oldProject = await pool.query("SELECT id FROM projects WHERE slug='edison-hybrid-truck'");
  if (oldProject.rows.length > 0) {
    const oldId = oldProject.rows[0].id;
    await pool.query('UPDATE nodes SET parent_id = NULL WHERE project_id = $1', [oldId]);
    await pool.query('DELETE FROM nodes WHERE project_id = $1', [oldId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [oldId]);
  }

  let projId;
  try {
    const pr = await pool.query(
      `INSERT INTO projects (name, description, slug, is_demo, team_id)
       VALUES ('HM-600 Hybrid Truck', 'Class 8 diesel-electric hybrid transit truck — 8 subsystems, ~130 parts, full HV powertrain engineering lifecycle.', 'hm-600-hybrid-truck', true, $1)
       RETURNING id`,
      [teamId || null]
    );
    projId = pr.rows[0].id;
  } catch(e) {
    if (e.code === '23505') {
      const r = await pool.query("SELECT id FROM projects WHERE slug='hm-600-hybrid-truck'");
      projId = r.rows[0].id;
      if (teamId) await pool.query('UPDATE projects SET team_id=$1 WHERE id=$2', [teamId, projId]);
    } else throw e;
  }

  const P = projId;

  // ── ROOT ──────────────────────────────────────────────────────────────────
  const root = await createNode(pool, {
    name: 'HM-600 Hybrid Truck',
    part_number: 'HM-001',
    type: 'ASSY',
    description: 'Class 8 diesel-electric parallel hybrid transit truck. GVW 80,000 lb. 600V HV system. FMVSS 105/121 compliant. Target range: 600 mi combined, 50 mi EV-only.',
    project_id: P
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. POWERTRAIN (diesel-electric hybrid)
  // ══════════════════════════════════════════════════════════════════════════
  const powertrain = await createNode(pool, {
    name: 'Powertrain System',
    part_number: 'HM-PWRTRAIN-001',
    type: 'SUBSYS',
    description: 'Diesel-electric parallel hybrid powertrain. 7.7L I-6 diesel + 200 kW PMAC traction motor.',
    parent_id: root, project_id: P
  });

  const dieselAssy = await createNode(pool, {
    name: 'Diesel Engine Assembly',
    part_number: 'HM-DIESEL-001',
    type: 'SUBASSY',
    description: 'Cummins X15 7.7L I-6 diesel, 400 hp / 1850 lb·ft. EPA 2024 compliant.',
    parent_id: powertrain, project_id: P
  });
  await createNode(pool, { name: 'Cummins X15 Diesel Engine', part_number: 'HM-DIESEL-010', type: 'PURCH', description: '7.7L I-6, 400 hp @ 1800 rpm, 1850 lb·ft @ 1200 rpm. SCR+DPF+EGR aftertreatment.', parent_id: dieselAssy, project_id: P });
  await createNode(pool, { name: 'Engine Mount LH', part_number: 'HM-DIESEL-011', type: 'COMP', description: 'Rubber-isolated 12mm steel plate mount, frame-rail bolt pattern.', parent_id: dieselAssy, project_id: P });
  await createNode(pool, { name: 'Engine Mount RH', part_number: 'HM-DIESEL-012', type: 'COMP', description: 'Mirror of HM-DIESEL-011.', parent_id: dieselAssy, project_id: P });
  await createNode(pool, { name: 'Flywheel Housing Adapter', part_number: 'HM-DIESEL-013', type: 'COMP', description: 'SAE #1 to motor bell-housing adapter plate. Machined 4140 steel.', parent_id: dieselAssy, project_id: P });

  // TRACTION MOTOR — DEEP DIVE
  const tractionMotor = await createNode(pool, {
    name: 'Traction Motor Assembly',
    part_number: 'HM-TRACTION-001',
    type: 'SUBASSY',
    description: 'Permanent magnet AC traction motor, 200 kW continuous / 320 kW peak. Liquid-cooled stator. Integrated encoder.',
    parent_id: powertrain, project_id: P
  });
  await createNode(pool, { name: 'PMAC Traction Motor 200 kW', part_number: 'HM-TRACTION-010', type: 'PURCH', description: 'Dana TM4 SUMO MD 200 kW. 600 V nominal. IP67 rated. Max 5500 rpm.', parent_id: tractionMotor, project_id: P });
  await createNode(pool, { name: 'Motor Mounting Frame', part_number: 'HM-TRACTION-011', type: 'COMP', description: 'Welded 10ga 4130 steel cradle. Bolt pattern matches SAE #1 flywheel housing.', parent_id: tractionMotor, project_id: P });
  await createNode(pool, { name: 'Motor Cooling Jacket', part_number: 'HM-TRACTION-012', type: 'COMP', description: 'Machined Al 6061 coolant jacket. 10 LPM flow at 30°C delta-T.', parent_id: tractionMotor, project_id: P });
  await createNode(pool, { name: 'Resolver / Encoder', part_number: 'HM-TRACTION-013', type: 'PURCH', description: 'Tamagawa TS2640N2E2 resolver. 10-bit absolute, 20 kHz bandwidth.', parent_id: tractionMotor, project_id: P });

  const transmission = await createNode(pool, {
    name: 'Transmission Assembly',
    part_number: 'HM-TRANS-001',
    type: 'SUBASSY',
    description: 'Eaton Fuller 10-speed automated manual transmission with hybrid disconnect clutch.',
    parent_id: powertrain, project_id: P
  });
  await createNode(pool, { name: 'Eaton Fuller 10-Speed AMT', part_number: 'HM-TRANS-010', type: 'PURCH', description: 'Fuller Advantage Series 10-speed AMT. 2050 lb·ft input torque rating.', parent_id: transmission, project_id: P });
  await createNode(pool, { name: 'Hybrid Disconnect Clutch', part_number: 'HM-TRANS-011', type: 'PURCH', description: 'Electrically-actuated wet clutch pack. 450 Nm slip torque. Allows EV-only mode.', parent_id: transmission, project_id: P });
  await createNode(pool, { name: 'PTO Adapter Plate', part_number: 'HM-TRANS-012', type: 'COMP', description: 'SAE 4-hole PTO opening adapter for optional auxiliary drive.', parent_id: transmission, project_id: P });

  // TRACTION MOTOR deep-dive
  await initPhases(pool, tractionMotor);
  await addRequirement(pool, tractionMotor, { req_id:'HM-TM-R001', title:'Traction motor SHALL deliver ≥200 kW continuous at 600 VDC nominal', description:'Continuous thermal power must sustain highway grade climbing at GVW 80,000 lb on 6% grade without derating.', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, tractionMotor, { req_id:'HM-TM-R002', title:'Motor SHALL achieve ≥92% efficiency at 150 kW / 1800 rpm operating point', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, tractionMotor, { req_id:'HM-TM-R003', title:'Motor assembly SHALL be IP67 rated (dust-tight, 30-min immersion)', verification_method:'inspection', priority:'shall', status:'verified' });
  await addRequirement(pool, tractionMotor, { req_id:'HM-TM-R004', title:'Motor cooling SHALL maintain stator winding temp ≤155°C at peak power (320 kW) for 30s', verification_method:'test', priority:'shall', status:'in_progress' });
  await addRequirement(pool, tractionMotor, { req_id:'HM-TM-R005', title:'Motor SHOULD achieve peak regenerative torque ≥800 Nm for regen braking blend', verification_method:'test', priority:'should', status:'open' });
  await addRequirement(pool, tractionMotor, { req_id:'HM-TM-R006', title:'Motor MAY include embedded temperature sensors (PTC thermistors) per stator phase', verification_method:'inspection', priority:'may', status:'open' });
  await setPhaseStatus(pool, tractionMotor, 'requirements', 'complete');
  await addArtifact(pool, tractionMotor, 'rnd', 'design_option', null, { title:'Dana TM4 SUMO MD (selected)', notes:'200 kW continuous, proven in transit bus applications. IP67 native. Liquid-cooled. Lead time 14 weeks.' });
  await addArtifact(pool, tractionMotor, 'rnd', 'design_option', null, { title:'Magnax AXF 275 axial-flux motor', notes:'Higher power density but axial packaging conflicts with SAE #1 adapter geometry. Eliminated.' });
  await addArtifact(pool, tractionMotor, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'| | Dana TM4 SUMO MD | Magnax AXF 275 |\n|--|--|--|\n| Continuous power | 200 kW | 275 kW |\n| Efficiency @150kW | 92.4% | 94.1% |\n| IP rating | IP67 | IP54 |\n| Packaging fit | ✓ SAE #1 | ✗ Axial conflict |\n| Lead time | 14 wk | 22 wk |\n| **Decision** | **Selected** | Eliminated |' });
  await setPhaseStatus(pool, tractionMotor, 'rnd', 'complete');
  await addArtifact(pool, tractionMotor, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/hm-powertrain/traction-motor', notes:'Motor cradle + cooling jacket. Rev B. Clearance verified against transmission bell housing.' });
  await setPhaseStatus(pool, tractionMotor, 'design_cad', 'complete');
  await addArtifact(pool, tractionMotor, 'data_collection', 'data_point', null, { label:'Continuous power dyno run', value:'203.4 kW', unit:'kW', notes:'Measured at 600V, 1800 rpm, 30-min steady state. Exceeds 200 kW requirement.' });
  await addArtifact(pool, tractionMotor, 'data_collection', 'data_point', null, { label:'Efficiency @150kW operating point', value:'92.6%', unit:'%', notes:'Best-point efficiency map measured on test stand.' });
  await setPhaseStatus(pool, tractionMotor, 'data_collection', 'complete');
  await addArtifact(pool, tractionMotor, 'analysis_cae', 'analysis_entry', null, { title:'Thermal FEA — Cooling Jacket', software:'Ansys Fluent', result:'Max winding temp 148°C at 320 kW / 30s peak. Margin: 7°C vs 155°C limit.', status:'pass' });
  await setPhaseStatus(pool, tractionMotor, 'analysis_cae', 'complete');
  await setPhaseStatus(pool, tractionMotor, 'testing_validation', 'in_progress');

  // ══════════════════════════════════════════════════════════════════════════
  // 2. CHASSIS & FRAME
  // ══════════════════════════════════════════════════════════════════════════
  const chassis = await createNode(pool, {
    name: 'Chassis & Frame',
    part_number: 'HM-CHASSIS-001',
    type: 'SUBSYS',
    description: 'Full-ladder frame, 110" BBC. High-tensile steel rail. GVW 80,000 lb rated. FMVSS 208 compliant.',
    parent_id: root, project_id: P
  });

  // FRAME RAIL — DEEP DIVE
  const frameRail = await createNode(pool, {
    name: 'Frame Rail Assembly',
    part_number: 'HM-FRAME-RL-001',
    type: 'SUBASSY',
    description: 'Full-length ladder frame rails. 110" BBC, 34" frame width. 120 ksi yield steel. 7-cross-member design.',
    parent_id: chassis, project_id: P
  });
  await createNode(pool, { name: 'Main Longitudinal Rail LH', part_number: 'HM-FRAME-RL-010', type: 'COMP', description: '10.25" × 3.5" × 0.38" C-channel rail. 120 ksi HTS steel. 298" length.', parent_id: frameRail, project_id: P });
  await createNode(pool, { name: 'Main Longitudinal Rail RH', part_number: 'HM-FRAME-RL-011', type: 'COMP', description: 'Mirror of HM-FRAME-RL-010.', parent_id: frameRail, project_id: P });
  await createNode(pool, { name: 'Cross-member #1 — Front', part_number: 'HM-FRAME-RL-012', type: 'COMP', description: '3" × 5" × 0.25" rectangular tube. Bumper/body mount.', parent_id: frameRail, project_id: P });
  await createNode(pool, { name: 'Cross-member #2 — Engine', part_number: 'HM-FRAME-RL-013', type: 'COMP', description: '4" × 6" × 0.313" tube. Engine torque reaction cross-rail.', parent_id: frameRail, project_id: P });
  await createNode(pool, { name: 'Cross-member #3 — Battery Tray', part_number: 'HM-FRAME-RL-014', type: 'COMP', description: '3" × 5" × 0.25" tube. HV battery tray primary support.', parent_id: frameRail, project_id: P });
  await createNode(pool, { name: 'Cross-member #4 — Mid', part_number: 'HM-FRAME-RL-015', type: 'COMP', description: '3" × 5" × 0.25" tube. Cab/body torsional stiffener.', parent_id: frameRail, project_id: P });
  await createNode(pool, { name: 'Outrigger Bracket LH (×3)', part_number: 'HM-FRAME-RL-016', type: 'COMP', description: '8ga stamped bracket. Body mounting outrigger. 3 per side.', parent_id: frameRail, project_id: P });
  await createNode(pool, { name: 'Outrigger Bracket RH (×3)', part_number: 'HM-FRAME-RL-017', type: 'COMP', description: 'Mirror of HM-FRAME-RL-016.', parent_id: frameRail, project_id: P });

  await createNode(pool, { name: 'Front Bumper Assembly', part_number: 'HM-CHASSIS-010', type: 'COMP', description: 'Formed 3/16" HSLA steel. FMVSS 223 compliant underride guard integration.', parent_id: chassis, project_id: P });
  await createNode(pool, { name: 'Fifth Wheel Mounting Plate', part_number: 'HM-CHASSIS-011', type: 'PURCH', description: 'Fontaine 54" No-Slack fifth wheel plate. 180,000 lb static rating.', parent_id: chassis, project_id: P });
  await createNode(pool, { name: 'Rear Underride Guard', part_number: 'HM-CHASSIS-012', type: 'COMP', description: 'FMVSS 223/224 compliant 3" square tube guard. 22" max height from ground.', parent_id: chassis, project_id: P });
  await createNode(pool, { name: 'Battery Tray Mounting Brackets', part_number: 'HM-CHASSIS-013', type: 'COMP', description: '10ga formed brackets with isolator provisions. Mounts to cross-member #3.', parent_id: chassis, project_id: P });

  // FRAME RAIL deep-dive
  await initPhases(pool, frameRail);
  await addRequirement(pool, frameRail, { req_id:'HM-FR-R001', title:'Frame rails SHALL carry 80,000 lb GVW with ≥2.0 safety factor at max bending moment', description:'Primary load case: fully loaded, single-axle lift scenario. FEA with FMVSS 108 dynamic loading envelope.', verification_method:'analysis', priority:'shall', status:'verified' });
  await addRequirement(pool, frameRail, { req_id:'HM-FR-R002', title:'Rail section modulus SHALL be ≥12 in³ minimum at engine cross-member', verification_method:'inspection', priority:'shall', status:'verified' });
  await addRequirement(pool, frameRail, { req_id:'HM-FR-R003', title:'Frame assembly SHALL have torsional stiffness ≥25,000 N·m/deg', verification_method:'test', priority:'shall', status:'in_progress' });
  await addRequirement(pool, frameRail, { req_id:'HM-FR-R004', title:'Battery tray cross-member SHALL sustain 2,800 lb battery pack static + 3g dynamic bump load', verification_method:'analysis', priority:'shall', status:'verified' });
  await addRequirement(pool, frameRail, { req_id:'HM-FR-R005', title:'Frame SHALL comply with FMVSS 208 — Occupant Crash Protection (cab attachment design)', verification_method:'test', priority:'shall', status:'open' });
  await addRequirement(pool, frameRail, { req_id:'HM-FR-R006', title:'Frame SHOULD include corrosion protection: e-coat primer + top coat per SAE J400', verification_method:'inspection', priority:'should', status:'open' });
  await setPhaseStatus(pool, frameRail, 'requirements', 'complete');
  await addArtifact(pool, frameRail, 'rnd', 'design_option', null, { title:'120 ksi HTS C-channel (selected)', notes:'Standard Class 8 configuration. Proven supplier base. Meets all load requirements with SF 2.3.' });
  await addArtifact(pool, frameRail, 'rnd', 'design_option', null, { title:'100 ksi rail with gussets', notes:'Lower yield, requires gusseting at engine cross-member to meet SF. Adds 85 lb mass penalty. Eliminated.' });
  await setPhaseStatus(pool, frameRail, 'rnd', 'complete');
  await addArtifact(pool, frameRail, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/hm-chassis/frame-rail-assy', notes:'Full ladder frame assembly. Rev D. All cross-member weld details + drill patterns included.' });
  await setPhaseStatus(pool, frameRail, 'design_cad', 'complete');
  await addArtifact(pool, frameRail, 'analysis_cae', 'analysis_entry', null, { title:'Static Bending FEA — GVW 80,000 lb', software:'Ansys Mechanical', result:'Max stress 52,200 psi at engine cross-member. SF = 2.3 vs 120 ksi yield. Pass.', status:'pass' });
  await addArtifact(pool, frameRail, 'analysis_cae', 'analysis_entry', null, { title:'Battery Tray Dynamic Load FEA', software:'Ansys Mechanical', result:'3g bump: 14,800 lb dynamic. Max stress 38,100 psi. SF = 3.1. Pass.', status:'pass' });
  await setPhaseStatus(pool, frameRail, 'analysis_cae', 'complete');
  await setPhaseStatus(pool, frameRail, 'data_collection', 'in_progress');

  // ══════════════════════════════════════════════════════════════════════════
  // 3. SUSPENSION
  // ══════════════════════════════════════════════════════════════════════════
  const suspension = await createNode(pool, {
    name: 'Suspension System',
    part_number: 'HM-SUSP-001',
    type: 'SUBSYS',
    description: 'Front steer axle (taper-leaf) + rear tandem drive axles (air-ride). 12,000 lb FA / 46,000 lb RA ratings.',
    parent_id: root, project_id: P
  });

  const frontAxle = await createNode(pool, {
    name: 'Front Axle Assembly',
    part_number: 'HM-SUSP-FRONT-001',
    type: 'SUBASSY',
    description: 'Dana S660 12,000 lb steer axle with taper-leaf spring suspension.',
    parent_id: suspension, project_id: P
  });
  await createNode(pool, { name: 'Dana S660 Steer Axle', part_number: 'HM-SUSP-FRONT-010', type: 'PURCH', description: 'Dana Spicer S660 12,000 lb capacity steer axle.', parent_id: frontAxle, project_id: P });
  await createNode(pool, { name: 'Front Leaf Spring Pack LH', part_number: 'HM-SUSP-FRONT-011', type: 'PURCH', description: '12,000 lb taper-leaf spring. 54" eye-to-eye. 5-leaf.', parent_id: frontAxle, project_id: P });
  await createNode(pool, { name: 'Front Leaf Spring Pack RH', part_number: 'HM-SUSP-FRONT-012', type: 'PURCH', description: 'Mirror of HM-SUSP-FRONT-011.', parent_id: frontAxle, project_id: P });
  await createNode(pool, { name: 'Shock Absorber Front LH', part_number: 'HM-SUSP-FRONT-013', type: 'PURCH', description: 'Tenneco Monroe monotube shock, 36kN rated.', parent_id: frontAxle, project_id: P });
  await createNode(pool, { name: 'Shock Absorber Front RH', part_number: 'HM-SUSP-FRONT-014', type: 'PURCH', description: 'Mirror of HM-SUSP-FRONT-013.', parent_id: frontAxle, project_id: P });

  const rearTandem = await createNode(pool, {
    name: 'Rear Tandem Axle Assembly',
    part_number: 'HM-SUSP-REAR-001',
    type: 'SUBASSY',
    description: 'Eaton DS460 46,000 lb tandem drive axles with air-ride suspension.',
    parent_id: suspension, project_id: P
  });
  await createNode(pool, { name: 'Eaton DS460 Drive Axle — Forward', part_number: 'HM-SUSP-REAR-010', type: 'PURCH', description: 'Eaton DS460 23,000 lb capacity. 46" ring gear. Locking differential.', parent_id: rearTandem, project_id: P });
  await createNode(pool, { name: 'Eaton DS460 Drive Axle — Rear', part_number: 'HM-SUSP-REAR-011', type: 'PURCH', description: 'Mirror of HM-SUSP-REAR-010. Tandem pair.', parent_id: rearTandem, project_id: P });
  await createNode(pool, { name: 'Air Spring Bags ×4', part_number: 'HM-SUSP-REAR-012', type: 'PURCH', description: 'Firestone W01-358-6716 air springs. 15,000 lb capacity each.', parent_id: rearTandem, project_id: P });
  await createNode(pool, { name: 'Equalizer Beam', part_number: 'HM-SUSP-REAR-013', type: 'COMP', description: 'Forged 4140 steel equalizer beam. 52" axle spacing.', parent_id: rearTandem, project_id: P });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. BRAKING SYSTEM
  // ══════════════════════════════════════════════════════════════════════════
  const braking = await createNode(pool, {
    name: 'Braking System',
    part_number: 'HM-BRAKE-001',
    type: 'SUBSYS',
    description: 'Air-over-hydraulic full air brakes + regenerative blending. FMVSS 121 compliant. ABS/EBS.',
    parent_id: root, project_id: P
  });

  const absModule = await createNode(pool, {
    name: 'ABS/EBS Module Assembly',
    part_number: 'HM-BRAKE-ABS-001',
    type: 'SUBASSY',
    description: 'Wabco EBS Gen F module. 4S/4M ABS with electronic brake force distribution.',
    parent_id: braking, project_id: P
  });
  await createNode(pool, { name: 'Wabco EBS Electronic Control Unit', part_number: 'HM-BRAKE-ABS-010', type: 'PURCH', description: 'Wabco EBS Gen F ECU. SAE J1939 CAN. 6-channel.', parent_id: absModule, project_id: P });
  await createNode(pool, { name: 'Wheel Speed Sensor ×8', part_number: 'HM-BRAKE-ABS-011', type: 'PURCH', description: 'Passive VRS sensors, 100-2000 Hz. One per wheel station.', parent_id: absModule, project_id: P });
  await createNode(pool, { name: 'Modulator Valve Assembly ×4', part_number: 'HM-BRAKE-ABS-012', type: 'PURCH', description: 'Wabco modulator valves. 2 front, 2 rear. 4-channel ABS.', parent_id: absModule, project_id: P });

  // REGENERATIVE BRAKE CONTROLLER — DEEP DIVE
  const regenBrake = await createNode(pool, {
    name: 'Regenerative Brake Controller',
    part_number: 'HM-BRAKE-REGEN-001',
    type: 'SUBASSY',
    description: 'Torque-blending ECU that coordinates regen braking (motor) with friction braking (air). FMVSS 105/121.',
    parent_id: braking, project_id: P
  });
  await createNode(pool, { name: 'Regen Brake ECU', part_number: 'HM-BRAKE-REGEN-010', type: 'PURCH', description: 'Danfoss VACON hybrid brake controller. ISO 26262 ASIL-B. Dual CAN.', parent_id: regenBrake, project_id: P });
  await createNode(pool, { name: 'Torque Blending Module', part_number: 'HM-BRAKE-REGEN-011', type: 'COMP', description: 'Custom 4-layer PCB. FPGA-based real-time torque arbitration. 1ms cycle time.', parent_id: regenBrake, project_id: P });
  await createNode(pool, { name: 'Hydraulic Boost Actuator', part_number: 'HM-BRAKE-REGEN-012', type: 'PURCH', description: 'Bosch iBooster electro-hydraulic actuator. 200 bar max. Allows regen filling of brake gap.', parent_id: regenBrake, project_id: P });
  await createNode(pool, { name: 'CAN Bus Interface Board', part_number: 'HM-BRAKE-REGEN-013', type: 'COMP', description: 'Galvanically isolated dual-CAN + LIN interface. TI SN65HVD231 transceivers.', parent_id: regenBrake, project_id: P });

  await createNode(pool, { name: 'Foundation Brake Assembly — Front', part_number: 'HM-BRAKE-010', type: 'COMP', description: 'Bendix ES-16+ air disc brakes. 16.5" × 5" rotor. Front axle.', parent_id: braking, project_id: P });
  await createNode(pool, { name: 'Foundation Brake Assembly — Rear', part_number: 'HM-BRAKE-011', type: 'COMP', description: 'Meritor Q Plus drum brakes, 16.5" × 7". Tandem rear axle.', parent_id: braking, project_id: P });
  await createNode(pool, { name: 'Air Compressor', part_number: 'HM-BRAKE-012', type: 'PURCH', description: 'Wabco 411 cfm twin-cylinder compressor. Belt-driven from diesel PTO.', parent_id: braking, project_id: P });
  await createNode(pool, { name: 'Air Dryer Assembly', part_number: 'HM-BRAKE-013', type: 'PURCH', description: 'Bendix AD-IP integrated air dryer. Heated purge valve for cold climates.', parent_id: braking, project_id: P });

  // REGEN BRAKE CONTROLLER deep-dive
  await initPhases(pool, regenBrake);
  await addRequirement(pool, regenBrake, { req_id:'HM-RB-R001', title:'Regen controller SHALL blend regen and friction braking transparent to driver with ≤50 ms torque transition', description:'Driver applies pedal: system arbitrates regen vs friction share. Transition must be imperceptible (FMVSS 105 pedal feel criteria).', verification_method:'test', priority:'shall', status:'in_progress' });
  await addRequirement(pool, regenBrake, { req_id:'HM-RB-R002', title:'System SHALL comply with FMVSS 121 — Air Brake Systems (stopping distance and stability)', verification_method:'test', priority:'shall', status:'open' });
  await addRequirement(pool, regenBrake, { req_id:'HM-RB-R003', title:'Regen controller SHALL achieve ISO 26262 ASIL-B functional safety level', verification_method:'analysis', priority:'shall', status:'in_progress' });
  await addRequirement(pool, regenBrake, { req_id:'HM-RB-R004', title:'Controller SHALL recover ≥85% of kinetic energy during 60→0 mph stop at GVW 60,000 lb', verification_method:'test', priority:'shall', status:'open' });
  await addRequirement(pool, regenBrake, { req_id:'HM-RB-R005', title:'System SHOULD improve fuel efficiency by ≥15% in urban drive cycle (UDDS)', verification_method:'test', priority:'should', status:'open' });
  await addRequirement(pool, regenBrake, { req_id:'HM-RB-R006', title:'CAN interface MAY support SAE J1939 broadcast of regen energy recovered per trip', verification_method:'inspection', priority:'may', status:'open' });
  await setPhaseStatus(pool, regenBrake, 'requirements', 'complete');
  await addArtifact(pool, regenBrake, 'rnd', 'design_option', null, { title:'Danfoss VACON + custom torque blend PCB (selected)', notes:'ASIL-B certified ECU base + custom blend logic. Lowest integration risk. Meets FMVSS 105 pedal requirements.' });
  await addArtifact(pool, regenBrake, 'rnd', 'design_option', null, { title:'Full custom ECU in-house', notes:'Maximum optimization but 18-month dev timeline, no ASIL certification baseline. Eliminated on schedule risk.' });
  await setPhaseStatus(pool, regenBrake, 'rnd', 'complete');
  await addArtifact(pool, regenBrake, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/hm-brakes/regen-controller', notes:'Mounting bracket + wiring harness routing. Rev A. ISO 26262 FMEA linked to JIRA.' });
  await setPhaseStatus(pool, regenBrake, 'design_cad', 'complete');
  await setPhaseStatus(pool, regenBrake, 'data_collection', 'in_progress');

  // ══════════════════════════════════════════════════════════════════════════
  // 5. ELECTRICAL / HV BATTERY
  // ══════════════════════════════════════════════════════════════════════════
  const hvBattery = await createNode(pool, {
    name: 'Electrical / HV Battery System',
    part_number: 'HM-HVB-001',
    type: 'SUBSYS',
    description: '600 VDC nominal HV bus. 120 kWh usable LFP pack. NFPA 70E / UN 38.3 compliant.',
    parent_id: root, project_id: P
  });

  // BATTERY PACK — DEEP DIVE
  const batteryPack = await createNode(pool, {
    name: 'Battery Pack Assembly',
    part_number: 'HM-BATT-PACK-001',
    type: 'SUBASSY',
    description: 'LFP prismatic 120 kWh / 600 V nominal pack. 16 modules × 7.5 kWh. Liquid cooled. UN 38.3 certified.',
    parent_id: hvBattery, project_id: P
  });
  await createNode(pool, { name: 'LFP Cell Module ×16 (7.5 kWh each)', part_number: 'HM-BATT-PACK-010', type: 'PURCH', description: 'CATL LFP prismatic module. 7.5 kWh / 37.5 V nominal. 40 Ah cells, 16S2P.', parent_id: batteryPack, project_id: P });
  await createNode(pool, { name: 'Battery Management System ECU', part_number: 'HM-BATT-PACK-011', type: 'PURCH', description: 'Orion BMS 2. 384-cell monitoring. Cell balancing, SOC/SOH, thermal cutoff.', parent_id: batteryPack, project_id: P });
  await createNode(pool, { name: 'Cell Interconnect Busbars', part_number: 'HM-BATT-PACK-012', type: 'COMP', description: 'Machined copper busbars, tin-plated. Module-to-module series connection.', parent_id: batteryPack, project_id: P });
  await createNode(pool, { name: 'Pack Housing', part_number: 'HM-BATT-PACK-013', type: 'COMP', description: '6063 Al extrusion enclosure. IP67. Crash-intrusion tested per ECE R100 Rev 2.', parent_id: batteryPack, project_id: P });
  await createNode(pool, { name: 'Thermal Management Manifold', part_number: 'HM-BATT-PACK-014', type: 'COMP', description: 'Machined Al manifold. Bottom-cooling plates per module. 20 LPM at 3 bar.', parent_id: batteryPack, project_id: P });
  await createNode(pool, { name: 'Manual Service Disconnect (MSD)', part_number: 'HM-BATT-PACK-015', type: 'PURCH', description: 'Amphenol SL HVIL MSD. 600V / 400A rated. Locks out HV on removal.', parent_id: batteryPack, project_id: P });

  await createNode(pool, { name: 'HV DC-DC Converter 600V→12V', part_number: 'HM-HVB-010', type: 'PURCH', description: 'Vicor DCM 600V→12V/80A isolated converter. Powers 12V accessory bus.', parent_id: hvBattery, project_id: P });
  await createNode(pool, { name: 'Inverter/Charger Assembly', part_number: 'HM-HVB-011', type: 'PURCH', description: 'Danfoss FC360 600V/400A traction inverter. 3-phase PWM. Integrated charger port.', parent_id: hvBattery, project_id: P });
  await createNode(pool, { name: 'HV Wiring Harness', part_number: 'HM-HVB-012', type: 'COMP', description: '600V rated orange-jacket cable assembly. 95mm² conductor. TE HV280 connectors.', parent_id: hvBattery, project_id: P });
  await createNode(pool, { name: 'Charging Port Assembly', part_number: 'HM-HVB-013', type: 'PURCH', description: 'SAE J1772 CCS Combo 1 inlet. 80 kW DC fast charge capable.', parent_id: hvBattery, project_id: P });

  // BATTERY PACK deep-dive
  await initPhases(pool, batteryPack);
  await addRequirement(pool, batteryPack, { req_id:'HM-BP-R001', title:'Pack SHALL deliver ≥120 kWh usable energy at beginning of life (BOL)', description:'Measured at 25°C, 1C discharge. Usable = 20%→90% SOC window.', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, batteryPack, { req_id:'HM-BP-R002', title:'Pack nominal voltage SHALL be 600 VDC ±5% across SOC 20–90%', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, batteryPack, { req_id:'HM-BP-R003', title:'Pack SHALL maintain ≥80% capacity after 1,500 charge/discharge cycles (10-year warranty target)', verification_method:'analysis', priority:'shall', status:'in_progress' });
  await addRequirement(pool, batteryPack, { req_id:'HM-BP-R004', title:'Pack enclosure SHALL achieve IP67 (dust-tight, 30-min immersion to 1m)', verification_method:'test', priority:'shall', status:'verified' });
  await addRequirement(pool, batteryPack, { req_id:'HM-BP-R005', title:'Pack SHALL comply with UN 38.3 transportation safety testing and ECE R100 Rev 2', verification_method:'inspection', priority:'shall', status:'verified' });
  await addRequirement(pool, batteryPack, { req_id:'HM-BP-R006', title:'Pack thermal system SHOULD maintain cell temp 15–35°C during normal operation', verification_method:'test', priority:'should', status:'in_progress' });
  await addRequirement(pool, batteryPack, { req_id:'HM-BP-R007', title:'Pack MAY support V2G (vehicle-to-grid) discharge at up to 60 kW via CCS port', verification_method:'demonstration', priority:'may', status:'open' });
  await setPhaseStatus(pool, batteryPack, 'requirements', 'complete');
  await addArtifact(pool, batteryPack, 'rnd', 'design_option', null, { title:'LFP prismatic (CATL) — selected', notes:'LFP chemistry: best cycle life, inherent thermal stability, cost-effective. UN 38.3 certified modules. 10-year cycle target achievable.' });
  await addArtifact(pool, batteryPack, 'rnd', 'design_option', null, { title:'NMC cylindrical 21700 cells', notes:'Higher energy density but lower cycle life and higher thermal management cost. Not suitable for 10-year commercial warranty. Eliminated.' });
  await addArtifact(pool, batteryPack, 'rnd', 'comparison_matrix', 'comparison_matrix', { content:'| | LFP Prismatic | NMC 21700 |\n|--|--|--|\n| Energy density | 160 Wh/kg | 240 Wh/kg |\n| Cycle life to 80% | 2,000+ | 1,000 |\n| Thermal runaway risk | Low | Moderate |\n| UN 38.3 cert | ✓ Supplied | Self-certify |\n| Cost/kWh | $110 | $145 |\n| **Decision** | **Selected** | Eliminated |' });
  await setPhaseStatus(pool, batteryPack, 'rnd', 'complete');
  await addArtifact(pool, batteryPack, 'design_cad', 'cad_ref', 'cad_ref', { url:'https://cad.onshape.com/documents/hm-hv/battery-pack', notes:'Full pack assembly with module layout, busbar routing, cooling manifold. Rev C. BMS mounting verified.' });
  await setPhaseStatus(pool, batteryPack, 'design_cad', 'complete');
  await addArtifact(pool, batteryPack, 'data_collection', 'data_point', null, { label:'BOL capacity test', value:'123.4 kWh', unit:'kWh', notes:'3 modules tested at 25°C, 1C. Extrapolated to full pack. Exceeds 120 kWh requirement.' });
  await addArtifact(pool, batteryPack, 'data_collection', 'data_point', null, { label:'Cell temperature delta under load', value:'4.2°C', unit:'°C delta', notes:'Measured across 16 modules at 100 kW discharge. Well within 15–35°C band.' });
  await setPhaseStatus(pool, batteryPack, 'data_collection', 'complete');
  await addArtifact(pool, batteryPack, 'analysis_cae', 'analysis_entry', null, { title:'Thermal FEA — Pack Cooling at 100 kW Discharge', software:'Ansys Fluent', result:'Max cell temp 38°C at 40°C ambient, 100 kW. At 30°C ambient stays within 35°C target. Marginal at high ambient.', status:'in_progress' });
  await setPhaseStatus(pool, batteryPack, 'analysis_cae', 'in_progress');
  await setPhaseStatus(pool, batteryPack, 'testing_validation', 'not_started');

  // ══════════════════════════════════════════════════════════════════════════
  // 6. CAB & ERGONOMICS
  // ══════════════════════════════════════════════════════════════════════════
  const cab = await createNode(pool, {
    name: 'Cab & Ergonomics',
    part_number: 'HM-CAB-001',
    type: 'SUBSYS',
    description: 'Day cab steel structure with HVAC, driver interface, and ergonomic controls. FMVSS 208/214.',
    parent_id: root, project_id: P
  });
  await createNode(pool, { name: 'Day Cab Shell', part_number: 'HM-CAB-010', type: 'PURCH', description: 'Kenworth T680 cab body. Stamped steel with aluminum hood. Pre-painted.', parent_id: cab, project_id: P });
  await createNode(pool, { name: 'Driver Seat Assembly', part_number: 'HM-CAB-011', type: 'PURCH', description: 'National Seating 2000 series air-ride seat. Lumbar support, 7-way adjustable.', parent_id: cab, project_id: P });
  await createNode(pool, { name: 'HVAC System', part_number: 'HM-CAB-012', type: 'PURCH', description: 'Bergstrom NITE electric APU + HVAC. 5 kW cooling / 4 kW heating. Powered from HV bus.', parent_id: cab, project_id: P });
  await createNode(pool, { name: 'Instrument Panel Assembly', part_number: 'HM-CAB-013', type: 'COMP', description: '12" hybrid display cluster. SOC gauge, regen indicator, fault codes. Custom injection-moulded housing.', parent_id: cab, project_id: P });
  await createNode(pool, { name: 'Steering Column Assembly', part_number: 'HM-CAB-014', type: 'PURCH', description: 'TRW THP44 hydraulic power steering. 3.5 turns lock-to-lock.', parent_id: cab, project_id: P });
  await createNode(pool, { name: 'Pedal Assembly', part_number: 'HM-CAB-015', type: 'COMP', description: 'Brake pedal (dual-circuit), accelerator (e-throttle). Formed 4mm steel plate. FMVSS 105 compatible.', parent_id: cab, project_id: P });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. BODY / CARGO
  // ══════════════════════════════════════════════════════════════════════════
  const body = await createNode(pool, {
    name: 'Body / Cargo',
    part_number: 'HM-BODY-001',
    type: 'SUBSYS',
    description: '26-foot aluminum cargo box. 2,800 cu-ft. Dual rear doors with liftgate.',
    parent_id: root, project_id: P
  });
  await createNode(pool, { name: 'Cargo Box Assembly', part_number: 'HM-BODY-010', type: 'COMP', description: 'Wabash aluminum dry-freight box. 26\' × 102" × 110". E-track floor.', parent_id: body, project_id: P });
  await createNode(pool, { name: 'Liftgate Assembly', part_number: 'HM-BODY-011', type: 'PURCH', description: 'Maxon TE-25 2,500 lb hydraulic liftgate. 12V pump (powered from 12V bus).', parent_id: body, project_id: P });
  await createNode(pool, { name: 'Side Panel LH', part_number: 'HM-BODY-012', type: 'COMP', description: '0.125" 5052 Al side panel. Rivet-bonded to box extrusion posts.', parent_id: body, project_id: P });
  await createNode(pool, { name: 'Side Panel RH', part_number: 'HM-BODY-013', type: 'COMP', description: 'Mirror of HM-BODY-012.', parent_id: body, project_id: P });
  await createNode(pool, { name: 'Roof Panel', part_number: 'HM-BODY-014', type: 'COMP', description: '0.100" 5052 Al. Standing seam roof. Sealed with butyl tape.', parent_id: body, project_id: P });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. COOLING SYSTEM
  // ══════════════════════════════════════════════════════════════════════════
  const cooling = await createNode(pool, {
    name: 'Cooling System',
    part_number: 'HM-COOL-001',
    type: 'SUBSYS',
    description: 'Combined engine coolant + HV battery thermal management. Separate low-temp / high-temp circuits.',
    parent_id: root, project_id: P
  });
  await createNode(pool, { name: 'Engine Coolant Radiator', part_number: 'HM-COOL-010', type: 'PURCH', description: 'Modine heavy-duty 1,400 sq-in core. Aluminum fin/tube. 120,000 BTU/hr rejection.', parent_id: cooling, project_id: P });
  await createNode(pool, { name: 'Battery Liquid Cooler', part_number: 'HM-COOL-011', type: 'COMP', description: 'Brazed Al plate heat exchanger. 30 kW rejection at 10°C delta-T. Pack-specific circuit.', parent_id: cooling, project_id: P });
  await createNode(pool, { name: 'Motor Cooling Circuit', part_number: 'HM-COOL-012', type: 'COMP', description: 'Low-temp (LT) coolant loop: motor + inverter. 25 LPM at 3 bar. 60°C max.', parent_id: cooling, project_id: P });
  await createNode(pool, { name: 'Coolant Pump Assembly', part_number: 'HM-COOL-013', type: 'PURCH', description: 'Bosch electric coolant pump CP500. 25 LPM @ 3 bar. 12V, 150W.', parent_id: cooling, project_id: P });
  await createNode(pool, { name: 'Thermostat Valve Assembly', part_number: 'HM-COOL-014', type: 'PURCH', description: 'Stant 195°F wax-element thermostat. Controls HT circuit bypass.', parent_id: cooling, project_id: P });
  await createNode(pool, { name: 'Charge Air Intercooler', part_number: 'HM-COOL-015', type: 'PURCH', description: 'Air-to-air intercooler. Cummins OEM spec. 300 sq-in core.', parent_id: cooling, project_id: P });

  // ── ROOT-LEVEL REQUIREMENTS ──────────────────────────────────────────────
  await initPhases(pool, root);
  await addRequirement(pool, root, { req_id:'HM-SYS-R001', title:'Vehicle SHALL comply with all applicable FMVSS regulations', verification_method:'inspection', priority:'shall', status:'in_progress' });
  await addRequirement(pool, root, { req_id:'HM-SYS-R002', title:'Vehicle GVW SHALL not exceed 80,000 lb (USDOT bridge formula)', verification_method:'inspection', priority:'shall', status:'in_progress' });
  await addRequirement(pool, root, { req_id:'HM-SYS-R003', title:'Vehicle SHALL achieve ≥600 mi combined range (diesel + electric) at GVW 60,000 lb', verification_method:'test', priority:'shall', status:'open' });
  await addRequirement(pool, root, { req_id:'HM-SYS-R004', title:'HV system SHALL comply with NFPA 70E electrical safety and UN 38.3 battery transport', verification_method:'inspection', priority:'shall', status:'in_progress' });
  await addRequirement(pool, root, { req_id:'HM-SYS-R005', title:'Vehicle SHALL meet EPA 2024 GHG Phase 2 standards for Class 8 combination tractors', verification_method:'test', priority:'shall', status:'open' });
  await setPhaseStatus(pool, root, 'requirements', 'in_progress');

  return projId;
}


// ─── DISCOVERY WORKSPACE HELPERS ─────────────────────────────────────────────

async function createDiscoveryObject(pool, { project_id, title, description, type, maturity, confidence, tags, functional_cluster }) {
  const r = await pool.query(
    `INSERT INTO discovery_objects (project_id, title, description, type, maturity, confidence, tags, functional_cluster)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [project_id, title, description || null, type || 'concept', maturity || 'raw', confidence || 'low',
     JSON.stringify(tags || []), functional_cluster || null]
  );
  if (r.rows.length === 0) {
    // Row already exists — fetch it
    const existing = await pool.query(
      `SELECT id FROM discovery_objects WHERE project_id=$1 AND title=$2 LIMIT 1`,
      [project_id, title]
    );
    return existing.rows[0]?.id;
  }
  return r.rows[0].id;
}

async function createDiscoveryRelationship(pool, source_id, target_id, relationship_type, notes) {
  if (!source_id || !target_id) return;
  try {
    await pool.query(
      `INSERT INTO discovery_relationships (source_object_id, target_object_id, relationship_type, notes)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (source_object_id, target_object_id, relationship_type) DO NOTHING`,
      [source_id, target_id, relationship_type, notes || null]
    );
  } catch(e) { /* ignore */ }
}

async function createDiscoveryArchitecture(pool, { project_id, name, description, pros, cons, risks, status }) {
  const r = await pool.query(
    `INSERT INTO discovery_architectures (project_id, name, description, pros, cons, risks, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [project_id, name, description || null, pros || null, cons || null, risks || null, status || 'active']
  );
  if (r.rows.length === 0) {
    const existing = await pool.query(
      `SELECT id FROM discovery_architectures WHERE project_id=$1 AND name=$2 LIMIT 1`,
      [project_id, name]
    );
    return existing.rows[0]?.id;
  }
  return r.rows[0].id;
}

async function linkObjectToArchitecture(pool, architecture_id, object_id) {
  if (!architecture_id || !object_id) return;
  try {
    await pool.query(
      `INSERT INTO discovery_architecture_objects (architecture_id, object_id)
       VALUES ($1,$2)
       ON CONFLICT (architecture_id, object_id) DO NOTHING`,
      [architecture_id, object_id]
    );
  } catch(e) { /* ignore */ }
}

// ─── DISCOVERY: BAJA SAE 2025 ─────────────────────────────────────────────────

async function seedBajaDiscovery(pool, projectId) {
  const P = projectId;

  // Objects — Powertrain cluster
  const engine = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Polaris RZR 570 Engine (44hp)',
    description: 'Single-cylinder EFI engine. 567cc, ~44hp. Proven Baja SAE choice. Weight ~38kg.',
    type: 'candidate_part',
    maturity: 'formal',
    confidence: 'high',
    tags: ['powertrain', 'engine', 'proven'],
    functional_cluster: 'powertrain'
  });

  const cvt = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Comet 780 Series CVT',
    description: 'Continuously variable transmission matched to RZR 570 power band. 30% reduction in shifting losses vs manual box.',
    type: 'candidate_part',
    maturity: 'promotable',
    confidence: 'high',
    tags: ['powertrain', 'transmission', 'cvt'],
    functional_cluster: 'powertrain'
  });

  const cvtVsManual = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'CVT vs Manual Gearbox Selection',
    description: 'Trade study evaluating CVT (Comet 780) vs a sequential manual box for competition use. CVT wins on weight and simplicity; manual wins on driver control.',
    type: 'trade_study',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['trade-study', 'powertrain', 'transmission'],
    functional_cluster: 'powertrain'
  });

  const mountInterface = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Engine-to-CVT Mounting Interface Geometry',
    description: 'Hypothesis: welded cradle with 4-point isolation mounts. Needs FEA to confirm load paths through engine cross-rail.',
    type: 'interface_hypothesis',
    maturity: 'raw',
    confidence: 'low',
    tags: ['interface', 'mounting', 'powertrain'],
    functional_cluster: 'powertrain'
  });

  const cvtBeltSlip = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'CVT Belt Slip at Peak Load on Hill Climb',
    description: 'Observed: belt slips when engine hits 7200 RPM on steep incline. Root cause suspected to be spring preload. Retuning primary clutch spring rate.',
    type: 'observation',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['failure', 'cvt', 'testing'],
    functional_cluster: 'powertrain'
  });

  // Objects — Suspension cluster
  const frontSusp = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Double A-Arm Front Suspension',
    description: 'Unequal-length double A-arm with 10" travel. Geometry optimized for camber gain. Fabricated 4130 chromoly arms.',
    type: 'mechanism',
    maturity: 'formal',
    confidence: 'high',
    tags: ['suspension', 'front', 'mechanism'],
    functional_cluster: 'suspension'
  });

  const rearSusp = await createDiscoveryObject(pool, {
    project_id: P,
    title: '4-Link Rear Suspension with Panhard Bar',
    description: 'Trailing arm 4-link layout with Panhard bar for lateral location. 12" rear travel target. Needs anti-squat tuning.',
    type: 'mechanism',
    maturity: 'promotable',
    confidence: 'medium',
    tags: ['suspension', 'rear', 'mechanism'],
    functional_cluster: 'suspension'
  });

  const tire = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Maxxis Razr2 Tire (23×7-10)',
    description: 'Paddle-style knobby. 23" OD. Standard Baja SAE choice. Excellent in sand and loose dirt.',
    type: 'candidate_part',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['tire', 'suspension', 'rubber'],
    functional_cluster: 'suspension'
  });

  const tireTest = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Tire Compound Grip Test — Loose Gravel',
    description: 'Ran skidpad test comparing Maxxis Razr2 vs ITP Holeshot. Razr2 posted 0.85g lateral on gravel. Holeshot 0.79g. Razr2 selected.',
    type: 'experiment',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['test', 'grip', 'tire'],
    functional_cluster: 'suspension'
  });

  // Objects — Chassis cluster
  const frameStudy = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Steel vs Chromoly Frame Material',
    description: 'DOM 1018 steel vs 4130 chromoly trade study. Chromoly saves ~3.2kg but costs 2.4× more. Decision: chromoly for main hoop, DOM elsewhere.',
    type: 'trade_study',
    maturity: 'formal',
    confidence: 'high',
    tags: ['material', 'frame', 'chassis'],
    functional_cluster: 'chassis'
  });

  const driverCell = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Ergonomic Driver Cell Packaging',
    description: 'Concept: tight-package cockpit for 5th–95th percentile driver. Harness angle, pedal box reach, and steering column tilt still TBD.',
    type: 'concept',
    maturity: 'raw',
    confidence: 'low',
    tags: ['ergonomics', 'chassis', 'driver'],
    functional_cluster: 'chassis'
  });

  // ── Relationships ──────────────────────────────────────────────────────────
  await createDiscoveryRelationship(pool, cvt, engine, 'candidate_for', 'CVT paired to RZR 570 power band');
  await createDiscoveryRelationship(pool, cvtVsManual, cvt, 'derived_from', 'Trade study analyzed CVT option');
  await createDiscoveryRelationship(pool, cvtVsManual, engine, 'derived_from', 'Trade study based on RZR 570 torque curve');
  await createDiscoveryRelationship(pool, mountInterface, engine, 'interacts_with', 'Mount geometry depends on engine block profile');
  await createDiscoveryRelationship(pool, mountInterface, cvt, 'interacts_with', 'CVT input shaft alignment constrained by mount');
  await createDiscoveryRelationship(pool, cvtBeltSlip, cvt, 'validated_by', 'Observation validates CVT belt slip failure mode');
  await createDiscoveryRelationship(pool, frontSusp, tire, 'depends_on', 'A-arm geometry depends on tire OD and offset');
  await createDiscoveryRelationship(pool, tireTest, tire, 'validated_by', 'Grip test confirms Maxxis Razr2 selection');
  await createDiscoveryRelationship(pool, rearSusp, frontSusp, 'supports', 'Rear 4-link mirrors front geometry for balanced handling');
  await createDiscoveryRelationship(pool, frameStudy, driverCell, 'derived_from', 'Frame material affects driver cell packaging weight budget');

  // ── Architectures ──────────────────────────────────────────────────────────
  const archA = await createDiscoveryArchitecture(pool, {
    project_id: P,
    name: 'Powertrain Arch A: CVT + RZR 570 (Selected)',
    description: 'Polaris RZR 570 engine mated to Comet 780 CVT with torque-sensing primary clutch. Single-stage chain reduction to rear diff.',
    pros: 'Simple, proven, light. No clutch pedal. Reliable CVT belt life > 50h in competition.',
    cons: 'Less driver feedback than manual. Belt replacement in field is slow.',
    risks: 'Belt slip at high altitude — mitigated by clutch spring retuning.',
    status: 'selected'
  });

  const archB = await createDiscoveryArchitecture(pool, {
    project_id: P,
    name: 'Powertrain Arch B: Manual Box + Briggs & Stratton',
    description: 'Briggs & Stratton 18hp engine with 5-speed sequential manual gearbox. Heavier but full driver control.',
    pros: 'Direct driver feedback. Simpler repair. Lower parts cost.',
    cons: 'Heavier by ~8kg. Driver fatigue on long courses. Less power.',
    risks: 'Driver error on gear selection in rocky terrain.',
    status: 'active'
  });

  // Link key objects to architectures
  if (archA) {
    await linkObjectToArchitecture(pool, archA, engine);
    await linkObjectToArchitecture(pool, archA, cvt);
    await linkObjectToArchitecture(pool, archA, mountInterface);
  }
  if (archB) {
    await linkObjectToArchitecture(pool, archB, cvtVsManual);
  }

  console.log('[DemoSeed] Baja Discovery seeded —', { engine, cvt, frontSusp, archA, archB });
}

// ─── DISCOVERY: GREYLINE TECHNOLOGIES (DEFENSE DRONE) ───────────────────────

async function seedDroneDiscovery(pool, projectId) {
  const P = projectId;

  // Objects — Flight Control cluster
  const pixhawk = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Pixhawk 6X Flight Controller',
    description: 'Triple-redundant IMU, H7 processor. Runs PX4 Autopilot. Industry standard for defense UAV development.',
    type: 'candidate_part',
    maturity: 'formal',
    confidence: 'high',
    tags: ['flight-control', 'avionics', 'proven'],
    functional_cluster: 'flight_control'
  });

  const navStack = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Autonomous Navigation Stack (GPS-denied)',
    description: 'Functional chunk covering optical flow + LiDAR-based SLAM for indoor/urban operations where GPS is jammed.',
    type: 'functional_chunk',
    maturity: 'raw',
    confidence: 'low',
    tags: ['navigation', 'gps-denied', 'slam'],
    functional_cluster: 'flight_control'
  });

  const props = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'T-Motor F90 KV1300 Propulsion Set (×4)',
    description: '90mm motor, 1300KV. Paired with 5" bi-blade prop. Thrust-to-weight > 4:1 at max payload. Rated for -20°C to 65°C.',
    type: 'candidate_part',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['motor', 'propulsion', 'flight-control'],
    functional_cluster: 'flight_control'
  });

  const windTest = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Wind Resistance Test at 30-knot Crosswind',
    description: 'Lab fan array simulation. Vehicle maintained heading within ±3° at 30 knots. PID gains tuned. Needs repeat at 40 knots.',
    type: 'experiment',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['test', 'wind', 'stability'],
    functional_cluster: 'flight_control'
  });

  // Objects — Payload cluster
  const sonar = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Sonar Array Ground Mapping Integration',
    description: 'Concept: 4-element phased array sonar pod in belly payload bay. Maps underground cavities and tunnel networks at low altitude.',
    type: 'concept',
    maturity: 'raw',
    confidence: 'low',
    tags: ['payload', 'sonar', 'sensing'],
    functional_cluster: 'payload'
  });

  const payloadInterface = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Payload Bay Quick-Release Interface',
    description: 'Hypothesis: 4-pin Mil-Spec electrical connector + quarter-turn mechanical lock. Hot-swap under 30 seconds in field.',
    type: 'interface_hypothesis',
    maturity: 'raw',
    confidence: 'low',
    tags: ['interface', 'payload', 'mechanical'],
    functional_cluster: 'payload'
  });

  // Objects — Airframe cluster
  const foldingWing = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Folding Arm Deployment Mechanism',
    description: 'Spring-loaded hinge with cam lock. Arms fold to 60% stowed footprint. Lock confirmed by hall-effect sensor fed to FC.',
    type: 'mechanism',
    maturity: 'promotable',
    confidence: 'medium',
    tags: ['mechanism', 'airframe', 'foldable'],
    functional_cluster: 'airframe'
  });

  const airframeMaterial = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Carbon Fiber vs G10 Airframe Material',
    description: 'CF saves 340g but costs 3× more and is brittle on hard landing. G10 absorbs impact better for field ops. Decision pending drop test results.',
    type: 'trade_study',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['material', 'airframe', 'trade-study'],
    functional_cluster: 'airframe'
  });

  // ── Relationships ──────────────────────────────────────────────────────────
  await createDiscoveryRelationship(pool, pixhawk, navStack, 'depends_on', 'Nav stack runs on Pixhawk compute and IMU');
  await createDiscoveryRelationship(pool, props, pixhawk, 'interacts_with', 'ESC signal from Pixhawk controls motor RPM');
  await createDiscoveryRelationship(pool, foldingWing, airframeMaterial, 'validated_by', 'Folding mechanism durability depends on material stiffness');
  await createDiscoveryRelationship(pool, payloadInterface, sonar, 'candidate_for', 'Quick-release designed to accept sonar pod');
  await createDiscoveryRelationship(pool, windTest, pixhawk, 'validated_by', 'Wind test validates Pixhawk PID tuning adequacy');
  await createDiscoveryRelationship(pool, navStack, sonar, 'interacts_with', 'Sonar data fused into nav stack terrain model');
  await createDiscoveryRelationship(pool, windTest, props, 'validated_by', 'Wind test confirms T-Motor thrust margin at 30-knot crosswind');
  await createDiscoveryRelationship(pool, navStack, props, 'interacts_with', 'Nav stack issues per-motor thrust commands via Pixhawk ESC mix');
  await createDiscoveryRelationship(pool, sonar, payloadInterface, 'depends_on', 'Sonar pod mounting geometry constrained by quick-release spec');
  await createDiscoveryRelationship(pool, airframeMaterial, props, 'supports', 'Frame stiffness sets vibration isolation requirements for motor mounts');

  // ── Architectures ──────────────────────────────────────────────────────────
  const archFixed = await createDiscoveryArchitecture(pool, {
    project_id: P,
    name: 'Config A: Fixed Quadcopter with Folding Arms',
    description: 'Standard X-frame quad with folding arms for transport. Pixhawk 6X + T-Motor F90 propulsion. Best for vertical ISR missions.',
    pros: 'Simple, reliable, proven airframe. Easy maintenance. GPS-denied nav possible.',
    cons: 'Lower max speed than hybrid VTOL. Limited payload bay volume.',
    risks: 'Arm hinge fatigue after 200+ deployments.',
    status: 'active'
  });

  const archVtol = await createDiscoveryArchitecture(pool, {
    project_id: P,
    name: 'Config B: Tilt-Rotor VTOL Hybrid',
    description: 'Fixed-wing cruise with tilting front rotors for VTOL. 3× range of quad config. Significantly more complex mechanically.',
    pros: 'Extended range (45km vs 12km). Higher cruise speed. Better wind resistance.',
    cons: 'Complex tilt mechanism. 6-month longer development. Higher crash risk.',
    risks: 'Tilt actuator failure in hover = unrecoverable crash.',
    status: 'active'
  });

  if (archFixed) {
    await linkObjectToArchitecture(pool, archFixed, pixhawk);
    await linkObjectToArchitecture(pool, archFixed, props);
    await linkObjectToArchitecture(pool, archFixed, foldingWing);
    await linkObjectToArchitecture(pool, archFixed, navStack);
  }
  if (archVtol) {
    await linkObjectToArchitecture(pool, archVtol, airframeMaterial);
    await linkObjectToArchitecture(pool, archVtol, payloadInterface);
  }

  console.log('[DemoSeed] Drone Discovery seeded —', { pixhawk, sonar, foldingWing, archFixed, archVtol });
}

// ─── DISCOVERY: HEAVY MOTION INDUSTRIES (HM-600 HYBRID TRUCK) ───────────────

async function seedTruckDiscovery(pool, projectId) {
  const P = projectId;

  // Objects — Powertrain cluster
  const parallelHybrid = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Parallel Hybrid Drivetrain Architecture',
    description: 'Engine and electric motor both drive the transmission input shaft via planetary gear set. Enables regen braking and electric-only low-speed operation.',
    type: 'concept',
    maturity: 'formal',
    confidence: 'high',
    tags: ['powertrain', 'hybrid', 'architecture'],
    functional_cluster: 'powertrain'
  });

  const cumminsEngine = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Cummins ISX12N Natural Gas Engine (400hp)',
    description: 'Natural gas variant of ISX12. 400hp / 1450 lb-ft. Meets EPA 2027 NOx without SCR. Drop-in for diesel ISX12 packaging.',
    type: 'candidate_part',
    maturity: 'formal',
    confidence: 'high',
    tags: ['engine', 'powertrain', 'natural-gas'],
    functional_cluster: 'powertrain'
  });

  const regenBraking = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Regenerative Braking Integration with ABS',
    description: 'Blended braking: ABS module splits regen torque from hydraulic brakes to prevent wheel lockup. Bosch iBooster interface needed.',
    type: 'mechanism',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['braking', 'regen', 'powertrain'],
    functional_cluster: 'powertrain'
  });

  const motorInterface = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Electric Motor to Transmission PTO Shaft Interface',
    description: 'Hypothesis: SAE #3 PTO mount with custom spline adapter. Motor centreline offset 45mm from transmission axis. Needs tolerance stack analysis.',
    type: 'interface_hypothesis',
    maturity: 'raw',
    confidence: 'low',
    tags: ['interface', 'motor', 'powertrain'],
    functional_cluster: 'powertrain'
  });

  const regenTest = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Regen Braking Recovery Efficiency at 60mph',
    description: 'Dyno test: regen recovered 62% of kinetic energy at 60→0mph stop. Target was 65%. ABS limiting recovery window by 80ms. Investigating.',
    type: 'experiment',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['test', 'regen', 'efficiency'],
    functional_cluster: 'powertrain'
  });

  // Objects — Energy Storage cluster
  const battery = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'CATL LFP 105Ah Battery Module (×16)',
    description: '3.2V LFP prismatic cells. 16 modules in 2P8S configuration → 51.2V nominal, 210Ah. ~11kWh usable. Rated for 3000 cycles to 80% SOH.',
    type: 'candidate_part',
    maturity: 'promotable',
    confidence: 'high',
    tags: ['battery', 'energy-storage', 'lfp'],
    functional_cluster: 'energy_storage'
  });

  const batteryChemTrade = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'LFP vs NMC Battery Chemistry Trade Study',
    description: 'LFP: safer, longer cycle life, lower cost, heavier. NMC: higher energy density, shorter life, thermal runaway risk. LFP selected for commercial fleet duty cycle.',
    type: 'trade_study',
    maturity: 'formal',
    confidence: 'high',
    tags: ['trade-study', 'battery', 'chemistry'],
    functional_cluster: 'energy_storage'
  });

  const thermalObs = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Battery Thermal Runaway Risk at 50°C Ambient',
    description: 'Observation: cells reached 61°C surface temp in Phoenix summer testing at 2C discharge rate. LFP thermal runway threshold ~130°C — margin OK but cooling system undersized.',
    type: 'observation',
    maturity: 'repeatable',
    confidence: 'medium',
    tags: ['thermal', 'battery', 'safety'],
    functional_cluster: 'energy_storage'
  });

  const powerMgmt = await createDiscoveryObject(pool, {
    project_id: P,
    title: 'Hybrid Power Management Controller',
    description: 'Functional chunk: embedded controller arbitrating engine torque, motor torque, regen events, and battery SOC targets. Runs on dedicated ECU, 10ms cycle time.',
    type: 'functional_chunk',
    maturity: 'promotable',
    confidence: 'medium',
    tags: ['controls', 'hybrid', 'energy-management'],
    functional_cluster: 'energy_storage'
  });

  // ── Relationships ──────────────────────────────────────────────────────────
  await createDiscoveryRelationship(pool, parallelHybrid, cumminsEngine, 'depends_on', 'Engine is primary power source in parallel hybrid config');
  await createDiscoveryRelationship(pool, parallelHybrid, battery, 'depends_on', 'Battery provides electric-only boost and stores regen energy');
  await createDiscoveryRelationship(pool, regenBraking, powerMgmt, 'interacts_with', 'Regen events commanded by power management controller');
  await createDiscoveryRelationship(pool, battery, batteryChemTrade, 'derived_from', 'CATL LFP selected as result of chemistry trade study');
  await createDiscoveryRelationship(pool, regenTest, regenBraking, 'validated_by', 'Dyno test validates regen braking mechanism performance');
  await createDiscoveryRelationship(pool, thermalObs, battery, 'validated_by', 'Thermal observation validates battery thermal management needs');
  await createDiscoveryRelationship(pool, motorInterface, parallelHybrid, 'supports', 'PTO shaft interface enables parallel motor-engine coupling');
  await createDiscoveryRelationship(pool, powerMgmt, battery, 'interacts_with', 'Controller monitors and manages battery SOC');
  await createDiscoveryRelationship(pool, powerMgmt, cumminsEngine, 'interacts_with', 'Power management controller arbitrates engine torque requests and load points');
  await createDiscoveryRelationship(pool, batteryChemTrade, thermalObs, 'derived_from', 'LFP chemistry selection incorporated observed thermal margin findings');

  // ── Architectures ──────────────────────────────────────────────────────────
  const archParallel = await createDiscoveryArchitecture(pool, {
    project_id: P,
    name: 'Series-Parallel Hybrid with Full Regen (Selected)',
    description: 'Cummins ISX12N + 150kW electric motor on transmission input. 11kWh LFP pack. Supports 15% grade on electric-only and full regen on all service braking.',
    pros: '40% better fuel economy in stop-go routes. Meets 2030 fleet emissions targets. Lower TCO at 5+ years.',
    cons: 'Higher upfront cost (+$42k). Longer delivery lead time. Complex BMS integration.',
    risks: 'Motor-to-PTO interface tolerance stacking. Battery cooling undersized for desert routes.',
    status: 'selected'
  });

  const archMildHybrid = await createDiscoveryArchitecture(pool, {
    project_id: P,
    name: 'Mild Hybrid — 48V Belt-Starter Generator',
    description: '48V BSG integrated to engine accessory drive. ~15kW regeneration, no electric-only mode. Much simpler integration.',
    pros: 'Half the cost. Proven technology. No high-voltage safety certification needed.',
    cons: 'Only 8-12% fuel savings vs 35-40% for full hybrid. No electric-only city mode.',
    risks: 'Insufficient fuel savings to meet fleet buyer ROI thresholds.',
    status: 'active'
  });

  if (archParallel) {
    await linkObjectToArchitecture(pool, archParallel, parallelHybrid);
    await linkObjectToArchitecture(pool, archParallel, cumminsEngine);
    await linkObjectToArchitecture(pool, archParallel, battery);
    await linkObjectToArchitecture(pool, archParallel, regenBraking);
    await linkObjectToArchitecture(pool, archParallel, powerMgmt);
  }
  if (archMildHybrid) {
    await linkObjectToArchitecture(pool, archMildHybrid, batteryChemTrade);
    await linkObjectToArchitecture(pool, archMildHybrid, motorInterface);
  }

  console.log('[DemoSeed] Truck Discovery seeded —', { parallelHybrid, battery, regenBraking, archParallel, archMildHybrid });
}


// ─── ROUTES ───────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const results = { teams: null, drone: null, baja: null, heavy_motion: null, errors: [] };

  // Seed teams first
  let teamIds = {};
  try {
    console.log('[DemoSeed] Seeding teams...');
    teamIds = await seedTeams(pool);
    results.teams = teamIds;
    console.log('[DemoSeed] Teams done —', teamIds);
  } catch(e) {
    console.error('[DemoSeed] Teams error:', e.message);
    results.errors.push({ project:'teams', error: e.message });
  }

  try {
    console.log('[DemoSeed] Seeding Drone project...');
    results.drone = await seedDroneProject(pool, teamIds['greyline']);
    console.log('[DemoSeed] Drone done — project id', results.drone);
  } catch(e) {
    console.error('[DemoSeed] Drone error:', e.message);
    results.errors.push({ project:'drone', error: e.message });
  }

  if (results.drone) {
    try {
      console.log('[DemoSeed] Seeding Drone Discovery...');
      await seedDroneDiscovery(pool, results.drone);
    } catch(e) {
      console.error('[DemoSeed] Drone Discovery error:', e.message);
      results.errors.push({ project:'drone_discovery', error: e.message });
    }
  }

  try {
    console.log('[DemoSeed] Seeding Baja SAE project...');
    results.baja = await seedBajaProject(pool, teamIds['full-send']);
    console.log('[DemoSeed] Baja done — project id', results.baja);
  } catch(e) {
    console.error('[DemoSeed] Baja error:', e.message);
    results.errors.push({ project:'baja', error: e.message });
  }

  if (results.baja) {
    try {
      console.log('[DemoSeed] Seeding Baja Discovery...');
      await seedBajaDiscovery(pool, results.baja);
    } catch(e) {
      console.error('[DemoSeed] Baja Discovery error:', e.message);
      results.errors.push({ project:'baja_discovery', error: e.message });
    }
  }

  try {
    console.log('[DemoSeed] Seeding Heavy Motion Industries project...');
    results.heavy_motion = await seedHeavyMotionProject(pool, teamIds['heavy-motion']);
    console.log('[DemoSeed] Heavy Motion done — project id', results.heavy_motion);
  } catch(e) {
    console.error('[DemoSeed] Heavy Motion error:', e.message);
    results.errors.push({ project:'heavy_motion', error: e.message });
  }

  if (results.heavy_motion) {
    try {
      console.log('[DemoSeed] Seeding Truck Discovery...');
      await seedTruckDiscovery(pool, results.heavy_motion);
    } catch(e) {
      console.error('[DemoSeed] Truck Discovery error:', e.message);
      results.errors.push({ project:'truck_discovery', error: e.message });
    }
  }

  const ok = results.errors.length === 0;
  res.status(ok ? 200 : 207).json({
    success: ok,
    message: ok ? 'Demo data seeded successfully' : 'Seeded with errors',
    team_ids: teamIds,
    drone_project_id: results.drone,
    baja_project_id: results.baja,
    heavy_motion_project_id: results.heavy_motion,
    errors: results.errors
  });
});

router.delete('/', async (req, res) => {
  const pool = req.app.locals.pool;
  // Remove all DOE studies linked to demo nodes first
  const projects = await pool.query("SELECT id FROM projects WHERE is_demo=true");
  for (const p of projects.rows) {
    // 8D reports linked to nodes in this project
    await pool.query(
      `DELETE FROM eightd_reports WHERE id IN (
        SELECT DISTINCT report_id FROM eightd_node_links
        WHERE node_id IN (SELECT id FROM nodes WHERE project_id=$1)
      )`,
      [p.id]
    );
    // DOE studies linked to nodes in this project
    await pool.query(
      `DELETE FROM doe_studies WHERE node_id IN (SELECT id FROM nodes WHERE project_id=$1)`,
      [p.id]
    );
    await pool.query('DELETE FROM nodes WHERE project_id=$1', [p.id]);
    await pool.query('DELETE FROM projects WHERE id=$1', [p.id]);
  }
  // Remove any stray test/placeholder 8D reports with no node links
  await pool.query(`DELETE FROM eightd_reports WHERE LOWER(TRIM(title)) = 'test'`);
  // Remove demo teams
  await pool.query("DELETE FROM teams WHERE is_demo=true");
  res.json({ success: true, message: 'Demo data removed' });
});

// GET /api/demo/drone-project — returns drone project ID for direct navigation
router.get('/drone-project', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const r = await pool.query("SELECT id FROM projects WHERE slug='drone-demo' LIMIT 1");
    if (r.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Drone demo project not found' });
    }
    res.json({ success: true, projectId: r.rows[0].id });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
