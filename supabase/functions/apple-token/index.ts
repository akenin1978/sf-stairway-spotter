import { createClient } from 'npm:@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'npm:jose@5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function requiredSecret(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptionKey() {
  const raw = base64ToBytes(requiredSecret('APPLE_TOKEN_ENCRYPTION_KEY'));
  if (raw.byteLength !== 32) throw new Error('APPLE_TOKEN_ENCRYPTION_KEY must contain 32 bytes');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptToken(token: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(),
    encoder.encode(token)
  );
  return {
    encryptedToken: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

async function decryptToken(encryptedToken: string, iv: string) {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) },
    await encryptionKey(),
    base64ToBytes(encryptedToken)
  );
  return decoder.decode(decrypted);
}

async function appleClientSecret() {
  const teamId = requiredSecret('APPLE_TEAM_ID');
  const keyId = requiredSecret('APPLE_KEY_ID');
  const clientId = requiredSecret('APPLE_CLIENT_ID');
  const privateKey = requiredSecret('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n');
  const signingKey = await importPKCS8(privateKey, 'ES256');
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(signingKey);
}

async function appleRequest(path: 'token' | 'revoke', values: Record<string, string>) {
  const body = new URLSearchParams({
    client_id: requiredSecret('APPLE_CLIENT_ID'),
    client_secret: await appleClientSecret(),
    ...values,
  });
  const response = await fetch(`https://appleid.apple.com/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Apple ${path} request failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const supabaseUrl = requiredSecret('SUPABASE_URL');
    const userClient = createClient(supabaseUrl, requiredSecret('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const admin = createClient(supabaseUrl, requiredSecret('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });
    const body = await request.json();

    if (body.action === 'store') {
      if (!body.authorizationCode || typeof body.authorizationCode !== 'string') {
        return Response.json({ error: 'Missing authorization code' }, { status: 400, headers: corsHeaders });
      }
      const tokens = await appleRequest('token', {
        grant_type: 'authorization_code',
        code: body.authorizationCode,
      });
      if (!tokens.refresh_token) throw new Error('Apple did not return a refresh token');
      const encrypted = await encryptToken(tokens.refresh_token);
      const { error } = await admin.from('apple_auth_credentials').upsert({
        user_id: user.id,
        encrypted_refresh_token: encrypted.encryptedToken,
        encryption_iv: encrypted.iv,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return Response.json({ stored: true }, { headers: corsHeaders });
    }

    if (body.action === 'revoke') {
      const { data: credential, error } = await admin
        .from('apple_auth_credentials')
        .select('encrypted_refresh_token, encryption_iv')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!credential) return Response.json({ revoked: false, reason: 'credential-unavailable' }, { headers: corsHeaders });

      const refreshToken = await decryptToken(
        credential.encrypted_refresh_token,
        credential.encryption_iv
      );
      await appleRequest('revoke', {
        token: refreshToken,
        token_type_hint: 'refresh_token',
      });
      await admin.from('apple_auth_credentials').delete().eq('user_id', user.id);
      return Response.json({ revoked: true }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Unsupported action' }, { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error('Apple credential operation failed', error);
    return Response.json(
      { error: 'Apple credential operation failed' },
      { status: 500, headers: corsHeaders }
    );
  }
});
