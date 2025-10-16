import { useState, useEffect } from 'react';
import { supabase, InvitationCard } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CardPreview from './CardPreview';

export default function Gallery() {
  const { user } = useAuth();
  const [cards, setCards] = useState<InvitationCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, [user]);

  const loadCards = async () => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invitation_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error('Load cards error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const { error } = await supabase
        .from('invitation_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCards(cards.filter(card => card.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete card');
    }
  };

  const downloadCard = async (card: InvitationCard) => {
    try {
      const canvas = document.createElement('canvas');
      const dimensionSpecs: Record<string, { width: number; height: number }> = {
        square: { width: 800, height: 800 },
        landscape: { width: 1000, height: 600 },
        portrait: { width: 600, height: 1000 }
      };

      const { width, height } = dimensionSpecs[card.dimension];
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      const response = await fetch(card.background_image_url);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      ctx.drawImage(bitmap, 0, 0, width, height);

      card.text_elements.forEach((el: any) => {
        ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
        ctx.fillStyle = el.color;
        ctx.textAlign = el.textAlign;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const lines = el.content.split('\n');
        lines.forEach((line: string, idx: number) => {
          const xPos = el.textAlign === 'center' ? el.x + el.width / 2 :
                       el.textAlign === 'right' ? el.x + el.width : el.x;
          ctx.fillText(line, xPos, el.y + (idx * el.fontSize * 1.2));
        });
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to create image');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${card.title}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download card. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="gallery">
        <div className="gallery-container">
          <h1>Gallery</h1>
          <div className="empty-state">
            <p>Please sign in to view your saved cards</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gallery">
        <div className="gallery-container">
          <h1>Gallery</h1>
          <p>Loading your cards...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="gallery">
        <div className="gallery-container">
          <h1>Gallery</h1>
          <div className="empty-state">
            <p>You haven't created any cards yet</p>
            <p>Start creating beautiful invitation cards!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery-container">
        <h1>Gallery</h1>
        <p className="gallery-subtitle">{cards.length} card{cards.length !== 1 ? 's' : ''} saved</p>

        <div className="cards-grid">
          {cards.map(card => (
            <div key={card.id} className="card-item">
              <div className="card-preview">
                <CardPreview
                  backgroundImageUrl={card.background_image_url}
                  textElements={card.text_elements}
                  dimension={card.dimension}
                  width={300}
                  height={card.dimension === 'square' ? 300 : card.dimension === 'landscape' ? 300 : 500}
                />
              </div>
              <div className="card-info">
                <h3>{card.title}</h3>
                <p className="card-dimension">{card.dimension}</p>
                <p className="card-date">
                  {new Date(card.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="card-actions">
                <button onClick={() => downloadCard(card)}>Download</button>
                <button onClick={() => deleteCard(card.id)} className="delete">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
