-- Fix voting_settings policies to allow anonymous access
-- Run this if you already created the table but are getting 401 errors

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read voting settings" ON voting_settings;
DROP POLICY IF EXISTS "Authenticated users can update voting settings" ON voting_settings;
DROP POLICY IF EXISTS "Authenticated users can insert voting settings" ON voting_settings;

-- Create new policies that allow anonymous access
CREATE POLICY "Anyone can read voting settings" ON voting_settings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update voting settings" ON voting_settings
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert voting settings" ON voting_settings
  FOR INSERT WITH CHECK (true);

-- Ensure the default row exists
INSERT INTO voting_settings (id, voting_enabled, last_updated)
VALUES (1, false, NOW())
ON CONFLICT (id) DO NOTHING;
