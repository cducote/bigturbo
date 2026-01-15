'use client';

import Link from 'next/link';

export interface AgentCardAgent {
  name: string;
  humanName?: string | null;
  color?: string | null;
  description: string | null;
  tools?: string[];
  capabilities: string[];
}

export interface AgentCardProps {
  agent: AgentCardAgent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { name, humanName, color, description, tools, capabilities } = agent;
  const displayName = humanName || name;
  const agentId = name;

  return (
    <div className="border border-[#1e293b] bg-[#fefcf3] p-4 font-mono">
      <div className="mb-2">
        <div className="flex items-center gap-2">
          {color && (
            <span
              className="h-3 w-3 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
          )}
          <Link
            href={`/audit/agents/${encodeURIComponent(name)}`}
            className="text-[#0f172a] hover:underline"
          >
            <h3 className="text-lg font-bold">{displayName}</h3>
          </Link>
        </div>
        {humanName && (
          <p className="mt-0.5 text-xs text-[#64748b]">{agentId}</p>
        )}
      </div>

      {description && (
        <p className="mb-3 text-sm text-[#1e293b]">{description}</p>
      )}

      {tools && tools.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-[#1e293b] opacity-70">tools:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {tools.map((tool) => (
              <span
                key={tool}
                className="border border-[#1e293b] bg-[#fffef5] px-2 py-0.5 text-xs"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {capabilities.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-[#1e293b] opacity-70">capabilities:</span>
          <ul className="mt-1 text-xs text-[#1e293b]">
            {capabilities.slice(0, 3).map((cap, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-1">-</span>
                <span className="truncate">{cap}</span>
              </li>
            ))}
            {capabilities.length > 3 && (
              <li className="text-[#1e293b] opacity-60">
                {'\u22ef'} {capabilities.length - 3} more
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-3 border-t border-[#1e293b] pt-2">
        <Link
          href={`/audit/agents/${encodeURIComponent(name)}`}
          className="text-xs text-[#1e293b] hover:underline"
        >
          view details {'\u2192'}
        </Link>
      </div>
    </div>
  );
}
