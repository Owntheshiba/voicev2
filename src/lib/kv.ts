import { dbPool } from "./db";

const projectId = process.env.NEXT_PUBLIC_VIBES_ENGINEERING_PROJECT_ID!;

async function ensureSchema() {
  await dbPool.query(
    `CREATE TABLE IF NOT EXISTS kv (
      project_id text NOT NULL,
      key text NOT NULL,
      value jsonb,
      PRIMARY KEY (project_id, key)
    );`
  );
}

export const kv = {
  get: async (key: string): Promise<any> => {
    await ensureSchema();
    const res = await dbPool.query(
      `SELECT value FROM kv WHERE project_id = $1 AND key = $2`,
      [projectId, key],
    );
    return res.rows[0]?.value ?? null;
  },

  set: async (key: string, v: any): Promise<void> => {
    await ensureSchema();
    await dbPool.query(
      `INSERT INTO kv (project_id, key, value)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (project_id, key)
       DO UPDATE SET value = EXCLUDED.value`,
      [projectId, key, JSON.stringify(v)],
    );
  },

  incr: async (key: string, delta = 1): Promise<number> => {
    await ensureSchema();
    const res = await dbPool.query(
      `INSERT INTO kv (project_id, key, value)
       VALUES ($1, $2, to_jsonb($3::int))
       ON CONFLICT (project_id, key)
       DO UPDATE SET value = COALESCE(kv.value, '0'::jsonb) || to_jsonb((COALESCE((kv.value->>''), '0')::int + $3::int))
       RETURNING (value->>'')::int AS v`,
      [projectId, key, delta],
    );
    // Fallback: perform explicit update if above fails due to operator usage
    if (!res.rows[0] || Number.isNaN(res.rows[0].v)) {
      const current = await kv.get(key);
      const next = (Number(current ?? 0) || 0) + delta;
      await kv.set(key, next);
      return next;
    }
    return res.rows[0].v as number;
  },

  append: async (key: string, elem: any): Promise<any> => {
    await ensureSchema();
    const res = await dbPool.query(
      `WITH cur AS (
         SELECT COALESCE(value, '[]'::jsonb) AS v FROM kv WHERE project_id = $1 AND key = $2
       )
       INSERT INTO kv (project_id, key, value)
       VALUES ($1, $2, (SELECT v FROM cur) || to_jsonb($3))
       ON CONFLICT (project_id, key)
       DO UPDATE SET value = (CASE WHEN jsonb_typeof(kv.value) = 'array' THEN kv.value ELSE '[]'::jsonb END) || to_jsonb($3)
       RETURNING value`,
      [projectId, key, elem],
    );
    return res.rows[0].value;
  },

  merge: async (key: string, patch: object): Promise<any> => {
    await ensureSchema();
    const res = await dbPool.query(
      `WITH cur AS (
         SELECT COALESCE(value, '{}'::jsonb) AS v FROM kv WHERE project_id = $1 AND key = $2
       )
       INSERT INTO kv (project_id, key, value)
       VALUES ($1, $2, (SELECT v FROM cur) || $3::jsonb)
       ON CONFLICT (project_id, key)
       DO UPDATE SET value = (CASE WHEN jsonb_typeof(kv.value) = 'object' THEN kv.value ELSE '{}'::jsonb END) || $3::jsonb
       RETURNING value`,
      [projectId, key, JSON.stringify(patch)],
    );
    return res.rows[0].value;
  },
};
