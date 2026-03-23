import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Download,
  Printer,
  Share2,
  ChevronRight,
  ChevronDown,
  FileText,
  Target,
  Layers,
  Calculator,
  FlaskConical,
  Package,
  Shield,
  BookMarked,
  Paperclip,
  Check,
  AlertTriangle,
  TrendingUp,
  Calendar,
  User,
  Clock,
  Eye,
  X,
  Maximize2,
  Minimize2,
  Settings,
  Wrench,
  Cpu,
  Navigation,
  Gauge,
  Users,
  Box
} from 'lucide-react';
import Header from '../../Header';

// ============================================================================
// SUBSYSTEM DATA - Detailed engineering specifications
// ============================================================================

const SUBSYSTEM_DATA = {
  frame: {
    name: 'Frame & Chassis',
    owner: 'Michael Chen',
    status: 'Released',
    revision: 'Rev C',
    weight: '67.2 lbs',
    material: '4130 Chromoly Steel',
    specs: {
      'Tube OD (Main Hoop)': '1.5" x 0.095" wall',
      'Tube OD (Side Impact)': '1.25" x 0.065" wall',
      'Tube OD (Bracing)': '1.0" x 0.049" wall',
      'Overall Length': '96.5 inches',
      'Overall Width': '62 inches',
      'Overall Height': '48 inches',
      'Wheelbase': '64 inches',
      'Front Track': '52 inches',
      'Rear Track': '50 inches',
      'Weight Distribution': '42% Front / 58% Rear',
      'CG Height': '14.2 inches',
      'Torsional Stiffness': '1,850 Nm/deg'
    },
    feaResults: [
      { loadCase: '3G Frontal Impact', maxStress: '42.3 ksi', fos: '2.3', location: 'Lower A-arm mount', status: 'PASS' },
      { loadCase: '2G Side Impact', maxStress: '35.1 ksi', fos: '2.8', location: 'Side impact tube', status: 'PASS' },
      { loadCase: '2G Rollover', maxStress: '38.7 ksi', fos: '2.5', location: 'Main hoop joint', status: 'PASS' },
      { loadCase: '4G Landing (Jump)', maxStress: '48.2 ksi', fos: '2.0', location: 'Rear suspension mount', status: 'PASS' },
      { loadCase: 'Combined Braking + Cornering', maxStress: '44.1 ksi', fos: '2.2', location: 'Front subframe', status: 'PASS' }
    ],
    tests: [
      { name: 'Rollover Protection Test', requirement: 'No permanent deformation at 2x driver weight', result: '0.12mm elastic deflection', status: 'PASS' },
      { name: 'Side Impact Test', requirement: 'Meet SAE impact requirements', result: 'Exceeded by 15%', status: 'PASS' },
      { name: 'Torsional Stiffness Test', requirement: '> 1,500 Nm/deg', result: '1,850 Nm/deg', status: 'PASS' }
    ],
    drawings: ['DWG-100-001 Frame Assembly', 'DWG-100-002 Main Hoop', 'DWG-100-003 Front Bulkhead', 'DWG-100-004 Rear Subframe'],
    bomSummary: { partCount: 47, totalCost: '$1,847', majorItems: ['4130 Tubing ($1,200)', 'Gussets ($320)', 'Tabs & Brackets ($327)'] }
  },
  frontSuspension: {
    name: 'Front Suspension',
    owner: 'Sarah Martinez',
    status: 'Released',
    revision: 'Rev B',
    weight: '34.8 lbs',
    material: '4130 Chromoly / 6061-T6 Aluminum',
    specs: {
      'Type': 'Double A-Arm Independent',
      'Travel': '12.5 inches',
      'Spring Rate': '350 lbs/in',
      'Motion Ratio': '0.85:1',
      'Static Camber': '-1.5°',
      'Camber Gain': '-0.8°/inch travel',
      'Caster Angle': '8°',
      'KPI': '12°',
      'Scrub Radius': '1.2 inches',
      'Anti-Dive': '15%',
      'Roll Center Height': '2.5 inches',
      'Shock': 'Fox Float 3 Evol'
    },
    feaResults: [
      { loadCase: '3G Bump', maxStress: '38.2 ksi', fos: '2.6', location: 'Upper A-arm', status: 'PASS' },
      { loadCase: '2G Lateral', maxStress: '41.5 ksi', fos: '2.4', location: 'Lower ball joint', status: 'PASS' },
      { loadCase: '1.5G Braking', maxStress: '35.8 ksi', fos: '2.8', location: 'Spindle', status: 'PASS' }
    ],
    tests: [
      { name: 'Travel Test', requirement: '> 10" travel', result: '12.5" measured', status: 'PASS' },
      { name: 'Ride Height Test', requirement: '11" ground clearance', result: '11.5" achieved', status: 'PASS' },
      { name: 'Camber Curve Validation', requirement: 'Match kinematic model ±0.5°', result: '±0.3° variance', status: 'PASS' }
    ],
    drawings: ['DWG-200-001 Front Suspension Assembly', 'DWG-200-002 Upper A-Arm', 'DWG-200-003 Lower A-Arm', 'DWG-200-004 Spindle', 'DWG-200-005 Hub Assembly'],
    bomSummary: { partCount: 38, totalCost: '$2,180', majorItems: ['Fox Float 3 Shocks x2 ($800)', 'Spindles ($420)', 'A-Arms ($380)', 'Bearings ($280)'] }
  },
  rearSuspension: {
    name: 'Rear Suspension',
    owner: 'David Kim',
    status: 'Released',
    revision: 'Rev B',
    weight: '41.2 lbs',
    material: '4130 Chromoly / 6061-T6 Aluminum',
    specs: {
      'Type': 'Trailing Arm with Panhard Rod',
      'Travel': '11 inches',
      'Spring Rate': '400 lbs/in',
      'Motion Ratio': '0.90:1',
      'Static Camber': '0°',
      'Camber Gain': '-0.3°/inch travel',
      'Toe Compliance': '< 0.1°/100 lbs lateral',
      'Anti-Squat': '22%',
      'Roll Center Height': '8.5 inches',
      'Shock': 'Fox Float 3 Evol'
    },
    feaResults: [
      { loadCase: '4G Bump (Landing)', maxStress: '45.1 ksi', fos: '2.2', location: 'Trailing arm pivot', status: 'PASS' },
      { loadCase: '2G Lateral', maxStress: '39.8 ksi', fos: '2.5', location: 'Panhard mount', status: 'PASS' },
      { loadCase: 'Drive Torque (Max)', maxStress: '36.2 ksi', fos: '2.7', location: 'Axle housing', status: 'PASS' }
    ],
    tests: [
      { name: 'Travel Test', requirement: '> 10" travel', result: '11" measured', status: 'PASS' },
      { name: 'Anti-Squat Validation', requirement: '20-25% anti-squat', result: '22% measured', status: 'PASS' },
      { name: 'Articulation Test', requirement: 'Full travel without binding', result: 'No binding observed', status: 'PASS' }
    ],
    drawings: ['DWG-300-001 Rear Suspension Assembly', 'DWG-300-002 Trailing Arm', 'DWG-300-003 Panhard Rod', 'DWG-300-004 Axle Housing'],
    bomSummary: { partCount: 32, totalCost: '$1,920', majorItems: ['Fox Float 3 Shocks x2 ($800)', 'Trailing Arms ($450)', 'Axle Housing ($380)', 'Panhard Rod ($150)'] }
  },
  powertrain: {
    name: 'Powertrain',
    owner: 'James Wilson',
    status: 'Released',
    revision: 'Rev D',
    weight: '89.5 lbs',
    material: 'Various (Steel, Aluminum, Composite)',
    specs: {
      'Engine': 'Briggs & Stratton 10 HP OHV',
      'Peak Power': '10 HP @ 3,800 RPM',
      'Peak Torque': '14.5 lb-ft @ 2,400 RPM',
      'CVT': 'CVTech Powerbloc 50',
      'Engagement RPM': '2,200 RPM (tuned)',
      'Shift-Out RPM': '3,600 RPM',
      'Gearbox': 'Custom 4.2:1 reduction',
      'Final Drive': 'Chain, 2.5:1',
      'Overall Ratio Range': '3.5:1 - 10.5:1',
      'Top Speed (Theoretical)': '38 mph',
      'Axle Shafts': '4340 Steel, 1" diameter'
    },
    feaResults: [
      { loadCase: 'Max Torque (Stall)', maxStress: '52.1 ksi', fos: '2.1', location: 'Gearbox input shaft', status: 'PASS' },
      { loadCase: 'Shock Load (2x)', maxStress: '48.7 ksi', fos: '2.3', location: 'Axle shaft', status: 'PASS' },
      { loadCase: 'Chain Tension (Max)', maxStress: '35.2 ksi', fos: '3.1', location: 'Sprocket teeth', status: 'PASS' }
    ],
    tests: [
      { name: 'Dyno Test', requirement: 'Validate power curve', result: '9.8 HP peak (within spec)', status: 'PASS' },
      { name: 'CVT Engagement Test', requirement: '2,200 ± 100 RPM', result: '2,180 RPM measured', status: 'PASS' },
      { name: 'Endurance Test (4 hrs)', requirement: 'No failures', result: 'Completed, oil temp stable', status: 'PASS' }
    ],
    drawings: ['DWG-400-001 Powertrain Assembly', 'DWG-400-002 Engine Mount', 'DWG-400-003 CVT Assembly', 'DWG-400-004 Gearbox', 'DWG-400-005 Chain Drive'],
    bomSummary: { partCount: 67, totalCost: '$3,240', majorItems: ['CVTech CVT ($1,850)', 'Gearbox ($620)', 'Chain/Sprockets ($280)', 'Engine Mounts ($180)'] }
  },
  steering: {
    name: 'Steering System',
    owner: 'Emily Zhang',
    status: 'Released',
    revision: 'Rev B',
    weight: '12.4 lbs',
    material: '4130 Chromoly / 6061-T6 Aluminum',
    specs: {
      'Type': 'Rack and Pinion',
      'Rack Travel': '4 inches',
      'Steering Ratio': '5.2:1',
      'Turns Lock-to-Lock': '2.5',
      'Ackermann': '78%',
      'Turning Radius': '12.5 feet',
      'Column': 'Collapsible with U-joints',
      'Wheel': '10" diameter, Quick Release',
      'Tie Rod Adjustment': 'LH/RH threaded'
    },
    feaResults: [
      { loadCase: 'Max Steering Load', maxStress: '32.5 ksi', fos: '3.1', location: 'Tie rod', status: 'PASS' },
      { loadCase: 'Impact (Curb Strike)', maxStress: '44.8 ksi', fos: '2.2', location: 'Steering arm', status: 'PASS' },
      { loadCase: 'Column Collapse Load', maxStress: '28.1 ksi', fos: '3.5', location: 'Collapse joint', status: 'PASS' }
    ],
    tests: [
      { name: 'Steering Effort Test', requirement: '< 15 lbs at wheel rim', result: '11 lbs measured', status: 'PASS' },
      { name: 'Bump Steer Test', requirement: '< 0.5°/inch travel', result: '0.3°/inch measured', status: 'PASS' },
      { name: 'Free Play Test', requirement: '< 5° at wheel', result: '2° measured', status: 'PASS' }
    ],
    drawings: ['DWG-500-001 Steering Assembly', 'DWG-500-002 Rack & Pinion', 'DWG-500-003 Steering Column', 'DWG-500-004 Tie Rods'],
    bomSummary: { partCount: 24, totalCost: '$890', majorItems: ['Steering Rack ($380)', 'Quick Release Hub ($180)', 'Column Assembly ($210)', 'Tie Rods ($120)'] }
  },
  brakes: {
    name: 'Brake System',
    owner: 'Alex Rodriguez',
    status: 'Released',
    revision: 'Rev B',
    weight: '18.6 lbs',
    material: 'Steel Rotors / Aluminum Calipers',
    specs: {
      'Type': 'Dual Circuit Hydraulic',
      'Front Calipers': 'Wilwood GP200, 2-piston',
      'Rear Caliper': 'Wilwood PS-1, 1-piston (inboard)',
      'Front Rotors': '8" x 0.25" vented',
      'Rear Rotor': '8" x 0.25" solid',
      'Master Cylinders': 'Dual 5/8" bore',
      'Bias Bar': 'Adjustable front/rear',
      'Pedal Ratio': '6:1',
      'Line Pressure (Max)': '1,200 psi',
      'Pad Material': 'Wilwood BP-20'
    },
    feaResults: [
      { loadCase: 'Max Braking (1.2g)', maxStress: '28.4 ksi', fos: '3.5', location: 'Caliper bracket', status: 'PASS' },
      { loadCase: 'Thermal Stress', maxStress: '35.2 ksi', fos: '2.8', location: 'Rotor', status: 'PASS' },
      { loadCase: 'Pedal Load (200 lbs)', maxStress: '22.1 ksi', fos: '4.5', location: 'Pedal pivot', status: 'PASS' }
    ],
    tests: [
      { name: 'Lock-Up Test (Flat)', requirement: 'Lock all 4 wheels', result: 'All wheels locked at 0.85g', status: 'PASS' },
      { name: 'Lock-Up Test (Slope)', requirement: 'Lock all 4 on 30° slope', result: 'All wheels locked', status: 'PASS' },
      { name: 'Fade Test (10 stops)', requirement: 'Pedal travel < 50% increase', result: '18% increase', status: 'PASS' },
      { name: 'Brake Isolation Test', requirement: 'Either circuit stops vehicle', result: 'Both circuits functional', status: 'PASS' }
    ],
    drawings: ['DWG-600-001 Brake System Assembly', 'DWG-600-002 Front Brake', 'DWG-600-003 Rear Brake', 'DWG-600-004 Pedal Box', 'DWG-600-005 Hydraulic Lines'],
    bomSummary: { partCount: 45, totalCost: '$1,420', majorItems: ['Wilwood Calipers ($520)', 'Rotors ($280)', 'Master Cylinders ($240)', 'Brake Lines ($180)'] }
  },
  ergonomics: {
    name: 'Driver Ergonomics',
    owner: 'Lisa Park',
    status: 'Released',
    revision: 'Rev C',
    weight: '24.3 lbs',
    material: 'Aluminum / Steel / Foam',
    specs: {
      'Seat': 'Custom aluminum with foam padding',
      'Driver Range': '5th to 95th percentile',
      'Pedal Adjustment': '4 inches fore/aft',
      'Steering Reach': 'Adjustable column',
      'Harness': 'SFI 16.1 5-point',
      'Head Clearance': '> 6 inches to rollbar',
      'Shoulder Clearance': '> 3 inches to SIM',
      'Hip Point Height': '4 inches from floor',
      'Visibility': '180° horizontal FOV'
    },
    feaResults: [
      { loadCase: 'Seat Mount (5g)', maxStress: '38.2 ksi', fos: '2.6', location: 'Seat bracket', status: 'PASS' },
      { loadCase: 'Harness Load (3g)', maxStress: '25.4 ksi', fos: '3.9', location: 'Harness tab', status: 'PASS' },
      { loadCase: 'Pedal Load (300 lbs)', maxStress: '31.2 ksi', fos: '3.2', location: 'Pedal mount', status: 'PASS' }
    ],
    tests: [
      { name: 'Egress Test', requirement: '< 5 seconds', result: '3.8 seconds average', status: 'PASS' },
      { name: 'Visibility Test', requirement: '> 160° horizontal FOV', result: '185° measured', status: 'PASS' },
      { name: '5th Percentile Fit', requirement: 'All controls reachable', result: 'All controls verified', status: 'PASS' },
      { name: '95th Percentile Fit', requirement: 'Adequate clearance', result: '> 2" clearance all points', status: 'PASS' },
      { name: 'Harness Adjustment', requirement: 'Secure 5th-95th', result: 'All drivers secured', status: 'PASS' }
    ],
    drawings: ['DWG-700-001 Cockpit Assembly', 'DWG-700-002 Seat', 'DWG-700-003 Adjustable Pedal Box', 'DWG-700-004 Harness Installation'],
    bomSummary: { partCount: 28, totalCost: '$680', majorItems: ['Harness ($180)', 'Seat Materials ($220)', 'Pedal Box ($180)', 'Padding ($100)'] }
  }
};

