#!/usr/bin/env node
/**
 * build.mjs
 * Tiny static site builder. No dependencies. Single file.
 *
 * What it does:
 *   1. Reads src/pages/*.html  (page-specific content)
 *   2. Wraps each page in src/layouts/base.html
 *   3. Resolves {{> componentName }} include syntax from src/components/
 *   4. Concatenates src/styles/*.css into dist/assets/css/styles.css (in order)
 *   5. Copies src/scripts/*.js to dist/assets/js/
 *   6. Copies public/* verbatim to dist/
 *   7. Reads optional <!--meta key: value--> frontmatter for per-page title/desc/canonical
 *
 * What it does NOT do (intentional):
 * - Bundling, minification, hashing - add when needed (esbuild is one line)
 * - Live reload - see `node server.mjs` for a tiny dev server
 * - Markdown - pages are HTML; add markdown support if useful later
 *
 * Run:
 *   node build.mjs           // builds to dist/
 *   node build.mjs --serve   // builds, then serves dist/ on :3000
 */

import { readFile, writeFile, mkdir, readdir, copyFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, basename, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Optional path prefix for hosting under a sub-directory (e.g. GitHub Project
// Pages at /repo-name/). Empty by default so root-hosted and local dev are
// unaffected. Set via `BASE_PATH=/m2m-one-nz node build.mjs`.
const BASE_PATH  = (process.env.BASE_PATH || '').replace(/\/+$/, '');

const ROOT       = dirname(fileURLToPath(import.meta.url));
const SRC        = join(ROOT, 'src');
const PUBLIC     = join(ROOT, 'public');
const DIST       = join(ROOT, 'dist');

const PAGES      = join(SRC, 'pages');
const LAYOUTS    = join(SRC, 'layouts');
const COMPONENTS = join(SRC, 'components');
const STYLES     = join(SRC, 'styles');
const SCRIPTS    = join(SRC, 'scripts');
const DATA       = join(SRC, 'data');

const INCLUDE_RE  = /\{\{>\s*([\w/-]+)\s*\}\}/g;
const SLOT_RE     = /\{\{\s*content\s*\}\}/;
const VAR_RE      = /\{\{\s*([\w_]+)\s*\}\}/g;
const FRONTMATTER_RE = /^\s*<!--meta\s+([\s\S]*?)-->/;

// Strip HTML comments from partials so we don't ship build-time notes
const COMMENT_RE = /<!--[\s\S]*?-->/;

async function buildPage(file, site) {
  const relPath = relative(PAGES, file);
  const slug = relPath.replace(/\.html$/, '').replace(/\\/g, '/');
  let pageContent = await readFile(file, 'utf8');

  // Remove leading documentation comment if present (anything between <!-- and --> at the start)
  const docCommentMatch = pageContent.match(/^\s*<!--(?!meta)[\s\S]*?-->\s*\n/);
  if (docCommentMatch) {
    pageContent = pageContent.slice(docCommentMatch[0].length);
  }

  // Parse frontmatter
  const meta = { title: site.defaultTitle, description: site.defaultDescription };
  const fm = pageContent.match(FRONTMATTER_RE);
  if (fm) {
    pageContent = pageContent.slice(fm[0].length);
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^\s*([\w_]+)\s*:\s*(.+?)\s*$/);
      if (m) meta[m[1]] = m[2];
    }
  }
  meta.canonical = meta.canonical || `${site.url}/${slug === 'index' ? '' : slug}`;

  // Resolve component includes in the page body
  const expanded = await expandIncludes(pageContent, 0);

  // Wrap in layout
  const layoutFile = join(LAYOUTS, 'base.html');
  let html = await readFile(layoutFile, 'utf8');
  // Strip the documentation comment at the top of base.html
  html = html.replace(/^\s*<!--[\s\S]*?-->\s*\n/, '');
  html = html.replace(SLOT_RE, expanded);

  // Substitute meta variables
  html = html.replace(VAR_RE, (m, key) => {
    if (key in meta) return meta[key];
    return m; // leave untouched if unknown
  });

  // Run includes again in case the layout itself uses any (it doesn't currently, but allow)
  const finalHtml = await expandIncludes(html, 0);

  // Output
  const outName = slug === 'index' ? 'index.html' : `${slug}.html`;
  const outPath = join(DIST, outName);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, finalHtml);
  return { slug, path: outPath, size: finalHtml.length };
}

async function expandIncludes(html, depth) {
  if (depth > 8) throw new Error('Include depth exceeded (cycle?)');
  const matches = [...html.matchAll(INCLUDE_RE)];
  if (!matches.length) return html;
  for (const m of matches) {
    const name = m[1];
    const file = join(COMPONENTS, `${name}.html`);
    if (!existsSync(file)) {
      console.warn(`  ! include not found: ${name} (skipping)`);
      html = html.replace(m[0], '');
      continue;
    }
    let part = await readFile(file, 'utf8');
    // Strip the leading documentation comment
    part = part.replace(COMMENT_RE, '').trim();
    // Recurse
    part = await expandIncludes(part, depth + 1);
    html = html.replace(m[0], part);
  }
  return html;
}

