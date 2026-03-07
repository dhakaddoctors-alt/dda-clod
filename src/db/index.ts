import { drizzle } from 'drizzle-orm/sqlite-proxy';

// A dynamic DB getter that uses D1 HTTP API. This works purely via fetch 
// without needing Miniflare bindings, making it fully compatible with Vercel and local dev!
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
      const rows = dbResult?.results || dbResult?.rows || (Array.isArray(dbResult) ? dbResult : []);

      if (method === 'run') {
        return { rows };
      } else if (method === 'all' || method === 'values' || method === 'get') {
        return { rows };
      }
      return { rows };
    } catch (e: any) {
      console.error('Error connecting to D1 HTTP API', e);
      return { rows: [] };
    }
  });
}
