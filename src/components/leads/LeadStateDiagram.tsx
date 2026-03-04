import { useState, useRef, useEffect } from "react";

const NODES = [
  // Contact Phase
  { id: "NEW", x: 500, y: 60, phase: "contact" },
  { id: "WRONG_NUMBER", x: 280, y: 170, phase: "contact" },
  { id: "NO_ANSWER", x: 500, y: 170, phase: "contact" },
  { id: "FOLLOWING_UP", x: 720, y: 170, phase: "contact" },
  { id: "CONTACTED", x: 500, y: 300, phase: "contact" },

  // Qualification Phase
  { id: "QUALIFIED", x: 500, y: 430, phase: "qualification" },
  { id: "NOT_QUALIFIED", x: 260, y: 430, phase: "qualification" },
  { id: "NOT_INTERESTED", x: 740, y: 430, phase: "qualification" },

  // Evaluation Phase
  { id: "DEMO_SCHEDULED", x: 380, y: 560, phase: "evaluation" },
  { id: "TRIAL_STARTED", x: 620, y: 560, phase: "evaluation" },

  // Closing Phase
  { id: "WAITING_QUOTATION", x: 320, y: 690, phase: "closing" },
  { id: "QUOTATION_SENT", x: 500, y: 690, phase: "closing" },
  { id: "NEGOTIATION", x: 680, y: 690, phase: "closing" },

  // Terminal
  { id: "WON_CONVERTED", x: 380, y: 830, phase: "terminal" },
  { id: "LOST", x: 620, y: 830, phase: "terminal" },

  // Re-engagement (BE only)
  { id: "REJOINED", x: 820, y: 830, phase: "reengagement" },
];

const EDGES = [
  // Contact
  { from: "NEW", to: "NO_ANSWER" },
  { from: "NEW", to: "WRONG_NUMBER" },
  { from: "NEW", to: "CONTACTED" },
  { from: "WRONG_NUMBER", to: "CONTACTED" },
  { from: "WRONG_NUMBER", to: "NO_ANSWER" },
  { from: "WRONG_NUMBER", to: "LOST" },
  { from: "NO_ANSWER", to: "CONTACTED" },
  { from: "NO_ANSWER", to: "FOLLOWING_UP" },
  { from: "NO_ANSWER", to: "LOST" },
  { from: "FOLLOWING_UP", to: "CONTACTED" },
  { from: "FOLLOWING_UP", to: "NO_ANSWER" },
  { from: "FOLLOWING_UP", to: "LOST" },

  // Qualification
  { from: "CONTACTED", to: "QUALIFIED" },
  { from: "CONTACTED", to: "NOT_QUALIFIED" },
  { from: "CONTACTED", to: "NOT_INTERESTED" },
  { from: "CONTACTED", to: "FOLLOWING_UP" },
  { from: "CONTACTED", to: "LOST" },

  // Evaluation
  { from: "QUALIFIED", to: "DEMO_SCHEDULED" },
  { from: "QUALIFIED", to: "TRIAL_STARTED" },
  { from: "QUALIFIED", to: "WAITING_QUOTATION" },
  { from: "QUALIFIED", to: "LOST" },
  { from: "NOT_QUALIFIED", to: "LOST" },
  { from: "NOT_INTERESTED", to: "LOST" },
  { from: "DEMO_SCHEDULED", to: "WAITING_QUOTATION" },
  { from: "DEMO_SCHEDULED", to: "TRIAL_STARTED" },
  { from: "DEMO_SCHEDULED", to: "NOT_INTERESTED" },
  { from: "DEMO_SCHEDULED", to: "LOST" },

  // Closing
  { from: "WAITING_QUOTATION", to: "QUOTATION_SENT" },
  { from: "WAITING_QUOTATION", to: "LOST" },
  { from: "QUOTATION_SENT", to: "NEGOTIATION" },
  { from: "QUOTATION_SENT", to: "WON_CONVERTED" },
  { from: "QUOTATION_SENT", to: "LOST" },
  { from: "TRIAL_STARTED", to: "WAITING_QUOTATION" },
  { from: "TRIAL_STARTED", to: "NEGOTIATION" },
  { from: "TRIAL_STARTED", to: "WON_CONVERTED" },
  { from: "TRIAL_STARTED", to: "LOST" },
  { from: "NEGOTIATION", to: "WON_CONVERTED" },
  { from: "NEGOTIATION", to: "LOST" },

  // BE-only
  { from: "LOST", to: "REJOINED", beOnly: true },
  { from: "REJOINED", to: "CONTACTED" },
  { from: "REJOINED", to: "FOLLOWING_UP" },
  { from: "REJOINED", to: "QUALIFIED" },
  { from: "REJOINED", to: "LOST" },
];

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  contact: { bg: "#1a2332", border: "#3b82f6", text: "#93c5fd", glow: "rgba(59,130,246,0.3)" },
  qualification: { bg: "#1a2332", border: "#a855f7", text: "#d8b4fe", glow: "rgba(168,85,247,0.3)" },
  evaluation: { bg: "#1a2332", border: "#f59e0b", text: "#fcd34d", glow: "rgba(245,158,11,0.3)" },
  closing: { bg: "#1a2332", border: "#06b6d4", text: "#67e8f9", glow: "rgba(6,182,212,0.3)" },
  terminal: { bg: "#1a2332", border: "#10b981", text: "#6ee7b7", glow: "rgba(16,185,129,0.3)" },
  reengagement: { bg: "#1a2332", border: "#ef4444", text: "#fca5a5", glow: "rgba(239,68,68,0.3)" },
};

