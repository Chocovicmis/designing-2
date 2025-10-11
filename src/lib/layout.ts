import { Palette } from "./palette";

export type Align = "left" | "center" | "right";

export type LayoutPlan = {
  align: Align;
  overlayColor?: string;
  overlayOpacity: number;
  textColor: string;
  shadow: string;
  accent: string;
};

const WHITE = "#f8fafc";
const SLATE = "#1f2937";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.replace(/[^0-9a-f]/gi, "");
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return [r, g, b];
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function pickAlignment(text: string, prompt: string): Align {
  const combined = `${prompt} ${text}`.toLowerCase();
  if (/right-aligned|align to the right|formal royal/.test(combined)) return "right";
  if (/left-aligned|modern|minimal|editorial|clean/.test(combined)) return "left";
  if (/center|centre|traditional|classic|ceremony/.test(combined)) return "center";

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const longLine = lines.some((line) => line.length > 64);
  return longLine ? "left" : "center";
}

export function analyzeLayout(text: string, prompt: string, palette: Palette): LayoutPlan {
  const align = pickAlignment(text, prompt);
  const toneWords = `${prompt} ${text}`.toLowerCase();
  const busy = /(ornate|detailed|pattern|floral|paisley|motif|illustrated|luxurious|vibrant)/.test(toneWords);
  const darkRequest = /(midnight|navy|noir|moody|night|galaxy)/.test(toneWords);

  const baseColor = palette[2] ?? "#0f172a";
  const overlayColor = busy || darkRequest ? baseColor : palette[1] ?? "#1f2937";
  const overlayOpacity = busy ? 0.42 : darkRequest ? 0.38 : 0.24;

  const paletteLum = palette.map(luminance);
  const averageLum = paletteLum.reduce((acc, value) => acc + value, 0) / paletteLum.length;
  const textColor = averageLum > 0.65 && !busy ? SLATE : WHITE;

  return {
    align,
    overlayColor,
    overlayOpacity,
    textColor,
    shadow: averageLum > 0.65 ? "0 14px 60px rgba(15, 23, 42, 0.25)" : "0 18px 80px rgba(15, 23, 42, 0.35)",
    accent: palette[1] ?? "#c08457",
  };
}

export function applyAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(15, 23, 42, ${clamp01(alpha).toFixed(3)})`;
  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha).toFixed(3)})`;
}
