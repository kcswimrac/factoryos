import React, { useState, useMemo } from 'react';
import {
  Wrench,
  FlaskConical,
  Cog,
  Gauge,
  Search,
  Filter,
  Plus,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  User,
  ChevronRight,
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import Header from '../../Header';
import PageSummary from '../ui/PageSummary';
import ResourceDetailDrawer from './ResourceDetailDrawer';
import CheckoutModal from './CheckoutModal';
import {
  DEMO_RESOURCES,
  DEMO_CHECKOUTS,
  DEMO_USERS,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  computeResourceStats,
  isCheckoutOverdue,
  getDaysOverdue,
  isCalibrationOverdue,
  isCalibrationDueSoon
} from '../../data/demoResources';

// =============================================================================
// BADGE COMPONENTS
// =============================================================================

const CategoryBadge = ({ category }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.tool;
  const icons = {
    tool: Wrench,
    lab_asset: FlaskConical,
    fixture: Cog,
    test_equipment: Gauge
  };
  const Icon = icons[category] || Wrench;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
      {config.label}
    </span>
  );
};

const AvailabilityBadge = ({ available, total }) => {
  const ratio = available / total;
  let colorClass = 'text-green-400 bg-green-500/10 border-green-500/30';
  if (ratio === 0) {
    colorClass = 'text-red-400 bg-red-500/10 border-red-500/30';
  } else if (ratio < 0.5) {
    colorClass = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {available}/{total} available
    </span>
  );
};

const CalibrationBadge = ({ resource }) => {
  if (!resource.calibration_required) return null;

  if (isCalibrationOverdue(resource)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
        <AlertTriangle size={10} />
        Cal Overdue
      </span>
    );
  }

  if (isCalibrationDueSoon(resource)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
        <Clock size={10} />
        Cal Due Soon
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
      <CheckCircle2 size={10} />
      Calibrated
    </span>
  );
};

const OverdueBadge = ({ checkout }) => {
  if (!isCheckoutOverdue(checkout)) return null;
  const days = getDaysOverdue(checkout);

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
      <Clock size={10} />
      {days}d Overdue
    </span>
  );
};

// =============================================================================
// STATS CARD COMPONENT
// =============================================================================

const StatsCard = ({ label, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs opacity-80">{label}</div>
        </div>
        {Icon && <Icon size={24} className="opacity-50" />}
      </div>
    </div>
  );
};

// =============================================================================
// RESOURCE ROW COMPONENT
// =============================================================================

