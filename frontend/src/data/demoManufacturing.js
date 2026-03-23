/**
 * Demo Manufacturing Data
 *
 * Mock data for manufacturing process estimates and DFM feedback.
 */

export const MANUFACTURING_PROCESSES = {
  cnc_milling: {
    id: 'cnc_milling',
    name: 'CNC Milling',
    icon: 'mill'
  },
  cnc_turning: {
    id: 'cnc_turning',
    name: 'CNC Turning',
    icon: 'lathe'
  },
  sheet_metal: {
    id: 'sheet_metal',
    name: 'Sheet Metal',
    icon: 'sheet'
  },
  waterjet: {
    id: 'waterjet',
    name: 'Waterjet',
    icon: 'water'
  },
  printing_3d: {
    id: 'printing_3d',
    name: '3D Printing',
    icon: 'printer'
  },
  casting: {
    id: 'casting',
    name: 'Casting',
    icon: 'cast'
  },
  welding: {
    id: 'welding',
    name: 'Welding / Fabrication',
    icon: 'weld'
  },
  assembly: {
    id: 'assembly',
    name: 'Assembly',
    icon: 'assembly'
  }
};

export const PROCESS_LIST = Object.values(MANUFACTURING_PROCESSES);

// DFM feedback by process type
const DFM_FEEDBACK_LIBRARY = {
  cnc_milling: [
    { severity: 'warning', message: 'Deep pocket may increase machining time' },
    { severity: 'warning', message: 'Thin wall (2mm) may require smaller tooling' },
    { severity: 'success', message: 'Geometry compatible with 3-axis machining' },
    { severity: 'warning', message: 'Tight tolerance (+/- 0.05mm) may increase cost' },
    { severity: 'success', message: 'Material suitable for high-speed machining' }
  ],
  cnc_turning: [
    { severity: 'success', message: 'Symmetric geometry ideal for turning' },
    { severity: 'warning', message: 'Undercut feature requires special tooling' },
    { severity: 'success', message: 'Standard threading profile detected' },
    { severity: 'warning', message: 'Long L/D ratio may require steady rest' }
  ],
  sheet_metal: [
    { severity: 'success', message: 'Bend radii within standard tooling range' },
    { severity: 'warning', message: 'Relief cuts needed near bend intersection' },
    { severity: 'success', message: 'Hole spacing adequate for punching' },
    { severity: 'error', message: 'Minimum flange height not met on edge B' }
  ],
  waterjet: [
    { severity: 'success', message: '2D profile suitable for waterjet cutting' },
    { severity: 'warning', message: 'Sharp internal corners will have slight radius' },
    { severity: 'success', message: 'Material thickness within cutting range' },
    { severity: 'warning', message: 'Small features may have taper on thick stock' }
  ],
  printing_3d: [
    { severity: 'success', message: 'No support structures needed' },
    { severity: 'warning', message: 'Overhang angle >45 deg requires supports' },
    { severity: 'success', message: 'Wall thickness adequate for FDM' },
    { severity: 'warning', message: 'Fine details may require SLA for accuracy' }
  ],
  casting: [
    { severity: 'warning', message: 'Draft angle needed on vertical faces' },
    { severity: 'success', message: 'Uniform wall thickness promotes even cooling' },
    { severity: 'error', message: 'Undercut requires side core or redesign' },
    { severity: 'warning', message: 'Shrinkage allowance factored into estimate' }
  ],
  welding: [
    { severity: 'success', message: 'Joint access adequate for MIG welding' },
    { severity: 'warning', message: 'Heat affected zone near critical feature' },
    { severity: 'success', message: 'Material combination weldable' },
    { severity: 'warning', message: 'Post-weld stress relief recommended' }
  ],
  assembly: [
    { severity: 'success', message: 'Standard fastener patterns detected' },
    { severity: 'warning', message: 'Tight clearance may require assembly fixture' },
    { severity: 'success', message: 'Sub-assemblies can be built in parallel' },
    { severity: 'warning', message: 'Alignment features recommended for fit-up' }
  ]
};

// Base estimates by process
const BASE_ESTIMATES = {
  cnc_milling: { unitCost: 84, leadDays: [7, 10], setupCost: 150 },
  cnc_turning: { unitCost: 62, leadDays: [5, 8], setupCost: 100 },
  sheet_metal: { unitCost: 38, leadDays: [4, 7], setupCost: 75 },
  waterjet: { unitCost: 42, leadDays: [3, 5], setupCost: 50 },
  printing_3d: { unitCost: 18, leadDays: [2, 4], setupCost: 0 },
  casting: { unitCost: 156, leadDays: [14, 21], setupCost: 500 },
  welding: { unitCost: 95, leadDays: [5, 8], setupCost: 125 },
  assembly: { unitCost: 45, leadDays: [3, 5], setupCost: 50 }
};

