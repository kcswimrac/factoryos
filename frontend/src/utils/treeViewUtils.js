/**
 * Tree View Utilities
 *
 * Builds a unified tree view model that merges product nodes with their
 * owned artifacts (CAD, studies, tests, fixtures) under virtual folders.
 *
 * Key principle: Artifacts appear under exactly one owning product node.
 * Virtual folders are UI-only constructs not stored in the database.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const VIRTUAL_FOLDER_TYPES = {
  CAD_DRAWINGS: 'virtual_cad',
  STUDIES: 'virtual_studies',
  TESTS: 'virtual_tests',
  FIXTURES: 'virtual_fixtures'
};

export const ARTIFACT_TYPES = {
  CAD: 'artifact_cad',
  DRAWING: 'artifact_drawing',
  STUDY_DOE: 'artifact_study_doe',
  STUDY_PARAMETRIC: 'artifact_study_parametric',
  STUDY_SENSITIVITY: 'artifact_study_sensitivity',
  STUDY_TRADE: 'artifact_study_trade',
  STUDY_RELIABILITY: 'artifact_study_reliability',
  TEST_CASE: 'artifact_test',
  FIXTURE: 'artifact_fixture'
};

// Type badges for fast scanning
export const TYPE_BADGES = {
  [ARTIFACT_TYPES.CAD]: { label: 'CAD', color: 'bg-violet-500/20 text-violet-400' },
  [ARTIFACT_TYPES.DRAWING]: { label: 'DWG', color: 'bg-blue-500/20 text-blue-400' },
  [ARTIFACT_TYPES.STUDY_DOE]: { label: 'DOE', color: 'bg-cyan-500/20 text-cyan-400' },
  [ARTIFACT_TYPES.STUDY_PARAMETRIC]: { label: 'PARAM', color: 'bg-teal-500/20 text-teal-400' },
  [ARTIFACT_TYPES.STUDY_SENSITIVITY]: { label: 'SENS', color: 'bg-teal-500/20 text-teal-400' },
  [ARTIFACT_TYPES.STUDY_TRADE]: { label: 'TRADE', color: 'bg-amber-500/20 text-amber-400' },
  [ARTIFACT_TYPES.STUDY_RELIABILITY]: { label: 'REL', color: 'bg-rose-500/20 text-rose-400' },
  [ARTIFACT_TYPES.TEST_CASE]: { label: 'TEST', color: 'bg-green-500/20 text-green-400' },
  [ARTIFACT_TYPES.FIXTURE]: { label: 'FIX', color: 'bg-orange-500/20 text-orange-400' }
};

// Virtual folder configuration
export const VIRTUAL_FOLDER_CONFIG = {
  [VIRTUAL_FOLDER_TYPES.CAD_DRAWINGS]: {
    name: 'CAD & Drawings',
    icon: 'file-box',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10'
  },
  [VIRTUAL_FOLDER_TYPES.STUDIES]: {
    name: 'Studies',
    icon: 'flask-conical',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10'
  },
  [VIRTUAL_FOLDER_TYPES.TESTS]: {
    name: 'Tests',
    icon: 'clipboard-check',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10'
  },
  [VIRTUAL_FOLDER_TYPES.FIXTURES]: {
    name: 'Fixtures',
    icon: 'wrench',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10'
  }
};

// =============================================================================
// ARTIFACT INDEXING
// =============================================================================

/**
 * Build an index of artifacts by owning node ID/part number
 */
export function buildArtifactIndex(project) {
  const index = {
    byNodeId: {},
    byPartNumber: {}
  };

  // Index engineering studies
  (project.engineering_studies || []).forEach(study => {
    const nodeId = study.owning_node_id;
    const partNumber = study.owning_node_part_number;

    const artifact = {
      ...study,
      artifactType: getStudyArtifactType(study.type),
      artifactCategory: 'study'
    };

    if (nodeId) {
      if (!index.byNodeId[nodeId]) index.byNodeId[nodeId] = { cad: [], studies: [], tests: [], fixtures: [] };
      index.byNodeId[nodeId].studies.push(artifact);
    }
    if (partNumber) {
      if (!index.byPartNumber[partNumber]) index.byPartNumber[partNumber] = { cad: [], studies: [], tests: [], fixtures: [] };
      index.byPartNumber[partNumber].studies.push(artifact);
    }
  });

  // Index test cases
  (project.test_cases || []).forEach(test => {
    const nodeId = test.owning_node_id;
    const partNumber = test.owning_node_part_number;

    const artifact = {
      ...test,
      artifactType: ARTIFACT_TYPES.TEST_CASE,
      artifactCategory: 'test'
    };

    if (nodeId) {
      if (!index.byNodeId[nodeId]) index.byNodeId[nodeId] = { cad: [], studies: [], tests: [], fixtures: [] };
      index.byNodeId[nodeId].tests.push(artifact);
    }
    if (partNumber) {
      if (!index.byPartNumber[partNumber]) index.byPartNumber[partNumber] = { cad: [], studies: [], tests: [], fixtures: [] };
      index.byPartNumber[partNumber].tests.push(artifact);
    }
  });

  // Index manufacturing assets (fixtures)
  (project.manufacturing_assets || []).forEach(fixture => {
    const linkedNodes = fixture.linked_product_nodes || [];

    const artifact = {
      ...fixture,
      artifactType: ARTIFACT_TYPES.FIXTURE,
      artifactCategory: 'fixture'
    };

    // Fixtures are linked by part number to the lowest constraining node
    // For now, use the first linked node as the primary owner
    if (linkedNodes.length > 0) {
      const primaryPartNumber = linkedNodes[0];
      if (!index.byPartNumber[primaryPartNumber]) {
        index.byPartNumber[primaryPartNumber] = { cad: [], studies: [], tests: [], fixtures: [] };
      }
      index.byPartNumber[primaryPartNumber].fixtures.push(artifact);
    }
  });

  return index;
}

