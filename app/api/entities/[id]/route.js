import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { updateEntity, deleteEntity } from '@/lib/db';
export const runtime = 'nodejs';

export async function PATCH(req, { params }) {
  try { await requireRole('admin', 'team_lead'); await updateEntity(params.id, await req.json()); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
export async function DELETE(req, { params }) {
  try { await requireRole('admin', 'team_lead'); await deleteEntity(params.id); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