async function buildCSS() {
  const files = (await readdir(STYLES))
    .filter((f) => f.endsWith('.css'))
    // Order: tokens.css first (no number), then everything else alphabetical.
    // tokens defines variables that everything else uses.
    .sort((a, b) => {
      if (a === 'tokens.css') return -1;
      if (b === 'tokens.css') return 1;
      return a.localeCompare(b);
    });
  let combined = '';
  for (const f of files) {
    const c = await readFile(join(STYLES, f), 'utf8');
    combined += `\n/* ===== ${f} ===== */\n${c}\n`;
  }
  await mkdir(join(DIST, 'assets/css'), { recursive: true });
  await writeFile(join(DIST, 'assets/css/styles.css'), combined);
  return { files: files.length, size: combined.length };
}

async function copyJS() {
  await mkdir(join(DIST, 'assets/js'), { recursive: true });
  let total = 0;
  const files = (await readdir(SCRIPTS)).filter((f) => f.endsWith('.js'));
  for (const f of files) {
    await copyFile(join(SCRIPTS, f), join(DIST, 'assets/js', f));
    total += (await stat(join(SCRIPTS, f))).size;
  }
  return { files: files.length, size: total };
}

async function copyDir(src, dst) {
  if (!existsSync(src)) return 0;
  await mkdir(dst, { recursive: true });
  let count = 0;
  for (const e of await readdir(src, { withFileTypes: true })) {
    const s = join(src, e.name);
    const d = join(dst, e.name);
    if (e.isDirectory()) count += await copyDir(s, d);
    else { await copyFile(s, d); count++; }
  }
  return count;
}

// Recursively find page files: .html, not starting with _, anywhere under src/pages/
async function walkPages(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walkPages(p));
    else if (e.name.endsWith('.html') && !e.name.startsWith('_')) out.push(p);
  }
  return out.sort();
}

async function loadSiteData() {
  try { return JSON.parse(await readFile(join(DATA, 'site.json'), 'utf8')); }
  catch { return {}; }
}

