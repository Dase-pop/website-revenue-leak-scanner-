const MAX_BYTES = 1_500_000
const MAX_REDIRECTS = 4

export function normalizePublicUrl(value) {
  let parsed
  try { parsed = new URL(value.includes('://') ? value.trim() : `https://${value.trim()}`) }
  catch { throw new Error('Enter a valid public website address, like example.com.') }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only public HTTP and HTTPS websites can be scanned.')
  if (parsed.username || parsed.password) throw new Error('Remove login details from the URL before scanning.')
  if (isBlockedHost(parsed.hostname)) throw new Error('Local and private network addresses cannot be scanned.')
  parsed.hash = ''
  return parsed
}

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') || host.endsWith('.lan') || host === 'home.arpa') return true
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true
  const octets = host.split('.').map(Number)
  if (octets.length !== 4 || octets.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false
  const [a, b] = octets
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
}

function textOnly(value = '') { return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;|&#39;|&apos;/gi, ' ').replace(/\s+/g, ' ').trim() }
function tag(html, name) { const match = html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}\\s*>`, 'i')); return match ? textOnly(match[1]) : '' }
function meta(html, key) { const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const re = new RegExp(`<meta\\b(?=[^>]*(?:name|property)\\s*=\\s*["']${escaped}["'])[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*>`, 'i'); const reverse = new RegExp(`<meta\\b(?=[^>]*content\\s*=\\s*["'][^"']*["'])(?=[^>]*(?:name|property)\\s*=\\s*["']${escaped}["'])[^>]*>`, 'i'); const direct = html.match(re); if (direct) return direct[1].trim(); const m = html.match(reverse); return m ? (m[0].match(/content\s*=\s*["']([^"']*)["']/i)?.[1] || '').trim() : '' }
function anchors(html, base) { return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)].slice(0, 180).map(m => { const href = m[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] || ''; let url = ''; try { const parsed = new URL(href, base); parsed.hash = ''; url = parsed.href } catch {} return { href, url, text: textOnly(m[2]) } }) }
function forms(html) { return [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form\s*>/gi)].map(m => { const body = m[1]; const fields = [...body.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)]; const unlabeled = fields.filter(f => !/\b(type\s*=\s*["']hidden|aria-label\s*=|aria-labelledby\s*=|title\s*=)/i.test(f[2]) && !new RegExp(`<label\\b[^>]*for\\s*=\\s*["']${(f[2].match(/\bid\s*=\s*["']([^"']+)/i)?.[1] || '__missing__')}["']`, 'i').test(body)).length; return { fields: fields.length, unlabeled } }) }
function finding(id, title, status, weight, evidence, recommendation) { return { id, title, status, weight, evidence, recommendation } }

async function readLimited(response) {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const chunks = []; let total = 0
  while (true) { const { done, value } = await reader.read(); if (done) break; total += value.byteLength; if (total > MAX_BYTES) { await reader.cancel(); break } chunks.push(value) }
  const bytes = new Uint8Array(Math.min(total, MAX_BYTES)); let offset = 0
  for (const chunk of chunks) { const part = chunk.subarray(0, Math.min(chunk.length, bytes.length - offset)); bytes.set(part, offset); offset += part.length; if (offset >= bytes.length) break }
  return new TextDecoder().decode(bytes)
}

async function safeFetch(url, fetcher, options = {}) {
  let current = new URL(url)
  for (let attempt = 0; attempt <= MAX_REDIRECTS; attempt++) {
    if (isBlockedHost(current.hostname)) throw new Error('The website redirected to a local or private network address, so the scan stopped.')
    const response = await fetcher(current.href, { ...options, redirect: 'manual', signal: AbortSignal.timeout(10_000), headers: { 'user-agent': 'SiteSignal-Audit/1.0 (+public homepage audit)', accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2', ...options.headers } })
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, url: current }
    const location = response.headers.get('location')
    if (!location) return { response, url: current }
    if (attempt === MAX_REDIRECTS) throw new Error('The site redirected too many times to scan safely.')
    current = new URL(location, current)
    if (!['http:', 'https:'].includes(current.protocol)) throw new Error('The website redirected to an unsupported address.')
  }
  throw new Error('Could not reach that website.')
}

export async function scanPublicSite(rawUrl, fetcher = fetch) {
  const input = normalizePublicUrl(String(rawUrl || ''))
  const started = Date.now()
  const { response, url: finalUrl } = await safeFetch(input, fetcher)
  const elapsed = Date.now() - started
  const type = response.headers.get('content-type') || ''
  if (!type.includes('text/html') && !type.includes('application/xhtml+xml')) throw new Error('That address did not return an HTML page. Try the public homepage URL.')
  if (!response.ok) throw new Error(`The site returned HTTP ${response.status}; its page could not be audited.`)
  const html = await readLimited(response)
  if (!html) throw new Error('The site returned an empty page. It may require a browser or sign-in.')
  const title = tag(html, 'title')
  const description = meta(html, 'description')
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)].map(m => textOnly(m[1])).filter(Boolean)
  const viewport = /<meta\b(?=[^>]*name\s*=\s*["']viewport["'])/i.test(html)
  const ogTitle = meta(html, 'og:title')
  const ogImage = meta(html, 'og:image')
  const ogDescription = meta(html, 'og:description')
  const links = anchors(html, finalUrl)
  const internal = links.filter(a => a.url && new URL(a.url).origin === finalUrl.origin)
  const actionWords = /\b(book|booking|contact|call|quote|pricing|price|order|buy|start|schedule|demo|consult|shop|services|enquir|request|reserve|get started)\b/i
  const action = links.find(a => a.url && actionWords.test(`${a.text} ${a.href}`) && !a.url.startsWith('javascript:'))
  const contact = links.find(a => /^(mailto:|tel:)/i.test(a.href)) || links.find(a => a.url && /\b(contact|about|support)\b/i.test(a.url))
  const hasForm = /<form\b/i.test(html)
  const formStats = forms(html)
  const unlabeled = formStats.reduce((n, f) => n + f.unlabeled, 0)
  const canonical = /<link\b(?=[^>]*rel\s*=\s*["']canonical["'])/i.test(html)
  const https = finalUrl.protocol === 'https:'
  const checks = []
  checks.push(title ? finding('title', 'Page title', title.length >= 20 && title.length <= 70 ? 'good' : 'improve', 8, `Found “${title.slice(0, 120)}” (${title.length} characters).`, 'Write a specific title that names the service and the audience or location.') : finding('title', 'Page title', 'fix', 8, 'No HTML title tag was found in the homepage response.', 'Add a clear page title so visitors can recognize the offer in tabs and search results.'))
  checks.push(description ? finding('description', 'Search summary', description.length >= 80 && description.length <= 180 ? 'good' : 'improve', 7, `Found a meta description (${description.length} characters).`, 'Make the description explain the outcome and give visitors a reason to click.') : finding('description', 'Search summary', 'fix', 7, 'No meta description was found in the homepage response.', 'Add a concise search summary that describes the offer in plain language.'))
  checks.push(h1s.length === 1 ? finding('headline', 'Main page headline', 'good', 12, `Found one H1: “${h1s[0].slice(0, 140)}”.`, 'Keep the headline focused on one customer outcome.') : finding('headline', 'Main page headline', 'improve', 12, h1s.length ? `Found ${h1s.length} H1 headings; the first is “${h1s[0].slice(0, 100)}”.` : 'No H1 heading was found in the homepage HTML.', 'Use one visible main heading that quickly says what the business does and for whom.'))
  checks.push(action ? finding('action', 'Next step', 'good', 15, `Found a likely action link: “${action.text || action.href}”.`, 'Make the primary action easy to spot and keep its wording specific.') : finding('action', 'Next step', 'fix', 15, 'No obvious booking, contact, quote, pricing, or purchase link was detected in the returned HTML.', 'Add one clear, prominent next step near the main offer.'))
  checks.push(contact ? finding('contact', 'Contact path', 'good', 10, `Found a contact path: ${contact.href || contact.url}.`, 'Keep this contact option easy to find on mobile.') : finding('contact', 'Contact path', 'improve', 10, 'No email, phone, contact, or support link was detected in the homepage HTML.', 'Add a working way to ask a question or request a quote.'))
  checks.push(viewport ? finding('mobile', 'Mobile viewport', 'good', 8, 'A viewport meta tag was found.', 'Check the page on a real phone and keep the primary action visible without excessive scrolling.') : finding('mobile', 'Mobile viewport', 'fix', 8, 'No viewport meta tag was found in the HTML.', 'Add a responsive viewport tag and review the page at phone width.'))
  checks.push(https ? finding('https', 'Secure connection', 'good', 10, `The final page loaded over HTTPS (${finalUrl.host}).`, 'Keep every form and checkout destination on HTTPS.') : finding('https', 'Secure connection', 'fix', 10, 'The final page loaded over HTTP.', 'Enable HTTPS and redirect visitors to the secure version of the site.'))
  const socialCount = [ogTitle, ogDescription, ogImage].filter(Boolean).length
  checks.push(socialCount === 3 ? finding('sharing', 'Share preview', 'good', 7, 'Open Graph title, description, and image tags were found.', 'Preview the page in the channels where customers share links.') : finding('sharing', 'Share preview', 'improve', 7, `Found ${socialCount} of 3 common Open Graph preview fields.`, 'Add an Open Graph title, description, and image so shared links look intentional.'))
  checks.push(hasForm ? finding('form', 'Inquiry form', unlabeled ? 'improve' : 'good', 10, `Found ${formStats.length} form(s) and ${formStats.reduce((n, f) => n + f.fields, 0)} input field(s); ${unlabeled} may lack a programmatic label.`, 'Make each field label clear, keep the form short, and show a useful confirmation after submission.') : finding('form', 'Inquiry form', 'improve', 10, 'No HTML form was detected; the page may use a JavaScript-rendered form or a different contact path.', 'If inquiries are important, test the full contact or booking flow on mobile.'))
  checks.push(canonical ? finding('canonical', 'Preferred page URL', 'good', 5, 'A canonical link element was found.', 'Ensure the canonical URL matches the preferred public page address.') : finding('canonical', 'Preferred page URL', 'improve', 5, 'No canonical link element was found in the returned HTML.', 'Set a canonical URL if the page is available under multiple addresses.'))
  const linksToCheck = [...new Set(internal.filter(a => a.url && a.url !== finalUrl.href && !/\.(pdf|png|jpe?g|svg|webp|zip|mp4)(?:\?|$)/i.test(a.url)).map(a => a.url))].slice(0, 6)
  const linkChecks = await Promise.all(linksToCheck.map(async link => {
    try { const { response: r, url } = await safeFetch(link, fetcher, { method: 'HEAD' }); return { url: url.href, status: r.status, ok: r.status < 400, note: r.status === 405 ? 'This server does not support the lightweight link check.' : '' } }
    catch (error) { return { url: link, status: null, ok: false, note: error.message } }
  }))
  const broken = linkChecks.filter(l => l.status >= 400 && l.status !== 405)
  if (linksToCheck.length) checks.push(finding('links', 'Sampled internal links', broken.length ? 'improve' : 'good', 8, broken.length ? `${broken.length} of ${linksToCheck.length} sampled links returned an error.` : `${linksToCheck.length} internal links were sampled; none returned an HTTP error.`, 'Recheck important navigation and conversion links manually; servers can treat lightweight checks differently from browsers.'))
  const finalMax = checks.reduce((sum, c) => sum + c.weight, 0)
  const finalScore = Math.round(checks.reduce((sum, c) => sum + c.weight * (c.status === 'good' ? 1 : c.status === 'improve' ? 0.55 : 0), 0) / finalMax * 100)
  const priority = { fix: 0, improve: 1, good: 2 }
  checks.sort((a, b) => priority[a.status] - priority[b.status] || b.weight - a.weight)
  return { url: finalUrl.href, host: finalUrl.host, title: title || finalUrl.host, score: finalScore, checks, links: linkChecks, metrics: { responseMs: elapsed, bytes: new TextEncoder().encode(html).byteLength, internalLinks: internal.length, sampledLinks: linkChecks.length }, scannedAt: new Date().toISOString(), mode: 'live' }
}
