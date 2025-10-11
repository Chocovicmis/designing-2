import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface InvitationCard {
  id: string;
  user_id: string | null;
  title: string;
  dimension: 'square' | 'landscape' | 'portrait';
  background_prompt: string;
  background_image_url: string;
  invitation_text: string;
  text_elements: TextElement[];
  card_data_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TextElement {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  fontFamily: string;
}
