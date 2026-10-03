import React, { useState } from 'react'

const deepDiveLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/fZu8wP9BA2IF6nKbzE4ZG02'

const demo = {
  url: 'https://harborandhearth.example/', host: 'harborandhearth.example', title: 'Harbor & Hearth — Independent interior studio', score: 68, mode: 'demo',
  metrics: { responseMs: 482, bytes: 81422, internalLinks: 14, sampledLinks: 5 }, scannedAt: new Date().toISOString(), links: [
    { url: 'https://harborandhearth.example/services', status: 200, ok: true }, { url: 'https://harborandhearth.example/contact', status: 200, ok: true }, { url: 'https://harborandhearth.example/book', status: 404, ok: false }, { url: 'https://harborandhearth.example/about', status: 200, ok: true }, { url: 'https://harborandhearth.example/journal', status: 200, ok: true },
  ], checks: [
    { id: 'action', title: 'Next step', status: 'fix', weight: 15, evidence: 'No obvious booking, contact, quote, pricing, or purchase link was detected in the returned HTML.', recommendation: 'Add one clear, prominent next step near the main offer.' },
    { id: 'links', title: 'Sampled internal links', status: 'improve', weight: 8, evidence: '1 of 5 sampled links returned an error.', recommendation: 'Recheck important navigation and conversion links manually; servers can treat lightweight checks differently from browsers.' },
    { id: 'contact', title: 'Contact path', status: 'improve', weight: 10, evidence: 'No email, phone, contact, or support link was detected in the homepage HTML.', recommendation: 'Add a working way to ask a question or request a quote.' },
    { id: 'description', title: 'Search summary', status: 'good', weight: 7, evidence: 'Found a meta description (128 characters).', recommendation: 'Make the description explain the outcome and give visitors a reason to click.' },
    { id: 'headline', title: 'Main page headline', status: 'good', weight: 12, evidence: 'Found one H1: “A calmer home, made for living”.', recommendation: 'Keep the headline focused on one customer outcome.' },
    { id: 'mobile', title: 'Mobile viewport', status: 'good', weight: 8, evidence: 'A viewport meta tag was found.', recommendation: 'Check the page on a real phone and keep the primary action visible without excessive scrolling.' },
  ],
}

const statusLabel = { fix: 'Needs attention', improve: 'Worth improving', good: 'Looking good' }
const icons = {
  arrow: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M10 4l6 6-6 6" /></svg>,
  scan: <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4M6.3 8.5h4.4M8.5 6.3v4.4"/></svg>,
  download: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v9m-4-4 4 4 4-4M4 14v3h12v-3"/></svg>,
  check: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>,
}

function reportText(report) {
  return `SITESIGNAL WEBSITE AUDIT\n${report.url}\nScanned: ${new Date(report.scannedAt).toLocaleString()}\nScore: ${report.score}/100 (${report.mode === 'demo' ? 'sample report' : 'homepage signal score'})\n\nThis is a technical homepage snapshot, not a revenue forecast. Findings describe visible HTML and a small sample of links. Verify important journeys in a browser.\n\n${report.checks.map(c => `## ${c.title} — ${statusLabel[c.status]}\nEvidence: ${c.evidence}\nSuggested next step: ${c.recommendation}`).join('\n\n')}\n\nSAMPLED LINKS\n${report.links.map(l => `${l.ok ? 'OK' : 'CHECK'} ${l.status ?? 'unverified'} ${l.url}${l.note ? ` — ${l.note}` : ''}`).join('\n')}`
}

function ScoreRing({ score }) {
  const radius = 47; const circumference = 2 * Math.PI * radius; const offset = circumference * (1 - score / 100)
  return <div className="score-ring"><svg viewBox="0 0 112 112" aria-label={`Signal score ${score} out of 100`}><circle className="ring-base" cx="56" cy="56" r={radius}/><circle className="ring-value" cx="56" cy="56" r={radius} strokeDasharray={circumference} strokeDashoffset={offset}/></svg><div className="ring-label"><strong>{score}</strong><span>/ 100</span></div></div>
}

