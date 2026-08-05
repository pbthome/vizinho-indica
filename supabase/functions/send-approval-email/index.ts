import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
const appLoginUrl = Deno.env.get('APP_LOGIN_URL') ?? '';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse({ error: 'Supabase environment variables are missing.' }, 500);
  }

  if (!resendApiKey || !resendFromEmail) {
    return jsonResponse({ error: 'Resend secrets are missing.' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return jsonResponse({ error: 'Missing authorization header.' }, 401);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization
      }
    }
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const {
    data: { user },
    error: userError
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized user.' }, 401);
  }

  const { data: adminProfile, error: adminProfileError } = await adminClient
    .from('users')
    .select('role, status')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (adminProfileError) {
    return jsonResponse({ error: adminProfileError.message }, 500);
  }

  if (!adminProfile || adminProfile.role !== 'admin' || adminProfile.status !== 'approved') {
    return jsonResponse({ error: 'Forbidden.' }, 403);
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';

  if (!email) {
    return jsonResponse({ error: 'Recipient email is required.' }, 400);
  }

  const safeName = fullName || 'morador';
  const subject = 'Seu acesso ao Vicini foi aprovado';
  const loginLine = appLoginUrl
    ? `<p style="margin:0 0 16px;">Voce ja pode entrar pelo link: <a href="${escapeHtml(appLoginUrl)}">${escapeHtml(appLoginUrl)}</a></p>`
    : '<p style="margin:0 0 16px;">Voce ja pode abrir o app e entrar com seu email e senha.</p>';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f4;padding:24px;color:#163229;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d9e5df;border-radius:16px;padding:32px;">
        <p style="margin:0 0 16px;">Ola, ${escapeHtml(safeName)}.</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;color:#163229;">Seu acesso foi aprovado</h1>
        <p style="margin:0 0 16px;">Seu cadastro no Vicini foi aprovado pelo administrador do condominio.</p>
        ${loginLine}
        <p style="margin:0;color:#5f756b;">Se voce nao reconhece esta mensagem, pode ignorar este email.</p>
      </div>
    </div>
  `;

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [email],
      subject,
      html
    })
  });

  const responseText = await resendResponse.text();
  const responseJson = tryParseJson(responseText);

  if (!resendResponse.ok) {
    return jsonResponse(
      {
        error:
          (responseJson && typeof responseJson === 'object' && 'message' in responseJson && typeof responseJson.message === 'string' && responseJson.message) ||
          `Resend request failed with status ${resendResponse.status}.`
      },
      resendResponse.status
    );
  }

  return jsonResponse(
    {
      success: true,
      emailId: responseJson && typeof responseJson === 'object' && 'id' in responseJson ? responseJson.id : null
    },
    200
  );
});

function jsonResponse(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