/**
 * Get the artifact type for a study based on its type code
 */
function getStudyArtifactType(studyType) {
  switch (studyType) {
    case 'doe': return ARTIFACT_TYPES.STUDY_DOE;
    case 'parametric': return ARTIFACT_TYPES.STUDY_PARAMETRIC;
    case 'sensitivity': return ARTIFACT_TYPES.STUDY_SENSITIVITY;
    case 'trade_study': return ARTIFACT_TYPES.STUDY_TRADE;
    case 'reliability': return ARTIFACT_TYPES.STUDY_RELIABILITY;
    default: return ARTIFACT_TYPES.STUDY_DOE;
  }
}

// =============================================================================
// TREE VIEW MODEL BUILDING
// =============================================================================

let virtualIdCounter = 0;

/**
 * Generate a unique ID for virtual nodes
 */
function generateVirtualId(prefix) {
  return `${prefix}-${++virtualIdCounter}`;
}

/**
 * Extract CAD entries from a node's attachments
 */
function extractCadArtifacts(node) {
  if (!node.attachments) return [];

  return node.attachments
    .filter(att => att.type === 'cad' || att.type === 'drawing')
    .map(att => ({
      id: att.id || generateVirtualId('cad'),
      name: att.filename || att.name,
      artifactType: att.type === 'cad' ? ARTIFACT_TYPES.CAD : ARTIFACT_TYPES.DRAWING,
      artifactCategory: 'cad',
      parentNodeId: node.id,
      parentPartNumber: node.part_number,
      attachment: att,
      // For CAD preview
      cad_thumbnail: node.cad_thumbnail,
      cad_tool: att.cad_tool || 'unknown',
      last_updated: att.uploaded_at || att.last_updated
    }));
}

/**
 * Build virtual folder nodes for a product node's artifacts
 */
function buildVirtualFolders(node, artifactIndex) {
  const folders = [];

  // Get artifacts for this node
  const nodeArtifacts = artifactIndex.byPartNumber[node.part_number] ||
                        artifactIndex.byNodeId[node.id] ||
                        { cad: [], studies: [], tests: [], fixtures: [] };

  // Extract CAD from attachments
  const cadArtifacts = extractCadArtifacts(node);

  // CAD & Drawings folder
  if (cadArtifacts.length > 0) {
    folders.push({
      id: generateVirtualId('vf-cad'),
      name: VIRTUAL_FOLDER_CONFIG[VIRTUAL_FOLDER_TYPES.CAD_DRAWINGS].name,
      node_class: VIRTUAL_FOLDER_TYPES.CAD_DRAWINGS,
      isVirtualFolder: true,
      virtualFolderType: VIRTUAL_FOLDER_TYPES.CAD_DRAWINGS,
      parentNodeId: node.id,
      children: cadArtifacts.map(cad => ({
        ...cad,
        isArtifact: true,
        node_class: cad.artifactType
      }))
    });
  }

  // Studies folder
  if (nodeArtifacts.studies.length > 0) {
    folders.push({
      id: generateVirtualId('vf-study'),
      name: VIRTUAL_FOLDER_CONFIG[VIRTUAL_FOLDER_TYPES.STUDIES].name,
      node_class: VIRTUAL_FOLDER_TYPES.STUDIES,
      isVirtualFolder: true,
      virtualFolderType: VIRTUAL_FOLDER_TYPES.STUDIES,
      parentNodeId: node.id,
      children: nodeArtifacts.studies.map(study => ({
        ...study,
        isArtifact: true,
        node_class: study.artifactType
      }))
    });
  }

  // Tests folder
  if (nodeArtifacts.tests.length > 0) {
    folders.push({
      id: generateVirtualId('vf-test'),
      name: VIRTUAL_FOLDER_CONFIG[VIRTUAL_FOLDER_TYPES.TESTS].name,
      node_class: VIRTUAL_FOLDER_TYPES.TESTS,
      isVirtualFolder: true,
      virtualFolderType: VIRTUAL_FOLDER_TYPES.TESTS,
      parentNodeId: node.id,
      children: nodeArtifacts.tests.map(test => ({
        ...test,
        isArtifact: true,
        node_class: test.artifactType
      }))
    });
  }

  // Fixtures folder
  if (nodeArtifacts.fixtures.length > 0) {
    folders.push({
      id: generateVirtualId('vf-fix'),
      name: VIRTUAL_FOLDER_CONFIG[VIRTUAL_FOLDER_TYPES.FIXTURES].name,
      node_class: VIRTUAL_FOLDER_TYPES.FIXTURES,
      isVirtualFolder: true,
      virtualFolderType: VIRTUAL_FOLDER_TYPES.FIXTURES,
      parentNodeId: node.id,
      children: nodeArtifacts.fixtures.map(fixture => ({
        ...fixture,
        isArtifact: true,
        node_class: fixture.artifactType
      }))
    });
  }

  return folders;
}

