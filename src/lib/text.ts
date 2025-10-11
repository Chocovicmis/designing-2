export function sanitizeParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export type EmphasisedToken = string | { strong: string };

export function emphasiseInline(text: string): EmphasisedToken[] {
  if (!text.includes("**")) return [text];
  const parts: EmphasisedToken[] = [];
  const tokens = text.split("**");
  tokens.forEach((token, index) => {
    if (index % 2 === 1) parts.push({ strong: token });
    else if (token) parts.push(token);
  });
  return parts.length ? parts : [text];
}
