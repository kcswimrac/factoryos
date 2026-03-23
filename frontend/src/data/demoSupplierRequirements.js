/**
 * Demo Supplier Requirements Data
 *
 * Implements the Supplier Derived Requirements (OTS Constraints) feature.
 * Supplier constraints are first-class requirements with traceability,
 * impact analysis, tests, and reporting.
 *
 * RULE: Supplier constraints are requirements. Attachments are evidence, not the requirement itself.
 * RULE: Supplier requirements are revision-scoped and do not automatically carry forward without review.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const REQUIREMENT_ORIGIN = {
  INTERNAL: 'internal',
  SUPPLIER: 'supplier',
  REGULATORY: 'regulatory'
};

export const SOURCE_TYPE = {
  SUPPLIER_DOC: 'supplier_doc',
  SUPPLIER_CERT: 'supplier_cert',
  SUPPLIER_EMAIL: 'supplier_email',
  STANDARD: 'standard',
  OTHER: 'other'
};

export const SUPPLIER_SOURCE_TYPE = {
  DATASHEET: 'datasheet',
  APPLICATION_NOTE: 'application_note',
  INSTALLATION_MANUAL: 'installation_manual',
  CERTIFICATION: 'certification',
  EMAIL_CORRESPONDENCE: 'email_correspondence',
  TECHNICAL_BULLETIN: 'technical_bulletin',
  SERVICE_BULLETIN: 'service_bulletin',
  STANDARD: 'standard'
};

export const OWNING_PARTY = {
  INTERNAL: 'internal',
  SUPPLIER: 'supplier',
  REGULATOR: 'regulator'
};

export const CHANGE_AUTHORITY = {
  INTERNAL: 'internal',
  SUPPLIER_ONLY: 'supplier_only',
  SHARED: 'shared'
};

export const APPLICABILITY_SCOPE = {
  NODE_ONLY: 'node_only',
  DOWNSTREAM_PROPAGATION: 'downstream_propagation'
};

export const PROPAGATION_REASON = {
  LOAD_PATH: 'load_path',
  INTERFACE: 'interface',
  ENVIRONMENT: 'environment',
  SERVICE: 'service',
  MANUFACTURING: 'manufacturing'
};

export const IMPACT_TYPE = {
  INVALIDATED: 'invalidated',
  NEEDS_REVIEW: 'needs_review',
  STILL_VALID: 'still_valid'
};

export const VALIDATION_STATUS = {
  UNVALIDATED: 'unvalidated',
  VALIDATED: 'validated',
  VIOLATED: 'violated'
};

export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// =============================================================================
// SUPPLIER SOURCES (Master Registry)
// =============================================================================

export const DEMO_SUPPLIER_SOURCES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // Traction Motor Supplier - Siemens
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'src-siemens-motor-datasheet',
    org_id: 'org-ebus',
    supplier_name: 'Siemens',
    source_type: SUPPLIER_SOURCE_TYPE.DATASHEET,
    title: 'ELFA Traction Motor 1TB2 Series Product Datasheet',
    revision: 'Rev D',
    published_at: '2024-06-15',
    file_object_key: 'org-ebus/supplier-docs/siemens-1tb2-datasheet-revd.pdf',
    external_url: null,
    notes: 'Primary reference for motor specifications and application limits',
    created_by: 'user-001',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'src-siemens-motor-appnote',
    org_id: 'org-ebus',
    supplier_name: 'Siemens',
    source_type: SUPPLIER_SOURCE_TYPE.APPLICATION_NOTE,
    title: 'ELFA Motor Mounting and Vibration Guidelines',
    revision: 'AN-2024-003',
    published_at: '2024-03-20',
    file_object_key: 'org-ebus/supplier-docs/siemens-vibration-appnote.pdf',
    external_url: null,
    notes: 'Critical vibration isolation and resonance avoidance requirements',
    created_by: 'user-001',
    created_at: '2024-01-20T10:00:00Z'
  },
  {
    id: 'src-siemens-motor-install',
    org_id: 'org-ebus',
    supplier_name: 'Siemens',
    source_type: SUPPLIER_SOURCE_TYPE.INSTALLATION_MANUAL,
    title: 'ELFA Traction Motor Installation Manual',
    revision: 'IM-1TB2-R3',
    published_at: '2024-02-10',
    file_object_key: 'org-ebus/supplier-docs/siemens-install-manual.pdf',
    external_url: null,
    notes: 'Mounting torque specs and thermal interface requirements',
    created_by: 'user-001',
    created_at: '2024-01-25T10:00:00Z'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Inverter Supplier - Dana TM4
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'src-dana-inverter-datasheet',
    org_id: 'org-ebus',
    supplier_name: 'Dana TM4',
    source_type: SUPPLIER_SOURCE_TYPE.DATASHEET,
    title: 'CO150 Traction Inverter Product Specification',
    revision: 'PS-2024-01',
    published_at: '2024-04-01',
    file_object_key: 'org-ebus/supplier-docs/dana-co150-spec.pdf',
    external_url: null,
    notes: 'Primary inverter specifications including thermal limits',
    created_by: 'user-001',
    created_at: '2024-02-01T10:00:00Z'
  },
  {
    id: 'src-dana-inverter-cooling',
    org_id: 'org-ebus',
    supplier_name: 'Dana TM4',
    source_type: SUPPLIER_SOURCE_TYPE.APPLICATION_NOTE,
    title: 'CO150 Coolant System Requirements',
    revision: 'AN-COOL-002',
    published_at: '2024-05-15',
    file_object_key: 'org-ebus/supplier-docs/dana-cooling-requirements.pdf',
    external_url: null,
    notes: 'Mandatory coolant flow and temperature requirements',
    created_by: 'user-001',
    created_at: '2024-02-15T10:00:00Z'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Battery Module Supplier - CATL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'src-catl-battery-datasheet',
    org_id: 'org-ebus',
    supplier_name: 'CATL',
    source_type: SUPPLIER_SOURCE_TYPE.DATASHEET,
    title: 'LFP Module Series Product Specification',
    revision: 'LFP-MOD-V4',
    published_at: '2024-01-01',
    file_object_key: 'org-ebus/supplier-docs/catl-lfp-module-spec.pdf',
    external_url: null,
    notes: 'Battery module specifications and safety limits',
    created_by: 'user-001',
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'src-catl-battery-thermal',
    org_id: 'org-ebus',
    supplier_name: 'CATL',
    source_type: SUPPLIER_SOURCE_TYPE.APPLICATION_NOTE,
    title: 'Battery Module Thermal Management Requirements',
    revision: 'TM-2024-001',
    published_at: '2024-02-20',
    file_object_key: 'org-ebus/supplier-docs/catl-thermal-requirements.pdf',
    external_url: null,
    notes: 'Critical thermal operating envelope and cooling requirements',
    created_by: 'user-001',
    created_at: '2024-01-12T10:00:00Z'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Motor Mount Isolator - LORD Corporation
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'src-lord-isolator-datasheet',
    org_id: 'org-ebus',
    supplier_name: 'LORD Corporation',
    source_type: SUPPLIER_SOURCE_TYPE.DATASHEET,
    title: 'BTR Series Industrial Isolator Product Data',
    revision: 'PD-BTR-R2',
    published_at: '2023-11-01',
    file_object_key: 'org-ebus/supplier-docs/lord-btr-isolator.pdf',
    external_url: 'https://www.lord.com/products/btr-isolators',
    notes: 'Isolator stiffness curves and durability limits',
    created_by: 'user-001',
    created_at: '2024-02-20T10:00:00Z'
  }
];

// =============================================================================
// SUPPLIER REQUIREMENTS (Electric Bus Gen 1)
// =============================================================================

export const DEMO_SUPPLIER_REQUIREMENTS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // Traction Motor Requirements
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sreq-motor-vibration-001',
    project_id: 'proj-ebus-gen1',
    requirement_origin: REQUIREMENT_ORIGIN.SUPPLIER,
    source_type: SOURCE_TYPE.SUPPLIER_DOC,
    source_title: 'ELFA Motor Mounting and Vibration Guidelines',
    source_revision: 'AN-2024-003',
    source_section: 'Section 4.2.1',
    source_url: null,

    title: 'Motor Mount Resonance Avoidance',
    description: 'Motor mounting system natural frequencies must avoid the motor excitation frequency bands to prevent resonance-induced bearing and stator damage.',

    // Structured requirement fields
    requirement_text: 'Mount system first natural frequency shall be outside the range of 45-65 Hz and 120-150 Hz to avoid motor electromagnetic and mechanical excitation bands.',
    acceptance_criteria: 'Modal analysis or hammer test confirms first mount mode <40 Hz or >70 Hz. Second mode avoids 120-150 Hz band with minimum 15% separation.',
    verification_method: 'analysis_and_test',

    owning_party: OWNING_PARTY.SUPPLIER,
    change_authority: CHANGE_AUTHORITY.SUPPLIER_ONLY,
    applicability_scope: APPLICABILITY_SCOPE.DOWNSTREAM_PROPAGATION,
    termination_rule: null,

    // Linkage
    linked_node_id: 'EBUS1-PR-200', // Traction Motor Assembly
    linked_node_revision_id: 'rev-motor-a',

    // Risk and validation
    risk_level: RISK_LEVEL.HIGH,
    validation_status: VALIDATION_STATUS.VALIDATED,
    validated_by: 'user-002',
    validated_at: '2024-08-15T14:00:00Z',
    validation_evidence: ['test-motor-modal-001', 'analysis-motor-fea-001'],

    created_by: 'user-001',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-08-15T14:00:00Z'
  },
  {
    id: 'sreq-motor-thermal-001',
    project_id: 'proj-ebus-gen1',
    requirement_origin: REQUIREMENT_ORIGIN.SUPPLIER,
    source_type: SOURCE_TYPE.SUPPLIER_DOC,
    source_title: 'ELFA Traction Motor 1TB2 Series Product Datasheet',
    source_revision: 'Rev D',
    source_section: 'Table 3-2, Thermal Limits',
    source_url: null,

    title: 'Motor Coolant Inlet Temperature Limit',
    description: 'Motor cooling circuit inlet temperature must not exceed specified limit to maintain winding insulation life and prevent thermal derating.',

    requirement_text: 'Coolant inlet temperature shall not exceed 65°C during continuous operation. Peak temperature of 75°C permitted for maximum 10 minutes per hour.',
    acceptance_criteria: 'Thermal analysis predicts max inlet temp <60°C at peak ambient. Test validates inlet temp <65°C under worst-case duty cycle.',
    verification_method: 'analysis_and_test',

    owning_party: OWNING_PARTY.SUPPLIER,
    change_authority: CHANGE_AUTHORITY.SUPPLIER_ONLY,
    applicability_scope: APPLICABILITY_SCOPE.DOWNSTREAM_PROPAGATION,
    termination_rule: null,

    linked_node_id: 'EBUS1-PR-200',
    linked_node_revision_id: 'rev-motor-a',

    risk_level: RISK_LEVEL.HIGH,
    validation_status: VALIDATION_STATUS.VALIDATED,
    validated_by: 'user-003',
    validated_at: '2024-09-01T10:00:00Z',
    validation_evidence: ['test-thermal-001', 'analysis-thermal-cfd-001'],

    created_by: 'user-001',
    created_at: '2024-02-01T11:00:00Z',
    updated_at: '2024-09-01T10:00:00Z'
  },
  {
    id: 'sreq-motor-mount-torque-001',
    project_id: 'proj-ebus-gen1',
    requirement_origin: REQUIREMENT_ORIGIN.SUPPLIER,
    source_type: SOURCE_TYPE.SUPPLIER_DOC,
    source_title: 'ELFA Traction Motor Installation Manual',
    source_revision: 'IM-1TB2-R3',
    source_section: 'Section 5.3 Mounting Hardware',
    source_url: null,

    title: 'Motor Mount Bolt Torque Specification',
    description: 'Motor mounting bolts must be torqued to specification to ensure proper load transfer and prevent fastener fatigue.',

    requirement_text: 'M12x1.75 Grade 10.9 mounting bolts shall be torqued to 110 ± 5 Nm with Loctite 243 thread locker. Re-torque after 100 hours of operation.',
    acceptance_criteria: 'Assembly procedure documents torque spec. Production records show torque compliance. Service manual includes re-torque interval.',
    verification_method: 'inspection',

    owning_party: OWNING_PARTY.SUPPLIER,
    change_authority: CHANGE_AUTHORITY.SHARED,
    applicability_scope: APPLICABILITY_SCOPE.NODE_ONLY,
    termination_rule: null,

    linked_node_id: 'EBUS1-PR-210',
    linked_node_revision_id: 'rev-mount-a',

    risk_level: RISK_LEVEL.MEDIUM,
    validation_status: VALIDATION_STATUS.VALIDATED,
    validated_by: 'user-002',
    validated_at: '2024-07-20T09:00:00Z',
    validation_evidence: ['sop-motor-assembly-001'],

    created_by: 'user-001',
    created_at: '2024-02-05T10:00:00Z',
    updated_at: '2024-07-20T09:00:00Z'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Inverter Requirements
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sreq-inverter-coolant-001',
    project_id: 'proj-ebus-gen1',
    requirement_origin: REQUIREMENT_ORIGIN.SUPPLIER,
    source_type: SOURCE_TYPE.SUPPLIER_DOC,
    source_title: 'CO150 Coolant System Requirements',
    source_revision: 'AN-COOL-002',
    source_section: 'Table 2-1',
    source_url: null,

    title: 'Inverter Minimum Coolant Flow Rate',
    description: 'Inverter requires minimum coolant flow to prevent IGBT junction overtemperature and thermal shutdown.',

    requirement_text: 'Coolant flow rate shall be minimum 12 LPM at inverter inlet with 50/50 ethylene glycol/water mixture. Flow rate shall be maintained at all operating conditions including pump degradation.',
    acceptance_criteria: 'System design flow rate >15 LPM nominal to provide margin. Flow sensor installed with low-flow fault logic.',
    verification_method: 'analysis_and_test',

    owning_party: OWNING_PARTY.SUPPLIER,
    change_authority: CHANGE_AUTHORITY.SUPPLIER_ONLY,
    applicability_scope: APPLICABILITY_SCOPE.DOWNSTREAM_PROPAGATION,
    termination_rule: null,

    linked_node_id: 'EBUS1-EL-200',
    linked_node_revision_id: 'rev-inverter-a',

    risk_level: RISK_LEVEL.HIGH,
    validation_status: VALIDATION_STATUS.VALIDATED,
    validated_by: 'user-003',
    validated_at: '2024-08-20T14:00:00Z',
    validation_evidence: ['test-cooling-flow-001', 'analysis-thermal-system-001'],

    created_by: 'user-001',
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-08-20T14:00:00Z'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Battery Requirements
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sreq-battery-temp-001',
    project_id: 'proj-ebus-gen1',
    requirement_origin: REQUIREMENT_ORIGIN.SUPPLIER,
    source_type: SOURCE_TYPE.SUPPLIER_DOC,
    source_title: 'Battery Module Thermal Management Requirements',
    source_revision: 'TM-2024-001',
    source_section: 'Section 3.1 Operating Envelope',
    source_url: null,

    title: 'Battery Cell Operating Temperature Range',
    description: 'Battery cells must operate within specified temperature envelope to maintain capacity, cycle life, and safety.',

    requirement_text: 'Cell temperature shall be maintained between 15°C and 45°C during charging and discharging. Temperature gradient across pack shall not exceed 5°C.',
    acceptance_criteria: 'Thermal management system maintains cell temps within range under all duty cycles. BMS monitors and enforces limits.',
    verification_method: 'analysis_and_test',

    owning_party: OWNING_PARTY.SUPPLIER,
    change_authority: CHANGE_AUTHORITY.SUPPLIER_ONLY,
    applicability_scope: APPLICABILITY_SCOPE.DOWNSTREAM_PROPAGATION,
    termination_rule: null,

    linked_node_id: 'EBUS1-EL-100',
    linked_node_revision_id: 'rev-battery-a',

    risk_level: RISK_LEVEL.HIGH,
    validation_status: VALIDATION_STATUS.VALIDATED,
    validated_by: 'user-003',
    validated_at: '2024-09-10T11:00:00Z',
    validation_evidence: ['test-battery-thermal-001', 'analysis-battery-thermal-001'],

    created_by: 'user-001',
    created_at: '2024-02-15T10:00:00Z',
    updated_at: '2024-09-10T11:00:00Z'
  },
  {
    id: 'sreq-battery-vibration-001',
    project_id: 'proj-ebus-gen1',
    requirement_origin: REQUIREMENT_ORIGIN.SUPPLIER,
    source_type: SOURCE_TYPE.SUPPLIER_DOC,
    source_title: 'LFP Module Series Product Specification',
    source_revision: 'LFP-MOD-V4',
    source_section: 'Section 7.2 Mechanical Limits',
    source_url: null,

    title: 'Battery Module Vibration Exposure Limit',
    description: 'Battery modules have vibration exposure limits to prevent cell tab fatigue and internal connection damage.',

    requirement_text: 'Random vibration exposure shall not exceed 2.0 Grms (20-2000 Hz) for module life. Peak shock shall not exceed 15g for 11ms half-sine.',
    acceptance_criteria: 'Mount system and enclosure attenuate road input to <1.5 Grms at module interface. Shock isolation limits peak to <12g.',
    verification_method: 'analysis_and_test',

    owning_party: OWNING_PARTY.SUPPLIER,
    change_authority: CHANGE_AUTHORITY.SUPPLIER_ONLY,
    applicability_scope: APPLICABILITY_SCOPE.DOWNSTREAM_PROPAGATION,
    termination_rule: null,

    linked_node_id: 'EBUS1-EL-100',
    linked_node_revision_id: 'rev-battery-a',

    risk_level: RISK_LEVEL.HIGH,
    validation_status: VALIDATION_STATUS.VALIDATED,
    validated_by: 'user-002',
    validated_at: '2024-08-25T16:00:00Z',
    validation_evidence: ['test-battery-vibe-001', 'analysis-battery-vibe-001'],

    created_by: 'user-001',
    created_at: '2024-02-15T11:00:00Z',
    updated_at: '2024-08-25T16:00:00Z'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Mount Isolator Requirements
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sreq-isolator-load-001',
    project_id: 'proj-ebus-gen1',
    requirement_origin: REQUIREMENT_ORIGIN.SUPPLIER,
    source_type: SOURCE_TYPE.SUPPLIER_DOC,
    source_title: 'BTR Series Industrial Isolator Product Data',
    source_revision: 'PD-BTR-R2',
    source_section: 'Table 4 - Static Load Ratings',
    source_url: 'https://www.lord.com/products/btr-isolators',

    title: 'Isolator Static Load Capacity',
    description: 'Motor mount isolators must not be loaded beyond rated capacity to maintain isolation performance and durability.',

    requirement_text: 'Static load per isolator shall not exceed 450 lbf (2000 N) in any axis. Combined load shall not exceed 550 lbf (2450 N).',
    acceptance_criteria: 'Motor + bracket weight distributed across 4 isolators results in max 400 lbf per isolator with 3g shock factor.',
    verification_method: 'analysis',

    owning_party: OWNING_PARTY.SUPPLIER,
    change_authority: CHANGE_AUTHORITY.SUPPLIER_ONLY,
    applicability_scope: APPLICABILITY_SCOPE.NODE_ONLY,
    termination_rule: null,

    linked_node_id: 'EBUS1-PR-211',
    linked_node_revision_id: 'rev-isolator-a',

    risk_level: RISK_LEVEL.MEDIUM,
    validation_status: VALIDATION_STATUS.VALIDATED,
    validated_by: 'user-002',
    validated_at: '2024-06-15T10:00:00Z',
    validation_evidence: ['analysis-isolator-load-001'],

    created_by: 'user-001',
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z'
  }
];

// =============================================================================
// SUPPLIER REQUIREMENT LINKS (Excerpts from Source Documents)
// =============================================================================

export const DEMO_SUPPLIER_REQUIREMENT_LINKS = [
  {
    id: 'link-motor-vibe-001',
    supplier_source_id: 'src-siemens-motor-appnote',
    requirement_id: 'sreq-motor-vibration-001',
    quoted_excerpt: 'Mount system shall avoid excitation bands of 45-65 Hz (1st harmonic) and 120-150 Hz (2nd harmonic) with minimum 15% frequency separation to prevent resonance amplification.',
    interpretation_notes: 'Interpreted as requiring modal analysis to confirm mount system natural frequencies. First mode must be below 40 Hz or above 70 Hz. Second mode must avoid 120-150 Hz band.',
    created_by: 'user-001',
    created_at: '2024-02-01T10:30:00Z'
  },
  {
    id: 'link-motor-thermal-001',
    supplier_source_id: 'src-siemens-motor-datasheet',
    requirement_id: 'sreq-motor-thermal-001',
    quoted_excerpt: 'Coolant inlet temperature: Max continuous 65°C, Max intermittent 75°C (10 min/hr max). Operation above limits will result in thermal derating or protective shutdown.',
    interpretation_notes: 'System must maintain inlet temp below 60°C at peak ambient (45°C) to provide 5°C margin. Requires adequately sized radiator and controlled coolant flow.',
    created_by: 'user-001',
    created_at: '2024-02-01T11:30:00Z'
  },
  {
    id: 'link-inverter-flow-001',
    supplier_source_id: 'src-dana-inverter-cooling',
    requirement_id: 'sreq-inverter-coolant-001',
    quoted_excerpt: 'Minimum coolant flow: 12 LPM. Coolant type: 50/50 ethylene glycol/deionized water. Failure to maintain minimum flow will result in IGBT overtemperature fault.',
    interpretation_notes: 'Design for 15 LPM nominal to provide margin for pump wear and filter restriction. Install flow sensor with fault logic at 13 LPM threshold.',
    created_by: 'user-001',
    created_at: '2024-02-10T10:30:00Z'
  },
  {
    id: 'link-battery-temp-001',
    supplier_source_id: 'src-catl-battery-thermal',
    requirement_id: 'sreq-battery-temp-001',
    quoted_excerpt: 'Operating temperature range: 15°C to 45°C (charge/discharge). Temperature uniformity: ΔT ≤ 5°C across pack. Operation outside range reduces cycle life and may trigger safety faults.',
    interpretation_notes: 'Requires active thermal management with both heating (cold soak) and cooling (high power). BMS must enforce limits and log excursions.',
    created_by: 'user-001',
    created_at: '2024-02-15T10:30:00Z'
  },
  {
    id: 'link-battery-vibe-001',
    supplier_source_id: 'src-catl-battery-datasheet',
    requirement_id: 'sreq-battery-vibration-001',
    quoted_excerpt: 'Vibration limit: 2.0 Grms random (20-2000 Hz) for rated life. Shock limit: 15g, 11ms half-sine. Exceeding limits may cause cell tab fatigue and internal connection failure.',
    interpretation_notes: 'Mount system must attenuate road vibration input. Target <1.5 Grms at module interface for margin. Include rubber isolation in enclosure mounting.',
    created_by: 'user-001',
    created_at: '2024-02-15T11:30:00Z'
  }
];

// =============================================================================
// REQUIREMENT PROPAGATION LINKS
// =============================================================================

export const DEMO_PROPAGATION_LINKS = [
  // Motor vibration requirement propagates to motor mount bracket
  {
    id: 'prop-motor-vibe-to-bracket',
    requirement_id: 'sreq-motor-vibration-001',
    from_node_id: 'EBUS1-PR-200',
    to_node_id: 'EBUS1-PR-210',
    propagation_reason: PROPAGATION_REASON.LOAD_PATH,
    termination: false,
    termination_justification: null,
    created_by: 'user-001',
    created_at: '2024-02-05T10:00:00Z',
    approved_by: 'user-002',
    approved_at: '2024-02-06T09:00:00Z'
  },
  // Motor vibration requirement propagates to frame rail
  {
    id: 'prop-motor-vibe-to-frame',
    requirement_id: 'sreq-motor-vibration-001',
    from_node_id: 'EBUS1-PR-210',
    to_node_id: 'EBUS1-CH-110',
    propagation_reason: PROPAGATION_REASON.LOAD_PATH,
    termination: true,
    termination_justification: 'Vibration isolation provided by LORD BTR isolators. Frame sees attenuated loads. Modal analysis confirms frame modes are not excited. Propagation terminated at isolator interface.',
    created_by: 'user-001',
    created_at: '2024-02-05T11:00:00Z',
    approved_by: 'user-002',
    approved_at: '2024-02-06T10:00:00Z'
  },
  // Motor thermal requirement propagates to cooling system
  {
    id: 'prop-motor-thermal-to-cooling',
    requirement_id: 'sreq-motor-thermal-001',
    from_node_id: 'EBUS1-PR-200',
    to_node_id: 'EBUS1-TM-100',
    propagation_reason: PROPAGATION_REASON.INTERFACE,
    termination: false,
    termination_justification: null,
    created_by: 'user-001',
    created_at: '2024-02-05T12:00:00Z',
    approved_by: 'user-003',
    approved_at: '2024-02-06T11:00:00Z'
  },
  // Battery thermal requirement propagates to battery cooling loop
  {
    id: 'prop-battery-thermal-to-cooling',
    requirement_id: 'sreq-battery-temp-001',
    from_node_id: 'EBUS1-EL-100',
    to_node_id: 'EBUS1-TM-200',
    propagation_reason: PROPAGATION_REASON.INTERFACE,
    termination: false,
    termination_justification: null,
    created_by: 'user-001',
    created_at: '2024-02-15T12:00:00Z',
    approved_by: 'user-003',
    approved_at: '2024-02-16T09:00:00Z'
  },
  // Battery vibration requirement propagates to battery enclosure
  {
    id: 'prop-battery-vibe-to-enclosure',
    requirement_id: 'sreq-battery-vibration-001',
    from_node_id: 'EBUS1-EL-100',
    to_node_id: 'EBUS1-EL-111',
    propagation_reason: PROPAGATION_REASON.LOAD_PATH,
    termination: false,
    termination_justification: null,
    created_by: 'user-001',
    created_at: '2024-02-15T13:00:00Z',
    approved_by: 'user-002',
    approved_at: '2024-02-16T10:00:00Z'
  }
];

// =============================================================================
// ASSUMPTION RISK ITEMS (Spawned from Supplier Requirements)
// =============================================================================

export const DEMO_SUPPLIER_ASSUMPTIONS = [
  {
    id: 'assume-motor-duty-001',
    project_id: 'proj-ebus-gen1',
    node_id: 'EBUS1-PR-200',
    spawned_from_requirement_id: 'sreq-motor-thermal-001',

    title: 'Motor Duty Cycle Assumption',
    description: 'Motor thermal analysis assumes urban transit duty cycle with maximum 30 minutes of continuous full-power operation followed by 10 minute reduced-power segments.',

    assumption_type: 'usage',
    risk_level: RISK_LEVEL.MEDIUM,
    status: 'validated',

    basis: 'Urban transit operational profile from customer route data. Peak power demand limited by route topology and speed limits.',
    validation_evidence: 'Route simulation and thermal analysis confirms duty cycle assumption. Field data collection planned for validation.',

    created_by: 'user-001',
    created_at: '2024-02-01T14:00:00Z',
    last_reviewed_at: '2024-08-15T10:00:00Z',
    reviewed_by: 'user-003'
  },
  {
    id: 'assume-ambient-temp-001',
    project_id: 'proj-ebus-gen1',
    node_id: 'EBUS1-TM-100',
    spawned_from_requirement_id: 'sreq-motor-thermal-001',

    title: 'Ambient Temperature Envelope Assumption',
    description: 'Thermal system designed for ambient temperature range of -20°C to +45°C. Peak solar load assumed at 1000 W/m².',

    assumption_type: 'environment',
    risk_level: RISK_LEVEL.HIGH,
    status: 'validated',

    basis: 'Customer specification for North American transit operations. Covers 99th percentile weather conditions in target markets.',
    validation_evidence: 'Environmental chamber testing completed at temperature extremes. Solar load simulation verified.',

    created_by: 'user-001',
    created_at: '2024-02-05T10:00:00Z',
    last_reviewed_at: '2024-09-01T14:00:00Z',
    reviewed_by: 'user-003'
  },
  {
    id: 'assume-road-input-001',
    project_id: 'proj-ebus-gen1',
    node_id: 'EBUS1-EL-100',
    spawned_from_requirement_id: 'sreq-battery-vibration-001',

    title: 'Road Vibration Input Spectrum Assumption',
    description: 'Battery vibration analysis uses road input spectrum derived from city transit routes. Assumes well-maintained roads with occasional potholes.',

    assumption_type: 'environment',
    risk_level: RISK_LEVEL.MEDIUM,
    status: 'validated',

    basis: 'Road surface PSD data collected from target transit routes using accelerometer-equipped test vehicle.',
    validation_evidence: 'Route survey data processed to create input spectrum. Conservative envelope applied with 1.5x factor.',

    created_by: 'user-001',
    created_at: '2024-02-15T15:00:00Z',
    last_reviewed_at: '2024-08-25T11:00:00Z',
    reviewed_by: 'user-002'
  }
];

// =============================================================================
// ANALYSIS ARTIFACTS (Referencing Supplier Requirements)
// =============================================================================

export const DEMO_SUPPLIER_ANALYSES = [
  {
    id: 'analysis-motor-fea-001',
    project_id: 'proj-ebus-gen1',
    node_id: 'EBUS1-PR-210',
    title: 'Motor Mount Bracket Modal Analysis',
    type: 'modal_analysis',
    status: 'completed',

    linked_supplier_requirements: ['sreq-motor-vibration-001'],
    linked_assumptions: ['assume-road-input-001'],

    summary: 'Modal analysis of motor mount bracket assembly confirms first mode at 32 Hz (below 45 Hz excitation band). Second mode at 98 Hz (between excitation bands). Minimum 15% separation achieved.',

    results: {
      first_mode_hz: 32,
      second_mode_hz: 98,
      third_mode_hz: 156,
      margin_to_excitation_1: '29% below 45 Hz',
      margin_to_excitation_2: '35% below 120 Hz'
    },

    artifact_url: 'org-ebus/analyses/motor-mount-modal-fea-001.pdf',
    created_by: 'user-002',
    created_at: '2024-05-15T10:00:00Z',
    approved_by: 'user-003',
    approved_at: '2024-05-20T14:00:00Z'
  },
  {
    id: 'analysis-thermal-cfd-001',
    project_id: 'proj-ebus-gen1',
    node_id: 'EBUS1-TM-100',
    title: 'Motor Cooling Loop Thermal CFD Analysis',
    type: 'thermal_analysis',
    status: 'completed',

    linked_supplier_requirements: ['sreq-motor-thermal-001'],
    linked_assumptions: ['assume-motor-duty-001', 'assume-ambient-temp-001'],

    summary: 'CFD thermal analysis predicts motor coolant inlet temperature of 58°C at peak ambient (45°C) with full duty cycle. 7°C margin to 65°C limit maintained.',

    results: {
      peak_inlet_temp_c: 58,
      limit_temp_c: 65,
      margin_c: 7,
      ambient_condition_c: 45,
      flow_rate_lpm: 16
    },

    artifact_url: 'org-ebus/analyses/motor-thermal-cfd-001.pdf',
    created_by: 'user-003',
    created_at: '2024-06-01T10:00:00Z',
    approved_by: 'user-002',
    approved_at: '2024-06-05T11:00:00Z'
  },
  {
    id: 'analysis-battery-vibe-001',
    project_id: 'proj-ebus-gen1',
    node_id: 'EBUS1-EL-100',
    title: 'Battery Pack Vibration Transmissibility Analysis',
    type: 'vibration_analysis',
    status: 'completed',

    linked_supplier_requirements: ['sreq-battery-vibration-001'],
    linked_assumptions: ['assume-road-input-001'],

    summary: 'Random vibration analysis predicts 1.2 Grms at battery module interface from 2.5 Grms road input. Isolation mount system provides 52% attenuation. Well within 2.0 Grms limit.',

    results: {
      input_grms: 2.5,
      output_grms: 1.2,
      limit_grms: 2.0,
      attenuation_percent: 52,
      margin_percent: 40
    },

    artifact_url: 'org-ebus/analyses/battery-vibe-analysis-001.pdf',
    created_by: 'user-002',
    created_at: '2024-06-15T10:00:00Z',
    approved_by: 'user-003',
    approved_at: '2024-06-20T09:00:00Z'
  }
];

// =============================================================================
// TEST CASES (Validating Supplier Requirements)
// =============================================================================

export const DEMO_SUPPLIER_TESTS = [
  {
    id: 'test-motor-modal-001',
    project_id: 'proj-ebus-gen1',
    node_id: 'EBUS1-PR-210',
    title: 'Motor Mount Modal Verification Test',
    type: 'modal_test',
    status: 'passed',

    linked_supplier_requirements: ['sreq-motor-vibration-001'],
    validates_analyses: ['analysis-motor-fea-001'],

    description: 'Impact hammer modal test to verify mount system natural frequencies against analysis predictions and supplier excitation band avoidance requirements.',

    acceptance_criteria: 'First mode <40 Hz or >70 Hz. Second mode avoids 120-150 Hz band with >15% separation.',

    results: {
      first_mode_hz: 34,
      second_mode_hz: 102,
      first_mode_predicted_hz: 32,
      second_mode_predicted_hz: 98,
      correlation_error_percent: 6
    },

    test_date: '2024-08-10',
    test_report_url: 'org-ebus/tests/motor-modal-test-001.pdf',
    executed_by: 'user-002',
    approved_by: 'user-003',
    approved_at: '2024-08-15T14:00:00Z'
  },
  {
    id: 'test-thermal-001',
    project_id: 'proj-ebus-gen1',
    node_id: 'EBUS1-TM-100',
    title: 'Motor Cooling System Thermal Validation Test',
    type: 'thermal_test',
    status: 'passed',

    linked_supplier_requirements: ['sreq-motor-thermal-001', 'sreq-inverter-coolant-001'],
    validates_analyses: ['analysis-thermal-cfd-001'],

    description: 'Thermal chamber test of complete cooling system under simulated duty cycle at peak ambient temperature.',

    acceptance_criteria: 'Motor coolant inlet <65°C continuous. Inverter flow >12 LPM maintained.',

    results: {
      motor_inlet_peak_c: 61,
      motor_inlet_limit_c: 65,
      inverter_flow_lpm: 15.2,
      inverter_flow_min_lpm: 12,
      ambient_test_c: 45,
      duration_hours: 8
    },

    test_date: '2024-08-28',
    test_report_url: 'org-ebus/tests/thermal-validation-001.pdf',
    executed_by: 'user-003',
    approved_by: 'user-002',
    approved_at: '2024-09-01T10:00:00Z'
  },
  {
    id: 'test-battery-vibe-001',
    project_id: 'proj-ebus-gen1',
    node_id: 'EBUS1-EL-100',
    title: 'Battery Pack Random Vibration Test',
    type: 'vibration_test',
    status: 'passed',

    linked_supplier_requirements: ['sreq-battery-vibration-001'],
    validates_analyses: ['analysis-battery-vibe-001'],

    description: 'Shaker table random vibration test of battery pack assembly per supplier specification and derived road input profile.',

    acceptance_criteria: 'Module interface <2.0 Grms. No cell tab failures or connection loosening after test.',

    results: {
      input_grms: 2.8,
      module_interface_grms: 1.4,
      limit_grms: 2.0,
      post_test_inspection: 'Pass - no damage observed',
      cell_resistance_change_percent: 0.2
    },

    test_date: '2024-08-20',
    test_report_url: 'org-ebus/tests/battery-vibe-test-001.pdf',
    executed_by: 'user-002',
    approved_by: 'user-003',
    approved_at: '2024-08-25T16:00:00Z'
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all supplier requirements for a project
 */