const PHASE_LABELS = [
  { label: "CONTACT", y: 10, color: "#3b82f6" },
  { label: "QUALIFICATION", y: 380, color: "#a855f7" },
  { label: "EVALUATION", y: 510, color: "#f59e0b" },
  { label: "CLOSING", y: 645, color: "#06b6d4" },
  { label: "TERMINAL", y: 790, color: "#10b981" },
];

const R = 38;

interface Node {
  id: string;
  x: number;
  y: number;
  phase: string;
}

interface Edge {
  from: string;
  to: string;
  beOnly?: boolean;
}

function getNodeById(id: string): Node | undefined {
  return NODES.find((n) => n.id === id);
}

function formatLabel(id: string): string {
  return id.replace(/_/g, "\n");
}

function computeEdgePath(from: Node, to: Node, allEdges: Edge[]) {
  const fx = from.x, fy = from.y, tx = to.x, ty = to.y;
  const dx = tx - fx, dy = ty - fy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist, ny = dy / dist;

  const hasReverse = allEdges.some((e) => e.from === to.id && e.to === from.id);

  if (hasReverse) {
    const perpX = -ny * 12;
    const perpY = nx * 12;
    const sx = fx + nx * R + perpX;
    const sy = fy + ny * R + perpY;
    const ex = tx - nx * (R + 6) + perpX;
    const ey = ty - ny * (R + 6) + perpY;
    return { sx, sy, ex, ey, curved: false };
  }

  const sx = fx + nx * R;
  const sy = fy + ny * R;
  const ex = tx - nx * (R + 6);
  const ey = ty - ny * (R + 6);
  return { sx, sy, ex, ey, curved: false };
}

