import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../Header';
import SOPExecutionMode from './SOPExecutionMode';
import {
  ClipboardList,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Wrench,
  Factory,
  TestTube,
  Settings,
  Eye,
  AlertCircle,
  Download,
  Edit,
  Send,
  Check,
  Shield,
  Link as LinkIcon,
  Plus,
  Trash2,
  GripVertical,
  Camera,
  Ruler,
  FileCheck,
  PenTool,
  ListChecks,
  Globe,
  Building2,
  FolderOpen,
  FileCode,
  Warehouse,
  Image,
  ImagePlus,
  ChefHat,
  Tag,
  Package,
  Play,
  BookOpen
} from 'lucide-react';
import { getSOPById } from '../../data/demoSOPs';

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// SOP Type configurations
const SOP_TYPES = {
  manufacturing: { label: 'Manufacturing SOP', icon: Factory, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  assembly: { label: 'Assembly SOP', icon: Settings, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  test_execution: { label: 'Test Execution SOP', icon: TestTube, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  service: { label: 'Service SOP', icon: Wrench, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  inspection: { label: 'Inspection SOP', icon: Eye, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  rework_containment: { label: 'Rework/Containment SOP', icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  cooking: { label: 'Cooking SOP', icon: ChefHat, color: 'text-orange-400', bgColor: 'bg-orange-500/10' }
};

// SOP Scope configurations
const SOP_SCOPES = {
  global: { label: 'Global Process', icon: Globe, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  org: { label: 'Organization', icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  project: { label: 'Project', icon: FolderOpen, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  node: { label: 'Node', icon: FileCode, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  node_revision: { label: 'Node Revision', icon: FileCode, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  asset_site: { label: 'Asset/Site', icon: Warehouse, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' }
};

// Status configurations
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400 border-slate-500/40', icon: FileText },
  in_review: { label: 'In Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400 border-green-500/40', icon: CheckCircle },
  obsolete: { label: 'Obsolete', color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: XCircle }
};

// Evidence type icons
const EVIDENCE_ICONS = {
  photo: Camera,
  measurement: Ruler,
  log: FileCheck,
  signature: PenTool,
  checklist: ListChecks,
  none: null
};

function SOPDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sop, setSOP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  // Execution mode: 'view' or 'execute' - default to execute on mobile
  const [mode, setMode] = useState(null);

  // Set default mode based on screen size once SOP is loaded
  useEffect(() => {
    if (sop && mode === null) {
      setMode(isMobile ? 'execute' : 'view');
    }
  }, [sop, isMobile, mode]);

  useEffect(() => {
    fetchSOP();
  }, [id]);

  const fetchSOP = async () => {
    try {
      setLoading(true);
      // In production, fetch from API
      // const response = await fetch(`${API_URL}/api/sops/${id}`);
      // const data = await response.json();
      // setSOP(data);

      // Demo data for Alpha - use helper function
      setTimeout(() => {
        const foundSOP = getSOPById(id);
        setSOP(foundSOP);
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error fetching SOP:', error);
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    // In production: POST /api/sops/:id/submit-review
    alert('SOP submitted for review (demo)');
  };

  const handleApprove = async () => {
    // In production: POST /api/sops/:id/approve
    alert('SOP approval requires org_admin or approver role (demo)');
  };

  const handleExportPDF = () => {
    alert(`Exporting PDF with ${sop.status !== 'approved' ? 'DRAFT watermark' : 'no watermark'} (demo)`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1114]">
        <Header />
        <main className="max-w-5xl mx-auto px-6 pt-24 pb-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#2A2F36] border-t-blue-500 mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading SOP...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="min-h-screen bg-[#0F1114]">
        <Header />
        <main className="max-w-5xl mx-auto px-6 pt-24 pb-8">
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-[#6B7280]">SOP not found</p>
            <button
              onClick={() => navigate('/sops')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
            >
              Back to SOPs
            </button>
          </div>
        </main>
      </div>
    );
  }

  const typeConfig = SOP_TYPES[sop.sop_type];
  const statusConfig = STATUS_CONFIG[sop.status];
  const scopeConfig = SOP_SCOPES[sop.sop_scope_type];
  const TypeIcon = typeConfig?.icon || FileText;
  const StatusIcon = statusConfig?.icon || FileText;
  const ScopeIcon = scopeConfig?.icon || FileText;

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-8">
        {/* Back Link */}
        <button
          onClick={() => navigate('/sops')}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#B4BAC4] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to SOPs
        </button>

        {/* Alpha Feature Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-300 font-medium">
                ALPHA FEATURE: SOP enforcement is configurable. SOPs may not block release unless enabled by organization gate settings.
              </p>
              <p className="text-xs text-amber-400/70 mt-1">
                Executable procedures tied to node revisions and evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${typeConfig?.bgColor || 'bg-gray-500/10'}`}>
                <TypeIcon className={`w-6 h-6 ${typeConfig?.color || 'text-gray-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-blue-400">{sop.global_artifact_id}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${statusConfig?.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig?.label}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-[#F0F2F4] mb-1">{sop.title}</h1>
                <p className="text-sm text-[#6B7280]">{typeConfig?.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode Toggle */}
              <div className="flex items-center bg-[#1C1F24] rounded-lg border border-[#2A2F36] p-1">
                <button
                  onClick={() => setMode('view')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    mode === 'view'
                      ? 'bg-blue-600 text-white'
                      : 'text-[#6B7280] hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => setMode('execute')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    mode === 'execute'
                      ? 'bg-green-600 text-white'
                      : 'text-[#6B7280] hover:text-white'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  Execute
                </button>
              </div>
              {sop.status === 'draft' && (
                <button
                  onClick={handleSubmitForReview}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Submit for Review
                </button>
              )}
              {sop.status === 'in_review' && (
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
              )}
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] hover:border-[#363C44] text-[#B4BAC4] rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF {sop.status !== 'approved' && '(DRAFT)'}
              </button>
            </div>
          </div>

          {/* Scope Information */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <ScopeIcon className={`w-4 h-4 ${scopeConfig?.color || 'text-gray-400'}`} />
              <span className="text-[#6B7280]">Scope:</span>
              <span className={`px-2 py-0.5 rounded text-xs ${scopeConfig?.bgColor} ${scopeConfig?.color}`}>
                {scopeConfig?.label || sop.sop_scope_type}
              </span>
            </div>
            {sop.project_name && (
              <>
                <span className="text-[#6B7280]">|</span>
                <span className="text-[#6B7280]">Project:</span>
                <span className="text-[#B4BAC4]">{sop.project_name}</span>
              </>
            )}
            {sop.org_name && !sop.project_name && (
              <>
                <span className="text-[#6B7280]">|</span>
                <span className="text-[#6B7280]">Organization:</span>
                <span className="text-[#B4BAC4]">{sop.org_name}</span>
              </>
            )}
            {sop.node_name && (
              <>
                <span className="text-[#6B7280]">|</span>
                <span className="text-[#6B7280]">Node:</span>
                <Link to={`/design/project/${sop.project_id}/node/${sop.node_id}`} className="text-blue-400 hover:text-blue-300">
                  {sop.node_name}
                </Link>
                {sop.node_revision && (
                  <span className="text-xs font-mono text-[#6B7280]">(Rev {sop.node_revision})</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Conditional: Execute Mode vs View Mode */}
        {mode === 'execute' ? (
          <SOPExecutionMode sop={sop} onExit={() => setMode('view')} />
        ) : (
          <>
        {/* Purpose */}
        <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Purpose</h2>
          <p className="text-[#B4BAC4] text-sm leading-relaxed">{sop.purpose}</p>

          {/* Tags (if present) */}
          {sop.tags && sop.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#2A2F36]">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-[#6B7280]" />
                {sop.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-[#1C1F24] text-xs text-[#B4BAC4] rounded-full border border-[#2A2F36]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Yield & Allergens (for cooking SOPs or any SOP with these fields) */}
        {(sop.yield_info || sop.allergens) && (
          <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sop.yield_info && (
                <div>
                  <h3 className="text-sm font-semibold text-[#F0F2F4] mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-400" />
                    Yield
                  </h3>
                  <p className="text-[#B4BAC4] text-sm">{sop.yield_info}</p>
                </div>
              )}
              {sop.allergens && sop.allergens.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#F0F2F4] mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Allergens
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sop.allergens.map((allergen, idx) => (
                      <span key={idx} className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded border border-amber-500/30">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Preconditions */}
        <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Preconditions</h2>
          <ul className="space-y-2">
            {sop.preconditions.map((pre, idx) => (
              <li key={pre.id} className="flex items-start gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[#B4BAC4]">{pre.description}</span>
                  {pre.verification_method && (
                    <span className="text-xs text-[#6B7280] ml-2">({pre.verification_method})</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Required Tools */}
        <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Required Tools</h2>
          <ul className="space-y-2">
            {sop.required_tools.map(tool => (
              <li key={tool.id} className="flex items-center gap-3 text-sm">
                <Wrench className="w-4 h-4 text-[#6B7280]" />
                <span className="text-[#F0F2F4] font-medium">{tool.tool_name}</span>
                <span className="text-[#6B7280]">-</span>
                <span className="text-[#B4BAC4]">{tool.specification}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Required Parts/Ingredients (if present) */}
        {sop.required_parts && sop.required_parts.length > 0 && (
          <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">
              {sop.sop_type === 'cooking' ? 'Ingredients' : 'Required Parts'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2F36]">
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#6B7280] uppercase">Quantity</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#6B7280] uppercase">Description</th>
                    {sop.sop_type !== 'cooking' && (
                      <th className="text-left px-3 py-2 text-xs font-medium text-[#6B7280] uppercase">Part Number</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2F36]">
                  {sop.required_parts.map(part => (
                    <tr key={part.id} className="hover:bg-[#1C1F24]">
                      <td className="px-3 py-2 text-sm font-medium text-[#F0F2F4]">{part.quantity}</td>
                      <td className="px-3 py-2 text-sm text-[#B4BAC4]">{part.description}</td>
                      {sop.sop_type !== 'cooking' && (
                        <td className="px-3 py-2 text-xs font-mono text-blue-400">{part.part_number}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Safety Warnings */}
        <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Safety Warnings</h2>
          <div className="space-y-3">
            {sop.safety_warnings.map(warning => (
              <div
                key={warning.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  warning.level === 'high' ? 'bg-red-500/10 border-red-500/30' :
                  warning.level === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                  warning.level === 'high' ? 'text-red-400' :
                  warning.level === 'medium' ? 'text-amber-400' :
                  'text-blue-400'
                }`} />
                <div>
                  <span className={`text-xs font-semibold uppercase ${
                    warning.level === 'high' ? 'text-red-400' :
                    warning.level === 'medium' ? 'text-amber-400' :
                    'text-blue-400'
                  }`}>[{warning.level}]</span>
                  <p className="text-sm text-[#B4BAC4] mt-1">{warning.warning_text}</p>
                  {warning.ppe_required.length > 0 && (
                    <p className="text-xs text-[#6B7280] mt-1">PPE: {warning.ppe_required.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Procedure Steps */}
        <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#F0F2F4] mb-4">Procedure Steps</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2F36]">
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#6B7280] uppercase w-12">#</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-[#6B7280] uppercase w-20">Image</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#6B7280] uppercase">Instruction</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-[#6B7280] uppercase w-20">Verify</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-[#6B7280] uppercase w-24">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2F36]">
                {sop.steps.map(step => {
                  const EvidenceIcon = EVIDENCE_ICONS[step.evidence_required];
                  return (
                    <tr key={step.id} className="hover:bg-[#1C1F24]">
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                          {step.step_number}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {step.step_image_url ? (
                          <button
                            onClick={() => window.open(step.step_image_url, '_blank')}
                            className="w-12 h-12 rounded-lg bg-[#1C1F24] border border-[#2A2F36] hover:border-blue-500/50 flex items-center justify-center transition-colors overflow-hidden"
                            title={step.step_image_alt_text || `Step ${step.step_number} image`}
                          >
                            <Image className="w-5 h-5 text-blue-400" />
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#1C1F24] border border-[#2A2F36] border-dashed flex items-center justify-center opacity-50">
                            <ImagePlus className="w-4 h-4 text-[#4B5563]" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#B4BAC4]">{step.instruction}</td>
                      <td className="px-3 py-3 text-center">
                        {step.verification_required && (
                          <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {EvidenceIcon && (
                          <div className="flex items-center justify-center gap-1">
                            <EvidenceIcon className="w-4 h-4 text-[#6B7280]" />
                            <span className="text-xs text-[#6B7280] capitalize">{step.evidence_required}</span>
                          </div>
                        )}
                        {step.evidence_required === 'none' && (
                          <span className="text-xs text-[#4B5563]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#4B5563] mt-3">
            Step images provide visual guidance. Click to expand. Images stored via presigned URLs with tenant isolation.
          </p>
        </section>

        {/* Acceptance Criteria */}
        <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Acceptance Criteria</h2>
          <ul className="space-y-2">
            {sop.acceptance_criteria.map(acc => (
              <li key={acc.id} className="flex items-start gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[#B4BAC4]">{acc.criterion}</span>
                  {acc.requirement_id && (
                    <span className="text-xs text-blue-400 ml-2">({acc.requirement_id})</span>
                  )}
                  <span className="text-xs text-[#6B7280] block mt-0.5">Verification: {acc.verification}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Common Failures (if present) */}
        {sop.common_failures && sop.common_failures.length > 0 && (
          <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Common Failures & Troubleshooting</h2>
            <div className="space-y-3">
              {sop.common_failures.map(failure => (
                <div key={failure.id} className="p-3 bg-[#1C1F24] rounded-lg border border-[#2A2F36]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-amber-400">{failure.failure_mode}</span>
                      <p className="text-xs text-[#6B7280] mt-1"><strong>Cause:</strong> {failure.cause}</p>
                      <p className="text-xs text-green-400 mt-1"><strong>Remedy:</strong> {failure.remedy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Evidence to Capture */}
        {sop.evidence_to_capture && sop.evidence_to_capture.length > 0 && (
          <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Records & Evidence to Capture</h2>
            <ul className="space-y-2">
              {sop.evidence_to_capture.map(ev => {
                const EvIcon = EVIDENCE_ICONS[ev.type] || FileCheck;
                return (
                  <li key={ev.id} className="flex items-center gap-3 text-sm">
                    <EvIcon className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-[#B4BAC4]">{ev.description}</span>
                    {ev.mandatory && (
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">Required</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Notes (if present) */}
        {sop.notes && (
          <section className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-blue-400 mb-1">Note</h2>
                <p className="text-sm text-[#B4BAC4]">{sop.notes}</p>
              </div>
            </div>
          </section>
        )}

        {/* Operational Notes (if present) */}
        {sop.operational_notes && sop.operational_notes.length > 0 && (
          <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Operational Notes</h2>
            <ul className="space-y-2">
              {sop.operational_notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-[#6B7280]">•</span>
                  <span className="text-[#B4BAC4]">{note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Use Cases (if present) */}
        {sop.use_cases && sop.use_cases.length > 0 && (
          <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Use Cases</h2>
            <div className="flex flex-wrap gap-2">
              {sop.use_cases.map((useCase, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-green-500/10 text-green-400 text-sm rounded-lg border border-green-500/30">
                  {useCase}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Linked Artifacts */}
        <section className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#F0F2F4] mb-3">Linked Artifacts</h2>
          <div className="space-y-2">
            {sop.linked_artifacts.map(link => (
              <div key={link.id} className="flex items-center gap-3 p-3 bg-[#1C1F24] rounded-lg">
                <LinkIcon className="w-4 h-4 text-blue-400" />
                <div className="flex-1">
                  <span className="text-sm text-[#F0F2F4]">{link.artifact_name}</span>
                  <span className="text-xs text-[#6B7280] ml-2">({link.link_purpose})</span>
                </div>
                <span className="text-xs px-2 py-1 bg-[#2A2F36] text-[#6B7280] rounded capitalize">
                  {link.artifact_type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Metadata Footer */}
        <div className="text-xs text-[#6B7280] flex items-center gap-4 flex-wrap">
          {sop.revision && (
            <>
              <span className="font-mono">Rev {sop.revision}</span>
              <span>|</span>
            </>
          )}
          {sop.effective_date && (
            <>
              <span>Effective: {sop.effective_date}</span>
              <span>|</span>
            </>
          )}
          <span>Created by {sop.created_by_name}</span>
          <span>|</span>
          <span>Created: {new Date(sop.created_at).toLocaleDateString()}</span>
          <span>|</span>
          <span>Updated: {new Date(sop.updated_at).toLocaleDateString()}</span>
          {sop.slug && (
            <>
              <span>|</span>
              <span className="font-mono text-blue-400">/{sop.slug}</span>
            </>
          )}
        </div>
          </>
        )}
      </main>
    </div>
  );
}

export default SOPDetailPage;
