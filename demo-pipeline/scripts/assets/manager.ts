import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";

const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|webp|svg|pdf)(\?.*)?$/i;

function getFilenameFromUrl(assetUrl: string): string {
  const urlObj = new URL(assetUrl, "http://localhost");
  const baseName = path.basename(urlObj.pathname);
  if (!baseName) {
    const hash = crypto.createHash("md5").update(assetUrl).digest("hex").slice(0, 8);
    return `asset_${hash}.jpg`;
  }
  return baseName;
}

export async function downloadAssetsLocally(
  manifestsDir: string,
  publicAssetsDir: string,
  liveBaseUrl: string
) {
  await fs.mkdir(publicAssetsDir, { recursive: true });
  
  let files: string[] = [];
  try {
    files = await fs.readdir(manifestsDir);
  } catch (e) {
    console.warn(`Could not read manifests dir ${manifestsDir}`);
    return;
  }

  const jsonFiles = files.filter(f => f.endsWith(".json"));

  for (const file of jsonFiles) {
    const filePath = path.join(manifestsDir, file);
    const content = await fs.readFile(filePath, "utf-8");
    let json = JSON.parse(content);

    let updated = false;

    // Recursive function to walk JSON and find asset strings
    async function walkAndDownload(obj: any): Promise<void> {
      if (!obj || typeof obj !== "object") return;

      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          // Check if string is an asset URL
          if (IMAGE_EXT_REGEX.test(value) || value.includes('url(')) {
             // simplified handling for basic urls
             let fetchUrl = value;
             if (value.startsWith('/')) {
                fetchUrl = new URL(value, liveBaseUrl).href;
             }

             if (fetchUrl.startsWith('http') && IMAGE_EXT_REGEX.test(fetchUrl)) {
                try {
                  const filename = getFilenameFromUrl(fetchUrl);
                  const localPath = path.join(publicAssetsDir, filename);
                  
                  console.log(`Downloading asset: ${fetchUrl}`);
                  const res = await fetch(fetchUrl);
                  
                  if (res.ok) {
                    const buf = await res.arrayBuffer();
                    await fs.writeFile(localPath, Buffer.from(buf));
                    
                    // Rewrite JSON pointer
                    obj[key] = `/assets/${filename}`;
                    updated = true;
                  }
                } catch(e) {
                  console.error(`Failed to download ${fetchUrl}`);
                }
             }
          }
        } else if (typeof value === "object") {
          await walkAndDownload(value);
        }
      }
    }

    await walkAndDownload(json);

    if (updated) {
      console.log(`Rewriting manifest: ${file} with local asset paths...`);
      await fs.writeFile(filePath, JSON.stringify(json, null, 2));
    }
  }
}