export const getSupplierRequirementsByProject = (projectId) =>
  DEMO_SUPPLIER_REQUIREMENTS.filter(req => req.project_id === projectId);

/**
 * Get supplier requirements for a specific node
 */
export const getSupplierRequirementsByNode = (nodeId) =>
  DEMO_SUPPLIER_REQUIREMENTS.filter(req => req.linked_node_id === nodeId);

/**
 * Get supplier requirements by validation status
 */
export const getSupplierRequirementsByStatus = (status) =>
  DEMO_SUPPLIER_REQUIREMENTS.filter(req => req.validation_status === status);

/**
 * Get violated supplier requirements (blocks release)
 */
export const getViolatedSupplierRequirements = () =>
  DEMO_SUPPLIER_REQUIREMENTS.filter(req => req.validation_status === VALIDATION_STATUS.VIOLATED);

/**
 * Get unvalidated high-risk supplier requirements
 */
export const getUnvalidatedHighRiskRequirements = () =>
  DEMO_SUPPLIER_REQUIREMENTS.filter(
    req => req.validation_status === VALIDATION_STATUS.UNVALIDATED && req.risk_level === RISK_LEVEL.HIGH
  );

/**
 * Get propagation links for a requirement
 */
export const getPropagationLinksForRequirement = (requirementId) =>
  DEMO_PROPAGATION_LINKS.filter(link => link.requirement_id === requirementId);

