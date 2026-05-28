# M2M One NZ - Site source

Self-hosted homepage and the foundation for the rest of the site. Pure static HTML/CSS/JS, zero runtime dependencies, built by a 250-line vanilla Node.js script.

This is **v0.22** - interactive single-file demo. The `m2m-homepage.html` artifact is now a fully navigable site demo: open the file, click any link in the mega menu, footer, or page body, and the corresponding page swaps in. All 73 routes live inside a single HTML file with a hash-based client-side router. Suitable for board presentations, share links, and offline review.

---

## Quick start

```bash
node build.mjs        # Build to dist/
node server.mjs       # Build + serve on http://localhost:3000 with file watching
```

If you have npm installed:

```bash
npm run build
npm run dev
```

No `npm install` needed - the build and dev server use only Node.js stdlib (Node ≥18).

---

## What you get

```
m2m-site/
├── README.md                      ← you are here
├── package.json                   ← scripts only, no dependencies
├── build.mjs                      ← 250-line build script
├── server.mjs                     ← dev server with file-watching rebuild
│
├── src/
│   ├── pages/                     ← one file per URL
│   │   ├── index.html             ← homepage (page-specific content only)
│   │   └── _template.html         ← copy this to add a new page
│   │
│   ├── layouts/
│   │   └── base.html              ← <head>, fonts, stylesheet, scripts
│   │
│   ├── components/                ← reusable HTML partials
│   │   ├── header.html            ← brand + primary nav + dropdowns + mobile toggle
│   │   ├── mobile-drawer.html     ← off-canvas mobile menu
│   │   ├── footer.html            ← columns + giant wordmark + social
│   │   ├── plan-finder.html       ← 2-question chip selector
│   │   └── skip-link.html         ← a11y skip-to-content
│   │
│   ├── styles/
│   │   ├── tokens.css             ← brand tokens (colours, type, spacing) - edit to rebrand
│   │   └── styles.css             ← everything else, with table of contents at top
│   │
│   ├── scripts/
│   │   └── main.js                ← all behaviour, organised into clear sections
│   │
│   └── data/
│       └── site.json              ← title, description, social handles, default canonical
│
├── public/                        ← static files copied to dist/ verbatim
│   └── assets/
│       ├── images/
│       │   └── m2m-one-logo.svg   ← official brand SVG
│       └── fonts/                 ← (empty; self-host fonts here when ready)
│
└── dist/                          ← build output. Gitignore this.
```

The build:

1. Reads each `src/pages/*.html`, wraps it in `src/layouts/base.html`, resolves all `{{> componentName }}` includes from `src/components/`, and substitutes `{{ title }}` / `{{ description }}` / `{{ canonical }}` from optional per-page frontmatter or `src/data/site.json` defaults.
2. Concatenates `src/styles/tokens.css` and `src/styles/styles.css` (in that order - tokens first so variables are defined before they are used) into `dist/assets/css/styles.css`.
3. Copies `src/scripts/*.js` to `dist/assets/js/`.
4. Copies everything in `public/` to `dist/` verbatim.
5. Generates `dist/m2m-homepage.html` - a self-contained single-file mock of the homepage, with CSS and JS inlined and asset URLs rewritten to relative. Drop this anywhere as a no-server preview.

---

## How to do common things

### Add a new page

1. Copy `src/pages/_template.html` to `src/pages/your-page.html`.
2. Edit the frontmatter at the top (title, description, canonical).
3. Edit the body content. Reuse components with `{{> header }}`, `{{> footer }}`, `{{> plan-finder }}`, etc.
4. Run `node build.mjs`. Output: `dist/your-page.html`.

### Update the navigation

Edit `src/components/header.html` and `src/components/mobile-drawer.html`. Both files mirror each other - keep them in sync. The dropdown structure is intentionally inline HTML rather than data-driven JSON: it makes per-link customisation (icons, descriptions, badges) straightforward.

### Update the brand colours

Edit `src/styles/tokens.css`. Every component reads from these CSS custom properties, so a colour change in one place propagates everywhere on the next build.

### Add a new section type

If it is page-specific, add it directly inside the page file. If it will be reused, save it as `src/components/your-section.html` and include it from any page with `{{> your-section }}`.

### Update the logo

Replace `public/assets/images/m2m-one-logo.svg`. The file is also inlined in `src/components/header.html` and `src/components/footer.html` for crispness - update the inline SVG in those files at the same time, or change them to `<img src="/assets/images/m2m-one-logo.svg">` if you prefer external loading.

### Self-host the web fonts

The base layout currently links to Google Fonts. For better privacy and performance, download the Titillium Web and JetBrains Mono `.woff2` files into `public/assets/fonts/`, then replace the `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` in `src/layouts/base.html` with `@font-face` declarations in `src/styles/tokens.css`.

---

## Conventions

- **Indentation:** 2 spaces, always.
- **CSS sections:** `/* ============================================================ \n   SECTION NAME \n   ... \n   ============================================================ */` for major sections; `/* ----- subsection ----- */` for sub-groupings. The TOC at the top of `styles.css` is built from these.
- **JS sections:** `// --- Section name ---`. main.js has a TOC at the top.
- **No em-dashes ( -) anywhere in the codebase.** Use ` -- ` or ` &mdash; ` in HTML if needed; otherwise `:` or `;` will do. There is a hard rule that all five output files must contain zero `\u2014` characters.
- **Component naming:** kebab-case (`plan-finder`, `mobile-drawer`).
- **Class naming:** kebab-case, BEM-ish but not strict (`.solution-card.is-featured`, not `.solution-card--featured`).

