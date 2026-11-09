# SEO & AI-SEO Audit — Acuity.One landing page

**Target:** `https://one.acuity.institute/` · **Audited:** 9 November 2026 · **Page:** `standalone-experience/index.html`
**Skills applied:** `ai-seo` v2.12.0 and `seo-audit` v2.2.2 (coreyhaines31/marketingskills)

---

## Executive summary

The page has strong on-page foundations: one H1, a clean H2/H3 hierarchy, a unique 48-character title and
150-character description, descriptive alt text on all images, semantic landmarks, 1,820 words of original
copy, and all content in the initial HTML (no JavaScript dependency). It is a good page that was missing its
**deployment plumbing** — canonical, robots, sitemap, structured data, social cards, discovery files — which
this audit adds.

**Biggest remaining risks:** the ~7 MB of eagerly-loaded film frames (mobile Core Web Vitals and crawl
budget), the poetic H1 vs. brand title mismatch (Google title-rewrite risk), and the absence of a plain
definition block (AI answer extractability).

### What was implemented in this pass

| Item | Status |
|---|---|
| `canonical` → `https://one.acuity.institute/` | Added |
| `robots` meta (`index, follow, max-image-preview:large`) | Added |
| Open Graph + Twitter cards (title, description, 1920×1080 poster image) | Added |
| JSON-LD: `Organization`, `WebSite`, `FAQPage` (6 questions, text matches the visible FAQ) | Added, validated |
| SVG favicon / brand mark (`assets/brand/acuity-mark.svg`) | Added (fixes the 404) |
| `robots.txt` — wildcard allow, `/examples/` disallowed, sitemap declared | Added |
| `sitemap.xml` — canonical homepage only | Added, parsed |
| `llms.txt` — offering, status, key links, contact | Added, linked from `<head>` |
| `scroll-assets.html` — `noindex, follow` (demo page) | Added |
| Hero poster `preload` (LCP) + `fetchpriority` | Added |

---

## 1. SEO audit (seo-audit framework)

### Crawlability & indexation

| Finding | Impact | Evidence | Fix | Priority |
|---|---|---|---|---|
| No canonical tag | High | `link[rel=canonical]` absent | Added self-canonical `https://one.acuity.institute/` | Done |
| No robots.txt | High | `/robots.txt` 404 | Added wildcard allow + sitemap + `/examples/` block | Done |
| No XML sitemap | High | `/sitemap.xml` 404 | Added (1 canonical URL) | Done |
| Demo pages indexable | Medium | `scroll-assets.html` and the sample deck were linked and unindexed-intent | `noindex` on studies page; `/examples/` disallowed | Done |
| 404 behaviour | Low | Dev server returns real 404s; confirm host does too (no SPA rewrite) | Keep static 404s on the host | Deploy check |

### Technical foundations

| Finding | Impact | Evidence | Fix | Priority |
|---|---|---|---|---|
| ~7.1 MB first-load transfer, 96 hero frames fetched eagerly | High (mobile CWV, crawl budget) | `performance.getEntriesByType('resource')`: 96 × ~70 KB hero frames (6.8 MB dir); lake 7.3 MB; Apollo 6.8 MB | Load every Nth frame first, fill gaps on scroll; or lower frame count / resolution; mark off-screen frames `fetchpriority="low"` | 1 |
| Fonts from two render-blocking Google stylesheets | Medium | 2 × `fonts.googleapis.com/css2` in head | Merge into one request or self-host WOFF2 subsets | 2 |
| LCP 208 ms, CLS 0, 0 long tasks (local) | Good | Live PerformanceObserver | Re-measure on production hardware; poster now preloaded | — |
| HTML 90 KB / CSS 33 KB uncompressed | Low–Medium | gzip → 25 KB / 10 KB | Enable Brotli + long-lived caching at the host | Deploy check |
| Favicon 404 | Low | Console error | SVG icon added | Done |

### On-page

| Finding | Impact | Evidence | Fix | Priority |
|---|---|---|---|---|
| Title 48 chars / description 150 chars, unique, brand + value | Good | `<title>`, `meta[name=description]` | Keep | — |
| H1 is poetic (“An open invite to wisdom”) and does not contain the entity | Medium | H1 vs title mismatch — Google may replace the title with the H1 | Option A: prepend “Acuity.One —” to the H1 (visible design change). Option B: keep and watch the title in GSC results | 3 |
| 1 H1, 6 H2s, logical H3/H4/H5, no skipped levels, no duplicate IDs | Good | Rendered heading outline | Keep whatever CMS/renderer is used | — |
| 7 images, all with alt (2 decorative `alt=""`), dimensions set, below-fold lazy | Good | DOM audit | Keep | — |
| 15 external links resolve (2 preconnect roots 404 by design) | Good | `curl -L` status check | — | — |
| Internal anchors `#intro #tools #pricing #faq #invitation` all resolve | Good | DOM audit | — | — |

### Content & E-E-A-T

| Finding | Impact | Evidence | Fix | Priority |
|---|---|---|---|---|
| No “last updated” date | Medium | No date in copy or schema | Add a visible “Updated [date]” line + `dateModified` | 4 |
| Organisation trust signals present (Privacy, contact, Institute links) | Good | Footer navigation | Keep | — |
| Pricing honestly marked “to be confirmed” | Good (trust) but weak for agents | Pricing section | Keep; add `/pricing.md` once confirmed | 5 |
| No author byline | Low | Product page; brand-level E-E-A-T is appropriate | Optional: Institute/author attribution on the FAQ | — |

