-- Drop existing tables and recreate with camelCase naming
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS voice_views CASCADE;
DROP TABLE IF EXISTS voice_likes CASCADE;
DROP TABLE IF EXISTS voice_comments CASCADE;
DROP TABLE IF EXISTS voices CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables with camelCase naming to match code
CREATE TABLE IF NOT EXISTS "User" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fid bigint UNIQUE,
  walletAddress text,
  username text,
  displayName text,
  pfpUrl text,
  bio text,
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "UserPoints" (
  userFid bigint PRIMARY KEY REFERENCES "User"(fid) ON DELETE CASCADE,
  totalPoints bigint DEFAULT 0,
  viewPoints bigint DEFAULT 0,
  likePoints bigint DEFAULT 0,
  commentPoints bigint DEFAULT 0,
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Voice" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userFid bigint NOT NULL REFERENCES "User"(fid) ON DELETE CASCADE,
  audioUrl text NOT NULL,
  duration float NOT NULL,
  title text,
  description text,
  isAnonymous boolean DEFAULT false,
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "VoiceLike" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userFid bigint NOT NULL REFERENCES "User"(fid) ON DELETE CASCADE,
  voiceId uuid NOT NULL REFERENCES "Voice"(id) ON DELETE CASCADE,
  createdAt timestamptz DEFAULT now(),
  UNIQUE(userFid, voiceId)
);

CREATE TABLE IF NOT EXISTS "VoiceComment" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userFid bigint NOT NULL REFERENCES "User"(fid) ON DELETE CASCADE,
  voiceId uuid NOT NULL REFERENCES "Voice"(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  createdAt timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "VoiceView" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userFid bigint REFERENCES "User"(fid) ON DELETE CASCADE,
  voiceId uuid NOT NULL REFERENCES "Voice"(id) ON DELETE CASCADE,
  ipAddress text,
  createdAt timestamptz DEFAULT now(),
  UNIQUE(userFid, voiceId)
);

CREATE TABLE IF NOT EXISTS "Notification" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipientFid bigint NOT NULL REFERENCES "User"(fid) ON DELETE CASCADE,
  senderFid bigint REFERENCES "User"(fid) ON DELETE CASCADE,
  type text NOT NULL,
  voiceId uuid REFERENCES "Voice"(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  createdAt timestamptz DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS voices_userFid_idx ON "Voice"(userFid);
CREATE INDEX IF NOT EXISTS voices_createdAt_idx ON "Voice"(createdAt);
CREATE INDEX IF NOT EXISTS voiceLikes_voiceId_idx ON "VoiceLike"(voiceId);
CREATE INDEX IF NOT EXISTS voiceComments_voiceId_idx ON "VoiceComment"(voiceId);
CREATE INDEX IF NOT EXISTS voiceViews_voiceId_idx ON "VoiceView"(voiceId);
CREATE INDEX IF NOT EXISTS notifications_recipientFid_idx ON "Notification"(recipientFid);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON "Notification"(read);

-- Show created tables
SELECT 'Database schema updated with camelCase naming!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
