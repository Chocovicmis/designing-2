import React, { useCallback, useEffect, useMemo, useState } from "react";

type Align = "left" | "center" | "right";

type LayoutPlan = {
  align: Align;
  overlayColor?: string;
  overlayOpacity: number;
  textColor: string;
  shadow: string;
  accent: string;
};

const OPENAI_TEXT_MODEL = "gpt-4o-mini";
const OPENAI_IMAGE_MODEL = "gpt-image-1";
const LOCAL_STORAGE_KEY = "invite_card_api_key";
const DEFAULT_PROXY = "/api/openai-proxy?path=";

function loadSavedKey(): string {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY) ?? "";
  } catch (error) {
    console.warn("Unable to read saved API key", error);
    return "";
  }
}

function saveKey(value: string) {
  try {
    if (!value) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, value);
    }
  } catch (error) {
    console.warn("Unable to persist API key", error);
  }
}

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

function applyAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(15, 23, 42, ${alpha.toFixed(3)})`;
  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

function keywordPalette(prompt: string): string[] {
  const palettes: Record<string, string[]> = {
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

  const lower = prompt.toLowerCase();
  for (const [token, palette] of Object.entries(palettes)) {
    if (lower.includes(token)) {
      return palette;
    }
  }
  return ["#f8f5f0", "#d6c3a5", "#8b6f47"];
}

function buildImagePrompt(userPrompt: string, palette: string[]): string {
  const paletteHint = palette.map((color) => `hex ${color}`).join(", ");
  return `Create a refined 5x7 wedding invitation background with the following style cues: ${userPrompt}. Use the palette (${paletteHint}). Leave a soft, readable centre area with gentle lighting and avoid any text, typography, watermarks or signatures.`;
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

function analyzeLayout(text: string, prompt: string, palette: string[]): LayoutPlan {
  const align = pickAlignment(text, prompt);
  const toneWords = `${prompt} ${text}`.toLowerCase();
  const busy = /(ornate|detailed|pattern|floral|paisley|motif|illustrated|luxurious|vibrant)/.test(toneWords);
  const darkRequest = /(midnight|navy|noir|moody|night|galaxy)/.test(toneWords);

  const baseColor = palette[2] ?? "#0f172a";
  const overlayColor = busy || darkRequest ? baseColor : palette[1] ?? "#1f2937";
  const overlayOpacity = busy ? 0.42 : darkRequest ? 0.38 : 0.24;

  const paletteLum = palette.map(luminance);
  const averageLum = paletteLum.reduce((acc, value) => acc + value, 0) / paletteLum.length;
  const textColor = averageLum > 0.65 && !busy ? "#1f2937" : "#f8fafc";

  return {
    align,
    overlayColor,
    overlayOpacity,
    textColor,
    shadow: averageLum > 0.65 ? "0 14px 60px rgba(15, 23, 42, 0.25)" : "0 18px 80px rgba(15, 23, 42, 0.35)",
    accent: palette[1] ?? "#c08457",
  };
}

async function openaiPost<T>(
  path: string,
  payload: unknown,
  apiKey: string,
  proxyBase: string
): Promise<T> {
  const trimmedProxy = proxyBase.trim();
  if (!trimmedProxy && !apiKey) {
    throw new Error("Provide an OpenAI API key or a proxy endpoint.");
  }

  const url = trimmedProxy ? `${trimmedProxy}${path}` : `https://api.openai.com${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${message || response.statusText}`);
  }

  return (await response.json()) as T;
}

function sanitizeParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function emphasiseInline(text: string): (string | { strong: string })[] {
  if (!text.includes("**")) return [text];
  const parts: (string | { strong: string })[] = [];
  const tokens = text.split("**");
  tokens.forEach((token, index) => {
    if (index % 2 === 1) parts.push({ strong: token });
    else if (token) parts.push(token);
  });
  return parts.length ? parts : [text];
}

