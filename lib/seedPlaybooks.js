// Seed playbooks. The Cancellation playbook is encoded directly from Layr's
// "Cancellation Process" SOP. Entity IDs reference the seeded entities
// (see SEED in db.js): support_category #1 = "Cancellation",
// billing_type #1 = "Agency Bill", #2 = "Direct Bill".

const emptyMatch = () => ({ broker_partner: [], carrier: [], line_of_business: [], support_category: [], billing_type: [] });

function step(s) {
  return {
    id: s.id, title: s.title, instructions: s.instructions || '',
    type: s.type || 'checklist',                 // checklist | task | email | status | data_check
    assigneeRole: s.assigneeRole || 'na',         // owner | contributor | na
    statusValue: s.statusValue || '',             // for type 'status'
    showWhen: s.showWhen || null,                 // {kind, valueId} → step only applies when ticket matches
    references: s.references || []
  };
}

export function cancellationPlaybook() {
  return {
    id: 'pb_cancellation',
    name: 'Cancellation',
    isDefault: false,
    status: 'published',
    priority: 0,
    match: { ...emptyMatch(), support_category: ['seed_support_category_1'] },
    references: [
      { label: 'Cancellation Process SOP', url: '#' },
      { label: 'Billing email: Billing@layrins.com', url: 'mailto:Billing@layrins.com' }
    ],
    steps: [
      step({ id: 's1', type: 'status', statusValue: 'Insured Requests Cancellation', assigneeRole: 'owner',
        title: 'Ticket received & assigned (round robin)',
        instructions: 'Ticket is assigned to the Service Team via round robin. Confirm ownership — do not reassign the Ticket Owner.' }),
      step({ id: 's2', type: 'checklist', assigneeRole: 'owner',
        title: 'Confirm cancellation reason & attempt retention',
        instructions: 'Confirm why the insured wants to cancel and make retention efforts. Notate the ticket and create a follow-up task if applicable.' }),
      step({ id: 's3', type: 'status', statusValue: 'Working Ticket', assigneeRole: 'owner', title: 'Set status: Working Ticket' }),
      step({ id: 's4', type: 'task', assigneeRole: 'contributor',
        title: 'Send LPR for signature (Support Team)',
        instructions: 'Support Team sends an LPR via Email or Dropbox for the insured to sign. Notate the ticket and create a task dated one week out — continue to reach out until the signed document is returned.' }),
      step({ id: 's5', type: 'status', statusValue: 'Received LPR', assigneeRole: 'owner',
        title: 'Set status: Received LPR',
        instructions: 'Set when the signed LPR is returned by the insured.' }),
      step({ id: 's6', type: 'task', assigneeRole: 'owner',
        title: 'Send/upload LPR to carrier for processing (Service Team)',
        instructions: 'Service Team sends/uploads the signed LPR to the carrier for processing. Notate the ticket and create a task to follow up in one week.' }),
      step({ id: 's7', type: 'task', assigneeRole: 'contributor',
        title: 'Attach signed LPR to account in Layr portal (Support Team)',
        instructions: 'Support Team attaches the signed LPR at the account level in the Layr portal. Notate the ticket and create a task dated one week out.',
        references: [{ label: 'Layr portal — account documents', url: '#' }] }),
      step({ id: 's8', type: 'status', statusValue: 'Processing / Final Confirmation', assigneeRole: 'owner', title: 'Set status: Processing / Final Confirmation' }),
      step({ id: 's9', type: 'data_check', assigneeRole: 'owner',
        title: 'Await cancellation confirmation / endorsement from carrier',
        instructions: 'Wait for the cancellation confirmation or cancellation endorsement from the carrier. May need to wait on final audit if applicable.' }),
      step({ id: 's10', type: 'checklist', assigneeRole: 'contributor',
        title: 'Cancel policy in the Layr portal',
        instructions: 'At the policy level, click the 3 blue dots → "Cancel Policy". Fill in all cancellation details (if the reason is not listed, choose "Other" and specify). Click Save → Upload supporting documents → Click Submit.',
        references: [{ label: 'Layr portal — Cancel Policy walkthrough', url: '#' }] }),
      step({ id: 's11', type: 'email', assigneeRole: 'owner',
        title: 'Agency Bill: notify billing',
        instructions: 'Email Billing@layrins.com with the cancellation endorsement/invoice and the return premium listed (if applicable).',
        showWhen: { kind: 'billing_type', valueId: 'seed_billing_type_1' },
        references: [{ label: 'Billing@layrins.com', url: 'mailto:Billing@layrins.com' }] }),
      step({ id: 's12', type: 'email', assigneeRole: 'owner',
        title: 'Direct Bill: notify insured',
        instructions: 'Send the insured the endorsement — they will receive the return funds from the carrier (if applicable).',
        showWhen: { kind: 'billing_type', valueId: 'seed_billing_type_2' } }),
      step({ id: 's13', type: 'checklist', assigneeRole: 'owner',
        title: 'Notate ticket & close', instructions: 'Add final notes to the ticket and close it.' }),
      step({ id: 's14', type: 'status', statusValue: 'Closed', assigneeRole: 'owner', title: 'Set status: Closed' }),
      step({ id: 's15', type: 'checklist', assigneeRole: 'contributor',
        title: 'Deactivate account (only if no active policies)',
        instructions: 'If the account has no remaining active policies: at the account level, click "More Actions" → "Deactivate" (Active → Inactive). Notate and complete to close the task. AMS will be notified by an automated task.',
        references: [{ label: 'Deactivation demo', url: '#' }] })
    ]
  };
}

export function defaultPlaybook() {
  return {
    id: 'pb_default',
    name: 'Default Service Workflow',
    isDefault: true,
    status: 'published',
    priority: -100,
    match: emptyMatch(),
    references: [
      { label: 'Service Playbooks (index)', url: '#' },
      { label: 'AMP work-commitment standards', url: '#' }
    ],
    steps: [
      step({ id: 'd1', type: 'status', statusValue: 'New / Triage', assigneeRole: 'owner',
        title: 'Triage the request',
        instructions: 'Review the ticket, contact, company, and associated policy. Confirm the Support Category and that the right playbook applies — if a more specific process exists, follow it. Reference the linked playbook material as needed.' }),
      step({ id: 'd2', type: 'checklist', assigneeRole: 'owner',
        title: 'Acknowledge & set expectations',
        instructions: 'Acknowledge the request with the policyholder and set expectations on next steps and timing. Notate the ticket.' }),
      step({ id: 'd3', type: 'status', statusValue: 'Working Ticket', assigneeRole: 'owner', title: 'Set status: Working Ticket' }),
      step({ id: 'd4', type: 'task', assigneeRole: 'owner',
        title: 'Perform the work & document',
        instructions: 'Complete the required work, coordinating contributor tasks as needed. Document every action on the ticket and commit the work in AMP.' }),
      step({ id: 'd5', type: 'data_check', assigneeRole: 'owner',
        title: 'Confirm completion with carrier/insured',
        instructions: 'Confirm the request is fully resolved with the carrier and/or insured before closing.' }),
      step({ id: 'd6', type: 'checklist', assigneeRole: 'owner',
        title: 'Notate ticket & close', instructions: 'Add final notes and close the ticket.' }),
      step({ id: 'd7', type: 'status', statusValue: 'Closed', assigneeRole: 'owner', title: 'Set status: Closed' })
    ]
  };
}