/**
 * Get propagated requirements for a node (requirements from upstream)
 */
export const getPropagatedRequirementsForNode = (nodeId) => {
  const propagationLinks = DEMO_PROPAGATION_LINKS.filter(
    link => link.to_node_id === nodeId && !link.termination
  );
  return propagationLinks.map(link =>
    DEMO_SUPPLIER_REQUIREMENTS.find(req => req.id === link.requirement_id)
  ).filter(Boolean);
};

/**
 * Get supplier source by ID
 */
export const getSupplierSourceById = (sourceId) =>
  DEMO_SUPPLIER_SOURCES.find(source => source.id === sourceId);

/**
 * Get supplier requirement link (excerpt) for a requirement
 */
export const getRequirementLink = (requirementId) =>
  DEMO_SUPPLIER_REQUIREMENT_LINKS.find(link => link.requirement_id === requirementId);

/**
 * Get assumptions spawned from a supplier requirement
 */
export const getAssumptionsForRequirement = (requirementId) =>
  DEMO_SUPPLIER_ASSUMPTIONS.filter(a => a.spawned_from_requirement_id === requirementId);

/**
 * Get analyses linked to a supplier requirement
 */
export const getAnalysesForRequirement = (requirementId) =>
  DEMO_SUPPLIER_ANALYSES.filter(a => a.linked_supplier_requirements.includes(requirementId));

