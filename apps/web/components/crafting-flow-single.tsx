"use client";

import {
  Background,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Workflow } from "lucide-react";
import { useEffect, useMemo } from "react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import {
  FLOW_NODE_HEIGHT,
  FLOW_NODE_WIDTH,
  layoutFlow,
} from "@/lib/flow-layout";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getCraftingFlow } from "@/lib/recipe-utils";
import { getDisplayName } from "@/lib/utils";
import { ItemImage } from "./item-image";

interface ItemNodeData {
  internalname: string;
  quantity: number;
  [key: string]: unknown;
}

type ItemFlowNode = Node<ItemNodeData, "item">;

// Soft cap: very deep recipes can produce huge graphs that overwhelm the layout.
const MAX_NODES = 200;

function ItemNode({ data }: NodeProps<ItemFlowNode>) {
  const { recipes, itemsData } = useRecipeData();
  const { internalname, quantity } = data;
  const entry = recipes[internalname] ?? itemsData[internalname];
  const displayName = getDisplayName(entry, internalname, itemsData);
  const plainName = displayName.replace(/§./g, "");

  return (
    <div
      className="flex items-center gap-2.5 px-3 rounded-lg border border-border/60 bg-card shadow-sm"
      style={{ width: FLOW_NODE_WIDTH, height: FLOW_NODE_HEIGHT }}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <ItemImage
        entry={entry}
        internalname={internalname}
        alt={plainName}
        width={28}
        height={28}
        style={{ flexShrink: 0 }}
      />
      <div className="flex-1 min-w-0">
        <MinecraftColoredText
          text={displayName}
          className="text-xs font-medium text-foreground block truncate"
          title={plainName}
        />
        <span className="font-mono text-[11px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          {quantity.toLocaleString()}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  );
}

// Must be a stable reference (module scope) so react-flow doesn't re-render.
const nodeTypes = { item: ItemNode };

function CraftingFlowInner({
  selectedItem,
  multiplier,
}: {
  selectedItem: string;
  multiplier: number;
}) {
  const { recipes, itemsData } = useRecipeData();

  const {
    nodes: initialNodes,
    edges: initialEdges,
    truncated,
  } = useMemo(() => {
    const flow = getCraftingFlow(selectedItem, recipes, multiplier, itemsData);

    const cappedNodes =
      flow.nodes.length > MAX_NODES
        ? [...flow.nodes]
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, MAX_NODES)
        : flow.nodes;
    const keep = new Set(cappedNodes.map((n) => n.id));

    const rfNodes: Node[] = cappedNodes.map((n) => ({
      id: n.id,
      type: "item",
      position: { x: 0, y: 0 },
      data: { internalname: n.id, quantity: n.quantity },
    }));
    const rfEdges: Edge[] = flow.edges
      .filter((e) => keep.has(e.from) && keep.has(e.to))
      .map((e) => ({
        id: `${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        type: "smoothstep",
        label: e.quantity.toLocaleString(),
        markerEnd: { type: MarkerType.ArrowClosed },
      }));

    const laid = layoutFlow(rfNodes, rfEdges, "LR");
    return {
      nodes: laid.nodes,
      edges: laid.edges,
      truncated: flow.nodes.length > MAX_NODES,
    };
  }, [selectedItem, multiplier, recipes, itemsData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Re-seed when the computed graph changes (item / multiplier change).
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="h-[600px] w-full">
      {truncated && (
        <div className="px-3 py-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border-b border-amber-500/20">
          Large recipe — showing the {MAX_NODES} highest-quantity items. Use the
          Tree view to see everything.
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function CraftingFlowSingle({
  selectedItem,
  multiplier,
}: {
  selectedItem: string;
  multiplier: number;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40">
        <Workflow className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Crafting Flow</h3>
      </div>
      <div className="overflow-hidden rounded-b-xl">
        <ReactFlowProvider>
          <CraftingFlowInner
            selectedItem={selectedItem}
            multiplier={multiplier}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