const ResourceRow = ({ resource, checkout, onClick }) => {
  const user = checkout ? DEMO_USERS[checkout.checked_out_by_user_id] : null;

  return (
    <div
      onClick={onClick}
      className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4 hover:border-blue-500/50 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-mono text-[#6B7280]">{resource.global_artifact_id}</span>
            <CategoryBadge category={resource.category} />
            <AvailabilityBadge available={resource.quantity_available} total={resource.quantity_total} />
            <StatusBadge status={resource.status} />
            <CalibrationBadge resource={resource} />
            {checkout && <OverdueBadge checkout={checkout} />}
          </div>
          <h3 className="text-[#F0F2F4] font-medium mb-2">{resource.name}</h3>
          <div className="flex items-center gap-4 text-xs text-[#6B7280] flex-wrap">
            {resource.location_label && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {resource.location_label}
              </span>
            )}
            {checkout && user && (
              <span className="flex items-center gap-1 text-yellow-400">
                <User size={12} />
                Checked out by {user.name}
              </span>
            )}
            {checkout && checkout.expected_return_at && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Due: {new Date(checkout.expected_return_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={20} className="text-[#6B7280] group-hover:text-blue-400 transition-colors flex-shrink-0" />
      </div>
    </div>
  );
};

// =============================================================================
// FILTER PILLS
// =============================================================================

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#2A2F36] border border-[#2A2F36]'
    }`}
  >
    {label}
  </button>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ResourcesHome = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [calibrationFilter, setCalibrationFilter] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutResource, setCheckoutResource] = useState(null);

  // Compute stats
  const stats = useMemo(() => computeResourceStats(), []);

  // Get unique locations for filter
  const locations = useMemo(() => {
    const locationSet = new Set(
      DEMO_RESOURCES.filter(r => r.location_label).map(r => r.location_label)
    );
    return Array.from(locationSet).sort();
  }, []);

  // Filter resources
  const filteredResources = useMemo(() => {
    return DEMO_RESOURCES.filter(r => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !r.name.toLowerCase().includes(query) &&
          !r.global_artifact_id.toLowerCase().includes(query) &&
          !(r.description && r.description.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'all' && r.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      // Calibration due filter
      if (calibrationFilter) {
        if (!r.calibration_required) return false;
        if (!isCalibrationDueSoon(r) && !isCalibrationOverdue(r)) return false;
      }

      return true;
    });
  }, [searchQuery, categoryFilter, statusFilter, calibrationFilter]);

  // Get current checkout for each resource
  const getResourceCheckout = (resourceId) => {
    return DEMO_CHECKOUTS.find(
      c => c.resource_id === resourceId && c.returned_at === null
    );
  };

  // Handle checkout
  const handleCheckout = (resource) => {
    setCheckoutResource(resource);
    setShowCheckoutModal(true);
  };

  // Handle checkout complete
  const handleCheckoutComplete = (checkoutData) => {
    console.log('Checkout completed:', checkoutData);
    setShowCheckoutModal(false);
    setCheckoutResource(null);
    // In production, this would refresh the data from the API
  };

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F4] flex items-center gap-2">
              <Package className="text-blue-400" />
              Resources
            </h1>
            <p className="text-[#6B7280] mt-1">
              Track shared tools, fixtures, and lab equipment. Check out what you need, return when done.
            </p>
          </div>
          <button
            onClick={() => alert('Add Resource form would open here (admin only)')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Resource
          </button>
        </div>

        {/* Section Summary */}
        <PageSummary icon={Package} iconColor="text-blue-400" borderColor="border-blue-500/30" bgColor="bg-blue-500/5">
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Purpose:</strong> Track shared tools, fixtures, test equipment, and prototype lab assets. Answer: "Who has it, where is it, when is it due back, is it calibrated, do we own any X."
          </p>
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Method:</strong> Check out resources when needed, return when done. Optionally link checkouts to projects, nodes, or experiments for traceability.
          </p>
          <p>
            <strong className="text-[#F0F2F4]">What this is NOT:</strong> This is not ERP or MRP. No procurement, reorder points, costing, supplier management, or production parts inventory.
          </p>
        </PageSummary>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <StatsCard label="Total Resources" value={stats.totalResources} icon={Package} color="gray" />
          <StatsCard label="Tools" value={stats.totalByCategory.tool} icon={Wrench} color="blue" />
          <StatsCard label="Fixtures" value={stats.totalByCategory.fixture} icon={Cog} color="amber" />
          <StatsCard label="Lab Assets" value={stats.totalByCategory.lab_asset} icon={FlaskConical} color="purple" />
          <StatsCard label="Open Checkouts" value={stats.openCheckouts} icon={Clock} color="yellow" />
          <StatsCard label="Overdue" value={stats.overdueCheckouts} icon={AlertTriangle} color="red" />
          <StatsCard label="Cal Due Soon" value={stats.calibrationDueSoon} icon={AlertCircle} color="amber" />
        </div>

        {/* Filters */}
        <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[#6B7280]" />
              <span className="text-sm text-[#6B7280]">Filters:</span>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="tool">Tools</option>
              <option value="fixture">Fixtures</option>
              <option value="lab_asset">Lab Assets</option>
              <option value="test_equipment">Test Equipment</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="checked_out">Checked Out</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="lost">Lost</option>
            </select>

            {/* Calibration Due Toggle */}
            <button
              onClick={() => setCalibrationFilter(!calibrationFilter)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                calibrationFilter
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#15181C] text-[#B4BAC4] border border-[#2A2F36] hover:border-amber-500/50'
              }`}
            >
              <AlertCircle size={16} />
              Cal Due
            </button>
          </div>
        </div>

        {/* Resources List */}
        <div className="space-y-3">
          {filteredResources.length === 0 ? (
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-8 text-center">
              <Package size={48} className="mx-auto text-[#6B7280] mb-4" />
              <h3 className="text-[#F0F2F4] font-medium mb-2">No resources found</h3>
              <p className="text-[#6B7280] text-sm">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            filteredResources.map(resource => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                checkout={getResourceCheckout(resource.id)}
                onClick={() => setSelectedResource(resource)}
              />
            ))
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 text-center text-sm text-[#6B7280]">
          Showing {filteredResources.length} of {DEMO_RESOURCES.length} resources
        </div>
      </main>

      {/* Resource Detail Drawer */}
      {selectedResource && (
        <ResourceDetailDrawer
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onCheckout={() => handleCheckout(selectedResource)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && checkoutResource && (
        <CheckoutModal
          resource={checkoutResource}
          onClose={() => {
            setShowCheckoutModal(false);
            setCheckoutResource(null);
          }}
          onConfirm={handleCheckoutComplete}
        />
      )}
    </div>
  );
};

export default ResourcesHome;
