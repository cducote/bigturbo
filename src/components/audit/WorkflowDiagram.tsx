'use client';

export interface WorkflowStep {
  order: number;
  agent: string;
  action: string;
  output?: string;
}

export interface WorkflowData {
  id?: string;
  name: string;
  description?: string;
  agents: string[];
  steps: WorkflowStep[];
}

export interface WorkflowDiagramProps {
  workflow: WorkflowData;
  /** Optional click handler for the workflow tile */
  onClick?: (workflowId: string) => void;
  /** Whether the tile should appear clickable */
  clickable?: boolean;
}

export function WorkflowDiagram({ workflow, onClick, clickable = false }: WorkflowDiagramProps) {
  const { id, name, agents, steps } = workflow;

  // Determine if the tile is interactive
  const isClickable = clickable || !!onClick;
  const workflowId = id || name.toLowerCase().replace(/\s+/g, '-');

  const handleClick = () => {
    if (onClick) {
      onClick(workflowId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(workflowId);
    }
  };

  // Use agents array if available, otherwise derive from steps
  const agentSequence = agents.length > 0
    ? agents
    : steps.map(s => s.agent).filter((v, i, a) => a.indexOf(v) === i);

  const agentCount = agentSequence.length;
  const stepCount = steps.length;

  // Base container classes
  const containerClasses = [
    'border border-[#1e293b] bg-[#fefcf3] font-mono p-4 w-44 h-44 flex flex-col justify-between',
    isClickable && 'cursor-pointer transition-all hover:border-[#0f172a] hover:shadow-md hover:bg-[#fffef5]',
    isClickable && 'focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:ring-offset-2',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `Launch ${name} workflow` : undefined}
    >
      {/* Top section - Name */}
      <div>
        <h3 className="font-bold text-[#0f172a] text-sm leading-tight">{name}</h3>
      </div>

      {/* Middle section - Stats */}
      <div className="text-xs text-[#1e293b] opacity-60">
        <div>{agentCount} agent{agentCount !== 1 ? 's' : ''}</div>
        <div>{stepCount} step{stepCount !== 1 ? 's' : ''}</div>
      </div>

      {/* Bottom section - Launch indicator */}
      {isClickable && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#1e293b] opacity-50">/{workflowId.replace('-command', '')}</span>
          <span className="text-[#1e293b]">{'\u2192'}</span>
        </div>
      )}
    </div>
  );
}
