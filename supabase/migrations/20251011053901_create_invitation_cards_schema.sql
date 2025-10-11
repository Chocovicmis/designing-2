/*
  # Create Invitation Cards Database Schema

  ## Overview
  This migration creates the complete database schema for the AI-powered invitation card maker application.

  ## 1. New Tables
  
  ### `invitation_cards`
  Stores all created invitation cards with their configurations and generated content.
  - `id` (uuid, primary key) - Unique identifier for each card
  - `user_id` (uuid, nullable) - Reference to auth.users, null for guest users
  - `title` (text) - Card title/name for organization
  - `dimension` (text) - Card format: 'square', 'landscape', or 'portrait'
  - `background_prompt` (text) - Original prompt used for background generation
  - `background_image_url` (text) - URL of the generated background image
  - `invitation_text` (text) - The actual invitation text content
  - `text_elements` (jsonb) - Array of text elements with position, style, and content
  - `card_data_url` (text, nullable) - Complete rendered card as data URL for quick preview
  - `is_public` (boolean) - Whether card is publicly viewable
  - `created_at` (timestamptz) - When the card was created
  - `updated_at` (timestamptz) - Last modification time

  ## 2. Security
  - Enable Row Level Security on all tables
  - Authenticated users can create and manage their own cards
  - Guest users can create cards but cannot save to gallery
  - Users can only read/update/delete their own cards
  - Public cards can be viewed by anyone

  ## 3. Important Notes
  - Cards created without user_id are temporary (guest mode)
  - text_elements stores full styling info for each text block
  - background_image_url stores DALL-E generated images
  - Indexes added for performance on user_id and created_at
*/

-- Create invitation_cards table
CREATE TABLE IF NOT EXISTS invitation_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Card',
  dimension text NOT NULL DEFAULT 'square',
  background_prompt text NOT NULL,
  background_image_url text NOT NULL,
  invitation_text text NOT NULL,
  text_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  card_data_url text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add check constraint for dimension values
ALTER TABLE invitation_cards 
  ADD CONSTRAINT valid_dimension 
  CHECK (dimension IN ('square', 'landscape', 'portrait'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS invitation_cards_user_id_idx ON invitation_cards(user_id);
CREATE INDEX IF NOT EXISTS invitation_cards_created_at_idx ON invitation_cards(created_at DESC);

-- Enable Row Level Security
ALTER TABLE invitation_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own cards
CREATE POLICY "Users can view own cards"
  ON invitation_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anyone can view public cards
CREATE POLICY "Anyone can view public cards"
  ON invitation_cards FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Policy: Users can insert their own cards
CREATE POLICY "Users can create own cards"
  ON invitation_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cards
CREATE POLICY "Users can update own cards"
  ON invitation_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own cards
CREATE POLICY "Users can delete own cards"
  ON invitation_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_invitation_cards_updated_at
  BEFORE UPDATE ON invitation_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
