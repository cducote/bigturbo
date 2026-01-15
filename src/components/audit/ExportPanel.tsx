'use client';

import { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

type ExportFormat = 'toon' | 'json' | 'csv';
type ExportType = 'traces' | 'decisions' | 'full_audit';
type DateRange = '24h' | '7d' | '30d' | 'all' | 'custom';

interface ExportConfig {
  format: ExportFormat;
  type: ExportType;
  dateRange: DateRange;
  customStartDate?: string;
  customEndDate?: string;
  agentFilter?: string;
  statusFilter?: string[];
  includeSpans: boolean;
  includeDecisions: boolean;
}

interface ExportPanelProps {
  onExport?: (config: ExportConfig) => Promise<void>;
  agents?: string[];
}

// ============================================================================
// Format Info Component
// ============================================================================

function FormatInfo({ format }: { format: ExportFormat }) {
  const info: Record<ExportFormat, { description: string; stats: string }> = {
    toon: {
      description: 'Token-Oriented Object Notation - optimized for LLM consumption',
      stats: '30-60% fewer tokens than JSON',
    },
    json: {
      description: 'Standard JSON format - human readable, widely compatible',
      stats: 'Full fidelity, larger file size',
    },
    csv: {
      description: 'Comma-separated values - spreadsheet compatible',
      stats: 'Flat structure, limited nesting',
    },
  };

  return (
    <div className="mt-2 bg-[#fffef5] p-3 text-xs">
      <p className="text-[#1e293b]">{info[format].description}</p>
      <p className="mt-1 font-mono text-[#64748b]">{info[format].stats}</p>
    </div>
  );
}

// ============================================================================
// Option Button Component
// ============================================================================

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1.5 font-mono text-xs transition-colors ${
        selected
          ? 'border-[#1e293b] bg-[#1e293b] text-[#fefcf3]'
          : 'border-[#1e293b] bg-[#fffef5] text-[#1e293b] hover:bg-[#fefce8]'
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Checkbox Component
// ============================================================================

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <div
        className={`flex h-4 w-4 items-center justify-center border border-[#1e293b] text-xs ${
          checked ? 'bg-[#1e293b] text-[#fefcf3]' : 'bg-[#fffef5]'
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked && '\u2713'}
      </div>
      <span className="font-mono text-sm text-[#1e293b]">{label}</span>
    </label>
  );
}

// ============================================================================
// Main ExportPanel Component
// ============================================================================

export function ExportPanel({ onExport, agents = [] }: ExportPanelProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'toon',
    type: 'traces',
    dateRange: '7d',
    includeSpans: true,
    includeDecisions: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
    downloadUrl?: string;
  } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      if (onExport) {
        await onExport(config);
        setExportResult({
          success: true,
          message: 'Export completed successfully',
        });
      } else {
        // Call the export API directly
        const response = await fetch('/api/audit/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        const data = await response.json();

        if (response.ok) {
          setExportResult({
            success: true,
            message: `Exported ${data.recordCount} records`,
            downloadUrl: data.downloadUrl,
          });
        } else {
          setExportResult({
            success: false,
            message: data.message || 'Export failed',
          });
        }
      }
    } catch (error) {
      setExportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Export failed',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="border border-[#1e293b]">
      {/* Header */}
      <div className="border-b border-[#1e293b] bg-[#fefce8] px-4 py-3">
        <h3 className="font-mono text-sm font-bold text-[#0f172a]">
          export audit data
        </h3>
        <p className="mt-0.5 text-xs text-[#64748b]">
          Generate exports for analysis or prompt-engineer agent consumption
        </p>
      </div>

      <div className="space-y-6 bg-[#fefcf3] p-4">
        {/* Export Format */}
        <div>
          <label className="mb-2 block text-xs text-[#64748b]">format</label>
          <div className="flex gap-2">
            <OptionButton
              selected={config.format === 'toon'}
              onClick={() => setConfig({ ...config, format: 'toon' })}
            >
              .toon
            </OptionButton>
            <OptionButton
              selected={config.format === 'json'}
              onClick={() => setConfig({ ...config, format: 'json' })}
            >
              .json
            </OptionButton>
            <OptionButton
              selected={config.format === 'csv'}
              onClick={() => setConfig({ ...config, format: 'csv' })}
            >
              .csv
            </OptionButton>
          </div>
          <FormatInfo format={config.format} />
        </div>

        {/* Export Type */}
        <div>
          <label className="mb-2 block text-xs text-[#64748b]">export type</label>
          <div className="flex gap-2">
            <OptionButton
              selected={config.type === 'traces'}
              onClick={() => setConfig({ ...config, type: 'traces' })}
            >
              traces
            </OptionButton>
            <OptionButton
              selected={config.type === 'decisions'}
              onClick={() => setConfig({ ...config, type: 'decisions' })}
            >
              decisions
            </OptionButton>
            <OptionButton
              selected={config.type === 'full_audit'}
              onClick={() => setConfig({ ...config, type: 'full_audit' })}
            >
              full audit
            </OptionButton>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="mb-2 block text-xs text-[#64748b]">date range</label>
          <div className="flex flex-wrap gap-2">
            {(['24h', '7d', '30d', 'all'] as DateRange[]).map((range) => (
              <OptionButton
                key={range}
                selected={config.dateRange === range}
                onClick={() => setConfig({ ...config, dateRange: range })}
              >
                {range === 'all' ? 'all time' : `last ${range}`}
              </OptionButton>
            ))}
          </div>
        </div>

        {/* Agent Filter */}
        {agents.length > 0 && (
          <div>
            <label className="mb-2 block text-xs text-[#64748b]">
              filter by agent
            </label>
            <select
              value={config.agentFilter || ''}
              onChange={(e) =>
                setConfig({ ...config, agentFilter: e.target.value || undefined })
              }
              className="w-full border border-[#1e293b] bg-[#fffef5] px-3 py-2 font-mono text-sm text-[#0f172a]"
            >
              <option value="">all agents</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Include Options */}
        <div>
          <label className="mb-2 block text-xs text-[#64748b]">include</label>
          <div className="flex gap-6">
            <Checkbox
              checked={config.includeSpans}
              onChange={(checked) => setConfig({ ...config, includeSpans: checked })}
              label="spans"
            />
            <Checkbox
              checked={config.includeDecisions}
              onChange={(checked) =>
                setConfig({ ...config, includeDecisions: checked })
              }
              label="decisions"
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="border-t border-dashed border-[#1e293b] pt-4">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full border border-[#1e293b] bg-[#1e293b] px-4 py-3 font-mono text-sm text-[#fefcf3] hover:bg-[#0f172a] disabled:opacity-50"
          >
            {isExporting ? 'exporting...' : `export as .${config.format}`}
          </button>
        </div>

        {/* Export Result */}
        {exportResult && (
          <div
            className={`border p-3 ${
              exportResult.success
                ? 'border-[#10b981] bg-[#d1fae5]'
                : 'border-[#ef4444] bg-[#fee2e2]'
            }`}
          >
            <p
              className={`font-mono text-sm ${
                exportResult.success ? 'text-[#065f46]' : 'text-[#991b1b]'
              }`}
            >
              {exportResult.success ? '\u2713' : '\u2717'} {exportResult.message}
            </p>
            {exportResult.downloadUrl && (
              <a
                href={exportResult.downloadUrl}
                download
                className="mt-2 inline-block font-mono text-xs text-[#065f46] underline"
              >
                download file {'\u2192'}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
