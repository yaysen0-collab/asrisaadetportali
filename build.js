// build.js — Firestore'dan statik şahsiyet sayfaları, site-data.json, makale verisi ve sitemap.xml üretir.
// Gereksinim: Node 18+ (yerleşik fetch).
//
// Veri kaynağı sırası (ilk çalışan kullanılır):
//   1. FIREBASE_SERVICE_ACCOUNT  → firebase-admin (App Check ve kurallardan etkilenmez — ÖNERİLEN)
//   2. Firestore REST API        → App Check "Enforce" açıksa 403 verir
//   3. Canlı sitedeki /site-data.json (önceki başarılı derlemenin verisi)
//   4. Hiçbiri olmazsa derleme YİNE DE tamamlanır; şahsiyet sayfaları atlanır, site verileri
//      tarayıcıda doğrudan Firestore'dan okur. (Eskiden derleme tamamen duruyordu.)

const fs = require('fs');
const path = require('path');

// ================== AYARLAR (kendinize göre düzenleyin) ==================
const CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'tarihizatlar', // Açık koleksiyon; gerekirse Vercel değişkeniyle geçersiz kılınabilir
  collection: 'zatlar',                        // 'zatlar' mı 'people' mı? Kontrol edin
  // Site adresi tek yerden gelir: site.config.json (veya Vercel'de SITE_URL ortam değişkeni).
  siteUrl: (process.env.SITE_URL || require('./site.config.json').siteUrl).replace(/\/+$/, ''),
  outDir: 'public/sahabe',                     // statik sayfalar Astro public alanına yazılır
  urlPath: 'sahabe',                           // canlı URL yolu
  cssHref: '/style.css',                       // sitenizin CSS dosyaları (kökte)
  premiumHref: '/premium.css',
  nameFields: ['ad', 'isim', 'name'],          // isim hangi alandaysa o (sırayla denenir)
  bioField: 'bilgi',
  sourceField: null,                           // kaynak alanı varsa adı, yoksa null
  minWords: 80,                                // bu kadar kelimeden azsa noindex
  staticPages: ['/', '/archive', '/timeline', '/genealogy', '/articles', '/faq', '/sources'],
};
// ==========================================================================

if (!CONFIG.projectId && !process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('FIREBASE_SERVICE_ACCOUNT veya FIREBASE_PROJECT_ID ortam değişkeni gerekli.');
  process.exit(1);
}

// GitHub web sitesinden "Upload files" ile dosya seçerek yükleme yapılırsa klasörler kaybolur ve
// bütün dosyalar kök dizine düşer. Derleme sunucusunda (yalnızca Vercel'in geçici kopyasında, GitHub'daki
// dosyalara dokunmadan) dosyaları doğru klasörlerine geri taşıyarak derlemeyi kurtarırız.
const PROJE_DUZENI = [ "public/extra.css", "public/googleaac4de83a69f4b73.html", "public/images/apple-touch-icon.png", "public/images/favicon-16.png", "public/images/favicon-192.png", "public/images/favicon-32.png", "public/images/favicon-512.png", "public/images/favicon.ico", "public/images/favicon.svg", "public/images/logo-mark.svg", "public/images/logo.png", "public/metin-duzelt.js", "public/preferences.js", "public/premium.css", "public/robots.txt", "public/script.js", "public/site.webmanifest", "public/sitemap.xml", "public/style.css", "public/ui.js", "src/components/LegacyPage.astro", "src/data/articles.json", "src/data/faq.json", "src/data/makaleler.mjs", "src/layouts/SiteLayout.astro", "src/pages/account.astro", "src/pages/admin.astro", "src/pages/archive.astro", "src/pages/articles.astro", "src/pages/changelog.astro", "src/pages/contribute.astro", "src/pages/faq.astro", "src/pages/genealogy.astro", "src/pages/index.astro", "src/pages/login.astro", "src/pages/makaleler/[slug].astro", "src/pages/privacy.astro", "src/pages/random.astro", "src/pages/search.astro", "src/pages/sources.astro", "src/pages/timeline.astro" ];
(function klasorleriOnar() {
  if (fs.existsSync(path.join(__dirname, 'src', 'pages'))) return;
  let tasinan = 0;
  for (const hedef of PROJE_DUZENI) {
    const kaynak = path.join(__dirname, path.basename(hedef));
    const yeni = path.join(__dirname, hedef);
    if (!fs.existsSync(kaynak) || fs.existsSync(yeni)) continue;
    fs.mkdirSync(path.dirname(yeni), { recursive: true });
    fs.renameSync(kaynak, yeni);
    tasinan++;
  }
  console.warn(`UYARI: Dosyalar GitHub'a klasörsüz yüklenmiş. Derleme için ${tasinan} dosya doğru klasöre taşındı.`);
  console.warn('       Site çalışır; yine de bir sonraki yüklemede klasörleri (src/, public/) sürükleyip bırakın.');
})();

