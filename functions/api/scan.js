import { scanPublicSite } from '../../src/scanner.js'

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } })

export async function onRequestPost({ request }) {
  const length = Number(request.headers.get('content-length') || 0)
  if (length > 2_000) return json({ error: 'Request is too large.' }, 413)
  let body
  try {
    const raw = await request.text()
    if (raw.length > 2_000) return json({ error: 'Request is too large.' }, 413)
    body = JSON.parse(raw)
  } catch { return json({ error: 'Send a JSON body containing a website URL.' }, 400) }
  if (typeof body.url !== 'string' || body.url.length > 500) return json({ error: 'Enter one public website address under 500 characters.' }, 400)
  try { return json(await scanPublicSite(body.url)) }
  catch (error) { return json({ error: error?.message || 'The site could not be scanned.' }, 422) }
}

export async function onRequest({ request }) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } })
  return onRequestPost({ request })
}
