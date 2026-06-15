'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Form() {
  const router = useRouter(); const params = useSearchParams();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { fetch('/api/auth/setup').then(r => r.json()).then(d => { if (d.needsSetup) router.replace('/setup'); }); }, [router]);

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
      const d = await res.json().catch(() => ({ error: 'Server error' }));
      if (!res.ok) { setErr(d.error || 'Login failed'); return; }
      router.replace(params.get('next') || '/dashboard');
    } catch { setErr('Network error'); } finally { setBusy(false); }
  }
  return (
    <form className="auth-card" onSubmit={submit}>
      <h1>Layr Copilot</h1><p className="sub">Admin sign in</p>
      {err && <div className="err">{err}</div>}
      <div className="field"><label>Email</label><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required /></div>
      <div className="field"><label>Password</label><input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required /></div>
      <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>{busy ? <span className="spinner" /> : 'Sign in'}</button>
    </form>
  );
}
export default function Login() { return <div className="auth-wrap"><Suspense fallback={<span className="spinner" />}><Form /></Suspense></div>; }
