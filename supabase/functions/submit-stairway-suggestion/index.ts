const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || 'info@urbanhikersf.com';
const FROM_EMAIL = 'SF Stairway Spotter <feedback@sfstairwayspotter.com>';

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

function validReplyEmail(value: string | null) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!RESEND_API_KEY) return json({ error: 'Server configuration error' }, 500);

  try {
    const body = await request.json();
    const description = String(body.description || '').trim();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const locationSource = body.locationSource === 'gps' ? 'Current location' : 'Map pin';
    const contactEmail = body.contactEmail ? String(body.contactEmail).trim() : null;

    if (!description || description.length > 5000) return json({ error: 'Please describe the stairway.' }, 400);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return json({ error: 'Please choose a location on the map.' }, 400);
    if (latitude < 37.6 || latitude > 37.9 || longitude < -122.6 || longitude > -122.3) {
      return json({ error: 'Please choose a location in San Francisco.' }, 400);
    }
    if (contactEmail && contactEmail.length > 320) return json({ error: 'Invalid email address.' }, 400);

    const text = [
      'New stairway suggestion for review',
      '',
      `Description: ${description}`,
      `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      `Location source: ${locationSource}`,
      `Contact email: ${contactEmail || 'Not provided'}`,
      '',
      'This suggestion has not been added to the live map. Review it, then add approved stairways to the source spreadsheet.',
    ].join('\n');
    const email: Record<string, unknown> = {
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      subject: 'New stairway suggestion for review',
      text,
    };
    if (validReplyEmail(contactEmail)) email.reply_to = contactEmail;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(email),
    });
    if (!response.ok) {
      throw new Error(`Resend rejected suggestion email (${response.status}): ${await response.text()}`);
    }
    return json({ success: true });
  } catch (error) {
    console.error('Stairway suggestion failed', error);
    return json({ error: 'Suggestion submission failed' }, 500);
  }
});
