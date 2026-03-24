import React, { useState, useRef } from 'react';
import {
  X,
  Link2,
  Upload,
  FileBox,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  FolderOpen,
  File
} from 'lucide-react';

// Supported CAD file extensions
const CAD_EXTENSIONS = {
  'sldprt': 'SolidWorks Part',
  'sldasm': 'SolidWorks Assembly',
  'slddrw': 'SolidWorks Drawing',
  'f3d': 'Fusion 360',
  'f3z': 'Fusion 360 Archive',
  'step': 'STEP',
  'stp': 'STEP',
  'iges': 'IGES',
  'igs': 'IGES',
  'dwg': 'AutoCAD Drawing',
  'dxf': 'AutoCAD DXF',
  'ipt': 'Inventor Part',
  'iam': 'Inventor Assembly',
  'idw': 'Inventor Drawing',
  'catpart': 'CATIA Part',
  'catproduct': 'CATIA Product',
  'catdrawing': 'CATIA Drawing',
  'prt': 'Pro/E Part',
  'asm': 'Pro/E Assembly',
  'x_t': 'Parasolid',
  'x_b': 'Parasolid Binary',
  'stl': 'STL Mesh',
  '3mf': '3MF'
};

const ACCEPT_EXTENSIONS = Object.keys(CAD_EXTENSIONS).map(ext => `.${ext}`).join(',');

/**
 * CADLinkUploadModal - Modal for linking or uploading CAD files to a node
 */
function CADLinkUploadModal({ node, mode, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState(mode || 'upload'); // 'link' or 'upload'
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!CAD_EXTENSIONS[ext]) {
        setError(`Unsupported file type: .${ext}`);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!CAD_EXTENSIONS[ext]) {
        setError(`Unsupported file type: .${ext}`);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getCadToolFromExtension = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return CAD_EXTENSIONS[ext] || 'Unknown';
  };

  const handleSubmit = async () => {
    setError(null);
    setUploading(true);

    try {
      if (activeTab === 'link') {
        if (!linkUrl.trim()) {
          setError('Please enter a URL or file path');
          setUploading(false);
          return;
        }

        // Create the CAD attachment object
        const cadAttachment = {
          id: `cad-${Date.now()}`,
          type: 'cad',
          name: linkName.trim() || linkUrl.split('/').pop() || 'Linked CAD',
          url: linkUrl.trim(),
          linked: true,
          cad_tool: getCadToolFromExtension(linkUrl),
          linked_at: new Date().toISOString()
        };

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        if (onSave) {
          onSave(node, cadAttachment);
        }
      } else {
        if (!selectedFile) {
          setError('Please select a file to upload');
          setUploading(false);
          return;
        }

        // Create the CAD attachment object
        const cadAttachment = {
          id: `cad-${Date.now()}`,
          type: 'cad',
          name: selectedFile.name,
          filename: selectedFile.name,
          size: selectedFile.size,
          cad_tool: getCadToolFromExtension(selectedFile.name),
          uploaded_at: new Date().toISOString()
        };

        // Simulate upload
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (onSave) {
          onSave(node, cadAttachment);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2F36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
              <FileBox className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F0F2F4]">
                {activeTab === 'link' ? 'Link CAD File' : 'Upload CAD File'}
              </h2>
              <p className="text-sm text-[#6B7280]">
                {node?.name} ({node?.part_number})
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

        {/* Tab Selector */}
        <div className="flex border-b border-[#2A2F36]">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5'
                : 'text-[#6B7280] hover:text-[#B4BAC4]'
            }`}
          >
            <Upload size={16} />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5'
                : 'text-[#6B7280] hover:text-[#B4BAC4]'
            }`}
          >
            <Link2 size={16} />
            Link External
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
              <p className="text-lg font-medium text-[#F0F2F4]">
                CAD file {activeTab === 'link' ? 'linked' : 'uploaded'} successfully!
              </p>
            </div>
          ) : activeTab === 'upload' ? (
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-violet-500/50 bg-violet-500/5'
                    : 'border-[#2A2F36] hover:border-violet-500/30 hover:bg-[#15181C]'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <File className="w-12 h-12 text-violet-400 mb-3" />
                    <p className="text-[#F0F2F4] font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-[#6B7280] mt-1">
                      {getCadToolFromExtension(selectedFile.name)} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="mt-3 text-sm text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-[#4B5563] mb-3" />
                    <p className="text-[#B4BAC4] mb-1">
                      Drag and drop your CAD file here
                    </p>
                    <p className="text-sm text-[#6B7280]">
                      or click to browse
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_EXTENSIONS}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Supported Formats */}
              <div className="bg-[#15181C] rounded-lg p-3">
                <p className="text-xs text-[#6B7280] mb-2">Supported formats:</p>
                <p className="text-xs text-[#9CA3AF]">
                  SolidWorks (.sldprt, .sldasm, .slddrw) • Fusion 360 (.f3d, .f3z) • STEP (.step, .stp) • IGES (.iges, .igs) • AutoCAD (.dwg, .dxf) • Inventor (.ipt, .iam, .idw) • CATIA (.catpart, .catproduct) • STL (.stl) • 3MF (.3mf)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Link URL/Path */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                  File URL or Path
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://... or C:\CAD\part.sldprt"
                    className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg pl-10 pr-4 py-2.5 text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-violet-500"
                  />
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  Enter a URL, network path, or local file path
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="e.g., Main Assembly CAD"
                  className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg px-4 py-2.5 text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Info Box */}
              <div className="bg-[#15181C] rounded-lg p-3 flex items-start gap-3">
                <FolderOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#B4BAC4]">
                    Linking creates a reference to the external file.
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    The file remains in its original location. Updates to the original file will be reflected automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 rounded-lg p-3">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2A2F36]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#B4BAC4] hover:text-[#F0F2F4] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'link' && !linkUrl.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {activeTab === 'link' ? 'Linking...' : 'Uploading...'}
                </>
              ) : (
                <>
                  {activeTab === 'link' ? <Link2 size={16} /> : <Upload size={16} />}
                  {activeTab === 'link' ? 'Link CAD' : 'Upload CAD'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CADLinkUploadModal;