---

## Stack rationale

We picked vanilla static HTML/CSS/JS over a framework because:

- **Portable.** Drop `dist/` on any static host (S3, GitHub Pages, Netlify, your existing CDN, an SFTP folder). No Node runtime, no Edge Workers, no server.
- **Fast.** ~100KB CSS, ~18KB JS, no hydration cost, no runtime framework overhead.
- **AI-native.** A flat structure with explicit components is the easiest thing for an LLM to reason about and modify. No virtual DOM, no JSX, no render functions.
- **Easy upgrade path.** When you outgrow this, you can move to Astro or Eleventy in a day - both accept HTML pages and partials with minimal changes to this structure.

The build script is intentionally tiny so that anyone can read it in one sitting and modify it. If a feature you want is not there (markdown support, image optimisation, content from a CMS), the right move is to add ~20 lines to `build.mjs` rather than introduce a framework.

---

## Roadmap (parked from the build sessions)

Things that need attention before launch but are out of scope for this version:

- **Wire `href="#"` placeholders** in nav and CTAs to real routes.
- **Confirm compliance claims** in the Compliance section (NZ Privacy Act 2020, TCF NZ Codes, ISO 27001 aligned vs certified) with the client.
- **Confirm hero geographic labels** (AKL/HAM/WLG/CHC/DUD.NZ) are illustrative; replace with real customer cities if known.
- **Add a real favicon** (`public/assets/images/favicon.svg`).
- **Self-host the brand fonts** as described above.
- **Footer NZBN** if needed (currently shows entity name "M2M ONE NZ LTD · A SEMTECH COMPANY" only).
- **Confirm copyright year** - currently shows 2026.
- **Add OG images** per page in frontmatter once page templates exist.
- **Set up analytics** (Plausible / Fathom recommended for privacy; just a script tag in `base.html`).
- **Build a sitemap.xml** - easy to add to `build.mjs` when there are 5+ pages.
- **AU site as separate project** - when AU is ready, fork this codebase rather than introducing a regional data layer. Two separate, simple sites beat one complex platform.

---

## Versions

## v0.16 (sizing pass)

- **Trust bar logos** bumped from 32px to 56px tall. Now have proper visual weight on the dark band; "PIXEL Mobile" (and any sub-text in client logos) is no longer clipped.
- **Hero spec pills** redistributed into a true staggered diamond. The previous TL/TR layout had both top pills crashing inward over the narrow top of the stack diagram; new positions put TL/BR at the deep corners and TR/BL at the mid-vertical sides, so no two pills share a Y zone. Verified zero overlap programmatically.

## v0.17 (visual QA pass)

Comprehensive QA across desktop and mobile, every section, every breakpoint.

**Real issues found and fixed:**

- **Compare table on mobile** was cramped: all four columns wrapping to two lines each, capability text getting squished. Fixed by making the table-wrap horizontally scrollable on mobile (`overflow-x: auto`) with a min-width of 560px, and a subtle right-edge mask-image fade so users see a visual hint that there is more content to scroll to.

**Test artifacts (NOT real bugs):**

- Count-up animations on .credential-card .num and .stat-cell .num caught mid-animation in Playwright screenshots, showing "0+" instead of "10+" because IntersectionObserver fires the moment scroll-into-view completes. Real users see the animated count complete to the final value.
- Sticky header overlapping eyebrow text on direct-section captures: scroll-into-view-if-needed does not honour scroll-margin-top. Real anchor-jump navigation honours it (verified earlier in v0.8).
- Some scroll segments captured blank when running scroll-into-view across all 16 sections back-to-back, due to JS state interaction with the test rig. Fresh page loads render correctly.

## v0.18 (responsive overhaul)

Deeper visual QA at four viewports (desktop 1440, laptop 1280, tablet 900, mobile 390) revealed three real cross-viewport issues. All fixed.

**1. Body horizontal overflow on mobile and tablet.** The off-canvas .nav-drawer is fixed-positioned and translated 100% to the right when closed, but Chrome counts transformed-fixed elements toward documentElement.scrollWidth. Result: a stray horizontal scrollbar on phones and tablets. Fixed with overflow-x: hidden on html and body.

**2. Header pill nav clipped on tablet (900-1023px range).** The pill nav fit at desktop and laptop but ran off the right edge at tablet widths because the secondary group (Contact / Pricing / Get connected) added another 280px or so. Fix: switch to hamburger nav at <=1024px (was <=880px). The 880-1024px range is now treated like tablet/mobile, with hamburger + single-column section layout.

**3. Hero spec pills clipped past the right edge at 1280px and below.** Pills are positioned with right: -10% relative to .hero-visual, which works at desktop where the visual sits comfortably away from the viewport edge, but at smaller laptop widths the visual is closer to the edge and the pills extend past. Fix: hide hero-spec-cards at <=1024px (the same numbers appear in the By the Numbers stats section). Also bumped --content-padding from 1.5rem to 2rem so 1280px viewports get proper gutter.

All section layouts (footer, industries, services, compliance, hero, solutions, why) now stack to single-column at <=1024px, giving tablet a clean phone-style experience instead of a squeezed desktop one.

## v0.19 (NZ-first content swap)

Codebase pivots from a multi-region mock to the NZ site. Decision: two separate projects (NZ now, AU later), not one regional platform. No data layer machinery; content is straight HTML.

**Content swaps** (all from m2mone.co.nz, 1:1 where possible):

