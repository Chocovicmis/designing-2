import { useState } from 'react';
import { generateBackground, analyzeTextPlacement } from '../lib/openai';
import CardEditor from './CardEditor';
import { TextElement } from '../lib/supabase';

type Dimension = 'square' | 'landscape' | 'portrait';

export default function CardCreator() {
  const [dimension, setDimension] = useState<Dimension>('square');
  const [backgroundPrompt, setBackgroundPrompt] = useState('');
  const [invitationText, setInvitationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'editor'>('input');

  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [textElements, setTextElements] = useState<TextElement[]>([]);

  const dimensionSpecs = {
    square: { width: 800, height: 800, label: 'Square (800×800)' },
    landscape: { width: 1000, height: 600, label: 'Landscape (1000×600)' },
    portrait: { width: 600, height: 1000, label: 'Portrait (600×1000)' }
  };

  const handleGenerate = async () => {
    if (!backgroundPrompt.trim() || !invitationText.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const imageUrl = await generateBackground(backgroundPrompt);
      setBackgroundImageUrl(imageUrl);

      const analysis = await analyzeTextPlacement(
        invitationText,
        dimension,
        backgroundPrompt
      );

      const elementsWithIds = analysis.elements.map((el, idx) => ({
        ...el,
        id: `text-${idx}-${Date.now()}`
      }));

      setTextElements(elementsWithIds);
      setStep('editor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate card. Please check your OpenAI API key.');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('input');
  };

  if (step === 'editor') {
    return (
      <CardEditor
        dimension={dimension}
        backgroundImageUrl={backgroundImageUrl}
        backgroundPrompt={backgroundPrompt}
        invitationText={invitationText}
        initialTextElements={textElements}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="card-creator">
      <div className="creator-layout">
        <div className="creator-container">
          <h1>AI Invitation Card Maker</h1>
          <p className="subtitle">Create beautiful invitation cards with AI-powered design</p>

          <div className="form-section">
            <label>Card Dimension</label>
            <div className="dimension-selector">
              {(Object.keys(dimensionSpecs) as Dimension[]).map((dim) => (
                <button
                  key={dim}
                  className={`dimension-btn ${dimension === dim ? 'active' : ''}`}
                  onClick={() => setDimension(dim)}
                >
                  <span className="dim-icon">
                    {dim === 'square' && '⬜'}
                    {dim === 'landscape' && '▭'}
                    {dim === 'portrait' && '▯'}
                  </span>
                  <span className="dim-label">{dimensionSpecs[dim].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="background-prompt">Background Design Prompt</label>
            <textarea
              id="background-prompt"
              placeholder="e.g., Elegant floral design with gold accents, soft pink background, romantic wedding theme"
              value={backgroundPrompt}
              onChange={(e) => setBackgroundPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-section">
            <label htmlFor="invitation-text">Invitation Text</label>
            <textarea
              id="invitation-text"
              placeholder="e.g., You are cordially invited to celebrate the wedding of Sarah & John, Saturday, June 15th, 2024, 4:00 PM, Garden Venue"
              value={invitationText}
              onChange={(e) => setInvitationText(e.target.value)}
              rows={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Card with AI'}
          </button>

          <div className="info-box">
            <strong>How it works:</strong>
            <ol>
              <li>Choose your card dimension</li>
              <li>Describe the background design you want</li>
              <li>Enter your invitation text</li>
              <li>AI will generate the background and intelligently place your text</li>
              <li>Edit, save, and download your card</li>
            </ol>
          </div>
        </div>

        <div className="preview-container">
          <h3>Live Preview</h3>
          <div className="preview-wrapper">
            <div
              className="preview-card"
              style={{
                width: dimensionSpecs[dimension].width,
                height: dimensionSpecs[dimension].height,
                maxWidth: '100%',
                aspectRatio: `${dimensionSpecs[dimension].width} / ${dimensionSpecs[dimension].height}`
              }}
            >
              <div className="preview-text">
                {invitationText || 'Your invitation text will appear here...'}
              </div>
            </div>
            <p className="preview-note">
              This is a basic preview. AI will create a beautiful design with proper styling and layout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