// ============================================================================
// PDF Print Styles
// ============================================================================

const printStyles = `
@media print {
  @page {
    size: letter;
    margin: 0.75in;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .no-print {
    display: none !important;
  }

  .print-break {
    page-break-before: always;
  }

  .print-avoid-break {
    page-break-inside: avoid;
  }

  .bg-gradient-to-br {
    background: #1e1b4b !important;
  }

  * {
    color-adjust: exact !important;
  }
}
`;

// ============================================================================
// Section Components
// ============================================================================

const SectionNav = ({ sections, activeSection, onSectionClick, expanded, onToggleExpand }) => (
  <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-3 sticky top-24">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-medium text-[#6B7280] uppercase">Contents</h3>
      <button
        onClick={onToggleExpand}
        className="text-[#6B7280] hover:text-[#F0F2F4]"
      >
        {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </div>
    <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-[#B4BAC4] hover:bg-[#2A2F36] hover:text-[#F0F2F4]'
            }`}
          >
            <Icon size={14} />
            <span className="truncate text-left">{section.name}</span>
          </button>
        );
      })}
    </nav>
  </div>
);

// Subsystem Detail Card
const SubsystemDetailSection = ({ subsystem, data }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="print-avoid-break bg-[#1C1F24] border border-[#2A2F36] rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-[#15181C] hover:bg-[#1C1F24] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Layers size={20} className="text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-[#F0F2F4]">{data.name}</h3>
            <div className="flex items-center gap-4 text-xs text-[#6B7280]">
              <span>Owner: {data.owner}</span>
              <span className="text-emerald-400">{data.status}</span>
              <span>{data.revision}</span>
            </div>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-[#6B7280] transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="p-4 space-y-6">
          {/* Key Specs */}
          <div>
            <h4 className="text-sm font-semibold text-[#F0F2F4] mb-3 flex items-center gap-2">
              <Settings size={14} className="text-blue-400" />
              Specifications
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(data.specs).map(([key, value]) => (
                <div key={key} className="bg-[#15181C] rounded p-2 text-sm">
                  <div className="text-[#6B7280] text-xs">{key}</div>
                  <div className="text-[#F0F2F4] font-medium">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FEA Results */}
          <div>
            <h4 className="text-sm font-semibold text-[#F0F2F4] mb-3 flex items-center gap-2">
              <Calculator size={14} className="text-cyan-400" />
              FEA Analysis Results
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2F36]">
                    <th className="text-left py-2 text-[#6B7280] font-medium">Load Case</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium">Max Stress</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium">FoS</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium">Location</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.feaResults.map((result, i) => (
                    <tr key={i} className="border-b border-[#2A2F36]/50">
                      <td className="py-2 text-[#B4BAC4]">{result.loadCase}</td>
                      <td className="py-2 text-[#F0F2F4]">{result.maxStress}</td>
                      <td className="py-2 text-cyan-400 font-medium">{result.fos}</td>
                      <td className="py-2 text-[#6B7280]">{result.location}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                          {result.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test Results */}
          <div>
            <h4 className="text-sm font-semibold text-[#F0F2F4] mb-3 flex items-center gap-2">
              <FlaskConical size={14} className="text-green-400" />
              Test Results
            </h4>
            <div className="space-y-2">
              {data.tests.map((test, i) => (
                <div key={i} className="bg-[#15181C] rounded-lg p-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-[#F0F2F4] font-medium text-sm">{test.name}</div>
                    <div className="text-[#6B7280] text-xs mt-1">Req: {test.requirement}</div>
                    <div className="text-[#B4BAC4] text-xs mt-1">Result: {test.result}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    test.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {test.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Drawings */}
          <div>
            <h4 className="text-sm font-semibold text-[#F0F2F4] mb-3 flex items-center gap-2">
              <FileText size={14} className="text-amber-400" />
              Drawing Package
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.drawings.map((dwg, i) => (
                <span key={i} className="px-3 py-1 bg-[#15181C] rounded text-xs text-[#B4BAC4] border border-[#2A2F36]">
                  {dwg}
                </span>
              ))}
            </div>
          </div>

          {/* BOM Summary */}
          <div>
            <h4 className="text-sm font-semibold text-[#F0F2F4] mb-3 flex items-center gap-2">
              <Package size={14} className="text-orange-400" />
              BOM Summary
            </h4>
            <div className="bg-[#15181C] rounded-lg p-3">
              <div className="flex items-center gap-6 mb-3">
                <div>
                  <div className="text-[#6B7280] text-xs">Parts</div>
                  <div className="text-[#F0F2F4] font-bold">{data.bomSummary.partCount}</div>
                </div>
                <div>
                  <div className="text-[#6B7280] text-xs">Total Cost</div>
                  <div className="text-orange-400 font-bold">{data.bomSummary.totalCost}</div>
                </div>
              </div>
              <div className="text-xs text-[#6B7280]">
                Major Items: {data.bomSummary.majorItems.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Cover Page
const CoverPageSection = () => (
  <section id="cover" className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-8 text-center print-avoid-break">
    <div className="max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <BookOpen size={40} className="text-indigo-400" />
      </div>
      <h1 className="text-3xl font-bold text-[#F0F2F4] mb-2">Complete Engineering Design Report</h1>
      <h2 className="text-xl text-indigo-400 mb-6">BAJA SAE 2025 Competition Vehicle</h2>

      <div className="bg-[#15181C] rounded-lg p-6 text-left mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-[#6B7280]">Document ID:</span><span className="text-[#F0F2F4] ml-2">BAJA-2025-CDR-001</span></div>
          <div><span className="text-[#6B7280]">Revision:</span><span className="text-[#F0F2F4] ml-2">Rev B</span></div>
          <div><span className="text-[#6B7280]">Status:</span><span className="text-emerald-400 ml-2">Released</span></div>
          <div><span className="text-[#6B7280]">Date:</span><span className="text-[#F0F2F4] ml-2">February 3, 2025</span></div>
          <div><span className="text-[#6B7280]">Team:</span><span className="text-[#F0F2F4] ml-2">University Racing Team</span></div>
          <div><span className="text-[#6B7280]">Competition:</span><span className="text-[#F0F2F4] ml-2">BAJA SAE Arizona 2025</span></div>
          <div><span className="text-[#6B7280]">Total Pages:</span><span className="text-[#F0F2F4] ml-2">87</span></div>
          <div><span className="text-[#6B7280]">Subsystems:</span><span className="text-[#F0F2F4] ml-2">7</span></div>
        </div>
      </div>

      <div className="text-sm text-[#6B7280]">
        <p className="mb-2">Prepared by: John Martinez, Lead Engineer</p>
        <p>Approved by: Dr. Sarah Kim, Faculty Advisor</p>
      </div>
    </div>
  </section>
);

// Executive Summary
const ExecutiveSummarySection = () => (
  <section id="executive" className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl p-6 print-avoid-break">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
        <Target size={20} className="text-indigo-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#F0F2F4]">1. Executive Summary</h2>
        <p className="text-sm text-[#6B7280]">High-level overview of design intent and outcomes</p>
      </div>
    </div>

    <p className="text-[#B4BAC4] mb-4">
      The BAJA SAE 2025 vehicle represents a complete redesign focused on three primary objectives:
      reduced weight, improved suspension travel, and enhanced driver ergonomics. This 87-page report documents
      the complete engineering design cycle from requirements definition through testing and correlation for all 7 major subsystems.
    </p>

    <div className="grid md:grid-cols-4 gap-4 mb-6">
      <div className="bg-[#15181C] rounded-lg p-4 border border-emerald-500/30">
        <div className="text-2xl font-bold text-emerald-400">423 lbs</div>
        <div className="text-sm text-[#6B7280]">Total Vehicle Weight</div>
        <div className="text-xs text-emerald-400 mt-1">Target: &lt; 450 lbs ✓</div>
      </div>
      <div className="bg-[#15181C] rounded-lg p-4 border border-emerald-500/30">
        <div className="text-2xl font-bold text-emerald-400">12.5"</div>
        <div className="text-sm text-[#6B7280]">Front Suspension Travel</div>
        <div className="text-xs text-emerald-400 mt-1">Target: &gt; 10" ✓</div>
      </div>
      <div className="bg-[#15181C] rounded-lg p-4 border border-emerald-500/30">
        <div className="text-2xl font-bold text-emerald-400">3.8 sec</div>
        <div className="text-sm text-[#6B7280]">Driver Egress Time</div>
        <div className="text-xs text-emerald-400 mt-1">Target: &lt; 5 sec ✓</div>
      </div>
      <div className="bg-[#15181C] rounded-lg p-4 border border-emerald-500/30">
        <div className="text-2xl font-bold text-emerald-400">$11,247</div>
        <div className="text-sm text-[#6B7280]">Total BOM Cost</div>
        <div className="text-xs text-emerald-400 mt-1">Budget: $12,000 ✓</div>
      </div>
    </div>

    <h3 className="text-lg font-semibold text-[#F0F2F4] mb-3">Subsystem Summary</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2A2F36]">
            <th className="text-left py-2 text-[#6B7280]">Subsystem</th>
            <th className="text-left py-2 text-[#6B7280]">Owner</th>
            <th className="text-left py-2 text-[#6B7280]">Weight</th>
            <th className="text-left py-2 text-[#6B7280]">Cost</th>
            <th className="text-left py-2 text-[#6B7280]">Status</th>
          </tr>
        </thead>
        <tbody className="text-[#B4BAC4]">
          {Object.entries(SUBSYSTEM_DATA).map(([key, data]) => (
            <tr key={key} className="border-b border-[#2A2F36]/50">
              <td className="py-2 text-[#F0F2F4]">{data.name}</td>
              <td className="py-2">{data.owner}</td>
              <td className="py-2">{data.weight}</td>
              <td className="py-2">{data.bomSummary.totalCost}</td>
              <td className="py-2"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">{data.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

// Requirements Section
const RequirementsSection = () => (
  <section id="requirements" className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl p-6 print-break">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
        <FileText size={20} className="text-blue-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#F0F2F4]">2. Requirements & Traceability</h2>
        <p className="text-sm text-[#6B7280]">Top-level requirements and verification status</p>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2A2F36]">
            <th className="text-left py-2 text-[#6B7280]">Req ID</th>
            <th className="text-left py-2 text-[#6B7280]">Requirement</th>
            <th className="text-left py-2 text-[#6B7280]">Target</th>
            <th className="text-left py-2 text-[#6B7280]">Actual</th>
            <th className="text-left py-2 text-[#6B7280]">Method</th>
            <th className="text-left py-2 text-[#6B7280]">Status</th>
          </tr>
        </thead>
        <tbody className="text-[#B4BAC4]">
          {[
            { id: 'REQ-001', req: 'Total vehicle weight', target: '< 450 lbs', actual: '423 lbs', method: 'Inspection', status: 'PASS' },
            { id: 'REQ-002', req: 'Ground clearance', target: '> 10 in', actual: '11.5 in', method: 'Inspection', status: 'PASS' },
            { id: 'REQ-003', req: 'Front suspension travel', target: '> 10 in', actual: '12.5 in', method: 'Test', status: 'PASS' },
            { id: 'REQ-004', req: 'Rear suspension travel', target: '> 10 in', actual: '11 in', method: 'Test', status: 'PASS' },
            { id: 'REQ-005', req: 'Frame factor of safety', target: '> 2.0', actual: '2.0 min', method: 'Analysis', status: 'PASS' },
            { id: 'REQ-006', req: 'Driver egress time', target: '< 5 sec', actual: '3.8 sec', method: 'Test', status: 'PASS' },
            { id: 'REQ-007', req: 'Brake lock-up (all wheels)', target: 'Yes', actual: 'Yes @ 0.85g', method: 'Test', status: 'PASS' },
            { id: 'REQ-008', req: 'Top speed', target: '> 35 mph', actual: '38 mph', method: 'Test', status: 'PASS' },
            { id: 'REQ-009', req: 'Endurance (4 hr run)', target: 'No failures', actual: 'Completed', method: 'Test', status: 'PASS' },
            { id: 'REQ-010', req: 'Budget', target: '< $12,000', actual: '$11,247', method: 'Inspection', status: 'PASS' },
          ].map((r, i) => (
            <tr key={i} className="border-b border-[#2A2F36]/50">
              <td className="py-2 font-mono text-xs">{r.id}</td>
              <td className="py-2">{r.req}</td>
              <td className="py-2">{r.target}</td>
              <td className="py-2 text-[#F0F2F4]">{r.actual}</td>
              <td className="py-2">{r.method}</td>
              <td className="py-2"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

// Subsystems Section
const SubsystemsSection = () => (
  <section id="subsystems" className="print-break">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
        <Layers size={20} className="text-purple-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#F0F2F4]">3. Detailed Subsystem Documentation</h2>
        <p className="text-sm text-[#6B7280]">Specifications, analysis, and test results for each subsystem</p>
      </div>
    </div>

    {Object.entries(SUBSYSTEM_DATA).map(([key, data]) => (
      <SubsystemDetailSection key={key} subsystem={key} data={data} />
    ))}
  </section>
);

// Safety Section
const SafetySection = () => (
  <section id="safety" className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl p-6 print-break">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
        <Shield size={20} className="text-red-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#F0F2F4]">4. Safety</h2>
        <p className="text-sm text-[#6B7280]">Safety compliance and hazard mitigation</p>
      </div>
    </div>

    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <Check size={24} className="text-emerald-400" />
        <div>
          <div className="font-medium text-[#F0F2F4]">Safety Gate: APPROVED</div>
          <div className="text-sm text-[#6B7280]">All safety requirements verified by faculty advisor on Jan 28, 2025</div>
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold text-[#F0F2F4] mb-3">Safety Features</h3>
        <ul className="space-y-2 text-[#B4BAC4] text-sm">
          {[
            'Roll cage exceeds SAE requirements by 15%',
            '5-point harness with SFI 16.1 rating',
            'Fire extinguisher within driver reach',
            'Kill switch accessible from both sides',
            'Scatter shields on rotating components',
            'Collapsible steering column',
            'Dual-circuit brake system',
            'Arm restraints installed'
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check size={16} className="text-emerald-400 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[#F0F2F4] mb-3">Hazard Mitigations</h3>
        <ul className="space-y-2 text-[#B4BAC4] text-sm">
          {[
            'Sharp edges removed or guarded',
            'Fuel system meets SAE requirements',
            'Engine exhaust routed away from driver',
            'Battery secured and covered',
            'All fasteners safety-wired where required',
            'Throttle return springs (dual)',
            'Master cylinder reservoirs covered',
            'Firewall between engine and driver'
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check size={16} className="text-emerald-400 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

// BOM Summary Section
const BOMSummarySection = () => (
  <section id="bom" className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl p-6 print-break">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
        <Package size={20} className="text-orange-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#F0F2F4]">5. BOM & Cost Summary</h2>
        <p className="text-sm text-[#6B7280]">Complete bill of materials breakdown</p>
      </div>
    </div>

    <div className="grid md:grid-cols-4 gap-4 mb-6">
      <div className="bg-[#15181C] rounded-lg p-4 border border-[#2A2F36]">
        <div className="text-2xl font-bold text-orange-400">$11,247</div>
        <div className="text-sm text-[#6B7280]">Total BOM Cost</div>
      </div>
      <div className="bg-[#15181C] rounded-lg p-4 border border-[#2A2F36]">
        <div className="text-2xl font-bold text-[#F0F2F4]">281</div>
        <div className="text-sm text-[#6B7280]">Total Parts</div>
      </div>
      <div className="bg-[#15181C] rounded-lg p-4 border border-[#2A2F36]">
        <div className="text-2xl font-bold text-[#F0F2F4]">89</div>
        <div className="text-sm text-[#6B7280]">Custom Fabricated</div>
      </div>
      <div className="bg-[#15181C] rounded-lg p-4 border border-emerald-500/30">
        <div className="text-2xl font-bold text-emerald-400">$753</div>
        <div className="text-sm text-[#6B7280]">Under Budget</div>
      </div>
    </div>

    <h3 className="text-lg font-semibold text-[#F0F2F4] mb-3">Cost by Subsystem</h3>
    <div className="space-y-2">
      {Object.entries(SUBSYSTEM_DATA).map(([key, data]) => {
        const cost = parseInt(data.bomSummary.totalCost.replace(/[$,]/g, ''));
        const pct = ((cost / 11247) * 100).toFixed(0);
        return (
          <div key={key} className="bg-[#15181C] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#F0F2F4]">{data.name}</span>
              <span className="text-orange-400 font-medium">{data.bomSummary.totalCost}</span>
            </div>
            <div className="w-full h-2 bg-[#2A2F36] rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-[#6B7280] mt-1">{pct}% of total</div>
          </div>
        );
      })}
    </div>
  </section>
);

// Appendices Section
const AppendicesSection = () => (
  <section id="appendices" className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl p-6 print-break">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
        <Paperclip size={20} className="text-violet-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#F0F2F4]">6. Appendices</h2>
        <p className="text-sm text-[#6B7280]">Supporting documentation</p>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      {[
        { name: 'A. Requirements Traceability Matrix', pages: '12 pages' },
        { name: 'B. Complete FEA Results Package', pages: '24 pages' },
        { name: 'C. DOE Study Results (CVT Tuning)', pages: '8 pages' },
        { name: 'D. Test Procedures & Raw Data', pages: '18 pages' },
        { name: 'E. Drawing Package (45 drawings)', pages: '45 pages' },
        { name: 'F. Change History Log', pages: '6 pages' },
        { name: 'G. Weight Tracking Spreadsheet', pages: '4 pages' },
        { name: 'H. Supplier Quotes & POs', pages: '15 pages' }
      ].map((appendix, i) => (
        <div key={i} className="flex items-center justify-between bg-[#15181C] rounded-lg p-3 border border-[#2A2F36]">
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-violet-400" />
            <span className="text-[#B4BAC4]">{appendix.name}</span>
          </div>
          <span className="text-xs text-[#6B7280]">{appendix.pages}</span>
        </div>
      ))}
    </div>
  </section>
);

// Report sections config
const REPORT_SECTIONS = [
  { id: 'cover', name: 'Cover Page', icon: BookOpen },
  { id: 'executive', name: 'Executive Summary', icon: Target },
  { id: 'requirements', name: 'Requirements', icon: FileText },
  { id: 'subsystems', name: 'Subsystem Details', icon: Layers },
  { id: 'safety', name: 'Safety', icon: Shield },
  { id: 'bom', name: 'BOM & Cost', icon: Package },
  { id: 'appendices', name: 'Appendices', icon: Paperclip }
];

// ============================================================================
// Main Component
// ============================================================================

const Baja2025DesignReport = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('cover');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [navExpanded, setNavExpanded] = useState(true);
  const reportRef = useRef(null);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Add print styles and trigger print dialog for PDF save
    const styleSheet = document.createElement('style');
    styleSheet.textContent = printStyles;
    document.head.appendChild(styleSheet);

    window.print();

    // Clean up
    setTimeout(() => {
      document.head.removeChild(styleSheet);
    }, 1000);
  };

  // Fullscreen Modal
  const FullscreenModal = () => (
    <div className="fixed inset-0 z-50 bg-[#0F1114] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[#15181C] border-b border-[#2A2F36] px-6 py-4 flex items-center justify-between no-print">
        <h1 className="text-xl font-bold text-[#F0F2F4]">BAJA 2025 - Complete Engineering Design Report</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={() => setShowFullscreen(false)}
            className="p-2 text-[#6B7280] hover:text-[#F0F2F4] hover:bg-[#1C1F24] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto py-8 px-6 space-y-8">
        <CoverPageSection />
        <ExecutiveSummarySection />
        <RequirementsSection />
        <SubsystemsSection />
        <SafetySection />
        <BOMSummarySection />
        <AppendicesSection />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <style>{printStyles}</style>
      <Header />

      {showFullscreen && <FullscreenModal />}

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto no-print">
        {/* Back Navigation */}
        <button
          onClick={() => navigate('/reporting')}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#F0F2F4] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Reports
        </button>

        {/* Report Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">
                Complete Design Report
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                Published
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#F0F2F4]">BAJA 2025 - Complete Engineering Design Report</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-[#6B7280]">
              <span className="flex items-center gap-1"><Calendar size={14} />Feb 3, 2025</span>
              <span className="flex items-center gap-1"><User size={14} />John Martinez</span>
              <span className="flex items-center gap-1"><FileText size={14} />87 pages</span>
              <span className="flex items-center gap-1"><Eye size={14} />234 views</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFullscreen(true)}
              className="flex items-center gap-2 px-3 py-2 text-[#6B7280] hover:text-[#F0F2F4] hover:bg-[#1C1F24] rounded-lg transition-colors"
              title="View Fullscreen"
            >
              <Maximize2 size={18} />
              Fullscreen
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-[#6B7280] hover:text-[#F0F2F4] hover:bg-[#1C1F24] rounded-lg transition-colors"
              title="Print"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-12 lg:col-span-3">
            <SectionNav
              sections={REPORT_SECTIONS}
              activeSection={activeSection}
              onSectionClick={scrollToSection}
              expanded={navExpanded}
              onToggleExpand={() => setNavExpanded(!navExpanded)}
            />
          </div>

          {/* Report Content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            <CoverPageSection />
            <ExecutiveSummarySection />
            <RequirementsSection />
            <SubsystemsSection />
            <SafetySection />
            <BOMSummarySection />
            <AppendicesSection />
          </div>
        </div>
      </main>

      {/* Print-only content */}
      <div className="hidden print:block">
        <CoverPageSection />
        <ExecutiveSummarySection />
        <RequirementsSection />
        <SubsystemsSection />
        <SafetySection />
        <BOMSummarySection />
        <AppendicesSection />
      </div>
    </div>
  );
};

export default Baja2025DesignReport;
