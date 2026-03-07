import { drizzle } from 'drizzle-orm/sqlite-proxy';

// A dynamic DB getter that uses D1 HTTP API.
// IMPORTANT: drizzle-orm/sqlite-proxy requires rows returned as ARRAYS of values,
// not as objects. The column ORDER from the SQL result is used by Drizzle for mapping.
export function getDb(_env?: any) {
  return drizzle(async (sql, params, method) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
    const token = process.env.CLOUDFLARE_D1_TOKEN;

    if (!accountId || !databaseId || !token) {
       console.error('[DB] Missing Cloudflare D1 credentials in Environment Variables.');
       return { rows: [] };
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql, params }),
          cache: 'no-store'
        }
      );
      
      const data = await response.json();
      if (!data.success) {
         console.error('[DB Query Error]', data.errors);
         throw new Error(data.errors[0]?.message || 'DB Query Failed');
      }

      const dbResult = data.result?.[0] || data.result || data;

      // Extract results safely based on Cloudflare's slightly varying API response structures
      const rawRows = dbResult?.results || dbResult?.rows || (Array.isArray(dbResult) ? dbResult : []);

      // drizzle-orm/sqlite-proxy REQUIRES rows as arrays of values, not objects.
      // Drizzle uses the SELECT column order to map them back to camelCase properties.
      const rows = Array.isArray(rawRows)
        ? rawRows.map((row: Record<string, any>) => Object.values(row))
        : rawRows;

      return { rows };
    } catch (e: any) {
      console.error('Error connecting to D1 HTTP API', e);
      return { rows: [] };
    }
  });
}
