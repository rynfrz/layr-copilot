'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Playbooks() {
  const [pbs, setPbs] = useState(null); const [creating, setCreating] = useState(false);
  const router = useRouter();
  const load = () => fetch('/api/playbooks').then(r => r.json()).then(d => setPbs(d.playbooks || []));
  useEffect(() => { load(); }, []);
  async function create() {
    setCreating(true);
    const res = await fetch('/api/playbooks', { method: 'POST' });
    const d = await res.json();
    if (d.playbook) router.push('/playbooks/' + d.playbook.id); else setCreating(false);
  }
  return (
    <div>
      <h1>Playbooks</h1>
      <p className="sub">Each playbook is a Ticket Container: match criteria + an ordered, enforced set of steps.</p>
      <div className="btn-row" style={{ margin: '0 0 18px' }}>
        <button className="btn primary" onClick={create} disabled={creating}>{creating ? <span className="spinner" /> : '+ New Playbook'}</button>
      </div>
      {!pbs ? <span className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Name</th><th>Matches on</th><th>Steps</th><th>Status</th></tr></thead>
            <tbody>
              {pbs.map(p => {
                const dims = Object.entries(p.match || {}).filter(([, v]) => (v || []).length).map(([k]) => k.replace(/_/g, ' '));
                return (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => router.push('/playbooks/' + p.id)}>
                    <td><b>{p.name}</b> {p.isDefault && <span className="badge default">Default</span>}</td>
                    <td className="muted small">{p.isDefault ? 'Fallback (any)' : (dims.length ? dims.join(', ') : 'any')}</td>
                    <td>{(p.steps || []).length}</td>
                    <td><span className={'badge ' + (p.status === 'published' ? 'pub' : 'draft')}>{p.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
