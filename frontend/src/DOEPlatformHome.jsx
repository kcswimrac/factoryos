import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Beaker, TrendingUp, Zap, BarChart3, FileSpreadsheet, GitBranch, CheckCircle, ArrowRight, Play, Database, Brain, Sparkles, Lock, Unlock, Users, Clock, Info, HelpCircle, Target } from 'lucide-react';
import Header from './Header';
import PageSummary from './components/ui/PageSummary';

// Tooltip Component for Term Explanations
const TermTooltip = ({ term, explanation, example }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        className="border-b-2 border-dotted border-blue-400/50 cursor-help hover:border-blue-400 transition"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {term}
      </span>
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 bg-[#15181C] border border-blue-500/30 rounded-xl shadow-2xl shadow-blue-500/20 -top-2 left-0 transform -translate-y-full ml-0 backdrop-blur-xl">
          <div className="flex items-start space-x-2 mb-2">
            <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-[#F0F2F4] text-sm mb-1">{term}</div>
              <div className="text-[#B4BAC4] text-xs leading-relaxed mb-2">{explanation}</div>
              {example && (
                <div className="text-xs text-blue-300 italic bg-blue-500/10 p-2 rounded border border-blue-500/20">
                  Example: {example}
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-[#15181C] border-r border-b border-blue-500/30"></div>
        </div>
      )}
    </span>
  );
};

const DOEPlatformHome = () => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState('factorial');

  // Demo data for visualizations
  const mainEffectsData = [
    { level: 'Low', Temperature: 45, Pressure: 42, Material: 44 },
    { level: 'High', Temperature: 32, Pressure: 38, Material: 41 }
  ];

  const anovaData = [
    { factor: 'Temperature', effect: 6.8, significant: true },
    { factor: 'Pressure', effect: 4.2, significant: true },
    { factor: 'Speed', effect: 3.1, significant: true },
    { factor: 'Material', effect: 1.2, significant: false },
    { factor: 'Load', effect: 0.8, significant: false }
  ];

  const designTypes = [
    {
      id: 'factorial',
      name: 'Full Factorial',
      icon: '🎯',
      description: 'Test every possible combination of your factors',
      factors: '2-5 factors',
      runs: '2^k runs',
      bestFor: 'Comprehensive analysis',
      available: true,
      tooltip: {
        explanation: 'Tests all possible combinations of factor levels. If you have 3 factors at 2 levels each, you run all 8 (2×2×2) combinations.',
        example: 'Testing temperature (high/low), pressure (high/low), and time (high/low) = 8 runs total'
      }
    },
    {
      id: 'fractional',
      name: 'Fractional Factorial',
      icon: '⚡',
      description: 'Test a smart subset of combinations',
      factors: '5-15 factors',
      runs: '8-64 runs',
      bestFor: 'Factor screening',
      available: true,
      tooltip: {
        explanation: 'Tests only a carefully selected fraction of all combinations, reducing runs while still identifying important factors.',
        example: 'Instead of 128 runs (2^7), you might only need 32 runs to find which factors matter most'
      }
    },
    {
      id: 'plackett',
      name: 'Plackett-Burman',
      icon: '🚀',
      description: 'Maximum efficiency for many factors',
      factors: '7-30+ factors',
      runs: 'N+1 runs',
      bestFor: 'Screening many factors',
      available: true,
      tooltip: {
        explanation: 'Ultra-efficient design that can screen many factors with minimal runs. Uses only N+1 runs for N factors.',
        example: 'Test 11 factors with just 12 runs, then focus detailed experiments on the 2-3 important ones'
      }
    }
  ];

  // Phase 1 MVP Features - Available Now
  const phase1Features = [
    {
      icon: <Beaker className="w-8 h-8" />,
      title: 'Smart Design Generation',
      description: 'Create optimal experimental designs instantly',
      status: 'available',
      tooltip: {
        explanation: 'Automatically creates the right mix of experiments based on your factors, ensuring you test efficiently.',
        example: 'Enter "temperature", "pressure", "speed" and get a complete run schedule in seconds'
      }
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Real-Time ANOVA',
      description: 'Statistical analysis as you enter data',
      status: 'available',
      tooltip: {
        explanation: 'Analysis of Variance (ANOVA) tells you which factors significantly affect your results and by how much.',
        example: 'Immediately see that temperature matters (p<0.001) but material choice doesn\'t (p=0.23)'
      }
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Main Effects Visualization',
      description: 'See which factors impact results most',
      status: 'available',
      tooltip: {
        explanation: 'Main effects show the average impact of changing each factor from low to high.',
        example: 'A steep line means that factor strongly affects the outcome; flat means it doesn\'t matter much'
      }
    },
    {
      icon: <FileSpreadsheet className="w-8 h-8" />,
      title: 'CSV Import/Export',
      description: 'Upload data in bulk or export results',
      status: 'available',
      tooltip: {
        explanation: 'Import experimental data from Excel/CSV files or export your analysis results for reports.',
        example: 'Copy-paste results from lab equipment directly into a CSV, then upload to get instant analysis'
      }
    }
  ];

  // Phase 2 Features - Coming Soon
  const phase2Features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Intelligent Augmentation',
      description: 'AI suggests additional runs when patterns emerge',
      status: 'coming-soon',
      phase: 'Phase 2',
      tooltip: {
        explanation: 'The system detects when adding specific extra runs would significantly improve your model accuracy.',
        example: 'After 8 runs show curvature, system suggests 5 center points to capture non-linear effects'
      }
    },
    {
      icon: <GitBranch className="w-8 h-8" />,
      title: 'Design Evolution',
      description: 'Track parent-child experiment relationships',
      status: 'coming-soon',
      phase: 'Phase 2',
      tooltip: {
        explanation: 'Build on previous experiments by adding runs that refine your understanding of key factors.',
        example: 'Initial screening identifies 2 key factors → follow-up experiment tests those 2 in detail'
      }
    }
  ];

  // Phase 3 Features - Future
  const phase3Features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Team Collaboration',
      description: 'Organizations and private experiments',
      status: 'planned',
      phase: 'Phase 3',
      tooltip: {
        explanation: 'Share experiments with your team, control who can view/edit, and collaborate on analysis.',
        example: 'Engineering team shares experiments while keeping proprietary formulations private'
      }
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Advanced Features',
      description: 'Premium subscriptions and enterprise tools',
      status: 'planned',
      phase: 'Phase 3',
      tooltip: {
        explanation: 'Additional analysis methods, priority support, and enterprise integrations.',
        example: 'Response surface methodology, mixture designs, and direct ERP integration'
      }
    }
  ];

  const stats = [
    { 
      label: 'Design Types', 
      value: '3', 
      icon: <Beaker className="w-6 h-6" />, 
      detail: 'Available now',
      tooltip: 'Full Factorial, Fractional Factorial, and Plackett-Burman designs ready to use'
    },
    { 
      label: 'Analysis Types', 
      value: '5+', 
      icon: <Brain className="w-6 h-6" />, 
      detail: 'ANOVA & more',
      tooltip: 'ANOVA, main effects, Pareto analysis, factor significance, and model fit statistics'
    },
    { 
      label: 'No Login', 
      value: '100%', 
      icon: <Unlock className="w-6 h-6" />, 
      detail: 'Free access',
      tooltip: 'No account creation required - start experimenting immediately in your browser'
    },
    { 
      label: 'Setup Time', 
      value: '<1min', 
      icon: <Clock className="w-6 h-6" />, 
      detail: 'Instant start',
      tooltip: 'From opening the app to running your first analysis in under 60 seconds'
    }
  ];

  const mvpBenefits = [
    {
      title: 'Start Immediately',
      description: 'No account creation, no login required. Just open the app and start experimenting.',
      icon: <Play className="w-12 h-12 text-blue-400" />
    },
    {
      title: 'Fully Functional',
      description: 'Complete DOE workflow from design generation to statistical analysis and visualization.',
      icon: <CheckCircle className="w-12 h-12 text-blue-400" />
    },
    {
      title: 'Open & Transparent',
      description: 'All experiments are public during MVP phase. Perfect for learning and education.',
      icon: <Unlock className="w-12 h-12 text-blue-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F1114] text-[#F0F2F4]">
      {/* Navigation */}
      <Header />

      {/* Section Summary */}
      <section className="pt-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PageSummary icon={Target} iconColor="text-blue-400" borderColor="border-blue-500/30" bgColor="bg-blue-500/5">
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Purpose:</strong> This section captures structured experiments, trade studies, and parametric analyses. It provides a formal system for planning, executing, and analyzing Design of Experiments (DOE) with statistical rigor.
            </p>
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Method:</strong> The platform generates optimal experimental designs (Full Factorial, Fractional Factorial, Plackett-Burman), enforces run completion tracking, and performs real-time ANOVA analysis to identify significant factors.
            </p>
            <p>
              <strong className="text-[#F0F2F4]">Outcome:</strong> Replaces ad-hoc spreadsheets with traceable, auditable experiment records. Preserves experimental intent, methodology, and results. Supports design decisions with quantified evidence rather than intuition.
            </p>
          </PageSummary>
        </div>
      </section>

      {/* Hero Section */}
      <section className="pt-12 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/30 px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                <Unlock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300 font-medium">No Login Required • Start in Seconds</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-[#F0F2F4]">
                  Smarter Experiments,
                </span>
                <br />
                <span className="text-blue-400">
                  Better Results
                </span>
              </h1>
              
              <p className="text-xl text-[#B4BAC4] mb-10 leading-relaxed max-w-xl">
                Professional <TermTooltip
                  term="Design of Experiments"
                  explanation="A systematic method to determine the relationship between factors affecting a process and the output of that process."
                  example="Testing which recipe ingredients (factors) most affect cookie taste (output)"
                /> platform with real-time statistical analysis. No PhD required, no setup needed.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => navigate('/doe/dashboard')}
                  className="group bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center space-x-3 text-lg hover:scale-105"
                >
                  <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Start Experimenting Now</span>
                </button>
                <button
                  onClick={() => navigate('/doe/help')}
                  className="bg-[#1C1F24] text-[#F0F2F4] px-8 py-4 rounded-xl font-semibold hover:bg-[#22262C] transition-all duration-300 text-lg border border-[#2A2F36] backdrop-blur-sm hover:border-blue-500/30"
                >
                  View Examples
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="group bg-[#15181C] p-5 rounded-xl border border-[#2A2F36] backdrop-blur-sm hover:border-blue-500/40 transition-all duration-300 cursor-help relative hover:scale-105"
                    title={stat.tooltip}
                  >
                    <div className="text-blue-400 mb-2 group-hover:scale-110 transition-transform">{stat.icon}</div>
                    <div className="text-3xl font-bold text-[#F0F2F4] mb-1">{stat.value}</div>
                    <div className="text-xs text-[#6B7280] mb-1">{stat.label}</div>
                    <div className="text-xs text-blue-400">{stat.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="bg-[#15181C] p-8 rounded-3xl border border-[#2A2F36] shadow-2xl backdrop-blur-xl">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#F0F2F4]">
                      <TermTooltip
                        term="Main Effects Plot"
                        explanation="Shows the average response at each factor level, revealing which factors have the biggest impact."
                        example="If temperature line is steep and pressure line is flat, temperature matters more"
                      />
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/30">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span>Live Analysis</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={mainEffectsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2F36" />
                      <XAxis dataKey="level" stroke="#6B7280" style={{ fontSize: '14px' }} />
                      <YAxis stroke="#6B7280" style={{ fontSize: '14px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#15181C',
                          border: '1px solid #2A2F36',
                          borderRadius: '0.75rem',
                          color: '#F0F2F4',
                          padding: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '14px' }} />
                      <Line type="monotone" dataKey="Temperature" stroke="#3B82F6" strokeWidth={4} dot={{ fill: '#3B82F6', r: 7 }} activeDot={{ r: 9 }} />
                      <Line type="monotone" dataKey="Pressure" stroke="#60A5FA" strokeWidth={4} dot={{ fill: '#60A5FA', r: 7 }} activeDot={{ r: 9 }} />
                      <Line type="monotone" dataKey="Material" stroke="#93C5FD" strokeWidth={4} dot={{ fill: '#93C5FD', r: 7 }} activeDot={{ r: 9 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-[#1C1F24] p-5 rounded-xl border border-[#2A2F36]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-[#6B7280]">Analysis Status</div>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-[#B4BAC4] mb-4 text-sm">16 of 16 runs completed</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-[#15181C] p-3 rounded-lg border border-[#2A2F36]">
                      <div className="text-blue-400 font-bold text-2xl">0.89</div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        <TermTooltip
                          term="R²"
                          explanation="R-squared measures how well your model fits the data. 1.0 = perfect fit, 0.0 = no relationship."
                          example="R²=0.89 means your factors explain 89% of the variation in results"
                        />
                      </div>
                    </div>
                    <div className="bg-[#15181C] p-3 rounded-lg border border-[#2A2F36]">
                      <div className="text-emerald-400 font-bold text-2xl">3/4</div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        <TermTooltip
                          term="Significant"
                          explanation="Factors that have a real, statistically proven effect on your results (not just random chance)."
                          example="3 factors truly matter; 1 factor's effect could just be noise"
                        />
                      </div>
                    </div>
                    <div className="bg-[#15181C] p-3 rounded-lg border border-[#2A2F36]">
                      <div className="text-blue-400 font-bold text-2xl">24.3</div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        <TermTooltip
                          term="F-statistic"
                          explanation="Measures if your factors' effects are larger than random noise. Higher values mean more confidence."
                          example="F=24.3 is highly significant, meaning your results are very reliable"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-[#F0F2F4] px-6 py-3 rounded-xl shadow-2xl shadow-blue-500/40 transform rotate-3 border border-blue-400/30">
                <div className="text-sm font-bold">Fully Functional</div>
                <div className="text-xs opacity-90">No Waiting</div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-emerald-600 text-[#F0F2F4] px-6 py-3 rounded-xl shadow-2xl shadow-emerald-500/40 transform -rotate-3 border border-emerald-400/30">
                <div className="text-sm font-bold">Zero Setup</div>
                <div className="text-xs opacity-90">Start in 30s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MVP Benefits Section */}
      <section className="py-24 px-6 lg:px-8 bg-[#0F1114]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <h2 className="text-5xl font-bold mb-3">
                <span className="bg-gradient-to-r text-[#F0F2F4]">
                  Function First,
                </span>{' '}
                <span className="text-blue-400 bg-clip-text text-transparent">
                  Complexity Later
                </span>
              </h2>
            </div>
            <p className="text-xl text-[#B4BAC4] max-w-3xl mx-auto leading-relaxed">
              We're building in phases. Phase 1 delivers a fully working tool without the friction of account creation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {mvpBenefits.map((benefit, index) => (
              <div 
                key={index} 
                className="group bg-[#15181C] p-10 rounded-3xl border border-[#2A2F36] backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">{benefit.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-[#F0F2F4]">{benefit.title}</h3>
                <p className="text-[#B4BAC4] leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Phase 1 Features - Available Now */}
      <section id="features" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-400/30 px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Phase 1 • Available Now</span>
            </div>
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r text-[#F0F2F4]">
              Core DOE Functionality
            </h2>
            <p className="text-xl text-[#B4BAC4] max-w-3xl mx-auto">
              Everything you need to design, execute, and analyze experiments—available now without any setup.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phase1Features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-[#15181C] p-8 rounded-2xl border border-[#2A2F36] backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300 hover:scale-105"
              >
                <div className="text-blue-400 mb-5 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-[#F0F2F4]">
                  <TermTooltip 
                    term={feature.title}
                    explanation={feature.tooltip.explanation}
                    example={feature.tooltip.example}
                  />
                </h3>
                <p className="text-sm text-[#B4BAC4] leading-relaxed mb-4">{feature.description}</p>
                <div className="inline-flex items-center space-x-2 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/30">
                  <CheckCircle className="w-3 h-3" />
                  <span className="font-medium">Available now</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Design Types Section */}
      <section id="designs" className="py-24 px-6 lg:px-8 bg-[#0F1114]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r text-[#F0F2F4]">
              Choose Your Design Type
            </h2>
            <p className="text-xl text-[#B4BAC4] max-w-3xl mx-auto">
              Three powerful <TermTooltip 
                term="experimental designs"
                explanation="Pre-planned arrangements of experiments that maximize information while minimizing the number of tests needed."
                example="Like following a recipe vs. randomly trying ingredients—designs ensure you learn efficiently"
              /> to match your research goals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {designTypes.map((design, index) => (
              <div 
                key={design.id}
                className={`group bg-[#15181C] p-10 rounded-3xl border backdrop-blur-xl cursor-pointer transition-all duration-300 ${
                  activeDemo === design.id 
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/30 scale-105' 
                    : 'border-[#2A2F36] hover:border-blue-500/50 hover:scale-102'
                }`}
                onClick={() => setActiveDemo(design.id)}
              >
                <div className="text-6xl mb-5 group-hover:scale-110 transition-transform duration-300">{design.icon}</div>
                <h3 className="text-3xl font-bold mb-3 text-[#F0F2F4]">
                  <TermTooltip 
                    term={design.name}
                    explanation={design.tooltip.explanation}
                    example={design.tooltip.example}
                  />
                </h3>
                <p className="text-[#B4BAC4] mb-8 text-lg leading-relaxed">{design.description}</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-3 bg-[#1C1F24] rounded-lg border border-[#2A2F36]">
                    <span className="text-[#6B7280] font-medium">Factors:</span>
                    <span className="text-[#F0F2F4] font-semibold">{design.factors}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#1C1F24] rounded-lg border border-[#2A2F36]">
                    <span className="text-[#6B7280] font-medium">Runs:</span>
                    <span className="text-[#F0F2F4] font-semibold">{design.runs}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-violet-400/30">
                    <span className="text-[#6B7280] font-medium">Best for:</span>
                    <span className="text-blue-300 font-semibold">{design.bestFor}</span>
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
                  Select Design
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r text-[#F0F2F4]">
              Simple 4-Step Workflow
            </h2>
            <p className="text-xl text-[#B4BAC4] max-w-3xl mx-auto">
              From design generation to analysis in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Define Experiment',
                description: 'Name your experiment, select design type, and define your factors and responses',
                icon: <Beaker className="w-10 h-10" />,
                tooltip: {
                  explanation: 'Set up what you\'re testing (factors like temperature, pressure) and what you\'re measuring (responses like strength, yield).',
                  example: 'Factors: temp, pressure, time | Response: product strength'
                }
              },
              {
                step: '2',
                title: 'Generate Design',
                description: 'System creates optimal design matrix with randomized run order',
                icon: <Sparkles className="w-10 h-10" />,
                tooltip: {
                  explanation: 'The platform automatically creates a schedule of which experiments to run, randomized to reduce bias.',
                  example: 'Run 1: low temp, high pressure | Run 2: high temp, low pressure, etc.'
                }
              },
              {
                step: '3',
                title: 'Enter Data',
                description: 'Input results manually or upload CSV. Track progress as you go',
                icon: <Database className="w-10 h-10" />,
                tooltip: {
                  explanation: 'As you complete experiments, enter the results. Progress tracker shows how many runs remain.',
                  example: 'After measuring, enter: Run 1 strength = 245 MPa, Run 2 = 278 MPa'
                }
              },
              {
                step: '4',
                title: 'Analyze Results',
                description: 'Get ANOVA, main effects, and visualizations automatically',
                icon: <TrendingUp className="w-10 h-10" />,
                tooltip: {
                  explanation: 'Statistical analysis runs instantly, showing which factors matter and providing charts to visualize results.',
                  example: 'See that temperature has p<0.001 (very significant) while time has p=0.45 (not significant)'
                }
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-[#15181C] p-8 rounded-3xl border border-[#2A2F36] backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                  <div className="absolute -top-5 -left-5 w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-[#F0F2F4] font-bold text-2xl shadow-xl shadow-blue-500/40 ring-4 ring-slate-950">
                    {item.step}
                  </div>
                  <div className="text-blue-400 mb-5 mt-6 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                  <h3 className="text-2xl font-semibold mb-4 text-[#F0F2F4]">
                    <TermTooltip 
                      term={item.title}
                      explanation={item.tooltip.explanation}
                      example={item.tooltip.example}
                    />
                  </h3>
                  <p className="text-sm text-[#B4BAC4] leading-relaxed">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-violet-500/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-24 px-6 lg:px-8 bg-[#0F1114]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r text-[#F0F2F4]">
              Development Roadmap
            </h2>
            <p className="text-xl text-[#B4BAC4] max-w-3xl mx-auto">
              Building the platform in phases—function first, complexity later
            </p>
          </div>

          {/* Phase 2 - Coming Soon */}
          <div className="mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/30 px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Phase 2 • Coming Soon</span>
            </div>
            <h3 className="text-3xl font-bold mb-8 text-[#F0F2F4]">Advanced Analysis & Augmentation</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {phase2Features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-8 rounded-2xl border border-slate-700/40 backdrop-blur-xl opacity-80 hover:opacity-100 transition-all duration-300"
                >
                  <div className="text-blue-400 mb-5">{feature.icon}</div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-[#F0F2F4]">
                      <TermTooltip 
                        term={feature.title}
                        explanation={feature.tooltip.explanation}
                        example={feature.tooltip.example}
                      />
                    </h3>
                    <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-400/30 font-medium">
                      {feature.phase}
                    </span>
                  </div>
                  <p className="text-sm text-[#B4BAC4] leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 3 - Planned */}
          <div>
            <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-400/30 px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Phase 3 • Planned</span>
            </div>
            <h3 className="text-3xl font-bold mb-8 text-[#F0F2F4]">Authentication & Collaboration</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {phase3Features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-gradient-to-br from-slate-900/40 to-slate-800/30 p-8 rounded-2xl border border-slate-700/30 backdrop-blur-xl opacity-60 hover:opacity-90 transition-all duration-300"
                >
                  <div className="text-blue-400 mb-5">{feature.icon}</div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-[#F0F2F4]">
                      <TermTooltip 
                        term={feature.title}
                        explanation={feature.tooltip.explanation}
                        example={feature.tooltip.example}
                      />
                    </h3>
                    <span className="text-xs bg-purple-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-purple-400/30 font-medium">
                      {feature.phase}
                    </span>
                  </div>
                  <p className="text-sm text-[#B4BAC4] leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Preview */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r text-[#F0F2F4]">
              See It In Action
            </h2>
            <p className="text-xl text-[#B4BAC4]">Real-time statistical analysis and visualization</p>
          </div>

          {/* Pareto Chart */}
          <div className="bg-[#15181C] p-10 rounded-3xl border border-[#2A2F36] backdrop-blur-xl mb-10">
            <h3 className="text-2xl font-semibold mb-8 text-[#F0F2F4]">
              <TermTooltip 
                term="Factor Significance (Pareto Analysis)"
                explanation="Pareto charts show factors ranked by effect size, helping you focus on what matters most (the vital few vs. trivial many)."
                example="Temperature has 6.8 effect (critical), while Load has 0.8 (not worth optimizing)"
              />
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={anovaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="factor" stroke="#94a3b8" style={{ fontSize: '14px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '14px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9',
                    padding: '12px'
                  }} 
                />
                <Bar dataKey="effect" radius={[12, 12, 0, 0]}>
                  {anovaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.significant ? '#3B82F6' : '#6B7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 flex items-center justify-center space-x-8 text-sm text-[#B4BAC4]">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-lg"></div>
                <span>Significant (p &lt; 0.05)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-[#4B5563] rounded-lg"></div>
                <span>Not Significant</span>
              </div>
            </div>
          </div>

          {/* ANOVA Table */}
          <div className="bg-[#15181C] p-10 rounded-3xl border border-[#2A2F36] backdrop-blur-xl">
            <h3 className="text-2xl font-semibold mb-8 text-[#F0F2F4]">
              <TermTooltip 
                term="ANOVA Table"
                explanation="Analysis of Variance table shows statistical details for each factor, including if effects are real or just random chance."
                example="p<0.05 means less than 5% chance the effect is random—so we trust it's real"
              /> - Real-Time Results
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2F36]">
                    <th className="text-left py-4 px-5 text-[#6B7280] font-semibold text-sm">
                      <TermTooltip 
                        term="Source"
                        explanation="The factor or source of variation being tested."
                        example="Temperature, Pressure, or Error (random variation)"
                      />
                    </th>
                    <th className="text-right py-4 px-5 text-[#6B7280] font-semibold text-sm">
                      <TermTooltip 
                        term="DF"
                        explanation="Degrees of Freedom—the number of independent pieces of information."
                        example="For a 2-level factor, DF=1 (high vs low)"
                      />
                    </th>
                    <th className="text-right py-4 px-5 text-[#6B7280] font-semibold text-sm">
                      <TermTooltip 
                        term="Sum Sq"
                        explanation="Sum of Squares—total variation explained by this factor."
                        example="Higher values mean this factor causes more variation in results"
                      />
                    </th>
                    <th className="text-right py-4 px-5 text-[#6B7280] font-semibold text-sm">
                      <TermTooltip 
                        term="Mean Sq"
                        explanation="Mean Square—average variation per degree of freedom (Sum Sq ÷ DF)."
                        example="Used to calculate the F-statistic for significance testing"
                      />
                    </th>
                    <th className="text-right py-4 px-5 text-[#6B7280] font-semibold text-sm">
                      <TermTooltip 
                        term="F Value"
                        explanation="F-statistic compares factor variation to error variation. Larger values indicate stronger effects."
                        example="F=42.1 is huge (highly significant), F=1.5 is small (not significant)"
                      />
                    </th>
                    <th className="text-right py-4 px-5 text-[#6B7280] font-semibold text-sm">
                      <TermTooltip 
                        term="p-value"
                        explanation="Probability this effect is due to random chance. p<0.05 means statistically significant."
                        example="p=0.001 means 0.1% chance it's random—very confident it's real"
                      />
                    </th>
                    <th className="text-center py-4 px-5 text-[#6B7280] font-semibold text-sm">Sig</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { source: 'Temperature', df: 1, ss: 345.2, ms: 345.2, f: 42.1, p: '<0.001', sig: true },
                    { source: 'Pressure', df: 1, ss: 198.5, ms: 198.5, f: 24.2, p: '<0.001', sig: true },
                    { source: 'Material', df: 1, ss: 12.3, ms: 12.3, f: 1.5, p: '0.234', sig: false },
                    { source: 'Speed', df: 1, ss: 89.4, ms: 89.4, f: 10.9, p: '0.003', sig: true },
                    { source: 'Error', df: 11, ss: 90.2, ms: 8.2, f: '-', p: '-', sig: false },
                    { source: 'Total', df: 15, ss: 735.6, ms: '-', f: '-', p: '-', sig: false }
                  ].map((row, index) => (
                    <tr 
                      key={index} 
                      className={`border-b border-[#2A2F36] hover:bg-[#22262C]/30 transition-all duration-200 ${
                        row.source === 'Total' ? 'font-semibold border-t-2 border-blue-500/40' : ''
                      }`}
                    >
                      <td className="py-4 px-5 text-[#F0F2F4] font-medium">{row.source}</td>
                      <td className="text-right py-4 px-5 text-[#B4BAC4]">{row.df}</td>
                      <td className="text-right py-4 px-5 text-[#B4BAC4]">{row.ss}</td>
                      <td className="text-right py-4 px-5 text-[#B4BAC4]">{row.ms}</td>
                      <td className="text-right py-4 px-5 text-[#B4BAC4]">{row.f}</td>
                      <td className="text-right py-4 px-5 text-[#B4BAC4]">{row.p}</td>
                      <td className="text-center py-4 px-5">
                        {row.sig && row.source !== 'Total' && row.source !== 'Error' && (
                          <CheckCircle className="w-5 h-5 text-blue-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="bg-[#15181C] p-6 rounded-xl border border-[#2A2F36]">
                <div className="text-sm text-[#6B7280] mb-2">Model R²</div>
                <div className="text-4xl font-bold text-blue-400">0.89</div>
                <div className="text-xs text-[#6B7280] mt-2">Excellent fit</div>
              </div>
              <div className="bg-[#15181C] p-6 rounded-xl border border-[#2A2F36]">
                <div className="text-sm text-[#6B7280] mb-2">Significant Factors</div>
                <div className="text-4xl font-bold text-blue-400">3/4</div>
                <div className="text-xs text-[#6B7280] mt-2">Strong effects detected</div>
              </div>
              <div className="bg-[#15181C] p-6 rounded-xl border border-[#2A2F36]">
                <div className="text-sm text-[#6B7280] mb-2">F-statistic</div>
                <div className="text-4xl font-bold text-blue-400">24.3</div>
                <div className="text-xs text-[#6B7280] mt-2">Highly significant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r text-[#F0F2F4]">
              Ready to Start
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Experimenting?
            </span>
          </h2>
          <p className="text-xl text-[#B4BAC4] mb-10 leading-relaxed">
            No account required. No credit card. Just open the app and start designing experiments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <button
              onClick={() => navigate('/doe/dashboard')}
              className="group bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-12 py-5 rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center space-x-3 text-xl hover:scale-105"
            >
              <Play className="w-7 h-7 group-hover:scale-110 transition-transform" />
              <span>Launch DOE Platform</span>
            </button>
            <button className="bg-[#1C1F24] text-[#F0F2F4] px-12 py-5 rounded-xl font-semibold hover:bg-[#22262C] transition-all duration-300 text-xl border border-[#2A2F36] backdrop-blur-sm hover:border-blue-500/40">
              View Documentation
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-10 text-sm text-[#B4BAC4]">
            <div className="flex items-center space-x-2">
              <Unlock className="w-5 h-5 text-blue-400" />
              <span>No login required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Start in &lt;1 minute</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span>Fully functional</span>
            </div>
            <div className="flex items-center space-x-2">
              <Beaker className="w-5 h-5 text-blue-400" />
              <span>Professional results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#15181C] border-t border-[#2A2F36] py-16 px-6 lg:px-8 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-violet-400/20">
                  <Beaker className="w-7 h-7 text-[#F0F2F4]" />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                    DOE Platform
                  </span>
                  <div className="text-xs text-[#6B7280]">Phase 1 MVP</div>
                </div>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Professional design of experiments platform for engineers and researchers.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-[#F0F2F4] text-lg">Product</h3>
              <ul className="space-y-3 text-sm text-[#6B7280]">
                <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
                <li><a href="#designs" className="hover:text-blue-400 transition">Designs</a></li>
                <li><a href="#roadmap" className="hover:text-blue-400 transition">Roadmap</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Examples</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-[#F0F2F4] text-lg">Resources</h3>
              <ul className="space-y-3 text-sm text-[#6B7280]">
                <li><a href="#" className="hover:text-blue-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Tutorials</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">GitHub</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-[#F0F2F4] text-lg">About</h3>
              <ul className="space-y-3 text-sm text-[#6B7280]">
                <li><a href="#" className="hover:text-blue-400 transition">Development Plan</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Contact</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#2A2F36] pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-[#6B7280]">© 2025 DOE Platform. Open and accessible experimental design.</p>
            <div className="flex space-x-8 mt-6 md:mt-0">
              <a href="#" className="text-[#6B7280] hover:text-blue-400 transition">Twitter</a>
              <a href="#" className="text-[#6B7280] hover:text-blue-400 transition">LinkedIn</a>
              <a href="#" className="text-[#6B7280] hover:text-blue-400 transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DOEPlatformHome;
