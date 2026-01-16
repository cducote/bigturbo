'use client';

import { useState, useEffect } from 'react';
import { PromptViewer, AgentBadge } from '@/components/audit';
import type { Agent } from '@/types/audit';

// ============================================================================
// Types
// ============================================================================

interface AgentWithContent extends Agent {
  rawContent?: string;
}

interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

interface VersionHistory {
  agent: string;
  isGitRepo: boolean;
  versions: Array<{
    commit: GitCommit;
    hasContent: boolean;
  }>;
}

interface VersionDetail {
  agent: string;
  version: {
    commit: GitCommit;
    content: string;
  };
  diff?: {
    additions: number;
    deletions: number;
    diff: string;
    previousCommit: GitCommit | null;
  };
}

// ============================================================================
// Version History Panel Component
// ============================================================================

function VersionHistoryPanel({
  agentName,
  onVersionSelect,
  selectedCommit,
}: {
  agentName: string;
  onVersionSelect: (commit: GitCommit | null) => void;
  selectedCommit: GitCommit | null;
}) {
  const [history, setHistory] = useState<VersionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/audit/prompts/history?agent=${encodeURIComponent(agentName)}`);
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [agentName]);

  if (loading) {
    return (
      <div className="border border-[#1e293b] bg-[#fffef5] p-3">
        <p className="text-xs text-[#64748b] font-mono">loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-[#1e293b] bg-[#fee2e2] p-3">
        <p className="text-xs text-[#991b1b] font-mono">{error}</p>
      </div>
    );
  }

  if (!history?.isGitRepo) {
    return (
      <div className="border border-[#1e293b] bg-[#fffef5] p-3">
        <p className="text-xs text-[#64748b] font-mono">not a git repository</p>
      </div>
    );
  }

  if (history.versions.length === 0) {
    return (
      <div className="border border-[#1e293b] bg-[#fffef5] p-3">
        <p className="text-xs text-[#64748b] font-mono">no version history</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1e293b] bg-[#fefcf3]">
      <div className="border-b border-[#1e293b] bg-[#fefce8] px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0f172a] font-mono">version history</span>
          <span className="text-xs text-[#64748b]">{history.versions.length} versions</span>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {/* Current version option */}
        <button
          onClick={() => onVersionSelect(null)}
          className={`w-full text-left px-3 py-2 border-b border-[#e2e8f0] hover:bg-[#fefce8] ${
            selectedCommit === null ? 'bg-[#fefce8]' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#10b981]">current</span>
            {selectedCommit === null && (
              <span className="text-xs text-[#10b981]">{'<-'}</span>
            )}
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">working directory version</p>
        </button>
        {/* Historical versions */}
        {history.versions.map((v, index) => (
          <button
            key={v.commit.hash}
            onClick={() => onVersionSelect(v.commit)}
            className={`w-full text-left px-3 py-2 border-b border-[#e2e8f0] hover:bg-[#fefce8] last:border-b-0 ${
              selectedCommit?.hash === v.commit.hash ? 'bg-[#fefce8]' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#0f172a]">{v.commit.shortHash}</span>
              {index === 0 && (
                <span className="text-xs px-1 border border-[#f59e0b] bg-[#fef3c7] text-[#92400e]">
                  latest
                </span>
              )}
              {selectedCommit?.hash === v.commit.hash && (
                <span className="text-xs text-[#64748b]">{'<-'}</span>
              )}
            </div>
            <p className="text-xs text-[#0f172a] mt-0.5 truncate">{v.commit.message}</p>
            <p className="text-xs text-[#64748b] mt-0.5">
              {v.commit.author} - {new Date(v.commit.date).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Version Content Viewer Component
// ============================================================================

function VersionContentViewer({
  agentName,
  commit,
}: {
  agentName: string;
  commit: GitCommit;
}) {
  const [versionData, setVersionData] = useState<VersionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    async function fetchVersion() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/audit/prompts/version?agent=${encodeURIComponent(agentName)}&commit=${commit.hash}&diff=true`
        );
        if (!res.ok) throw new Error('Failed to fetch version');
        const data = await res.json();
        setVersionData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchVersion();
  }, [agentName, commit.hash]);

  if (loading) {
    return (
      <div className="border border-[#1e293b] bg-[#fffef5] p-8 text-center">
        <p className="text-[#64748b] font-mono">loading version...</p>
      </div>
    );
  }

  if (error || !versionData) {
    return (
      <div className="border border-[#1e293b] bg-[#fee2e2] p-4">
        <p className="text-[#991b1b] font-mono text-sm">Error: {error || 'No data'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Version header */}
      <div className="border border-[#1e293b] bg-[#fefce8] p-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[#64748b]">viewing version</span>
            <p className="font-mono text-sm font-bold text-[#0f172a]">{commit.shortHash}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#0f172a]">{commit.message}</p>
            <p className="text-xs text-[#64748b]">
              {commit.author} - {new Date(commit.date).toLocaleString()}
            </p>
          </div>
        </div>
        {versionData.diff && (
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#e2e8f0]">
            <span className="text-xs text-[#10b981] font-mono">+{versionData.diff.additions}</span>
            <span className="text-xs text-[#ef4444] font-mono">-{versionData.diff.deletions}</span>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="text-xs text-[#1e293b] underline hover:no-underline ml-auto"
            >
              {showDiff ? 'hide diff' : 'show diff'}
            </button>
          </div>
        )}
      </div>

      {/* Diff view */}
      {showDiff && versionData.diff && (
        <div className="border border-[#1e293b] bg-[#fefcf3]">
          <div className="border-b border-[#1e293b] bg-[#fefce8] px-3 py-2">
            <span className="text-xs font-bold text-[#0f172a] font-mono">
              diff {versionData.diff.previousCommit ? `from ${versionData.diff.previousCommit.shortHash}` : '(initial version)'}
            </span>
          </div>
          <pre className="p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            {versionData.diff.diff.split('\n').map((line, i) => {
              let className = 'text-[#64748b]';
              if (line.startsWith('+') && !line.startsWith('+++')) {
                className = 'text-[#10b981] bg-[#d1fae5]';
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                className = 'text-[#ef4444] bg-[#fee2e2]';
              } else if (line.startsWith('@@')) {
                className = 'text-[#64748b] bg-[#e2e8f0]';
              }
              return (
                <div key={i} className={className}>
                  {line || ' '}
                </div>
              );
            })}
          </pre>
        </div>
      )}

      {/* Version content */}
      <PromptViewer
        title={`${agentName} @ ${commit.shortHash}`}
        content={versionData.version.content}
      />
    </div>
  );
}