/**
 * Recursively build the enhanced tree with virtual folders
 */
function buildEnhancedNode(node, artifactIndex, sopIndex = {}) {
  // Start with the original node properties
  const enhancedNode = {
    ...node,
    isProductNode: node.node_class === 'product' ||
                   node.node_class === 'manufacturing_asset' ||
                   node.node_class === 'test_asset'
  };

  // Build virtual folders for product nodes
  const virtualFolders = node.node_class === 'product'
    ? buildVirtualFolders(node, artifactIndex)
    : [];

  // Recursively process children
  const enhancedChildren = (node.children || []).map(child =>
    buildEnhancedNode(child, artifactIndex, sopIndex)
  );

  // Combine: regular children (parts/assemblies) first, then virtual folders (studies, tests, fixtures)
  enhancedNode.children = [...enhancedChildren, ...virtualFolders];

  // Track artifact counts for summary
  enhancedNode.artifactCounts = {
    cad: virtualFolders.find(f => f.virtualFolderType === VIRTUAL_FOLDER_TYPES.CAD_DRAWINGS)?.children.length || 0,
    studies: virtualFolders.find(f => f.virtualFolderType === VIRTUAL_FOLDER_TYPES.STUDIES)?.children.length || 0,
    tests: virtualFolders.find(f => f.virtualFolderType === VIRTUAL_FOLDER_TYPES.TESTS)?.children.length || 0,
    fixtures: virtualFolders.find(f => f.virtualFolderType === VIRTUAL_FOLDER_TYPES.FIXTURES)?.children.length || 0,
    specs: 0 // Will be populated by buildTreeViewModel from project.specifications
  };

  // SOP count from index (populated from SOP data)
  // Check both node ID and part number for matching SOPs
  const sopByNodeId = sopIndex?.byNodeId?.[node.id] || 0;
  const sopByPartNumber = sopIndex?.byPartNumber?.[node.part_number] || 0;
  enhancedNode.sopCount = sopByNodeId + sopByPartNumber || node.sopCount || 0;

  return enhancedNode;
}

/**
 * Build an index of spec counts by node part number
 */
function buildSpecIndex(specifications = []) {
  const index = {
    byPartNumber: {},
    needsQuantificationByPartNumber: {}
  };

  specifications.forEach(spec => {
    const partNumber = spec.node_path || spec.owning_node_part_number;
    if (partNumber) {
      index.byPartNumber[partNumber] = (index.byPartNumber[partNumber] || 0) + 1;
      if (spec.status === 'needs_quantification') {
        index.needsQuantificationByPartNumber[partNumber] = (index.needsQuantificationByPartNumber[partNumber] || 0) + 1;
      }
    }
  });

  return index;
}

/**
 * Add spec counts to nodes recursively
 */
function addSpecCountsToNode(node, specIndex) {
  if (!node) return;

  const partNumber = node.part_number;
  if (partNumber && specIndex.byPartNumber[partNumber]) {
    node.artifactCounts = node.artifactCounts || {};
    node.artifactCounts.specs = specIndex.byPartNumber[partNumber] || 0;
    node.artifactCounts.specsNeedingQuantification = specIndex.needsQuantificationByPartNumber[partNumber] || 0;
  }

  // Process children
  if (node.children) {
    node.children.forEach(child => {
      if (!child.isVirtualFolder && !child.isArtifact) {
        addSpecCountsToNode(child, specIndex);
      }
    });
  }
}

