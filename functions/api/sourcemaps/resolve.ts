// functions/api/sourcemaps/resolve.ts
// Accepts a minified stack frame (file, line, col) and resolves it via source maps stored in R2

interface Env {
  R2: R2Bucket;
}

interface ResolveRequest {
  file: string;    // e.g. "_next/static/chunks/app.js"
  line: number;
  column: number;
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
    const { file, line, column } = await request.json() as ResolveRequest;
    if (!file || line === undefined || column === undefined) {
      return new Response("Missing fields", { status: 400, headers: CORS });
    }

    // Source map key pattern: sourcemaps/{filename}.map
    const basename = file.split("/").pop() ?? file;
    const mapKey = `sourcemaps/${basename}.map`;

    const mapObj = await env.R2.get(mapKey);
    if (!mapObj) {
      return json({ resolved: false, reason: "No source map found" }, CORS);
    }

    // We return the raw source map and let the caller (admin UI or edge worker)
    // do the actual position resolution — source-map library is heavy for edge runtime
    const rawMap = await mapObj.text();
    return json({ resolved: true, mapKey, rawMap }, CORS);
  } catch (err) {
    console.error("Source map resolve failed:", err);
    return new Response("Internal error", { status: 500, headers: CORS });
  }
};

function json(data: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
