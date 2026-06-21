import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'admin@libreriafchagui.com'

function passwordChangedEmailHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Contraseña actualizada — Librería Chagui</title>
</head>
<body style="margin:0;padding:40px 20px;background:#f5f0eb;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">

    <!-- Brand -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:26px;font-weight:800;letter-spacing:5px;text-transform:uppercase;color:#2b2b2b;">
        CHA<span style="color:#bf3a2b;">GUI</span>
      </div>
      <div style="margin-top:8px;font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#888;">
        &#9472;&#9472; Librería &amp; Bazar &#9472;&#9472;
      </div>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border:1px solid #e8e0d6;">
      <div style="height:3px;background:#bf3a2b;"></div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 6px 0;font-size:18px;font-weight:700;color:#2b2b2b;">
          Contraseña actualizada
        </h1>
        <p style="margin:0 0 24px 0;font-size:12px;color:#888;">${email}</p>

        <p style="margin:0 0 20px 0;font-size:14px;color:#444;line-height:1.6;">
          Tu contraseña del panel administrativo fue cambiada exitosamente.
        </p>

        <!-- Alert -->
        <div style="background:#fff8f0;border-left:3px solid #bf3a2b;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#bf3a2b;font-weight:600;">
            Si no realizaste este cambio, contactá a un administrador de inmediato.
          </p>
        </div>
      </div>
    </div>

    <p style="text-align:center;font-size:11px;color:#aaa;margin-top:24px;">
      © ${new Date().getFullYear()} Librería Chagui &middot; libreriafchagui.com
    </p>
  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user?.email) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Librería Chagui <${FROM_EMAIL}>`,
          to: [user.email],
          subject: 'Contraseña actualizada — Panel Chagui',
          html: passwordChangedEmailHtml(user.email),
        }),
      })
      if (!res.ok) {
        console.error('Resend error (password-changed):', await res.text())
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