/**
 * Build the complete enhanced tree view model for a project
 * @param {Object} project - The project data with root_node
 * @param {Object} sopIndex - Optional map of nodeId -> SOP count for displaying SOP indicators
 */
export function buildTreeViewModel(project, sopIndex = {}) {
  if (!project || !project.root_node) return null;

  // Reset virtual ID counter for each build
  virtualIdCounter = 0;

  // Build artifact index
  const artifactIndex = buildArtifactIndex(project);

  // Build spec index
  const specIndex = buildSpecIndex(project.specifications);

  // Build enhanced tree with SOP counts
  const enhancedRoot = buildEnhancedNode(project.root_node, artifactIndex, sopIndex);

  // Add spec counts to nodes
  addSpecCountsToNode(enhancedRoot, specIndex);

  return {
    ...project,
    root_node: enhancedRoot,
    // Don't include manufacturing_assets at project level anymore - they're in the tree
    _original_manufacturing_assets: project.manufacturing_assets
  };
}

// =============================================================================
// NODE FINDING UTILITIES
// =============================================================================

/**
 * Find a node by ID in the enhanced tree (includes virtual folders and artifacts)
 */
export function findNodeById(root, id) {
  if (!root || !id) return null;
  if (root.id === id) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Find all nodes matching a predicate
 */
export function findNodes(root, predicate) {
  const results = [];

  function traverse(node) {
    if (predicate(node)) {
      results.push(node);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  if (root) traverse(root);
  return results;
}

/**
 * Get artifact summary for a node and all its descendants
 */
export function getNodeArtifactSummary(node) {
  let cad = 0, studies = 0, tests = 0, fixtures = 0, specs = 0, specsNeedingQuantification = 0;

  function traverse(n) {
    if (n.artifactCounts) {
      cad += n.artifactCounts.cad || 0;
      studies += n.artifactCounts.studies || 0;
      tests += n.artifactCounts.tests || 0;
      fixtures += n.artifactCounts.fixtures || 0;
      specs += n.artifactCounts.specs || 0;
      specsNeedingQuantification += n.artifactCounts.specsNeedingQuantification || 0;
    }
    if (n.children) {
      n.children.forEach(child => {
        if (!child.isVirtualFolder) traverse(child);
      });
    }
  }

  traverse(node);
  return { cad, studies, tests, fixtures, specs, specsNeedingQuantification };
}

// =============================================================================
// FILTER UTILITIES
// =============================================================================

/**
 * Filter tree to show only nodes with specific artifact types
 */
export function filterTreeByArtifacts(root, artifactTypes = []) {
  if (!root) return null;
  if (artifactTypes.length === 0) return root;

  function hasMatchingArtifacts(node) {
    // Check if this node has matching artifacts
    if (node.artifactCounts) {
      if (artifactTypes.includes('cad') && node.artifactCounts.cad > 0) return true;
      if (artifactTypes.includes('studies') && node.artifactCounts.studies > 0) return true;
      if (artifactTypes.includes('tests') && node.artifactCounts.tests > 0) return true;
      if (artifactTypes.includes('fixtures') && node.artifactCounts.fixtures > 0) return true;
    }

    // Check children
    if (node.children) {
      return node.children.some(child => !child.isVirtualFolder && hasMatchingArtifacts(child));
    }

    return false;
  }

  function filterNode(node) {
    if (!hasMatchingArtifacts(node)) return null;

    const filteredChildren = (node.children || [])
      .map(child => child.isVirtualFolder ? child : filterNode(child))
      .filter(Boolean);

    return {
      ...node,
      children: filteredChildren
    };
  }

  return filterNode(root);
}

/**
 * Check if a node type is a virtual folder
 */
export function isVirtualFolder(nodeClass) {
  return Object.values(VIRTUAL_FOLDER_TYPES).includes(nodeClass);
}

/**
 * Check if a node type is an artifact
 */
export function isArtifact(nodeClass) {
  return Object.values(ARTIFACT_TYPES).includes(nodeClass);
}

/**
 * Get the selection type for proper panel routing
 */
export function getSelectionType(node) {
  if (!node) return null;

  if (node.isVirtualFolder) return 'virtual_folder';
  if (node.isArtifact) return node.artifactCategory; // 'cad', 'study', 'test', 'fixture'
  if (node.node_class === 'functional_group') return 'functional_group';
  if (node.node_class === 'product') return 'product';
  if (node.node_class === 'manufacturing_asset') return 'fixture'; // Legacy
  if (node.node_class === 'test_asset') return 'test_asset';

  return 'unknown';
}
