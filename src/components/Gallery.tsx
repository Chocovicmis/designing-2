import { useState, useEffect } from 'react';
import { supabase, InvitationCard } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

  const downloadCard = (card: InvitationCard) => {
    if (!card.card_data_url) return;

    const link = document.createElement('a');
    link.download = `${card.title}.png`;
    link.href = card.card_data_url;
    link.click();
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
                {card.card_data_url ? (
                  <img src={card.card_data_url} alt={card.title} />
                ) : (
                  <div className="no-preview">No preview available</div>
                )}
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
