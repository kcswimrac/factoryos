import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowRight,
  Calendar,
  FileText,
  Link,
  AlertTriangle,
  Info,
  Settings,
  Package
} from 'lucide-react';
import { DEMO_PROJECTS } from '../../data/demoProjects';
import { isCalibrationOverdue } from '../../data/demoResources';

// =============================================================================
// DEMO PROJECT DATA (simplified for dropdown)
// =============================================================================

const DEMO_PROJECT_OPTIONS = [
  { id: 'proj-baja-2025', name: 'Baja 2025' },
  { id: 'proj-ebus-gen1', name: 'Electric Bus Gen1' },
  { id: 'proj-fsae-2024', name: 'FSAE 2024' }
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const CheckoutModal = ({ resource, onClose, onConfirm }) => {
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [purposeNote, setPurposeNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [linkedProjectId, setLinkedProjectId] = useState('');
  const [scrappyMode, setScrappyMode] = useState(false);
  const [errors, setErrors] = useState({});

  // Check calibration status
  const calOverdue = isCalibrationOverdue(resource);

  // Check if resource is under maintenance
  const underMaintenance = resource.status === 'under_maintenance';

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!scrappyMode && !expectedReturnDate) {
      newErrors.expectedReturnDate = 'Expected return date is required';
    }

    if (scrappyMode && !expectedReturnDate && !purposeNote) {
      newErrors.purposeNote = 'Purpose note is required when return date is not set';
    }

    if (quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    if (quantity > resource.quantity_available) {
      newErrors.quantity = `Only ${resource.quantity_available} available`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const checkoutData = {
      resource_id: resource.id,
      expected_return_at: expectedReturnDate ? new Date(expectedReturnDate).toISOString() : null,
      purpose_note: purposeNote || null,
      quantity: quantity,
      linked_project_id: linkedProjectId || null,
      linked_project_name: linkedProjectId
        ? DEMO_PROJECT_OPTIONS.find(p => p.id === linkedProjectId)?.name
        : null
    };

    onConfirm(checkoutData);
  };

  // Get min date for return (tomorrow)
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  // Default date suggestion (1 week from now)
  const suggestedDate = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2F36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F0F2F4]">Checkout Resource</h2>
              <p className="text-sm text-[#6B7280]">{resource.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B7280] hover:text-[#F0F2F4] rounded-lg hover:bg-[#2A2F36] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Warnings */}
          {calOverdue && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-400">Calibration Overdue</div>
                <p className="text-xs text-red-300/80">
                  This resource requires calibration. Results may be unreliable. Checkout is still allowed.
                </p>
              </div>
            </div>
          )}

          {underMaintenance && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-3">
              <Settings size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-orange-400">Under Maintenance</div>
                <p className="text-xs text-orange-300/80">
                  This resource is currently under maintenance and cannot be checked out.
                </p>
              </div>
            </div>
          )}

          {/* Resource Summary */}
          <div className="bg-[#15181C] rounded-lg p-3 flex items-center gap-3">
            <Package size={20} className="text-blue-400" />
            <div className="flex-1">
              <div className="text-sm text-[#F0F2F4] font-medium">{resource.name}</div>
              <div className="text-xs text-[#6B7280]">
                {resource.quantity_available} of {resource.quantity_total} available
              </div>
            </div>
          </div>

          {/* Scrappy Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#15181C] rounded-lg">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-amber-400" />
              <span className="text-sm text-[#B4BAC4]">Scrappy Startup Mode</span>
            </div>
            <button
              type="button"
              onClick={() => setScrappyMode(!scrappyMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                scrappyMode ? 'bg-amber-500' : 'bg-[#2A2F36]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  scrappyMode ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          {scrappyMode && (
            <p className="text-xs text-amber-400/80 -mt-2 pl-1">
              Return date is optional, but purpose note is required.
            </p>
          )}

          {/* Quantity (for multi-quantity resources) */}
          {resource.quantity_total > 1 && (
            <div>
              <label className="block text-sm font-medium text-[#F0F2F4] mb-2">
                <Package size={14} className="inline mr-2 text-blue-400" />
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={resource.quantity_available}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className={`w-full bg-[#15181C] border rounded-lg px-3 py-2.5 text-sm text-[#F0F2F4] focus:outline-none ${
                  errors.quantity ? 'border-red-500' : 'border-[#2A2F36] focus:border-blue-500'
                }`}
              />
              {errors.quantity && (
                <p className="text-xs text-red-400 mt-1">{errors.quantity}</p>
              )}
            </div>
          )}

          {/* Expected Return Date */}
          <div>
            <label className="block text-sm font-medium text-[#F0F2F4] mb-2">
              <Calendar size={14} className="inline mr-2 text-blue-400" />
              Expected Return Date
              {!scrappyMode && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              min={minDate}
              className={`w-full bg-[#15181C] border rounded-lg px-3 py-2.5 text-sm text-[#F0F2F4] focus:outline-none ${
                errors.expectedReturnDate ? 'border-red-500' : 'border-[#2A2F36] focus:border-blue-500'
              }`}
            />
            {errors.expectedReturnDate && (
              <p className="text-xs text-red-400 mt-1">{errors.expectedReturnDate}</p>
            )}
            {!expectedReturnDate && (
              <button
                type="button"
                onClick={() => setExpectedReturnDate(suggestedDate)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
              >
                Suggest: 1 week from now
              </button>
            )}
          </div>

          {/* Purpose Note */}
          <div>
            <label className="block text-sm font-medium text-[#F0F2F4] mb-2">
              <FileText size={14} className="inline mr-2 text-blue-400" />
              Purpose Note
              {scrappyMode && !expectedReturnDate && <span className="text-red-400 ml-1">*</span>}
            </label>
            <textarea
              value={purposeNote}
              onChange={(e) => setPurposeNote(e.target.value)}
              placeholder="What will you use this for?"
              rows={2}
              className={`w-full bg-[#15181C] border rounded-lg px-3 py-2.5 text-sm text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none resize-none ${
                errors.purposeNote ? 'border-red-500' : 'border-[#2A2F36] focus:border-blue-500'
              }`}
            />
            {errors.purposeNote && (
              <p className="text-xs text-red-400 mt-1">{errors.purposeNote}</p>
            )}
          </div>

          {/* Link to Project (Optional) */}
          <div>
            <label className="block text-sm font-medium text-[#F0F2F4] mb-2">
              <Link size={14} className="inline mr-2 text-green-400" />
              Link to Project
              <span className="text-[#6B7280] font-normal ml-2">(optional)</span>
            </label>
            <select
              value={linkedProjectId}
              onChange={(e) => setLinkedProjectId(e.target.value)}
              className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2.5 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="">No project link</option>
              {DEMO_PROJECT_OPTIONS.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#6B7280] mt-1">
              Linking helps track which resources were used for which projects.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2A2F36]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#6B7280] hover:text-[#F0F2F4] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={underMaintenance || resource.quantity_available === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              underMaintenance || resource.quantity_available === 0
                ? 'bg-[#2A2F36] text-[#6B7280] cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <ArrowRight size={16} />
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
