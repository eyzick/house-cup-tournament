-- Create voting_settings table to control when voting is enabled
CREATE TABLE IF NOT EXISTS voting_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  voting_enabled BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE voting_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read voting settings (needed for public voting page)
CREATE POLICY "Anyone can read voting settings" ON voting_settings
  FOR SELECT USING (true);

-- Allow anyone to update voting settings (admin interface)
CREATE POLICY "Anyone can update voting settings" ON voting_settings
  FOR UPDATE USING (true);

-- Allow anyone to insert voting settings
CREATE POLICY "Anyone can insert voting settings" ON voting_settings
  FOR INSERT WITH CHECK (true);

-- Insert default settings (voting disabled by default)
INSERT INTO voting_settings (id, voting_enabled, last_updated)
VALUES (1, false, NOW())
ON CONFLICT (id) DO NOTHING;
