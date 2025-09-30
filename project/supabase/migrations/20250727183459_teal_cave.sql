/*
  # Create FIR drafts table

  1. New Tables
    - `fir_drafts`
      - `id` (uuid, primary key)
      - `case_id` (text)
      - `status` (text) - 'draft' or 'submitted'
      - `form_data_local` (jsonb) - form data in local language
      - `form_data_english` (jsonb) - form data in English
      - `language` (text) - language used
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `fir_drafts` table
    - Add policy for public access (demo purposes)
*/

CREATE TABLE IF NOT EXISTS fir_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  form_data_local jsonb DEFAULT '{}',
  form_data_english jsonb DEFAULT '{}',
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fir_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on fir_drafts"
  ON fir_drafts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fir_drafts_updated_at 
  BEFORE UPDATE ON fir_drafts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();