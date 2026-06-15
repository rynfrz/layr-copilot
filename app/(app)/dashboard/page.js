'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [pbs, setPbs] = useState(null); const [ents, setEnts] = useState(null);
  useEffect(() => {
    fetch('/api/playbooks').then(r => r.json()).then(d => setPbs(d.playbooks || []));
    fetch('/api/entities').then(r => r.json()).then(d => setEnts(d.entities || []));
  }, []);
  const count = k => (ents || []).filter(e => e.kind === k).length;
  return (
    <div>
      <h1>Dashboard</h1>
      <p className="sub">Define the rules and workflows that Layr Copilot enforces inside HubSpot.</p>
      <div className="card">
        <div className="card-title">Playbooks</div>
        {!pbs ? <span className="spinner" /> : (
          <div>
            <p className="muted small" style={{ marginBottom: 10 }}>{pbs.length} playbook{pbs.length === 1 ? '' : 's'} · {pbs.filter(p => p.status === 'published').length} published · {pbs.filter(p => p.isDefault).length} default</p>
            <Link href="/playbooks" className="btn primary sm">Manage playbooks →</Link>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-title">Entities</div>
        {!ents ? <span className="spinner" /> : (
          <div className="chips">
            <span className="pill">Broker Partners: {count('broker_partner')}</span>
            <span className="pill">Carriers/Wholesalers: {count('carrier')}</span>
            <span className="pill">Lines of Business: {count('line_of_business')}</span>
            <span className="pill">Support Categories: {count('support_category')}</span>
            <span className="pill">Billing Types: {count('billing_type')}</span>
          </div>
        )}
        <div style={{ marginTop: 12 }}><Link href="/entities" className="btn sm">Manage entities →</Link></div>
      </div>
      <div className="card">
        <div className="card-title">Test the engine</div>
        <p className="muted small" style={{ marginBottom: 10 }}>Simulate a ticket's entity combination and see exactly which playbook Copilot would load and the checklist it would present.</p>
        <Link href="/simulator" className="btn sm">Open Simulator →</Link>
      </div>
    </div>
  );
}
