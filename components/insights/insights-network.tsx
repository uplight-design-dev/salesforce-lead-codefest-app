"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type {
  InsightCard,
  InsightEdge,
  InsightNode,
  InsightsGraph,
} from "@/lib/data/insights-graph";

type SpherePoint = {
  id: string;
  theta: number; // longitude
  phi: number; // latitude-ish
  radius: number;
};

type ProjectedNode = InsightNode & {
  x: number;
  y: number;
  z: number;
  depth: number;
};

type InsightsNetworkProps = {
  graph: InsightsGraph;
};

const KIND_COLOR: Record<InsightNode["kind"], string> = {
  account: "#0047FF",
  contact: "#00E297",
  campaign: "#000F9F",
};

const KIND_COLOR_LIGHT: Record<InsightNode["kind"], string> = {
  account: "#6B93FF",
  contact: "#7FF0C4",
  campaign: "#4A5ADF",
};

const KIND_COLOR_DARK: Record<InsightNode["kind"], string> = {
  account: "#0028A8",
  contact: "#00A86E",
  campaign: "#00085C",
};

function hashUnit(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

/**
 * Spread nodes across a sphere: accounts on outer belt, contacts nearby,
 * campaigns slightly inward so shared campaigns sit toward the core.
 */
function assignSpherePoints(
  nodes: InsightNode[],
  edges: InsightEdge[]
): SpherePoint[] {
  const accounts = nodes.filter((node) => node.kind === "account");
  const contacts = nodes.filter((node) => node.kind === "contact");
  const campaigns = nodes.filter((node) => node.kind === "campaign");
  const points = new Map<string, SpherePoint>();

  const golden = Math.PI * (3 - Math.sqrt(5));

  accounts.forEach((account, index) => {
    const t = (index + 0.5) / Math.max(accounts.length, 1);
    const phi = Math.acos(1 - 2 * t);
    const theta = golden * index;
    points.set(account.id, {
      id: account.id,
      theta,
      phi,
      radius: 1,
    });
  });

  // Fan contacts around their account so labels/nodes don't stack.
  const contactsByAccount = new Map<string, InsightNode[]>();
  for (const contact of contacts) {
    const accountEdge = edges.find(
      (edge) => edge.source === contact.id && edge.kind === "works_at"
    );
    const accountId = accountEdge?.target ?? "_orphan";
    const list = contactsByAccount.get(accountId) ?? [];
    list.push(contact);
    contactsByAccount.set(accountId, list);
  }

  for (const [accountId, accountContacts] of contactsByAccount) {
    const accountPoint =
      accountId === "_orphan" ? undefined : points.get(accountId);

    accountContacts.forEach((contact, index) => {
      const jitter = hashUnit(contact.id);
      const fan =
        accountContacts.length === 1
          ? 0
          : (index / (accountContacts.length - 1) - 0.5) * 1.15;

      if (accountPoint) {
        points.set(contact.id, {
          id: contact.id,
          theta: accountPoint.theta + fan + (jitter - 0.5) * 0.2,
          phi: accountPoint.phi + (hashUnit(contact.id + "φ") - 0.5) * 0.7,
          radius: 0.72 + jitter * 0.18,
        });
      } else {
        points.set(contact.id, {
          id: contact.id,
          theta: jitter * Math.PI * 2,
          phi: 0.4 + hashUnit(contact.id + "p") * 2.2,
          radius: 0.82,
        });
      }
    });
  }

  campaigns.forEach((campaign, index) => {
    const related = edges
      .filter((edge) => edge.target === campaign.id && edge.kind === "engaged")
      .map((edge) => points.get(edge.source))
      .filter(Boolean) as SpherePoint[];

    if (related.length > 0) {
      const theta =
        related.reduce((sum, point) => sum + point.theta, 0) / related.length;
      const phi =
        related.reduce((sum, point) => sum + point.phi, 0) / related.length;
      points.set(campaign.id, {
        id: campaign.id,
        theta: theta + (hashUnit(campaign.id) - 0.5) * 0.55,
        phi: phi + (hashUnit(campaign.id + "c") - 0.5) * 0.45,
        radius: 0.42 + (index % 4) * 0.08,
      });
      return;
    }

    const t = (index + 0.5) / Math.max(campaigns.length, 1);
    points.set(campaign.id, {
      id: campaign.id,
      theta: golden * (index + 11),
      phi: Math.acos(1 - 2 * t),
      radius: 0.48,
    });
  });

  return nodes
    .map((node) => points.get(node.id))
    .filter(Boolean) as SpherePoint[];
}

function projectNodes(
  nodes: InsightNode[],
  spherePoints: SpherePoint[],
  width: number,
  height: number,
  yaw: number,
  pitch: number,
  zoom: number
): ProjectedNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(width, height) * 0.42 * zoom;
  const pointMap = new Map(spherePoints.map((point) => [point.id, point]));

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  return nodes
    .map((node) => {
      const point = pointMap.get(node.id);
      if (!point) return null;

      // Spherical → Cartesian
      let x = point.radius * Math.sin(point.phi) * Math.cos(point.theta);
      let y = point.radius * Math.cos(point.phi);
      let z = point.radius * Math.sin(point.phi) * Math.sin(point.theta);

      // Rotate yaw (around Y), then pitch (around X)
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y2 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;

      // Perspective
      const perspective = 2.6 / (2.6 + z2);
      const screenX = cx + x1 * scale * perspective;
      const screenY = cy + y2 * scale * perspective;

      return {
        ...node,
        x: screenX,
        y: screenY,
        z: z2,
        depth: perspective,
      };
    })
    .filter(Boolean) as ProjectedNode[];
}

