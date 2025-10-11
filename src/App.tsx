import { useCallback, useEffect, useMemo, useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { InvitationPreview } from "./components/InvitationPreview";
import { Align, analyzeLayout } from "./lib/layout";
import { buildImagePrompt } from "./lib/prompts";
import { openaiPost } from "./lib/openai";
import { keywordPalette } from "./lib/palette";
import { useLocalStorage } from "./hooks/useLocalStorage";

const OPENAI_TEXT_MODEL = "gpt-4o-mini";
const OPENAI_IMAGE_MODEL = "gpt-image-1";
const DEFAULT_PROXY = "/api/openai-proxy?path=";
const LOCAL_STORAGE_KEY = "invite_card_api_key";

const DEFAULT_TEXT = `With the blessings of our families,\n\nKomal & Sanampreet\n\nrequest the honour of your presence as they celebrate their wedding ceremony.\n\n**Sunday, 2 November 2025**\n**7:00 PM onwards**\nThe Lalit Hotel, Ludhiana`;

export default function App(): JSX.Element {
  const [apiKey, setApiKey] = useLocalStorage(LOCAL_STORAGE_KEY, "");
  const [proxyBase, setProxyBase] = useState<string>(DEFAULT_PROXY);
  const [wording, setWording] = useState<string>(DEFAULT_TEXT);
  const [stylePrompt, setStylePrompt] = useState<string>("Classic Punjabi elegance with gold script");
  const [designPrompt, setDesignPrompt] = useState<string>(
    "Opulent botanical border, teal and gold accents, soft watercolor wash"
  );
  const [autoLayout, setAutoLayout] = useState<boolean>(true);
  const [manualAlign, setManualAlign] = useState<Align>("center");
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [wordingStatus, setWordingStatus] = useState<string>("");
  const [backgroundStatus, setBackgroundStatus] = useState<string>("");
  const [isGeneratingText, setIsGeneratingText] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  useEffect(() => {
    if (!wordingStatus) return;
    const handle = window.setTimeout(() => setWordingStatus(""), 6000);
    return () => window.clearTimeout(handle);
  }, [wordingStatus]);

  useEffect(() => {
    if (!backgroundStatus) return;
    const handle = window.setTimeout(() => setBackgroundStatus(""), 6000);
    return () => window.clearTimeout(handle);
  }, [backgroundStatus]);

  const palette = useMemo(() => keywordPalette(designPrompt), [designPrompt]);
  const layout = useMemo(
    () => analyzeLayout(wording, `${stylePrompt} ${designPrompt}`, palette),
    [designPrompt, palette, stylePrompt, wording]
  );

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

      const data = await openaiPost<TextResponse>({
        path: "/v1/responses",
        payload,
        apiKey: apiKey.trim(),
        proxyBase,
      });

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

      const data = await openaiPost<ImageResponse>({
        path: "/v1/images/generations",
        payload,
        apiKey: apiKey.trim(),
        proxyBase,
      });

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
    }
  }, [apiKey, designPrompt, palette, proxyBase]);

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 lg:flex-row">
        <ControlPanel
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          proxyBase={proxyBase}
          onProxyBaseChange={setProxyBase}
          wording={wording}
          onWordingChange={setWording}
          onGenerateText={requestText}
          wordingStatus={wordingStatus}
          isGeneratingText={isGeneratingText}
          stylePrompt={stylePrompt}
          onStylePromptChange={setStylePrompt}
          designPrompt={designPrompt}
          onDesignPromptChange={setDesignPrompt}
          onGenerateBackground={requestBackground}
          backgroundStatus={backgroundStatus}
          isGeneratingImage={isGeneratingImage}
          autoLayout={autoLayout}
          onAutoLayoutChange={setAutoLayout}
          manualAlign={manualAlign}
          onManualAlignChange={setManualAlign}
        />

        <InvitationPreview
          wording={wording}
          palette={palette}
          layout={layout}
          backgroundUrl={backgroundUrl}
          autoLayout={autoLayout}
          manualAlign={manualAlign}
        />
      </div>
    </div>
  );
}
