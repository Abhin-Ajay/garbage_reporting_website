import { sql } from '@vercel/postgres';

let initialized = false;

export async function ensureTables() {
  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS bins (
      name TEXT PRIMARY KEY,
      remark TEXT NOT NULL DEFAULT 'No remark added yet.'
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      bin_name TEXT NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `;

  // Seed default bins bin1..bin10 if table is empty
  const { rows } = await sql`SELECT COUNT(*)::int AS count FROM bins;`;
  if (rows[0].count === 0) {
    for (let i = 1; i <= 10; i++) {
      await sql`
        INSERT INTO bins (name, remark)
        VALUES (${'bin' + i}, ${'this is the first basket'})
        ON CONFLICT (name) DO NOTHING;
      `;
    }
  }

  initialized = true;
}

export { sql };
