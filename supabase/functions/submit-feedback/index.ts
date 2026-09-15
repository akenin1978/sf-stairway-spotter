import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || 'info@urbanhikersf.com';
const FROM_EMAIL = 'SF Stairway Spotter <feedback@sfstairwayspotter.com>';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/heic', 'heic'],
  ['image/heif', 'heif'],
]);

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

function decodeBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function validReplyEmail(value: string | null) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

async function sendFeedbackEmail({
  id,
  message,
  contactEmail,
  stairwayDescription,
  attachment,
}: {
  id: string;
  message: string;
  contactEmail: string | null;
  stairwayDescription: string | null;
  attachment: { encoded: string; contentType: string; extension: string; name: string } | null;
}) {
  if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');

  const isStairwayReport = Boolean(stairwayDescription);
  const subject = isStairwayReport
    ? `Stairway issue: ${stairwayDescription}`.slice(0, 180)
    : 'New SF Stairway Spotter feedback';
  const text = [
    isStairwayReport ? 'Report an issue with this stairway' : 'General feedback',
    stairwayDescription ? `Stairway: ${stairwayDescription}` : null,
    `Contact email: ${contactEmail || 'Not provided'}`,
    `Feedback ID: ${id}`,
    '',
    message,
  ].filter((line) => line !== null).join('\n');

  const email: Record<string, unknown> = {
    from: FROM_EMAIL,
    to: [NOTIFY_EMAIL],
    subject,
    text,
  };
  if (validReplyEmail(contactEmail)) email.reply_to = contactEmail;
  if (attachment) {
    email.attachments = [{
      filename: attachment.name || `feedback-photo.${attachment.extension}`,
      content: attachment.encoded,
      content_type: attachment.contentType,
    }];
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `feedback-${id}`,
    },
    body: JSON.stringify(email),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend rejected feedback email (${response.status}): ${detail}`);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: 'Server configuration error' }, 500);

  try {
    const body = await request.json();
    const message = String(body.message || '').trim();
    const contactEmail = body.contactEmail ? String(body.contactEmail).trim() : null;
    if (!message || message.length > 5000) return json({ error: 'Invalid message' }, 400);
    if (contactEmail && contactEmail.length > 320) return json({ error: 'Invalid email' }, 400);

    // Validate attachments before creating a feedback record.
    let attachment: { bytes: Uint8Array; encoded: string; contentType: string; extension: string; name: string } | null = null;
    if (body.photo) {
      const contentType = String(body.photo.contentType || '').toLowerCase();
      const extension = ALLOWED_TYPES.get(contentType);
      if (!extension) return json({ error: 'Unsupported photo type' }, 400);
      const encoded = String(body.photo.data || '');
      if (encoded.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4) return json({ error: 'Photo must be 5 MB or smaller' }, 400);
      let bytes: Uint8Array;
      try { bytes = decodeBase64(encoded); }
      catch { return json({ error: 'Invalid photo data' }, 400); }
      if (!bytes.length || bytes.length > MAX_PHOTO_BYTES) return json({ error: 'Photo must be 5 MB or smaller' }, 400);
      const suppliedName = String(body.photo.name || '').trim();
      const safeName = suppliedName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
      attachment = {
        bytes,
        encoded,
        contentType,
        extension,
        name: safeName || `feedback-photo.${extension}`,
      };
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: feedback, error: insertError } = await admin.from('feedback').insert({
      stairway_id: body.stairwayId || null,
      stairway_description: body.stairwayDescription
        ? String(body.stairwayDescription).slice(0, 1000)
        : null,
      message,
      contact_email: contactEmail,
      photo_path: null,
    }).select('id').single();
    if (insertError) throw insertError;

    if (attachment) {
      const { bytes, contentType, extension } = attachment;
      const photoPath = `${feedback.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await admin.storage
        .from('feedback-photos')
        .upload(photoPath, bytes, { contentType, upsert: false });
      if (uploadError) {
        await admin.from('feedback').delete().eq('id', feedback.id);
        throw uploadError;
      }
      const { error: updateError } = await admin
        .from('feedback')
        .update({ photo_path: photoPath })
        .eq('id', feedback.id);
      if (updateError) {
        await admin.storage.from('feedback-photos').remove([photoPath]);
        await admin.from('feedback').delete().eq('id', feedback.id);
        throw updateError;
      }
    }

    await sendFeedbackEmail({
      id: feedback.id,
      message,
      contactEmail,
      stairwayDescription: body.stairwayDescription
        ? String(body.stairwayDescription).slice(0, 1000)
        : null,
      attachment,
    });
    return json({ success: true });
  } catch (error) {
    console.error('Feedback submission failed', error);
    return json({ error: 'Feedback submission failed' }, 500);
  }
});
