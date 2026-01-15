'use client';

import { useState } from 'react';
import type { LangfuseTrace, Decision } from '@/lib/langfuse';
import { AgentBadge } from './AgentBadge';

// ============================================================================
// Types
// ============================================================================

interface DecisionTreeProps {
  trace: LangfuseTrace;
}

interface DecisionNodeProps {
  decision: Decision;
  spanName: string;
  agentName?: string;
  index: number;
}

// ============================================================================
// Decision Node Component
// ============================================================================

function DecisionNode({ decision, spanName, agentName, index }: DecisionNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAlternatives = decision.alternatives && decision.alternatives.length > 0;

  return (
    <div className="relative border-b border-[#1e293b] bg-[#fefcf3]">
      {/* Timeline connector */}
      <div className="absolute bottom-0 left-6 top-0 w-px bg-[#1e293b]" />

      <div className="relative py-3 pl-14 pr-4">
        {/* Timeline dot */}
        <div className="absolute left-4 top-4 flex h-5 w-5 items-center justify-center border border-[#1e293b] bg-[#fffef5] text-xs font-mono text-[#0f172a]">
          {index + 1}
        </div>

        {/* Decision header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {agentName && (
                <AgentBadge agentId={agentName} />
              )}
              <span className="text-xs text-[#64748b]">{spanName}</span>
            </div>
            <p className="mt-1 font-mono text-sm font-medium text-[#0f172a]">
              {decision.question}
            </p>
          </div>

          {decision.confidence !== undefined && (
            <div className="ml-4 text-right">
              <span className="text-xs text-[#64748b]">confidence</span>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 w-16 bg-[#e2e8f0]">
                  <div
                    className="h-full bg-[#1e293b]"
                    style={{ width: `${(decision.confidence || 0) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-[#0f172a]">
                  {((decision.confidence || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Answer */}
        <div className="mt-3 border-l-2 border-[#1e293b] pl-3">
          <span className="text-xs text-[#64748b]">answer:</span>
          <p className="mt-0.5 font-mono text-sm text-[#0f172a]">{decision.answer}</p>
        </div>

        {/* Reasoning (if present) */}
        {decision.reasoning && (
          <div className="mt-3">
            <span className="text-xs text-[#64748b]">reasoning:</span>
            <p className="mt-0.5 text-sm text-[#1e293b]">{decision.reasoning}</p>
          </div>
        )}

        {/* Tool used */}
        {decision.toolUsed && (
          <div className="mt-2">
            <span className="text-xs text-[#64748b]">tool_used:</span>
            <span className="ml-2 font-mono text-xs text-[#0f172a]">{decision.toolUsed}</span>
          </div>
        )}

        {/* Alternatives (expandable) */}
        {hasAlternatives && (
          <div className="mt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#0f172a]"
            >
              <span>{isExpanded ? '\u25BC' : '\u25B6'}</span>
              <span>
                alternatives considered ({decision.alternatives!.length})
              </span>
            </button>
            {isExpanded && (
              <ul className="mt-2 space-y-1 pl-4">
                {decision.alternatives!.map((alt, idx) => (
                  <li
                    key={idx}
                    className="flex items-start font-mono text-xs text-[#64748b]"
                  >
                    <span className="mr-2">{'\u00D8'}</span>
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState() {
  return (
    <div className="border border-dashed border-[#1e293b] bg-[#fffef5] p-8 text-center">
      <div className="font-mono text-4xl text-[#cbd5e1]">{'\u2205'}</div>
      <p className="mt-2 font-mono text-sm text-[#64748b]">No decisions recorded</p>
      <p className="mt-1 text-xs text-[#94a3b8]">
        Decision points will appear as agents make choices during execution
      </p>
    </div>
  );
}

// ============================================================================
// Decision Stats Component
// ============================================================================

function DecisionStats({ decisions }: { decisions: Array<{ decision: Decision; spanName: string }> }) {
  const avgConfidence =
    decisions.reduce((sum, d) => sum + (d.decision.confidence || 0), 0) / decisions.length;

  const toolsUsed = decisions
    .map((d) => d.decision.toolUsed)
    .filter((t): t is string => !!t);

  const uniqueTools = [...new Set(toolsUsed)];

  return (
    <div className="flex gap-6 border-b border-[#1e293b] bg-[#fefce8] px-4 py-3">
      <div>
        <span className="text-xs text-[#64748b]">total decisions</span>
        <p className="font-mono text-lg font-bold text-[#0f172a]">{decisions.length}</p>
      </div>
      <div>
        <span className="text-xs text-[#64748b]">avg confidence</span>
        <p className="font-mono text-lg font-bold text-[#0f172a]">
          {(avgConfidence * 100).toFixed(0)}%
        </p>
      </div>
      <div>
        <span className="text-xs text-[#64748b]">tools used</span>
        <p className="font-mono text-lg font-bold text-[#0f172a]">{uniqueTools.length}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Main DecisionTree Component
// ============================================================================

export function DecisionTree({ trace }: DecisionTreeProps) {
  // Extract all decisions from spans
  const allDecisions: Array<{
    decision: Decision;
    spanName: string;
    agentName?: string;
  }> = [];

  if (trace.spans) {
    for (const span of trace.spans) {
      if (span.decisions && span.decisions.length > 0) {
        for (const decision of span.decisions) {
          allDecisions.push({
            decision,
            spanName: span.name || span.operationType,
            agentName: span.agentName,
          });
        }
      }
    }
  }

  if (allDecisions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="border border-[#1e293b]">
      <div className="border-b border-[#1e293b] bg-[#fefcf3] px-4 py-3">
        <h3 className="font-mono text-sm font-bold text-[#0f172a]">
          decision tree
        </h3>
        <p className="mt-0.5 text-xs text-[#64748b]">
          Choices made during trace execution
        </p>
      </div>

      <DecisionStats decisions={allDecisions} />

      <div className="relative">
        {allDecisions.map((item, index) => (
          <DecisionNode
            key={index}
            decision={item.decision}
            spanName={item.spanName}
            agentName={item.agentName}
            index={index}
          />
        ))}
        {/* End cap for timeline */}
        <div className="relative h-4 bg-[#fefcf3]">
          <div className="absolute left-6 top-0 h-2 w-px bg-[#1e293b]" />
          <div className="absolute left-5 top-2 h-2 w-2 border border-[#1e293b] bg-[#fffef5]" />
        </div>
      </div>
    </div>
  );
}
