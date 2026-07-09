import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { ensureTables, sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bins } = await req.json();
  if (!Array.isArray(bins) || bins.length === 0) {
    return NextResponse.json({ error: 'No bins selected' }, { status: 400 });
  }

  await ensureTables();
  const email = session.user.email;

  const alreadyPending = [];
  const inserted = [];

  for (const binName of bins) {
    const { rows } = await sql`
      SELECT id FROM submissions WHERE bin_name = ${binName} AND status = 'pending';
    `;
    if (rows.length > 0) {
      alreadyPending.push(binName);
      continue;
    }
    const result = await sql`
      INSERT INTO submissions (email, bin_name, status)
      VALUES (${email}, ${binName}, 'pending')
      RETURNING id, email, bin_name, submitted_at, status;
    `;
    inserted.push(result.rows[0]);
  }

  return NextResponse.json({ inserted, alreadyPending });
}
