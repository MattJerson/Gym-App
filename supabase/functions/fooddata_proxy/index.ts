// Supabase Edge Function (Deno): fooddata_proxy
// Proxies USDA FoodData Central API using server-side secret
// Deploy: supabase functions deploy fooddata_proxy
// Set secret: supabase secrets set FOODDATA_API_KEY=... 

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Simple in-memory token bucket per IP (best-effort)
type Bucket = { tokens: number; lastRefill: number };
const buckets = new Map<string, Bucket>();
const CAPACITY = 60; // max burst tokens
const REFILL_RATE_PER_SEC = 0.5; // ~30/min per IP

function getClientIp(req: Request) {
  const h = req.headers;
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}

function takeToken(ip: string) {
  const now = Date.now();
  const bucket = buckets.get(ip) || { tokens: CAPACITY, lastRefill: now };
  // Refill
  const elapsedSec = (now - bucket.lastRefill) / 1000;
  const refill = elapsedSec * REFILL_RATE_PER_SEC;
  bucket.tokens = Math.min(CAPACITY, bucket.tokens + refill);
  bucket.lastRefill = now;
  // Try take
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(ip, bucket);
    return true;
  }
  buckets.set(ip, bucket);
  return false;
}

const ALLOWED_PATHS = new Set(['foods/search']);
function isAllowedPath(path: string) {
  if (ALLOWED_PATHS.has(path)) return true;
  // allow food/:id where id is digits
  if (path.startsWith('food/')) {
    const id = path.slice(5);
    return /^\d+$/.test(id);
  }
  return false;
}

const PARAM_WHITELIST = new Set([
  'query', 'pageSize', 'pageNumber', 'dataType', 'sortBy', 'sortOrder', 'format'
]);

function sanitizeParams(obj: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (!PARAM_WHITELIST.has(k)) continue;
    if (v == null) continue;
    let s = String(v).trim();
    // Basic bounds and normalization
    if (k === 'query') {
      if (s.length > 80) s = s.slice(0, 80);
    }
    if (k === 'pageSize' || k === 'pageNumber') {
      const n = Math.max(1, Math.min(50, Number(s) || 1));
      s = String(n);
    }
    out[k] = s;
  }
  return out;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      },
    });
  }
  try {
    const apiKey = Deno.env.get('FOODDATA_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing FOODDATA_API_KEY' }), { status: 500, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
    }
    const baseURL = 'https://api.nal.usda.gov/fdc/v1';
    const body = await req.json().catch(() => ({}));
    const { path, params } = (body || {}) as { path?: string; params?: Record<string, unknown> };
    if (!path) {
      return new Response(JSON.stringify({ error: 'Missing path' }), { status: 400, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
    }
    if (!isAllowedPath(path)) {
      return new Response(JSON.stringify({ error: 'Invalid path' }), { status: 400, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
    }

    // Rate limit by IP
    const ip = getClientIp(req);
    if (!takeToken(ip)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
    }

    const safeParams = sanitizeParams(params || {});
    const qs = new URLSearchParams({ ...(params || {}), api_key: apiKey }).toString();
    const url = `${baseURL}/${path}?${new URLSearchParams({ ...safeParams, api_key: apiKey }).toString()}`;
    const r = await fetch(url);
    const contentType = r.headers.get('content-type') || 'application/json';
    const buf = await r.arrayBuffer();
    return new Response(buf, { status: r.status, headers: { 'content-type': contentType, 'access-control-allow-origin': '*' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
  }
});