// Onarımdan sonra hâlâ eksik varsa ne yapılacağını söyleyerek dur.
for (const gerekli of ['src/pages', 'src/layouts', 'src/data/articles.json', 'public/script.js']) {
  if (!fs.existsSync(path.join(__dirname, gerekli))) {
    console.error(`HATA: "${gerekli}" bulunamadı. Proje GitHub'a klasör yapısı olmadan (tüm dosyalar kök dizinde) yüklenmiş.`);
    console.error('      Çözüm: zip içindeki src/ ve public/ KLASÖRLERİNİ olduğu gibi yükleyin (GitHub → Add file → Upload files → klasörleri sürükleyip bırakın)');
    console.error('      ya da değişiklikleri git ile gönderin. Ayrıntı: README.md');
    process.exit(1);
  }
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

async function fetchAll(collection = CONFIG.collection) {
  // Yol 1: service account varsa firebase-admin ile oku (kurallardan bağımsız)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(creds) });
    }
    const snap = await admin.firestore().collection(collection).get();
    console.log('Service account ile okundu.');
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Yol 2: herkese açık REST API
  const base = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${collection}`;
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
function bioText(s) {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();
}
function bioHtml(s) {
  const source = clean(s);
  if (!source) return '';
  if (!/<\/?[a-z][^>]*>/i.test(source)) {
    return source.split(/\n+/).filter(Boolean).map((line) => `<p>${esc(line)}</p>`).join('\n');
  }
  const allowed = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'h3', 'h4', 'span', 'div', 'a']);
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*\/?>/gi, '')
    .replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (tagText, rawName, attrs) => {
      const tag = rawName.toLowerCase();
      if (!allowed.has(tag)) return '';
      if (tag === 'br') return '<br>';
      if (tagText.startsWith('</')) return `</${tag}>`;
      if (tag !== 'a') return `<${tag}>`;
      const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
      if (!hrefMatch) return '<a>';
      const href = hrefMatch[2].trim();
      if (!/^(https?:\/\/|mailto:|\/|#)/i.test(href)) return '<a>';
      return `<a href="${esc(href)}" rel="noopener noreferrer">`;
    });
}

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
  const readableBio = bioText(bio);
  const url = `${CONFIG.siteUrl}/${CONFIG.urlPath}/${p._slug}`;
  const title = `${name.replace(/\s*\(.*?\)\s*/g, ' ').trim()}: Hayatı ve Nesebi | Asr-ı Saadet Portalı`;
  const description = shorten(readableBio || `${name} hakkında Asr-ı Saadet Portalı'nda bilgi.`, 155);

  const link = (id, fallbackText) => {
    const rel = id && ctx.byId.get(id);
    if (rel) return `<a href="/${CONFIG.urlPath}/${rel._slug}">${esc(rel._name)}</a>`;
    return fallbackText ? esc(fallbackText) : '';
  };
  const list = (ids) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => link(id))
      .filter(Boolean)
      .join(', ');

  const rows = [
    ['Dönem', esc(clean(p.devir))],
    ...kinRows(p, ctx.family, (id) => link(id)),
  ].filter(([, v]) => v);
  void list;

  const paragraphs = bioHtml(bio);

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
<link rel="stylesheet" href="/fixes.css">
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
  <p class="person-links"><a class="person-back" href="/genealogy#${encodeURIComponent(p.id)}">Soyağacında gör →</a> <a class="person-back" href="/archive">← Arşive dön</a></p>
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
<script defer src="/metin-duzelt.js"></script>
</body>
</html>`;
}

// ---- Veri kaynağı: Firestore → canlı site yedeği → boş ----
async function liveSnapshot() {
  const url = process.env.FALLBACK_DATA_URL || `${CONFIG.siteUrl}/site-data.json`;
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json.zatlar) || !json.zatlar.length) throw new Error(`${url} boş veya geçersiz`);
  return json;
}
async function loadData() {
  try {
    const [zatlar, olaylar] = await Promise.all([fetchAll(), fetchAll('olaylar')]);
    let makaleler = [];
    try { makaleler = await fetchAll('makaleler'); } catch (e) { console.warn('Makaleler okunamadı (önemsiz):', String(e.message || e).slice(0, 160)); }
    return { kaynak: 'firestore', zatlar, olaylar, makaleler, generatedAt: Date.now() };
  } catch (e) {
    console.warn('UYARI: Firestore okunamadı → ' + String(e.message || e).replace(/\s+/g, ' ').slice(0, 220));
    console.warn('       Kalıcı çözüm: Vercel → Settings → Environment Variables → FIREBASE_SERVICE_ACCOUNT ekleyin (README §4).');
  }
  try {
    const snap = await liveSnapshot();
    const zamanlar = [...snap.zatlar, ...(snap.olaylar || [])].map((d) => Number(d.guncellemeTarihi) || 0);
    console.warn(`       Yedek olarak canlı sitenin verisi kullanıldı (${snap.zatlar.length} şahsiyet).`);
    return {
      kaynak: 'canli-site', zatlar: snap.zatlar, olaylar: snap.olaylar || [], makaleler: snap.makaleler || [],
      generatedAt: snap.generatedAt || Math.max(0, ...zamanlar),
    };
  } catch (e) {
    console.warn('UYARI: Canlı site verisi de alınamadı → ' + String(e.message || e).slice(0, 160));
  }
  return { kaynak: 'yok', zatlar: [], olaylar: [], makaleler: [], generatedAt: 0 };
}

// ---- Akrabalık (statik sayfalar için ID tabanlı, sade sürüm; sitedeki tam hesap script.js'te) ----
const cinsiyetNorm = (z) => {
  const c = String((z && z.cinsiyet) || '').toLocaleLowerCase('tr').replace('ı', 'i');
  if (c === 'erkek' || c === 'kadin') return c;
  const ad = ' ' + String((z && (z.isim || z.ad)) || '') + ' ';
  if (/\s(binti|bint|bintü)\s/i.test(ad) || /^\s*(hz\.?\s*)?ümm/i.test(ad)) return 'kadin';
  if (/\s(bin|ibn|ibni|ibn-i)\s/i.test(ad) || /^\s*(hz\.?\s*)?ebu/i.test(ad)) return 'erkek';
  return null;
};
function buildFamily(people) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const fam = new Map(people.map((p) => [p.id, { parents: new Map(), children: new Set(), spouses: new Set() }]));
  const ids = (v) => (Array.isArray(v) ? v : v ? [v] : []).filter((id) => byId.has(id));
  const link = (child, parent, role) => {
    if (!child || !parent || child === parent || !fam.has(child) || !fam.has(parent)) return;
    const f = fam.get(child);
    if (role && [...f.parents.values()].includes(role) && f.parents.get(parent) !== role) return;
    if (!f.parents.has(parent) && f.parents.size >= 2) return;
    if (!f.parents.get(parent)) f.parents.set(parent, role || null);
    fam.get(parent).children.add(child);
  };
  for (const p of people) {
    ids(p.babaId).forEach((id) => link(p.id, id, 'baba'));
    ids(p.anneId).forEach((id) => link(p.id, id, 'anne'));
  }
  for (const p of people) {
    const g = cinsiyetNorm(p);
    ids(p.cocukIds).forEach((id) => link(id, p.id, g === 'erkek' ? 'baba' : g === 'kadin' ? 'anne' : null));
    ids(p.esIds).forEach((id) => { if (id !== p.id) { fam.get(p.id).spouses.add(id); fam.get(id).spouses.add(p.id); } });
  }
  const siblings = (id) => {
    const out = new Set();
    fam.get(id).parents.forEach((_, pid) => fam.get(pid).children.forEach((c) => { if (c !== id) out.add(c); }));
    return out;
  };
  return { byId, fam, siblings };
}
function kinRows(p, F, link) {
  const f = F.fam.get(p.id);
  if (!f) return [];
  const g = (id) => cinsiyetNorm(F.byId.get(id));
  const lab = (id, e, k, b) => (g(id) === 'erkek' ? e : g(id) === 'kadin' ? k : b);
  const parentOf = (role) => [...f.parents].find(([, r]) => r === role);
  const sib = [...F.siblings(p.id)];
  const uncles = [];
  f.parents.forEach((role, pid) => F.siblings(pid).forEach((u) => {
    if (f.parents.has(u)) return;
    uncles.push(link(u) + ` (${role === 'baba' ? lab(u, 'Amca', 'Hala', 'Babasının kardeşi') : role === 'anne' ? lab(u, 'Dayı', 'Teyze', 'Annesinin kardeşi') : 'Ebeveyninin kardeşi'})`);
  }));
  const grand = [];
  f.parents.forEach((role, pid) => F.fam.get(pid).parents.forEach((_, gid) => grand.push(link(gid) + ` (${lab(gid, 'Dede', 'Nine', 'Dede / nine')}${role ? (role === 'baba' ? ', baba tarafı' : ', anne tarafı') : ''})`)));
  const baba = parentOf('baba'), anne = parentOf('anne');
  return [
    ['Baba', baba ? link(baba[0]) : esc(clean(p.baba))],
    ['Anne', anne ? link(anne[0]) : esc(clean(p.anne))],
    ['Eş(ler)', [...f.spouses].map(link).join(', ') || esc(clean(p.es))],
    ['Çocuklar', [...f.children].map(link).join(', ') || esc(clean(p.cocuklar))],
    ['Kardeşler', sib.map(link).join(', ')],
    ['Amca, hala, dayı, teyze', uncles.join(', ')],
    ['Dede ve nineler', grand.join(', ')],
  ].filter(([, v]) => v && v !== 'Undefined');
}

// ---- Makaleler: src/data/articles.json + Firestore 'makaleler' (yayında olanlar) ----
function mergeArticles(base, fromDb) {
  const out = new Map(base.map((a) => [a.slug, a]));
  for (const m of fromDb || []) {
    if (!m || m.yayinda === false || !m.slug || !m.baslik) continue;
    out.set(m.slug, {
      slug: m.slug, baslik: m.baslik, etiket: m.etiket || 'Makale', ozet: m.ozet || '', govde: m.govde || '',
      image: m.image || '', gorsel: m.gorsel || '', kaynaklar: m.kaynaklar || '', tarih: m.tarih || m.guncellemeTarihi || null,
    });
  }
  return [...out.values()];
}

// Yüklenen kapak görselleri Firestore'da data: URL olarak durur. Derlemede dosyaya çıkarılır ki
// site-data.json ve statik sayfalar şişmesin; görseller CDN'den önbellekli gelir.
function extractArticleImages(list) {
  const dir = path.join('public', 'makale-gorsel');
  fs.rmSync(dir, { recursive: true, force: true });
  return (list || []).map((m) => {
    const match = m && typeof m.gorsel === 'string' && m.gorsel.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
    if (!match || !m.slug) return m;
    fs.mkdirSync(dir, { recursive: true });
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const file = `${String(m.slug).replace(/[^a-z0-9-]/g, '')}.${ext}`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(match[2], 'base64'));
    return { ...m, gorsel: `/makale-gorsel/${file}` };
  });
}

// ---- Ana akış ----
(async () => {
  const veri = await loadData();
  veri.makaleler = extractArticleImages(veri.makaleler);
  const docs = veri.zatlar;
  const events = veri.olaylar;
  console.log(`${docs.length} şahsiyet, ${events.length} olay, ${veri.makaleler.length} makale okundu (kaynak: ${veri.kaynak}).`);

  // Makaleler Astro'dan önce hazırlanır: src/data/articles.generated.json (git'e girmez)
  const baseArticles = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'articles.json'), 'utf8'));
  const allArticles = mergeArticles(baseArticles, veri.makaleler);
  fs.writeFileSync(path.join(__dirname, 'src', 'data', 'articles.generated.json'), JSON.stringify(allArticles, null, 1));

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
    p._indexable = wordCount(bioText(bio)) >= CONFIG.minWords && hasSource;
  }

  // İstemci arşivindeki kayıt kimliklerini bu statik biyografi sayfalarına bağlar.
  fs.mkdirSync('public', { recursive: true });
  fs.writeFileSync(path.join('public', 'sahabe-index.json'), JSON.stringify(
    Object.fromEntries(people.map((p) => [p.id, p._slug]))
  ));
  if (docs.length) {
    fs.writeFileSync(path.join('public', 'site-data.json'), JSON.stringify({
      generatedAt: veri.generatedAt,
      kaynak: veri.kaynak,
      zatlar: docs.map(({ _name, _indexable, ...z }) => z),
      olaylar: events,
      makaleler: (veri.makaleler || []).filter((m) => m && m.yayinda !== false),
      sahabeSayfaYollari: Object.fromEntries(people.map((p) => [p.id, p._slug])),
    }));
  } else {
    fs.rmSync(path.join('public', 'site-data.json'), { force: true });
  }

  const ctx = { byId: new Map(people.map((p) => [p.id, p])), family: buildFamily(people) };

  fs.rmSync(CONFIG.outDir, { recursive: true, force: true });
  fs.mkdirSync(CONFIG.outDir, { recursive: true });
  for (const p of people) {
    fs.writeFileSync(path.join(CONFIG.outDir, `${p._slug}.html`), renderPage(p, ctx));
  }

  // sitemap.xml — sadece yeterli içeriği olan sayfalar
  const today = new Date().toISOString().slice(0, 10);
  const articles = allArticles;
  const urls = [
    ...CONFIG.staticPages.map((u) => CONFIG.siteUrl + u),
    ...articles.map((article) => `${CONFIG.siteUrl}/makaleler/${article.slug}`),
    ...people.filter((p) => p._indexable).map((p) => `${CONFIG.siteUrl}/${CONFIG.urlPath}/${p._slug}`),
  ];
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`;
  fs.mkdirSync('public', { recursive: true });
  fs.writeFileSync(path.join('public', 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join('public', 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${CONFIG.siteUrl}/sitemap.xml\n`);

  const idx = people.filter((p) => p._indexable).length;
  console.log(`${people.length} sayfa üretildi: ${idx} index, ${people.length - idx} noindex (içerik yetersiz).`);
  console.log(`sitemap.xml: ${urls.length} URL.`);
})().catch((e) => {
  console.error('HATA: build.js beklenmedik şekilde durdu:', e);
  process.exit(1);
});
