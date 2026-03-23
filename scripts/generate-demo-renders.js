#!/usr/bin/env node
/**
 * Generate CAD-style render images for demo projects and save as static assets.
 * Run: node scripts/generate-demo-renders.js
 * Images saved to: public/images/demo/
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://polsia.com/ai/openai/v1';
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY  || '';

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'demo');

// ── helpers ──────────────────────────────────────────────────────────────────

function jsonPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const lib     = https;
    const payload = JSON.stringify(body);
    const req = lib.request({
      hostname: parsed.hostname,
      port:     443,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function generateImage(prompt) {
  console.log(`  → Generating: "${prompt.slice(0, 70)}..."`);
  const res = await jsonPost(
    `${OPENAI_BASE_URL}/images/generations`,
    { Authorization: `Bearer ${OPENAI_API_KEY}` },
    { model: 'dall-e-3', prompt, n: 1, size: '1024x1024', response_format: 'b64_json' }
  );
  if (res.status !== 200 || !res.body.data?.[0]?.b64_json) {
    throw new Error(`Image generation failed (${res.status}): ${JSON.stringify(res.body).slice(0, 300)}`);
  }
  return res.body.data[0].b64_json;
}

// ── render prompts ─────────────────────────────────────────────────────────

const RENDERS = [
  // Baja SAE
  {
    filename: 'baja-full-isometric.png',
    prompt: 'Professional engineering CAD render of a Baja SAE off-road racing buggy, isometric 3/4 view from above-right. Single-seat open-wheel competition vehicle with exposed chromoly steel tube frame roll cage, long-travel double-wishbone suspension, wide off-road tires. Dark grey background, photorealistic 3D CAD software rendering, SOLIDWORKS aesthetic, no people.'
  },
  {
    filename: 'baja-34-front.png',
    prompt: 'Professional engineering CAD render of a Baja SAE off-road racing buggy, 3/4 front view perspective. Single-seat competition vehicle showing tubular roll cage, front A-arm suspension, knobby mud tires, and steering rack. Dark background, SOLIDWORKS/Fusion360 render style, photorealistic, no people.'
  },
  {
    filename: 'baja-roll-cage.png',
    prompt: 'Engineering CAD render of a tubular chromoly steel roll cage main hoop assembly with gusset plates and weld joints. Bare metal finish, isometric view, technical drawing aesthetic. Dark background, SOLIDWORKS render style, Baja SAE chassis component.'
  },
  {
    filename: 'baja-fea-stress.png',
    prompt: 'Finite element analysis (FEA) von Mises stress visualization of a tubular steel automotive roll cage under lateral crush load. Blue-to-red color gradient stress map on the steel tube structure, engineering simulation software style like ANSYS Mechanical, dark background, no text overlays needed.'
  },
  {
    filename: 'baja-suspension.png',
    prompt: 'Engineering CAD render of a double-wishbone (A-arm) suspension assembly for off-road racing, isometric view. Upper and lower control arms, coilover shock absorber, upright knuckle, and wheel hub. Bare aluminum and steel finish, dark background, SOLIDWORKS render.'
  },
  {
    filename: 'baja-gearbox.png',
    prompt: 'Engineering CAD cross-section render of a 2-stage planetary gearbox for automotive racing application. Cutaway view showing internal planetary gear sets, ring gear, sun gear, carrier, and bearing arrangement. Silver and gold metallic finish, dark background, technical render.'
  },
  {
    filename: 'baja-brake-rotor.png',
    prompt: 'Engineering CAD render of a cross-drilled ventilated disc brake rotor, isometric view. Metallic steel finish with visible drill holes and vented interior, Baja SAE racing application. Dark background, photorealistic SOLIDWORKS render.'
  },
  // Greyline drone
  {
    filename: 'drone-isometric.png',
    prompt: 'Professional engineering CAD render of a tactical military reconnaissance quadcopter drone, isometric 3/4 view. Carbon fiber X-frame with four brushless motors and propellers, GPS module, camera gimbal, folding arms, and electronics bay. Dark background, defense technology product render, no people.'
  },
  {
    filename: 'drone-top-down.png',
    prompt: 'Top-down engineering CAD view of a tactical reconnaissance drone, bird eye perspective. Showing X-configuration arms, four propellers, carbon fiber frame structure, central electronics bay. Dark background, technical blueprint style render.'
  },
  {
    filename: 'drone-pcb.png',
    prompt: 'Engineering render of a flight controller PCB stack with vibration isolation dampers, for a racing/tactical drone. Green PCB circuit board with components, mounting hardware. Dark background, technical product photography style, no people.'
  },
  // Heavy Motion truck
  {
    filename: 'truck-34-front.png',
    prompt: 'Professional engineering CAD render of a heavy-duty hybrid-electric transit truck, 3/4 front isometric view. Large commercial vehicle with aerodynamic cab design, diesel-electric hybrid powertrain, large wheels. Dark background, automotive engineering CAD render style.'
  },
  {
    filename: 'truck-full-isometric.png',
    prompt: 'Engineering CAD render of a full-size diesel-electric hybrid transit bus/truck, complete isometric view showing entire vehicle. Dark background, SOLIDWORKS/Alias render style, commercial vehicle design, no people.'
  },
  {
    filename: 'truck-battery-pack.png',
    prompt: 'Engineering CAD exploded view render of a high-voltage battery pack assembly for electric heavy truck. Showing individual battery cell modules, cooling plates, busbars, BMS electronics, and enclosure. Dark background, technical cross-section render, EV engineering.'
  },
];

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure output dir exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  const results = {};
  for (const r of RENDERS) {
    const outPath = path.join(OUTPUT_DIR, r.filename);
    // Skip if already generated
    if (fs.existsSync(outPath)) {
      console.log(`[SKIP] ${r.filename} (already exists)`);
      results[r.filename] = `/images/demo/${r.filename}`;
      continue;
    }

    console.log(`\n[${r.filename}]`);
    try {
      const b64 = await generateImage(r.prompt);
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(outPath, buf);
      const kb = Math.round(buf.length / 1024);
      console.log(`  ✓ Saved ${r.filename} (${kb} KB)`);
      results[r.filename] = `/images/demo/${r.filename}`;
    } catch(e) {
      console.error(`  ✗ Error: ${e.message}`);
      results[r.filename] = null;
    }
  }

  console.log('\n\n=== FILE PATHS ===');
  for (const [f, v] of Object.entries(results)) {
    console.log(`  ${f}: ${v || 'FAILED'}`);
  }
  console.log('\nDone! Commit public/images/demo/ and update seed/migration with these paths.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
