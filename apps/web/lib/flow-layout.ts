import dagre from "@dagrejs/dagre";
import { type Edge, type Node, Position } from "@xyflow/react";

export const FLOW_NODE_WIDTH = 230;
export const FLOW_NODE_HEIGHT = 64;

/**
 * Assign positions to react-flow nodes using a dagre layered layout.
 *
 * Pure (no DOM); returns new arrays without mutating the inputs. Default
 * direction is left-to-right ("LR") so the flow reads root -> base materials.
 */
export function layoutFlow(
  nodes: Node[],
  edges: Edge[],
  dir: "LR" | "TB" = "LR",
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: dir, nodesep: 40, ranksep: 90 });

  for (const node of nodes) {
    g.setNode(node.id, {
      width: FLOW_NODE_WIDTH,
      height: FLOW_NODE_HEIGHT,
    });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const isHorizontal = dir === "LR";
  const positioned: Node[] = nodes.map((node) => {
    const { x, y } = g.node(node.id);
    return {
      ...node,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      // dagre returns the node center; react-flow expects the top-left corner.
      position: { x: x - FLOW_NODE_WIDTH / 2, y: y - FLOW_NODE_HEIGHT / 2 },
    };
  });

  return { nodes: positioned, edges };
}
