import React, { useState } from 'react';
import {
  Beaker, Book, Video, HelpCircle, Search, ChevronRight, ChevronDown,
  Play, Clock, CheckCircle, Target, Zap, TrendingUp, BarChart3,
  FileText, Lightbulb, MessageCircle, ExternalLink, Download,
  ArrowRight, Star, Code, BookOpen, GraduationCap, Rocket, Copy
} from 'lucide-react';
import Header from './Header';

// Tooltip Component
const TermTooltip = ({ term, explanation, example }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        className="border-b-2 border-dotted border-violet-400/50 cursor-help hover:border-violet-400 transition"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {term}
      </span>
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 bg-slate-900 border border-violet-500/30 rounded-xl shadow-2xl shadow-violet-500/20 bottom-full left-0 mb-2 backdrop-blur-xl">
          <div className="flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-white text-sm mb-1">{term}</div>
              <div className="text-gray-300 text-xs leading-relaxed mb-2">{explanation}</div>
              {example && (
                <div className="text-xs text-violet-300 italic bg-violet-500/10 p-2 rounded border border-violet-500/20">
                  Example: {example}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </span>
  );
};

// Collapsible FAQ Item
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition text-left"
      >
        <span className="font-semibold text-white pr-4">{question}</span>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-gray-300 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

const HelpCenter = () => {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'getting-started', label: 'Getting Started', icon: Rocket },
    { id: 'catapult-guide', label: 'Catapult Example', icon: Target },
    { id: 'methodology', label: 'DOE Methodology', icon: BookOpen },
    { id: 'glossary', label: 'Glossary', icon: Book },
    { id: 'faq', label: 'FAQ', icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-50">
      {/* Navigation Header */}
      <Header />

      {/* Page Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Help Center</h1>
                <p className="text-sm text-gray-500">Learn how to design better experiments</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white transition px-4 py-2 rounded-lg hover:bg-slate-800/50 flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Search */}
      <div className="bg-gradient-to-b from-violet-500/10 to-transparent border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
            How can we help you?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Search our guides, examples, and documentation
          </p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search for guides, tutorials, or terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition text-lg"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800/50 bg-slate-900/30 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Getting Started Tab */}
        {activeTab === 'getting-started' && (
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
                Getting Started with DOE Platform
              </h2>
              <p className="text-xl text-gray-400">
                Your step-by-step guide to running successful experiments
              </p>
            </div>

            {/* Quick Start Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-slate-700/50 rounded-2xl p-8 hover:border-violet-500/30 transition cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">5-Minute Tutorial</h3>
                <p className="text-gray-400 mb-4">Watch a quick video walkthrough of creating your first experiment</p>
                <div className="flex items-center text-violet-400 text-sm font-medium">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>5 min video</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-slate-700/50 rounded-2xl p-8 hover:border-green-500/30 transition cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Catapult Example</h3>
                <p className="text-gray-400 mb-4">Learn DOE with our interactive catapult distance optimization guide</p>
                <div className="flex items-center text-green-400 text-sm font-medium">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  <span>Interactive guide</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/30 transition cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Sample Data</h3>
                <p className="text-gray-400 mb-4">Download CSV templates and example datasets to practice with</p>
                <div className="flex items-center text-blue-400 text-sm font-medium">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>CSV templates</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Guide */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Your First Experiment: Step-by-Step</h3>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: 'Create Your Experiment',
                    description: 'Click "New Experiment" and enter basic information like name, description, and tags.',
                    time: '2 min'
                  },
                  {
                    step: 2,
                    title: 'Choose Design Type',
                    description: 'Select Full Factorial (2-5 factors), Fractional Factorial (5-15 factors), or Plackett-Burman (7-30+ factors) based on your needs.',
                    time: '1 min'
                  },
                  {
                    step: 3,
                    title: 'Define Factors',
                    description: 'Add your independent variables with low and high levels. Optionally include center points to detect curvature.',
                    time: '3 min'
                  },
                  {
                    step: 4,
                    title: 'Define Responses',
                    description: 'Specify what you\'ll measure and whether you want to maximize, minimize, or hit a target value.',
                    time: '2 min'
                  },
                  {
                    step: 5,
                    title: 'Generate Design Matrix',
                    description: 'Review your setup and generate the randomized experimental runs.',
                    time: '1 min'
                  },
                  {
                    step: 6,
                    title: 'Perform Experiments',
                    description: 'Follow the randomized run order to conduct your experiments and enter results.',
                    time: 'Varies'
                  },
                  {
                    step: 7,
                    title: 'Analyze Results',
                    description: 'Once you\'ve completed at least 50% of runs, click "Analyze" to see ANOVA, main effects, and recommendations.',
                    time: 'Instant'
                  }
                ].map((item) => (
                  <div key={item.step} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                          <span className="text-xs text-gray-500 bg-slate-800/50 px-3 py-1 rounded-full">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-gray-400 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-400/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                <Star className="w-7 h-7 text-blue-400" />
                <span>Best Practices</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-200 mb-3">Do's ✓</h4>
                  <ul className="space-y-2 text-sm text-blue-200/80">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Follow randomized run order to prevent bias</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Include center points to detect curvature</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Record all observations, even unexpected ones</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Complete at least 50% of runs before analyzing</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Run confirmation experiments at optimal settings</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-200 mb-3">Don'ts ✗</h4>
                  <ul className="space-y-2 text-sm text-amber-200/80">
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 flex-shrink-0 mt-0.5">✗</span>
                      <span>Don't run experiments in standard order (use random!)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 flex-shrink-0 mt-0.5">✗</span>
                      <span>Don't change factor levels mid-experiment</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 flex-shrink-0 mt-0.5">✗</span>
                      <span>Don't skip runs or cherry-pick data</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 flex-shrink-0 mt-0.5">✗</span>
                      <span>Don't analyze with less than 50% completion</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 flex-shrink-0 mt-0.5">✗</span>
                      <span>Don't ignore center point warnings about curvature</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Catapult Example Tab */}
        {activeTab === 'catapult-guide' && (
          <div className="space-y-12">
            <div className="flex items-start space-x-6">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  The Catapult Experiment
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  A complete walkthrough of optimizing catapult distance using Design of Experiments. 
                  This hands-on example demonstrates every concept from start to finish.
                </p>
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/30">
                <Target className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* The Challenge */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-slate-700/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center space-x-3">
                <Rocket className="w-7 h-7 text-green-400" />
                <span>The Challenge</span>
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                You have a catapult and want to control how far it launches a projectile. You can adjust three things on the catapult, 
                but you're not sure which settings give you what distance. Instead of trying hundreds of random combinations, 
                we'll use DOE to systematically figure it out.
              </p>
              <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
                <h4 className="font-semibold text-green-200 mb-3">Goal</h4>
                <p className="text-green-200/80 text-lg">
                  Build a mathematical model that lets us input a desired distance (like 50 feet) and get the exact catapult settings 
                  needed to achieve it.
                </p>
              </div>
            </div>

            {/* Factors */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">The Three Factors (What We Control)</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-violet-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">📍</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    <TermTooltip 
                      term="Cup Position"
                      explanation="Where the projectile sits in the throwing arm. Forward position = shorter throw, back position = longer throw."
                      example="Position 1 (front) vs Position 5 (back)"
                    />
                  </h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Minimum:</span>
                      <span className="text-violet-400 font-mono">Position 1 (front)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum:</span>
                      <span className="text-violet-400 font-mono">Position 5 (back)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Center:</span>
                      <span className="text-fuchsia-400 font-mono">Position 3 (middle)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 italic">
                    Affects leverage and release point
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-violet-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">📐</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    <TermTooltip 
                      term="Arm Stop Angle"
                      explanation="The angle where the throwing arm stops. Steep angle = high arc, shallow angle = flatter trajectory."
                      example="30° (shallow) vs 70° (steep)"
                    />
                  </h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Minimum:</span>
                      <span className="text-violet-400 font-mono">30° (shallow)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum:</span>
                      <span className="text-violet-400 font-mono">70° (steep)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Center:</span>
                      <span className="text-fuchsia-400 font-mono">50° (mid)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 italic">
                    Affects launch angle and velocity
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-violet-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    <TermTooltip 
                      term="Rubber Band Tension"
                      explanation="How many rubber bands power the catapult. More bands = more force and distance."
                      example="1 band (weak) vs 5 bands (strong)"
                    />
                  </h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Minimum:</span>
                      <span className="text-violet-400 font-mono">1 band (low)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum:</span>
                      <span className="text-violet-400 font-mono">5 bands (high)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Center:</span>
                      <span className="text-fuchsia-400 font-mono">3 bands (mid)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 italic">
                    Affects launch force and energy
                  </p>
                </div>
              </div>
            </div>

            {/* Response */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center space-x-3">
                <TrendingUp className="w-7 h-7 text-green-400" />
                <span>The Response (What We Measure)</span>
              </h3>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Distance (feet)</h4>
                    <p className="text-gray-400">
                      How far the projectile travels from the catapult to where it lands
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Goal</div>
                    <div className="text-lg font-semibold text-green-400">Controllable Target</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">~15 ft</div>
                    <div className="text-xs text-gray-400">Minimum observed</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">~35 ft</div>
                    <div className="text-xs text-gray-400">Typical range</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">~55 ft</div>
                    <div className="text-xs text-gray-400">Maximum observed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* The Experiment Design */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Our Experimental Design</h3>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8">
                <div className="flex items-start space-x-6 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-3">Full Factorial with Center Points</h4>
                    <p className="text-gray-400 leading-relaxed mb-4">
                      Since we have 3 factors and want to understand curvature (because physics suggests the relationship 
                      might be quadratic), we'll use a <strong className="text-white">2-level full factorial design with center points</strong>.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Factorial Runs</div>
                        <div className="text-3xl font-bold text-violet-400">8</div>
                        <div className="text-xs text-gray-500 mt-1">2³ = 8 corner points</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Center Points</div>
                        <div className="text-3xl font-bold text-fuchsia-400">4</div>
                        <div className="text-xs text-gray-500 mt-1">For curvature detection</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Total Launches</div>
                        <div className="text-3xl font-bold text-green-400">12</div>
                        <div className="text-xs text-gray-500 mt-1">Randomized order</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-6">
                  <h5 className="font-semibold text-violet-200 mb-3">Why This Design?</h5>
                  <ul className="space-y-2 text-sm text-violet-200/80">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Tests all factor combinations:</strong> We try all 8 possible high/low combinations</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Detects interactions:</strong> We can see if factors work together (e.g., angle + tension)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Checks for curvature:</strong> Center points tell us if the middle performs differently</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Efficient:</strong> Only 12 launches needed instead of 125 (5×5×5 full grid)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Design Matrix Example */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Sample Design Matrix</h3>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50 border-b border-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Run Order</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Cup Position</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Arm Angle</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Rubber Bands</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-violet-400 uppercase bg-violet-500/5">Distance (ft)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {[
                        { run: 1, type: 'Factorial', cup: 1, angle: 30, bands: 1, distance: 18.2 },
                        { run: 2, type: 'Factorial', cup: 5, angle: 30, bands: 1, distance: 22.5 },
                        { run: 3, type: 'Center', cup: 3, angle: 50, bands: 3, distance: 36.8 },
                        { run: 4, type: 'Factorial', cup: 1, angle: 70, bands: 1, distance: 20.1 },
                        { run: 5, type: 'Factorial', cup: 5, angle: 70, bands: 1, distance: 24.3 },
                        { run: 6, type: 'Factorial', cup: 1, angle: 30, bands: 5, distance: 32.7 },
                        { run: 7, type: 'Center', cup: 3, angle: 50, bands: 3, distance: 37.2 },
                        { run: 8, type: 'Factorial', cup: 5, angle: 30, bands: 5, distance: 41.8 },
                        { run: 9, type: 'Factorial', cup: 1, angle: 70, bands: 5, distance: 35.4 },
                        { run: 10, type: 'Center', cup: 3, angle: 50, bands: 3, distance: 36.5 },
                        { run: 11, type: 'Factorial', cup: 5, angle: 70, bands: 5, distance: 52.3 },
                        { run: 12, type: 'Center', cup: 3, angle: 50, bands: 3, distance: 37.1 }
                      ].map((row, idx) => (
                        <tr key={idx} className={`hover:bg-slate-800/30 transition ${row.type === 'Center' ? 'bg-fuchsia-500/5' : ''}`}>
                          <td className="px-4 py-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                              row.type === 'Factorial' 
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600' 
                                : 'bg-gradient-to-br from-fuchsia-500 to-pink-600'
                            }`}>
                              {row.run}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              row.type === 'Factorial'
                                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                                : 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white font-mono">{row.cup}</td>
                          <td className="px-4 py-3 text-white font-mono">{row.angle}°</td>
                          <td className="px-4 py-3 text-white font-mono">{row.bands}</td>
                          <td className="px-4 py-3 text-green-400 font-mono font-bold bg-violet-500/5">{row.distance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4 italic">
                Note: Run order is randomized to prevent systematic bias. Always perform experiments in the order shown, not 1-2-3-4...
              </p>
            </div>

            {/* Analysis Results */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">What We Learn from Analysis</h3>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-2xl p-8">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-3">
                    <Zap className="w-6 h-6 text-green-400" />
                    <span>Key Findings</span>
                  </h4>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
                      <div className="text-sm text-gray-400 mb-2">Most Important Factor</div>
                      <div className="text-2xl font-bold text-green-400 mb-1">Rubber Bands</div>
                      <div className="text-xs text-gray-500">52% of variation</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
                      <div className="text-sm text-gray-400 mb-2">Second Factor</div>
                      <div className="text-2xl font-bold text-green-400 mb-1">Cup Position</div>
                      <div className="text-xs text-gray-500">28% of variation</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
                      <div className="text-sm text-gray-400 mb-2">Third Factor</div>
                      <div className="text-2xl font-bold text-green-400 mb-1">Arm Angle</div>
                      <div className="text-xs text-gray-500">15% of variation</div>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-green-200">
                        <strong>Rubber band tension</strong> has the biggest impact: more bands = more distance (no surprise!)
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-green-200">
                        <strong>Cup position back</strong> gives longer throws (better leverage)
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-green-200">
                        <strong>Arm angle has optimal point</strong> around 50° (too shallow or too steep = shorter distance)
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Zap className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-green-200">
                        <strong>Interaction detected:</strong> Cup position and rubber bands work together (back position + many bands = best combo)
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Prediction Model */}
                <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/30 rounded-2xl p-8">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-3">
                    <Target className="w-6 h-6 text-violet-400" />
                    <span>The Prediction Model (Your Control Panel)</span>
                  </h4>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    After analysis, we get a mathematical equation that predicts distance based on the three factors. 
                    Now we can work backwards: <strong className="text-white">enter a desired distance, and calculate the settings needed!</strong>
                  </p>
                  
                  <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                    <div className="text-center mb-6">
                      <div className="text-sm text-gray-400 mb-2">Want to hit a target?</div>
                      <div className="text-lg text-white mb-4">Enter desired distance:</div>
                      <div className="flex items-center justify-center space-x-4">
                        <input
                          type="number"
                          placeholder="45"
                          className="w-32 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-center text-2xl font-bold focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                        />
                        <span className="text-gray-400">feet</span>
                        <button className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition">
                          Calculate Settings
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-700/50 pt-6 grid md:grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-400 mb-2">Cup Position</div>
                        <div className="text-3xl font-bold text-violet-400">4.2</div>
                        <div className="text-xs text-gray-500 mt-1">≈ Position 4</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-400 mb-2">Arm Angle</div>
                        <div className="text-3xl font-bold text-violet-400">52°</div>
                        <div className="text-xs text-gray-500 mt-1">Slightly above mid</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-400 mb-2">Rubber Bands</div>
                        <div className="text-3xl font-bold text-violet-400">4.3</div>
                        <div className="text-xs text-gray-500 mt-1">≈ 4 bands</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-200">
                      <strong>That's the power of DOE!</strong> Instead of random trial-and-error, you now have precise control. 
                      Want 30 feet? 40 feet? 50 feet? Just plug it in and get your settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-400/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                <Lightbulb className="w-7 h-7 text-blue-400" />
                <span>Key Takeaways from the Catapult Example</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-400 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-200 mb-1">Efficiency</h4>
                    <p className="text-blue-200/80 text-sm">
                      Only 12 launches told us everything. Testing all 125 combinations (5×5×5) would take 10× longer!
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-400 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-200 mb-1">Understanding</h4>
                    <p className="text-blue-200/80 text-sm">
                      We learned which factors matter most (rubber bands &gt; cup &gt; angle) and how they interact
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-400 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-200 mb-1">Control</h4>
                    <p className="text-blue-200/80 text-sm">
                      The prediction model gives us precise control - input desired distance, get the settings
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-400 font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-200 mb-1">Curvature Detection</h4>
                    <p className="text-blue-200/80 text-sm">
                      Center points revealed the arm angle has an optimal point (not just "more is better")
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Try It Yourself */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-slate-700/50 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Try It Yourself?</h3>
              <p className="text-gray-400 mb-6">
                Clone this catapult experiment to your account and explore the data interactively
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 flex items-center space-x-2">
                  <Copy className="w-5 h-5" />
                  <span>Clone Catapult Experiment</span>
                </button>
                <button className="bg-slate-800/60 text-gray-300 px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition border border-slate-700/50 flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Download Data CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOE Methodology Tab */}
        {activeTab === 'methodology' && (
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
                Design of Experiments Methodology
              </h2>
              <p className="text-xl text-gray-400">
                Understanding the science and strategy behind effective experimentation
              </p>
            </div>

            {/* Core Concepts */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Target className="w-6 h-6 text-violet-400" />
                  <span>What is DOE?</span>
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Design of Experiments (DOE) is a systematic method to determine the cause-and-effect relationship 
                  between factors affecting a process and the output of that process.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span>Identify which factors truly matter</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span>Understand factor interactions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span>Optimize multiple responses simultaneously</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span>Build predictive models</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Zap className="w-6 h-6 text-green-400" />
                  <span>Why Use DOE?</span>
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Traditional one-factor-at-a-time (OFAT) experiments are inefficient and miss interactions. 
                  DOE tests multiple factors simultaneously to reveal the full picture.
                </p>
                <div className="space-y-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-sm font-semibold text-green-400 mb-1">Fewer Experiments</div>
                    <div className="text-xs text-gray-400">Get more information with less work</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-sm font-semibold text-green-400 mb-1">Find Interactions</div>
                    <div className="text-xs text-gray-400">Discover how factors work together</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-sm font-semibold text-green-400 mb-1">Better Optimization</div>
                    <div className="text-xs text-gray-400">Find truly optimal settings</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Design Types Comparison */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Choosing the Right Design</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Full Factorial',
                    icon: '🎯',
                    factors: '2-5',
                    when: 'You want complete information about all factors and all their interactions',
                    pros: ['All interactions visible', 'Complete understanding', 'Simple interpretation'],
                    cons: ['Requires more runs', 'Becomes impractical >5 factors'],
                    example: '3 factors = 8 runs (2³)'
                  },
                  {
                    name: 'Fractional Factorial',
                    icon: '⚡',
                    factors: '5-15',
                    when: 'You need to screen many factors efficiently and some interactions can be assumed negligible',
                    pros: ['Much fewer runs', 'Still identifies key factors', 'Good for screening'],
                    cons: ['Some interactions confounded', 'May need follow-up'],
                    example: '7 factors = 32 runs instead of 128'
                  },
                  {
                    name: 'Plackett-Burman',
                    icon: '🚀',
                    factors: '7-30+',
                    when: 'You have many factors and want maximum efficiency, assuming interactions are negligible',
                    pros: ['Ultra-efficient', 'Many factors screened', 'Minimal runs'],
                    cons: ['Main effects only', 'Interactions aliased', 'Assumes sparsity'],
                    example: '11 factors = 12 runs (N+1)'
                  }
                ].map((design, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                    <div className="text-5xl mb-4">{design.icon}</div>
                    <h4 className="text-xl font-bold text-white mb-2">{design.name}</h4>
                    <div className="text-sm text-gray-400 mb-4">
                      <strong className="text-violet-400">{design.factors} factors</strong>
                    </div>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">{design.when}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="text-xs font-semibold text-green-400 mb-1">Pros</div>
                        <ul className="space-y-1">
                          {design.pros.map((pro, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start space-x-1">
                              <span className="text-green-400">✓</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-amber-400 mb-1">Cons</div>
                        <ul className="space-y-1">
                          {design.cons.map((con, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start space-x-1">
                              <span className="text-amber-400">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-700/50">
                      <div className="text-xs text-gray-500 mb-1">Example</div>
                      <div className="text-sm text-violet-400 font-mono">{design.example}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Principles */}
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Key DOE Principles</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    principle: 'Randomization',
                    icon: '🎲',
                    description: 'Run experiments in random order to prevent systematic bias from time-based effects or learning curves.',
                    why: 'Eliminates confounding from unknown variables'
                  },
                  {
                    principle: 'Replication',
                    icon: '🔄',
                    description: 'Include center points or repeated runs to estimate experimental error and improve model precision.',
                    why: 'Provides measure of pure error and variability'
                  },
                  {
                    principle: 'Blocking',
                    icon: '📦',
                    description: 'Group experiments to account for known nuisance variables (day, operator, batch).',
                    why: 'Reduces noise from controllable but uninteresting factors'
                  },
                  {
                    principle: 'Orthogonality',
                    icon: '⊥',
                    description: 'Design experiments so factor effects can be estimated independently of each other.',
                    why: 'Allows clean separation of factor effects'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{item.icon}</div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2">{item.principle}</h4>
                        <p className="text-sm text-gray-300 mb-3 leading-relaxed">{item.description}</p>
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                          <div className="text-xs text-violet-300">
                            <strong>Why it matters:</strong> {item.why}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Process */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">The Analysis Process</h3>
              <div className="space-y-4">
                {[
                  {
                    step: 'Data Collection',
                    description: 'Perform experiments in randomized order and record all responses accurately',
                    tools: ['Design matrix', 'Run order', 'Data validation']
                  },
                  {
                    step: 'ANOVA',
                    description: 'Partition variation to identify which factors significantly affect the response',
                    tools: ['F-tests', 'p-values', 'R² metrics']
                  },
                  {
                    step: 'Main Effects',
                    description: 'Calculate the average effect of changing each factor from low to high',
                    tools: ['Main effects plots', 'Effect sizes']
                  },
                  {
                    step: 'Interactions',
                    description: 'Identify if factors work together (synergy) or against each other',
                    tools: ['Interaction plots', '2-way ANOVA']
                  },
                  {
                    step: 'Model Building',
                    description: 'Create mathematical equations that predict response from factor settings',
                    tools: ['Regression', 'Coefficient estimates']
                  },
                  {
                    step: 'Diagnostics',
                    description: 'Check model assumptions and validate predictions',
                    tools: ['Residual plots', 'Normal probability', 'Lack of fit']
                  },
                  {
                    step: 'Optimization',
                    description: 'Find factor settings that give desired response values',
                    tools: ['Prediction', 'Desirability functions', 'Confirmation runs']
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center justify-center text-violet-400 font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2">{item.step}</h4>
                        <p className="text-gray-400 mb-3">{item.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.tools.map((tool, i) => (
                            <span key={i} className="text-xs bg-slate-800/50 text-violet-300 px-3 py-1 rounded-full border border-violet-500/20">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Glossary Tab */}
        {activeTab === 'glossary' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
                DOE Glossary
              </h2>
              <p className="text-xl text-gray-400">
                Common terms and concepts in Design of Experiments
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  term: 'Factor',
                  definition: 'An independent variable that you deliberately change in your experiment.',
                  example: 'Temperature, pressure, mixing time, material type'
                },
                {
                  term: 'Response',
                  definition: 'A dependent variable that you measure as the output of your experiment.',
                  example: 'Strength, yield, cycle time, cost, quality rating'
                },
                {
                  term: 'Level',
                  definition: 'A specific setting or value of a factor.',
                  example: 'Temperature at 150°C (low) or 200°C (high)'
                },
                {
                  term: 'Run',
                  definition: 'A single experiment with specific factor level combinations.',
                  example: 'One catapult launch at position 3, 50°, 3 bands'
                },
                {
                  term: 'Main Effect',
                  definition: 'The average change in response when a factor changes from low to high.',
                  example: 'Temperature increases strength by 15 MPa on average'
                },
                {
                  term: 'Interaction',
                  definition: 'When the effect of one factor depends on the level of another factor.',
                  example: 'High temp + high pressure gives extra boost beyond individual effects'
                },
                {
                  term: 'Center Point',
                  definition: 'A run at the middle level of all factors, used to detect curvature.',
                  example: 'All factors at their midpoint: 175°C, 75 psi, 3 bands'
                },
                {
                  term: 'Randomization',
                  definition: 'Performing experiments in random order to eliminate systematic bias.',
                  example: 'Run order: 5, 2, 7, 1... not 1, 2, 3, 4...'
                },
                {
                  term: 'ANOVA',
                  definition: 'Analysis of Variance - statistical method to test which factors significantly affect the response.',
                  example: 'Temperature p<0.001 (significant), Material p=0.45 (not significant)'
                },
                {
                  term: 'R²',
                  definition: 'R-squared measures how well the model fits the data (0=no fit, 1=perfect fit).',
                  example: 'R²=0.89 means model explains 89% of variation'
                },
                {
                  term: 'F-Statistic',
                  definition: 'Measures if factor effects are larger than random noise. Higher = more significant.',
                  example: 'F=24.3 indicates highly significant model'
                },
                {
                  term: 'p-value',
                  definition: 'Probability that observed effect is due to random chance. p<0.05 = significant.',
                  example: 'p=0.001 means <0.1% chance effect is random'
                },
                {
                  term: 'Degrees of Freedom (DF)',
                  definition: 'Number of independent pieces of information available for estimation.',
                  example: '2-level factor has DF=1 (high vs low comparison)'
                },
                {
                  term: 'Residual',
                  definition: 'Difference between observed and predicted values. Used to check model validity.',
                  example: 'Actual=45, Predicted=42, Residual=3'
                },
                {
                  term: 'Confounding',
                  definition: 'When two effects cannot be separated. Common in fractional designs.',
                  example: 'Factor A effect mixed with BC interaction'
                },
                {
                  term: 'Blocking',
                  definition: 'Grouping runs to account for known sources of variability.',
                  example: 'Run half experiments Monday, half Friday (block=day)'
                },
                {
                  term: 'Lack of Fit',
                  definition: 'Test checking if model adequately describes the data.',
                  example: 'Non-significant lack of fit (p=0.28) is good!'
                },
                {
                  term: 'Curvature',
                  definition: 'Non-linear relationship between factor and response (quadratic effect).',
                  example: 'Temperature has optimal point - too high or low is bad'
                },
                {
                  term: 'Factorial Design',
                  definition: 'Experimental design testing all combinations of factor levels.',
                  example: '2³ = 8 runs for 3 factors at 2 levels each'
                },
                {
                  term: 'Screening Design',
                  definition: 'Efficient design to identify which factors matter from many candidates.',
                  example: 'Plackett-Burman: test 11 factors with just 12 runs'
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition">
                  <h4 className="text-xl font-bold text-white mb-3">{item.term}</h4>
                  <p className="text-gray-300 mb-3 leading-relaxed">{item.definition}</p>
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                    <div className="text-xs text-violet-400 font-semibold mb-1">Example:</div>
                    <div className="text-xs text-violet-300 italic">{item.example}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-400">
                Common questions about using the DOE Platform
              </p>
            </div>

            <div className="space-y-4">
              <FAQItem
                question="How many runs do I need for my experiment?"
                answer={
                  <div className="space-y-2">
                    <p>It depends on your design type and number of factors:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Full Factorial:</strong> 2^k runs (e.g., 3 factors = 8 runs)</li>
                      <li><strong>Fractional Factorial:</strong> Typically 2^(k-p) where p is the fraction (e.g., 7 factors = 32 runs instead of 128)</li>
                      <li><strong>Plackett-Burman:</strong> N+1 runs for N factors (e.g., 11 factors = 12 runs)</li>
                    </ul>
                    <p className="mt-2">Add 3-5 center points to any design to detect curvature.</p>
                  </div>
                }
              />
              
              <FAQItem
                question="Do I really need to run experiments in random order?"
                answer={
                  <div>
                    <p className="mb-2"><strong>Yes!</strong> Randomization is critical. Here's why:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Prevents systematic bias from time-based effects (equipment warm-up, operator learning, material aging)</li>
                      <li>Ensures statistical validity of p-values and confidence intervals</li>
                      <li>Protects against unknown lurking variables</li>
                    </ul>
                    <p className="mt-2">The platform generates randomized run order automatically. Follow it!</p>
                  </div>
                }
              />

              <FAQItem
                question="What if I can't complete all runs?"
                answer={
                  <div>
                    <p>You can analyze with partial data:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li><strong>50% complete:</strong> Minimum for preliminary analysis</li>
                      <li><strong>75% complete:</strong> Good confidence in results</li>
                      <li><strong>100% complete:</strong> Full statistical power</li>
                    </ul>
                    <p className="mt-2">The platform will warn you if you have insufficient data. More runs = more confident results!</p>
                  </div>
                }
              />

              <FAQItem
                question="How do I know which factors are really important?"
                answer={
                  <div>
                    <p className="mb-2">Look at three things in your analysis results:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li><strong>p-value &lt; 0.05:</strong> Factor is statistically significant</li>
                      <li><strong>Large effect size:</strong> Factor causes big changes in response</li>
                      <li><strong>Pareto chart:</strong> Shows factors ranked by contribution (often 2-3 factors dominate)</li>
                    </ol>
                    <p className="mt-2">Don't just look at p-values - a factor can be "significant" but have tiny practical impact!</p>
                  </div>
                }
              />

              <FAQItem
                question="What are center points and do I need them?"
                answer={
                  <div>
                    <p className="mb-2">Center points are runs at the midpoint of all factors. They help you:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Detect curvature:</strong> See if relationships are non-linear</li>
                      <li><strong>Estimate error:</strong> Provide replication for statistical tests</li>
                      <li><strong>Check model validity:</strong> Test if 2-level model is adequate</li>
                    </ul>
                    <p className="mt-2"><strong>Recommendation:</strong> Always include 3-5 center points unless you're certain relationships are linear.</p>
                  </div>
                }
              />

              <FAQItem
                question="Can I add more factors after starting?"
                answer={
                  <div>
                    <p>No - the experimental design is set when generated. However, you have options:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li><strong>Sequential experimentation:</strong> Complete current design, then create follow-up experiment</li>
                      <li><strong>Design augmentation:</strong> Add runs to existing design (Phase 2 feature)</li>
                      <li><strong>New experiment:</strong> Start fresh with expanded factor list</li>
                    </ul>
                    <p className="mt-2">Pro tip: Think carefully about factors before generating design!</p>
                  </div>
                }
              />

              <FAQItem
                question="What's the difference between correlation and causation?"
                answer={
                  <div>
                    <p className="mb-2">Critical distinction:</p>
                    <p><strong>Correlation:</strong> Two things change together (but one doesn't necessarily cause the other)</p>
                    <p className="mt-2"><strong>Causation:</strong> Changing one thing directly causes change in another</p>
                    <p className="mt-2 bg-green-500/10 border border-green-400/30 rounded-lg p-3">
                      <strong>Good news:</strong> DOE establishes causation because YOU control the factors. When you deliberately change temperature and see strength change, that's causal!
                    </p>
                  </div>
                }
              />

              <FAQItem
                question="How do I handle missing or bad data points?"
                answer={
                  <div>
                    <p className="mb-2">If you have a bad run (equipment failure, obvious mistake):</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Mark it clearly in notes</li>
                      <li>Re-run the same factor combination if possible</li>
                      <li>Don't delete without re-running - it creates imbalance</li>
                    </ol>
                    <p className="mt-2"><strong>Never:</strong> Cherry-pick data or delete "outliers" without investigation. Outliers often teach you something important!</p>
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-t border-violet-500/20 mt-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Still Have Questions?</h3>
          <p className="text-gray-400 mb-8">
            We're here to help you succeed with your experiments
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Contact Support</span>
            </button>
            <button className="bg-slate-800/60 text-gray-300 px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition border border-slate-700/50 flex items-center space-x-2">
              <ExternalLink className="w-5 h-5" />
              <span>Community Forum</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
