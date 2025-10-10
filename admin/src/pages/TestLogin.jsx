import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function TestLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [log, setLog] = useState([]);
  const append = (m) => setLog((l) => [...l, `${new Date().toISOString()} ${m}`]);

  const doSdkLogin = async () => {
    append('SDK: start signInWithPassword');
    const t0 = performance.now();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    const t1 = performance.now();
    append(`SDK: done in ${(t1 - t0).toFixed(0)}ms, error=${!!error}`);
    if (error) append(`SDK error: ${error.message}`);
    else append(`SDK user: ${data?.user?.id || 'none'}`);
  };

  const doDirectToken = async () => {
    append('TOKEN: start POST /auth/v1/token');
    const t0 = performance.now();
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password }),
      });
      const t1 = performance.now();
      append(`TOKEN: status ${res.status} in ${(t1 - t0).toFixed(0)}ms`);
      const json = await res.json().catch(() => ({}));
      append(`TOKEN: body keys ${Object.keys(json || {}).join(',')}`);
    } catch (e) {
      append(`TOKEN: error ${String(e?.message || e)}`);
    }
  };

  const doHealth = async () => {
    append('HEALTH: GET /auth/v1/health');
    const t0 = performance.now();
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: SUPABASE_ANON_KEY } });
      const t1 = performance.now();
      append(`HEALTH: status ${res.status} in ${(t1 - t0).toFixed(0)}ms`);
    } catch (e) {
      append(`HEALTH: error ${String(e?.message || e)}`);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Test Supabase Login</h1>
      <div className="grid gap-3 max-w-md">
        <input className="border rounded p-2" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border rounded p-2" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={doSdkLogin}>SDK Login</button>
          <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={doDirectToken}>Direct Token</button>
          <button className="px-3 py-2 bg-gray-600 text-white rounded" onClick={doHealth}>Health</button>
        </div>
      </div>
      <pre className="bg-gray-100 p-3 rounded max-w-2xl overflow-auto h-80">{log.join('\n')}</pre>
    </div>
  );
}
