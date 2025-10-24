import { Pool } from "pg";

function stripSslParams(url: string): string {
  try {
    const u = new URL(url.replace(/^postgres(ql)?:/i, "postgresql:"));
    u.searchParams.delete("ssl");
    u.searchParams.delete("sslmode");
    return u.toString().replace(/^postgresql:/, url.startsWith("postgres:") ? "postgres:" : "postgresql:");
  } catch {
    return url;
  }
}

function pickConnectionString(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.RAILWAY_DATABASE_URL,
    process.env.DIRECT_URL,
    process.env.NEXT_PUBLIC_DATABASE_URL,
    process.env.FALLBACK_DATABASE_URL,
  ];
  let chosen = candidates.find(Boolean);

  // Hardcoded fallback (diminta user) bila semua env kosong
  if (!chosen) {
    chosen = "postgresql://postgres:NlqNrkkfhgrxPcIhmEZYfRLYNeNWFVJE@caboose.proxy.rlwy.net:56085/railway";
  }

  // Add provider managed flag for logging only, don't pass to URL Pool
  const isManaged = /(railway\.app|rlwy\.net|neon\.tech|supabase\.co|amazonaws\.com)/i.test(chosen);
  if (!/sslmode=/i.test(chosen) && isManaged) {
    chosen = chosen.includes("?") ? `${chosen}&sslmode=require` : `${chosen}?sslmode=require`;
  }
  if (!/[?&]ssl=/i.test(chosen) && isManaged) {
    chosen = chosen.includes("?") ? `${chosen}&ssl=true` : `${chosen}?ssl=true`;
  }

  // STRIP before Pool uses it so ssl: { rejectUnauthorized: false } option isn't overwritten by URL
  const sanitized = stripSslParams(chosen);
  return sanitized;
}

const connectionString = pickConnectionString();
 
export const dbPool = new Pool({
  connectionString,
  // Force non-strict SSL to handle self-signed certs on managed providers
  ssl: { rejectUnauthorized: false },
});

// Debug helper: redacts credentials and exposes host/port/db and flags
export function getDbDebugInfo() {
  try {
    if (!connectionString) return { hasConnectionString: false };
    const url = new URL(connectionString.replace(/^postgres(ql)?:/i, "postgresql:"));
    return {
      hasConnectionString: true,
      protocol: url.protocol,
      host: url.hostname,
      port: url.port,
      database: url.pathname.replace(/^\//, ""),
      sslmode: "no-verify", // karena kita paksa no-verify via Pool option
    };
  } catch {
    return { hasConnectionString: Boolean(connectionString) };
  }
} 