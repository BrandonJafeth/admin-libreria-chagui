import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mirrors src/lib/cloudinary.ts extractPublicId
function extractPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
  return match?.[1] ?? ''
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

    // Verify caller JWT
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { public_ids } = (await req.json()) as { public_ids: string[] }
    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role to validate public_ids without being subject to RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify all requested public_ids exist in product_images (whitelist check)
    const { data: allImages } = await supabaseAdmin
      .from('product_images')
      .select('url')

    const knownPublicIds = new Set(
      (allImages ?? []).map((img: { url: string }) => extractPublicId(img.url)).filter(Boolean),
    )

    const unknownIds = public_ids.filter((id) => !knownPublicIds.has(id))
    if (unknownIds.length > 0) {
      return new Response(
        JSON.stringify({ error: 'public_ids no encontrados en product_images', ids: unknownIds }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
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
