import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GNEWS_KEY = Deno.env.get('GNEWS_API_KEY') || '72fbb8d06914cfbb6e74d9615e8ca308'

const CATEGORIES = [
  'general', 'business', 'nation', 'world',
  'technology', 'science', 'health', 'sports', 'entertainment',
]

function cleanTitle(raw: string | null): string {
  if (!raw) return ''
  return raw
    .replace(/\s[-–|]\s[^-–|]+$/, '')
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .trim()
}

function cleanDescription(raw: string | null): string {
  if (!raw) return ''
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let totalInserted = 0
  let errors = 0
  const log: string[] = []

  for (const category of CATEGORIES) {
    try {
      const url = `https://gnews.io/api/v4/top-headlines?country=in&lang=en&category=${category}&max=10&apikey=${GNEWS_KEY}`
      const res = await fetch(url)
      const data = await res.json()

      if (data.errors) {
        log.push(`[${category}] API error: ${data.errors}`)
        errors++
        continue
      }

      const articles = data.articles || []
      const rows = await Promise.all(
        articles
          .filter((a: any) => a.title && a.title.length > 5)
          .map(async (a: any) => ({
            title: cleanTitle(a.title),
            description: cleanDescription(a.description),
            source_name: a.source?.name || 'Unknown',
            category,
            published_at: a.publishedAt,
            url: a.url,
            image_url: a.image || null,
            content_hash: await sha256((a.title || '') + (a.url || '')),
          }))
      )

      if (!rows.length) {
        log.push(`[${category}] No valid articles`)
        continue
      }

      const { error } = await supabase
        .from('news_articles')
        .upsert(rows, { onConflict: 'content_hash', ignoreDuplicates: true })

      if (error) {
        log.push(`[${category}] Insert error: ${error.message}`)
        errors++
      } else {
        log.push(`[${category}] ${rows.length} articles`)
        totalInserted += rows.length
      }

      // Delay between requests to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000))

    } catch (err: any) {
      log.push(`[${category}] Failed: ${err.message}`)
      errors++
    }
  }

  return new Response(
    JSON.stringify({ inserted: totalInserted, errors, log }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
