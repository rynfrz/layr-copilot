'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const KIND_LABELS = { broker_partner: 'Broker Partner', carrier: 'Carrier / Wholesaler', line_of_business: 'Line of Business', support_category: 'Support Category', billing_type: 'Billing Type' };
const KINDS = Object.keys(KIND_LABELS);
const STEP_TYPES = [['checklist', 'Checklist'], ['task', 'Task'], ['email', 'Email'], ['status', 'Status change'], ['data_check', 'Data check']];
const ROLES = [['na', '—'], ['owner', 'Ticket Owner'], ['contributor', 'Contributor']];
const sid = () => 's' + Math.random().toString(36).slice(2, 7);

export default function PlaybookEditor() {
  const { id } = useParams(); const router = useRouter();
  const [p, setP] = useState(null); const [ents, setEnts] = useState([]);
  const [msg, setMsg] = useState(null); const [saving, setSaving] = useState(false);
  const toast = (t, type = 'success') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 3000); };

  useEffect(() => {
    fetch('/api/entities').then(r => r.json()).then(d => setEnts(d.entities || []));
    fetch('/api/playbooks/' + id).then(r => r.json()).then(d => setP(d.playbook));
  }, [id]);
  if (!p) return <span className="spinner" />;

  const upd = mut => { const np = structuredClone(p); mut(np); setP(np); };
  const entsOf = kind => ents.filter(e => e.kind === kind);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/playbooks/' + id, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) });
    setSaving(false);
    toast(res.ok ? 'Saved' : 'Save failed', res.ok ? 'success' : 'error');
  }
  async function del() {
    if (!confirm('Delete this playbook?')) return;
    await fetch('/api/playbooks/' + id, { method: 'DELETE' }); router.push('/playbooks');
  }

  const move = (i, dir) => upd(np => { const a = np.steps; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; });
  const showWhenValue = s => s.showWhen ? `${s.showWhen.kind}:${s.showWhen.valueId}` : '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0 }}>Edit Playbook</h1>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn ghost sm danger" onClick={del}>Delete</button>
          <button className="btn primary" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row">
          <div className="field"><label>Name</label><input value={p.name} onChange={e => upd(np => np.name = e.target.value)} /></div>
          <div className="field"><label>Status</label>
            <select value={p.status} onChange={e => upd(np => np.status = e.target.value)}>
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field"><label>Priority (tiebreaker, higher wins)</label><input type="number" value={p.priority || 0} onChange={e => upd(np => np.priority = Number(e.target.value) || 0)} /></div>
          <div className="field"><label>Default fallback playbook</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={!!p.isDefault} onChange={e => upd(np => np.isDefault = e.target.checked)} />
              <span className="small muted">Used when no specific playbook matches, or policies differ. Only one allowed.</span>
            </div>
          </div>
        </div>
      </div>

      {!p.isDefault && (
        <div className="card">
          <div className="card-title">Match criteria <span className="muted small">· a dimension with nothing selected means "any"</span></div>
          {KINDS.map(kind => (
            <div key={kind} style={{ marginBottom: 12 }}>
              <label>{KIND_LABELS[kind]}</label>
              <div className="chips">
                {entsOf(kind).length === 0 && <span className="small muted">No values yet — add them under Entities.</span>}
                {entsOf(kind).map(e => {
                  const on = (p.match[kind] || []).includes(e.id);
                  return <span key={e.id} className={'chip' + (on ? ' on' : '')} onClick={() => upd(np => {
                    const set = new Set(np.match[kind] || []); on ? set.delete(e.id) : set.add(e.id); np.match[kind] = [...set];
                  })}>{e.name}</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title">Reference material (playbook-level links)</div>
        <RefEditor refs={p.references || []} onChange={r => upd(np => np.references = r)} />
      </div>

      <div className="card">
        <div className="card-title">Steps <span className="muted small">· {(p.steps || []).length}</span></div>
        {(p.steps || []).map((s, i) => (
          <div className="step" key={s.id}>
            <div className="top">
              <span className="num">{i + 1}</span>
              <input style={{ flex: 1, minWidth: 200 }} value={s.title} placeholder="Step title" onChange={e => upd(np => np.steps[i].title = e.target.value)} />
              <button className="btn ghost sm" onClick={() => move(i, -1)}>↑</button>
              <button className="btn ghost sm" onClick={() => move(i, 1)}>↓</button>
              <button className="btn ghost sm danger" onClick={() => upd(np => np.steps.splice(i, 1))}>✕</button>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <div className="field"><label>Type</label>
                <select value={s.type} onChange={e => upd(np => np.steps[i].type = e.target.value)}>{STEP_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </div>
              <div className="field"><label>Responsible</label>
                <select value={s.assigneeRole} onChange={e => upd(np => np.steps[i].assigneeRole = e.target.value)}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </div>
            </div>
            {s.type === 'status' && (
              <div className="field"><label>Ticket Status value to set</label><input value={s.statusValue || ''} placeholder="e.g. Working Ticket" onChange={e => upd(np => np.steps[i].statusValue = e.target.value)} /></div>
            )}
            <div className="field"><label>Instructions (shown in Copilot)</label><textarea value={s.instructions || ''} onChange={e => upd(np => np.steps[i].instructions = e.target.value)} /></div>
            <div className="field"><label>Only show this step when</label>
              <select value={showWhenValue(s)} onChange={e => upd(np => {
                const v = e.target.value; if (!v) { np.steps[i].showWhen = null; return; }
                const [kind, valueId] = v.split(':'); np.steps[i].showWhen = { kind, valueId };
              })}>
                <option value="">Always</option>
                {KINDS.flatMap(kind => entsOf(kind).map(e => <option key={e.id} value={`${kind}:${e.id}`}>{KIND_LABELS[kind]} = {e.name}</option>))}
              </select>
            </div>
            <RefEditor refs={s.references || []} onChange={r => upd(np => np.steps[i].references = r)} compact />
          </div>
        ))}
        <button className="btn sm" onClick={() => upd(np => np.steps.push({ id: sid(), title: '', instructions: '', type: 'checklist', assigneeRole: 'na', statusValue: '', showWhen: null, references: [] }))}>+ Add step</button>
      </div>

      {msg && <div className={'toast ' + msg.type}>{msg.t}</div>}
    </div>
  );
}

function RefEditor({ refs, onChange, compact }) {
  const [label, setLabel] = useState(''); const [url, setUrl] = useState('');
  return (
    <div>
      {refs.length > 0 && (
        <div className="refs" style={{ marginBottom: 8 }}>
          {refs.map((r, i) => (
            <span key={i} className="pill">{r.label} <a className="danger" style={{ cursor: 'pointer', color: 'var(--red)' }} onClick={() => onChange(refs.filter((_, j) => j !== i))}>✕</a></span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input placeholder={compact ? 'Step link label' : 'Link label'} value={label} onChange={e => setLabel(e.target.value)} style={{ maxWidth: 220 }} />
        <input placeholder="https:// or mailto:" value={url} onChange={e => setUrl(e.target.value)} style={{ maxWidth: 260 }} />
        <button className="btn sm" onClick={() => { if (!label.trim()) return; onChange([...refs, { label: label.trim(), url: url.trim() || '#' }]); setLabel(''); setUrl(''); }}>+ Add link</button>
      </div>
    </div>
  );
}
