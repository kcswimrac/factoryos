import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import {
  ChevronLeft, ChevronRight, Save, Check, Circle,
  MessageSquare, Lightbulb, FileText, Link2, Plus,
  FlaskConical, ClipboardCheck, Upload, X, AlertTriangle,
  GitBranch, Image, Package, Folder, Wrench, Paperclip,
  Globe, Factory, Settings, BookOpen, Ruler
} from 'lucide-react';

// Import new 7-phase configuration and components
import {
  DESIGN_PHASES,
  RIGOR_TIERS,
  GATE_TYPES,
  DOMAIN_LENSES,
  SPECIFICATION_LEVELS,
  getPhaseKey,
  calculateAIScore
} from './config/designPhases';

import {
  AIScorePanel,
  RigorTierBadge,
  RigorTierSelector,
  RequirementsManager,
  GateApprovalPanel,
  PhaseNavigator,
  RevisionTimeline,
  InterfaceControlPanel,
  ProjectTreeView,
  DomainLensSelector,
  ServiceabilityPanel,
  ManufacturabilityPanel,
  InnovationTracker,
  ReportGeneratorWizard,
  NotebookPanel,
  SpecificationsPanel,
  NodeWorkbenchPanel,
  PhaseDrawer
} from './components/design-cycle';

import CADLinkUploadModal from './components/design-cycle/CADLinkUploadModal';

import { getProjectById } from './data/demoProjects';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// AI Suggestions per phase (updated for 7-phase with sub-phases)
const AI_SUGGESTIONS = {
  '1': [
    { text: 'Ensure all requirements have unique IDs (REQ-XXX-NNN format) for traceability.', type: 'tip' },
    { text: 'Consider adding thermal performance requirements for high-temperature scenarios.', type: 'tip' },
    { text: 'Review industry standards (SAE J2530) for brake caliper specifications.', type: 'tip' }
  ],
  '2': [
    { text: 'Search the correlation factors library for applicable historical data.', type: 'integration', tool: 'knowledge' },
    { text: 'Consider running a DOE experiment to compare design alternatives.', type: 'integration', tool: 'doe' },
    { text: 'Document key technical risks with mitigations in the risk register.', type: 'tip' }
  ],
  '3a': [
    { text: 'Complete the Interface Control Document (ICD) with adjacent node approvals.', type: 'tip' },
    { text: 'Based on your requirements, consider adding a tolerance stackup analysis.', type: 'tip' },
    { text: 'Map each design feature back to a requirement for traceability.', type: 'tip' }
  ],
  '3b': [
    { text: 'Document wear items with expected life and replacement time.', type: 'tip' },
    { text: 'Verify single-person service capability for routine maintenance.', type: 'tip' }
  ],
  '3c': [
    { text: 'Complete DFM review with manufacturing team and sign the report.', type: 'tip' },
    { text: 'Document critical dimensions with inspection methods for QC plan.', type: 'tip' },
    { text: 'Verify cost estimate is within target before gate approval.', type: 'tip' }
  ],
  '4': [
    { text: 'All load cases must have documented source/basis and link to requirements.', type: 'tip' },
    { text: 'Document "what if wrong?" risk assessment for all assumptions.', type: 'tip' },
    { text: 'Connect to DOE Platform to design a data collection experiment.', type: 'integration', tool: 'doe' }
  ],
  '5': [
    { text: 'Every requirement with verification method "Analysis" needs an analysis check.', type: 'tip' },
    { text: 'Calculate margins of safety for all critical checks.', type: 'tip' },
    { text: 'Verify trace coverage meets tier threshold before proceeding.', type: 'tip' }
  ],
  '6': [
    { text: 'Every requirement with verification method "Test" needs a test case.', type: 'tip' },
    { text: 'Create a test matrix in DOE Platform for systematic validation.', type: 'integration', tool: 'doe' },
    { text: 'If failures occur, create a Quality 8D report to track root cause.', type: 'integration', tool: 'quality' }
  ],
  '7': [
    { text: 'Document predicted vs actual values for each correlation parameter.', type: 'tip' },
    { text: 'Promote correlation factors to knowledge base for Tier 3 projects.', type: 'integration', tool: 'knowledge' },
    { text: 'Link lessons learned to trigger a Phase 1 revision if needed.', type: 'tip' }
  ]
};

function DesignCycleWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activePhase, setActivePhase] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('questions'); // questions, requirements, interfaces, gates, structure, serviceability, manufacturability, innovation
  const [fullProjectData, setFullProjectData] = useState(null); // Full hierarchy data from demoProjects
  const [selectedNode, setSelectedNode] = useState(null); // Currently selected node in tree
  const [serviceabilityData, setServiceabilityData] = useState({}); // Phase 3b data
  const [manufacturabilityData, setManufacturabilityData] = useState({}); // Phase 3c data
  const [innovations, setInnovations] = useState([]); // Innovation tracking
  const [showReportWizard, setShowReportWizard] = useState(false); // Report generation modal
  const [reportTargetNode, setReportTargetNode] = useState(null); // Node to generate report for
  const [showCadModal, setShowCadModal] = useState(false); // CAD link/upload modal
  const [cadModalMode, setCadModalMode] = useState('upload'); // 'link' or 'upload'
  const [cadTargetNode, setCadTargetNode] = useState(null); // Node to add CAD to
  const [showPhaseDrawer, setShowPhaseDrawer] = useState(false); // Phase drawer visibility

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/design/${id}`);
        const data = await response.json();

        if (data.success) {
          // Transform API data to match new 7-phase format
          const projectData = transformProjectData(data.data);
          setProject(projectData);
          // Set active phase to first incomplete phase or Phase 1
          const firstIncomplete = projectData.phases.find(p => p.status !== 'completed');
          setActivePhase(firstIncomplete || projectData.phases[0]);
        } else {
          // Load demo data for development
          const demoProject = createDemoProject();
          setProject(demoProject);
          setActivePhase(demoProject.phases[0]);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        // Load demo data for development
        const demoProject = createDemoProject();
        setProject(demoProject);
        setActivePhase(demoProject.phases[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();

    // Also load full project data with hierarchy from demoProjects
    const fullData = getProjectById(id);
    if (fullData) {
      setFullProjectData(fullData);
      // Set initial selected node to root
      if (fullData.root_node) {
        setSelectedNode(fullData.root_node);
      }
    }
  }, [id]);

  // Handle node selection from tree
  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    setActiveTab('questions'); // Reset to questions tab when selecting new node
  };

  // Handle report generation request
  const handleGenerateReport = (node) => {
    setReportTargetNode(node || selectedNode);
    setShowReportWizard(true);
  };

  // Handle actual report generation from wizard
  const handleReportGenerate = async (reportConfig) => {
    console.log('Generating report with config:', reportConfig);
    // TODO: Call API to generate report
    // For now, simulate generation and download
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`Report generated successfully!\n\nType: ${reportConfig.report_type}\nFormat: ${reportConfig.report_format}\nScope: ${reportConfig.node_id ? 'Node' : 'Project'}`);
    setShowReportWizard(false);
  };

  // Handle Link CAD request
  const handleLinkCad = (node) => {
    setCadTargetNode(node || selectedNode);
    setCadModalMode('link');
    setShowCadModal(true);
  };

  // Handle Upload CAD request
  const handleUploadCad = (node) => {
    setCadTargetNode(node || selectedNode);
    setCadModalMode('upload');
    setShowCadModal(true);
  };

  // Handle CAD save from modal
  const handleCadSave = (node, cadAttachment) => {
    console.log('Adding CAD attachment to node:', node?.part_number, cadAttachment);
    // TODO: Call API to save CAD attachment
    // For now, update local state
    if (fullProjectData && node) {
      // Deep clone and update the project data
      const updateNodeAttachments = (rootNode) => {
        if (rootNode.id === node.id || rootNode.part_number === node.part_number) {
          return {
            ...rootNode,
            attachments: [...(rootNode.attachments || []), cadAttachment]
          };
        }
        if (rootNode.children) {
          return {
            ...rootNode,
            children: rootNode.children.map(child => updateNodeAttachments(child))
          };
        }
        return rootNode;
      };

      const updatedProject = {
        ...fullProjectData,
        root_node: updateNodeAttachments(fullProjectData.root_node)
      };
      setFullProjectData(updatedProject);

      // Update selected node if it's the one we just updated
      if (selectedNode && (selectedNode.id === node.id || selectedNode.part_number === node.part_number)) {
        setSelectedNode({
          ...selectedNode,
          attachments: [...(selectedNode.attachments || []), cadAttachment]
        });
      }
    }
    setShowCadModal(false);
  };

  // Get node-specific phase data (use node's phase or default to project phase)
  const getNodePhaseData = () => {
    if (!selectedNode) return null;
    const nodePhase = selectedNode.phase || 1;
    return {
      phase: nodePhase,
      phaseStatus: selectedNode.phase_status || 'in_progress',
      aiScore: selectedNode.ai_score || 0,
      revision: selectedNode.revision || 'A',
      attachments: selectedNode.attachments || []
    };
  };

  const nodePhaseData = getNodePhaseData();

  // Transform old API data to new 7-phase format
  const transformProjectData = (apiData) => {
    return {
      ...apiData,
      rigorTier: apiData.rigor_tier || 2,
      requirements: apiData.requirements || [],
      gates: apiData.gates || {},
      interfaces: apiData.interfaces || {},
      adjacentNodes: apiData.adjacent_nodes || [],
      revisions: apiData.revisions || [],
      currentRevisionId: apiData.current_revision_id,
      phases: DESIGN_PHASES.map(phaseConfig => {
        const apiPhase = apiData.phases?.find(p =>
          p.phase_number === phaseConfig.number &&
          (p.sub_phase || null) === phaseConfig.subPhase
        );

        return {
          ...phaseConfig,
          status: apiPhase?.status || 'pending',
          progress: apiPhase?.progress_percentage || 0,
          qualityScore: apiPhase?.quality_score || 1.0,
          notes: apiPhase?.notes || '',
          documents: apiPhase?.documents || [],
          answers: phaseConfig.questions.map((q, idx) => ({
            key: q.key,
            question: q.text,
            type: q.type,
            required: q.required,
            status: apiPhase?.questions?.[idx]?.answer_status || 'unanswered',
            notes: apiPhase?.questions?.[idx]?.answer_notes || ''
          }))
        };
      })
    };
  };

  // Create demo project with 7-phase structure
  const createDemoProject = () => {
    return {
      id: 1,
      project_number: 'PRJ-2024-001',
      name: 'Brake Caliper Assembly Redesign',
      description: 'Redesign front brake caliper for improved thermal performance',
      hierarchy_level: 'system',
      status: 'active',
      rigorTier: 2,
      domainLens: 'vehicle',
      specificationLevel: 'system',
      requirements: [
        { id: 'REQ-BRK-001', title: 'Max operating temperature', description: 'Component shall withstand 400°C operating temperature', verificationMethod: 'test', status: 'active', acceptanceCriteria: 'No deformation at 400°C for 30 minutes', traces: [] },
        { id: 'REQ-BRK-002', title: 'Braking force capacity', description: 'Caliper shall provide 15kN clamping force', verificationMethod: 'analysis', status: 'verified', acceptanceCriteria: '15kN ± 5%', traces: [{ type: 'analysis', id: 'ANA-001' }] },
        { id: 'REQ-BRK-003', title: 'Weight target', description: 'Assembly weight shall not exceed 2.5kg', verificationMethod: 'inspection', status: 'active', acceptanceCriteria: '≤ 2.5kg', traces: [] }
      ],
      gates: {
        cost: { status: 'pending', ownerId: 'pm-001', ownerName: 'John Smith' },
        safety: { status: 'pending', ownerId: 'se-001', ownerName: 'Jane Doe' },
        manufacturability: { status: 'pending', ownerId: 'me-001', ownerName: 'Bob Wilson' },
        serviceability: { status: 'pending', ownerId: 'sv-001', ownerName: 'Alice Brown' }
      },
      interfaces: {
        mechanical_envelope: { isComplete: true, specification: '150mm x 80mm x 120mm bounding box' },
        mounting_datums: { isComplete: true, specification: 'Datum A: Mounting face, Datum B: Bore centerline' },
        tolerance_stack: { isComplete: false }
      },
      adjacentNodes: [
        { nodeId: 'node-001', nodeName: 'Brake Rotor', nodeType: 'Component', ownerId: 'eng-002', approvalStatus: 'approved' },
        { nodeId: 'node-002', nodeName: 'Wheel Hub', nodeType: 'Assembly', ownerId: 'eng-003', approvalStatus: 'pending' }
      ],
      revisions: [
        { id: 'rev-001', label: 'Rev A', lifecycle: 'released', createdAt: '2024-01-15', createdBy: 'Engineer 1', triggerType: null, changeSummary: 'Initial release' }
      ],
      currentRevisionId: 'rev-001',
      iterationCount: 0,
      phases: DESIGN_PHASES.map((phaseConfig, idx) => ({
        ...phaseConfig,
        status: idx < 2 ? 'completed' : idx === 2 ? 'in_progress' : 'pending',
        progress: idx < 2 ? 100 : idx === 2 ? 65 : 0,
        qualityScore: idx < 2 ? 1.0 : 0,
        notes: '',
        documents: [],
        answers: phaseConfig.questions.map((q, qIdx) => ({
          key: q.key,
          question: q.text,
          type: q.type,
          required: q.required,
          status: idx < 2 ? 'yes' : idx === 2 && qIdx < 2 ? 'yes' : 'unanswered',
          notes: ''
        }))
      }))
    };
  };

  if (loading || !project || !activePhase) {
    return (
      <div className="min-h-screen bg-[#0F1114] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#2A2F36] border-t-blue-500"></div>
      </div>
    );
  }

  const phaseKey = getPhaseKey(activePhase.number, activePhase.subPhase);
  const suggestions = AI_SUGGESTIONS[phaseKey] || [];

  // Calculate AI score
  const aiScore = calculateAIScore(project.phases, project.requirements, project.gates, project.iterationCount > 0);

  // Get phase from project state
  const currentPhaseData = project.phases.find(p =>
    p.number === activePhase.number && p.subPhase === activePhase.subPhase
  );

  const handleAnswerChange = async (questionIndex, status) => {
    const updatedPhases = project.phases.map(p => {
      if (p.number === activePhase.number && p.subPhase === activePhase.subPhase) {
        const newAnswers = [...p.answers];
        newAnswers[questionIndex] = { ...newAnswers[questionIndex], status };

        // Recalculate progress based on answered questions
        const answered = newAnswers.filter(a => a.status !== 'unanswered').length;
        const progress = Math.round((answered / newAnswers.length) * 100);

        return { ...p, answers: newAnswers, progress };
      }
      return p;
    });

    setProject({ ...project, phases: updatedPhases });

    // Sync with API
    try {
      await fetch(`${API_URL}/api/design/${id}/phases/${activePhase.number}${activePhase.subPhase || ''}/questions/${questionIndex + 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer_status: status,
          answer_notes: currentPhaseData.answers[questionIndex].notes
        })
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const handleNotesChange = (questionIndex, notes) => {
    const updatedPhases = project.phases.map(p => {
      if (p.number === activePhase.number && p.subPhase === activePhase.subPhase) {
        const newAnswers = [...p.answers];
        newAnswers[questionIndex] = { ...newAnswers[questionIndex], notes };
        return { ...p, answers: newAnswers };
      }
      return p;
    });
    setProject({ ...project, phases: updatedPhases });
  };

  const handlePhaseNotesChange = (notes) => {
    const updatedPhases = project.phases.map(p => {
      if (p.number === activePhase.number && p.subPhase === activePhase.subPhase) {
        return { ...p, notes };
      }
      return p;
    });
    setProject({ ...project, phases: updatedPhases });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/design/${id}/phases/${activePhase.number}${activePhase.subPhase || ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_percentage: currentPhaseData.progress,
          notes: currentPhaseData.notes,
          answers: currentPhaseData.answers.map((a, idx) => ({
            question_number: idx + 1,
            answer_status: a.status,
            answer_notes: a.notes
          }))
        })
      });
    } catch (err) {
      console.error('Failed to save phase:', err);
    }
    setSaving(false);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');

    try {
      const response = await fetch(`${API_URL}/api/design/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          context_phase: activePhase.number,
          context_subphase: activePhase.subPhase
        })
      });
      const data = await response.json();

      if (data.success) {
        const aiResponse = { role: 'assistant', content: data.response };
        setChatMessages(prev => [...prev, aiResponse]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const aiResponse = {
        role: 'assistant',
        content: `Based on your question about Phase ${phaseKey} (${activePhase.name}), here are my recommendations:\n\n1. Make sure all ${activePhase.questions.length} guided questions are addressed\n2. Current phase progress is at ${currentPhaseData.progress}%\n3. Consider reviewing the AI suggestions panel for specific tips\n\nWould you like more details on any specific aspect?`
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }
  };

  const handlePhaseSelect = (phase) => {
    setActivePhase(phase);
    setActiveTab('questions');
  };

  const getStatusIcon = (status) => {
    if (status === 'yes') return <Check className="w-4 h-4 text-emerald-400" />;
    if (status === 'no') return <X className="w-4 h-4 text-red-400" />;
    if (status === 'in_progress') return <Circle className="w-4 h-4 text-amber-400 fill-amber-400/30" />;
    return <Circle className="w-4 h-4 text-[#6B7280]" />;
  };

  // Check if current phase has gates
  const hasGates = activePhase.gates && activePhase.gates.length > 0;
  // Check if current phase requires interface control
  const hasInterfaceControl = activePhase.interfaceControlRequired;
  // Check if we're in Phase 1 (requirements phase)
  const isRequirementsPhase = activePhase.number === 1;
  // Check if we're in Phase 3b (serviceability)
  const isServiceabilityPhase = activePhase.number === 3 && activePhase.subPhase === 'b';
  // Check if we're in Phase 3c (manufacturability)
  const isManufacturabilityPhase = activePhase.number === 3 && activePhase.subPhase === 'c';

  // Calculate trace coverage for requirements
  const traceCoverage = project.requirements.length > 0
    ? project.requirements.filter(r => r.traces && r.traces.length > 0).length / project.requirements.length
    : 0;
  const requiredCoverage = RIGOR_TIERS[project.rigorTier]?.requirementTraceCoverage || 0.8;

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 pt-24 pb-6">
        {/* Project Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/design')}
              className="p-2 hover:bg-[#22262C] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#6B7280] font-mono">{project.project_number}</span>
                <RigorTierBadge tier={project.rigorTier} size="sm" />
                {project.domainLens && DOMAIN_LENSES[project.domainLens] && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                    <Globe className="w-3 h-3" />
                    {DOMAIN_LENSES[project.domainLens].name}
                  </span>
                )}
                {project.specificationLevel && SPECIFICATION_LEVELS[project.specificationLevel?.toUpperCase()] && (
                  <span className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-400 rounded">
                    {SPECIFICATION_LEVELS[project.specificationLevel.toUpperCase()].name}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-[#F0F2F4]">{project.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showAIChat ? 'bg-blue-600 text-white' : 'bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#22262C]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
        </div>

        {/* Main Two-Column Layout: Tree (Left) + Workbench (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Left Column: Project Tree */}
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden flex flex-col">
            {fullProjectData?.root_node ? (
              <ProjectTreeView
                project={fullProjectData}
                onNodeSelect={handleNodeSelect}
                onGenerateReport={handleGenerateReport}
                onLinkCad={handleLinkCad}
                onUploadCad={handleUploadCad}
                selectedNodeId={selectedNode?.id}
                compact={true}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#6B7280]">
                <p>No project hierarchy available</p>
              </div>
            )}
          </div>

          {/* Right Column: Node Workbench */}
          <NodeWorkbenchPanel
            node={selectedNode}
            project={project}
            fullProjectData={fullProjectData}
            phase={activePhase}
            phaseProgress={currentPhaseData?.progress || 0}
            checklistCompletion={{
              completed: currentPhaseData?.answers?.filter(a => a.status === 'yes' || a.status === 'completed').length || 0,
              total: currentPhaseData?.answers?.length || 0
            }}
            onOpenPhaseDrawer={() => setShowPhaseDrawer(true)}
            onSave={handleSave}
            onOpenAI={() => setShowAIChat(!showAIChat)}
            onLinkCad={handleLinkCad}
            onUploadCad={handleUploadCad}
            onNavigateToTest={(testId) => console.log('Navigate to test:', testId)}
            saving={saving}
            readOnly={false}
          />
        </div>
      </main>

      {/* Phase Drawer Overlay */}
      <PhaseDrawer
        isOpen={showPhaseDrawer}
        onClose={() => setShowPhaseDrawer(false)}
        activePhase={activePhase}
        allPhases={project.phases}
        currentPhaseData={currentPhaseData}
        suggestions={suggestions}
        onPhaseSelect={handlePhaseSelect}
        onAnswerChange={handleAnswerChange}
        onNotesChange={handleNotesChange}
        onPhaseNotesChange={handlePhaseNotesChange}
        onSave={handleSave}
        onNavigate={(tool) => navigate(
          tool === 'doe' ? '/doe/new' :
          tool === 'quality' ? '/quality' :
          '/knowledge'
        )}
        saving={saving}
      />

      {/* AI Chat Floating Panel */}
      {showAIChat && (
        <div className="fixed bottom-4 right-4 w-96 bg-[#15181C] border border-[#2A2F36] rounded-xl flex flex-col shadow-2xl z-30" style={{ height: '500px' }}>
          <div className="p-3 border-b border-[#2A2F36] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F0F2F4] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Design Assistant
              </h3>
              <p className="text-xs text-[#6B7280]">
                Ask questions about Phase {phaseKey}
              </p>
            </div>
            <button
              onClick={() => setShowAIChat(false)}
              className="p-1 hover:bg-[#22262C] rounded text-[#6B7280] hover:text-[#F0F2F4]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-[#6B7280] mt-4">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask me anything!</p>
                <div className="mt-3 space-y-1.5">
                  {[
                    'What should I focus on?',
                    'How do I improve my AI score?',
                    'What are the gate requirements?'
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => setChatInput(q)}
                      className="block w-full text-xs text-left px-2 py-1.5 bg-[#1C1F24] hover:bg-[#22262C] rounded text-[#B4BAC4]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1C1F24] text-[#F0F2F4]'
                    }`}
                  >
                    <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-[#2A2F36]">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask a question..."
                className="flex-1 px-2 py-1.5 bg-[#0F1114] border border-[#2A2F36] rounded text-[#F0F2F4] text-xs placeholder-[#6B7280] focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendChat}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Generator Wizard Modal */}
      {showReportWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <ReportGeneratorWizard
              projectId={id}
              nodeId={reportTargetNode?.id}
              nodeName={reportTargetNode?.name}
              onGenerate={handleReportGenerate}
              onClose={() => setShowReportWizard(false)}
              completenessData={{
                traceCoverage: 0.85,
                gatesComplete: false,
                revisionState: 'draft'
              }}
            />
          </div>
        </div>
      )}

      {/* CAD Link/Upload Modal */}
      {showCadModal && cadTargetNode && (
        <CADLinkUploadModal
          node={cadTargetNode}
          mode={cadModalMode}
          onClose={() => setShowCadModal(false)}
          onSave={handleCadSave}
        />
      )}
    </div>
  );
}

export default DesignCycleWizard;
