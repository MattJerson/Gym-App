// Minimal client for calling Supabase Edge Functions from the app
import { SUPABASE_URL } from "@env";

export async function callEdgeFunction(name, { method = 'POST', headers = {}, body } = {}) {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge function ${name} failed: ${res.status} ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}
