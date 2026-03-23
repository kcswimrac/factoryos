// Design Cycle API Service
// Provides API methods for the 7-phase Engineering Design Cycle

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper for API requests
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Project CRUD
// ============================================================================

// Scope filter options: 'all', 'user', 'organization', 'org_group', 'public'
export async function getProjects(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.rigor_tier) params.append('rigor_tier', filters.rigor_tier);
  if (filters.search) params.append('search', filters.search);
  if (filters.scope) params.append('scope', filters.scope);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/design${query}`);
}

export async function getProject(projectId) {
  return apiRequest(`/api/design/${projectId}`);
}

export async function createProject(projectData) {
  return apiRequest('/api/design', {
    method: 'POST',
    body: JSON.stringify(projectData)
  });
}

export async function updateProject(projectId, updates) {
  return apiRequest(`/api/design/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function deleteProject(projectId) {
  return apiRequest(`/api/design/${projectId}`, {
    method: 'DELETE'
  });
}

// ============================================================================
// Phase Management
// ============================================================================

export async function getPhase(projectId, phaseNumber, subPhase = null) {
  const phaseKey = subPhase ? `${phaseNumber}${subPhase}` : phaseNumber;
  return apiRequest(`/api/design/${projectId}/phases/${phaseKey}`);
}

export async function updatePhase(projectId, phaseNumber, subPhase, updates) {
  const phaseKey = subPhase ? `${phaseNumber}${subPhase}` : phaseNumber;
  return apiRequest(`/api/design/${projectId}/phases/${phaseKey}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function updatePhaseQuestion(projectId, phaseNumber, subPhase, questionIndex, answer) {
  const phaseKey = subPhase ? `${phaseNumber}${subPhase}` : phaseNumber;
  return apiRequest(`/api/design/${projectId}/phases/${phaseKey}/questions/${questionIndex}`, {
    method: 'PUT',
    body: JSON.stringify(answer)
  });
}

export async function completePhase(projectId, phaseNumber, subPhase) {
  const phaseKey = subPhase ? `${phaseNumber}${subPhase}` : phaseNumber;
  return apiRequest(`/api/design/${projectId}/phases/${phaseKey}/complete`, {
    method: 'POST'
  });
}

// ============================================================================
// Requirements Management
// ============================================================================

export async function getRequirements(projectId) {
  return apiRequest(`/api/design/${projectId}/requirements`);
}

export async function createRequirement(projectId, requirement) {
  return apiRequest(`/api/design/${projectId}/requirements`, {
    method: 'POST',
    body: JSON.stringify(requirement)
  });
}

export async function updateRequirement(projectId, requirementId, updates) {
  return apiRequest(`/api/design/${projectId}/requirements/${requirementId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function deleteRequirement(projectId, requirementId) {
  return apiRequest(`/api/design/${projectId}/requirements/${requirementId}`, {
    method: 'DELETE'
  });
}

export async function getRequirementTraces(projectId, requirementId) {
  return apiRequest(`/api/design/${projectId}/requirements/${requirementId}/traces`);
}

export async function addRequirementTrace(projectId, requirementId, trace) {
  return apiRequest(`/api/design/${projectId}/requirements/${requirementId}/traces`, {
    method: 'POST',
    body: JSON.stringify(trace)
  });
}

export async function getTraceCoverage(projectId) {
  return apiRequest(`/api/design/${projectId}/requirements/trace-coverage`);
}

// ============================================================================
// Gate Approvals
// ============================================================================

export async function getGates(projectId) {
  return apiRequest(`/api/design/${projectId}/gates`);
}

export async function approveGate(projectId, gateKey, approvalData) {
  return apiRequest(`/api/design/${projectId}/gates/${gateKey}/approve`, {
    method: 'POST',
    body: JSON.stringify(approvalData)
  });
}

export async function rejectGate(projectId, gateKey, rejectionData) {
  return apiRequest(`/api/design/${projectId}/gates/${gateKey}/reject`, {
    method: 'POST',
    body: JSON.stringify(rejectionData)
  });
}

export async function addGateComment(projectId, gateKey, comment) {
  return apiRequest(`/api/design/${projectId}/gates/${gateKey}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment })
  });
}

export async function resetGate(projectId, gateKey) {
  return apiRequest(`/api/design/${projectId}/gates/${gateKey}/reset`, {
    method: 'POST'
  });
}

// ============================================================================
// Interface Control
// ============================================================================

export async function getInterfaces(projectId) {
  return apiRequest(`/api/design/${projectId}/interfaces`);
}

export async function updateInterface(projectId, interfaceKey, data) {
  return apiRequest(`/api/design/${projectId}/interfaces/${interfaceKey}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteInterface(projectId, interfaceKey) {
  return apiRequest(`/api/design/${projectId}/interfaces/${interfaceKey}`, {
    method: 'DELETE'
  });
}

export async function getAdjacentNodes(projectId) {
  return apiRequest(`/api/design/${projectId}/interfaces/adjacent-nodes`);
}

export async function approveAdjacentNode(projectId, nodeId) {
  return apiRequest(`/api/design/${projectId}/interfaces/adjacent-nodes/${nodeId}/approve`, {
    method: 'POST'
  });
}

export async function rejectAdjacentNode(projectId, nodeId, reason) {
  return apiRequest(`/api/design/${projectId}/interfaces/adjacent-nodes/${nodeId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

// ============================================================================
// AI Score
// ============================================================================

export async function getAIScore(projectId) {
  return apiRequest(`/api/design/${projectId}/ai-score`);
}

export async function getAIScoreHistory(projectId) {
  return apiRequest(`/api/design/${projectId}/ai-score/history`);
}

export async function recalculateAIScore(projectId) {
  return apiRequest(`/api/design/${projectId}/ai-score/recalculate`, {
    method: 'POST'
  });
}

// ============================================================================
// Revisions
// ============================================================================

export async function getRevisions(projectId) {
  return apiRequest(`/api/design/${projectId}/revisions`);
}

export async function getRevision(projectId, revisionId) {
  return apiRequest(`/api/design/${projectId}/revisions/${revisionId}`);
}

export async function createRevision(projectId, revisionData) {
  return apiRequest(`/api/design/${projectId}/revisions`, {
    method: 'POST',
    body: JSON.stringify(revisionData)
  });
}

export async function getRevisionDiff(projectId, revisionId) {
  return apiRequest(`/api/design/${projectId}/revisions/${revisionId}/diff`);
}

export async function updateRevisionLifecycle(projectId, revisionId, lifecycle) {
  return apiRequest(`/api/design/${projectId}/revisions/${revisionId}/lifecycle`, {
    method: 'PUT',
    body: JSON.stringify({ lifecycle })
  });
}

// ============================================================================
// Learning Loops
// ============================================================================

export async function getLearningLoops(projectId) {
  return apiRequest(`/api/design/${projectId}/learning-loops`);
}

export async function createLearningLoop(projectId, loopData) {
  return apiRequest(`/api/design/${projectId}/learning-loops`, {
    method: 'POST',
    body: JSON.stringify(loopData)
  });
}

export async function completeLearningLoop(projectId, loopId) {
  return apiRequest(`/api/design/${projectId}/learning-loops/${loopId}/complete`, {
    method: 'POST'
  });
}

// ============================================================================
// AI Chat
// ============================================================================

export async function sendChatMessage(projectId, message, contextPhase, contextSubPhase = null) {
  return apiRequest(`/api/design/${projectId}/chat`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      context_phase: contextPhase,
      context_subphase: contextSubPhase
    })
  });
}

// ============================================================================
// Rigor Tier
// ============================================================================

export async function updateRigorTier(projectId, tier, justification = null) {
  return apiRequest(`/api/design/${projectId}/rigor-tier`, {
    method: 'PUT',
    body: JSON.stringify({
      tier,
      justification
    })
  });
}

// ============================================================================
// Documents & Artifacts
// ============================================================================

export async function getPhaseDocuments(projectId, phaseNumber, subPhase = null) {
  const phaseKey = subPhase ? `${phaseNumber}${subPhase}` : phaseNumber;
  return apiRequest(`/api/design/${projectId}/phases/${phaseKey}/documents`);
}

export async function uploadDocument(projectId, phaseNumber, subPhase, file, metadata) {
  const phaseKey = subPhase ? `${phaseNumber}${subPhase}` : phaseNumber;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await fetch(`${API_URL}/api/design/${projectId}/phases/${phaseKey}/documents`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload document');
  }

  return response.json();
}

export async function deleteDocument(projectId, documentId) {
  return apiRequest(`/api/design/${projectId}/documents/${documentId}`, {
    method: 'DELETE'
  });
}

// ============================================================================
// Knowledge Base (Correlation Factors)
// ============================================================================

export async function searchKnowledgeBase(query, filters = {}) {
  const params = new URLSearchParams({ query, ...filters });
  return apiRequest(`/api/knowledge/search?${params.toString()}`);
}

export async function promoteToKnowledgeBase(projectId, correlationData) {
  return apiRequest(`/api/design/${projectId}/promote-to-knowledge`, {
    method: 'POST',
    body: JSON.stringify(correlationData)
  });
}

// ============================================================================
// Project Hierarchy (Node Tree)
// ============================================================================

export async function getProjectTree(projectId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.node_type) params.append('node_type', filters.node_type);
  if (filters.rigor_tier) params.append('rigor_tier', filters.rigor_tier);
  if (filters.gate_status) params.append('gate_status', filters.gate_status);
  if (filters.revision_state) params.append('revision_state', filters.revision_state);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/design/${projectId}/tree${query}`);
}

export async function getNode(projectId, nodeId) {
  return apiRequest(`/api/design/${projectId}/nodes/${nodeId}`);
}

export async function createNode(projectId, nodeData) {
  return apiRequest(`/api/design/${projectId}/nodes`, {
    method: 'POST',
    body: JSON.stringify(nodeData)
  });
}

export async function updateNode(projectId, nodeId, updates) {
  return apiRequest(`/api/design/${projectId}/nodes/${nodeId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function deleteNode(projectId, nodeId) {
  return apiRequest(`/api/design/${projectId}/nodes/${nodeId}`, {
    method: 'DELETE'
  });
}

export async function updateNodeType(projectId, nodeId, nodeType) {
  return apiRequest(`/api/design/${projectId}/nodes/${nodeId}/type`, {
    method: 'PUT',
    body: JSON.stringify({ node_type: nodeType })
  });
}

export async function getAllowedChildrenForNode(projectId, nodeId) {
  return apiRequest(`/api/design/${projectId}/nodes/${nodeId}/allowed-children`);
}

export async function getRollupMetrics(projectId, nodeId = null) {
  const endpoint = nodeId
    ? `/api/design/${projectId}/nodes/${nodeId}/rollup-metrics`
    : `/api/design/${projectId}/rollup-metrics`;
  return apiRequest(endpoint);
}

export async function moveNode(projectId, nodeId, newParentId) {
  return apiRequest(`/api/design/${projectId}/nodes/${nodeId}/move`, {
    method: 'POST',
    body: JSON.stringify({ new_parent_id: newParentId })
  });
}

// ============================================================================
// Engineering Reports
// ============================================================================

export async function getReportOptions(projectId, nodeId = null) {
  const endpoint = nodeId
    ? `/api/design/${projectId}/nodes/${nodeId}/report-options`
    : `/api/design/${projectId}/report-options`;
  return apiRequest(endpoint);
}

export async function generateReport(projectId, config) {
  return apiRequest(`/api/design/${projectId}/reports/run`, {
    method: 'POST',
    body: JSON.stringify(config)
  });
}

export async function getReportStatus(projectId, reportId) {
  return apiRequest(`/api/design/${projectId}/reports/${reportId}/status`);
}

export async function getReports(projectId, nodeId = null) {
  const endpoint = nodeId
    ? `/api/design/${projectId}/nodes/${nodeId}/reports`
    : `/api/design/${projectId}/reports`;
  return apiRequest(endpoint);
}

export async function downloadReport(projectId, reportId) {
  const response = await fetch(`${API_URL}/api/design/${projectId}/reports/${reportId}/download`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download report');
  }

  // Return blob for download
  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename = filenameMatch ? filenameMatch[1] : `report-${reportId}.pdf`;

  return { blob, filename };
}

export async function getReportArtifactIndex(projectId, reportId) {
  return apiRequest(`/api/design/${projectId}/reports/${reportId}/artifact-index`);
}

export async function validateReportIntegrity(projectId, reportId) {
  return apiRequest(`/api/design/${projectId}/reports/${reportId}/validate`);
}

// ============================================================================
// Node Requirements (per-node requirements management)
// ============================================================================

export async function getNodeRequirements(projectId, nodeId) {
  return apiRequest(`/api/design/${projectId}/nodes/${nodeId}/requirements`);
}

export async function getNodePhases(projectId, nodeId) {
  return apiRequest(`/api/design/${projectId}/nodes/${nodeId}/phases`);
}

export async function getNodeArtifacts(projectId, nodeId) {
  return apiRequest(`/api/design/${projectId}/nodes/${nodeId}/artifacts`);
}

// Export default object with all methods
export default {
  // Projects
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,

  // Phases
  getPhase,
  updatePhase,
  updatePhaseQuestion,
  completePhase,

  // Requirements
  getRequirements,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  getRequirementTraces,
  addRequirementTrace,
  getTraceCoverage,

  // Gates
  getGates,
  approveGate,
  rejectGate,
  addGateComment,
  resetGate,

  // Interfaces
  getInterfaces,
  updateInterface,
  deleteInterface,
  getAdjacentNodes,
  approveAdjacentNode,
  rejectAdjacentNode,

  // AI Score
  getAIScore,
  getAIScoreHistory,
  recalculateAIScore,

  // Revisions
  getRevisions,
  getRevision,
  createRevision,
  getRevisionDiff,
  updateRevisionLifecycle,

  // Learning Loops
  getLearningLoops,
  createLearningLoop,
  completeLearningLoop,

  // Chat
  sendChatMessage,

  // Rigor Tier
  updateRigorTier,

  // Documents
  getPhaseDocuments,
  uploadDocument,
  deleteDocument,

  // Knowledge Base
  searchKnowledgeBase,
  promoteToKnowledgeBase,

  // Project Hierarchy
  getProjectTree,
  getNode,
  createNode,
  updateNode,
  deleteNode,
  updateNodeType,
  getAllowedChildrenForNode,
  getRollupMetrics,
  moveNode,

  // Reports
  getReportOptions,
  generateReport,
  getReportStatus,
  getReports,
  downloadReport,
  getReportArtifactIndex,
  validateReportIntegrity,

  // Node-specific
  getNodeRequirements,
  getNodePhases,
  getNodeArtifacts
};
