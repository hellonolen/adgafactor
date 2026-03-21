// functions/api/replay/index.ts — Receive and store rrweb replay chunks in R2

interface Env {
  DB: D1Database;
  R2: R2Bucket;
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
    const body: { sessionId: string; chunk: number; events: unknown[] } =
      await request.json();

    if (!body.sessionId || body.chunk === undefined || !body.events?.length) {
      return new Response("Missing required fields", { status: 400, headers: CORS });
    }

    const key = `replays/${body.sessionId}/${String(body.chunk).padStart(6, "0")}.json`;
    await env.R2.put(key, JSON.stringify(body.events), {
      httpMetadata: { contentType: "application/json" },
    });

    // Mark session as having a replay
    await env.DB.prepare(
      `UPDATE sessions SET has_replay = 1, last_activity = ? WHERE id = ?`
    ).bind(Date.now(), body.sessionId).run();

    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Replay chunk upload failed:", err);
    return new Response("Internal error", { status: 500, headers: CORS });
  }
};
