import * as fs from "fs/promises";
import * as path from "path";

// In Phase 5 this will be 'import payload from "payload"'
// For Phase 0, we bypass the DB and read the hydrated file off disk.
export async function getPageData(slug: string) {
  try {
    const safeSlug = slug === "/" ? "index" : slug;
    const filePath = path.join(process.cwd(), `data/mock-api/${safeSlug}.json`);
    const fileContents = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContents);
  } catch (error) {
    return null;
  }
}