export default function LeadStateDiagram() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const highlightedEdges = hovered
    ? EDGES.filter((e) => e.from === hovered || e.to === hovered)
    : [];

  const highlightedNodes = hovered
    ? [hovered, ...highlightedEdges.map((e) => (e.from === hovered ? e.to : e.from))]
    : [];

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform((t) => ({
      ...t,
      scale: Math.max(0.3, Math.min(3, t.scale * delta)),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest(".node-group")) return;
    setDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    setTransform((t) => ({
      ...t,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    const el = svgRef.current;
    if (el) el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      if (el) el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#0d1117",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700, letterSpacing: 1.5 }}>
          LEAD STATE MACHINE
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {PHASE_LABELS.map((p) => (
            <button
              key={p.label}
              onClick={() => setSelectedPhase(selectedPhase === p.label.toLowerCase() ? null : p.label.toLowerCase())}
              style={{
                background: selectedPhase === p.label.toLowerCase() ? p.color + "22" : "transparent",
                border: `1px solid ${selectedPhase === p.label.toLowerCase() ? p.color : "#2d3748"}`,
                color: p.color,
                fontSize: 9,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 4,
                cursor: "pointer",
                letterSpacing: 0.8,
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setSelectedPhase(selectedPhase === "reengagement" ? null : "reengagement")}
            style={{
              background: selectedPhase === "reengagement" ? "#ef444422" : "transparent",
              border: `1px solid ${selectedPhase === "reengagement" ? "#ef4444" : "#2d3748"}`,
              color: "#ef4444",
              fontSize: 9,
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: 4,
              cursor: "pointer",
              letterSpacing: 0.8,
              fontFamily: "inherit",
            }}
          >
            BE ONLY
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 20,
          zIndex: 10,
          display: "flex",
          gap: 6,
        }}
      >
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.2) }))}
          style={{
            background: "#1a2332",
            border: "1px solid #2d3748",
            color: "#94a3b8",
            width: 32,
            height: 32,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
          }}
        >
          +
        </button>
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.3, t.scale * 0.8) }))}
          style={{
            background: "#1a2332",
            border: "1px solid #2d3748",
            color: "#94a3b8",
            width: 32,
            height: 32,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
          }}
        >
          −
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          style={{
            background: "#1a2332",
            border: "1px solid #2d3748",
            color: "#94a3b8",
            height: 32,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 9,
            padding: "0 10px",
            fontWeight: 600,
            letterSpacing: 0.5,
            fontFamily: "inherit",
          }}
        >
          RESET
        </button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker id="arrow-default" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#334155" />
          </marker>
          <marker id="arrow-highlight" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#60a5fa" />
          </marker>
          <marker id="arrow-be" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#ef4444" />
          </marker>
          <marker id="arrow-be-highlight" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#f87171" />
          </marker>
          <marker id="arrow-out" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#34d399" />
          </marker>
          <marker id="arrow-in" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#fbbf24" />
          </marker>
          {Object.entries(PHASE_COLORS).map(([phase, c]) => (
            <filter key={phase} id={`glow-${phase}`}>
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor={c.glow} result="color" />
              <feComposite in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Phase backgrounds */}
          {PHASE_LABELS.map((p) => (
            <g key={p.label}>
              <text
                x={68}
                y={p.y + 35}
                fill={p.color}
                fontSize={9}
                fontWeight={700}
                fontFamily="'JetBrains Mono', monospace"
                letterSpacing={2}
                opacity={0.5}
              >
                {p.label}
              </text>
              <line
                x1={68}
                y1={p.y + 42}
                x2={170}
                y2={p.y + 42}
                stroke={p.color}
                strokeWidth={0.5}
                opacity={0.2}
              />
            </g>
          ))}

          {/* Edges */}
          {EDGES.map((edge, i) => {
            const fromNode = getNodeById(edge.from);
            const toNode = getNodeById(edge.to);
            if (!fromNode || !toNode) return null;

            const { sx, sy, ex, ey } = computeEdgePath(fromNode, toNode, EDGES);
            const isHighlighted = highlightedEdges.includes(edge);
            const isOutgoing = hovered && edge.from === hovered;
            const isIncoming = hovered && edge.to === hovered;
            const isBE = edge.beOnly;
            const dimmed = hovered && !isHighlighted;
            const phaseDimmed =
              selectedPhase &&
              !selectedPhase.startsWith(fromNode.phase) &&
              !selectedPhase.startsWith(toNode.phase);

            let markerEnd = "url(#arrow-default)";
            let strokeColor = "#253040";
            let strokeWidth = 1.2;
            let opacity = phaseDimmed ? 0.06 : dimmed ? 0.08 : 0.5;

            if (isBE) {
              strokeColor = "#ef4444";
              markerEnd = isHighlighted ? "url(#arrow-be-highlight)" : "url(#arrow-be)";
              opacity = phaseDimmed ? 0.06 : dimmed ? 0.15 : 0.6;
            }

            if (isHighlighted) {
              if (isOutgoing) {
                strokeColor = "#34d399";
                markerEnd = "url(#arrow-out)";
              } else if (isIncoming) {
                strokeColor = "#fbbf24";
                markerEnd = "url(#arrow-in)";
              }
              strokeWidth = 2;
              opacity = 1;
            }

            return (
              <line
                key={i}
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                opacity={opacity}
                markerEnd={markerEnd}
                strokeDasharray={isBE ? "6,4" : "none"}
                style={{ transition: "all 0.25s ease" }}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const phase = PHASE_COLORS[node.phase];
            const isHovered = hovered === node.id;
            const isConnected = highlightedNodes.includes(node.id);
            const dimmed = hovered && !isConnected;
            const phaseDimmed = selectedPhase && node.phase !== selectedPhase;
            const lines = formatLabel(node.id).split("\n");
            const fontSize = lines.some((l) => l.length > 8) ? 7.5 : 8.5;

            return (
              <g
                key={node.id}
                className="node-group"
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  cursor: "pointer",
                  transition: "opacity 0.25s ease",
                  opacity: phaseDimmed ? 0.1 : dimmed ? 0.15 : 1,
                }}
              >
                {/* Glow ring */}
                {isHovered && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={R + 8}
                    fill="none"
                    stroke={phase.border}
                    strokeWidth={1}
                    opacity={0.4}
                    style={{ filter: `url(#glow-${node.phase})` }}
                  />
                )}
                {/* Circle bg */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={R}
                  fill={isHovered ? phase.border + "18" : "#0f1620"}
                  stroke={isHovered ? phase.border : isConnected ? phase.border : "#1e293b"}
                  strokeWidth={isHovered ? 2.5 : isConnected ? 2 : 1.2}
                />
                {/* Label */}
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={node.x}
                    y={node.y + (li - (lines.length - 1) / 2) * 11}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isHovered ? "#f1f5f9" : isConnected ? phase.text : "#64748b"}
                    fontSize={fontSize}
                    fontWeight={isHovered ? 700 : 500}
                    fontFamily="'JetBrains Mono', monospace"
                    letterSpacing={0.3}
                  >
                    {line}
                  </text>
                ))}
                {/* BE badge */}
                {node.phase === "reengagement" && (
                  <g>
                    <rect
                      x={node.x + 18}
                      y={node.y - R - 6}
                      width={28}
                      height={14}
                      rx={3}
                      fill="#7f1d1d"
                      stroke="#ef4444"
                      strokeWidth={0.8}
                    />
                    <text
                      x={node.x + 32}
                      y={node.y - R + 1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fca5a5"
                      fontSize={7}
                      fontWeight={700}
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      BE
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 20,
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        {[
          { color: "#34d399", label: "Outgoing" },
          { color: "#fbbf24", label: "Incoming" },
          { color: "#ef4444", label: "BE Only", dashed: true },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={24} height={8}>
              <line
                x1={0}
                y1={4}
                x2={24}
                y2={4}
                stroke={item.color}
                strokeWidth={2}
                strokeDasharray={item.dashed ? "4,3" : "none"}
              />
            </svg>
            <span
              style={{
                color: "#64748b",
                fontSize: 9,
                fontWeight: 500,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 0.5,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
