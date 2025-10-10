import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const IDLE_MINUTES = 30; // configurable
const TIMEOUT_MS = IDLE_MINUTES * 60 * 1000;

export default function IdleTimeout({ children }) {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await supabase.auth.signOut();
        window.location.href = '/login';
      } catch {}
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));
    resetTimer();
    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return children;
}
