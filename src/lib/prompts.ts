import { Palette } from "./palette";

export function buildImagePrompt(userPrompt: string, palette: Palette): string {
  const paletteHint = palette.map((color) => `hex ${color}`).join(", ");
  return `Create a refined 5x7 wedding invitation background with the following style cues: ${userPrompt}. Use the palette (${paletteHint}). Leave a soft, readable centre area with gentle lighting and avoid any text, typography, watermarks or signatures.`;
}
