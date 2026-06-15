import { NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/auth';
import { listEntities, addEntity, ENTITY_KINDS } from '@/lib/db';
export const runtime = 'nodejs';

export async function GET() {
  try { await requireUser(); return NextResponse.json({ entities: await listEntities() }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
export async function POST(req) {
  try {
    await requireRole('admin', 'team_lead');
    const { kind, name } = await req.json();
    if (!ENTITY_KINDS.includes(kind)) return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    if (!name || !name.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const id = await addEntity(kind, name.trim());
    return NextResponse.json({ id });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
