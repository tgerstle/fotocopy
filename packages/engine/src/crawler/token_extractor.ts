export interface W3CToken {
  $value: string;
  $type: string;
}

export interface RawTokens {
  // Live W3C DTCG format from Crawler
  color?: Record<string, W3CToken>;
  fontFamily?: Record<string, W3CToken>;
  // Fallback / legacy Mock format
  colors?: Record<string, string>;
  geometry?: Record<string, string>;
  typography?: Record<string, string>;
}

export interface SemanticTokens {
  cssVariables: Record<string, string>;
}

function parseColorToRgbComponents(color: string): string {
  color = color.trim();

  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  }

  const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return `${rgbMatch[1]} ${rgbMatch[2]} ${rgbMatch[3]}`;
  }

  // Fallback for unparseable or named colors
  return color;
}

export function extractTokens(raw: RawTokens): SemanticTokens {
  const cssVariables: Record<string, string> = {};

  // Process live W3C DTCG colors
  if (raw.color) {
    for (const [key, tokenObj] of Object.entries(raw.color)) {
      cssVariables[`--${key}`] = parseColorToRgbComponents(tokenObj.$value);
    }
  }

  // Process colors
  if (raw.colors) {
    for (const [key, value] of Object.entries(raw.colors)) {
      cssVariables[`--${key}`] = parseColorToRgbComponents(value);
    }
  }

  // Process specific geometry properties like radius
  if (raw.geometry && raw.geometry.radius) {
    const pxMatch = raw.geometry.radius.match(/(\d+)px/);
    if (pxMatch) {
      const px = parseInt(pxMatch[1], 10);
      const rem = px / 16;
      cssVariables["--radius"] = `${rem}rem`;
    }
  }

  // Process typography / fonts if present from live data
  if (raw.fontFamily) {
    for (const [key, tokenObj] of Object.entries(raw.fontFamily)) {
      cssVariables[`--font-${key}`] = tokenObj.$value;
    }
  }

  return { cssVariables };
}

export function snapToTailwindGrid(pixelsText: string): string {
  const match = pixelsText.match(/([\d.]+)px/);
  if (!match) return pixelsText;

  const val = parseFloat(match[1]);
  const snapped = Math.round(val / 4) * 4;
  return `${snapped}px`;
}
