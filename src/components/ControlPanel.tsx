import { Align } from "../lib/layout";

export type ControlPanelProps = {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  proxyBase: string;
  onProxyBaseChange: (value: string) => void;
  wording: string;
  onWordingChange: (value: string) => void;
  onGenerateText: () => void;
  wordingStatus: string;
  isGeneratingText: boolean;
  stylePrompt: string;
  onStylePromptChange: (value: string) => void;
  designPrompt: string;
  onDesignPromptChange: (value: string) => void;
  onGenerateBackground: () => void;
  backgroundStatus: string;
  isGeneratingImage: boolean;
  autoLayout: boolean;
  onAutoLayoutChange: (checked: boolean) => void;
  manualAlign: Align;
  onManualAlignChange: (value: Align) => void;
};

export function ControlPanel({
  apiKey,
  onApiKeyChange,
  proxyBase,
  onProxyBaseChange,
  wording,
  onWordingChange,
  onGenerateText,
  wordingStatus,
  isGeneratingText,
  stylePrompt,
  onStylePromptChange,
  designPrompt,
  onDesignPromptChange,
  onGenerateBackground,
  backgroundStatus,
  isGeneratingImage,
  autoLayout,
  onAutoLayoutChange,
  manualAlign,
  onManualAlignChange,
}: ControlPanelProps) {
  return (
    <section className="w-full rounded-3xl bg-white p-6 shadow-xl lg:w-2/5">
      <h1 className="text-2xl font-semibold text-slate-800">AI Wedding Invitation Maker</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter your invitation wording, describe the mood, and let the AI craft both the copy and background artwork. Run
        <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">npm run preview:cdn</code>
        locally to use the built-in proxy server.
      </p>

      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">OpenAI API Key</label>
          <input
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder="sk-..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <p className="text-xs text-slate-500">
            Leave blank when the preview proxy is launched with
            <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[10px]">OPENAI_API_KEY</code>.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Proxy Base (optional)</label>
          <input
            value={proxyBase}
            onChange={(event) => onProxyBaseChange(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <p className="text-xs text-slate-500">Default matches the zero-install preview helper.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Invitation Wording</label>
          <textarea
            value={wording}
            onChange={(event) => onWordingChange(event.target.value)}
            rows={8}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm leading-5 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <button
            type="button"
            onClick={onGenerateText}
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
            onChange={(event) => onStylePromptChange(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Background Design Prompt</label>
          <textarea
            value={designPrompt}
            onChange={(event) => onDesignPromptChange(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm leading-5 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <button
            type="button"
            onClick={onGenerateBackground}
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
              onChange={(event) => onAutoLayoutChange(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
          </div>
          <p className="text-xs text-slate-500">
            When enabled, the invitation automatically picks alignment and contrast that best suit your prompts.
          </p>
          {!autoLayout && (
            <select
              value={manualAlign}
              onChange={(event) => onManualAlignChange(event.target.value as Align)}
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
  );
}
