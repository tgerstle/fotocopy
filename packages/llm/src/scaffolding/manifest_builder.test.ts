import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildShadcnManifest } from "./manifest_builder";
import * as fs from "fs/promises";

vi.mock("fs/promises");

describe("Manifest Builder", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns empty string if directory does not exist", async () => {
    vi.mocked(fs.readdir).mockRejectedValue({ code: "ENOENT" });
    const result = await buildShadcnManifest("/fake/path");
    expect(result).toBe("");
  });

  it("builds a manifest correctly from mock files", async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      "button.tsx" as any,
      "card.tsx" as any,
    ]);

    const mockButtonContent = `
            export const Button = () => {};
            export const buttonVariants = {};
        `;
    const mockCardContent = `
            export function Card() {}
            export function CardHeader() {}
        `;

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (filePath.toString().includes("button.tsx")) return mockButtonContent;
      if (filePath.toString().includes("card.tsx")) return mockCardContent;
      return "";
    });

    const result = await buildShadcnManifest("/fake/path");

    expect(result).toContain("# Available UI Menu");
    expect(result).toContain(
      '- import { Button, buttonVariants } from "@/components/ui/button";',
    );
    expect(result).toContain(
      '- import { Card, CardHeader } from "@/components/ui/card";',
    );
  });
});
