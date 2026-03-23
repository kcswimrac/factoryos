import React, { useState } from 'react';
import {
  X,
  Factory,
  CheckCircle2,
  Loader2,
  Calendar
} from 'lucide-react';
import { MANUFACTURING_PROCESSES, MATERIALS_BY_PROCESS } from '../../data/demoManufacturing';

/**
 * ManufactureRequestModal - Modal for submitting a manufacturing request
 */
function ManufactureRequestModal({
  node,
  selectedProcess,
  quantity,
  estimate,
  onClose
}) {
  const [formData, setFormData] = useState({
    partName: node?.name || '',
    partNumber: node?.part_number || '',
    process: selectedProcess || 'cnc_milling',
    quantity: quantity || 1,
    material: MATERIALS_BY_PROCESS[selectedProcess]?.[0] || '',
    notes: '',
    targetDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSuccess(true);

    // Close after showing success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const processName = MANUFACTURING_PROCESSES[formData.process]?.name || 'Manufacturing';
  const materials = MATERIALS_BY_PROCESS[formData.process] || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2F36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Factory className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F0F2F4]">
                Request Manufacturing
              </h2>
              <p className="text-sm text-[#6B7280]">
                Send to Backyard Shop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#F0F2F4] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
              <p className="text-lg font-medium text-[#F0F2F4]">
                Request Submitted!
              </p>
              <p className="text-sm text-[#6B7280] mt-2 text-center">
                You'll receive a quote confirmation within 24 hours.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Part Name */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-1.5">
                  Part Name
                </label>
                <input
                  type="text"
                  value={formData.partName}
                  onChange={(e) => handleChange('partName', e.target.value)}
                  className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-[#F0F2F4] text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Part Number */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-1.5">
                  Part Number
                </label>
                <input
                  type="text"
                  value={formData.partNumber}
                  readOnly
                  className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-[#6B7280] text-sm"
                />
              </div>

              {/* Process & Quantity Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#B4BAC4] mb-1.5">
                    Process
                  </label>
                  <select
                    value={formData.process}
                    onChange={(e) => handleChange('process', e.target.value)}
                    className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-[#F0F2F4] text-sm focus:outline-none focus:border-orange-500"
                  >
                    {Object.values(MANUFACTURING_PROCESSES).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B4BAC4] mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                    className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-[#F0F2F4] text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-1.5">
                  Material
                </label>
                <select
                  value={formData.material}
                  onChange={(e) => handleChange('material', e.target.value)}
                  className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-[#F0F2F4] text-sm focus:outline-none focus:border-orange-500"
                >
                  {materials.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-1.5">
                  Target Date (optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => handleChange('targetDate', e.target.value)}
                    className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg pl-10 pr-3 py-2 text-[#F0F2F4] text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={2}
                  placeholder="Special instructions, finish requirements, etc."
                  className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-[#F0F2F4] text-sm placeholder-[#4B5563] focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Estimate Summary */}
              {estimate && (
                <div className="bg-[#15181C] rounded-lg p-3 border border-[#2A2F36]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Preliminary Estimate:</span>
                    <span className="text-[#F0F2F4] font-medium">${estimate.totalCost}</span>
                  </div>
                  <p className="text-xs text-[#4B5563] mt-1">
                    Official quote will confirm final pricing
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2A2F36]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#B4BAC4] hover:text-[#F0F2F4] transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Factory size={16} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManufactureRequestModal;
