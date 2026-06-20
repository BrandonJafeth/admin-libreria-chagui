import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Verify caller is an authenticated Supabase user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { error: authError } = await supabase.auth.getUser()
    if (authError) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { public_ids } = (await req.json()) as { public_ids: string[] }
    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')!
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!

    const results = await Promise.all(
      public_ids.map(async (public_id) => {
        const timestamp = Math.floor(Date.now() / 1000)
        const str = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`

        const hashBuffer = await crypto.subtle.digest(
          'SHA-1',
          new TextEncoder().encode(str),
        )
        const signature = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

        const form = new FormData()
        form.append('public_id', public_id)
        form.append('timestamp', String(timestamp))
        form.append('api_key', apiKey)
        form.append('signature', signature)

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          { method: 'POST', body: form },
        )
        return res.json()
      }),
    )

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
