import { NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/auth';
import { getPlaybook, savePlaybook, deletePlaybook, listPlaybooks } from '@/lib/db';
export const runtime = 'nodejs';

export async function GET(req, { params }) {
  try { await requireUser(); const p = await getPlaybook(params.id); if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 }); return NextResponse.json({ playbook: p }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
export async function PUT(req, { params }) {
  try {
    await requireRole('admin', 'team_lead');
    const pb = await req.json();
    pb.id = params.id;
    // Enforce a single default playbook.
    if (pb.isDefault) {
      const all = await listPlaybooks();
      for (const other of all) if (other.id !== pb.id && other.isDefault) { other.isDefault = false; await savePlaybook(other); }
    }
    await savePlaybook(pb);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
export async function DELETE(req, { params }) {
  try { await requireRole('admin', 'team_lead'); await deletePlaybook(params.id); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
