import OpenAI from 'openai';
import { supabase } from './supabase';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey || apiKey === 'your_openai_api_key_here') {
  console.warn('OpenAI API key not configured. AI features will not work.');
}

export const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
});

async function uploadImageToSupabase(imageUrl: string): Promise<string> {
  if (!supabase) {
    console.warn('Supabase not configured. Skipping background upload.');
    return imageUrl;
  }

  const response = await fetch(imageUrl);
  const blob = await response.blob();

  const fileName = `background-${Date.now()}.png`;
  const { data, error } = await supabase.storage
    .from('card-backgrounds')
    .upload(fileName, blob, {
      contentType: 'image/png',
      cacheControl: '3600',
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('card-backgrounds')
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function generateBackground(prompt: string): Promise<string> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Create a high-resolution, print-ready invitation card background with professional lighting, elegant composition, and a clear center area for text. The design theme will be: ${prompt} — keep it balanced, detailed, and suitable for printing with no text or watermark. Ensure the design includes sophisticated corners, professional color palette, and leaves ample white/clear space in the center for overlay text.`,
    n: 1,
    size: "1024x1024",
    quality: "hd",
  });

  const dalleUrl = response.data?.[0]?.url || '';
  if (!dalleUrl) throw new Error('Failed to generate image');

  try {
    const supabaseUrl = await uploadImageToSupabase(dalleUrl);
    return supabaseUrl;
  } catch (error) {
    console.warn('Failed to upload to Supabase, using DALL-E URL:', error);
    return dalleUrl;
  }
}

export async function analyzeTextPlacement(
  invitationText: string,
  dimension: 'square' | 'landscape' | 'portrait',
  backgroundDescription: string
): Promise<{
  elements: Array<{
    content: string;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    fontFamily: string;
  }>;
  reasoning: string;
}> {
  const dimensionSpecs = {
    square: { width: 800, height: 800 },
    landscape: { width: 1000, height: 600 },
    portrait: { width: 600, height: 1000 }
  };

  const { width, height } = dimensionSpecs[dimension];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert graphic designer specializing in invitation card layouts. Analyze the invitation text and suggest optimal text placement, sizing, and styling that will be clearly visible and aesthetically pleasing on the background.

CRITICAL REQUIREMENTS:
1. Ensure high contrast text colors (usually white or black with proper shadows/outlines if needed)
2. Break text into logical sections (heading, body, details, etc.)
3. Use appropriate font sizes - headings should be larger (40-60px), body text medium (20-30px), details smaller (16-20px)
4. Position text to avoid likely busy areas based on background description
5. Center important elements for visual balance
6. Leave adequate margins (at least 50px from edges)

Return ONLY valid JSON in this exact format:
{
  "elements": [
    {
      "content": "text content",
      "x": 100,
      "y": 100,
      "width": 600,
      "fontSize": 48,
      "fontWeight": "bold",
      "color": "#ffffff",
      "textAlign": "center",
      "fontFamily": "serif"
    }
  ],
  "reasoning": "Brief explanation of design choices"
}`
      },
      {
        role: "user",
        content: `Card Dimensions: ${width}x${height}px (${dimension})
Background Theme: ${backgroundDescription}

Invitation Text to Layout:
${invitationText}

Provide optimal text layout with clear visibility and elegant design.`
      }
    ],
    temperature: 0.7,
  });

  const result = completion.choices[0].message.content || '{}';

  try {
    return JSON.parse(result);
  } catch (e) {
    console.error('Failed to parse GPT response:', result);
    throw new Error('Failed to analyze text placement');
  }
}
