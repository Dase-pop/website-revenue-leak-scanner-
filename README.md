# SiteSignal — Website Revenue Leak Scanner

SiteSignal checks a public homepage for technical signals that can create friction: page title and description, main heading, likely next-step links, contact paths, mobile viewport setup, HTTPS, share preview metadata, inquiry form markup, canonical URL, and up to six internal links. It provides evidence and practical suggestions; it does not estimate lost revenue or claim a score predicts sales.

## Local development

Requirements: Node.js 18 or newer.

```sh
npm install
npm run dev
```

The Vite dev server includes the same-site `/api/scan` endpoint used by the UI. Enter a public homepage URL to run a live scan. The sample report is illustrative and uses the reserved `.example` domain.

## Build and Cloudflare Pages

```sh
npm run build
```

Create a Cloudflare Pages project with this directory as its root, `npm run build` as the build command, and `dist` as the output directory. The `functions/api/scan.js` function provides the scanner endpoint. `wrangler.toml` is included for Wrangler deployments.

The scan endpoint only accepts public HTTP(S) pages, follows a limited number of redirects, caps the homepage response at 1.5 MB, and checks at most six same-origin links. It does not log or persist submitted URLs or fetched page content. Before broad public promotion, add Cloudflare rate limiting or a challenge to `/api/scan` to control automated use.

## Search and launch

The page has a descriptive title, search summary, canonical URL, share metadata, `robots.txt`, and a one-page `sitemap.xml`. Verify the domain in Google Search Console and submit the sitemap; crawling and indexing are not guaranteed. See `marketing/launch-kit.md` for transparent, community-friendly launch drafts and a first-week feedback loop.

## Paid manual review

The optional offer is **SiteSignal Fix Plan — €29 one-time**. Deliver manually by email: review the homepage and up to three key pages, check the mobile contact or booking path, then provide five prioritized fixes with evidence within two business days. This app does not automatically fulfill the service.

The supplied Stripe Payment Link is included as a public checkout URL fallback in `src/App.jsx`. Confirm in Stripe that it charges €29 once, collects the buyer email, and asks for the website URL before promoting the offer. To override the public link at build time, set `VITE_STRIPE_PAYMENT_LINK` in the deployment environment.

## Scope notes

- The scanner reads returned HTML and a small sample of links. It can miss browser-rendered content, client-side forms, blocked pages, and checkout behavior.
- A positive or negative signal is not proof of an actual conversion issue. Verify important customer journeys in a browser.
- The score is a weighted technical summary, not a revenue forecast.
