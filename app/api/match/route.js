// Resolve a (simulated) ticket to its playbook + applicable checklist.
// In Phase 2 this same logic is what Layr Copilot's HubSpot serverless function calls.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { listPlaybooks, listEntities } from '@/lib/db';
import { resolvePlaybook, applicableSteps } from '@/lib/match';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    await requireUser();
    const ticket = await req.json();        // { broker_partner, carrier, line_of_business, support_category, billing_type, multiPolicyConflict }
    const playbooks = await listPlaybooks();
    const res = resolvePlaybook(ticket, playbooks);
    const steps = applicableSteps(res.playbook, ticket);
    // attach entity names for display
    const ents = await listEntities();
    const nameOf = id => ents.find(e => e.id === id)?.name || null;
    return NextResponse.json({
      usedDefault: res.usedDefault,
      reason: res.reason,
      playbook: res.playbook ? { id: res.playbook.id, name: res.playbook.name, isDefault: res.playbook.isDefault, references: res.playbook.references || [] } : null,
      steps,
      ticketNames: {
        broker_partner: nameOf(ticket.broker_partner), carrier: nameOf(ticket.carrier),
        line_of_business: nameOf(ticket.line_of_business), support_category: nameOf(ticket.support_category), billing_type: nameOf(ticket.billing_type)
      }
    });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: e.status || 500 }); }
}
