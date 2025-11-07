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
    prompt: `Create a high-resolution, print-ready invitation card background. IMPORTANT: Design the background with decorative elements ONLY on the edges and corners, leaving 60-70% of the center area completely clear, blank, or very light for text overlay.

Design theme: ${prompt}

Requirements:
- Center area (60-70%): Light background, minimal decoration, maximum readability for text
- Edges/Corners (30-40%): Sophisticated decorative elements, floral patterns, borders, or design accents
- Color palette: Professional, elegant, suitable for printing
- No text, watermarks, or logos
- Ensure high contrast between text areas and background
- Suitable for both dark and light text overlay

The key is to make 60-70% of the image space available for readable text placement while keeping decorative elements on the borders and corners.`,
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

CRITICAL: Return ONLY valid JSON, no markdown, no explanations. Start with { and end with }

Return in this exact JSON format:
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

Return ONLY valid JSON with optimal text layout.`
      }
    ],
    temperature: 0.7,
  });

  const result = completion.choices[0].message.content || '{}';

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Failed to parse GPT response:', result);

    const lines = invitationText.split('\n').filter(line => line.trim());
    const fallbackElements = lines.slice(0, 5).map((line, idx) => ({
      content: line.trim(),
      x: 50,
      y: 100 + idx * 150,
      width: width - 100,
      fontSize: idx === 0 ? 48 : idx === 1 ? 36 : 24,
      fontWeight: idx === 0 ? 'bold' : idx === 1 ? '600' : 'normal',
      color: '#ffffff',
      textAlign: 'center' as const,
      fontFamily: 'serif'
    }));

    return {
      elements: fallbackElements.length > 0 ? fallbackElements : [{
        content: invitationText,
        x: 50,
        y: height / 2 - 50,
        width: width - 100,
        fontSize: 32,
        fontWeight: 'normal',
        color: '#ffffff',
        textAlign: 'center',
        fontFamily: 'serif'
      }],
      reasoning: 'Using fallback layout due to API parsing issue'
    };
  }
}
