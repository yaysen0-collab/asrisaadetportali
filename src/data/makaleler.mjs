// Makale listesi: build.js, Firestore'daki yayımlanmış makaleleri articles.json ile birleştirip
// articles.generated.json dosyasına yazar. O dosya yoksa (ör. `astro dev`) articles.json kullanılır.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'src', 'data');

export function makaleleriGetir() {
  for (const ad of ['articles.generated.json', 'articles.json']) {
    const dosya = path.join(DIR, ad);
    if (fs.existsSync(dosya)) return JSON.parse(fs.readFileSync(dosya, 'utf8'));
  }
  return [];
}

export function makaleGorseli(m, genislik = 1100) {
  if (m && m.gorsel) return m.gorsel;
  if (m && m.image) return `https://images.unsplash.com/photo-${m.image}?w=${genislik}&q=70&auto=format&fit=crop`;
  return `https://images.unsplash.com/photo-1720701574998-d68020bce2bd?w=${genislik}&q=70&auto=format&fit=crop`;
}

export function kaynakListesi(m) {
  return String((m && m.kaynaklar) || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
}
