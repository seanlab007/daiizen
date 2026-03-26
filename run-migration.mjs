import postgres from 'postgres';
import { readFileSync } from 'fs';

const DB_URL = 'postgresql://postgres.fczherphuixpdjuevzsh:Sb%407002005_12345@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const sql = postgres(DB_URL, { max: 1, connect_timeout: 30, ssl: { rejectUnauthorized: false } });

const migration = readFileSync('drizzle/migration_safe.sql', 'utf8');

// Smart split: handle DO $$ blocks
const statements = [];
let current = '';
let dollarCount = 0;

for (const line of migration.split('\n')) {
  current += line + '\n';
  const matches = (line.match(/\$\$/g) || []).length;
  dollarCount += matches;
  if (dollarCount % 2 === 0 && line.trim().endsWith(';')) {
    const stmt = current.trim();
    if (stmt && stmt !== ';') statements.push(stmt);
    current = '';
  }
}
if (current.trim()) statements.push(current.trim());

console.log(`Executing ${statements.length} statements...`);
let success = 0, skipped = 0, errors = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  if (!stmt || stmt === ';') continue;
  try {
    await sql.unsafe(stmt);
    success++;
    if (i % 10 === 0) process.stdout.write(`[${i}/${statements.length}] `);
  } catch (e) {
    if (e.message.includes('already exists')) {
      skipped++;
    } else {
      console.error(`\nError at statement ${i}: ${e.message.substring(0, 120)}`);
      errors++;
    }
  }
}

console.log(`\nDone! Success: ${success}, Skipped (already exists): ${skipped}, Errors: ${errors}`);
await sql.end();
process.exit(errors > 0 ? 1 : 0);