async function buildSinglefilePreview(site) {
  // Build a self-contained, interactive single-file demo that:
  //   1. Embeds CSS + JS inline (so it works offline / via file://)
  //   2. Embeds every other page's <main> content as <template data-route="...">
  //   3. Includes a hash-based client-side router that intercepts internal link
  //      clicks and swaps <main> content
  // Output: dist/m2m-homepage.html
  const indexFile = join(DIST, 'index.html');
  const cssFile   = join(DIST, 'assets/css/styles.css');
  const jsFile    = join(DIST, 'assets/js/main.js');
  if (!existsSync(indexFile)) return null;

  let html = await readFile(indexFile, 'utf8');
  if (existsSync(cssFile)) {
    const css = await readFile(cssFile, 'utf8');
    html = html.replace(
      /<link rel="stylesheet" href="\/assets\/css\/styles\.css"\s*\/?>/,
      `<style>\n${css}\n</style>`
    );
  }
  if (existsSync(jsFile)) {
    const js = await readFile(jsFile, 'utf8');
    html = html.replace(
      /<script src="\/assets\/js\/main\.js" defer><\/script>/,
      `<script>\n${js}\n</script>`
    );
  }
  // Rewrite asset URLs that remain (e.g. images) to relative paths
  html = html.replace(/="\/assets\//g, '="assets/');

  // ----- Embed every other page as a route template -----
  const MAIN_RE  = /<main id="main">([\s\S]*?)<\/main>/;
  const TITLE_RE = /<title>([\s\S]*?)<\/title>/;
  const allPages = await walkPages(PAGES);
  const routes = [];
  for (const srcFile of allPages) {
    // Compute the dist file path
    const slug = relative(PAGES, srcFile).replace(/\\/g, '/').replace(/\.html$/, '');
    const distFile = join(DIST, slug === 'index' ? 'index.html' : `${slug}.html`);
    if (!existsSync(distFile)) continue;
    if (distFile === indexFile) continue;  // homepage is the base shell
    const pageHtml = await readFile(distFile, 'utf8');
    const mainMatch = pageHtml.match(MAIN_RE);
    if (!mainMatch) continue;
    const titleMatch = pageHtml.match(TITLE_RE);
    const title = titleMatch ? titleMatch[1].trim() : '';
    // Canonical URL: /index → /, /xxx/index → /xxx/, otherwise /xxx.html
    let route;
    if (slug.endsWith('/index')) route = '/' + slug.slice(0, -'index'.length);
    else route = '/' + slug + '.html';
    routes.push({ route, title, main: mainMatch[1] });
  }

  const templateHtml = routes.map(r =>
    `<template data-route="${r.route}" data-title="${(r.title || '').replace(/"/g, '&quot;')}">${r.main}</template>`
  ).join('\n');

  const routerScript = `
<script>
(function(){
  // Single-file site demo router. Hash-based, intercepts internal link clicks.
  var mainEl = document.getElementById('main');
  if (!mainEl) { console.warn('No <main id="main">; router disabled'); return; }
  var homepageMain = mainEl.innerHTML;
  var homepageTitle = document.title;
  var routes = Object.create(null);
  routes['/'] = { html: homepageMain, title: homepageTitle };
  document.querySelectorAll('template[data-route]').forEach(function(t){
    routes[t.getAttribute('data-route')] = { html: t.innerHTML, title: t.getAttribute('data-title') || homepageTitle };
  });
  function normalize(p){
    if (!p) return '/';
    var qi = p.indexOf('?'); if (qi !== -1) p = p.slice(0, qi);
    var hi = p.indexOf('#'); if (hi !== -1) p = p.slice(0, hi);
    if (p === '' || p === '/') return '/';
    if (p.endsWith('/index.html')) return p.slice(0, p.length - 'index.html'.length);
    return p;
  }
  function setRoute(rawPath, push){
    var path = normalize(rawPath);
    var entry = routes[path] || routes[path + 'index.html'];
    if (!entry) { console.warn('Demo router: no route for', rawPath, '(normalized:', path, ')'); return; }
    mainEl.innerHTML = entry.html;
    if (entry.title) document.title = entry.title;
    if (push) {
      var displayPath = path === '/' ? location.pathname + location.search : '#' + path;
      try { history.pushState({path: path}, entry.title || '', displayPath); } catch(e){}
    }
    window.scrollTo({top: 0, left: 0, behavior: 'auto'});
    var drawer = document.getElementById('nav-drawer');
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      var toggle = document.querySelector('[data-nav-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('drawer-open');
    }
    document.querySelectorAll('.nav-toplevel[aria-expanded="true"]').forEach(function(b){
      b.setAttribute('aria-expanded','false');
    });
  }
  document.addEventListener('click', function(e){
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (href.startsWith('#')) return;
    e.preventDefault();
    setRoute(href, true);
  }, true);
  window.addEventListener('popstate', function(e){
    var path = (location.hash && location.hash.length > 1) ? location.hash.slice(1) : '/';
    setRoute(path, false);
  });
  if (location.hash && location.hash.length > 1) {
    var initial = location.hash.slice(1);
    if (initial && initial !== '/') setRoute(initial, false);
  }
  document.documentElement.setAttribute('data-demo', 'router-v1');
  console.log('M2M One NZ site demo:', Object.keys(routes).length, 'routes');
})();
</script>`;

  const injection = '\n<!-- DEMO ROUTES -->\n' + templateHtml + '\n<!-- END DEMO ROUTES -->\n' + routerScript;
  html = html.replace('</body>', injection + '\n</body>');

  const out = join(DIST, 'm2m-homepage.html');
  await writeFile(out, html);
  return { path: out, size: html.length, routes: routes.length + 1 };
}

// Prefix root-absolute href/src values with BASE_PATH across the built pages.
// Skips the single-file demo (m2m-homepage.html): it is self-contained and its
// links are resolved by an in-page router keyed on unprefixed routes.
async function applyBasePath() {
  const files = (await walkDist(DIST)).filter(
    (f) => f.endsWith('.html') && basename(f) !== 'm2m-homepage.html'
  );
  const re = /(\b(?:href|src)=")\/(?!\/)/g;
  let count = 0;
  for (const f of files) {
    const html = await readFile(f, 'utf8');
    const out = html.replace(re, `$1${BASE_PATH}/`);
    if (out !== html) { await writeFile(f, out); count++; }
  }
  return { files: count };
}

async function walkDist(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walkDist(p));
    else out.push(p);
  }
  return out;
}

async function build() {
  const t0 = Date.now();
  console.log('build.mjs - m2m-site\n');

  if (existsSync(DIST)) await rm(DIST, { recursive: true });
  await mkdir(DIST, { recursive: true });

  const site = await loadSiteData();

  const publicCount = await copyDir(PUBLIC, DIST);
  console.log(`  public/        copied ${publicCount} file${publicCount !== 1 ? 's' : ''}`);

  const cssResult = await buildCSS();
  console.log(`  styles         ${cssResult.files} files merged → assets/css/styles.css (${(cssResult.size/1024).toFixed(1)} KB)`);

  const jsResult = await copyJS();
  console.log(`  scripts        ${jsResult.files} file${jsResult.files !== 1 ? 's' : ''} copied → assets/js/ (${(jsResult.size/1024).toFixed(1)} KB)`);

  const pageFiles = await walkPages(PAGES);
  console.log(`\n  pages:`);
  for (const p of pageFiles) {
    const r = await buildPage(p, site);
    console.log(`    ✓ ${r.slug.padEnd(34)} → ${relative(DIST, r.path)} (${(r.size/1024).toFixed(1)} KB)`);
  }

  const preview = await buildSinglefilePreview(site);
  if (preview) {
    console.log(`\n  single-file demo → m2m-homepage.html (${(preview.size/1024).toFixed(1)} KB, ${preview.routes} routes)`);
  }

  if (BASE_PATH) {
    const rewritten = await applyBasePath();
    console.log(`\n  base path      "${BASE_PATH}" applied to ${rewritten.files} page${rewritten.files !== 1 ? 's' : ''}`);
  }

  console.log(`\n  done in ${Date.now() - t0}ms\n`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
