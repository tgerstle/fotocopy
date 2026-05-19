import * as fs from "fs/promises";
import * as path from "path";

export interface CapturedNode {
  id: number;
  tag: string;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
    parentWidth?: number;
  };
  style?: {
    backgroundColor: string;
    marginTop: number;
    position?: string;
  };
  a11y: {
    role: string | null;
    alt: string | null;
    ariaLabel: string | null;
  };
}

export interface Chunk {
  id: number;
  nodes: CapturedNode[];
}

/**
 * Normalizes background color strings to standard formats for comparison.
 */
function normalizeColor(color: string): string {
  if (!color) return "";
  if (color === "rgba(0, 0, 0, 0)") return "transparent";
  return color.toLowerCase().trim();
}

/**
 * Checks if a node qualifies as a new chunk boundary.
 */
export function isSliceBoundary(
  node: CapturedNode,
  previousNode: CapturedNode | null,
): boolean {
  // 0. Ignore Sticky/Absolute Elements as Boundaries
  // We do not want floating widgets or sticky side-navs slicing standard flow
  if (node.style && ["sticky", "fixed", "absolute"].includes(node.style.position || "")) {
    return false;
  }

  // 1. Semantic Delimiters
  const tag = node.tag.toUpperCase();
  if (["SECTION", "ARTICLE", "HR"].includes(tag)) {
    return true;
  }

  // 2. Margin Gulfs (e.g. > 60px)
  if (node.style && node.style.marginTop >= 60) {
    return true;
  }

  // 3. Background Color Shift
  if (previousNode && node.style && previousNode.style) {
    const currentBg = normalizeColor(node.style.backgroundColor);
    const prevBg = normalizeColor(previousNode.style.backgroundColor);

    // If both have backgrounds and they differ
    if (
      currentBg &&
      prevBg &&
      currentBg !== prevBg &&
      currentBg !== "transparent" &&
      prevBg !== "transparent"
    ) {
      return true;
    }
  }

  // 4. Width Inheritance
  // If element is >= 95% of its immediate parent's width, it might be a block boundary.
  // We only count <div> or block-level tags if they have substantial width to prevent
  // inline tags matching.
  if (node.geometry.parentWidth && node.geometry.parentWidth > 0) {
    const ratio = node.geometry.width / node.geometry.parentWidth;
    if (ratio >= 0.95 && tag === "DIV") {
      // Must not be nested inside previous node if we are reading a sequentially nested dom
      // We can check if it starts below the previous chunks
      // This is a simplification: if it takes full width, it is a boundary.
      return true;
    }
  }

  return false;
}

/**
 * Slices a flat array of CapturedNodes into logical Chunks.
 */
export function sliceIntoChunks(nodes: CapturedNode[]): Chunk[] {
  if (nodes.length === 0) return [];

  const chunks: Chunk[] = [];
  let currentChunk: Chunk = { id: 1, nodes: [] };
  let activeBoundaryNode: CapturedNode | null = null;
  // Tracks the boundary's physical bounds, NOT the whole document wrapper's bounds.
  // We only track the geometric bottom of the MOST RECENT actual semantic boundary.
  let boundaryBottom = 0;
  let previousNode: CapturedNode | null = null;

  for (const node of nodes) {
    // Determine if this is a deeply nested element inside the active boundary
    const isInsideCurrentBoundary =
      activeBoundaryNode !== null &&
      node.geometry.y < boundaryBottom &&
      node.geometry.y + node.geometry.height <= boundaryBottom;

    let boundaryTriggered = false;

    const tag = node.tag.toUpperCase();
    const isStrongTag = ["SECTION", "ARTICLE"].includes(tag);
    const activeIsWeak = activeBoundaryNode
      ? !["SECTION", "ARTICLE"].includes(activeBoundaryNode.tag.toUpperCase())
      : true;

    // We can break if not trapped inside a boundary, or if we hit a strong semantic tag inside a generic weak wrapper (like a 1000px DIV)
    const canBreak = !isInsideCurrentBoundary || (isStrongTag && activeIsWeak);

    if (canBreak) {
      boundaryTriggered = isSliceBoundary(node, previousNode);
    }

    if (boundaryTriggered && currentChunk.nodes.length > 0) {
      chunks.push(currentChunk);
      currentChunk = { id: chunks.length + 1, nodes: [] };
      activeBoundaryNode = node;
      boundaryBottom = node.geometry.y + node.geometry.height;
    } else if (!activeBoundaryNode && isSliceBoundary(node, null)) {
      activeBoundaryNode = node;
      boundaryBottom = node.geometry.y + node.geometry.height;
    }

    currentChunk.nodes.push(node);
    previousNode = node;
  }

  if (currentChunk.nodes.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Allows CLI execution
if (require.main === module) {
  const inputFile = process.argv[2];
  const outDir =
    process.argv[3] ||
    path.resolve(__dirname, "../../output/sliced_chunks/default_route");

  if (!inputFile) {
    console.error(
      "Usage: ts-node chunk_slicer.ts <path_to_geometry.json> [outDir]",
    );
    process.exit(1);
  }

  (async () => {
    try {
      const data = await fs.readFile(inputFile, "utf8");
      const nodes: CapturedNode[] = JSON.parse(data);
      const chunks = sliceIntoChunks(nodes);

      await fs.mkdir(outDir, { recursive: true });
      for (let i = 0; i < chunks.length; i++) {
        const chunkName = `chunk_${String(i + 1).padStart(2, "0")}.json`;
        await fs.writeFile(
          path.join(outDir, chunkName),
          JSON.stringify(chunks[i], null, 2),
        );
      }
      console.log(
        `Sliced ${nodes.length} nodes into ${chunks.length} chunks at ${outDir}`,
      );
    } catch (err) {
      console.error(err);
    }
  })();
}