/**
 * Get tests validating a supplier requirement
 */
export const getTestsForRequirement = (requirementId) =>
  DEMO_SUPPLIER_TESTS.filter(t => t.linked_supplier_requirements.includes(requirementId));

/**
 * Check if node has any supplier constraints (direct or propagated)
 */
export const nodeHasSupplierConstraints = (nodeId) => {
  const directRequirements = getSupplierRequirementsByNode(nodeId);
  const propagatedRequirements = getPropagatedRequirementsForNode(nodeId);
  return directRequirements.length > 0 || propagatedRequirements.length > 0;
};

/**
 * Get supplier constraint status for a node (for tree view icon)
 */
export const getNodeSupplierConstraintStatus = (nodeId) => {
  const directRequirements = getSupplierRequirementsByNode(nodeId);
  const propagatedRequirements = getPropagatedRequirementsForNode(nodeId);
  const allRequirements = [...directRequirements, ...propagatedRequirements];

  if (allRequirements.length === 0) return null;

  const hasViolated = allRequirements.some(r => r.validation_status === VALIDATION_STATUS.VIOLATED);
  if (hasViolated) return 'violated';

  const hasUnvalidated = allRequirements.some(r => r.validation_status === VALIDATION_STATUS.UNVALIDATED);
  if (hasUnvalidated) return 'unvalidated';

  const allValidated = allRequirements.every(r => r.validation_status === VALIDATION_STATUS.VALIDATED);
  if (allValidated) return 'validated';

  return 'present';
};

/**
 * Get supplier constraint summary for a node
 */
export const getNodeSupplierConstraintSummary = (nodeId) => {
  const directRequirements = getSupplierRequirementsByNode(nodeId);
  const propagatedRequirements = getPropagatedRequirementsForNode(nodeId);

  return {
    directCount: directRequirements.length,
    propagatedCount: propagatedRequirements.length,
    totalCount: directRequirements.length + propagatedRequirements.length,
    validatedCount: [...directRequirements, ...propagatedRequirements]
      .filter(r => r.validation_status === VALIDATION_STATUS.VALIDATED).length,
    violatedCount: [...directRequirements, ...propagatedRequirements]
      .filter(r => r.validation_status === VALIDATION_STATUS.VIOLATED).length,
    status: getNodeSupplierConstraintStatus(nodeId)
  };
};
