'use client';

export interface WorkflowStep {
  order: number;
  agent: string;
  action: string;
  output?: string;
}

export interface WorkflowData {
  name: string;
  description?: string;
  agents: string[];
  steps: WorkflowStep[];
}

export interface WorkflowDiagramProps {
  workflow: WorkflowData;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;
const NODE_GAP = 60;
const PADDING = 20;

export function WorkflowDiagram({ workflow }: WorkflowDiagramProps) {
  const { name, description, agents, steps } = workflow;

  // Use agents array if available, otherwise derive from steps
  const agentSequence = agents.length > 0
    ? agents
    : steps.map(s => s.agent).filter((v, i, a) => a.indexOf(v) === i);

  const nodeCount = agentSequence.length;
  const svgWidth = Math.max(
    PADDING * 2 + nodeCount * NODE_WIDTH + (nodeCount - 1) * NODE_GAP,
    400
  );
  const svgHeight = PADDING * 2 + NODE_HEIGHT + (steps.length > 0 ? 100 : 40);

  const getNodePosition = (index: number): NodePosition => ({
    x: PADDING + index * (NODE_WIDTH + NODE_GAP),
    y: PADDING,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  });

  const renderNode = (agentName: string, index: number) => {
    const pos = getNodePosition(index);
    const displayName = agentName.length > 16
      ? `${agentName.slice(0, 14)}...`
      : agentName;

    return (
      <g key={`node-${index}`}>
        {/* Node box */}
        <rect
          x={pos.x}
          y={pos.y}
          width={pos.width}
          height={pos.height}
          fill="#fefcf3"
          stroke="#1e293b"
          strokeWidth={1}
        />
        {/* Agent name */}
        <text
          x={pos.x + pos.width / 2}
          y={pos.y + pos.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#0f172a"
          fontFamily="monospace"
          fontSize={12}
          fontWeight="bold"
        >
          {displayName}
        </text>
        {/* Step number above */}
        <text
          x={pos.x + pos.width / 2}
          y={pos.y - 8}
          textAnchor="middle"
          fill="#1e293b"
          fontFamily="monospace"
          fontSize={10}
          opacity={0.6}
        >
          [{index + 1}]
        </text>
      </g>
    );
  };

  const renderArrow = (fromIndex: number) => {
    const from = getNodePosition(fromIndex);
    const to = getNodePosition(fromIndex + 1);
    const startX = from.x + from.width;
    const endX = to.x;
    const y = from.y + from.height / 2;
    const midX = (startX + endX) / 2;

    return (
      <g key={`arrow-${fromIndex}`}>
        {/* Arrow line */}
        <line
          x1={startX}
          y1={y}
          x2={endX - 12}
          y2={y}
          stroke="#1e293b"
          strokeWidth={1}
        />
        {/* Arrow head using symbol */}
        <text
          x={midX}
          y={y + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#1e293b"
          fontFamily="monospace"
          fontSize={16}
        >
          {'\u2192'}
        </text>
      </g>
    );
  };

  return (
    <div className="border border-[#1e293b] bg-[#fefcf3] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] px-4 py-3">
        <div>
          <h3 className="font-bold text-[#0f172a]">{name}</h3>
          {description && (
            <p className="mt-1 text-xs text-[#1e293b] opacity-70">{description}</p>
          )}
        </div>
        <span className="text-xs text-[#1e293b] opacity-60">
          agents: {nodeCount} | steps: {steps.length}
        </span>
      </div>

      {/* SVG Diagram */}
      <div className="overflow-x-auto p-4">
        {nodeCount > 0 ? (
          <svg
            width={svgWidth}
            height={svgHeight}
            className="min-w-full"
            style={{ minWidth: svgWidth }}
          >
            {/* Render arrows first (behind nodes) */}
            {agentSequence.slice(0, -1).map((_, index) => renderArrow(index))}

            {/* Render nodes */}
            {agentSequence.map((agent, index) => renderNode(agent, index))}

            {/* Legend */}
            <text
              x={PADDING}
              y={NODE_HEIGHT + PADDING + 30}
              fill="#1e293b"
              fontFamily="monospace"
              fontSize={10}
              opacity={0.5}
            >
              workflow sequence {'\u2192'}
            </text>
          </svg>
        ) : (
          <div className="py-8 text-center text-sm text-[#1e293b] opacity-60">
            {'\u00f8'} no agents in workflow
          </div>
        )}
      </div>

      {/* Steps detail (optional collapsible section) */}
      {steps.length > 0 && (
        <div className="border-t border-[#1e293b] px-4 py-3">
          <div className="mb-2 text-xs text-[#1e293b] opacity-60">STEP DETAILS</div>
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <span className="flex h-5 w-5 items-center justify-center border border-[#1e293b] text-[#1e293b]">
                  {step.order}
                </span>
                <div className="flex-1">
                  <span className="font-bold text-[#0f172a]">{step.agent}</span>
                  <span className="mx-2 text-[#1e293b] opacity-40">{'\u2192'}</span>
                  <span className="text-[#1e293b]">{step.action}</span>
                  {step.output && (
                    <div className="mt-1 text-[#1e293b] opacity-60">
                      output: {step.output}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
