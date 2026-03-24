import React, { useState, useMemo } from 'react';
import {
  X,
  Wrench,
  FlaskConical,
  Cog,
  Gauge,
  MapPin,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Package,
  FileText,
  History,
  Link,
  ArrowRight,
  RotateCcw,
  Download,
  ExternalLink,
  Shield
} from 'lucide-react';
import {
  DEMO_CHECKOUTS,
  DEMO_USERS,
  DEMO_ATTACHMENTS,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  getResourceHistory,
  getResourceAttachments,
  isCheckoutOverdue,
  getDaysOverdue,
  isCalibrationOverdue,
  isCalibrationDueSoon
} from '../../data/demoResources';

// =============================================================================
// BADGE COMPONENTS
// =============================================================================

const CategoryBadge = ({ category, size = 'md' }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.tool;
  const icons = {
    tool: Wrench,
    lab_asset: FlaskConical,
    fixture: Cog,
    test_equipment: Gauge
  };
  const Icon = icons[category] || Wrench;
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
      <Icon size={size === 'lg' ? 16 : 12} />
      {config.label}
    </span>
  );
};

const StatusBadge = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
      {config.label}
    </span>
  );
};

// =============================================================================
// TAB COMPONENT
// =============================================================================

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'text-blue-400 border-blue-400'
        : 'text-[#6B7280] border-transparent hover:text-[#B4BAC4] hover:border-[#4A5568]'
    }`}
  >
    {label}
  </button>
);

// =============================================================================
// CHECKOUT CARD
// =============================================================================

const CheckoutCard = ({ checkout, isOpen = false }) => {
  const user = DEMO_USERS[checkout.checked_out_by_user_id];
  const overdue = isCheckoutOverdue(checkout);
  const daysOverdue = getDaysOverdue(checkout);

  return (
    <div className={`p-4 rounded-lg border ${
      overdue
        ? 'bg-red-500/10 border-red-500/30'
        : isOpen
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-[#15181C] border-[#2A2F36]'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <User size={14} className="text-[#6B7280]" />
            <span className="text-[#F0F2F4] font-medium">{user?.name || 'Unknown User'}</span>
            {overdue && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                {daysOverdue}d Overdue
              </span>
            )}
            {isOpen && !overdue && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Currently Out
              </span>
            )}
            {!isOpen && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                Returned
              </span>
            )}
          </div>

          {checkout.purpose_note && (
            <p className="text-sm text-[#B4BAC4] mb-2">{checkout.purpose_note}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Out: {new Date(checkout.checked_out_at).toLocaleDateString()}
            </span>
            {checkout.expected_return_at && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Due: {new Date(checkout.expected_return_at).toLocaleDateString()}
              </span>
            )}
            {checkout.returned_at && (
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-green-400" />
                Returned: {new Date(checkout.returned_at).toLocaleDateString()}
              </span>
            )}
            {checkout.quantity_checked_out > 1 && (
              <span className="flex items-center gap-1">
                <Package size={12} />
                Qty: {checkout.quantity_checked_out}
              </span>
            )}
          </div>

          {(checkout.linked_project_name || checkout.linked_artifact_id) && (
            <div className="mt-2 pt-2 border-t border-[#2A2F36]">
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <Link size={12} />
                {checkout.linked_project_name && (
                  <span>Project: {checkout.linked_project_name}</span>
                )}
                {checkout.linked_artifact_id && (
                  <span>Artifact: {checkout.linked_artifact_id}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// ATTACHMENT CARD
// =============================================================================

const AttachmentCard = ({ attachment }) => {
  const typeIcons = {
    image: FileText,
    manual: FileText,
    certificate: Shield,
    other: FileText
  };
  const Icon = typeIcons[attachment.attachment_type] || FileText;

  return (
    <div className="flex items-center gap-3 p-3 bg-[#15181C] border border-[#2A2F36] rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer">
      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
        <Icon size={20} className="text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#F0F2F4] font-medium truncate">{attachment.title}</div>
        <div className="text-xs text-[#6B7280]">
          {attachment.attachment_type.charAt(0).toUpperCase() + attachment.attachment_type.slice(1)}
          {attachment.file_size_bytes && ` - ${(attachment.file_size_bytes / 1024).toFixed(0)} KB`}
        </div>
      </div>
      <ExternalLink size={16} className="text-[#6B7280]" />
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ResourceDetailDrawer = ({ resource, onClose, onCheckout }) => {
  const [activeTab, setActiveTab] = useState('details');

  // Get data
  const checkoutHistory = useMemo(() => getResourceHistory(resource.id), [resource.id]);
  const openCheckouts = useMemo(() =>
    checkoutHistory.filter(c => c.returned_at === null),
    [checkoutHistory]
  );
  const attachments = useMemo(() => getResourceAttachments(resource.id), [resource.id]);

  // Calibration status
  const calOverdue = isCalibrationOverdue(resource);
  const calDueSoon = isCalibrationDueSoon(resource);

  // Can checkout check
  const canCheckout = resource.status !== 'under_maintenance' &&
                      resource.status !== 'lost' &&
                      resource.quantity_available > 0;

  // Handle return
  const handleReturn = (checkout) => {
    console.log('Return checkout:', checkout);
    alert(`Returning checkout for ${checkout.checked_out_by_name}`);
    // In production, this would call the API
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-[#15181C] border-l border-[#2A2F36] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2F36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F0F2F4]">{resource.name}</h2>
              <div className="text-sm text-[#6B7280] font-mono">{resource.global_artifact_id}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B7280] hover:text-[#F0F2F4] rounded-lg hover:bg-[#2A2F36] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Card */}
        <div className="p-4 border-b border-[#2A2F36]">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <CategoryBadge category={resource.category} size="lg" />
            <StatusBadge status={resource.status} size="lg" />
            <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium border ${
              resource.quantity_available === 0
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : resource.quantity_available < resource.quantity_total
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  : 'bg-green-500/10 text-green-400 border-green-500/30'
            }`}>
              {resource.quantity_available}/{resource.quantity_total} available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {resource.location_label && (
              <div>
                <div className="text-[#6B7280] text-xs mb-1">Location</div>
                <div className="flex items-center gap-1 text-[#F0F2F4]">
                  <MapPin size={14} className="text-blue-400" />
                  {resource.location_label}
                </div>
              </div>
            )}

            {resource.calibration_required && (
              <div>
                <div className="text-[#6B7280] text-xs mb-1">Calibration</div>
                <div className="flex items-center gap-2">
                  {calOverdue ? (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle size={14} />
                      Overdue
                    </span>
                  ) : calDueSoon ? (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock size={14} />
                      Due {new Date(resource.calibration_due_at).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle2 size={14} />
                      Valid until {new Date(resource.calibration_due_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Calibration Warning */}
          {calOverdue && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-400">Calibration Overdue</div>
                <div className="text-xs text-red-300/80">
                  This resource requires calibration. Checkout is still allowed but results may be unreliable.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {canCheckout ? (
              <button
                onClick={onCheckout}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
              >
                <ArrowRight size={18} />
                Checkout
              </button>
            ) : (
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 bg-[#2A2F36] text-[#6B7280] px-4 py-2.5 rounded-lg cursor-not-allowed font-medium"
              >
                {resource.status === 'under_maintenance' ? 'Under Maintenance' :
                 resource.status === 'lost' ? 'Marked Lost' : 'Not Available'}
              </button>
            )}

            {openCheckouts.length > 0 && openCheckouts[0].checked_out_by_user_id === 'user-001' && (
              <button
                onClick={() => handleReturn(openCheckouts[0])}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
              >
                <RotateCcw size={18} />
                Return
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2F36]">
          <TabButton label="Details" active={activeTab === 'details'} onClick={() => setActiveTab('details')} />
          <TabButton label={`History (${checkoutHistory.length})`} active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <TabButton label={`Attachments (${attachments.length})`} active={activeTab === 'attachments'} onClick={() => setActiveTab('attachments')} />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Description */}
              {resource.description && (
                <div>
                  <h4 className="text-sm font-medium text-[#F0F2F4] mb-2">Description</h4>
                  <p className="text-sm text-[#B4BAC4]">{resource.description}</p>
                </div>
              )}

              {/* Current Checkouts */}
              {openCheckouts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#F0F2F4] mb-2">Current Checkouts</h4>
                  <div className="space-y-2">
                    {openCheckouts.map(checkout => (
                      <CheckoutCard key={checkout.id} checkout={checkout} isOpen={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications */}
              <div>
                <h4 className="text-sm font-medium text-[#F0F2F4] mb-2">Specifications</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-[#1C1F24] rounded-lg">
                    <div className="text-[#6B7280] text-xs mb-1">Category</div>
                    <div className="text-[#F0F2F4]">{CATEGORY_CONFIG[resource.category]?.label}</div>
                  </div>
                  <div className="p-3 bg-[#1C1F24] rounded-lg">
                    <div className="text-[#6B7280] text-xs mb-1">Total Quantity</div>
                    <div className="text-[#F0F2F4]">{resource.quantity_total}</div>
                  </div>
                  {resource.calibration_required && (
                    <>
                      <div className="p-3 bg-[#1C1F24] rounded-lg">
                        <div className="text-[#6B7280] text-xs mb-1">Calibration Interval</div>
                        <div className="text-[#F0F2F4]">{resource.calibration_interval_days} days</div>
                      </div>
                      <div className="p-3 bg-[#1C1F24] rounded-lg">
                        <div className="text-[#6B7280] text-xs mb-1">Last Calibration</div>
                        <div className="text-[#F0F2F4]">
                          {resource.last_calibration_at
                            ? new Date(resource.last_calibration_at).toLocaleDateString()
                            : 'Never'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {checkoutHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History size={48} className="mx-auto text-[#6B7280] mb-4" />
                  <h3 className="text-[#F0F2F4] font-medium mb-2">No checkout history</h3>
                  <p className="text-[#6B7280] text-sm">
                    This resource has never been checked out.
                  </p>
                </div>
              ) : (
                checkoutHistory.map(checkout => (
                  <CheckoutCard
                    key={checkout.id}
                    checkout={checkout}
                    isOpen={checkout.returned_at === null}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-3">
              {attachments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto text-[#6B7280] mb-4" />
                  <h3 className="text-[#F0F2F4] font-medium mb-2">No attachments</h3>
                  <p className="text-[#6B7280] text-sm">
                    No manuals, certificates, or images attached to this resource.
                  </p>
                </div>
              ) : (
                attachments.map(attachment => (
                  <AttachmentCard key={attachment.id} attachment={attachment} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailDrawer;
