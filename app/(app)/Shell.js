'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const ROLE_LABEL = { admin: 'Admin', team_lead: 'Team Lead', account_manager: 'Account Manager' };

export default function Shell({ user, children }) {
  const path = usePathname(); const router = useRouter();
  const nav = [
    ['/dashboard', '▦ Dashboard'],
    ['/playbooks', '◷ Playbooks'],
    ['/entities', '☰ Entities'],
    ['/simulator', '◎ Simulator']
  ];
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); }
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><div className="mk">L</div><div><b>Layr Copilot</b><div className="t">Workflow orchestration</div></div></div>
        <nav className="nav">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className={(href === '/dashboard' ? path === href : path.startsWith(href)) ? 'active' : ''}>{label}</Link>
          ))}
        </nav>
        <div className="sidefoot">
          <div style={{ marginBottom: 8 }}>{user.full_name || user.email}<br /><span className="small">{ROLE_LABEL[user.role] || user.role}</span></div>
          <button className="btn ghost sm" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="main"><div className="inner">{children}</div></main>
    </div>
  );
}
