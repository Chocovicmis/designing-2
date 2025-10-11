import { Align, LayoutPlan, applyAlpha } from "../lib/layout";
import { EmphasisedToken, emphasiseInline, sanitizeParagraphs } from "../lib/text";
import { Palette } from "../lib/palette";

export type InvitationPreviewProps = {
  wording: string;
  palette: Palette;
  layout: LayoutPlan;
  backgroundUrl: string;
  autoLayout: boolean;
  manualAlign: Align;
};

export function InvitationPreview({
  wording,
  palette,
  layout,
  backgroundUrl,
  autoLayout,
  manualAlign,
}: InvitationPreviewProps) {
  const paragraphs = sanitizeParagraphs(wording);
  const [soft, mid, deep] = palette;
  const fallbackBackground = `linear-gradient(135deg, ${soft} 0%, ${mid} 45%, ${deep} 100%)`;
  const activeAlign = autoLayout ? layout.align : manualAlign;

  const overlayStyle = layout.overlayColor
    ? {
        background: applyAlpha(layout.overlayColor, layout.overlayOpacity),
      }
    : undefined;

  return (
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
        <div
          className="relative flex h-full flex-col justify-center px-10 py-12 text-balance"
          style={{ textAlign: activeAlign }}
        >
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="mb-6 text-lg leading-relaxed tracking-wide"
              style={{ color: layout.textColor }}
            >
              {emphasiseInline(paragraph).map(renderToken(layout.accent))}
            </p>
          ))}
        </div>
      </div>
      <div className="text-center text-xs text-slate-500">
        Background palette adapts to your prompt. AI artwork requires a valid key or the preview proxy.
      </div>
    </section>
  );
}

function renderToken(accent: string) {
  return (token: EmphasisedToken, index: number) => {
    if (typeof token === "string") {
      return <span key={index}>{token}</span>;
    }
    return (
      <strong key={index} className="font-semibold" style={{ color: accent }}>
        {token.strong}
      </strong>
    );
  };
}