export function InsightsNetwork({ graph }: InsightsNetworkProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [yaw, setYaw] = useState(0.35);
  const [pitch] = useState(0.28);
  const [zoom, setZoom] = useState(1);
  const [rotating, setRotating] = useState(true);
  const [size, setSize] = useState({ width: 980, height: 680 });
  const dragRef = useRef<{ x: number; yaw: number } | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const rotatingRef = useRef(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  hoveredRef.current = hoveredId;
  selectedRef.current = selectedId;
  rotatingRef.current = rotating;

  const spherePoints = useMemo(
    () => assignSpherePoints(graph.nodes, graph.edges),
    [graph.edges, graph.nodes]
  );

  useEffect(() => {
    const onResize = () => {
      const width = Math.min(1200, Math.max(720, window.innerWidth - 340));
      setSize({
        width,
        height: Math.max(600, Math.min(760, width * 0.68)),
      });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    let accum = 0;

    const tick = (now: number) => {
      const delta = now - previous;
      previous = now;
      if (
        rotatingRef.current &&
        !hoveredRef.current &&
        !selectedRef.current &&
        !dragRef.current
      ) {
        // Batch yaw updates ~30fps so SVG re-renders stay light.
        accum += delta;
        if (accum >= 33) {
          setYaw((value) => value + accum * 0.00012);
          accum = 0;
        }
      } else {
        accum = 0;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((value) => {
        const next = value + (event.deltaY > 0 ? -0.08 : 0.08);
        return Math.min(2.2, Math.max(0.7, next));
      });
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const projected = useMemo(
    () =>
      projectNodes(
        graph.nodes,
        spherePoints,
        size.width,
        size.height,
        yaw,
        pitch,
        zoom
      ),
    [graph.nodes, pitch, size.height, size.width, spherePoints, yaw, zoom]
  );

  const positionMap = useMemo(() => {
    const map = new Map<string, ProjectedNode>();
    for (const node of projected) map.set(node.id, node);
    return map;
  }, [projected]);

  const focusId = hoveredId ?? selectedId;

  const connectedIds = useMemo(() => {
    if (!focusId) return new Set<string>();
    const ids = new Set<string>([focusId]);
    for (const edge of graph.edges) {
      if (edge.source === focusId || edge.target === focusId) {
        ids.add(edge.source);
        ids.add(edge.target);
      }
    }
    return ids;
  }, [focusId, graph.edges]);

  const selectedNode = selectedId ? positionMap.get(selectedId) : null;
  const hoveredNode = hoveredId ? positionMap.get(hoveredId) : null;

  const relatedInsights = useMemo(() => {
    if (!selectedId) return graph.insights;
    return graph.insights.filter(
      (insight) =>
        insight.relatedNodeIds.includes(selectedId) ||
        insight.relatedNodeIds.some((id) => connectedIds.has(id))
    );
  }, [connectedIds, graph.insights, selectedId]);

  const sortedNodes = useMemo(
    () => [...projected].sort((a, b) => a.z - b.z),
    [projected]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="relative overflow-hidden border-white/10 bg-uplight-black p-0 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,71,255,0.22),transparent_52%),radial-gradient(circle_at_72%_72%,rgba(0,226,151,0.12),transparent_42%)]" />

        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">Engagement Network</p>
            <p className="mt-1 text-sm text-white/55">
              Globe view — hover a node for details and connections. Scroll or
              use controls to zoom.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2 text-xs">
              <LegendDot color={KIND_COLOR.account} label="Account" dark />
              <LegendDot color={KIND_COLOR.contact} label="Contact" dark />
              <LegendDot color={KIND_COLOR.campaign} label="Campaign" dark />
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 p-1">
              <ControlButton
                label="Zoom out"
                dark
                onClick={() => setZoom((value) => Math.max(0.7, value - 0.15))}
              >
                <Minus className="h-4 w-4" />
              </ControlButton>
              <span className="min-w-12 text-center text-xs tabular-nums text-white/55">
                {Math.round(zoom * 100)}%
              </span>
              <ControlButton
                label="Zoom in"
                dark
                onClick={() => setZoom((value) => Math.min(2.2, value + 0.15))}
              >
                <Plus className="h-4 w-4" />
              </ControlButton>
              <ControlButton
                label={rotating ? "Pause rotation" : "Play rotation"}
                dark
                onClick={() => setRotating((value) => !value)}
              >
                {rotating ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </ControlButton>
              <ControlButton
                label="Reset view"
                dark
                onClick={() => {
                  setYaw(0.35);
                  setZoom(1);
                  setSelectedId(null);
                  setHoveredId(null);
                  setRotating(true);
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </ControlButton>
            </div>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="relative cursor-grab overflow-hidden active:cursor-grabbing"
          onPointerDown={(event) => {
            dragRef.current = { x: event.clientX, yaw };
            (event.currentTarget as HTMLDivElement).setPointerCapture(
              event.pointerId
            );
          }}
          onPointerMove={(event) => {
            if (!dragRef.current) return;
            const delta = event.clientX - dragRef.current.x;
            setYaw(dragRef.current.yaw + delta * 0.005);
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        >
          {/* Soft globe horizon */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-uplight-blue/25"
            style={{
              width: Math.min(size.width, size.height) * 0.72 * zoom,
              height: Math.min(size.width, size.height) * 0.72 * zoom,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(0,71,255,0.16) 0%, rgba(0,0,0,0) 70%)",
            }}
          />

          <svg
            viewBox={`0 0 ${size.width} ${size.height}`}
            width="100%"
            height={size.height}
            className="relative block min-w-[720px]"
            role="img"
            aria-label="Rotating engagement network globe"
          >
            <defs>
              <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {(
                Object.keys(KIND_COLOR) as Array<InsightNode["kind"]>
              ).map((kind) => (
                <radialGradient
                  key={kind}
                  id={`orb-grad-${kind}`}
                  cx="32%"
                  cy="28%"
                  r="72%"
                  fx="28%"
                  fy="24%"
                >
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop
                    offset="18%"
                    stopColor={KIND_COLOR_LIGHT[kind]}
                    stopOpacity="1"
                  />
                  <stop
                    offset="55%"
                    stopColor={KIND_COLOR[kind]}
                    stopOpacity="1"
                  />
                  <stop
                    offset="100%"
                    stopColor={KIND_COLOR_DARK[kind]}
                    stopOpacity="1"
                  />
                </radialGradient>
              ))}
            </defs>

            {graph.edges.map((edge) => {
              const source = positionMap.get(edge.source);
              const target = positionMap.get(edge.target);
              if (!source || !target) return null;

              const isFocused =
                Boolean(focusId) &&
                (edge.source === focusId || edge.target === focusId);
              // Always draw faint web; brighten the active node's links.
              if (focusId && !isFocused) return null;

              const isEngaged = edge.kind === "engaged";
              const idle = !focusId;
              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isEngaged ? "#4D7CFF" : "#94a3b8"}
                  strokeWidth={idle ? (isEngaged ? 1.2 : 0.9) : isEngaged ? 2.4 : 1.6}
                  strokeOpacity={idle ? (isEngaged ? 0.22 : 0.14) : 0.7}
                  strokeLinecap="round"
                />
              );
            })}

            {sortedNodes.map((node) => {
              const inFocusRing = !focusId || connectedIds.has(node.id);
              const isSelected = selectedId === node.id;
              const isHovered = hoveredId === node.id;
              const isPrimary = isHovered || isSelected;
              const color = KIND_COLOR[node.kind];
              const baseRadius = Math.max(9, node.weight * 0.92 * node.depth);
              const radius = isPrimary ? baseRadius * 1.28 : baseRadius;
              // Keep the globe quiet at rest — only label the active node.
              // Connected peers get short labels only while something is focused.
              const showPeerLabel =
                Boolean(focusId) &&
                connectedIds.has(node.id) &&
                !isPrimary &&
                node.depth > 0.78;
              const highlightR = Math.max(2.2, radius * 0.28);
              const rimR = radius * 0.92;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  opacity={
                    inFocusRing
                      ? isPrimary
                        ? 1
                        : Math.max(0.5, node.depth)
                      : 0.18
                  }
                  onMouseEnter={() => {
                    setHoveredId(node.id);
                  }}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() =>
                    setSelectedId((current) =>
                      current === node.id ? null : node.id
                    )
                  }
                >
                  {/* Invisible hit target so dense clusters are easier to grab */}
                  <circle r={Math.max(18, radius + 10)} fill="transparent" />

                  {/* Grounded soft shadow for depth */}
                  <ellipse
                    cx={radius * 0.12}
                    cy={radius * 0.72}
                    rx={radius * 0.78}
                    ry={radius * 0.28}
                    fill="#000"
                    opacity={0.35 * Math.max(0.4, node.depth)}
                  />

                  {(node.highIntent || isPrimary) && (
                    <circle
                      r={radius + 10}
                      fill="none"
                      stroke={node.highIntent ? "#00E297" : color}
                      strokeOpacity={isPrimary ? 0.75 : 0.45}
                      strokeWidth={isPrimary ? 2.5 : 2}
                      {...(isPrimary ? { filter: "url(#node-glow)" } : {})}
                    />
                  )}

                  {/* Sphere body — radial fill gives the 3D look without expensive filters */}
                  <circle
                    r={radius}
                    fill={`url(#orb-grad-${node.kind})`}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={isPrimary ? 2 : 1}
                  />

                  {/* Inner rim / volume */}
                  <circle
                    r={rimR}
                    fill="none"
                    stroke="rgba(0,0,0,0.25)"
                    strokeWidth={1}
                    opacity={0.55}
                  />

                  {/* Specular highlight */}
                  <ellipse
                    cx={-radius * 0.32}
                    cy={-radius * 0.36}
                    rx={highlightR}
                    ry={highlightR * 0.72}
                    fill="#fff"
                    opacity={0.55 + node.depth * 0.2}
                  />
                  <circle
                    cx={-radius * 0.18}
                    cy={-radius * 0.22}
                    r={highlightR * 0.35}
                    fill="#fff"
                    opacity={0.85}
                  />

                  {showPeerLabel && (
                    <text
                      y={radius + 18}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize={11}
                      fontWeight={600}
                      opacity={0.75}
                    >
                      {truncate(node.label, 16)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {hoveredNode && (
            <NodeTooltip
              node={hoveredNode}
              canvasWidth={size.width}
              canvasHeight={size.height}
            />
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <p className="text-sm font-semibold">Network pulse</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Accounts" value={graph.stats.accounts} />
            <Stat label="Contacts" value={graph.stats.contacts} />
            <Stat label="Campaigns" value={graph.stats.campaigns} />
            <Stat label="Connections" value={graph.stats.connections} />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold">
              {selectedNode ? selectedNode.label : "Select a node"}
            </p>
            {selectedId && (
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted transition hover:bg-surface hover:text-uplight-black"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
          {selectedNode ? (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-surface text-uplight-black capitalize">
                  {selectedNode.kind}
                </Badge>
                {selectedNode.highIntent && (
                  <Badge className="bg-uplight-green/20 text-emerald-800">
                    High Intent
                  </Badge>
                )}
                {selectedNode.mql && (
                  <Badge className="bg-emerald-50 text-emerald-700">MQL</Badge>
                )}
              </div>
              {selectedNode.sublabel && (
                <p className="text-sm text-muted">{selectedNode.sublabel}</p>
              )}
              {typeof selectedNode.score === "number" && (
                <p className="text-sm">
                  Score{" "}
                  <span className="font-semibold tabular-nums">
                    {selectedNode.score}
                  </span>
                </p>
              )}
              {selectedNode.leadId && (
                <Link
                  href={`/leads/${selectedNode.leadId}`}
                  className="inline-flex text-sm font-medium text-uplight-blue hover:underline"
                >
                  Open lead detail →
                </Link>
              )}
              <p className="text-xs text-muted">
                {Math.max(connectedIds.size - 1, 0)} connected node
                {connectedIds.size - 1 === 1 ? "" : "s"} highlighted.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              The globe rotates slowly. Drag to spin, scroll to zoom. Hover any
              node for a readable card and its connection lines.
            </p>
          )}
        </Card>

        <Card className="max-h-[28rem] overflow-auto">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              {selectedId ? "Related insights" : "All insights"}
            </p>
            {selectedId && (
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-xs font-medium text-uplight-blue hover:underline"
              >
                Show all
              </button>
            )}
          </div>
          <ul className="space-y-4">
            {relatedInsights.map((insight) => (
              <InsightListItem
                key={insight.id}
                insight={insight}
                active={insight.relatedNodeIds.includes(selectedId ?? "")}
                onFocus={() => {
                  const focus = insight.relatedNodeIds[0];
                  if (!focus) return;
                  // Toggle off if this insight already owns the selection.
                  setSelectedId((current) =>
                    current && insight.relatedNodeIds.includes(current)
                      ? null
                      : focus
                  );
                }}
              />
            ))}
            {relatedInsights.length === 0 && (
              <li className="text-sm text-muted">
                No insights mapped to this selection yet.{" "}
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="font-medium text-uplight-blue hover:underline"
                >
                  Clear selection
                </button>
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function NodeTooltip({
  node,
  canvasWidth,
  canvasHeight,
}: {
  node: ProjectedNode;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const color = KIND_COLOR[node.kind];
  // Position in % of the SVG viewBox so it tracks with responsive width.
  const leftPct = (node.x / canvasWidth) * 100;
  const topPct = (node.y / canvasHeight) * 100;
  const flipRight = leftPct > 62;
  const flipUp = topPct > 70;

  return (
    <div
      className="pointer-events-none absolute z-20 w-56 -translate-x-1/2 rounded-xl border border-border bg-white/95 p-3 shadow-lg backdrop-blur-sm transition-opacity"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: `translate(${flipRight ? "-108%" : "12%"}, ${
          flipUp ? "calc(-100% - 12px)" : "16px"
        })`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {node.kind}
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-uplight-black">
            {node.label}
          </p>
          {node.sublabel && (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {node.sublabel}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {typeof node.score === "number" && (
              <span className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-uplight-black">
                Score {node.score}
              </span>
            )}
            {node.highIntent && (
              <span className="rounded-md bg-uplight-green/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800">
                High intent
              </span>
            )}
            {node.mql && (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                MQL
              </span>
            )}
            {node.campaignType && (
              <span className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium text-uplight-black">
                {node.campaignType}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightListItem({
  insight,
  onFocus,
  active = false,
}: {
  insight: InsightCard;
  onFocus: () => void;
  active?: boolean;
}) {
  return (
    <li className="border-b border-border pb-4 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={onFocus}
        className={`w-full rounded-xl p-2 text-left transition ${
          active ? "bg-surface ring-1 ring-border" : "hover:bg-surface/70"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-snug">{insight.title}</p>
          <span className="shrink-0 text-xs text-muted">{insight.time}</span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {insight.summary}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {insight.tags.map((tag) => (
            <Badge
              key={tag}
              className="border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-uplight-black"
            >
              {tag}
            </Badge>
          ))}
        </div>
        {active && (
          <p className="mt-2 text-xs font-medium text-uplight-blue">
            Click again to clear selection
          </p>
        )}
      </button>
    </li>
  );
}

function LegendDot({
  color,
  label,
  dark = false,
}: {
  color: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <span
      className={
        dark
          ? "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/80"
          : "inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1"
      }
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface/70 px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
  dark = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={
        dark
          ? "rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
          : "rounded-lg p-2 text-muted transition hover:bg-surface hover:text-uplight-black"
      }
    >
      {children}
    </button>
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
