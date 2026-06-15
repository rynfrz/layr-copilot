'use client';
import { useState, useEffect } from 'react';

const KINDS = [
  ['broker_partner', 'Broker Partners'],
  ['carrier', 'Carriers / Wholesalers'],
  ['line_of_business', 'Lines of Business'],
  ['support_category', 'Support Categories'],
  ['billing_type', 'Billing Types']
];

export default function Entities() {
  const [ents, setEnts] = useState(null);
  const [msg, setMsg] = useState(null);
  const [adding, setAdding] = useState({});
  const toast = (t, type = 'success') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 3000); };
  const load = () => fetch('/api/entities').then(r => r.json()).then(d => setEnts(d.entities || []));
  useEffect(() => { load(); }, []);

  async function add(kind) {
    const name = (adding[kind] || '').trim(); if (!name) return;
    const res = await fetch('/api/entities', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, name }) });
    if (!res.ok) return toast((await res.json()).error, 'error');
    setAdding({ ...adding, [kind]: '' }); load();
  }
  async function rename(e) {
    const name = prompt('Rename:', e.name); if (name == null || name.trim() === e.name) return;
    const res = await fetch('/api/entities/' + e.id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
    if (!res.ok) return toast((await res.json()).error, 'error'); load();
  }
  async function toggle(e) {
    await fetch('/api/entities/' + e.id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active: !e.active }) }); load();
  }
  async function remove(e) {
    if (!confirm(`Remove "${e.name}"? Playbooks referencing it will simply stop matching on it.`)) return;
    await fetch('/api/entities/' + e.id, { method: 'DELETE' }); load();
  }

  return (
    <div>
      <h1>Entities</h1>
      <p className="sub">The building blocks of your rules. Add, rename, or deactivate values in each list.</p>
      {!ents ? <span className="spinner" /> : KINDS.map(([kind, label]) => {
        const items = ents.filter(e => e.kind === kind);
        return (
          <div className="card" key={kind}>
            <div className="card-title">{label} <span className="muted small">· {items.length}</span></div>
            <table><tbody>
              {items.map(e => (
                <tr key={e.id}>
                  <td style={{ width: '60%' }}>{e.name}{!e.active && <span className="pill" style={{ marginLeft: 8 }}>inactive</span>}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn ghost sm" onClick={() => rename(e)}>Rename</button>{' '}
                    <button className="btn ghost sm" onClick={() => toggle(e)}>{e.active ? 'Deactivate' : 'Activate'}</button>{' '}
                    <button className="btn ghost sm danger" onClick={() => remove(e)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
            <div className="btn-row" style={{ marginTop: 10 }}>
              <input placeholder={`Add a ${label.replace(/s$/, '').toLowerCase()}…`} value={adding[kind] || ''} onChange={ev => setAdding({ ...adding, [kind]: ev.target.value })} onKeyDown={ev => ev.key === 'Enter' && add(kind)} style={{ maxWidth: 320 }} />
              <button className="btn sm" onClick={() => add(kind)}>+ Add</button>
            </div>
          </div>
        );
      })}
      {msg && <div className={'toast ' + msg.type}>{msg.t}</div>}
    </div>
  );
}
