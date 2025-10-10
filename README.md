# AI Invitation Card Maker

This project contains a single-file React application (`src/App.tsx`) that builds an AI-assisted wedding invitation designer. It
lets you:

- Paste or compose your invitation wording.
- Ask OpenAI to rewrite the text in a requested tone.
- Generate a matching background illustration from an OpenAI image prompt.
- Automatically align and colour the wording so it stays readable on top of the artwork.

Everything runs client-side. Provide your own OpenAI API key or relay the calls through the included preview proxy.

## Quick start

```bash
npm install
npm run dev -- --host
```

Open the printed URL (for example <http://localhost:5173>) to use the designer.

### Zero-install preview

For a quick demo without installing dependencies, launch the helper static server:

```bash
OPENAI_API_KEY=sk-your-key npm run preview:cdn
# visit http://localhost:4173/preview.html
```

The preview server exposes a permissive proxy at `/api/openai-proxy`. Leave the API key field blank inside the UI to use the
server-side key, or paste a browser key when hosting elsewhere.

### Deploying elsewhere

Copy `src/App.tsx` into your project and render it from your root component. Tailwind utility classes are used for layout, but
you can swap them for your own styles or wrap the card markup in your design system.

Configure the component at runtime:

- **OpenAI API key** – paste a client key or leave empty if your proxy adds one.
- **Proxy base** – defaults to `/api/openai-proxy?path=` for the included helper.
- **Invitation wording** – free-form text. Double line breaks split sections.
- **Style & design prompts** – guide the wording rewrite and background art.
- **Automatic layout** – keep enabled to let the planner pick alignment, contrast, and highlight colours.

## How it works

1. **Prompt analysis** – the wording and design prompts are scanned for cues (e.g. “modern”, “traditional”, “busy floral”).
   Alignment, contrast overlays, and accent colours are derived from these hints.
2. **Text generation** – clicking **Rewrite with AI** calls the OpenAI Responses API (`gpt-4o-mini`) through the proxy. The
   generated copy is trimmed and rendered with light markdown emphasis support.
3. **Artwork generation** – clicking **Create AI Background** calls the OpenAI Images API (`gpt-image-1`). The resulting base64
   PNG is used as the card background. When the image call fails, the prompt-influenced gradient remains visible so changes can be
   previewed immediately.
4. **Rendering** – the invitation card is a responsive `<div>` with overlay shading to maintain legibility. Alignment switches to
   left/centre/right automatically, but you can take manual control by disabling the toggle.

Feel free to adapt the heuristics in `App.tsx` if you want different layout rules, additional keyword palettes, or a custom
branding system.
