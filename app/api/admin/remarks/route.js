import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { ensureTables, sql } from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, remark } = await req.json();
  if (!name) return NextResponse.json({ error: 'Bin name required' }, { status: 400 });

  await ensureTables();
  await sql`UPDATE bins SET remark = ${remark} WHERE name = ${name};`;
  return NextResponse.json({ ok: true });
}
