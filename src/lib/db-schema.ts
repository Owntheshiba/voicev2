import { dbPool } from "./db";

export async function ensureCoreSchema() {
  await dbPool.query(`DO $$
  BEGIN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
    BEGIN
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
    BEGIN
      PERFORM gen_random_uuid();
    EXCEPTION WHEN undefined_function THEN
      PERFORM uuid_generate_v4();
      CREATE OR REPLACE FUNCTION gen_random_uuid() RETURNS uuid AS $fn$ SELECT uuid_generate_v4(); $fn$ LANGUAGE SQL;
    END;
  END$$;`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS users (
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
  );`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type text NOT NULL,
    quantity bigint NOT NULL DEFAULT 0
  );`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
  );`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
  );`);

  // inventory unique constraint per item
  await dbPool.query(`CREATE UNIQUE INDEX IF NOT EXISTS inventory_user_item_idx ON inventory(user_id, item_type);`);

  await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_token text;`);
  await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_url text;`);
  await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT false;`);
  await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_claim timestamptz;`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS notification_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type text NOT NULL,
    title text,
    message text,
    sent_at timestamptz DEFAULT now(),
    status text DEFAULT 'pending'
  );`);

  await dbPool.query(`CREATE INDEX IF NOT EXISTS notification_logs_user_idx ON notification_logs(user_id);`);
} 