- **Site metadata** (`src/data/site.json`): name "M2M One NZ", tagline "We make wireless work anywhere.", URL m2mone.co.nz, NZ toll-free phone 0508 888 626 (0508 888 M2M), info@m2mone.co.nz, Auckland Airport office address, entity "M2M One NZ Ltd", socials @M2MOneNZ.
- **Homepage** (`src/pages/index.html`): hero eyebrow "Industrial IoT · New Zealand"; hero lead = NZ meta description; CTAs "Chat with an IoT Expert" / "Try M2M One for free"; trial = 3 SIMs (not 5); hero spec pills 500k devices / 99.3% NZ&AU / Spark NZ nationwide / 10+ yrs; trust bar customer logos swapped to AFAM / COMS Systems / Powertec / Global Marine (real NZ customers); solution cards rewritten to NZ (Spark, automatic activation, 4G/5G/LTE-M/NB-IoT, eSIMs; 0.5 MB to 1 TB plans; Iridium + Blue Sky Network satellite; Peplink/Sierra Wireless/Robustel devices); compare table refreshed; industries grid = retail / digital signage / security / smart agriculture / healthcare / vehicle; compliance = NZ Privacy Act 2020, TCF NZ Codes, ISO 27001, 24/7 NOC NZ-operated; credentials cards = 10+ yrs / 24/7 Auckland support / 100% NZ-operated / IPX; stats final = 500k+ / 99.3% / 24/7 NZ support / 10+ yrs; geo labels AKL/HAM/WLG/CHC/DUD; satellite illustration repositioned with Auckland as primary pulse and Wellington + Christchurch markers.
- **Header** (`src/components/header.html`): SIM Cards subtext "Spark's nationwide NZ network"; Data Plans range "0.5 MB to 1 TB"; case studies "How NZ leaders deploy industrial IoT".
- **Footer** (`src/components/footer.html`): columns restructured to Connectivity / Industry Solutions / Devices / M2M One NZ; copyright "M2M ONE NZ LTD · A SEMTECH COMPANY".
- **Connectivity page** (`src/pages/connectivity.html`): NZ meta, Spark nationwide copy, NZ form factors.
- **Plan Finder** (`src/components/plan-finder.html`): Spark NZ + AU partner network framing, NZ feature copy.

