import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Enter your email and password' }, { status: 400 });
    await initDb();
    const rows = await sql`SELECT id, password FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
    const user = rows[0];
    const ok = user ? await verifyPassword(password, user.password) : false;
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
