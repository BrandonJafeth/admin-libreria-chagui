import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'admin@libreriafchagui.com'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://admin.libreriafchagui.com'

function welcomeEmailHtml(email: string, password: string, role: string): string {
  const roleLabel = role === 'admin' ? 'Administrador' : 'Empleado'
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bienvenido — Librería Chagui</title>
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
          Bienvenido al panel
        </h1>
        <p style="margin:0 0 24px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">
          ${roleLabel}
        </p>

        <p style="margin:0 0 20px 0;font-size:14px;color:#444;line-height:1.6;">
          Tu cuenta en el sistema administrativo de Librería Chagui fue creada exitosamente.
        </p>

        <!-- Credentials box -->
        <div style="background:#f9f5f0;border:1px solid #e8e0d6;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 16px 0;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888;">
            Credenciales de acceso
          </p>
          <div style="margin-bottom:14px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Correo</div>
            <div style="font-size:13px;color:#2b2b2b;font-weight:600;word-break:break-all;">${email}</div>
          </div>
          <div style="border-top:1px solid #e8e0d6;padding-top:14px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Contraseña</div>
            <div style="font-size:15px;color:#2b2b2b;font-weight:700;font-family:monospace;letter-spacing:2px;">${password}</div>
          </div>
        </div>

        <!-- Warning -->
        <div style="background:#fff8f0;border-left:3px solid #bf3a2b;padding:14px 16px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#bf3a2b;font-weight:600;">
            Cambiá tu contraseña al ingresar por primera vez.
          </p>
        </div>

        <!-- CTA -->
        <a href="${APP_URL}"
          style="display:block;text-align:center;background:#bf3a2b;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:14px 24px;">
          Ingresar al panel
        </a>
      </div>
    </div>

    <p style="text-align:center;font-size:11px;color:#aaa;margin-top:24px;">
      © ${new Date().getFullYear()} Librería Chagui &middot; libreriafchagui.com
    </p>
  </div>
</body>
</html>`
}

async function sendWelcomeEmail(email: string, password: string, role: string): Promise<void> {
  if (!RESEND_API_KEY) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Librería Chagui <${FROM_EMAIL}>`,
      to: [email],
      subject: 'Tu cuenta fue creada — Panel Chagui',
      html: welcomeEmailHtml(email, password, role),
    }),
  })
  if (!res.ok) {
    console.error('Resend error (welcome):', await res.text())
  }
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
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, password, role } = (await req.json()) as {
      email: string
      password: string
      role: 'admin' | 'employee'
    }

    if (!email || !password || !['admin', 'employee'].includes(role)) {
      return new Response(JSON.stringify({ success: false, error: 'Parámetros inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError || !newUser.user) {
      return new Response(
        JSON.stringify({ success: false, error: createError?.message ?? 'Error al crear usuario' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Upsert handles case where a DB trigger already created the row on auth.users insert
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: newUser.user.id,
      email,
      role,
    })
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ success: false, error: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fire-and-forget welcome email (don't block response on email delivery)
    sendWelcomeEmail(email, password, role).catch(console.error)

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
