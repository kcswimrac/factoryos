import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  FlaskConical,
  PenTool,
  ClipboardList,
  BarChart3,
  Building2,
  Calendar,
  Package,
  Clock,
  Wrench,
  Users,
  Layers,
  AlertTriangle,
  Target,
  Cog,
  Truck,
  ListChecks,
  FileText,
  Lightbulb,
  Box,
  Calculator,
  Settings,
  HeartPulse,
  TestTube2,
  ChevronRight,
  X
} from 'lucide-react';
import MarketingHeader from './components/MarketingHeader';

const FactoryOSLanding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Early Access form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    organization: '',
    teamName: '',
    email: '',
    secondaryEmail: '',
    secondaryName: '',
    secondaryRole: '',
    voucherCode: ''
  });
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Open modal with voucher pre-filled from URL param
  useEffect(() => {
    const voucherParam = searchParams.get('voucher');
    if (voucherParam) {
      setFormData(prev => ({ ...prev, voucherCode: voucherParam }));
      setShowModal(true);
    }
  }, [searchParams]);

  const handleFormChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Early access form handler - saves to MySQL database
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('Sending...');

    try {
      // Submit to backend API (MySQL database)
      // Uses relative URL - works on Vercel (same domain) and locally with proxy
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          email: formData.email,
          organization: formData.organization,
          teamName: formData.teamName,
          secondaryName: formData.secondaryName,
          secondaryRole: formData.secondaryRole,
          secondaryEmail: formData.secondaryEmail,
          voucherCode: formData.voucherCode
        })
      });

      const data = await response.json();

      if (data.success) {
        // Also send email notification via web3forms
        const emailData = new FormData();
        emailData.append('access_key', '71410425-89f6-4094-b387-361c001bdad0');
        emailData.append('subject', data.voucherValid
          ? 'Factory-OS Voucher Claimed!'
          : 'Factory-OS Early Access Request');
        emailData.append('from_name', formData.name);
        emailData.append('email', formData.email);
        emailData.append('message', `
${data.voucherValid ? 'VOUCHER CLAIMED' : 'NEW ACCESS REQUEST'}

PRIMARY CONTACT
Name: ${formData.name}
Role: ${formData.role || 'Not specified'}
Email: ${formData.email}
Phone: ${formData.phone || 'Not specified'}

ORGANIZATION
Company/University: ${formData.organization || 'Not specified'}
Team/Group Name: ${formData.teamName || 'Not specified'}

SECONDARY CONTACT
Name: ${formData.secondaryName || 'Not specified'}
Role: ${formData.secondaryRole || 'Not specified'}
Email: ${formData.secondaryEmail || 'Not specified'}

VOUCHER CODE: ${formData.voucherCode || 'None'}
VOUCHER VALID: ${data.voucherValid ? 'Yes' : 'No'}
        `.trim());

        // Fire and forget email notification
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: emailData
        }).catch(() => {});

        setSubmitStatus(data.message);
        setFormSubmitted(true);
        setFormData({
          name: '',
          role: '',
          phone: '',
          organization: '',
          teamName: '',
          email: '',
          secondaryEmail: '',
          secondaryName: '',
          secondaryRole: '',
          voucherCode: ''
        });
      } else {
        setSubmitStatus(data.error || 'Something went wrong. Try again.');
      }
    } catch {
      setSubmitStatus('Network error. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Featured modules - Available Now
  const featuredModules = [
    {
      icon: PenTool,
      title: 'Engineering Design Manager',
      description: 'A structured system for organizing engineering projects from top-level systems down to individual parts and components.',
      features: [
        'Hierarchical system, subsystem, and component breakdown',
        'Built-in part numbering generator',
        'Design documentation tied to each node',
        'Supports structured development instead of scattered files'
      ],
      path: '/design'
    },
    {
      icon: FlaskConical,
      title: 'DOE Manager',
      description: 'Plan, track, and review Design of Experiments in a more structured way than disconnected spreadsheets and notes.',
      features: [
        'Define factors, variables, and runs',
        'Capture results and observations',
        'Maintain experiment history',
        'Connect testing back to engineering decisions'
      ],
      path: '/doe'
    },
    {
      icon: ClipboardList,
      title: 'SOP Generator / Manager',
      description: 'Create and manage standardized procedures for assembly, testing, fabrication, and repeatable shop workflows.',
      features: [
        'Structured SOP templates',
        'Revision and change tracking',
        'Process documentation linked to systems and parts',
        'Better repeatability for teams and growing organizations'
      ],
      path: '/sops'
    }
  ];

  // 7-Phase Engineering Design Cycle (matches Design Module)
  const designCycleSteps = [
    {
      step: 1,
      icon: FileText,
      name: 'Define Requirements',
      description: 'Establish clear, measurable specifications with unique IDs and acceptance criteria.'
    },
    {
      step: 2,
      icon: Lightbulb,
      name: 'Research & Development',
      description: 'Investigate existing solutions, search the knowledge base, and identify technical risks.'
    },
    {
      step: 3,
      icon: Box,
      name: 'Design',
      description: 'CAD models, serviceability analysis, and manufacturability review (DFM).',
      hasSubPhases: true
    },
    {
      step: 4,
      icon: Calculator,
      name: 'Data Collection',
      description: 'Gather load cases, material properties, and assumptions for engineering analysis.'
    },
    {
      step: 5,
      icon: Target,
      name: 'Analysis / CAE',
      description: 'Verify design through FEA, hand calculations, and margin of safety checks.'
    },
    {
      step: 6,
      icon: TestTube2,
      name: 'Testing / Validation',
      description: 'Physically validate through testing with requirement traceability.'
    },
    {
      step: 7,
      icon: Layers,
      name: 'Correlation',
      description: 'Compare analysis to test results, update knowledge base, and complete release.'
    }
  ];

  // Coming soon modules
  const comingSoonModules = [
    { icon: AlertTriangle, name: 'Quality Management', status: 'Coming Soon' },
    { icon: BarChart3, name: 'Reporting', status: 'In Development' },
    { icon: Building2, name: 'Executive Dashboard', status: 'Coming Soon' },
    { icon: Calendar, name: 'Timeline', status: 'In Development' },
    { icon: Package, name: 'Resources / Inventory', status: 'Coming Soon' },
    { icon: Truck, name: 'Procurement', status: 'Coming Soon' },
    { icon: Cog, name: 'Manufacturing Execution', status: 'Coming Soon' },
    { icon: ListChecks, name: 'Task / Team Coordination', status: 'Coming Soon' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#F0F2F4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />
      <div className="relative z-[1]">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-[900px] mx-auto relative">
          {/* Early Access Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-400 font-medium" style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase' }}>For Hardware Engineering Teams</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#F0F2F4] mb-8 leading-[1.05]" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-2px' }}>
            Good engineers.<br /><span className="text-emerald-500">Undisciplined process.</span>
          </h1>
          <p className="text-xl text-[#a1a1aa] mb-8 max-w-[600px] leading-[1.7]">
            Factory-OS enforces engineering rigor — phase gating, structured experiments, versioned SOPs. Not another place to store files. A system that teaches and holds your team to the process.
          </p>

          {/* CTA Block */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => setShowModal(true)}
              className="group bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 flex items-center justify-center hover:scale-105"
            >
              Join Early Access
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </button>
            <button
              onClick={() => {
                document.getElementById('featured-modules')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#1C1F24] border border-[#2A2F36] text-[#F0F2F4] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#22262C] hover:border-emerald-500/40 transition flex items-center justify-center"
            >
              See Featured Modules
            </button>
          </div>

          {/* Early access note */}
          <p className="text-sm text-[#6B7280] mb-12">
            Development is in progress. Early users help shape the platform.
          </p>

          {/* Quick CTA to open form modal */}
          <div className="max-w-md mx-auto text-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-3 bg-[#15181C] border border-emerald-500/40 hover:border-emerald-500 text-emerald-400 rounded-xl font-semibold transition"
            >
              Request Early Access
            </button>
            <p className="mt-4 text-xs text-[#4B5563]">
              Built with Baja SAE, student design teams, and hardware programs in mind.
            </p>
          </div>
        </div>
      </section>

      {/* Current Focus Strip */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 border-y border-[#2A2F36] bg-[#15181C]/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <span className="text-sm text-[#6B7280] uppercase tracking-wide font-medium">Current Early-Access Focus:</span>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-sm font-medium">DOE</span>
              <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-sm font-medium">Design</span>
              <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-sm font-medium">SOPs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section with Stats */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-sm font-medium tracking-[3px] uppercase text-[#52525b] mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>The Problem</h2>
              <p className="text-2xl sm:text-3xl font-semibold leading-[1.4]" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>
                Most hardware failures trace back to <span className="text-emerald-500">design decisions</span> made without structure — no phase gates, no real experiments, no repeatable process.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { number: '70%', label: 'of product failures are rooted in decisions made in the first 10% of development' },
                { number: '3–5×', label: 'more design iterations than necessary without structured DOE' },
                { number: '$5K+', label: 'per seat for enterprise PLM — built for procurement, not engineering' },
                { number: '0', label: 'tools that enforce design methodology without requiring a consultant' }
              ].map((stat, i) => (
                <div key={i} className="bg-[#111111] border border-[#222222] rounded-xl p-6">
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-500 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.number}</div>
                  <div className="text-[13px] text-[#a1a1aa] leading-[1.5]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-none h-px mx-10" style={{ background: 'linear-gradient(90deg, transparent, #2e2e2e 20%, #2e2e2e 80%, transparent)' }} />

      {/* Three Pillars Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-16">
            <h2 className="text-sm font-medium tracking-[3px] uppercase text-[#52525b] mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Three Pillars</h2>
            <p className="text-3xl font-semibold max-w-[640px]" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>
              Engineering discipline has a shape. Factory-OS enforces it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] bg-[#222222] border border-[#222222] rounded-2xl overflow-hidden">
            {[
              {
                tag: '01 / RIGOR',
                title: 'Design Rigor',
                desc: 'Structured engineering lifecycle with enforced phase gating. Your design can\'t move forward until it\'s earned the right to — evidence required, not optional.',
                items: ['Concept → Feasibility → Detailed Design → Verification', 'Phase gate checklists tied to actual deliverables', 'No skipping phases without a documented exception', 'Full audit trail of design decisions and approvals']
              },
              {
                tag: '02 / DOE',
                title: 'Design of Experiments',
                desc: 'Real statistical studies, not gut-check prototypes. Run Full Factorial, Fractional Factorial, and Plackett-Burman studies with proper analysis built in.',
                items: ['Full Factorial & Fractional Factorial designs', 'Plackett-Burman for factor screening', 'Main effects, interactions, response surface', 'Outputs tied directly to design decisions']
              },
              {
                tag: '03 / SOPs',
                title: 'Standard Operating Procedures',
                desc: 'Version-controlled, repeatable procedures that live where the work happens. Not in a shared drive no one updates. Not in someone\'s head when they leave.',
                items: ['Versioned SOP library with change history', 'Linked directly to phases and experiments', 'Approval workflows for procedure changes', 'Execution logs when SOPs are followed']
              }
            ].map((pillar, i) => (
              <div key={i} className="bg-[#111111] p-10 hover:bg-[#181818] transition-colors duration-300">
                <span className="inline-block px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-emerald-500 text-[11px] tracking-[1px] mb-6" style={{ fontFamily: "'DM Mono', monospace" }}>{pillar.tag}</span>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>{pillar.title}</h3>
                <p className="text-[15px] text-[#a1a1aa] leading-[1.75] mb-6">{pillar.desc}</p>
                <ul className="flex flex-col gap-2.5">
                  {pillar.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-[12px] text-[#52525b] tracking-[0.3px]" style={{ fontFamily: "'DM Mono', monospace" }}>
                      <span className="text-emerald-700">→</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-none h-px mx-10" style={{ background: 'linear-gradient(90deg, transparent, #2e2e2e 20%, #2e2e2e 80%, transparent)' }} />

      {/* Featured Modules Section */}
      <section id="featured-modules" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F0F2F4] mb-4">
              Available Now in Early Development
            </h2>
            <p className="text-lg text-[#B4BAC4] max-w-2xl mx-auto">
              These three modules are our current development focus. They are functional and ready for early users to try.
            </p>
          </div>

          <div className="space-y-8">
            {featuredModules.map((module, index) => {
              const IconComponent = module.icon;
              return (
                <div
                  key={index}
                  className="bg-[#15181C] border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-8 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                    {/* Left: Header and Description */}
                    <div className="lg:w-1/3">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                          <IconComponent className="text-emerald-400" size={32} />
                        </div>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-medium">
                          Available Now
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-[#F0F2F4] mb-3">{module.title}</h3>
                      <p className="text-[#B4BAC4] mb-6">{module.description}</p>
                      <button
                        onClick={() => navigate(module.path)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center group transition"
                      >
                        Try {module.title.split(' ')[0]}
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                      </button>
                    </div>

                    {/* Right: Features */}
                    <div className="lg:w-2/3">
                      <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-3 font-medium">Capabilities</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {module.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start bg-[#1C1F24] rounded-lg p-3">
                            <Check className="text-emerald-400 mr-2 mt-0.5 flex-shrink-0" size={16} />
                            <span className="text-sm text-[#B4BAC4]">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7-Step Engineering Design Cycle Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0F1114] border-t border-[#2A2F36]">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F0F2F4] mb-4">
              Structured Engineering Design Cycle
            </h2>
            <p className="text-[#B4BAC4] max-w-3xl mx-auto leading-relaxed">
              Factory-OS organizes engineering development into a repeatable seven-step cycle so teams move from concept to validated hardware without losing traceability.
            </p>
            <p className="text-[#6B7280] max-w-2xl mx-auto mt-2 text-sm">
              Each design node progresses through the same lifecycle so requirements, analysis, testing, and documentation stay connected.
            </p>
          </div>

          {/* Design Cycle Timeline */}
          <div className="relative">
            {/* Connection Line - Desktop */}
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/20 via-emerald-500/40 to-emerald-500/20" />

            {/* Steps Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 lg:gap-2">
              {designCycleSteps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.step} className="relative group">
                    {/* Step Card */}
                    <div className="flex flex-col items-center text-center p-4 bg-[#15181C] border border-[#2A2F36] rounded-xl hover:border-emerald-500/40 transition-all duration-300 h-full">
                      {/* Step Number Badge */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10">
                        {step.step}
                      </div>

                      {/* Icon */}
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center mb-3 mt-2 group-hover:bg-emerald-500/20 transition-colors">
                        <IconComponent className="w-5 h-5 text-emerald-400" />
                      </div>

                      {/* Step Name */}
                      <h4 className="text-sm font-semibold text-[#F0F2F4] mb-2 leading-tight">
                        {step.name}
                      </h4>

                      {/* Sub-phases indicator for Phase 3 */}
                      {step.hasSubPhases && (
                        <div className="flex gap-1 mb-2">
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">CAD</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">DFS</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">DFM</span>
                        </div>
                      )}

                      {/* Description - Hidden on mobile, shown on hover for desktop */}
                      <p className="text-[11px] text-[#6B7280] leading-snug hidden sm:block">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow connector - Desktop only */}
                    {index < designCycleSteps.length - 1 && (
                      <div className="hidden lg:flex absolute top-12 -right-2 z-20">
                        <ChevronRight className="w-4 h-4 text-emerald-500/50" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supporting Text */}
          <div className="mt-12 text-center">
            <p className="text-[#B4BAC4] mb-4 max-w-2xl mx-auto">
              Phase 3 includes three sub-phases: CAD/Design, Serviceability (DFS), and Manufacturability (DFM) reviews before proceeding to analysis.
            </p>
            <p className="text-[#B4BAC4] mb-6 max-w-2xl mx-auto">
              Factory-OS connects this design cycle directly to requirements traceability, DOE experiments, test cases, and the correlation knowledge base.
            </p>
            <p className="text-sm text-[#6B7280] max-w-xl mx-auto">
              Every requirement is traced through analysis or test, with correlation factors captured to improve future designs.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium">
              Requirements Traceability
            </span>
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium">
              DFM + DFS Reviews
            </span>
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium">
              Analysis-Test Correlation
            </span>
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium">
              Knowledge Base Updates
            </span>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#15181C]/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F0F2F4] mb-4">
              More Modules in Development
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              These capabilities are on the roadmap. Early users will have input on priorities.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {comingSoonModules.map((module, index) => {
              const IconComponent = module.icon;
              return (
                <div
                  key={index}
                  className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-5 opacity-60 hover:opacity-80 transition"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-[#1C1F24] rounded-lg p-3 mb-3">
                      <IconComponent className="text-[#4B5563]" size={24} />
                    </div>
                    <h4 className="text-sm font-medium text-[#9CA3AF] mb-1">{module.name}</h4>
                    <span className="text-[10px] text-[#4B5563] uppercase tracking-wide">{module.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-sm font-medium tracking-[3px] uppercase text-[#52525b] mb-10" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>How We Compare</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-5 py-4 border-b border-[#222222] text-[11px] tracking-[2px] uppercase text-[#52525b] font-medium" style={{ fontFamily: "'DM Mono', monospace" }}></th>
                  <th className="text-left px-5 py-4 border-b border-[#222222] text-[11px] tracking-[2px] uppercase text-[#52525b] font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>Spreadsheets &amp; PLM</th>
                  <th className="text-left px-5 py-4 border-b border-[#222222] text-[11px] tracking-[2px] uppercase text-[#52525b] font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>Factory-OS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Process enforcement', 'Optional. Nobody checks.', 'Built-in phase gates'],
                  ['Design experiments', 'Ad hoc or skipped', 'Structured DOE with analysis'],
                  ['SOPs', 'Stale docs in a drive', 'Versioned, linked, enforced'],
                  ['Positioning', 'File storage / ERP add-on', 'Engineering methodology tool'],
                  ['Teaches discipline', 'No', 'Yes — opinionated by design'],
                  ['Price', '$5K–$15K/seat (enterprise)', '$49/user/month']
                ].map(([feature, them, us], i) => (
                  <tr key={i}>
                    <td className="px-5 py-4 border-b border-[#222222] text-sm text-[#a1a1aa]">{feature}</td>
                    <td className="px-5 py-4 border-b border-[#222222] text-sm text-[#52525b]">{them}</td>
                    <td className="px-5 py-4 border-b border-[#222222] text-sm text-emerald-500 font-semibold">{us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-none h-px mx-10" style={{ background: 'linear-gradient(90deg, transparent, #2e2e2e 20%, #2e2e2e 80%, transparent)' }} />

      {/* Baja / Student Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#15181C] border border-emerald-500/20 rounded-2xl p-8 md:p-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full mb-6">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">For Competitive Teams</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#F0F2F4] mb-6">
              Built for Competitive Engineering Teams
            </h2>

            <p className="text-[#B4BAC4] mb-6 max-w-2xl mx-auto leading-relaxed">
              If you found Factory-OS through Baja SAE or another engineering competition, you are seeing an early development build intended for real hardware teams. We are actively shaping the platform around practical design, testing, and process needs.
            </p>

            <p className="text-[#6B7280] mb-8 max-w-2xl mx-auto">
              Early users will help influence how the product develops over the next year.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="group bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition flex items-center justify-center"
              >
                Join Early Access
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-[#1C1F24] border border-[#2A2F36] text-[#F0F2F4] px-8 py-3 rounded-xl font-semibold hover:bg-[#22262C] hover:border-emerald-500/40 transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Exists Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#15181C]/50 border-t border-[#2A2F36]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F0F2F4] mb-6">
              Why Teams Need This
            </h2>
            <p className="text-lg text-[#B4BAC4] leading-relaxed max-w-3xl mx-auto">
              Most engineering teams manage design trees, part numbers, experiments, and procedures across scattered spreadsheets, folders, and documents.
            </p>
            <p className="text-[#A5B0A9] mb-8">Early users will help influence how the product develops over the next year.</p>
            <a href="#interest-form" className="inline-flex items-center bg-emerald-500 hover:bg-emerald-400 text-[#06110B] px-6 py-3 rounded-lg font-semibold transition-colors">
              Join the Interest List
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
              <div className="bg-emerald-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Layers className="text-emerald-400" size={24} />
              </div>
              <h3 className="font-semibold text-[#F0F2F4] mb-2">Scattered Files</h3>
              <p className="text-sm text-[#6B7280]">
                Design documents, CAD links, and notes spread across Google Drive, Dropbox, and local machines.
              </p>
            </div>

            <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
              <div className="bg-emerald-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Target className="text-emerald-400" size={24} />
              </div>
              <h3 className="font-semibold text-[#F0F2F4] mb-2">Lost Experiments</h3>
              <p className="text-sm text-[#6B7280]">
                Test results buried in spreadsheets with no connection to the decisions they informed.
              </p>
            </div>

            <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
              <div className="bg-emerald-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Wrench className="text-emerald-400" size={24} />
              </div>
              <h3 className="font-semibold text-[#F0F2F4] mb-2">No Process Memory</h3>
              <p className="text-sm text-[#6B7280]">
                New team members have no record of how things were built or why decisions were made.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[#B4BAC4] mb-8 max-w-2xl mx-auto">
              Factory-OS is being built to bring those workflows into one structured system, where design, testing, and processes stay connected.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F0F2F4] mb-6 leading-[1.2]" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-1px' }}>
            Engineering discipline is <span className="text-emerald-500">learnable.</span><br />It should also be enforced.
          </h2>
          <p className="text-[17px] text-[#a1a1aa] leading-[1.8] mb-8">
            Factory-OS is the TurboTax for engineering process — opinionated, structured, and priced for teams who aren't Fortune 500. It doesn't just store your work. It holds you to a standard.
          </p>

          {/* CTA to open form modal */}
          <button
            onClick={() => setShowModal(true)}
            className="group bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition flex items-center justify-center mx-auto mb-4"
          >
            Request Early Access
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
          </button>

          <p className="text-sm text-[#6B7280]">
            No spam. Just updates as we build.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-10 border-t border-[#222222]">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-[#52525b]" style={{ fontFamily: "'DM Mono', monospace" }}>
            factory<span className="text-emerald-700">-os</span>
          </div>

          <div className="flex items-center gap-5">
            <a href="/privacy" className="text-xs text-[#52525b] hover:text-emerald-500 transition">Privacy Policy</a>
            <a href="/terms" className="text-xs text-[#52525b] hover:text-emerald-500 transition">Terms of Use</a>
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-[#52525b] hover:text-emerald-500 transition"
            >
              Sign In
            </button>
            <a href="/invest" className="text-xs text-[#52525b] hover:text-emerald-500 transition" style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '1px', textTransform: 'uppercase' }}>Invest</a>
          </div>

          <div className="text-xs text-[#52525b]">
            Engineering Discipline Software
          </div>
        </div>
      </footer>

      {/* Early Access Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-[#15181C] border border-[#2A2F36] rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => {
                setShowModal(false);
                setFormSubmitted(false);
                setSubmitStatus('');
              }}
              className="absolute top-4 right-4 p-2 text-[#6B7280] hover:text-[#F0F2F4] transition"
            >
              <X size={20} />
            </button>

            {formSubmitted ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-[#F0F2F4] mb-3">Request Received</h3>
                <p className="text-[#6B7280] mb-6 max-w-sm mx-auto">{submitStatus}</p>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormSubmitted(false);
                    setSubmitStatus('');
                  }}
                  className="px-6 py-2.5 bg-[#1C1F24] border border-[#2A2F36] hover:border-emerald-500/50 text-[#F0F2F4] rounded-lg font-medium transition"
                >
                  Close
                </button>
              </div>
            ) : (
            <form onSubmit={handleEmailSubmit}>
              <h3 className="text-xl font-bold text-[#F0F2F4] mb-2 text-center">Request Early Access</h3>
              <p className="text-sm text-[#6B7280] mb-6 text-center">Join engineering teams shaping Factory-OS</p>

              {/* Primary Contact */}
              <div className="mb-5">
                <p className="text-xs text-emerald-400 font-medium mb-2 uppercase tracking-wide">Primary Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={formData.name}
                    onChange={handleFormChange('name')}
                    required
                    className="px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Your Role (e.g., Team Lead, Engineer)"
                    value={formData.role}
                    onChange={handleFormChange('role')}
                    className="px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Your Email *"
                    value={formData.email}
                    onChange={handleFormChange('email')}
                    required
                    className="px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleFormChange('phone')}
                    className="px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                  />
                </div>
              </div>

              {/* Organization */}
              <div className="mb-5">
                <p className="text-xs text-emerald-400 font-medium mb-2 uppercase tracking-wide">Organization</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="University or Company"
                    value={formData.organization}
                    onChange={handleFormChange('organization')}
                    className="px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Team/Group (e.g., Oregon Tech Baja SAE)"
                    value={formData.teamName}
                    onChange={handleFormChange('teamName')}
                    className="px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                  />
                </div>
              </div>

              {/* Secondary Contact */}
              <div className="mb-5">
                <p className="text-xs text-[#6B7280] font-medium mb-2 uppercase tracking-wide">Secondary Contact (Optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.secondaryName}
                    onChange={handleFormChange('secondaryName')}
                    className="px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={formData.secondaryRole}
                    onChange={handleFormChange('secondaryRole')}
                    className="px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.secondaryEmail}
                    onChange={handleFormChange('secondaryEmail')}
                    className="px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                  />
                </div>
              </div>

              {/* Voucher Code */}
              <div className="mb-6">
                <p className="text-xs text-[#6B7280] font-medium mb-2 uppercase tracking-wide">Voucher Code (Optional)</p>
                <input
                  type="text"
                  placeholder="Enter voucher code if you have one"
                  value={formData.voucherCode}
                  onChange={handleFormChange('voucherCode')}
                  className="w-full px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white rounded-lg font-semibold transition"
              >
                {isSubmitting ? 'Sending...' : 'Submit Request'}
              </button>

              {submitStatus && (
                <p className={`mt-3 text-sm text-center ${submitStatus.includes('Thanks') ? 'text-emerald-400' : 'text-[#6B7280]'}`}>
                  {submitStatus}
                </p>
              )}
            </form>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default FactoryOSLanding;
