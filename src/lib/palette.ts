export type Palette = [string, string, string];

const PRESET_PALETTES: Record<string, Palette> = {
  gold: ["#f5e6b3", "#d4af37", "#8c6a03"],
  blush: ["#fdecef", "#f4c6d7", "#b15a72"],
  emerald: ["#e6f5ed", "#38a169", "#064e3b"],
  teal: ["#e0f2f1", "#2c7a7b", "#134e4a"],
  lavender: ["#f5f3ff", "#c4b5fd", "#6b21a8"],
  navy: ["#e2e8f0", "#1e3a8a", "#0b1f52"],
  coral: ["#fff1eb", "#fb7185", "#9f1239"],
  rustic: ["#f7f2eb", "#d97706", "#4b3419"],
  minimalist: ["#f9fafb", "#e2e8f0", "#94a3b8"],
  classic: ["#fff7ed", "#fbbf24", "#7c2d12"],
};

const DEFAULT_PALETTE: Palette = ["#f8f5f0", "#d6c3a5", "#8b6f47"];

export function keywordPalette(prompt: string): Palette {
  const lower = prompt.toLowerCase();
  for (const [token, palette] of Object.entries(PRESET_PALETTES)) {
    if (lower.includes(token)) {
      return palette;
    }
  }
  return DEFAULT_PALETTE;
}
