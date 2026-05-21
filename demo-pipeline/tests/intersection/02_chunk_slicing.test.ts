import { describe, it, expect } from "vitest";
import {
  sliceIntoChunks,
  CapturedNode,
} from "../../scripts/intersection/chunk_slicer";

describe("Phase 2: Step 1 - Chunk Slicing", () => {
  it("Boxed Layout Pass: properly slices sequential sections inside a 1000px layout", () => {
    // Synthetic JSON representing a 1000px wrapper containing 3 vertical children
    // that inherit >95% of parent width.
    const nodes: CapturedNode[] = [
      {
        id: 1,
        tag: "DIV",
        geometry: { x: 0, y: 0, width: 1000, height: 1000, parentWidth: 1000 },
        style: { backgroundColor: "transparent", marginTop: 0 },
        a11y: { role: null, alt: null, ariaLabel: null },
      }, // Wrapper
      {
        id: 2,
        tag: "SECTION",
        geometry: { x: 0, y: 0, width: 1000, height: 300, parentWidth: 1000 },
        style: { backgroundColor: "transparent", marginTop: 0 },
        a11y: { role: null, alt: null, ariaLabel: null },
      }, // Start Chunk 1
      {
        id: 3,
        tag: "P",
        geometry: { x: 10, y: 10, width: 900, height: 50, parentWidth: 1000 },
        style: { backgroundColor: "transparent", marginTop: 0 },
        a11y: { role: null, alt: null, ariaLabel: null },
      }, // Nested in Chunk 1
      {
        id: 4,
        tag: "SECTION",
        geometry: { x: 0, y: 300, width: 1000, height: 400, parentWidth: 1000 },
        style: { backgroundColor: "transparent", marginTop: 0 },
        a11y: { role: null, alt: null, ariaLabel: null },
      }, // Start Chunk 2
      {
        id: 5,
        tag: "DIV", // Full parent width > 95%
        geometry: { x: 0, y: 700, width: 980, height: 300, parentWidth: 1000 },
        style: { backgroundColor: "transparent", marginTop: 0 },
        a11y: { role: null, alt: null, ariaLabel: null },
      }, // Start Chunk 3 based on 95% width inheritance!
    ];

    const chunks = sliceIntoChunks(nodes);

    // We should have exactly 4 chunks:
    // Chunk 0: Wrapper
    // Chunk 1: Section 1 + P
    // Chunk 2: Section 2
    // Chunk 3: Div (98% parent width)
    // Actually, Wrapper isn't a boundary, but Section is.
    // Let's trace execution:
    // Node 1 (DIV, width 1000, parent 1000 => Ratio 1.0 => Boundary!) -> Chunk 1
    // Node 2 (SECTION => Boundary) -> Chunk 2
    // Node 3 (P => Starts inside Chunk 2 because y=10 < maxBottom=300) -> Chunk 2
    // Node 4 (SECTION => Boundary, outside Chunk 2 because y=300 >= 300) -> Chunk 3
    // Node 5 (DIV, width 980, parent 1000 => Ratio 0.98. y=700 >= maxBottom 700 => Boundary!) -> Chunk 4
    expect(chunks.length).toBe(4);

    // Validate Chunk 2 has both the section and the nested P
    expect(chunks[1].nodes.length).toBe(2);
    expect(chunks[1].nodes[0].tag).toBe("SECTION");
    expect(chunks[1].nodes[1].tag).toBe("P");
  });

  it("Color Shift Pass: slices when background color significantly differs", () => {
    // Synthetic JSON of 4 divs where the third div changes background color to #000000
    const nodes: CapturedNode[] = [
      {
        id: 1,
        tag: "DIV",
        geometry: { x: 0, y: 0, width: 500, height: 100, parentWidth: 1000 },
        style: { backgroundColor: "rgb(255, 255, 255)", marginTop: 0 }, // White
        a11y: { role: null, alt: null, ariaLabel: null },
      },
      {
        id: 2,
        tag: "DIV",
        geometry: { x: 0, y: 100, width: 500, height: 100, parentWidth: 1000 },
        style: { backgroundColor: "rgb(255, 255, 255)", marginTop: 0 }, // White -> No Shift
        a11y: { role: null, alt: null, ariaLabel: null },
      },
      {
        id: 3,
        tag: "DIV",
        geometry: { x: 0, y: 200, width: 500, height: 100, parentWidth: 1000 },
        style: { backgroundColor: "rgb(0, 0, 0)", marginTop: 0 }, // Black -> Shift! Boundary!
        a11y: { role: null, alt: null, ariaLabel: null },
      },
      {
        id: 4,
        tag: "DIV",
        geometry: { x: 0, y: 300, width: 500, height: 100, parentWidth: 1000 },
        style: { backgroundColor: "rgb(0, 0, 0)", marginTop: 0 }, // Black -> No Shift
        a11y: { role: null, alt: null, ariaLabel: null },
      },
    ];

    const chunks = sliceIntoChunks(nodes);

    // Chunk 1: Nodes 1, 2
    // Chunk 2: Nodes 3, 4
    expect(chunks.length).toBe(2);
    expect(chunks[0].nodes[0].id).toBe(1);
    expect(chunks[0].nodes[1].id).toBe(2);
    expect(chunks[1].nodes[0].id).toBe(3);
    expect(chunks[1].nodes[1].id).toBe(4);
  });

  it("Sticky/Absolute Bypass: does not falsely trigger boundaries for floating elements", () => {
    const nodes: CapturedNode[] = [
      {
        id: 1,
        tag: "DIV",
        geometry: { x: 0, y: 0, width: 1000, height: 500, parentWidth: 1000 },
        style: {
          backgroundColor: "rgb(255, 255, 255)",
          marginTop: 0,
          position: "static",
        },
        a11y: { role: null, alt: null, ariaLabel: null },
      }, // Standard static wrapper -> Chunk 1
      {
        id: 2,
        tag: "DIV",
        geometry: { x: 900, y: 50, width: 100, height: 500, parentWidth: 1000 },
        style: {
          backgroundColor: "rgb(0, 0, 0)",
          marginTop: 0,
          position: "sticky",
        },
        a11y: { role: null, alt: null, ariaLabel: null },
      }, // Sticky side nav -> Color shift AND margin bleed! But position is sticky. Should stay Chunk 1!
      {
        id: 3,
        tag: "DIV",
        geometry: { x: 0, y: 500, width: 1000, height: 500, parentWidth: 1000 },
        style: {
          backgroundColor: "rgb(0, 0, 0)",
          marginTop: 0,
          position: "static",
        },
        a11y: { role: null, alt: null, ariaLabel: null },
      }, // Start Chunk 2 (valid color shift and static geometry)
    ];

    const chunks = sliceIntoChunks(nodes);

    expect(chunks.length).toBe(2);
    expect(chunks[0].nodes.length).toBe(2);
    expect(chunks[0].nodes[0].id).toBe(1);
    expect(chunks[0].nodes[1].id).toBe(2); // Sticky element joined the preceding chunk successfully
    expect(chunks[1].nodes[0].id).toBe(3); // Standard section created boundaries properly
  });
});
