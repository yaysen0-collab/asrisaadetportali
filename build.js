// build.js — Firestore'dan statik şahsiyet sayfaları + sitemap.xml üretir.
// Gereksinim: Node 18+ (yerleşik fetch). Ek paket gerekmez.
// Çalıştırma: FIREBASE_PROJECT_ID=xxx node build.js

const fs = require('fs');
const path = require('path');

// ================== AYARLAR (kendinize göre düzenleyin) ==================
const CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID, // Firebase proje kimliği
  collection: 'zatlar',                        // 'zatlar' mı 'people' mı? Kontrol edin
  siteUrl: 'https://asrisaadetportali.vercel.app',
  outDir: 'sahabe',                            // sayfalar /sahabe/ altına yazılır
  cssHref: '/style.css',                       // sitenizin CSS dosyaları (kökte)
  premiumHref: '/premium.css',
  nameFields: ['ad', 'isim', 'name'],          // isim hangi alandaysa o (sırayla denenir)
  bioField: 'bilgi',
  sourceField: null,                           // kaynak alanı varsa adı, yoksa null
  minWords: 80,                                // bu kadar kelimeden azsa noindex
  staticPages: ['/', '/archive', '/timeline', '/genealogy', '/articles', '/faq'],
};
// ==========================================================================

if (!CONFIG.projectId && !process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('FIREBASE_SERVICE_ACCOUNT veya FIREBASE_PROJECT_ID ortam değişkeni gerekli.');
  process.exit(1);
}

// ---- Firestore REST değerlerini düz JS'e çevir ----
function fromValue(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
  if ('mapValue' in v) return fromFields(v.mapValue.fields || {});
  return null;
}
function fromFields(fields) {
  const o = {};
  for (const k of Object.keys(fields)) o[k] = fromValue(fields[k]);
  return o;
}

async function fetchAll() {
  // Yol 1: service account varsa firebase-admin ile oku (kurallardan bağımsız)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const admin = require('firebase-admin');
    const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(creds) });
    const snap = await admin.firestore().collection(CONFIG.collection).get();
    console.log('Service account ile okundu.');
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Yol 2: herkese açık REST API
  const base = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${CONFIG.collection}`;
  const docs = [];
  let pageToken = '';
  do {
    const url = `${base}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Firestore okunamadı (${res.status}). Güvenlik kuralları herkese okumaya açık mı? ${await res.text()}`);
    }
    const json = await res.json();
    for (const d of json.documents || []) {
      docs.push({ id: d.name.split('/').pop(), ...fromFields(d.fields || {}) });
    }
    pageToken = json.nextPageToken || '';
  } while (pageToken);
  return docs;
}

// ---- Yardımcılar ----
const clean = (s) => {
  if (s == null) return '';
  const t = String(s).trim();
  return t === '?' ? '' : t;
};
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function slugify(text) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u', Ç: 'c', Ğ: 'g', İ: 'i', I: 'i', Ö: 'o', Ş: 's', Ü: 'u', Â: 'a', Î: 'i', Û: 'u' };
  return text
    .replace(/\(.*?\)/g, '')            // (ra) gibi ekleri at
    .replace(/['’‘´`ʿʾʻ]/g, '')         // apostrof/ayın işaretlerini sil (Mus’ab → musab)
    .replace(/[çğıöşüâîûÇĞİIÖŞÜÂÎÛ]/g, (c) => map[c])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getName(p) {
  for (const f of CONFIG.nameFields) if (clean(p[f])) return clean(p[f]);
  return '';
}
const wordCount = (s) => (s ? s.split(/\s+/).filter(Boolean).length : 0);
const shorten = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');

