// The rules engine — a pure function (no DB/HubSpot) so it's fully testable.
// Given a ticket's entity values and the list of playbooks, resolve the one
// playbook that should drive the work, or fall back to the Default.

const DIMS = ['broker_partner', 'carrier', 'line_of_business', 'support_category', 'billing_type'];

/**
 * @param {object} ticket  { broker_partner, carrier, line_of_business, support_category, billing_type }
 *                         each is an entity id (string) or null. Optionally `multiPolicyConflict: true`.
 * @param {array}  playbooks  full playbook objects
 * @returns {{playbook, usedDefault, reason, matchedDims}}
 */
export function resolvePlaybook(ticket, playbooks) {
  const published = (playbooks || []).filter(p => p && p.status === 'published');
  const def = published.find(p => p.isDefault) || null;

  // Multiple associated policies with differing entity values → use the Default.
  if (ticket && ticket.multiPolicyConflict) {
    return { playbook: def, usedDefault: true, reason: 'Multiple policies with differing details — using the Default workflow.', matchedDims: [] };
  }

  const candidates = [];
  for (const p of published) {
    if (p.isDefault) continue;
    const m = p.match || {};
    let ok = true;
    const matchedDims = [];
    for (const dim of DIMS) {
      const allowed = m[dim] || [];
      if (allowed.length === 0) continue;          // "any" for this dimension
      if (!ticket || !allowed.includes(ticket[dim])) { ok = false; break; }
      matchedDims.push(dim);
    }
    if (ok) candidates.push({ p, specificity: matchedDims.length, matchedDims });
  }

  if (candidates.length === 0) {
    return { playbook: def, usedDefault: true, reason: def ? 'No specific playbook matched — using the Default workflow.' : 'No matching playbook and no Default is configured.', matchedDims: [] };
  }

  // Most specific wins; tie → higher priority; tie → most recently updated.
  candidates.sort((a, b) =>
    b.specificity - a.specificity ||
    (b.p.priority || 0) - (a.p.priority || 0) ||
    (b.p.updatedAt || 0) - (a.p.updatedAt || 0)
  );
  const best = candidates[0];
  const why = best.matchedDims.length
    ? 'Matched on ' + best.matchedDims.map(d => d.replace(/_/g, ' ')).join(' + ') + '.'
    : 'Matched (no specific criteria).';
  return { playbook: best.p, usedDefault: false, reason: why, matchedDims: best.matchedDims };
}

/** Filter a playbook's steps to those applicable to a ticket (resolves showWhen). */
export function applicableSteps(playbook, ticket) {
  if (!playbook) return [];
  return (playbook.steps || []).filter(s => {
    if (!s.showWhen) return true;
    return ticket && ticket[s.showWhen.kind] === s.showWhen.valueId;
  });
}

export { DIMS };