---

## 2. AI-SEO audit (ai-seo framework)

### Agent access & readiness

| Check | Status | Evidence |
|---|---|---|
| Crawlable for discovery (robots.txt + no WAF challenge) | ✅ once deployed | Wildcard allow; confirm host WAF does not challenge `OAI-SearchBot`/`PerplexityBot`/`Claude-SearchBot` |
| Core content in initial HTML | ✅ | 14,141 chars of text render with JavaScript disabled; copy is static |
| Real status codes / no SPA catch-all | ⚠️ host check | Keep static 404s |
| `llms.txt` at root | ✅ added | Linked from `<head>` (discovery files need a link) |
| `llms-full.txt` | ⬜ optional | Entire site is one page — low value today |
| Markdown mirror / `Accept: text/markdown` (MAY) | ⬜ optional | Not implemented; HTML is the source of truth |
| Structured data | ✅ added | `Organization`, `WebSite`, `FAQPage`; facts repeated as visible text, not schema-only |
| Pricing as text | ⚠️ partial | Pricing section is text, but price is “to be confirmed” — honest, yet agents cannot quote a number; publish `/pricing.md` when final |

### Content extractability

| Check | Status | Notes |
|---|---|---|
| Clear definition in the first paragraph | ⚠️ | Intro opens poetically (“Some questions deserve more than an answer.”). Add a 40–60 word plain definition near the top: *“Acuity.One is the Acuity Institute's forthcoming membership that brings five study tools together around a private, source-linked WisdomVault.”* |
| Self-contained answer blocks | ✅ good | H2/H3 sections read independently; FAQ is extractable |
| Comparison table | ✅ | Free vs Membership table lives in `<details>` and is in the HTML |
| FAQ in natural language | ✅ | 6 Q&As, mirrored in `FAQPage` schema |
| Headings match query patterns | ✅ | “Keep what matters”, “The Constellation”, pricing, FAQ |
| Freshness signal | ⚠️ | No date on page or schema |
| Statistics with sources | N/A | No claims needing citations yet |

### Presence & monitoring

- **Owned-page authority is the right bet pre-launch:** the page is the canonical source for “Acuity.One”, “Acuity.One membership”, “WisdomVault”. Google's guidance: no special AI markup needed; E-E-A-T and clean indexability carry AI Overviews.
- **Third-party surfaces** (Wikipedia, reviews, press, LinkedIn) do not exist yet for an unreleased product — plan launch coverage once pricing and date are public.
- **Monitoring:** track 10–20 prompts monthly across ChatGPT, Perplexity and Google AI Overviews (e.g. *“What is Acuity.One?”, “Acuity.One membership”, “Acuity Institute tools”, “WisdomVault”, “Acuity.One vs [category]”*). Log cited/not-cited with sample size (3–5 runs per platform).
- **No AI-specific Search Console reporting exists** — AI Overviews use core Search ranking; measure with Performance/CWV plus third-party monitors.

---

## 3. Google Search Console linkage

1. **Property:** create a **Domain property** for `acuity.institute` (DNS TXT verification) — it covers `one.acuity.institute` and all subdomains. Alternative: URL-prefix property `https://one.acuity.institute/`.
2. **Verify:** DNS TXT record (recommended), or upload the HTML verification file to the deploy root, or paste the `<meta name="google-site-verification">` token into `<head>` (not added — needs your token).
3. **Sitemaps:** submit `https://one.acuity.institute/sitemap.xml`; expect “Success” within 24–48 h.
4. **robots.txt:** Settings → robots.txt report must show a fetch with 200 and the sitemap line.
5. **URL Inspection:** after deploy, inspect `https://one.acuity.institute/` → “Request indexing”; confirm the user-declared canonical equals the Google-selected canonical.
6. **Page indexing report:** check after 48–72 h that the homepage is “Indexed” and `scroll-assets.html` is “Excluded by noindex”.
7. **Core Web Vitals:** field data appears after traffic; prioritise the frame-payload reduction before launch.
8. **Alerts:** enable coverage/performance email alerts.
9. **Host checks that break GSC:** HTTPS everywhere, one canonical host (no www + non-www duplicates), real 404s (no SPA rewrite), no WAF challenge on Googlebot, no `noindex` on the homepage.

---

## 4. Prioritised action plan

**Critical (blocking indexation) — done**
1. Canonical, robots meta, robots.txt, sitemap.xml, structured data, social cards, favicon, llms.txt.

**High impact**
2. Cut first-load frame payload (progressive frame loading; ~7 MB of images loaded before the visitor scrolls).
3. Add a plain definition block near the top (helps AI extraction and snippets).
4. Enable Brotli + cache headers on the host; merge/self-host the two font stylesheets.

**Medium**
5. Add a visible “Updated” date and `dateModified` to the `WebSite`/`FAQPage` nodes.
6. Align the H1 with the brand/title (or monitor title rewrites in GSC).
7. Publish `/pricing.md` when pricing is confirmed; link it from `llms.txt` and the sitemap.

**Long term**
8. Monthly AI-citation monitoring + GSC review; launch-time third-party presence; optional markdown mirrors (`Accept: text/markdown`) and `llms-full.txt`.