const infoPages = {
  '/about': {
    eyebrow: 'ABOUT SITESIGNAL', title: <>A clearer view<br/><em>of your website.</em></>,
    intro: 'SiteSignal is a small, practical audit tool for people who want to make their website easier to understand and use.',
    sections: [
      ['What we do', 'The free scan reads the public HTML of one homepage and checks a focused set of signals, including the main heading, contact and action paths, mobile viewport, search description, response, and a small sample of internal links.'],
      ['What the report means', 'Each observation is tied to what the scanner could see in the returned page. Some sites render content in JavaScript or treat automated requests differently, so results are directional and should be checked in a normal browser. A score is not a sales forecast.'],
      ['Human-reviewed fix plan', 'For €29 once, you can request a manual review of your homepage and up to three key pages. It includes a mobile and contact-path review and five prioritized fixes with evidence, delivered by email within two business days after we receive the site address and payment.']
    ]
  },
  '/contact': {
    eyebrow: 'CONTACT', title: <>Questions are<br/><em>welcome.</em></>,
    intro: 'Ask about a scan, the manual fix plan, or a privacy request. Email is the direct way to reach SiteSignal.',
    sections: [['Email', 'Write to jusspound@gmail.com. For a purchased review, include the website address and the email used at checkout so we can find your request. Please do not send passwords or private account access.'], ['Response times', 'We aim to reply within two business days. The paid fix plan is delivered within two business days after payment and the website address are both received.']],
    email: true
  },
  '/privacy': {
    eyebrow: 'PRIVACY POLICY · LAST UPDATED 3 OCTOBER 2026', title: <>Your data,<br/><em>explained plainly.</em></>,
    intro: 'This draft describes the current SiteSignal website and service. The operator identity and postal address below must be completed before this is a complete legal notice.',
    sections: [
      ['Who operates SiteSignal', 'Operator: [LEGAL NAME / BUSINESS NAME], [POSTAL BUSINESS ADDRESS]. Contact: jusspound@gmail.com. Replace the bracketed details with the responsible operator’s real information.'],
      ['Free scans', 'When you submit a public homepage address, the browser sends that address to our scan service hosted on Cloudflare. The service requests the public page and a limited sample of its internal links to create the report. The current app does not require an account and does not save scan reports in an application database. Cloudflare processes network requests and may keep technical logs under its own service terms and retention practices.'],
      ['Paid fix plan', 'Checkout is provided by Stripe. Stripe collects and processes payment and checkout information under its own privacy terms. We receive the information needed to identify the purchase and fulfill the review, such as your email and the website address you provide. We use it to deliver the service, answer support requests, and meet applicable accounting and legal duties. Contact us to ask about access or deletion; legal retention requirements may apply.'],
      ['External services and cookies', 'The site loads fonts from Google Fonts and uses Cloudflare Pages/Functions for hosting and scans. Checkout opens a Stripe Payment Link. These providers may process technical data such as IP address, browser details, and request metadata. The current app does not implement an advertising tracker or analytics cookie. Provider policies apply to their processing.'],
      ['Your choices and questions', 'For privacy questions or requests, email jusspound@gmail.com. You may also have rights under the data-protection law that applies where you live, including rights to access, correct, or request deletion of personal data. You can contact your local data protection authority.'],
      ['Provider information', 'Cloudflare privacy: https://www.cloudflare.com/privacypolicy/. Stripe privacy: https://stripe.com/privacy. Google privacy: https://policies.google.com/privacy.']
    ]
  },
  '/terms': {
    eyebrow: 'TERMS & CONDITIONS · LAST UPDATED 3 OCTOBER 2026', title: <>Clear terms<br/><em>for a useful tool.</em></>,
    intro: 'These terms apply when you use SiteSignal or buy its manual website fix plan. The operator details need to be completed before publication.',
    sections: [
      ['Operator and contact', 'SiteSignal is operated by [LEGAL NAME / BUSINESS NAME], [POSTAL BUSINESS ADDRESS]. Contact: jusspound@gmail.com. Replace the bracketed details with the operator’s real information.'],
      ['Free scanner', 'You may submit a publicly accessible homepage address that you are authorized to request. The scanner provides an automated technical snapshot of returned HTML and a small sample of links. It may miss browser-rendered content, and lightweight requests may differ from normal visitor behavior. You are responsible for checking the findings before acting on them.'],
      ['Paid SiteSignal Fix Plan', 'The fix plan costs €29 as a one-time payment. It covers a manual review of one homepage and up to three key pages, a mobile and contact-path review, and five prioritized fixes with evidence. We send it by email within two business days after payment and receipt of the site address. If information is missing or the site cannot be accessed, we will contact you to resolve that.'],
      ['No promised business result', 'The service offers observations and recommendations. It does not guarantee higher traffic, sales, revenue, search rankings, or a particular business outcome. You decide whether and how to apply suggestions.'],
      ['Payments and consumer rights', 'Payments are processed by Stripe. Any cancellation, withdrawal, refund, or other consumer rights that apply under mandatory law remain in effect. Nothing in these terms removes those rights. If you have a question about an order, contact jusspound@gmail.com.'],
      ['Acceptable use', 'Do not use the scanner to probe private, restricted, or unauthorized systems, or to disrupt a website. Use it only for public pages and at a reasonable rate. We may limit access where necessary to protect the service or others.'],
      ['Updates', 'We may update these terms as the service changes. The date above shows when this page was last revised. Questions can be sent to jusspound@gmail.com.']
    ]
  },
  '/imprint': {
    eyebrow: 'LEGAL NOTICE', title: <>SiteSignal<br/><em>operator details.</em></>,
    intro: 'Complete the marked fields with the real responsible person or business and a postal address before relying on this commercial website’s legal notice.',
    sections: [['Responsible operator', '[LEGAL NAME / BUSINESS NAME]'], ['Postal address', '[STREET, POSTAL CODE, CITY, COUNTRY]'], ['Email', 'jusspound@gmail.com'], ['Responsible for content', '[LEGAL NAME / BUSINESS NAME], [POSTAL BUSINESS ADDRESS]']],
    note: 'Action required: replace every bracketed placeholder with accurate operator details.'
  }
}

