// Postgres via Neon serverless driver. Lazy connection (never at build time).
import { neon } from '@neondatabase/serverless';

let _client = null;
function client() {
  if (!_client) {
    const cs = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    if (!cs) throw new Error('No database connection string. Set DATABASE_URL or POSTGRES_URL.');
    _client = neon(cs);
  }
  return _client;
}
export function sql(strings, ...values) { return client()(strings, ...values); }

let initialized = false;
export async function initDb() {
  if (initialized) return;
  await sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, full_name TEXT NOT NULL DEFAULT '', email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'account_manager', created_at BIGINT NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true, sort INT NOT NULL DEFAULT 0, created_at BIGINT NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS playbooks (
    id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at BIGINT NOT NULL)`;
  initialized = true;
  await maybeSeed();
}

export async function userCount() {
  await initDb();
  const r = await sql`SELECT COUNT(*)::int AS n FROM users`;
  return r[0].n;
}

// ---------- Entities ----------
export const ENTITY_KINDS = ['broker_partner', 'carrier', 'line_of_business', 'support_category', 'billing_type'];
export const KIND_LABELS = {
  broker_partner: 'Broker Partners', carrier: 'Carriers / Wholesalers',
  line_of_business: 'Lines of Business', support_category: 'Support Categories', billing_type: 'Billing Types'
};

export async function listEntities() {
  await initDb();
  return sql`SELECT id, kind, name, active, sort FROM entities ORDER BY kind, sort, name`;
}
export async function addEntity(kind, name) {
  await initDb();
  const id = 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await sql`INSERT INTO entities (id, kind, name, active, sort, created_at) VALUES (${id}, ${kind}, ${name}, true, 0, ${Date.now()})`;
  return id;
}
export async function updateEntity(id, patch) {
  await initDb();
  if (patch.name !== undefined) await sql`UPDATE entities SET name = ${patch.name} WHERE id = ${id}`;
  if (patch.active !== undefined) await sql`UPDATE entities SET active = ${patch.active} WHERE id = ${id}`;
}
export async function deleteEntity(id) { await initDb(); await sql`DELETE FROM entities WHERE id = ${id}`; }

// ---------- Playbooks ----------
export async function listPlaybooks() {
  await initDb();
  const rows = await sql`SELECT data FROM playbooks ORDER BY updated_at DESC`;
  return rows.map(r => r.data);
}
export async function getPlaybook(id) {
  await initDb();
  const rows = await sql`SELECT data FROM playbooks WHERE id = ${id}`;
  return rows[0]?.data || null;
}
export async function savePlaybook(pb) {
  await initDb();
  pb.updatedAt = Date.now();
  await sql`INSERT INTO playbooks (id, data, updated_at) VALUES (${pb.id}, ${JSON.stringify(pb)}::jsonb, ${pb.updatedAt})
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`;
  return pb;
}
export async function deletePlaybook(id) { await initDb(); await sql`DELETE FROM playbooks WHERE id = ${id}`; }

// ---------- Seed (idempotent) ----------
async function maybeSeed() {
  const ent = await sql`SELECT COUNT(*)::int AS n FROM entities`;
  if (ent[0].n === 0) await seedEntities();
  const pb = await sql`SELECT COUNT(*)::int AS n FROM playbooks`;
  if (pb[0].n === 0) await seedPlaybooks();
}

const SEED = {
  broker_partner: ['Sample Broker Partner A', 'Sample Broker Partner B'],
  carrier: ['Sample Carrier (Admitted)', 'Sample Wholesaler (E&S)'],
  line_of_business: ['General Liability', 'Commercial Property', 'Commercial Auto', "Workers' Comp", 'BOP'],
  support_category: ['Cancellation', 'Endorsement', 'Certificate of Insurance', 'Billing Inquiry', 'Renewal', 'New Business'],
  billing_type: ['Agency Bill', 'Direct Bill']
};
async function seedEntities() {
  for (const kind of ENTITY_KINDS) {
    let i = 0;
    for (const name of SEED[kind]) {
      const id = 'seed_' + kind + '_' + (i + 1);
      await sql`INSERT INTO entities (id, kind, name, active, sort, created_at) VALUES (${id}, ${kind}, ${name}, true, ${i}, ${Date.now()}) ON CONFLICT (id) DO NOTHING`;
      i++;
    }
  }
}

async function seedPlaybooks() {
  const { cancellationPlaybook, defaultPlaybook } = await import('./seedPlaybooks.js');
  await savePlaybook(defaultPlaybook());
  await savePlaybook(cancellationPlaybook());
}
