-- Create user settings table for storing user-specific settings
-- This will replace localStorage-based settings with database storage

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  settings_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user_id lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Create updated_at trigger for user_settings
CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;