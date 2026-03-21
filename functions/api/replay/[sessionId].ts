// functions/api/replay/[sessionId].ts — Serve assembled replay for admin viewer

interface Env {
  R2: R2Bucket;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const sessionId = params.sessionId as string;

  try {
    // List all chunks for this session
    const list = await env.R2.list({ prefix: `replays/${sessionId}/` });
    if (!list.objects.length) {
      return new Response(JSON.stringify([]), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Fetch and concatenate all chunks in order
    const allEvents: unknown[] = [];
    const sorted = list.objects.sort((a, b) => a.key.localeCompare(b.key));

    for (const obj of sorted) {
      const chunk = await env.R2.get(obj.key);
      if (chunk) {
        const events = JSON.parse(await chunk.text()) as unknown[];
        allEvents.push(...events);
      }
    }

    return new Response(JSON.stringify(allEvents), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Replay fetch failed:", err);
    return new Response("Internal error", { status: 500, headers: CORS });
  }
};
