import React, { useState, useRef, useEffect } from 'react';
import {
  Factory,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Clock,
  DollarSign,
  Minus,
  Plus
} from 'lucide-react';
import {
  MANUFACTURING_PROCESSES,
  PROCESS_LIST,
  getDFMFeedback,
  getManufacturingEstimate,
  getRecommendedProcess
} from '../../data/demoManufacturing';
import ManufactureRequestModal from './ManufactureRequestModal';

// =============================================================================
// MANUFACTURE POPOVER
// =============================================================================

function ManufacturePopover({ node, onClose, anchorRef }) {
  const [selectedProcess, setSelectedProcess] = useState(() => getRecommendedProcess(node));
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const popoverRef = useRef(null);

  // Get feedback and estimate based on selections
  const dfmFeedback = getDFMFeedback(selectedProcess, node?.part_number);
  const estimate = getManufacturingEstimate(selectedProcess, quantity, node?.part_number);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  // Severity icon mapping
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" />;
    }
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  return (
    <>
      <div
        ref={popoverRef}
        className="absolute top-full left-0 mt-1 z-50 w-72 bg-[#1C1F24] border border-[#2A2F36] rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-[#2A2F36] flex items-center gap-2">
          <Factory className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-[#F0F2F4]">Manufacture</span>
        </div>

        <div className="p-3 space-y-3">
          {/* Section 1: Process Selection */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
              Manufacturing Process
            </label>
            <div className="relative">
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                className="w-full appearance-none bg-[#15181C] border border-[#2A2F36] rounded px-3 py-1.5 pr-8 text-sm text-[#F0F2F4] focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {PROCESS_LIST.map(process => (
                  <option key={process.id} value={process.id}>
                    {process.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
            </div>
          </div>

          {/* Section 2: DFM Feedback */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
              Quick Manufacturability Check
            </label>
            <div className="bg-[#15181C] rounded border border-[#2A2F36] divide-y divide-[#2A2F36]">
              {dfmFeedback.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 px-2.5 py-2">
                  {getSeverityIcon(item.severity)}
                  <span className={`text-xs leading-tight ${
                    item.severity === 'error' ? 'text-red-300' :
                    item.severity === 'warning' ? 'text-amber-200' :
                    'text-[#B4BAC4]'
                  }`}>
                    {item.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Estimate */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
              Estimated Cost & Lead Time
            </label>
            <div className="bg-[#15181C] rounded border border-[#2A2F36] p-2.5">
              {/* Cost Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-[#6B7280]">Unit Cost:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[#F0F2F4]">${estimate.unitCost}</span>
                  {estimate.discount && (
                    <span className="text-[10px] px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                      -{estimate.discount}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6B7280]">Qty:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-[#2A2F36] hover:bg-[#3A3F46] text-[#B4BAC4] transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-[#F0F2F4]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-[#2A2F36] hover:bg-[#3A3F46] text-[#B4BAC4] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-[#2A2F36]">
                <span className="text-xs text-[#6B7280]">Est. Total:</span>
                <span className="text-base font-semibold text-[#F0F2F4]">${estimate.totalCost}</span>
              </div>

              {/* Lead Time */}
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#2A2F36]">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-[#6B7280]">Lead Time:</span>
                <span className="text-xs font-medium text-[#B4BAC4]">{estimate.leadTime}</span>
              </div>

              {/* Confidence Note */}
              <p className="text-[10px] text-[#4B5563] mt-2 italic">
                Preliminary AI estimate
              </p>
            </div>
          </div>

          {/* Section 4: Action Button */}
          <div className="pt-1">
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Factory className="w-4 h-4" />
              Send to Backyard Shop
            </button>
            <p className="text-[10px] text-[#4B5563] text-center mt-1.5">
              Official quote will confirm pricing and lead time.
            </p>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showModal && (
        <ManufactureRequestModal
          node={node}
          selectedProcess={selectedProcess}
          quantity={quantity}
          estimate={estimate}
          onClose={() => {
            setShowModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}

// =============================================================================
// NODE MANUFACTURE BUTTON
// =============================================================================

/**
 * NodeManufactureButton - Small button that appears on physical nodes
 * Opens a popover for quick manufacturing estimation and ordering
 */
function NodeManufactureButton({ node }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);

  // Don't render for non-physical nodes
  if (!node || node.node_class === 'functional_group' || node.isVirtualFolder || node.isArtifact) {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`
          p-1 rounded transition-colors
          ${isOpen
            ? 'bg-orange-500/20 text-orange-400'
            : 'hover:bg-[#2A2F36] text-[#6B7280] hover:text-orange-400'
          }
        `}
        title="Manufacture"
      >
        <Factory className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <ManufacturePopover
          node={node}
          onClose={() => setIsOpen(false)}
          anchorRef={buttonRef}
        />
      )}
    </div>
  );
}

export default NodeManufactureButton;