// Materials by process
export const MATERIALS_BY_PROCESS = {
  cnc_milling: ['Aluminum 6061-T6', 'Aluminum 7075-T6', 'Steel 1018', 'Steel 4140', 'Stainless 304', 'Stainless 316', 'Titanium Grade 5', 'Brass', 'Delrin', 'UHMW'],
  cnc_turning: ['Aluminum 6061-T6', 'Steel 1018', 'Steel 4140', 'Stainless 303', 'Stainless 316', 'Brass', 'Bronze', 'Delrin'],
  sheet_metal: ['Aluminum 5052', 'Aluminum 6061', 'Steel CR', 'Steel HR', 'Stainless 304', 'Stainless 316', 'Galvanized Steel'],
  waterjet: ['Aluminum', 'Steel', 'Stainless', 'Titanium', 'Carbon Fiber', 'G10', 'Acrylic', 'Rubber'],
  printing_3d: ['PLA', 'PETG', 'ABS', 'ASA', 'Nylon', 'TPU', 'Resin (SLA)', 'Nylon (SLS)'],
  casting: ['Aluminum A356', 'Aluminum A380', 'Zinc', 'Bronze', 'Iron'],
  welding: ['Steel', 'Stainless', 'Aluminum', 'Chromoly'],
  assembly: ['N/A - Assembly Only']
};

/**
 * Get DFM feedback for a given process
 * Returns 2-4 feedback items based on the process
 */
export function getDFMFeedback(processId, nodePartNumber = '') {
  const feedback = DFM_FEEDBACK_LIBRARY[processId] || DFM_FEEDBACK_LIBRARY.cnc_milling;

  // Use part number as a seed for consistent but varied feedback
  const seed = nodePartNumber ? nodePartNumber.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : Math.random() * 1000;

  // Select 2-4 items based on seed
  const count = 2 + (seed % 3);
  const startIndex = seed % Math.max(1, feedback.length - count);

  return feedback.slice(startIndex, startIndex + count);
}

/**
 * Get manufacturing estimate for a process and quantity
 */
export function getManufacturingEstimate(processId, quantity = 1, nodePartNumber = '') {
  const base = BASE_ESTIMATES[processId] || BASE_ESTIMATES.cnc_milling;

  // Add some variation based on part number
  const seed = nodePartNumber ? nodePartNumber.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 0;
  const variation = 0.8 + ((seed % 40) / 100); // 0.8 to 1.2 multiplier

  const unitCost = Math.round(base.unitCost * variation);
  const setupCost = base.setupCost;

  // Volume discount: 10% off at 5+, 15% at 10+, 20% at 25+
  let discount = 0;
  if (quantity >= 25) discount = 0.20;
  else if (quantity >= 10) discount = 0.15;
  else if (quantity >= 5) discount = 0.10;

  const discountedUnitCost = Math.round(unitCost * (1 - discount));
  const totalCost = (discountedUnitCost * quantity) + setupCost;

  const leadMin = base.leadDays[0];
  const leadMax = base.leadDays[1];
  // Add 1-2 days for larger quantities
  const leadAddition = quantity > 10 ? 2 : (quantity > 5 ? 1 : 0);

  return {
    unitCost: discountedUnitCost,
    originalUnitCost: unitCost,
    setupCost,
    totalCost,
    quantity,
    discount: discount > 0 ? `${Math.round(discount * 100)}%` : null,
    leadTime: `${leadMin + leadAddition}-${leadMax + leadAddition} days`
  };
}

/**
 * Determine recommended process based on node type
 */
export function getRecommendedProcess(node) {
  if (!node) return 'cnc_milling';

  const name = (node.name || '').toLowerCase();
  const partNumber = (node.part_number || '').toLowerCase();

  // Simple heuristics based on common naming patterns
  if (name.includes('bracket') || name.includes('panel') || name.includes('plate')) {
    return 'sheet_metal';
  }
  if (name.includes('shaft') || name.includes('pin') || name.includes('bushing') || name.includes('spacer')) {
    return 'cnc_turning';
  }
  if (name.includes('housing') || name.includes('enclosure') || name.includes('case')) {
    return 'cnc_milling';
  }
  if (name.includes('frame') || name.includes('structure') || name.includes('weldment')) {
    return 'welding';
  }
  if (name.includes('assy') || name.includes('assembly')) {
    return 'assembly';
  }
  if (name.includes('print') || name.includes('prototype')) {
    return 'printing_3d';
  }

  // Default to CNC milling
  return 'cnc_milling';
}