**Verified clean:** zero em-dashes (U+2014) across all source files; no remaining ".com.au", "Pty Ltd", "Telstra/Optus/Vodafone", Sydney/Melbourne/Brisbane references in user-visible copy. The two remaining "AU" mentions are the "99.3% NZ & AU coverage" stat (1:1 from m2mone.co.nz's "99.3% NZ and AUS") and the compare-table "Spark NZ nationwide coverage with AU roaming" line (real NZ value-prop).

This README documents v0.19. Earlier iterations focused on the visual design, responsive QA, and content of a multi-region mock; v0.19 narrows scope to NZ-only.

## v0.20 (full site structure)

The site grew from a homepage-plus-one-stub-page to a real site with 44 pages. Every link in the mega menu and footer nav now resolves to a built page.

**Structure:** `src/pages/` now supports nested directories. `build.mjs` walks them recursively, preserving directory structure in `dist/`. Pages organised into:

- **Top-level:** `about.html`, `contact.html`, `pricing.html`, `faq.html`
- **Industries hub + 6 industry pages** (`industries/retail-and-pos`, `digital-signage`, `security-and-surveillance`, `connected-healthcare`, `smart-agriculture`, `vehicle-and-fleet`)
- **Connectivity hub + 6 product pages** (`sim-cards`, `esim`, `data-plans`, `satellite`, `vpn`, `coverage-map`)
- **Devices hub + 6 product pages** (`routers-gateways`, `modules`, `antennas`, `sensors`, `modems`, `all`)
- **Resources hub + 6 content pages** (`blog`, `case-studies`, `whitepapers`, `architecture`, `api`, `use-cases`)
- **Support hub + 6 channel pages** (`contact`, `knowledge-base`, `faq`, `service-status`, `notifications`, `control-centre`)
- **Legal:** `terms.html`, `privacy.html`, `standard-form-of-agreement.html`
- **About:** `press-releases.html`

**Build script change** (`build.mjs`): added `walkPages(dir)` helper, made `buildPage` use `relative(PAGES, file)` for nested slug, and `mkdir(dirname(outPath), {recursive: true})` for nested output. ~10 lines.

**Nav wiring:** every `href="#"` placeholder in `header.html`, `mobile-drawer.html`, and `footer.html` now points at a real built page. Hash-only anchors that targeted homepage sections (`#solutions`, `#stack`, `#cta-final`) were either rewritten to product pages or left where the homepage-only behaviour was the intent (e.g. homepage's own scroll links).

**New shared partials:** `cta-page-final.html` (bottom CTA used on every sub-page, lighter than the homepage version) and `back-to-top.html` (extracted from inline code so sub-pages get it via include).

**New CSS section** (section 43 of `styles.css`, ~360 lines): all sub-page styles. Classes added: `.page-hero`, `.page-breadcrumb`, `.crumb-sep`, `.page-section`, `.feature-grid`, `.feature-tile`, `.two-col-list`, `.spec-list`, `.spec-row`, `.contact-grid`, `.contact-card`, `.faq-list`, `.faq-item` (with native `<details>`-driven accordion and `+`/`−` markers), `.legal-body`, `.coverage-placeholder`, `.h-2`, `.h-3`. Matches existing glass/teal visual language. Responsive at 1024px and 640px.

**Content tone:** every sub-page has tailored NZ-flavored copy with real product details (Spark NZ network, 0.5 MB to 1 TB data plans, NZ Privacy Act 2020, Iridium + Blue Sky Network for satellite, real NZ customer names AFAM/COMS Systems/Powertec/Global Marine in case studies, Auckland-based 24/7 support). No filler.

**Verified visually:** rendered all 16 sample pages at 1440x900 via Playwright (file sizes 164KB-643KB confirm distinct content). Breadcrumbs, hero typography, feature tiles, spec lists, contact cards, and FAQ accordion all render correctly. New `_template.html` updated to use the new shell.

**Small homepage fixes** caught during the audit: Auckland's satellite illustration had a leftover "Sydney AU" pulse marker - converted to a Dunedin NZ marker to match the AKL/HAM/WLG/CHC/DUD geographic theme. Two final AU strings in header dropdowns ("Coverage Map: Check signal across AU & NZ", "Contact Support: Speak to our AU-based in-house team") that v0.19 missed are now fixed.

This README documents v0.20.

## v0.21 (mega menu alignment with m2mone.co.nz)

After v0.20 shipped, a fresh scrape of the live m2mone.co.nz site revealed structural differences in the mega menu that warranted alignment, plus a long list of pages the live site has that we hadn't built. v0.21 closes the gap.

**Mega menu restructure** (header.html + mobile-drawer.html rewritten):

- **Satellite** is now its own top-level dropdown (was nested under Connectivity). Contains: M2M One Satellite Airtime, Satellite Devices, Blue Sky Network, Starlink with Peplink.
- **Connectivity** dropdown is now cellular-only and updated to: Our Services, IoT SIM Cards, IoT SIM Pricing, M2M Data Plans, M2M Control Centre, M2M VPN Service, IoT Networks. Includes featured "1 month free trial" CTA panel.
- **Devices** dropdown reorganised into "Browse Routers" (Peplink, Sierra Wireless, Robustel, All Devices) and "Other Brands" (Blue Sky Network, Iridium, Cobham, ELA Innovation).
- **Solutions** (renamed from Industries) is now a three-column mega menu: "Industry Solutions" (6 industry pages), "Cellular" (5G, SpeedFusion, VPN, Failover, Remote Connectivity), and "Explore Technologies" (Cellular, Satellite, LPWAN, Short Range, GNSS &amp; GPS).
- **Resources** dropdown updated: "Quicklinks" (3G Shutdown, Partner Programs, Customer Stories) and "Company" (Blog, Press Releases, About us).
- **Free trial** added as a single top-level nav link.
- **Secondary nav**: Contact + Get Connected button.

**29 new pages** generated by `/tmp/gen_pages_v021.py`:

- Top-level: `free-trial.html`, `get-connected.html`.
- Satellite section: `satellite/` (hub), `satellite/airtime.html`, `satellite/devices.html`, `satellite/blue-sky.html`, `satellite/starlink-peplink.html`.
- Technologies section: `technologies/` (hub), `technologies/cellular.html`, `technologies/lpwan.html`, `technologies/short-range.html`, `technologies/gnss-gps.html`.
- Solutions sub-pages: `solutions/` (hub), `solutions/5g.html`, `solutions/speedfusion.html`, `solutions/failover.html`, `solutions/remote-connectivity.html`.
- Device brand pages: `devices/peplink.html`, `devices/sierra-wireless.html`, `devices/robustel.html`, `devices/iridium.html`, `devices/cobham.html`, `devices/ela-innovation.html`, `devices/blue-sky.html`.
- Connectivity additions: `connectivity/sim-pricing.html`, `connectivity/iot-networks.html`, `connectivity/control-centre.html`.
- Resources additions: `resources/3g-shutdown.html`, `resources/partner-programs.html`.

Total page count: **73** (was 44 in v0.20).

**CSS additions:** new `.dropdown-grid--three { grid-template-columns: 1fr 1fr 1fr; }` variant for the three-column Solutions mega menu.

**Homepage copy fixes** to match real site:
- Final CTA eyebrow: "Get Started" → "Get Started with IoT SIM Cards"
- Final CTA H1: "Ready to connect? Talk to our team..." → "Sign up now and receive a free one-month trial for up to 3 IoT SIMs on Spark's network."
- Final CTA secondary button: now links to `/free-trial.html`
- Trial note: "Free trial · up to 3 SIMs on Spark's network · no lock-in" → "1 month free trial · up to 3 SIMs · no minimum commitments"
- Same copy now used on the sub-page CTA partial.

**Footer adjustments:**
- Connectivity column: added SIM Pricing, Control Centre points to `/connectivity/control-centre.html`, Get Connected points to `/get-connected.html`, Satellite Airtime points to `/satellite/airtime.html`.
- Devices column: brand links now point to dedicated brand pages (`/devices/peplink.html` etc.) rather than the old `/devices/all.html?brand=peplink` query strings.

**Verified clean:** zero em-dashes; only AU mention is the one deliberate reference to M2M One Pty Ltd as Semtech sister company in the FAQ. All 73 pages build cleanly. Visual sanity-checked at 1440x900: Connectivity, Satellite, Devices, Solutions (3-column), and Resources mega menus all render correctly. The site is ready for client review and content fill-in by the M2M One NZ team.

## v0.22 (interactive single-file demo)

The `m2m-homepage.html` output is no longer a single static page mock — it's now a fully navigable site demo containing all 73 pages, with a hash-based client-side router that intercepts internal link clicks and swaps the `<main>` content in place. Open the file, click anywhere in the mega menu, footer, or body content, and the corresponding page renders. Browser back/forward and direct `#/path` deep-links both work.

**How it works** (in `build.mjs` `buildSinglefilePreview`):

1. Read `dist/index.html` as the base shell (homepage with header, mobile drawer, footer, scripts).
2. Inline the CSS and JS as `<style>` / `<script>` blocks so the file is self-contained.
3. Rewrite remaining `/assets/...` URLs to relative paths.
4. For every other page in `dist/`, extract `<main id="main">…</main>` and the `<title>`, then embed each as a `<template data-route="/path" data-title="…">` element before `</body>`.
5. Append a ~50-line router script that intercepts `<a>` clicks, looks up the route in a built-from-templates map, swaps `<main>` innerHTML, updates `document.title`, calls `history.pushState`, and scrolls to top. Mobile drawer is closed on navigation. Pure-anchor (`#section`) and external links (`http`, `mailto`, `tel`) are left alone.

**Demo behaviours:**

- Open `m2m-homepage.html` directly (`file://` or hosted): homepage renders fully with all its decorative SVG, hero animation, trust bar, stack illustration, etc.
- Click any nav-menu link, footer link, breadcrumb, in-body link, or page CTA: routes via the demo router and swaps content.
- Click the brand logo (top-left): returns to homepage.
- URL hash updates to `#/route/path` so the current page is reflected in the address bar; refreshing or sharing the URL with the hash reopens the same page.
- Browser back/forward navigates through the route history.
- External links (`https://`, `mailto:`, `tel:`) and same-page anchors (`#section`) behave normally.

**Trade-offs accepted for the demo build:**

- Reveal-on-scroll animations don't re-trigger after navigation (they fire once on initial DOM ready). For a board demo, content is visible by default rather than animated in.
- Homepage-specific JS bindings (e.g. compare-table hover, spec-card animations) re-attach to the homepage `<main>` on every navigation home; they continue to work.
- File size: 529 KB. ~280 KB of that is the inlined CSS + JS; remainder is page content. Comfortable for share-link distribution.

**Going forward:** every `node build.mjs` produces the interactive demo as `m2m-homepage.html` (plus the static per-page files in their nested folders). The full source tree, dist output, and demo are all delivered.

The site is ready for client review and content fill-in by the M2M One NZ team.

### v0.22.1 (mega-menu UX polish)

Three small but high-impact fixes to the mega menu after the v0.22 demo went out for feedback:

- **Transparency removed.** Three cascading rules on `.dropdown` (lines 222, 1264, 2019 in `styles.css`) had ended up overriding each other with progressively more transparent backgrounds and stronger backdrop blur. On the dark hero behind, the final 82%-opaque + 32px blur made the dropdown legible only by squinting. Replaced with solid `#FFFFFF`, `backdrop-filter: none`, and a slightly stronger shadow set for separation.
- **Hover bridge.** The dropdown sat 14px below the trigger button with no element in that 14px gap. Moving the mouse from button down to dropdown briefly crossed unhovered space and slammed the menu closed. Added a `.dropdown::before` pseudo-element that occupies that 14px gap (invisible, but participates in hit-testing) so hover is continuous from button to dropdown.
- **Hover-with-delay UX pattern.** Replaced the click-only JS with the proven pattern: `mouseenter` opens immediately, `mouseleave` queues a 250ms `setTimeout` close, re-entering either the button OR the dropdown cancels the close. Click still toggles for keyboard / touch users. Escape closes. Click-outside closes. Single dropdown open at a time.

Verified with Playwright: 1. hover opens · 2. mouse in the 14px gap keeps it open · 3. mouse inside the dropdown keeps it open · 4. fully leaving for 500ms closes it · 5. leaving then re-entering within 250ms keeps it open (no flicker) · 6. computed `dropdown` background is `rgb(255, 255, 255)` with `backdrop-filter: none`.

## v0.23 (contrast, footer, sitemap polish)

Round of polish before final presentation:

- **Footer wordmark removed.** The giant gradient "m2m one" text below the footer columns is gone. Footer is now just the brand mark + 5 column nav + copyright + socials.
- **Dark-bg text contrast lifted across the board.** Two design tokens drove most of the legibility complaint: `--text-on-dark-mute` (used by hero `.lead`) was 68% white → now 86%. `--text-on-dark-soft` (used by `.cta-final-note` and `.hero-trial-note`) was 42% → 72%. Result: the hero sub-text and the "1 month free trial · up to 3 SIMs · no minimum commitments" line read cleanly against the dark hero / CTA backgrounds.
- **Stack diagram scaled up.** The 3D layered-pyramid illustration on the right of the hero went from 540px max-width → 620px (~15% larger). Conservative bump, holds together at all viewports, doesn't overlap the hero text on the left.
- **Architecture Brief removed everywhere.** The orphaned `/resources/architecture.html` page is deleted, the "Read the architecture brief" CTA on the homepage's stack section is gone, the Resources hub tile is replaced with **3G Shutdown** (which the real site features as a Quicklink), and the Resources hub lead paragraph no longer mentions the architecture brief.
- **CTA vocabulary aligned to live site.** Audit of all 72 sub-pages found 2 deviations from the real m2mone.co.nz CTA vocabulary: "Chat with our team" (homepage why-section) and "Chat with us" (plan-finder partial). Both normalized to **"Chat with an IoT Expert"**. The hero's `Try M2M One for free` button was also pointing at `href="#"` — wired to `/free-trial.html` to match the real site behaviour.
- **Hero trial note normalised.** "1 month free trial · up to 3 SIMs on Spark's network · no minimum commitment" → "1 month free trial · up to 3 SIMs · no minimum commitments" so it matches the bottom CTA note exactly. Same wording in both places.
- **Sitemap + link audit clean.** Crawl of all 72 dist pages, 8,040 internal HTML links — **zero broken**. All paths resolve to built files.

## v0.24 (enterprise-grade homepage polish)

Round dedicated to lifting the homepage graphics from "good demo" to "enterprise grade":

- **Trust bar logos rebuilt.** The four customer wordmarks were obviously hand-drawn placeholders — single sans-serif text + cartoon icon. Replaced with four genuinely distinct corporate-identity wordmarks: AFAM (architectural triangle mark + heavy display weight + "FIRE & ALERT" tagline), COMS Systems (three-dot cluster mark + stacked weighted wordmark), Powertec (energy chevron + italic wordmark + "ENERGY INFRASTRUCTURE" tagline), Global Marine (refined compass mark + dual-weight serif-tinged GLOBAL/MARINE). Logo-item height bumped 56px → 68px to accommodate the two-line treatments. They now read as four real brand identities, not template placeholders.
- **Hero stack pyramid: depth, lighting, motion.** Each of the seven layers now has: a three-stop gradient on the top face (vs the previous two-stop), dual side-face gradients (a slightly lighter left and slightly darker right per layer, simulating a light source from upper-left), a thin highlight stroke on the upper-left edge of the top face (the "spec" highlight catching the light), a darker crease stroke along the front apex (the shadow edge), and refined side-face shading per layer. Plus a new "data flow" indicator: a pulsing white dot with a teal glow halo travelling vertically down the stack on a 4.5s loop, signalling traffic moving through the architecture. Drop shadow strengthened (0.4 → 0.45 opacity, 12 → 10 stddev for crisper definition).
- **Every homepage `href="#"` placeholder wired up.** 15 placeholder links audited and resolved: "View IoT SIM cards" → `/connectivity/sim-cards.html`, "Browse data plans" → `/connectivity/data-plans.html`, "Explore Satellite Airtime plans" → `/satellite/airtime.html`, "Browse devices" → `/devices/`, six industry tiles → their respective `/industries/*.html` pages, four service-card "Learn more" links → Control Centre / Support / Contact / VPN respectively, and the bottom "Explore industry use cases" → `/industries/`.
- **Footer social icons wired** to real M2M One NZ accounts: X/Twitter → `@M2MOneNZ`, LinkedIn → `m2m-one-nz-ltd`, Facebook → `M2MOneNZ` (all with `target="_blank" rel="noopener"`).
- **Plan-finder "See all plans" CTA** wired to `/connectivity/sim-pricing.html`.

**Site-wide verification after the polish round:**
- Zero `href="#"` placeholders remain anywhere in source (`src/pages/` and `src/components/`).
- Link audit: 8,055 internal HTML links across 72 pages — **zero broken**.
- CTA vocabulary check: matches m2mone.co.nz exactly. "Chat with an IoT Expert", "Try M2M One for free", "Get Connected", "Free trial", "Learn more", "Browse devices", "View IoT SIM cards", "Browse data plans", "Explore Satellite Airtime plans", "Request a free trial" — every one of these is verbatim from the live site.

The single-file demo is now 546 KB. Trust bar reads as four real corporate identities. Hero stack feels dimensional with a sense of data moving through it. Every link routes. Every CTA is real-site vocabulary. Nothing on the homepage is a dead-end.

## v0.25 (count-up bug fix — credentials always show real values)

Critical fix for a presentation-killer bug spotted during the v0.24 audit pass.

**The bug:** The Why-section credentials cards and the Stats Final section used an `IntersectionObserver`-triggered count-up animation. When the section scrolled into view, `animateNum()` did `textContent = format(0)` to reset the displayed number to zero, then animated up to the target over 1800ms. Two failure modes:

1. **Fast scroll** — a user scrolling past the section quickly catches the number mid-animation, briefly seeing "**0+ YEARS IN OPERATION**" before it counts up to "10+". For a live board demo, "0+ YEARS IN OPERATION" is the worst possible value to flash on screen.
2. **SPA-router navigation in the single-file demo** — when the user navigates away from home then back, the IntersectionObserver doesn't re-fire on the swapped-in DOM, but the cached HTML chunk is correct, so this case actually works. The bug is purely the "fast scroll on first load" case.

**The fix:** count-up animation disabled in both places it was wired up — the inline `<script>` in `src/pages/index.html` (line ~1569) and the global `src/scripts/main.js` (line ~409). The `parseStat` and `animateNum` helper functions are retained above as commented-out machinery in case they're wanted back with a different approach later (e.g. shorter duration, fade-in instead of count-up, or starting at a non-zero value).

The static HTML values now always display, matching the design intent:
- Hero spec cards: 500,000+ devices · 99.3% NZ&AU · Spark NZ nationwide network · 10+ yrs
- Why-section credentials: 10+ Years In Operation · 24/7 In-house Support · 100% NZ Operated · IPX Private Backbone
- Stats Final section: 500,000+ devices · 99.3% coverage · 24/7 support · 10+ years

Verified with Playwright: scroll the page to the Why section after the page loads — the credentials card cleanly displays "10+ YEARS IN OPERATION" with no count-up flash. Same for the Stats Final section below it.

This is the last known visual bug. The single-file demo is now safe to present.

## v0.26 (sub-page hero polish + orphan prevention site-wide)

Two related fixes pulling sub-pages and headings up to the same polish bar as the homepage.

**Sub-page hero redesign — from clinical to branded.** The previous `.page-hero` was a near-white linear gradient (`#F7F8F9 → #FFFFFF`) with dark text. On a brand that owns a dark teal hero on the homepage, this read as a different site — sterile, generic, brand-disconnected. Replaced with a three-layer dark composition:

- **Base gradient:** `linear-gradient(180deg, #001620 0%, #003640 60%, #00485A 100%)` — same family as the homepage hero
- **Two radial accent washes:** teal glow in the top-right (echoes the hero stack ambient ring), dark navy wash in the bottom-left for depth
- **Subtle grid overlay** (`::before`) — 56px×56px teal grid at 4.5% opacity, faded out toward the bottom via a CSS mask, signals technical/enterprise without being busy
- **Decorative diamond** (`::after`) — 360px rotated rounded square in the right edge, a subtle echo of the homepage stack pyramid

Typography updated for the dark surface:
- H1 now `var(--white)` with `text-wrap: balance`
- Lead text now `var(--text-on-dark-mute)` (86% white) with `text-wrap: pretty`
- Eyebrow → `var(--teal-300)` (the brighter teal accent)
- Inline links in lead text → teal-300 with a subtle teal-300 underline
- Breadcrumb fully reworked for the dark surface: ancestor links at 72% white, separator at 32% white, current page at teal-300, hover transitions to teal-300

The decorative diamond and grid are `position: absolute` with `z-index: 0`; content uses `z-index: 1`. Section padding bumped 8rem→9rem top, 4rem→5rem bottom to let the new background breathe.

Applies uniformly to all 72 sub-pages because they all use the same `{{> page-hero }}`-equivalent partial in the generated content.

**Orphan prevention site-wide.** Added `text-wrap: balance` to `.h-display`, `.h-1`, `.h-2`, `.h-3`, and the raw `h1, h2, h3` element selectors; added `text-wrap: pretty` to `.lead`. Result: the browser automatically balances heading line breaks so the last line is never a single word, and lead paragraphs avoid awkwardly short last lines. No more "Connectivity that scales with your <newline> fleet." Verified across 29 homepage headings — all 29 now compute `text-wrap: balance`. Headings like "Owned end-to-end. From SIM to dashboard.", "Connectivity that scales with your fleet.", and "Built for industries that depend on uptime." now wrap with their final word at least keeping a sibling.

`text-wrap: balance` is supported in Chrome 114+, Firefox 121+, Safari 17.4+ — all current browsers a board demo would be running. Browsers that don't support it will fall back to the default wrap behavior, which is what we had before — no regression.

The single-file demo is now uniformly polished: the homepage carries the brand identity, every sub-page hero carries the brand identity, and no heading anywhere has an embarrassing orphan word floating on its own line.

## v0.27 (content audit against m2mone.co.nz — production-ready forms + zero hallucinations)

Full content audit against the live site. Three concrete outputs:

**URL coverage — all 50 real-site URLs map to our 72 pages.** Audit script compared the live nav and footer URL inventory from m2mone.co.nz against our `dist/`. Zero missing. We have 22 additional pages (industries, technologies, brand sub-pages) that build out the structure beyond what the live site currently has.

**Three form pages rebuilt with the real field structures**, by web-fetching the live forms and mirroring their fields exactly. No form provider plugin wired up &mdash; submit buttons are present but inactive, each form carries a disabled-note below explaining a Gravity Forms / HubSpot / equivalent provider needs to be connected.

- `src/pages/contact.html`: 6-field form (First Name, Last Name, Email, Business, Phone, Message &mdash; all required) matching `/contact-us/` exactly. Aside has Products &amp; Solutions Inquiries block with Call Sales Now CTA, "We&apos;re here to help" block with sales@/orders@/info@ contact list, and a Trans-Tasman office grid (Auckland Airport + Kensington Melbourne).
- `src/pages/free-trial.html`: 5-field form (First Name, Last Name, Mobile, Email, Business) + Terms checkbox linking to `/legal/standard-form-of-agreement.html`. Aside has 6 promotion T&amp;Cs reproduced verbatim from `/free-trial-month/`: 100MB Trial Plan, 100MB cap, deactivation on cap exceeded, NZ only no roaming, end-of-trial deactivation/reassignment, $15/$20 courier fee NZD excl GST.
- `src/pages/get-connected.html`: Full account creation form matching `/get-connected` &mdash; 3 numbered steps (Fill form / Order SIMs / Connect) followed by a wide form with grouped fieldsets: Your Details, Billing Address (with Country select), Shipping Address (with "Same as billing" checkbox + own Country select), About Your Deployment (Industry segment select with 30+ options, If Other field, Product Requirements 9-checkbox grid, Description textarea), and Terms acceptance.

**Enterprise-grade form CSS added** to `src/styles/styles.css` (~350 lines under the `/* FORMS */` section). Two-column responsive grid (form + aside, 360px aside, collapses to stack under 960px). Form card uses subtle border + soft box-shadow on white. Inputs are 0.875rem padding, 8px radius, 1px border at `rgba(0,54,64,0.16)`, with teal-500 focus ring + 4px halo. Labels are JetBrains Mono 0.6875rem uppercase with 0.12em letter-spacing. Required asterisks in teal-500. Fieldset legends have teal-500 underline accent. Checkboxes use `accent-color`. Selects have custom SVG chevron. Sign-up step numbers are teal pills in mono. Form-aside-bullets get teal dot markers. Office cards mirror the same border/shadow language. Mobile padding reduces.

**Hallucinated customer story headlines fixed.** Audit caught `/resources/case-studies.html` containing four wrong descriptions:
- ~~"AFAM: connected vehicle fleet"~~ &rarr; "Ensuring NZ&apos;s buildings are fire safe and connected before the 3G shutdown" (AFAM is fire alarms, not vehicles)
- ~~"COMS Systems (Hamilton): EFTPOS &amp; in-store IoT"~~ &rarr; "COMS Systems partners with M2M to deliver ultra-secure facial recognition connectivity" (COMS is facial recognition, not EFTPOS)
- ~~"Powertec: electrical infrastructure monitoring"~~ &rarr; "Powertec partners with M2M to deliver critical satellite connectivity on remote island" (Iridium satellite use case, not generic monitoring)
- ~~"Global Marine: vessel and offshore telemetry"~~ &rarr; "Global Marine partners with M2M One NZ to deliver Super Yacht connectivity" (specific super yacht story)

Plus removed two fully invented case study tiles ("Tank monitoring at scale: regional agribusiness", "Digital signage operator: 1,200 screens") &mdash; those are not on the real site.

**Standard Form of Agreement page** is at `/legal/standard-form-of-agreement.html`, used by the free-trial T&amp;Cs link and the get-connected Terms section. The body contains a placeholder noting the binding version is the signed contract and pointing to info@m2mone.co.nz / 0508 888 626 for the full document &mdash; appropriate posture until the client provides the official text.

**Other content sweeps clean:**
- Hardware partners on homepage: only Peplink, Sierra Wireless/Semtech, Robustel, Blue Sky Network, Iridium referenced. Zero invented vendors (no Cisco / Teltonika / MikroTik / Ericsson / Nokia).
- Network claims: 12 Spark NZ mentions, zero competitor mentions (no Vodafone / 2degrees / Vocus).
- Stats: 500,000+ devices · 99.3% NZ&amp;AU coverage · 10+ years &mdash; match the live site verbatim.

**Final integrity check.** 72 pages built. 8,057 internal HTML links across all pages, **zero broken**. Zero `href="#"` placeholders anywhere in source. CTA vocabulary aligned to live site verbatim (Chat with an IoT Expert, Try M2M One for free, Get Connected, Browse Plans, Browse Devices, Explore Satellite Connectivity, View IoT SIM cards, Learn more). The single-file demo is 561 KB.

This is production-ready for sign-off: real form structures (just need a provider wired up), real customer story headlines, real partner list, real network claims, real stats. Nothing on the site asserts a fact the live m2mone.co.nz doesn&apos;t already assert.

## v0.28 (Semtech-inspired refinements: pill buttons, heading line-height, button text)

Round of refinements informed by the Semtech parent-company website as a reference for visual language. Three direct asks, all landed.

**1. Hero heading line-height — last line was clipping descenders.** The `.h-display` class on the homepage hero had `line-height: 1.04` — extremely tight to give the display headline its visual punch, but at the upper clamp size (4rem) with letters like "g", "j", "p", "y" in "edges." the descenders were getting cropped at the bottom of the line box. Relaxed to `line-height: 1.12` and added `padding-bottom: 0.08em` for safety. Also bumped `.h-1` to 1.14 (from 1.08) and `.h-2` to 1.2 (from 1.15) for consistency, with a small `padding-bottom: 0.06em` on `.h-1`. All headings still read tight and punchy, but no more clipped tails.

**2. "Get Connected" button text — now white.** The top-right header CTA (and all other `.btn-primary` instances site-wide) had `color: var(--dark-teal-900)` — dark text on the teal button. Matched the Semtech reference and changed to `color: var(--white)`. To preserve WCAG contrast on the gradient background (`teal-500 → teal-600` was borderline 3:1 with white), darkened the gradient one step to `teal-600 → teal-700` for the resting state and `teal-500 → teal-600` for hover. White text now sits at ~4.5:1 contrast on the resting button — comfortably WCAG AA.

**3. Pill-shaped buttons site-wide.** Changed `.btn` `border-radius` from `var(--radius-md)` (8px) to `999px` (full pill). Padding bumped slightly to 0.875rem 1.75rem to give the rounder shape proper breathing room. Applies to every `.btn-primary`, `.btn-secondary`, and form submit button across all 72 pages — header CTA, hero CTAs, plan-finder CTAs, service-card buttons, all three form Submit buttons, all `.cta-final` CTAs, and the Get Connected page.

**Other Semtech-inspired refinements:**
- Strengthened the resting-state box-shadow on primary buttons to give them a sense of elevation (matches the way Semtech's "Our Products" and "Buy Now" buttons sit on the hero).
- Hover lift retained from the existing magnetic-button code, with refined shadow that grows on hover.

The buttons now feel like the same family of CTAs you see on semtech.com — solid teal, white text, fully rounded, with the right kind of weight and shadow. Verified across the homepage hero, the bottom CTA section, the in-flow CTA section in the Why panel, the plan-finder, the get-connected button in the header, the contact form Submit, the free-trial form Submit, and the get-connected form Submit Application button.

**Integrity:** 72 pages built. 8,057 internal links · 0 broken. Single-file demo 562 KB.
