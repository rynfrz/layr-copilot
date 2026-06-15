'use client';
import { useState, useEffect } from 'react';

const KINDS = [
  ['support_category', 'Support Category'],
  ['broker_partner', 'Broker Partner'],
  ['carrier', 'Carrier / Wholesaler'],
  ['line_of_business', 'Line of Business'],
  ['billing_type', 'Billing Type']
];
const TYPE_LABEL = { checklist: 'Checklist', task: 'Task', email: 'Email', status: 'Status', data_check: 'Data check' };

export default function Simulator() {
  const [ents, setEnts] = useState([]);
  const [pick, setPick] = useState({});
  const [conflict, setConflict] = useState(false);
  const [res, setRes] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { fetch('/api/entities').then(r => r.json()).then(d => setEnts(d.entities || [])); }, []);
  const entsOf = k => ents.filter(e => e.kind === k && e.active);

  async function run() {
    setBusy(true);
    const ticket = { ...pick, multiPolicyConflict: conflict };
    const r = await fetch('/api/match', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ticket) });
    setRes(await r.json()); setBusy(false);
  }

  return (
    <div>
      <h1>Simulator</h1>
      <p className="sub">Pick a ticket's attributes and see exactly what Layr Copilot would load — the matched playbook and the live checklist (with conditional steps resolved).</p>

      <div className="card">
        <div className="card-title">Simulated ticket</div>
        {KINDS.map(([kind, label]) => (
          <div className="field" key={kind}>
            <label>{label}</label>
            <select value={pick[kind] || ''} onChange={e => setPick({ ...pick, [kind]: e.target.value || undefined })}>
              <option value="">— none —</option>
              {entsOf(kind).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        ))}
        <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={conflict} onChange={e => setConflict(e.target.checked)} />
          <span className="small muted">Multiple policies with differing details (forces the Default workflow)</span>
        </div>
        <div className="btn-row" style={{ margin: '6px 0 0' }}><button className="btn primary" onClick={run} disabled={busy}>{busy ? <span className="spinner" /> : 'Resolve playbook'}</button></div>
      </div>

      {res && res.playbook && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="card-title" style={{ margin: 0 }}>{res.playbook.name}</div>
            {res.usedDefault ? <span className="badge default">Default</span> : <span className="badge pub">Matched</span>}
          </div>
          <p className="muted small" style={{ margin: '6px 0 12px' }}>{res.reason}</p>
          {(res.playbook.references || []).length > 0 && (
            <div className="refs" style={{ marginBottom: 14 }}>{res.playbook.references.map((r, i) => <a key={i} href={r.url} target="_blank" rel="noopener">📄 {r.label}</a>)}</div>
          )}
          {res.steps.map((s, i) => (
            <div className="step" key={s.id}>
              <div className="top">
                <span className="num">{i + 1}</span>
                <b style={{ flex: 1 }}>{s.title}</b>
                <span className="pill">{TYPE_LABEL[s.type] || s.type}</span>
                {s.assigneeRole !== 'na' && <span className={'badge ' + s.assigneeRole}>{s.assigneeRole === 'owner' ? 'Owner' : 'Contributor'}</span>}
                {s.type === 'status' && s.statusValue && <span className="pill">→ {s.statusValue}</span>}
              </div>
              {s.instructions && <p className="small muted" style={{ margin: '8px 0 0' }}>{s.instructions}</p>}
              {(s.references || []).length > 0 && <div className="refs">{s.references.map((r, j) => <a key={j} href={r.url} target="_blank" rel="noopener">↗ {r.label}</a>)}</div>}
            </div>
          ))}
          <p className="small muted" style={{ marginTop: 10 }}>This is the exact guidance Copilot will present inside HubSpot. In Phase 2–3 these steps drive real Tasks, Ticket Status, and write-backs.</p>
        </div>
      )}
      {res && !res.playbook && <div className="card"><p className="muted">{res.reason || 'No playbook resolved (and no Default configured).'}</p></div>}
    </div>
  );
}
