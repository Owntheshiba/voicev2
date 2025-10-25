-- Railway PostgreSQL init schema for Voice Social Mini App
-- Run this once in your Railway PostgreSQL instance

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fid bigint UNIQUE,
  wallet_address text,
  username text,
  display_name text,
  pfp_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Points table
CREATE TABLE IF NOT EXISTS user_points (
  user_fid bigint PRIMARY KEY REFERENCES users(fid) ON DELETE CASCADE,
  total_points bigint DEFAULT 0,
  view_points bigint DEFAULT 0,
  like_points bigint DEFAULT 0,
  comment_points bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Voices table
CREATE TABLE IF NOT EXISTS voices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_fid bigint NOT NULL REFERENCES users(fid) ON DELETE CASCADE,
  audio_url text NOT NULL,
  duration float NOT NULL,
  title text,
  description text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Voice Likes table
CREATE TABLE IF NOT EXISTS voice_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_fid bigint NOT NULL REFERENCES users(fid) ON DELETE CASCADE,
  voice_id uuid NOT NULL REFERENCES voices(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_fid, voice_id)
);

-- Voice Comments table
CREATE TABLE IF NOT EXISTS voice_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_fid bigint NOT NULL REFERENCES users(fid) ON DELETE CASCADE,
  voice_id uuid NOT NULL REFERENCES voices(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  created_at timestamptz DEFAULT now()
);

-- Voice Views table
CREATE TABLE IF NOT EXISTS voice_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_fid bigint REFERENCES users(fid) ON DELETE CASCADE,
  voice_id uuid NOT NULL REFERENCES voices(id) ON DELETE CASCADE,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_fid, voice_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_fid bigint NOT NULL REFERENCES users(fid) ON DELETE CASCADE,
  sender_fid bigint REFERENCES users(fid) ON DELETE CASCADE,
  type text NOT NULL,
  voice_id uuid REFERENCES voices(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS voices_user_fid_idx ON voices(user_fid);
CREATE INDEX IF NOT EXISTS voices_created_at_idx ON voices(created_at);
CREATE INDEX IF NOT EXISTS voice_likes_voice_id_idx ON voice_likes(voice_id);
CREATE INDEX IF NOT EXISTS voice_comments_voice_id_idx ON voice_comments(voice_id);
CREATE INDEX IF NOT EXISTS voice_views_voice_id_idx ON voice_views(voice_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_fid_idx ON notifications(recipient_fid);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);

-- Show created tables
SELECT 'Voice Social schema created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
