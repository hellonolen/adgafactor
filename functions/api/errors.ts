// functions/api/errors.ts — Error ingestion endpoint
// Receives error payloads from the client SDK, stores in D1, alerts on spikes

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  DISCORD_WEBHOOK?: string;
}

interface ErrorPayload {
  id: string;
  sessionId: string;
  userId?: string;
  url: string;
  message: string;
  stack?: string;
  type?: string;
  breadcrumbs?: unknown[];
  context?: Record<string, unknown>;
  timestamp: number;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const payload: ErrorPayload = await request.json();

    if (!payload.id || !payload.sessionId || !payload.message) {
      return new Response("Missing required fields", { status: 400, headers: CORS });
    }

    // Fingerprint = hash of (message + first meaningful stack frame)
    const stackTop = extractStackTop(payload.stack);
    const fingerprint = await sha256(`${payload.message}||${stackTop}`);
    const groupId = fingerprint.slice(0, 16);
    const now = payload.timestamp || Date.now();

    // Upsert error group
    await env.DB.prepare(`
      INSERT INTO error_groups (id, fingerprint, type, message, stack_top, first_seen, last_seen, count, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'open')
      ON CONFLICT(fingerprint) DO UPDATE SET
        last_seen = excluded.last_seen,
        count = count + 1
    `).bind(
      groupId,
      fingerprint,
      payload.type ?? "error",
      payload.message,
      stackTop,
      now,
      now
    ).run();

    // Insert event
    await env.DB.prepare(`
      INSERT INTO error_events (id, group_id, session_id, user_id, url, message, stack, type, breadcrumbs, context, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      payload.id,
      groupId,
      payload.sessionId,
      payload.userId ?? null,
      payload.url,
      payload.message,
      payload.stack ?? null,
      payload.type ?? "error",
      JSON.stringify(payload.breadcrumbs ?? []),
      JSON.stringify(payload.context ?? {}),
      now
    ).run();

    // Upsert session
    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, user_agent, url, started_at, last_activity)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET last_activity = excluded.last_activity
    `).bind(
      payload.sessionId,
      payload.userId ?? null,
      (payload.context as Record<string, string>)?.userAgent ?? null,
      payload.url,
      now,
      now
    ).run();

    // Check for spike — if >10 errors in the last 5 minutes across this group, alert
    await checkAndAlert(env, groupId, payload.message);

    return new Response(JSON.stringify({ ok: true, groupId }), {
      status: 201,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error ingestion failed:", err);
    return new Response("Internal error", { status: 500, headers: CORS });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractStackTop(stack?: string): string {
  if (!stack) return "unknown";
  const lines = stack.split("\n").map((l) => l.trim());
  // Skip the first line (error message) and find first at/@ frame
  const frame = lines.find((l) => l.startsWith("at ") || l.includes("@"));
  if (!frame) return lines[0]?.slice(0, 200) ?? "unknown";
  // Strip file path down to filename:line
  return frame.replace(/.*[/\\]/, "").slice(0, 200);
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function checkAndAlert(env: Env, groupId: string, message: string) {
  if (!env.DISCORD_WEBHOOK) return;
  try {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const { results } = await env.DB.prepare(
      `SELECT count(*) as n FROM error_events WHERE group_id = ? AND timestamp > ?`
    ).bind(groupId, fiveMinAgo).all();
    const count = (results[0] as Record<string, number>)?.n ?? 0;
    // Alert at 10, 50, 100 — avoid spamming
    if (count === 10 || count === 50 || count === 100) {
      await fetch(env.DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🚨 **Error spike** — ${count} occurrences in 5 min\n\`${message.slice(0, 200)}\`\nhttps://adgafactor.pages.dev/admin/errors`,
        }),
      });
    }
  } catch {
    // Non-critical — don't fail the main request
  }
}