// ---- Sayfa şablonu ----
function renderPage(p, ctx) {
  const name = p._name;
  const bio = clean(p[CONFIG.bioField]);
  const url = `${CONFIG.siteUrl}/${CONFIG.outDir}/${p._slug}`;
  const title = `${name.replace(/\s*\(.*?\)\s*/g, ' ').trim()}: Hayatı ve Nesebi | Asr-ı Saadet Portalı`;
  const description = shorten(bio || `${name} hakkında Asr-ı Saadet Portalı'nda bilgi.`, 155);

  const link = (id, fallbackText) => {
    const rel = id && ctx.byId.get(id);
    if (rel) return `<a href="/${CONFIG.outDir}/${rel._slug}">${esc(rel._name)}</a>`;
    return fallbackText ? esc(fallbackText) : '';
  };
  const list = (ids) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => link(id))
      .filter(Boolean)
      .join(', ');

  const rows = [
    ['Dönem', esc(clean(p.devir))],
    ['Baba', link(p.babaId, clean(p.baba))],
    ['Anne', link(p.anneId, clean(p.anne))],
    ['Eş(ler)', list(p.esIds) || esc(clean(p.es))],
    ['Çocuklar', list(p.cocukIds)],
  ].filter(([, v]) => v);

  const paragraphs = bio
    .split(/\n+/)
    .filter(Boolean)
    .map((t) => `<p>${esc(t)}</p>`)
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    description,
    url,
    mainEntityOfPage: url,
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: CONFIG.siteUrl + '/' },
      { '@type': 'ListItem', position: 2, name: 'Arşiv', item: CONFIG.siteUrl + '/archive' },
      { '@type': 'ListItem', position: 3, name, item: url },
    ],
  };

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${p._indexable ? 'index, follow' : 'noindex, follow'}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta name="theme-color" content="#f3efe5">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${CONFIG.cssHref}">
<link rel="stylesheet" href="${CONFIG.premiumHref}">
<style>
.person-page{width:min(820px,100%);margin:0 auto;padding:clamp(2rem,5vw,4rem) clamp(1.25rem,4vw,2rem) clamp(3rem,6vw,5rem)}
.person-crumbs{margin:0 0 1.5rem;color:var(--muted);font-size:.74rem;letter-spacing:.04em}
.person-crumbs a{color:var(--brass-text);text-decoration:none}
.person-crumbs a:hover{text-decoration:underline}
.person-page h1{margin:0 0 1.5rem;color:var(--forest);font-family:var(--display);font-size:clamp(2rem,5vw,3.2rem);font-weight:600;line-height:1.15}
.person-meta{display:grid;grid-template-columns:max-content 1fr;gap:.55rem 1.5rem;margin:0 0 2rem;padding:1.2rem 1.4rem;background:var(--paper-light);border:1px solid var(--line)}
.person-meta dt{color:var(--brass-text);font-size:.66rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding-top:.2rem}
.person-meta dd{margin:0;color:var(--ink);font-size:.92rem}
.person-meta a,.person-bio a{color:var(--brass-text);text-underline-offset:3px}
.person-bio p{margin:0 0 1.15rem;color:var(--ink);font-size:1rem;line-height:1.85}
.person-back{display:inline-block;margin-top:1.5rem;color:var(--brass-text);font-size:.74rem;letter-spacing:.1em;text-decoration:none;text-transform:uppercase}
</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
</head>
<body>
<header class="site-nav">
  <div class="nav-row">
    <a class="brand" href="/">
      <span class="brand-mark"><img src="/images/logo-mark.svg" alt="" width="38" height="44"></span>
      <span class="brand-copy"><strong>Asr-ı Saadet Portalı</strong><small>İslam tarihi ve Ashab-ı Kiram arşivi</small></span>
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-links"><span></span><span></span><span></span><b>Menü</b></button>
    <nav class="nav-links" id="nav-links" aria-label="Ana menü">
      <a href="/">Ana Sayfa</a>
      <a href="/archive">Arşiv</a>
      <a href="/timeline">Zaman Çizelgesi</a>
      <a href="/genealogy">Soyağacı</a>
      <a href="/random">Rastgele Şahsiyet</a>
      <a href="/articles">Makaleler</a>
    </nav>
  </div>
