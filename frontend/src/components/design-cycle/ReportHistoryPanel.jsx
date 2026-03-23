import React from 'react';
import {
  FileText,
  Download,
  Clock,
  User,
  Shield,
  Link,
  Calculator,
  FlaskConical,
  Award,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { REPORT_TYPES } from '../../config/designPhases';

const REPORT_ICONS = {
  design_summary: FileText,
  requirements_traceability: Link,
  analysis_pack: Calculator,
  test_validation_pack: FlaskConical,
  gate_approvals_audit: Shield,
  competition_judging: Award
};

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20'
  },
  generating: {
    icon: Loader2,
    label: 'Generating',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    animate: true
  },
  completed: {
    icon: CheckCircle,
    label: 'Ready',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20'
  }
};

function ReportHistoryPanel({
  reports = [],
  onDownload,
  onViewArtifacts,
  loading = false
}) {
  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Report History</h3>
        </div>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No reports generated yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Generate a report to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Report History</h3>
        </div>
        <span className="text-sm text-gray-500">{reports.length} reports</span>
      </div>

      <div className="space-y-3">
        {reports.map(report => {
          const ReportIcon = REPORT_ICONS[report.report_type] || FileText;
          const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
          const StatusIcon = statusConfig.icon;
          const reportType = REPORT_TYPES[report.report_type];

          return (
            <div
              key={report.id}
              className="bg-gray-900/50 rounded-lg border border-gray-700 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <ReportIcon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      {reportType?.name || report.report_type}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.generated_at).toLocaleDateString()} at{' '}
                        {new Date(report.generated_at).toLocaleTimeString()}
                      </span>
                      {report.generated_by_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {report.generated_by_name}
                        </span>
                      )}
                    </div>
                    {report.include_children && (
                      <span className="inline-block mt-2 text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                        Includes children
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                    <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {report.status === 'completed' && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-700">
                  <button
                    onClick={() => onDownload(report.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download {report.report_format?.toUpperCase()}
                  </button>
                  {onViewArtifacts && (
                    <button
                      onClick={() => onViewArtifacts(report.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Artifacts
                    </button>
                  )}
                  {report.snapshot_hash && (
                    <span
                      className="ml-auto text-xs text-gray-500 font-mono"
                      title={`Full hash: ${report.snapshot_hash}`}
                    >
                      #{report.snapshot_hash.substring(0, 8)}
                    </span>
                  )}
                </div>
              )}

              {report.status === 'failed' && report.error_message && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-300">{report.error_message}</p>
                </div>
              )}

              {report.completeness_warnings?.length > 0 && (
                <div className="mt-3 space-y-1">
                  {report.completeness_warnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-yellow-400"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {warning.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ReportHistoryPanel;
