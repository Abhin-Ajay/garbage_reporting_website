import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { ensureTables, sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTables();
  const email = session.user.email;

  const { rows: mine } = await sql`
    SELECT id, bin_name, submitted_at, status
    FROM submissions
    WHERE email = ${email}
    ORDER BY submitted_at DESC;
  `;

  // All bins currently pending (by anyone) so the UI can hide them from selection
  const { rows: pendingAll } = await sql`
    SELECT bin_name FROM submissions WHERE status = 'pending';
  `;

  return NextResponse.json({
    mine,
    pendingBinNames: pendingAll.map((r) => r.bin_name),
  });
}
