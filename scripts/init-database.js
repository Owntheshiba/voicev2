const { Client } = require('pg');

const connectionString = 'postgresql://postgres:NlqNrkkfhgrxPcIhmEZYfRLYNeNWFVJE@postgres.railway.internal:5432/railway';

const sql = 
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fid bigint UNIQUE,
  wallet_address text,
  username text,
  referral_code text UNIQUE,
  referrer_id uuid REFERENCES users(id),
  gold_balance bigint DEFAULT 0,
  exp bigint DEFAULT 0,
  level int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  quantity bigint NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_user_item_idx ON inventory(user_id, item_type);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS logs_user_idx ON logs(user_id);
CREATE INDEX IF NOT EXISTS logs_action_type_idx ON logs(action_type);

-- KV store
CREATE TABLE IF NOT EXISTS kv (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text,
  filename text NOT NULL,
  mime_type text,
  data bytea NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS files_project_idx ON files(project_id);
CREATE INDEX IF NOT EXISTS files_filename_idx ON files(filename);
;

async function initDatabase() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('?? Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('? Connected successfully!');

    console.log('?? Creating tables and indexes...');
    await client.query(sql);
    console.log('? Schema created successfully!');

    const result = await client.query(\
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    \);
    
    console.log('\n?? Created tables:');
    result.rows.forEach(row => {
      console.log(\  - \\);
    });

    console.log('\n?? Database initialization completed!');
    
  } catch (error) {
    console.error('? Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('?? Connection closed.');
  }
}

initDatabase();
