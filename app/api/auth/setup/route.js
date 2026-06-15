import { NextResponse } from 'next/server';
import { sql, userCount, initDb } from '@/lib/db';
import { hashPassword, createSession, newId } from '@/lib/auth';
export const runtime = 'nodejs';

export async function GET() {
  try { return NextResponse.json({ needsSetup: (await userCount()) === 0 }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(req) {
  try {
    if ((await userCount()) > 0) return NextResponse.json({ error: 'Setup already completed' }, { status: 403 });
    const { fullName, email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    await initDb();
    const id = newId();
    await sql`INSERT INTO users (id, full_name, email, password, role, created_at)
              VALUES (${id}, ${fullName || ''}, ${email.toLowerCase()}, ${await hashPassword(password)}, 'admin', ${Date.now()})`;
    await createSession(id);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
