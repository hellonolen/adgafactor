// functions/api/admin/errors.ts — Admin read API for errors + groups

interface Env {
  DB: D1Database;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const view   = url.searchParams.get("view") ?? "groups";   // groups | events
  const status = url.searchParams.get("status") ?? "open";
  const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const groupId = url.searchParams.get("groupId");

  try {
    if (view === "events" && groupId) {
      const { results } = await env.DB.prepare(`
        SELECT id, session_id, user_id, url, message, stack, type, breadcrumbs, context, timestamp
        FROM error_events
        WHERE group_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `).bind(groupId, limit).all();
      return json({ results }, CORS);
    }

    if (view === "summary") {
      const [groups, events, sessions] = await Promise.all([
        env.DB.prepare("SELECT count(*) as n FROM error_groups WHERE status = 'open'").first(),
        env.DB.prepare("SELECT count(*) as n FROM error_events WHERE timestamp > ?").bind(Date.now() - 86400000).first(),
        env.DB.prepare("SELECT count(*) as n FROM sessions WHERE started_at > ?").bind(Date.now() - 86400000).first(),
      ]);
      return json({ groups, events, sessions }, CORS);
    }

    // Default: groups list
    const { results } = await env.DB.prepare(`
      SELECT id, type, message, stack_top, first_seen, last_seen, count, status
      FROM error_groups
      WHERE status = ?
      ORDER BY last_seen DESC
      LIMIT ?
    `).bind(status, limit).all();

    return json({ results }, CORS);
  } catch (err) {
    console.error("Admin errors query failed:", err);
    return new Response("Internal error", { status: 500, headers: CORS });
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { id, status } = await request.json() as { id: string; status: string };
    if (!["resolved", "ignored", "open"].includes(status)) {
      return new Response("Invalid status", { status: 400, headers: CORS });
    }
    await env.DB.prepare(
      "UPDATE error_groups SET status = ? WHERE id = ?"
    ).bind(status, id).run();
    return json({ ok: true }, CORS);
  } catch (err) {
    return new Response("Internal error", { status: 500, headers: CORS });
  }
};

function json(data: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
