import postgres from 'postgres';

// Correct host: aws-1-ap-northeast-1.pooler.supabase.com (not aws-0)
const passwords = ['Sb@7002005_12345', 'Sb@7002005', 'cr_Sb@7002005'];
const hosts = [
  'aws-1-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
];

for (const host of hosts) {
  for (const pwd of passwords) {
    const encoded = encodeURIComponent(pwd);
    const url = `postgresql://postgres.fczherphuixpdjuevzsh:${encoded}@${host}:6543/postgres`;
    const sql = postgres(url, { max: 1, connect_timeout: 8, ssl: { rejectUnauthorized: false } });
    try {
      const r = await sql`SELECT 1 as ok`;
      console.log(`SUCCESS! host=${host} pwd=${pwd.substring(0,8)}`);
      console.log('WORKING_URL=' + url);
      await sql.end();
      process.exit(0);
    } catch(e) {
      console.log(`FAIL host=${host.substring(0,10)} pwd=${pwd.substring(0,8)}: ${e.message}`);
      try { await sql.end(); } catch {}
    }
  }
}
process.exit(1);
