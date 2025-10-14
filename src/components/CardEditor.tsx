import { useState, useRef } from 'react';
import { supabase, TextElement } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CardEditorProps {
  dimension: 'square' | 'landscape' | 'portrait';
  backgroundImageUrl: string;
  backgroundPrompt: string;
  invitationText: string;
  initialTextElements: TextElement[];
  onBack: () => void;
}

export default function CardEditor({
  dimension,
  backgroundImageUrl,
  backgroundPrompt,
  invitationText,
  initialTextElements,
  onBack
}: CardEditorProps) {
  const { user } = useAuth();
  const [textElements, setTextElements] = useState<TextElement[]>(initialTextElements);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const dimensionSpecs = {
    square: { width: 800, height: 800 },
    landscape: { width: 1000, height: 600 },
    portrait: { width: 600, height: 1000 }
  };

  const { width, height } = dimensionSpecs[dimension];

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setDragging(elementId);
    setSelectedElement(elementId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setTextElements(elements =>
      elements.map(el =>
        el.id === dragging
          ? {
              ...el,
              x: Math.max(0, Math.min(width - el.width, el.x + deltaX)),
              y: Math.max(0, Math.min(height - 50, el.y + deltaY))
            }
          : el
      )
    );

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const updateElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(elements =>
      elements.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id: string) => {
    setTextElements(elements => elements.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const addNewTextElement = () => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      content: 'New Text',
      x: width / 2 - 100,
      y: height / 2,
      width: 200,
      fontSize: 24,
      fontWeight: 'normal',
      color: '#ffffff',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    };
    setTextElements([...textElements, newElement]);
    setSelectedElement(newElement.id);
  };

  const captureCardImage = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load background image'));
        };
        img.src = backgroundImageUrl;
      });

      ctx.drawImage(img, 0, 0, width, height);
    } catch (error) {
      console.warn('Could not load background image, using solid color:', error);
      ctx.fillStyle = '#f5f7fa';
      ctx.fillRect(0, 0, width, height);
    }

    textElements.forEach(el => {
      ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
      ctx.fillStyle = el.color;
      ctx.textAlign = el.textAlign;

      const lines = el.content.split('\n');
      lines.forEach((line, idx) => {
        const xPos = el.textAlign === 'center' ? el.x + el.width / 2 :
                     el.textAlign === 'right' ? el.x + el.width : el.x;
        ctx.fillText(line, xPos, el.y + (idx * el.fontSize * 1.2));
      });
    });

    return canvas.toDataURL('image/png');
  };

  const handleSave = async () => {
    if (!user) {
      alert('Please sign in to save your card');
      return;
    }

    setSaving(true);
    try {
      let cardDataUrl = '';
      try {
        cardDataUrl = await captureCardImage();
      } catch (captureErr) {
        console.warn('Could not capture image preview:', captureErr);
      }

      const { error } = await supabase.from('invitation_cards').insert({
        user_id: user.id,
        title: 'My Invitation Card',
        dimension,
        background_prompt: backgroundPrompt,
        background_image_url: backgroundImageUrl,
        invitation_text: invitationText,
        text_elements: textElements,
        card_data_url: cardDataUrl || null,
        is_public: false
      }).select();

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || 'Failed to save to database');
      }

      alert('Card saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save card';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const dataUrl = await captureCardImage();
      const link = document.createElement('a');
      link.download = 'invitation-card.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download card');
    }
  };

  const selectedEl = textElements.find(el => el.id === selectedElement);

  return (
    <div className="card-editor">
      <div className="editor-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Edit Your Card</h2>
        <div className="header-actions">
          {user && (
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save to Gallery'}
            </button>
          )}
          <button className="download-btn" onClick={handleDownload}>
            Download
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="canvas-area">
          <div
            ref={canvasRef}
            className="canvas"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedElement(null)}
          >
            {textElements.map(el => (
              <div
                key={el.id}
                className={`text-element ${selectedElement === el.id ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  fontSize: `${el.fontSize}px`,
                  fontWeight: el.fontWeight,
                  color: el.color,
                  textAlign: el.textAlign,
                  fontFamily: el.fontFamily,
                  cursor: dragging === el.id ? 'grabbing' : 'grab',
                  whiteSpace: 'pre-wrap',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
              >
                {el.content}
              </div>
            ))}
          </div>
        </div>

        <div className="properties-panel">
          <h3>Text Properties</h3>

          <button className="add-text-btn" onClick={addNewTextElement}>
            + Add Text Element
          </button>

          {selectedEl ? (
            <div className="properties">
              <div className="property">
                <label>Content</label>
                <textarea
                  value={selectedEl.content}
                  onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="property">
                <label>Font Size: {selectedEl.fontSize}px</label>
                <input
                  type="range"
                  min="12"
                  max="100"
                  value={selectedEl.fontSize}
                  onChange={(e) => updateElement(selectedEl.id, { fontSize: Number(e.target.value) })}
                />
              </div>

              <div className="property">
                <label>Width: {selectedEl.width}px</label>
                <input
                  type="range"
                  min="100"
                  max={width}
                  value={selectedEl.width}
                  onChange={(e) => updateElement(selectedEl.id, { width: Number(e.target.value) })}
                />
              </div>

              <div className="property">
                <label>Font Weight</label>
                <select
                  value={selectedEl.fontWeight}
                  onChange={(e) => updateElement(selectedEl.id, { fontWeight: e.target.value })}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="lighter">Light</option>
                </select>
              </div>

              <div className="property">
                <label>Text Align</label>
                <select
                  value={selectedEl.textAlign}
                  onChange={(e) => updateElement(selectedEl.id, { textAlign: e.target.value as any })}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div className="property">
                <label>Color</label>
                <input
                  type="color"
                  value={selectedEl.color}
                  onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                />
              </div>

              <div className="property">
                <label>Font Family</label>
                <select
                  value={selectedEl.fontFamily}
                  onChange={(e) => updateElement(selectedEl.id, { fontFamily: e.target.value })}
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                </select>
              </div>

              <button className="delete-btn" onClick={() => deleteElement(selectedEl.id)}>
                Delete Element
              </button>
            </div>
          ) : (
            <p className="no-selection">Click on a text element to edit its properties</p>
          )}
        </div>
      </div>
    </div>
  );
}
