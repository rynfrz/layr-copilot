import { NextResponse } from 'next/server';
import { requireUser, requireRole, newId } from '@/lib/auth';
import { listPlaybooks, savePlaybook } from '@/lib/db';
export const runtime = 'nodejs';

export async function GET() {
  try { await requireUser(); return NextResponse.json({ playbooks: await listPlaybooks() }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
export async function POST() {
  try {
    await requireRole('admin', 'team_lead');
    const pb = {
      id: newId('pb'), name: 'New Playbook', isDefault: false, status: 'draft', priority: 0,
      match: { broker_partner: [], carrier: [], line_of_business: [], support_category: [], billing_type: [] },
      references: [], steps: []
    };
    await savePlaybook(pb);
    return NextResponse.json({ playbook: pb });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