</header>
<main class="person-page">
  <nav class="person-crumbs" aria-label="breadcrumb"><a href="/">Ana Sayfa</a> › <a href="/archive">Arşiv</a> › ${esc(name)}</nav>
  <article>
    <h1>${esc(name)}</h1>
    ${rows.length ? `<dl class="person-meta">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}
    <div class="person-bio">
    ${paragraphs || '<p>Bu şahsiyet için içerik hazırlanıyor.</p>'}
    </div>
  </article>
  <a class="person-back" href="/archive">← Arşive dön</a>
</main>
<footer class="site-footer">
  <div class="footer-half footer-intro">
    <div>
      <p class="brand">Asr-ı Saadet Portalı</p>
      <p>Ashâb-ı Kirâm'ın hayatlarını, nesep bağlarını ve çağın izlerini belgeleyen bağımsız dijital arşiv.</p>
    </div>
    <small>© 2026 · Tüm hakları saklıdır</small>
  </div>
  <div class="footer-half footer-links">
    <div>
      <h3>Hızlı Erişim</h3>
      <a href="/">Ana Sayfa</a>
      <a href="/archive">Arşiv</a>
      <a href="/timeline">Zaman Çizelgesi</a>
      <a href="/genealogy">Soyağacı</a>
      <a href="/random">Rastgele Şahsiyet</a>
      <a href="/articles">Makaleler</a>
      <a href="/faq">S.S.S.</a>
    </div>
    <div>
      <h3>Hakkında</h3>
      <p>Klasik İslâm kaynaklarından derlenen açık erişimli arşiv.</p>
    </div>
  </div>
</footer>
<script>
(function(){var n=document.querySelector('.site-nav'),b=document.querySelector('.menu-toggle');
if(n&&b)b.addEventListener('click',function(){var o=n.classList.toggle('menu-open');b.setAttribute('aria-expanded',o?'true':'false');});})();
</script>
</body>
</html>`;
}

// ---- Ana akış ----
(async () => {
  const docs = await fetchAll();
  console.log(`${docs.length} kayıt okundu.`);

  const people = docs.filter((d) => getName(d));
  const skipped = docs.length - people.length;
  if (skipped) console.warn(`UYARI: ${skipped} kaydın ismi bulunamadı (nameFields kontrol edin), atlandı.`);

  // Slug üret, çakışmada id'nin başını ekle
  const used = new Set();
  for (const p of people) {
    p._name = getName(p);
    let slug = slugify(p._name) || p.id.toLowerCase();
    if (used.has(slug)) slug = `${slug}-${p.id.slice(0, 4).toLowerCase()}`;
    used.add(slug);
    p._slug = slug;

    const bio = clean(p[CONFIG.bioField]);
    const hasSource = CONFIG.sourceField ? !!clean(p[CONFIG.sourceField]) : true;
    p._indexable = wordCount(bio) >= CONFIG.minWords && hasSource;
  }

  const ctx = { byId: new Map(people.map((p) => [p.id, p])) };

  fs.rmSync(CONFIG.outDir, { recursive: true, force: true });
  fs.mkdirSync(CONFIG.outDir, { recursive: true });
  for (const p of people) {
    fs.writeFileSync(path.join(CONFIG.outDir, `${p._slug}.html`), renderPage(p, ctx));
  }

  // sitemap.xml — sadece yeterli içeriği olan sayfalar
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    ...CONFIG.staticPages.map((u) => CONFIG.siteUrl + u),
    ...people.filter((p) => p._indexable).map((p) => `${CONFIG.siteUrl}/${CONFIG.outDir}/${p._slug}`),
  ];
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync('sitemap.xml', sitemap);

  const idx = people.filter((p) => p._indexable).length;
  console.log(`${people.length} sayfa üretildi: ${idx} index, ${people.length - idx} noindex (içerik yetersiz).`);
  console.log(`sitemap.xml: ${urls.length} URL.`);
})().catch((e) => {
  // Build'i düşürme: sayfa üretilemezse mevcut site olduğu gibi yayınlanır.
  console.warn('UYARI: Şahsiyet sayfaları üretilemedi, mevcut site yayınlanıyor.');
  console.warn(String(e && e.message ? e.message : e));
  process.exit(0);
});
