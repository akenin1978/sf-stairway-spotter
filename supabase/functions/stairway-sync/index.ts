// Supabase Edge Function: stairway-sync

const SYNC_SECRET = Deno.env.get('SYNC_SHARED_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SECRET_KEYS_RAW = Deno.env.get('SUPABASE_SECRET_KEYS');
const MINIMUM_SOURCE_ROWS = 1000;
const MAX_DEACTIVATIONS = 25;
const PAGE_SIZE = 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function readSecretKey() {
  if (!SUPABASE_URL || !SECRET_KEYS_RAW) {
    throw new Error('Function is missing its own configuration');
  }

  const secretKeys = JSON.parse(SECRET_KEYS_RAW);
  const secretKey = Object.values(secretKeys)[0];
  if (!secretKey || typeof secretKey !== 'string') {
    throw new Error('No secret key found for this project');
  }
  return secretKey;
}

function databaseHeaders(secretKey: string, prefer?: string) {
  return {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function upsertRows(batch: Record<string, unknown>[], secretKey: string) {
  const activeBatch = batch.map((row) => ({ ...row, active: true }));
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/stairways?on_conflict=id`,
    {
      method: 'POST',
      headers: databaseHeaders(
        secretKey,
        'resolution=merge-duplicates,return=minimal'
      ),
      body: JSON.stringify(activeBatch),
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase returned ${response.status}: ${await response.text()}`);
  }

  return json({ success: true, count: activeBatch.length });
}

async function fetchActiveStairways(secretKey: string) {
  const rows: Array<{ id: string; description: string | null }> = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/stairways`);
    url.searchParams.set('select', 'id,description');
    url.searchParams.set('active', 'eq.true');
    url.searchParams.set('order', 'id.asc');
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url, {
      headers: databaseHeaders(secretKey),
    });
    if (!response.ok) {
      throw new Error(`Could not read stairways: ${response.status} ${await response.text()}`);
    }

    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

async function reconcile(
  activeIds: unknown,
  dryRun: boolean,
  secretKey: string
) {
  if (!Array.isArray(activeIds)) {
    return json({ error: 'activeIds must be an array' }, 400);
  }

  const normalizedIds = [
    ...new Set(activeIds.map((id) => String(id).trim()).filter(Boolean)),
  ];
  if (normalizedIds.length < MINIMUM_SOURCE_ROWS) {
    return json(
      {
        error: `Safety stop: source supplied only ${normalizedIds.length} IDs`,
        minimum: MINIMUM_SOURCE_ROWS,
      },
      409
    );
  }

  const sourceIds = new Set(normalizedIds);
  const currentRows = await fetchActiveStairways(secretKey);
  const missing = currentRows.filter((row) => !sourceIds.has(row.id));

  if (missing.length > MAX_DEACTIVATIONS) {
    return json(
      {
        error: `Safety stop: refusing to deactivate ${missing.length} stairways`,
        maximum: MAX_DEACTIVATIONS,
        missing,
      },
      409
    );
  }

  if (dryRun || missing.length === 0) {
    return json({
      success: true,
      dryRun,
      sourceCount: normalizedIds.length,
      activeDatabaseCount: currentRows.length,
      missing,
    });
  }

  const filter = `in.(${missing.map((row) => row.id).join(',')})`;
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/stairways?id=${encodeURIComponent(filter)}`,
    {
      method: 'PATCH',
      headers: databaseHeaders(secretKey, 'return=minimal'),
      body: JSON.stringify({ active: false }),
    }
  );
  if (!response.ok) {
    throw new Error(`Could not deactivate stairways: ${response.status} ${await response.text()}`);
  }

  return json({
    success: true,
    dryRun: false,
    sourceCount: normalizedIds.length,
    deactivated: missing,
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const providedSecret = req.headers.get('x-sync-secret');
  if (!SYNC_SECRET || providedSecret !== SYNC_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch (_error) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    const secretKey = readSecretKey();

    if (Array.isArray(body)) {
      if (body.length === 0) {
        return json({ error: 'Expected a non-empty array of rows' }, 400);
      }
      return await upsertRows(body, secretKey);
    }

    if (body?.action === 'reconcile') {
      return await reconcile(body.activeIds, body.dryRun === true, secretKey);
    }

    return json({ error: 'Expected a row batch or reconcile request' }, 400);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : String(error) },
      500
    );
  }
});
