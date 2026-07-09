import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { ensureTables, sql } from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await ensureTables();
  const { rows } = await sql`
    SELECT id, email, bin_name, submitted_at, status
    FROM submissions
    ORDER BY submitted_at DESC;
  `;
  return NextResponse.json({ submissions: rows });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }
  await ensureTables();
  await sql`UPDATE submissions SET status = ${status} WHERE id = ${id};`;
  return NextResponse.json({ ok: true });
}