// ============================================================================
// Agent Prompt Card Component
// ============================================================================

function AgentPromptCard({ agent }: { agent: AgentWithContent }) {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<GitCommit | null>(null);

  return (
    <div className="border border-[#1e293b] bg-[#fefcf3]">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#fefce8] px-4 py-3">
        <div className="flex items-center gap-3">
          <AgentBadge agentId={agent.name} showHumanName />
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`border px-3 py-1 text-xs font-mono ${
            showHistory
              ? 'border-[#10b981] bg-[#d1fae5] text-[#065f46]'
              : 'border-[#1e293b] bg-[#fffef5] text-[#0f172a] hover:bg-[#fefce8]'
          }`}
        >
          {showHistory ? 'hide history' : 'version history'}
        </button>
      </div>

      {/* Content area */}
      <div className="p-4">
        {showHistory ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Version history sidebar */}
            <div className="lg:col-span-1">
              <VersionHistoryPanel
                agentName={agent.name}
                onVersionSelect={setSelectedCommit}
                selectedCommit={selectedCommit}
              />
            </div>

            {/* Content viewer */}
            <div className="lg:col-span-3">
              {selectedCommit ? (
                <VersionContentViewer
                  agentName={agent.name}
                  commit={selectedCommit}
                />
              ) : agent.rawContent ? (
                <PromptViewer
                  title={`${agent.name} (current)`}
                  content={agent.rawContent}
                />
              ) : (
                <div className="border border-[#1e293b] p-4">
                  <p className="text-sm text-[#64748b]">Raw content not available</p>
                </div>
              )}
            </div>
          </div>
        ) : agent.rawContent ? (
          <PromptViewer title={agent.name} content={agent.rawContent} />
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-[#64748b]">Raw content not available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PromptsPage() {
  const [agents, setAgents] = useState<AgentWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const listRes = await fetch('/api/audit/agents', { cache: 'no-store' });
        if (!listRes.ok) throw new Error('Failed to fetch agents list');

        const listData = await listRes.json();
        const agentsList: Agent[] = listData.agents || [];

        // Fetch each agent's full content
        const agentsWithContent = await Promise.all(
          agentsList.map(async (agent) => {
            try {
              const detailRes = await fetch(
                `/api/audit/agents/${encodeURIComponent(agent.name)}`,
                { cache: 'no-store' }
              );

              if (!detailRes.ok) {
                return { ...agent, rawContent: undefined };
              }

              const detailData = await detailRes.json();
              return detailData.agent as AgentWithContent;
            } catch {
              return { ...agent, rawContent: undefined };
            }
          })
        );

        setAgents(agentsWithContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-[#1e293b] pb-4">
          <h1 className="text-2xl font-bold text-[#0f172a]">Prompt Browser</h1>
          <p className="text-sm text-[#64748b] mt-1">
            View and inspect raw agent prompt configurations
          </p>
        </header>
        <div className="border border-[#1e293b] p-8 text-center">
          <p className="text-[#64748b] font-mono">loading prompts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-[#1e293b] pb-4">
          <h1 className="text-2xl font-bold text-[#0f172a]">Prompt Browser</h1>
        </header>
        <div className="border border-[#ef4444] bg-[#fee2e2] p-4">
          <p className="text-[#991b1b] font-mono">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-[#1e293b] pb-4">
        <h1 className="text-2xl font-bold text-[#0f172a]">Prompt Browser</h1>
        <p className="text-sm text-[#64748b] mt-1">
          View and inspect raw agent prompt configurations with version history
        </p>
      </header>

      {agents.length === 0 ? (
        <div className="border border-[#1e293b] p-8 text-center">
          <p className="text-[#64748b]">No prompts found</p>
          <p className="text-xs text-[#94a3b8] mt-2">
            Agent prompts are loaded from .claude/agents/*.md files
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-xs text-[#64748b]">
              {agents.length} agent prompt{agents.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <div className="space-y-6">
            {agents.map((agent) => (
              <AgentPromptCard key={agent.id} agent={agent} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