function InfoPage({ page }) {
  return <div className="site-shell info-shell"><header className="top-nav"><a className="wordmark" href="/" aria-label="SiteSignal home"><span className="mark"><i/><i/><i/><i/></span><span>site<span>signal</span></span></a><nav><a href="/">Free scan</a><a href="/#deep-dive" className="nav-cta">€29 Fix plan ↗</a></nav></header><main className="info-main"><a className="back-link" href="/">← Back to SiteSignal</a><div className="eyebrow"><span className="eyebrow-line"/> {page.eyebrow}</div><h1>{page.title}</h1><p className="info-intro">{page.intro}</p>{page.note && <p className="info-note">{page.note}</p>}<div className="info-content">{page.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div>{page.email && <a className="info-email" href="mailto:jusspound@gmail.com?subject=SiteSignal%20question">Email jusspound@gmail.com ↗</a>}</main><footer className="footer info-footer"><a className="wordmark" href="/"><span className="mark"><i/><i/><i/><i/></span><span>site<span>signal</span></span></a><div className="footer-links"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/imprint">Imprint</a></div><span className="footer-right">© {new Date().getFullYear()} SITESIGNAL</span></footer></div>
}

export default function App() {
  const [url, setUrl] = useState('')
  const [report, setReport] = useState(demo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function scan(event) {
    event?.preventDefault()
    setError(''); setLoading(true)
    try {
      const response = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The scan could not be completed.')
      setReport(result)
      setTimeout(() => document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40)
    } catch (e) { setError(e.message || 'Could not scan that website. Try a public homepage URL.') }
    finally { setLoading(false) }
  }
  function download() {
    const blob = new Blob([reportText(report)], { type: 'text/markdown;charset=utf-8' }); const href = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = href; a.download = `${report.host.replace(/[^a-z0-9.-]/gi, '-')}-sitesignal-audit.md`; a.click(); URL.revokeObjectURL(href)
  }
  async function copyReport() {
    try { await navigator.clipboard.writeText(reportText(report)); setCopied(true); setTimeout(() => setCopied(false), 1700) } catch { setError('Clipboard access is unavailable in this browser. Use Download report instead.') }
  }
  const attention = report.checks.filter(c => c.status !== 'good').length
  const fixed = report.checks.filter(c => c.status === 'good').length
  const route = window.location.pathname.replace(/\/+$/, '') || '/'
  if (infoPages[route]) return <InfoPage page={infoPages[route]} />

  return <div className="site-shell">
    <header className="top-nav"><a className="wordmark" href="#top" aria-label="SiteSignal home"><span className="mark"><i/><i/><i/><i/></span><span>site<span>signal</span></span></a><nav><a href="#how-it-works">How it works</a><a href="#report">Sample report</a><a href="/about">About</a><a href="/contact">Contact</a><a href="#deep-dive" className="nav-cta">€29 Fix plan ↗</a></nav></header>

    <main id="top">
      <section className="hero-grid"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> WEBSITE REVENUE LEAK SCANNER <span className="eyebrow-index">01 / 03</span></div><h1>Find the friction<br/>between <em>visit</em><br/>and <em>yes.</em></h1><p className="hero-sub">A sharper look at the small things that make a customer hesitate. Scan a public homepage. Get a clear, evidence-backed fix list in seconds.</p><div className="hero-points"><span>{icons.check} No account needed</span><span>{icons.check} No revenue guesses</span><span>{icons.check} Your scan, your report</span></div>
          <form className="scan-form" onSubmit={scan}><label htmlFor="site-url">YOUR WEBSITE</label><div className="input-row"><span className="url-glyph">↗</span><input id="site-url" type="text" inputMode="url" autoComplete="url" placeholder="yourbusiness.com" value={url} onChange={e => setUrl(e.target.value)} maxLength={500} aria-describedby="scan-hint"/><button className="scan-button" disabled={loading || !url.trim()}>{loading ? <><span className="spinner"/> Reading site</> : <>Run free scan {icons.arrow}</>}</button></div><div className="scan-under"><span id="scan-hint">Public homepage only · usually under 10 seconds</span><span className="lock-mark">⌑ SiteSignal</span></div>{error && <div className="error-box" role="alert">{error}</div>}</form>
        </div><div className="hero-art" aria-label="Illustration of a website signal audit"><div className="orbital orbital-one"/><div className="orbital orbital-two"/><div className="hero-spark spark-one">✳</div><div className="hero-spark spark-two">·</div><div className="floating-label label-top"><span className="pulse-dot"/> CLARITY SIGNAL <b>LIVE</b></div><div className="art-card"><div className="art-card-top"><div className="art-brand"><span className="mini-mark">s.</span><span><i/><i/><i/></span></div><span className="art-address">YOUR HOMEPAGE <b>↗</b></span></div><div className="art-rule"/><div className="art-content"><div className="art-copy"><small>THE FIRST IMPRESSION</small><strong>Make the next<br/><em>step obvious.</em></strong><span className="art-skeleton short"/><span className="art-skeleton"/><span className="art-skeleton medium"/><div className="art-action">BOOK A CALL <span>↗</span></div></div><div className="art-score"><div className="art-score-ring"><span>68</span></div><small>CLARITY<br/>SCORE</small></div></div><div className="art-card-bottom"><span>01 — 09 SIGNALS REVIEWED</span><span className="art-bottom-dot"/> <span>JUST NOW</span></div></div><div className="floating-label label-bottom"><span className="mini-check">✓</span> ACTION PATH <b>FOUND</b></div><div className="art-caption">Less guesswork.<br/><i>More next steps.</i></div></div>
      </section>

      <section className="report-section" id="report"><div className="section-top"><div><div className="eyebrow dark"><span className="eyebrow-line"/> THE SIGNAL REPORT <span className="eyebrow-index">02 / 03</span></div><h2>Small friction.<br/><em>Clear next move.</em></h2></div><div className="demo-flag">{report.mode === 'demo' ? <><span className="demo-dot"/> EXAMPLE REPORT</> : <><span className="live-dot"/> LIVE SCAN</>}</div></div>
        <div className="report-toolbar"><div className="report-target"><div className="target-icon">↗</div><div><span>SCANNED HOMEPAGE</span><strong>{report.host}</strong></div></div><div className="report-meta"><span>{new Date(report.scannedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span><i/> <span>{(report.metrics.responseMs / 1000).toFixed(2)}s response</span></div><div className="report-actions"><button onClick={copyReport} className="quiet-button">{copied ? '✓ Copied' : 'Copy report'}</button><button onClick={download} className="download-button">{icons.download} Export report</button></div></div>
        <div className="report-grid"><aside className="score-panel"><div className="score-panel-head"><span>HOMEPAGE SIGNAL</span><span className="info-dot" title="A weighted technical snapshot, not a revenue estimate.">i</span></div><ScoreRing score={report.score}/><div className="score-verdict">{report.score >= 80 ? 'Strong foundations' : report.score >= 60 ? 'Room to sharpen' : 'A few blockers'}</div><p>Technical clarity signals detected in the public homepage response.</p><div className="score-breakdown"><div><span><i className="legend-good"/>Clear signals</span><b>{fixed.toString().padStart(2, '0')}</b></div><div><span><i className="legend-fix"/>Needs a closer look</span><b>{attention.toString().padStart(2, '0')}</b></div><div><span><i className="legend-neutral"/>Links sampled</span><b>{report.metrics.sampledLinks.toString().padStart(2, '0')}</b></div></div><div className="disclaimer"><span>ⓘ</span> This score is a technical snapshot. It does not estimate sales or prove a conversion problem.</div></aside>
          <div className="findings-panel"><div className="findings-head"><div><span className="findings-kicker">PRIORITIZED OBSERVATIONS</span><h3>What the page is telling us</h3></div><span className="finding-count">{report.checks.length} CHECKS</span></div><div className="finding-list">{report.checks.map((item, i) => <article className={`finding ${item.status}`} key={item.id}><div className="finding-index">{String(i + 1).padStart(2, '0')}</div><div className="finding-main"><div className="finding-title-row"><h4>{item.title}</h4><span className={`status-pill ${item.status}`}>{statusLabel[item.status]}</span></div><p className="evidence">{item.evidence}</p><div className="recommendation"><span>↳</span><p>{item.recommendation}</p></div></div><div className="finding-mark">{item.status === 'good' ? '✓' : item.status === 'fix' ? '!' : '·'}</div></article>)}</div><div className="findings-foot"><span className="foot-star">✳</span><p><b>Evidence first.</b> Each note comes from the homepage HTML or the small set of links shown here. JavaScript-rendered content and full checkout flows may need a manual browser check.</p></div></div>
        </div><div className="report-disclaimer">SiteSignal reviews public page signals. Results are directional, may miss content rendered in a browser, and are not a promise of revenue growth. <span>SCANNED WITH CARE, NOT MAGIC.</span></div>
      </section>

      <section className="how-section" id="how-it-works"><div className="how-heading"><div className="eyebrow"><span className="eyebrow-line"/> A CLEANER WAY TO LOOK <span className="eyebrow-index">03 / 03</span></div><h2>A useful audit.<br/><em>Without the theater.</em></h2><p>No mystery score, no invented sales math. Just a public-page check with evidence and suggested fixes.</p></div><div className="how-cards"><article><span className="how-num">01</span><div className="how-icon">⌕</div><h3>Read the public page</h3><p>We fetch the homepage you enter and inspect its response. No account, login, or analytics access.</p><span className="how-tag">ONE HOMEPAGE</span></article><article><span className="how-num">02</span><div className="how-icon">⌁</div><h3>Spot visible friction</h3><p>Check page clarity, contact paths, mobile setup, share previews, and a small sample of internal links.</p><span className="how-tag">EVIDENCE-LED</span></article><article><span className="how-num">03</span><div className="how-icon">↗</div><h3>Take a next step</h3><p>Export the findings as a tidy report. Decide what matters, verify it in a browser, and make the change.</p><span className="how-tag">YOURS TO KEEP</span></article></div></section>

      <section className="deep-dive" id="deep-dive"><div className="deep-copy"><div className="eyebrow"><span className="eyebrow-line"/> WHEN YOU WANT A SECOND SET OF EYES</div><h2>Go from signals<br/>to a <em>clear plan.</em></h2><p>Get a human-reviewed fix plan for your site. Practical observations, prioritized for your actual customer journey.</p><div className="deep-deliverables"><span>{icons.check} Homepage + up to 3 key pages</span><span>{icons.check} Mobile and contact-path review</span><span>{icons.check} Five prioritized fixes with evidence</span><span>{icons.check} Delivered by email within 2 business days</span></div></div><div className="deep-offer"><div className="deep-offer-top"><span>SITESIGNAL FIX PLAN</span><span className="one-time">ONE-TIME</span></div><div className="deep-price">€29 <small>once</small></div><p>Manual website review. No subscription and no promised revenue outcome.</p>{deepDiveLink ? <a href={deepDiveLink} target="_blank" rel="noreferrer">Request my fix plan {icons.arrow}</a> : <button className="not-connected" disabled>Stripe link not connected</button>}<small>{deepDiveLink ? 'Secure payment through Stripe. We’ll use the site address and email from checkout.' : 'After you create the €29 Stripe Payment Link, set VITE_STRIPE_PAYMENT_LINK to activate checkout.'}</small></div></section>

      <section className="final-cta"><div className="cta-star">✳</div><div className="eyebrow"><span className="eyebrow-line"/> THE NEXT GOOD DECISION</div><h2>Every click deserves<br/>a <em>clear next step.</em></h2><button className="cta-button" onClick={() => { document.getElementById('site-url')?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Scan a website <span>↗</span></button><p>Free homepage scan. No revenue promises. Just a sharper view.</p></section>
    </main>

    <footer className="footer"><a className="wordmark" href="#top"><span className="mark"><i/><i/><i/><i/></span><span>site<span>signal</span></span></a><span className="footer-copy">Made for people who make the web work better.</span><div className="footer-links"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/imprint">Imprint</a></div><div className="footer-right"><span>PUBLIC-PAGE AUDIT TOOL</span><span>© {new Date().getFullYear()} SITESIGNAL</span></div></footer>
  </div>
}
