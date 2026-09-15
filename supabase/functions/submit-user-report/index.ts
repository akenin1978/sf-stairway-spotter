import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || 'info@urbanhikersf.com';
const FROM_EMAIL = 'SF Stairway Spotter <feedback@sfstairwayspotter.com>';
const CATEGORIES = new Set(['inappropriate-name', 'harassment', 'spam', 'other']);
const CONTEXTS = new Set(['leaderboard', 'friends']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !RESEND_API_KEY) {
    return json({ error: 'Server configuration error' }, 500);
  }

  try {
    const body = await request.json();
    const targetUserId = String(body.targetUserId || '');
    const category = String(body.category || '');
    const context = String(body.context || '');
    const details = body.details ? String(body.details).trim() : null;
    const reportedDisplayName = body.reportedDisplayName
      ? String(body.reportedDisplayName).trim().slice(0, 160)
      : 'Unknown display name';

    if (!UUID.test(targetUserId) || !CATEGORIES.has(category) || !CONTEXTS.has(context)) {
      return json({ error: 'Invalid report' }, 400);
    }
    if (details && details.length > 1000) return json({ error: 'Report details are too long' }, 400);

    const authorization = request.headers.get('Authorization') || '';
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) return json({ error: 'Authentication required' }, 401);

    const { error: reportError } = await client.rpc('report_user', {
      p_target_user_id: targetUserId,
      p_category: category,
      p_details: details,
      p_context: context,
    });
    if (reportError) throw reportError;

    const text = [
      'New user report for review',
      '',
      `Category: ${category}`,
      `Context: ${context}`,
      `Reported display name: ${reportedDisplayName}`,
      `Reported account ID: ${targetUserId}`,
      `Reporter account ID: ${authData.user.id}`,
      `Details: ${details || 'Not provided'}`,
      '',
      'The report is stored in Supabase user_reports with status pending. Review it before taking moderation action.',
    ].join('\n');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        subject: `User report: ${category}`,
        text,
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend rejected user-report email (${response.status}): ${await response.text()}`);
    }
    return json({ success: true });
  } catch (error) {
    console.error('User report submission failed', error);
    return json({ error: 'Report submission failed' }, 500);
  }
});
