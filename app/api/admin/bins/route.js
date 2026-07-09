import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { ensureTables, sql } from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTables();
  const { rows } = await sql`SELECT name, remark FROM bins ORDER BY name;`;
  return NextResponse.json({ bins: rows });
}

// Admin: add a new bin
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, remark } = await req.json();
  if (!name) return NextResponse.json({ error: 'Bin name required' }, { status: 400 });

  await ensureTables();
  await sql`
    INSERT INTO bins (name, remark)
    VALUES (${name}, ${remark || 'this is the first basket'})
    ON CONFLICT (name) DO NOTHING;
  `;
  const { rows } = await sql`SELECT name, remark FROM bins ORDER BY name;`;
  return NextResponse.json({ bins: rows });
}