const DEFAULT_TEXT = `With the blessings of our families,\n\nKomal & Sanampreet\n\nrequest the honour of your presence as they celebrate their wedding ceremony.\n\n**Sunday, 2 November 2025**\n**7:00 PM onwards**\nThe Lalit Hotel, Ludhiana`;

export default function App(): JSX.Element {
  const [apiKey, setApiKey] = useState<string>("");
  const [proxyBase, setProxyBase] = useState<string>(DEFAULT_PROXY);
  const [wording, setWording] = useState<string>(DEFAULT_TEXT);
  const [stylePrompt, setStylePrompt] = useState<string>("Classic Punjabi elegance with gold script");
  const [designPrompt, setDesignPrompt] = useState<string>("Opulent botanical border, teal and gold accents, soft watercolor wash");
  const [autoLayout, setAutoLayout] = useState<boolean>(true);
  const [manualAlign, setManualAlign] = useState<Align>("center");
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [wordingStatus, setWordingStatus] = useState<string>("");
  const [backgroundStatus, setBackgroundStatus] = useState<string>("");
  const [isGeneratingText, setIsGeneratingText] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  // Load saved key once on mount
  useEffect(() => {
    const saved = loadSavedKey();
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    saveKey(apiKey.trim());
  }, [apiKey]);

  const palette = useMemo(() => keywordPalette(designPrompt), [designPrompt]);
  const layout = useMemo(() => analyzeLayout(wording, `${stylePrompt} ${designPrompt}`, palette), [wording, stylePrompt, designPrompt, palette]);
  const activeAlign = autoLayout ? layout.align : manualAlign;

  const fallbackBackground = useMemo(() => {
    const [soft, mid, deep] = palette;
    return `linear-gradient(135deg, ${soft} 0%, ${mid} 45%, ${deep} 100%)`;
  }, [palette]);

  const paragraphs = useMemo(() => sanitizeParagraphs(wording), [wording]);

  const requestText = useCallback(async () => {
    try {
      setIsGeneratingText(true);
      setWordingStatus("Generating invitation wording...");
      const payload = {
        model: OPENAI_TEXT_MODEL,
        input: [
          {
            role: "system",
            content:
              "You are an expert wedding invitation copywriter. Produce elegant, concise wording with double line breaks between sections. Use markdown bold for headline lines that must stand out.",
          },
          {
            role: "user",
            content: `Invitation details: ${wording}. Style request: ${stylePrompt}. Return only the invitation body.`,
          },
        ],
        temperature: 0.7,
      };

      type TextResponse = {
        output_text?: string;
        output?: { content: { text?: string }[] }[];
      };

      const data = await openaiPost<TextResponse>("/v1/responses", payload, apiKey.trim(), proxyBase);
      const output = data.output_text ?? data.output?.[0]?.content?.map((chunk) => chunk.text ?? "").join("") ?? "";
      const cleaned = output.replace(/\n{3,}/g, "\n\n").trim();
      if (cleaned) {
        setWording(cleaned);
        setWordingStatus("Wording ready ✓");
      } else {
        setWordingStatus("OpenAI returned an empty response.");
      }
    } catch (error) {
      console.error("Text generation failed", error);
      setWordingStatus(error instanceof Error ? error.message : "Unable to generate wording.");
    } finally {
      setIsGeneratingText(false);
      setTimeout(() => setWordingStatus(""), 6000);
    }
  }, [apiKey, proxyBase, stylePrompt, wording]);

  const requestBackground = useCallback(async () => {
    try {
      setIsGeneratingImage(true);
      setBackgroundStatus("Generating background artwork...");
      const payload = {
        model: OPENAI_IMAGE_MODEL,
        prompt: buildImagePrompt(designPrompt, palette),
        size: "1024x1024",
        response_format: "b64_json",
      } as const;

      type ImageResponse = { data?: { b64_json?: string }[] };

      const data = await openaiPost<ImageResponse>("/v1/images/generations", payload, apiKey.trim(), proxyBase);
      const base64 = data.data?.[0]?.b64_json;
      if (!base64) {
        throw new Error("OpenAI returned no image data.");
      }
      setBackgroundUrl(`data:image/png;base64,${base64}`);
      setBackgroundStatus("Background ready ✓");
    } catch (error) {
      console.error("Image generation failed", error);
      setBackgroundStatus(error instanceof Error ? error.message : "Unable to create artwork.");
    } finally {
      setIsGeneratingImage(false);
      setTimeout(() => setBackgroundStatus(""), 6000);
    }
  }, [apiKey, designPrompt, palette, proxyBase]);

  const handleManualAlignChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setManualAlign(event.target.value as Align);
  };

  const overlayStyle = layout.overlayColor
    ? {
        background: applyAlpha(layout.overlayColor, clamp01(layout.overlayOpacity)),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 lg:flex-row">
        <section className="w-full rounded-3xl bg-white p-6 shadow-xl lg:w-2/5">
          <h1 className="text-2xl font-semibold text-slate-800">AI Wedding Invitation Maker</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your invitation wording, describe the mood, and let the AI craft both the copy and background artwork. Run
            with <code>npm run preview:cdn</code> locally to use the built-in proxy server.
          </p>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">OpenAI API Key</label>
              <input
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <p className="text-xs text-slate-500">
                Leave blank when the preview proxy is launched with <code>OPENAI_API_KEY</code>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Proxy Base (optional)</label>
              <input
                value={proxyBase}
                onChange={(event) => setProxyBase(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <p className="text-xs text-slate-500">Default matches the zero-install preview helper.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Invitation Wording</label>
              <textarea
                value={wording}
                onChange={(event) => setWording(event.target.value)}
                rows={8}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm leading-5 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                onClick={requestText}
                disabled={isGeneratingText}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingText ? "Generating..." : "Rewrite with AI"}
              </button>
              {wordingStatus && <p className="text-xs text-slate-500">{wordingStatus}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Wording Style Prompt</label>
              <input
                value={stylePrompt}
                onChange={(event) => setStylePrompt(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Background Design Prompt</label>
              <textarea
                value={designPrompt}
                onChange={(event) => setDesignPrompt(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm leading-5 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                onClick={requestBackground}
                disabled={isGeneratingImage}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingImage ? "Generating..." : "Create AI Background"}
              </button>
              {backgroundStatus && <p className="text-xs text-slate-500">{backgroundStatus}</p>}
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Automatic layout</label>
                <input
                  type="checkbox"
                  checked={autoLayout}
                  onChange={(event) => setAutoLayout(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
              </div>
              <p className="text-xs text-slate-500">
                When enabled, the invitation automatically picks alignment and contrast that best suit your prompts.
              </p>
              {!autoLayout && (
                <select
                  value={manualAlign}
                  onChange={handleManualAlignChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="left">Left aligned</option>
                  <option value="center">Center aligned</option>
                  <option value="right">Right aligned</option>
                </select>
              )}
            </div>
          </div>
        </section>

        <section className="flex w-full flex-1 flex-col items-center gap-6">
          <div
            className="relative aspect-[5/7] w-full max-w-md overflow-hidden rounded-[36px]"
            style={{
              backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : fallbackBackground,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: layout.shadow,
            }}
          >
            <div className="absolute inset-0 bg-white/6" style={overlayStyle} />
            <div className="relative flex h-full flex-col justify-center px-10 py-12 text-balance" style={{ textAlign: activeAlign }}>
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="mb-6 text-lg leading-relaxed tracking-wide"
                  style={{
                    color: layout.textColor,
                  }}
                >
                  {emphasiseInline(paragraph).map((token, tokenIndex) =>
                    typeof token === "string" ? (
                      <span key={tokenIndex}>{token}</span>
                    ) : (
                      <strong key={tokenIndex} className="font-semibold" style={{ color: layout.accent }}>
                        {token.strong}
                      </strong>
                    )
                  )}
                </p>
              ))}
            </div>
          </div>
          <div className="text-center text-xs text-slate-500">
            Background palette adapts to your prompt. AI artwork requires a valid key or the preview proxy.
          </div>
        </section>
      </div>
    </div>
  );
}
