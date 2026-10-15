/* ==========================================================================
   Asr-ı Saadet Portalı — script.js  (yeni tasarım için)
   - index.html içindeki <main id="app"> alanına tüm sayfaları çizer.
   - Firebase'i kendisi yükler (ayrıca <script> eklemenize gerek yok).
   - Veri: Firestore "zatlar" ve "olaylar" koleksiyonları (eski alan adlarıyla).
   - Sayfalar: #home #archive #timeline #genealogy #random #articles #faq #login #admin
   ========================================================================== */

const FIREBASE_SURUM = "10.8.0";
const FB = (p) => `https://www.gstatic.com/firebasejs/${FIREBASE_SURUM}/${p}.js`;
const yukle = (url) => import(url);

const firebaseConfig = {
  apiKey: "AIzaSyCrrD1XRInE3Er47ZRl28rUo_Pk7FZAyss",
  authDomain: "tarihizatlar.firebaseapp.com",
  projectId: "tarihizatlar",
  storageBucket: "tarihizatlar.firebasestorage.app",
  messagingSenderId: "930648787998",
  appId: "1:930648787998:web:db163d0f3811786610b20f",
};
const ADMIN_EMAILS = ["asrisaadetportali@gmail.com", "zeynepglfm@gmail.com"];

/* Hoş geldin penceresinin arka plan rengi. İstediğiniz rengi yazabilirsiniz: "#14261f", "#5d4037", "var(--forest)"… */
const KARSILAMA_ARKAPLAN = "var(--forest, #14261f)";

const HOSGELDIN_MESAJLARI = {
  "asrisaadetportali@gmail.com": "Hoşgeldin patron, koltuk hazır, ekip hazır, başarı zaten seninle geliyor. Her şeyin üstesinden gelebilirsin.",
  "zeynepglfm@gmail.com": "Hoş geldin ortak! Enerjini topladıysan sahne senin. Birlikte bu projeyi yukarılara taşıyalım. (Not: Seni çok seviyorum)"
};
const FORMSPREE_URL = "https://formspree.io/f/xaeygoey";

/* ==========================================================================
   APP CHECK — Firebase Console'da App Check "Enforce" (zorunlu) ise BURAYI DOLDURUN.
   Aksi hâlde site kayıtları okuyamaz ("Missing or insufficient permissions").
   - APPCHECK_SITE_KEY: reCAPTCHA SİTE anahtarı (herkese açık olandır; gizli anahtar DEĞİL).
   - APPCHECK_SAGLAYICI: Firebase'de hangisini kaydettiyseniz: "enterprise" (reCAPTCHA Enterprise, önerilen)
     veya "v3" (reCAPTCHA v3).
   - Anahtardaki izinli alan adları listesinde sitenin TÜM adresleri olmalı (asrisaadetportali.vercel.app
     ve bağlanan özel alan adı, ör. ornek.com ve www.ornek.com). Ayrıntı: README.md → "Alan adı bağlama".
   ========================================================================== */
const APPCHECK_SITE_KEY = "6LdsjcQtAAAAAFp6f2q_EhytHJdhcrFClu9wBgSG";
const APPCHECK_SAGLAYICI = "enterprise";

/* Firebase nesneleri baslat() içinde doldurulur */
let FS = null, AU = null, db = null, auth = null;
let sahabeSayfaYollari = {};
function sahabeSayfaUrl(id) {
  const slug = sahabeSayfaYollari[id];
  return slug ? `/sahabe/${encodeURIComponent(slug)}` : `#archive/zat-${encodeURIComponent(id)}`;
}

/* ---------- Sabit içerik ---------- */
const FOTO = {
  dome: "1776893761976-03f46ce701df",
  manuscript: "1720701574998-d68020bce2bd",
  calligraphy: "1696513553729-17129c427356",
  tiles: "1558114965-eeb97aa84c3b",
  manuscript2: "1720701575003-51dafcf39cb4",
  ornate: "1720700955600-a21cd215d1a3",
};
const foto = (k) => `https://images.unsplash.com/photo-${FOTO[k]}?w=1100&q=62&auto=format&fit=crop`;

const DEVIRLER = ["Asr-ı Saadet", "Hulefâ-yi Râşidîn", "Emeviler", "Abbasiler", "Endülüs", "Diğer"];
const HIZLI_ETIKETLER = ["Ebu Bekir", "Ömer", "Osman", "Ali", "Bedir", "Hamza"];

const SSS = [
  ["Bu projenin temel amacı nedir?", "Asr-ı Saadet döneminde yaşamış Ashab-ı Kiram'a ait biyografik bilgileri, akrabalık ve sosyal ilişkileri sistemli bir yapıda sunarak tarihsel bilginin daha anlaşılır ve erişilebilir hâle getirilmesini sağlamaktır."],
  ["Asr-ı Saadet Portalı hangi ihtiyaca cevap vermektedir?", "Ashab-ı Kiram'ın sayıca fazla olması ve bilgilerin farklı kaynaklara dağılmış olması nedeniyle oluşan bilgi karmaşasını gidermeyi amaçlar. Portal, bu bilgileri tek bir dijital platformda toplayarak düzenli ve bütüncül bir yapı sunar."],
  ["Proje hangi tarihsel dönemi kapsamaktadır?", "Proje, Asr-ı Saadet olarak adlandırılan ve Peygamber Efendimiz Muhammed Mustafa (s.a.v.)'in yaşadığı dönemi esas alır. Arşivde Hulefâ-yi Râşidîn, Emeviler, Abbasiler ve Endülüs dönemlerine ait kayıtlar da yer alabilir."],
  ["Portalda yer alan bilgiler hangi kaynaklara dayanmaktadır?", "Klasik İslam tarihi eserleri, siyer kaynakları ve güvenilir akademik çalışmalara dayanır. Her kaydın altında, varsa kaynak bilgisi gösterilir."],
  ["Bilgilerin doğruluğu nasıl sağlanmaktadır?", "Bilgiler birden fazla güvenilir kaynaktan karşılaştırmalı olarak incelenir. Şüpheli veya kesinlik içermeyen bilgiler akademik yaklaşım gereği dikkatle ele alınır."],
  ["Portal nasıl kullanılmaktadır?", "Arşiv sayfasından şahsiyet ve olayları arayabilir, dönemlere göre süzebilir ve kayıtları açarak okuyabilirsiniz. Soyağacı sayfasında bir isim seçerek anne, baba, eş ve diğer akrabalık bağlarını görebilirsiniz."],
  ["Sahabeler arası akrabalık ve sosyal ilişkiler nasıl gösterilmektedir?", "Sistem; nesep bağlarını, evlilikleri ve diğer ilişkileri kayıtlar üzerinden ilişkilendirerek Soyağacı sayfasında gösterir."],
  ["Portal akademik çalışmalarda kaynak olarak kullanılabilir mi?", "Portal doğrudan birincil kaynak olma iddiası taşımaz; ancak araştırmacılar için yardımcı ve yönlendirici bir dijital referans olarak kullanılabilir."],
  ["Proje kimlere hitap etmektedir?", "Öğrencilere, akademisyenlere, araştırmacılara ve İslam tarihiyle ilgilenen herkese."],
  ["İçerik genel kullanıcılar için anlaşılır mıdır?", "Evet. İçerikler akademik temele dayanmakla birlikte sade ve anlaşılır bir dille hazırlanmıştır."],
  ["Portalın gelecekte geliştirilmesi planlanmakta mıdır?", "Evet. İçeriklerin genişletilmesi, yeni sahabelerin eklenmesi ve görselleştirme araçlarının geliştirilmesi planlanmaktadır."],
  ["Portal eğitim amaçlı kullanılabilir mi?", "Evet. Portal, eğitim kurumlarında yardımcı bir kaynak olarak kullanılabilecek niteliktedir."],
];

const MAKALELER = [
  {
    etiket: "İtikat", foto: "manuscript", slug: "ashab-i-kiram-in-izinde", image: "1720701574998-d68020bce2bd", yerlesik: true,
    baslik: "Ashab-ı Kiram'ın İzinde",
    ozet: "İslam’ın kuvvetli olduğu zamanlarda doğduk. Kuran-ı Kerim'i bize öğretenler oldu. Maalesef ki yeni nesil elimizden kayıp gidiyor...",
    govde: `<p>İslam’ın kuvvetli olduğu zamanlarda doğduk. Kuran-ı Kerim'i bize öğretenler oldu. Maalesef ki yeni nesil elimizden kayıp gidiyor. Bunları nerede kaybettik? Hangi mezhebe ait olduğunu bilmeyen, peygamberimizi tanımayan birine nasıl namaz kıl diyebiliriz?</p>
<p>Hangi mezhepteniz, mezhep neden var, zorunda mıyız biz? <em>"El ilmü ferizatin ala küllü müslimin ve müslimetin"</em>. İlim öğrenmek her Müslüman erkek ve kadın üzerine farzdır. Burada kastedilen nasıl amel etmesi gerektiğini öğrenmektir. İtikadını bilmektir. Herkese tek tek vaciptir. Selam verse birisi, alsa diğerlerinden hüküm kalkar ama 5 vakit namaz herkese tek tek farzdır. İtikat konusunda da herkesin tek tek, fert fert kendisinin yapması lazımdır. İman ne demek? Hz. Allah’a, O'nun peygamberine, O'nun kulu ve resulü olduğuna iman etmektir.</p>
<p>Amel imandan bir cüz müdür? Günümüzde çok fazla var; Müslümanım diyor, namaz kılmıyor, zekât vermiyor. Peki, biz ona "Sen Müslüman değilsin" dersek ne olur? Dinden çıkmış oluruz. Amelinde eksik vardır evet ama Allah’a iman ettim diyordur; amelinde kusur vardır bizi alakadar etmez. İman asıldır, amel onu kuvvetlendirmek içindir. Rabbim bize kâmil iman versin.</p>
<p>Şimdi bir tane mumu yaksak onun sönmesi kolaydır ama biz iman ettik, <em>La ilahe illallah Muhammeden rasulullah</em> dedik. Namazla, rabıtayla, hatimle, zekât ve sadakayla o ateşi güçlendireceğiz. Zayıf olan muma bir kere üflesek söner ama kuvvetli olan ateşe üflesen de su atsan da sönmez. Kimisinin ki ampul gibi, kimisinin ki projektör gibidir. Evet, imanı biliyoruz ama güçlendirmek için çabalamamız gerek. Nasıl güçlendireceğiz? Ne ile? Amel-i Saliha ile.</p>
<p>Peygamber efendimiz de yıllar öncesinden ehlisünnete ve bu dört mezhepten birine uyulması hususunda şöyle buyurmuştur; <em>“Din, iman sahipleri yılanın deliğine, yuvasına çekilmesi gibi elbette Hicaz’a ve Medine-i Münevvere’ye çekilir, sığınır ve toplanır. İslam dini garip olarak başlayıp, yayıldığı gibi yakın zamanda da garip olarak döner. O zaman müjde ve saadet garip olanlar içindir.”</em> Buyurmuşlardır. Bunun üzerine <em>“Ya Rasulallah garip olanlar kimlerdir?”</em> diye soruldu. <em>“Benden sonra benim sünnetimden insanların bozduğu şeyleri düzeltenlerdir.“</em> cevabını verdi. Buradaki garipler kimlerdir? Yani ehlisünnet vel cemaat mezhebi üzerine olanlardır.</p>
<p>Peygamber efendimiz <em>“Yakında ümmetim 73 fırkaya ayrılacaktır. Onlardan biri hariç hepsi cehennemliktir.”</em> buyurdu. Ashab-ı Kiram <em>“Ya Rasulallah onlar kimlerdir?”</em> dedi. Peygamber efendimiz <em>“Onlar benim ve Ashabımın yolu üzerine olanlardır.”</em> buyurmuşlardır.</p>
<p class="art-son">Hazreti Allah bu yol üzerine bizleri daim etsin.</p>`,
  },
  {
    etiket: "İlim", foto: "calligraphy", slug: "neden-bu-ilimleri-ogreniyoruz", image: "1696513553729-17129c427356", yerlesik: true,
    baslik: "Neden Bu İlimleri Öğreniyoruz?",
    ozet: "İslam dini, okuyup ilim sahibi olmaya çok önem vermiştir. Hatta Peygamber Efendimize indirilen ilk ayeti kerime “Oku” emri ile başlar...",
    govde: `<p>İslam dini, okuyup ilim sahibi olmaya çok önem vermiştir. Hatta Peygamber Efendimize indirilen ilk ayeti kerime “Oku” emri ile başlar. Cenabı Hak Kuran-ı Keriminde; <em>“Ey Habibim! Yaratan Rabbinin adı ile oku”</em> buyurmuştur.</p>
<p>Kur’an-ı Kerim’e bakacak olursak, Allah lafzından sonra en çok geçen kelimelerden biri de ilim ve ilim manasını ifade eden kelimeler olduğunu görürüz. Yine Cenabı Hak Kuran-ı Keriminde: <em>“Habibim! De ki: Hiç bilenler ile bilmeyenler bir olur mu?"</em> buyurarak ilmin ve âlimin üstünlüğünü bildirmiştir.</p>
<p>Yine Hz. Allah bütün peygamberlerini âlim yapmıştır. Ümmetleri için öğretmen kılmıştır. Eğer ilimden daha yüce bir mertebe, daha güzel bir meslek olsaydı, Hz. Allah seçerek gönderdiği peygamberlerine o mesleği verirdi.</p>
<p>Abdullah bin Mübarek Hazretleri’ne sordular:</p>
<blockquote>— “Eğer Cenabı-ı Hak, sana öleceğin anı bildirse idi ne ile meşgul olurdun?”<br>— “İlim ile meşgul olurdum." dedi.<br>— “İlimden daha üstün bir ibadet yok mu ki, onunla meşgul olsanız?”<br>— “Evet. İlimden daha üstün bir ibadet yoktur.” dedi. Yanındakiler:<br>— “İlme çalışmanın her türlü ibadetten üstün olduğunu ne ile ispat edersiniz?” deyince,</blockquote>
<p>Abdullah bin Mübarek Hazretleri şöyle cevap verdi:</p>
<blockquote>— “İlim her şeyden üstündür. Çünkü Cenabı-ı Hak (c.c.) Peygamber Efendimize (s.a.v.) her şeyi verdi. Fazlasını istemekle emir buyurmadı. İlim hakkında ise: ‘Ey Habibim! De ki: Rabbim benim ilmimi artır.’ Eğer ilimden daha üstün bir şey olsa idi, Rasulullah Efendimiz (s.a.v.), onun artmasını istemekle emrolunurdu. Bundan dolayı ben ilimden daha üstün bir amel göremiyorum.”</blockquote>
<p>İslam dini ilme o kadar değer ve kıymet vermiştir ki, Bedir harbi esirlerinin okuryazar olanlarına, Müslümanlardan on kişiye okuyup yazmayı öğrettikleri takdirde serbest bırakılacakları, Fahr-i Kâinat Efendimiz tarafından va’d edilmiş ve esirler denileni yaptıkları zaman serbest bırakılmışlardır.</p>
<p>Bir milletin en büyük düşmanı cehalettir. Onu imha etmeden diğer düşmanlara karşı zafer mümkün değildir.</p>
<p class="art-son">Hiç kimse hakikati anlayacak ilimle doğmamıştır. Bu yüzden bu ilimleri okumaya ve anlamaya önem göstermeliyiz.</p>`,
  },
  {
    etiket: "Siyer", foto: "ornate", slug: "rasulullah-sevgisi-ve-kur-an-egitimi", image: "1720700955600-a21cd215d1a3", yerlesik: true,
    baslik: "Rasulullah Sevgisi ve Kur'an Eğitimi",
    ozet: "Resulullah efendimiz bir hadisi şeriflerinde şöyle buyuruyor; \"Evlatlarınızı üç haslet üzerine edeplendiriniz...\"",
    govde: `<p>Resulullah efendimiz bir hadisi şeriflerinde şöyle buyuruyor;</p>
<blockquote>”Evlatlarınızı üç haslet üzerine edeplendiriniz:</blockquote>
<ul><li><strong>1. Rasulullah sevgisi</strong></li><li><strong>2. Rasulullah’ın ehlibeytinin sevgisi</strong></li><li><strong>3. Kur'an-ı Kerim okumak</strong></li></ul>
<p>Çünkü Kur'an-ı Kerim okuyan, okutan ve onun hizmetinde bulunanlar hiçbir gölgenin bulunmadığı o kıyamet gününde evliya ve esfiya ile beraber Allah’ımızın Arşının gölgesinde bulunacaklardır.</p>
<h3>Kur'an-ı Kerim ilk olarak nerede ve nasıl öğretilmeye başlandı?</h3>
<p>Peygamber Efendimiz (s.a.v.), nübüvvetin ilk yıllarında Müslümanlar ile Safa tepesi eteklerindeki Hazret-i Erkam’ın (r.a.) evinde gizlice toplanır, onlara İslâm’ın emir ve hükümlerini bildirir, Kur’an-ı Kerim'in nazil olan Ayet-i Kerimelerini okur ve öğretirlerdi. <strong>Dârü'l-Erkam</strong> ismi verilen bu hane, İslam tarihinde ilk eğitim-öğretim yapılan ilim müessesesi olarak kabul edilir.</p>
<p>Rasulullah Efendimiz (s.a.v.), Medine-i Münevvere‘ye hicretlerinin ardından Mescid-i Nebevi ve ona bitişik olarak da Hücre-i Saadet'i inşa ettirdiler. Mescidin kuzey tarafına, bir suffa (gölgelik) yaptırdılar. Sahabe-i Kiramdan burada ikamet edenlere <strong>Ashab-ı Suffe</strong> denilirdi. Onların ihtiyaçlarıyla bizzat Efendimiz (s.a.v.) ilgilenir, eğitimiyle de yine kendileri alakadar olurlardı. Ayrıca onlara yazı yazmayı ve Kur’an-ı Kerim okumayı öğretmek üzere Ubâde b. Sâmit, Mus'ab bin Umeyr (r.anhüma) gibi hocalar tayin etmişlerdi.</p>`,
  },
];

/* ==========================================================================
   SÜRÜM NOTLARI — her ay için tek, kısa bir kayıt.
   Yeni ay eklemek için listenin BAŞINA yeni bir { ... } bloğu ekleyin.
   Menüdeki ve alt bilgideki sürüm numarası otomatik olarak ilk kayıttan alınır.
   ========================================================================== */
const SURUMLER = [
  { ay: "Eylül 2026", surum: "3.5.0", baslik: "Kişisel çalışma alanı ve hızlı olay ekleme", maddeler: [
    "Hesabım sayfası; özet göstergeleri, son hareketler, birleşik arama, tür filtreleri ve hızlı erişim bağlantılarıyla kişisel çalışma alanına dönüştürüldü.",
    "Favoriler ve notlar tek görünümde veya ayrı sekmelerde yönetilebilir; kişisel veriler JSON olarak dışa aktarılabilir.",
    "Yönetici paneline her ekrandan ulaşılabilen belirgin Yeni olay ekle ve Yeni şahsiyet düğmeleri eklendi.",
    "Olay formu açıklayıcı alan adları, zorunlu alan işaretleri ve daha görünür bir kayıt akışıyla yenilendi.",
  ] },
  { ay: "Eylül 2026", surum: "3.4.0", baslik: "Yeni tasarım, arama ve hesap özellikleri", maddeler: [
    "Tüm sayfalar yeni tasarıma göre yeniden hazırlandı: bir yanda görsel, diğer yanda içerik.",
    "Arşiv (arama, tür ve devir filtreleri), Zaman Çizelgesi, Soyağacı, Rastgele Şahsiyet, Makaleler, Sıkça Sorulan Sorular ve iletişim formu yenilendi.",
    "Site içi arama eklendi: şahsiyet, olay, makale ve sorular tek yerde aranıyor. Menüdeki “Ara” bağlantısı veya klavyede “/” tuşu ile açılır.",
    "Favoriler ve kişisel notlar eklendi; yeni Hesabım sayfasından yönetilir. Notları yalnızca siz görürsünüz. Yorum özelliği bilerek eklenmedi.",
    "Google ile giriş düzeltildi; hatalar artık anlaşılır mesajlarla gösteriliyor.",
    "Gizlilik Politikası, Kaynakça, Katkıda Bulun (iletişim formu burada) ve Sürüm Notları sayfaları eklendi. Sıkça Sorulan Sorular üst menüden alt bilgiye taşındı.",
    "Yönetici paneli: kayıt ekleme, düzenleme ve silme; birden fazla yönetici hesabı ve giriş sonrası karşılama penceresi.",
    "Yönetici panelinde mükerrer şahsiyet uyarısı yeniden etkinleştirildi.",
    "Anne ve baba alanlarına mevcut şahsiyetlerden arama yaparak seçim desteği eklendi.",
    "Yönetici paneline özet göstergeleri, kayıt arama/sıralama, eksik kayıt filtresi ve JSON yedek indirme eklendi.",
    "Giriş ekranına şifre gösterme ve şifre sıfırlama seçenekleri eklendi.",
  ] },
  { ay: "Mayıs 2026", surum: "2.5.0", baslik: "Arşiv ve devirler", maddeler: [
    "Arşiv ekranı 3 sütunlu yapıya kavuşturuldu: rehber, ana içerik ve filtreler.",
    "Şahsiyet kartlarında “Görsel Öncelik Sistemi” kullanıldı.",
    "Arşive Devirler Sistemi ve “Bağlantılı Tarih Sistemi” eklendi.",
  ] },
];
const SURUM = SURUMLER[0].surum;

const KAYNAKCA = [
  { baslik: "Siyer ve Peygamber Efendimiz'in (s.a.v.) Hayatı", eserler: [
    ["Peygamber Efendimiz'in (Sav) Hayatı", "Ahmed Cevdet Paşa", "Çamlıca Basım Yayın"],
    ["Herkes İçin Peygamber Efendimizin Hayatı", "Ahmed Cevdet Paşa", "Çamlıca Basım Yayın"],
    ["Peygamberimiz ve Peygamberler (a.s.)", "Ahmed Cevdet Paşa", "Çamlıca Basım Yayın"],
  ] },
  { baslik: "Şemail ve Hadis Kaynakları", eserler: [
    ["Şemâil-i Şerife", "Muhammed bin İsa et-Tirmizî (r.a.)", "Fazilet Neşriyat"],
    ["500 Hadîs-i Şerîf", "Ömer Nasuhi Bilmen", "Fazilet Neşriyat"],
  ] },
  { baslik: "Ashâb-ı Kirâm ve İtikad", eserler: [
    ["Ashâb-ı Kirâm Hakkında Müslümanların Nezih İtikâdları", "Ömer Nasuhi Bilmen", "Fazilet Neşriyat"],
  ] },
];

/* ---------- Durum ---------- */
const durum = {
  zatlar: [], olaylar: [],
  yuklendi: { zat: false, olay: false },
  hata: null,
  kullanici: null,
  arama: "", devir: "tumu", tur: "tumu", limit: 50, acik: new Set(), kaydirHedef: null,
  rastgeleId: null,
  faqAcik: null,
  makaleAcik: new Set(),
  loginMod: "giris",
  admin: { sekme: "zat", duzenleId: null, arama: "", siralama: "ad", sadeceEksik: false, kirli: false },
  hesap: { sekme: "tumu", arama: "", tur: "tumu" },
  favoriler: {}, notlar: {}, notTaslak: {}, kullaniciDinleyici: [], kisiselHata: null,
  genelArama: "", kaydirId: null, yavas: false, appCheck: null,
  /* Firestore 'makaleler' (yayımlanmış + yöneticiye taslaklar) ve statik derlemeden gelenler */
  makaleler: [], statikMakaleler: [], makaleAcikSlug: null,
  /* Veri her değiştiğinde artar; akrabalık grafiği bu sürüme göre önbelleğe alınır */
  veriSurum: 0, canliMod: null, googleHazir: false,
  mk: { duzenleId: null, gorsel: "", kirli: false },
};

/* ---------- Yardımcılar ---------- */
const $ = (s, k) => (k || document).querySelector(s);
const esc = (s) => s == null ? "" : String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const bos = (v) => v == null || String(v).trim() === "" || String(v).trim() === "?";
const trKucuk = (s) => String(s || "").toLocaleLowerCase("tr");
const devirOf = (k) => k.devir || "Asr-ı Saadet";
const adSirala = (a, b) => trKucuk(a.isim || a.ad).localeCompare(trKucuk(b.isim || b.ad), "tr");
function sahsiyetKayitSayisi() {
  return durum.zatlar.length;
}
function olayKayitSayisi() {
  return durum.olaylar.length;
}
/* "Bağlantılı şahsiyet": arşivdeki EN AZ BİR başka şahsiyetle anne/baba, çocuk, eş, kardeş
   ya da "Diğer bağlar" üzerinden ilişkilendirilmiş kayıt. Ana sayfa ve yönetici paneli
   aynı fonksiyonu kullanır; sayılar her zaman aynıdır. */
let bagliSayiOnbellek = { surum: -1, sayi: 0 };
function baglantiliKayitSayisi() {
  if (!sahsiyetKayitSayisi()) return 0;
  if (bagliSayiOnbellek.surum === durum.veriSurum) return bagliSayiOnbellek.sayi;
  const { g: grafik, ix: indeks } = grafikAl();
  const sayi = durum.zatlar.filter((z) => {
    const kisi = grafik.get(z.id);
    if (kisi && (kisi.ebeveynler.size || kisi.cocuklar.size || kisi.es.size || kisi.kardes.size)) return true;

    return baglariAyir(z.baglar).some((bag) => {
      if (trKucuk(bag.tur) === "çocuk") return false;
      const eslesen = adCozumle(bag.ad, indeks, true);
      return !!(eslesen.kayit && eslesen.kayit.id !== z.id);
    });
  }).length;
  bagliSayiOnbellek = { surum: durum.veriSurum, sayi };
  return sayi;
}

function duzMetin(ham) {
  if (!ham) return "";
  return String(ham).replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function listeyiHazirla(liste) {
  return (Array.isArray(liste) ? liste : []).map((k) => ({
    ...k,
    _duz: k._duz || duzMetin(k.bilgi),
    _ara: k._ara || trKucuk((k.isim || k.ad || "") + " " + (k._duz || duzMetin(k.bilgi))),
  })).sort(adSirala);
}
function veriyiUygula(tur, liste, kaydet = false) {
  const hazirListe = listeyiHazirla(liste);
  if (tur === "zat") durum.zatlar = hazirListe; else durum.olaylar = hazirListe;
  durum.yuklendi[tur] = true;
  durum.veriSurum++;
  if (kaydet) {
    try { localStorage.setItem(`asr-veri-${tur}-v1`, JSON.stringify(hazirListe)); } catch (e) { /* Önbellek doluysa canlı veri kullanılmaya devam eder. */ }
  }
}
function yerelVeriyiYukle() {
  try {
    for (const tur of ["zat", "olay"]) {
      const kayit = localStorage.getItem(`asr-veri-${tur}-v1`);
      if (kayit) veriyiUygula(tur, JSON.parse(kayit));
    }
  } catch (e) { console.warn("Kayıtlı sayfa verisi okunamadı:", e); }
}
async function statikVeriyiYukle() {
  try {
    const yanit = await fetch("/site-data.json", { cache: "no-cache" });
    if (!yanit.ok) return null;
    const veri = await yanit.json();
    let degisti = false;
    if (Array.isArray(veri.makaleler)) { durum.statikMakaleler = veri.makaleler; degisti = true; }
    if (veri.sahabeSayfaYollari) { sahabeSayfaYollari = veri.sahabeSayfaYollari; degisti = true; }
    /* Sunucudaki derleme verisi tarayıcı önbelleğinden daha günceldir; canlı tam veri geldiyse ona dokunma */
    if (!durum.canliTam && Array.isArray(veri.zatlar) && veri.zatlar.length) { veriyiUygula("zat", veri.zatlar, true); degisti = true; }
    if (!durum.canliTam && Array.isArray(veri.olaylar)) { veriyiUygula("olay", veri.olaylar, true); degisti = true; }
    if (degisti) veriGuncelle();
    return veri;
  } catch (e) { console.warn("Önceden hazırlanan kayıtlar yüklenemedi:", e); return null; }
}
/* Canlı değişiklikleri mevcut listeye işler (ziyaretçi modunda yalnızca değişen kayıtlar gelir) */
function veriBirlestir(tur, degisenler, silinenIdler = []) {
  const eski = tur === "zat" ? durum.zatlar : durum.olaylar;
  const m = new Map(eski.map((k) => [k.id, k]));
  degisenler.forEach((k) => m.set(k.id, { ...k, _duz: undefined, _ara: undefined }));
  silinenIdler.forEach((id) => m.delete(id));
  veriyiUygula(tur, [...m.values()].map(({ _duz, _ara, ...k }) => k), true);
}
function ozet(ham, n) {
  const m = duzMetin(ham);
  return m.length > n ? m.slice(0, n).trimEnd() + "…" : m;
}
function baslikBuyut(metin) {
  if (!metin || metin === "?") return metin;
  return metin.split(" ").map((k) => k.charAt(0).toLocaleUpperCase("tr") + k.slice(1)).join(" ");
}
function yilSayi(v) {
  const m = String(v == null ? "" : v).match(/\d+/);
  return m ? parseInt(m[0], 10) : NaN;
}
/* "Ebu Bekir (ra)" ve "Ebu Bekir" aynı kişi sayılsın */
function adTemiz(ad) {
  return String(ad || "").replace(/\((r\.?\s?a\.?|r\.?\s?anh[a-zü]*\.?|s\.a\.v\.?)\)/gi, "").replace(/\s+/g, " ").trim();
}
const adAnahtar = (ad) => trKucuk(adTemiz(ad));
const birlestir = (...p) => p.filter((x) => !bos(x)).join(" / ");

/* Firestore'dan gelen (yönetici tarafından yazılmış) HTML'i güvenli hâle getirir */
const IZINLI = new Set(["P", "BR", "B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "H3", "H4", "BLOCKQUOTE", "A", "DIV", "SPAN"]);
const SILINECEK = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "FORM", "INPUT", "BUTTON", "SVG"]);
function temizHtml(ham) {
  if (bos(ham)) return "";
  const metin = String(ham);
  if (!/<[a-z][\s\S]*>/i.test(metin)) return esc(metin).replace(/\n/g, "<br>");
  if (typeof DOMParser === "undefined") return esc(duzMetin(metin));
  const d = new DOMParser().parseFromString(metin, "text/html");
  const yuru = (dugum) => {
    Array.from(dugum.childNodes).forEach((c) => {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1) { c.remove(); return; }
      if (SILINECEK.has(c.tagName.toUpperCase())) { c.remove(); return; }
      yuru(c);
      if (!IZINLI.has(c.tagName)) { c.replaceWith(...Array.from(c.childNodes)); return; }
      Array.from(c.attributes).forEach((a) => {
        const ad = a.name.toLowerCase(), deger = a.value.trim();
        if (c.tagName === "A" && ad === "href" && /^(https?:|mailto:)/i.test(deger)) return;
        if (ad === "style") {
          const m = deger.match(/(?:^|;)\s*text-align:\s*(left|right|center|justify)\s*(?:;|$)/i);
          if (m) { c.setAttribute("style", "text-align:" + m[1].toLowerCase()); return; }
        }
        c.removeAttribute(a.name);
      });
      if (c.tagName === "A") { c.setAttribute("target", "_blank"); c.setAttribute("rel", "noopener noreferrer"); }
    });
  };
  yuru(d.body);
  return d.body.innerHTML;
}
const bilgiHtml = (ham) => bos(ham) ? "<p>Bu kayıt için henüz bilgi girilmemiş.</p>" : temizHtml(ham);

/* Favori / not anahtarı: "zat_ID" veya "olay_ID" (eski sitedekiyle aynı) */
const favAnahtar = (tip, id) => tip + "_" + id;
const kayitBul = (tip, id) => (tip === "zat" ? durum.zatlar : durum.olaylar).find((k) => k.id === id);
const kayitAdi = (tip, k) => (k ? (tip === "zat" ? k.isim : k.ad) || "" : "");
const kirmiziKartMi = (k) => !!(k && k.kirmiziKart === true);

function adminEpostasiMi() {
  const u = durum.kullanici;
  /* E-posta ASCII'dir: Türkçe kuralıyla değil düz küçük harfe çevirerek karşılaştır (I → ı sorunu olmasın) */
  return !!(u && u.email && ADMIN_EMAILS.some(function(email) {
    return email.toLowerCase() === u.email.toLowerCase();
  }));
}
/* Yönetici = listedeki e-posta + DOĞRULANMIŞ e-posta. firestore.rules da aynı şartı arar;
   böylece biri yönetici adresiyle doğrulanmamış bir üyelik açarak panele giremez. */
function adminMi() {
  return adminEpostasiMi() && !!durum.kullanici.emailVerified;
}

function hosgeldinBildirimGoster(email) {
  const mesaj = HOSGELDIN_MESAJLARI[String(email).toLowerCase()];
  if (!mesaj) return;

  const ortu = document.createElement("div");
  ortu.className = "welcome-toast-overlay";

  const kutu = document.createElement("div");
  kutu.className = "welcome-toast";
  kutu.textContent = mesaj;

  const kapatBtn = document.createElement("button");
  kapatBtn.className = "welcome-toast-kapat";
  kapatBtn.setAttribute("aria-label", "Kapat");
  kapatBtn.textContent = "×";
  kapatBtn.addEventListener("click", () => {
    ortu.classList.remove("goster");
    setTimeout(() => ortu.remove(), 350);
  });

  kutu.appendChild(kapatBtn);
  ortu.appendChild(kutu);
  document.body.appendChild(ortu);

  requestAnimationFrame(() => ortu.classList.add("goster"));
}

/* ---------- Ek stiller (style.css'e dokunmadan) ---------- */
function ekStilEkle() {
  if (document.getElementById("ek-stil")) return;
  const s = document.createElement("style");
  s.id = "ek-stil";
  s.textContent = `
a.record{display:block;color:inherit;text-decoration:none}
a.button,button.button{display:inline-block}
.text-link{display:inline-block}
.content > .text-link{align-self:flex-start;margin-top:1.5rem}
.ark-icerik{justify-content:flex-start}
.kayit-ust{cursor:pointer}
.kayit-ust:focus-visible{outline:2px solid var(--brass);outline-offset:4px}
.kayit-detay{margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(184,147,74,.2)}
.kayit-metin{color:var(--ink);font-size:.88rem;line-height:1.75}
.kayit-metin p{margin:0 0 .8rem;color:var(--ink);font-size:.88rem;line-height:1.75}
.kayit-metin h3{margin:1rem 0 .5rem}
.kayit-metin ul,.kayit-metin ol{margin:0 0 .8rem;padding-left:1.3rem}
.kayit-metin blockquote,.article-full blockquote{margin:.8rem 0;padding-left:1rem;border-left:2px solid var(--brass);color:var(--muted);font-style:italic}
.kayit-metin a,.article-full a{color:var(--brass)}
.kayit-bilgi{margin:1rem 0 0;display:grid;gap:.4rem}
.kayit-bilgi div{display:flex;gap:1rem;font-size:.78rem}
.kayit-bilgi dt{min-width:7rem;color:var(--brass);letter-spacing:.06em}
.kayit-bilgi dd{margin:0;color:var(--muted)}
.kayit-detay .text-link{margin-top:1rem}
.more-wrap{margin-top:1.25rem}
.event h3 a{color:inherit;text-decoration:none}
.event h3 a:hover{text-decoration:underline;text-decoration-color:var(--brass);text-underline-offset:4px}
.family-node a,.family-detail a{color:inherit;text-decoration:underline;text-decoration-color:var(--brass);text-underline-offset:3px}
.family-detail strong{max-width:70%}
.article-full{margin-bottom:1rem}
.article-full h3{margin:1.5rem 0 .6rem;color:var(--forest);font-family:"Lora",Georgia,serif;font-size:1.05rem;font-weight:500}
.article-full ul{color:var(--muted);font-size:.9rem;line-height:1.75}
.article-full .art-son{margin-top:1.5rem;color:var(--forest);font-family:"Lora",Georgia,serif;font-style:italic}
.form-field textarea,.login-field textarea{width:100%;padding:.7rem .85rem;color:var(--ink);background:var(--bone);border:1px solid rgba(26,22,18,.2);font:inherit;resize:vertical}
.form-hint{margin:.3rem 0 0;color:var(--quiet);font-size:.7rem}
.form-ok{margin:0 0 1rem;padding:.6rem .85rem;color:#2f6b4f;background:rgba(47,107,79,.08);border-left:2px solid #2f6b4f;font-size:.78rem}
.check-satir{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;color:var(--muted);font-size:.78rem}
.login-message.ok{color:#2f6b4f}
.contact-box .login-message{margin:1rem 0 0;color:#8c3d2f}
.contact-box .login-message.ok{color:#2f6b4f}
.contact-box .login-field input,.contact-box .login-field textarea{background:var(--bone)}
.login-panel .login-actions .button{flex:0 0 auto}
.rich-editor:empty::before{content:attr(data-placeholder);color:var(--quiet)}
.admin-page .admin-liste-bos{padding:1.2rem;color:var(--quiet);font-size:.8rem}
.kisisel{margin-top:1.25rem;padding-top:1rem;border-top:1px dashed rgba(184,147,74,.3)}
.kisisel-ust{margin-bottom:.9rem}
.kisisel-etiket{display:block;margin-bottom:.4rem;color:var(--brass);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase}
.kisisel-etiket span{margin-left:.5rem;color:var(--quiet);letter-spacing:0;text-transform:none}
.not-alani{width:100%;box-sizing:border-box;padding:.7rem .85rem;color:var(--ink);background:var(--bone);border:1px solid rgba(26,22,18,.2);font:inherit;font-size:.85rem;line-height:1.6;resize:vertical}
.kisisel-alt{display:flex;align-items:center;gap:.9rem;margin-top:.6rem}
.not-durum{color:#2f6b4f;font-size:.72rem}
.not-durum.hata{color:#8c3d2f}
.kayit-giris{margin:1.2rem 0 0;color:var(--muted);font-size:.78rem}
.kayit-giris a{color:var(--brass)}
.fav-dolu{border-color:var(--brass)!important;color:var(--brass)!important}
.fav-isaret{margin-left:.35rem;color:var(--brass);font-size:.8em}
a.btn-small{display:inline-block;text-decoration:none}
.hesap-bolum{margin:0 0 .8rem;color:var(--forest);font-family:"Lora",Georgia,serif;font-size:1.25rem;font-weight:500}
.hesap-bolum ~ .hesap-bolum{margin-top:2.2rem}
.fav-satir{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}
.fav-satir > a,.fav-satir > div{flex:1;color:inherit;text-decoration:none}
.not-metin{white-space:pre-wrap}
.hesap-araclar{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.8rem}
.prose h3{margin:2rem 0 .6rem;color:var(--forest);font-family:"Lora",Georgia,serif;font-size:1.15rem;font-weight:500}
.prose h3:first-child{margin-top:0}
.prose p,.prose li{color:var(--muted);font-size:.9rem;line-height:1.8}
.prose p{margin:0 0 1rem}
.prose a{color:var(--brass)}
.content .contact-box{margin-top:2rem}
.kaynak-liste{margin:0 0 1rem;padding:0;list-style:none}
.kaynak-liste li{padding:.85rem 0;border-bottom:1px solid rgba(184,147,74,.2)}
.kaynak-liste li strong{display:block;color:var(--ink);font-size:.92rem;font-weight:500}
.kaynak-liste li span{display:block;margin-top:.15rem;color:var(--quiet);font-size:.78rem}
.kaynak-liste.uzun li span{color:var(--muted);font-size:.88rem;line-height:1.7}
.surum-liste{margin:.6rem 0 0;padding-left:1.2rem;color:var(--muted);font-size:.85rem;line-height:1.75}
mark{padding:0 .1em;color:inherit;background:rgba(184,147,74,.28)}
.arama-ozet{margin:0 0 1rem;color:var(--quiet);font-size:.78rem}
[id^="makale-"],[id^="sss-"]{scroll-margin-top:70px}
.version[data-action]{cursor:pointer}
.footer-links p + a{margin-top:1rem}
.welcome-toast-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;transition:opacity .35s ease}
.welcome-toast-overlay.goster{opacity:1}
.welcome-toast{position:relative;max-width:440px;width:88%;background:${KARSILAMA_ARKAPLAN};color:#fff;padding:36px 40px;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.35);font-size:1.05rem;line-height:1.7;text-align:center;transform:scale(.92);transition:transform .35s ease}
.welcome-toast-overlay.goster .welcome-toast{transform:scale(1)}
.welcome-toast-kapat{position:absolute;top:10px;right:14px;background:transparent;border:none;color:#fff;font-size:1.4rem;line-height:1;cursor:pointer;opacity:.8}
.welcome-toast-kapat:hover{opacity:1}
@media (max-width:600px){.welcome-toast{padding:28px 24px;font-size:.98rem}}
`;
  document.head.appendChild(s);
}

/* ---------- Ortak parçalar ---------- */
function durumMesaji() {
  if (durum.hata) {
    let ipucu = `İnternet bağlantınızı ve Firestore kurallarını kontrol edin.`;
    if (durum.hataKod === "permission-denied") {
      const ac = durum.appCheck;
      let acBilgi;
      if (!APPCHECK_SITE_KEY) {
        acBilgi = `Firebase'te App Check zorunluysa bu site App Check belgesi göndermediği için reddedilir. script.js başındaki APPCHECK_SITE_KEY satırına reCAPTCHA site anahtarınızı yazın.`;
      } else if (ac && typeof ac === "object") {
        const recaptcha = /recaptcha/i.test(ac.kod + " " + ac.mesaj);
        const kisitli = /throttled/i.test(ac.kod + " " + ac.mesaj);
        acBilgi = kisitli
          ? `App Check istekleri, önceki başarısız denemeler yüzünden tarayıcıda geçici olarak durduruldu (${esc(ac.kod)}). Asıl sorun giderildikten sonra siteyi gizli pencerede açın veya tarayıcı verilerini temizleyin (F12 → Application → Storage → Clear site data). Gizli pencerede gerçek hata nedeni görünür.`
          : `App Check belgesi ALINAMADI (${esc(ac.kod || ac.mesaj)}). ` + (recaptcha
          ? `reCAPTCHA çalışmadı: anahtardaki izinli alan adının bu sitenin adresi olduğunu, anahtar kimliğinin doğru yazıldığını ve reklam engelleyicinin kapalı olduğunu kontrol edin.`
          : `Firebase belgeyi vermedi: Firebase Console → App Check → Apps sekmesinde uygulama kimliği "${esc(firebaseConfig.appId)}" olan web uygulamasının, "${esc(APPCHECK_SAGLAYICI)}" sağlayıcısıyla ve bu sitedeki anahtarla kayıtlı olduğunu kontrol edin.`);
      } else if (ac === "ok") {
        acBilgi = `App Check belgesi alındı (kayıt ve anahtar tamam). Buna rağmen reddediliyorsa Firestore'daki App Check ayarı, Rules sekmesi ya da veritabanı seçimi sorunludur.`;
      } else {
        acBilgi = `App Check belgesi kontrol ediliyor…`;
      }
      ipucu = acBilgi + ` Ayrıca Rules'ın "Publish" ile yayınlandığını ve doğru projede ("${esc(firebaseConfig.projectId)}", "(default)" veritabanı) olduğunuzu doğrulayın.`;
    }
    return `<div class="error">Kayıtlar yüklenemedi: ${esc(durum.hata)}<br>${ipucu}</div>`;
  }
  if (!(durum.yuklendi.zat && durum.yuklendi.olay)) {
    return durum.yavas
      ? `<div class="loading">Kayıtlar beklenenden geç yükleniyor… İnternet bağlantınızı kontrol edin (VPN veya güvenlik duvarı bağlantıyı yavaşlatabilir). Gerekirse sayfayı yenileyin.</div>`
      : `<div class="loading">Kayıtlar yükleniyor…</div>`;
  }
  return "";
}
const zatTarih = (k) => {
  const d = birlestir(k.d_hicri, k.d_miladi), v = birlestir(k.v_hicri, k.v_miladi);
  return [d && `Doğum: ${d}`, v && `Vefat: ${v}`].filter(Boolean).join("  ·  ");
};
const olayTarih = (o) => birlestir(o.hicri, o.miladi);

function gorselYari({ f, alt, sticky = false, ortada = false, icerik, oncelik = false }) {
  const imgOzellik = oncelik ? `fetchpriority="high"` : `loading="lazy"`;
  return `<div class="half visual${sticky ? " sticky" : ""}${ortada ? " middle" : ""}">
    <img src="${foto(f)}" alt="${esc(alt)}" ${imgOzellik}>
    <div class="visual-content">${icerik}</div>
  </div>`;
}

function linkKart(k, tur) {
  const ad = tur === "zat" ? k.isim : k.ad;
  const tarih = tur === "zat" ? zatTarih(k) : olayTarih(k);
  const href = kayitUrl(tur, k.id);
  const yeniSekme = tur === "zat" && sahabeSayfaYollari[k.id] ? ` target="_blank" rel="noopener noreferrer"` : "";
  return `<a class="record" href="${esc(href)}"${yeniSekme}>
    <div class="record-head"><h3>${esc(ad)}</h3><span class="title">${esc(devirOf(k))}</span></div>
    <p>${esc(bos(k.bilgi) ? "Bu kayıt için henüz bilgi girilmemiş." : ozet(k.bilgi, 140))}</p>
    ${tarih ? `<small>${esc(tarih)}</small>` : ""}
  </a>`;
}

/* ---------- ANA SAYFA ---------- */
function sayfaHome() {
  const hazir = durum.yuklendi.zat && durum.yuklendi.olay && !durum.hata;
  const n = (x) => (hazir ? x : "…");
  const bagli = baglantiliKayitSayisi();
  const one = durum.zatlar.filter((z) => !bos(z.bilgi))
    .map((z) => [z, duzMetin(z.bilgi).length]).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);
  const yeni = durum.olaylar.slice().sort((a, b) => (b.eklenmeTarihi || 0) - (a.eklenmeTarihi || 0)).slice(0, 3);
  const dm = durumMesaji();

  return `
  <section class="split">
    ${gorselYari({ f: "dome", alt: "Cami kubbesinin iç mimarisi", oncelik: true, icerik: `
      <h1>“Ashabım, yıldızlar gibidir. Hangisine tabi olursanız hidayete erersiniz.”</h1>
      <p class="quote-source">— Peygamber Efendimiz (s.a.v.)</p>
      <div class="brass-rule"></div>` })}
    <div class="half content">
      <p class="eyebrow">Dijital Siyer Arşivi</p>
      <h2 class="content-title">Ashab-ı Kiram'ın hayatlarını, nesep bağlarını ve dönemin olaylarını tek yerde okuyun.</h2>
      <p class="lead">Kayıtlar klasik siyer ve tarih kaynaklarına dayanır. Bir şahsiyetten akrabalarına, bir olaydan zaman çizelgesindeki yerine geçebilirsiniz.</p>
      <div class="stats">
        <div class="stat"><strong>${n(sahsiyetKayitSayisi())}</strong><span>Şahsiyet</span></div>
        <div class="stat"><strong>${n(olayKayitSayisi())}</strong><span>Olay</span></div>
        <div class="stat"><strong>${n(bagli)}</strong><span>Bağlantılı şahsiyet</span></div>
      </div>
      <div class="actions">
        <a class="button primary" href="#archive">Arşivi Keşfet</a>
        <a class="button" href="#timeline">Zaman Çizelgesi</a>
      </div>
    </div>
  </section>

  <section class="split medium">
    ${gorselYari({ f: "tiles", alt: "İslam sanatında geometrik çini deseni", ortada: true, icerik: `
      <h2>Öne Çıkan Şahsiyetler</h2>
      <p class="visual-copy">Arşivde en kapsamlı kaydı bulunan isimler.</p>
      <div class="brass-rule"></div>` })}
    <div class="half content">
      ${dm || (one.length ? `<div class="record-list">${one.map((z) => linkKart(z, "zat")).join("")}</div>` : `<div class="empty">Henüz bilgi girilmiş bir şahsiyet yok.</div>`)}
      <a class="text-link" href="#archive">Tüm arşivi görüntüle →</a>
    </div>
  </section>

  <section class="split medium">
    ${gorselYari({ f: "manuscript2", alt: "Eski bir Arapça el yazması", ortada: true, icerik: `
      <h2>Son Eklenen Olaylar</h2>
      <p class="visual-copy">Zaman çizelgesine en son giren tarihî olaylar.</p>
      <div class="brass-rule"></div>` })}
    <div class="half content">
      ${dm || (yeni.length ? `<div class="record-list">${yeni.map((o) => linkKart(o, "olay")).join("")}</div>` : `<div class="empty">Henüz olay kaydı yok.</div>`)}
      <a class="text-link" href="#timeline">Zaman çizelgesine git →</a>
    </div>
  </section>

  <section class="split short">
    <div class="half content dark-content">
      <p class="eyebrow">Temel Okumalar</p>
      <h2 class="serif-title">Ashab-ı Kiram'ı ve ilim geleneğini anlatan okumalar.</h2>
      <p class="lead">İtikat, ilim ve Kur'an eğitimi üzerine hazırlanmış kısa yazılar.</p>
      <a class="text-link" href="#articles">Makaleleri oku →</a>
    </div>
    ${gorselYari({ f: "manuscript2", alt: "Eski bir Arapça el yazması", icerik: `
      <div class="article-lines">${tumMakaleler().slice(0, 4).map((m) => `<div class="article-line"><span class="article-tag">${esc(m.etiket)}</span><p><a href="${esc(makaleUrl(m))}">${esc(m.baslik)}</a></p></div>`).join("")}</div>` })}
  </section>`;
}

/* ---------- Bağlantı adresleri ---------- */
function kayitUrl(tur, id) {
  if (tur === "zat") return sahabeSayfaUrl(id);
  return `#archive/olay-${encodeURIComponent(id)}`;
}
function arsivDetayUrl(tur, id) { return `#archive/${tur}-${encodeURIComponent(id)}`; }

/* ---------- Akrabalık bloğu (arşiv detayı, kayıt sayfası, yönetici önizlemesi) ---------- */
function akrabaBlokHtml(g, key, { baslik = "Akrabalık bağları", bosMetin = "", linkTur = "genealogy" } = {}) {
  const d = g.get(key);
  if (!d) return bosMetin ? `<div class="akraba-blok"><h3>${esc(baslik)}</h3><p class="akraba-not">${esc(bosMetin)}</p></div>` : "";
  const link = (k) => {
    const n = g.get(k);
    const ad = esc(adTemiz(dugumAdi(n)) || dugumAdi(n));
    const href = linkTur === "archive" ? arsivDetayUrl("zat", k) : `#genealogy/${encodeURIComponent(k)}`;
    return `<a class="akraba-ad" href="${esc(href)}">${ad}</a>`;
  };
  const satirlar = [];
  const ebv = [...d.ebeveynler.entries()];
  const ebeveynSatiri = (rol, ad) => {
    const e = ebv.find(([, r]) => r === rol);
    if (e) satirlar.push([ad, [`<span class="akraba-oge">${link(e[0])}${d.cikarim.has(e[0]) ? ` <span class="akraba-cikarim" title="Kardeşinin kaydından otomatik çıkarıldı">otomatik</span>` : ""}</span>`]]);
  };
  ebeveynSatiri("baba", "Baba");
  ebeveynSatiri("anne", "Anne");
  ebv.filter(([, r]) => !r).forEach(([pk]) => satirlar.push(["Ebeveyn", [`<span class="akraba-oge">${link(pk)}</span>`]]));
  akrabalikHesapla(g, key).forEach((gr) => {
    satirlar.push([gr.baslik, gr.ogeler.map((o) => `<span class="akraba-oge">${link(o.key)}${gr.goster && o.etiket && o.etiket !== "Kardeş" ? ` <span class="akraba-etiket">(${esc(o.etiket.replace(/\s*\((.+)\)$/, ", $1"))})</span>` : ""}</span>`)]);
  });
  if (!satirlar.length) return bosMetin ? `<div class="akraba-blok"><h3>${esc(baslik)}</h3><p class="akraba-not">${esc(bosMetin)}</p></div>` : "";
  return `<div class="akraba-blok"><h3>${esc(baslik)}</h3>
    ${satirlar.map(([e, ogeler]) => `<div class="akraba-satir"><span>${esc(e)}</span><div class="akraba-ogeler">${ogeler.join('<span aria-hidden="true">·</span>')}</div></div>`).join("")}
    <p class="akraba-not">Kardeş, amca, hala, dayı, teyze, dede ve kuzen bağları anne/baba bilgilerinden otomatik hesaplanır.</p>
  </div>`;
}

/* ---------- Tek kayıt görünümü: /archive#olay-ID veya /archive#zat-ID ---------- */
function arsivDetayParam() {
  const m = String(rota.param || "").match(/^(zat|olay)-(.+)$/);
  return m ? { tur: m[1], id: m[2] } : null;
}
function sayfaKayitDetay(tur, id) {
  const k = (tur === "zat" ? durum.zatlar : durum.olaylar).find((x) => x.id === id);
  const crumbs = `<nav class="page-crumbs" aria-label="breadcrumb"><a href="#home">Ana Sayfa</a><span>›</span><a href="./archive">Arşiv</a><span>›</span><span aria-current="page">${k ? esc(tur === "zat" ? k.isim : k.ad) : "Kayıt"}</span></nav>`;
  if (!k) {
    const yukleniyor = !(durum.yuklendi.zat && durum.yuklendi.olay);
    return `<section class="kayit-sayfa">${crumbs}${yukleniyor ? durumMesaji() || `<div class="loading">Kayıt yükleniyor…</div>` : `<div class="kayit-bulunamadi">Bu kayıt bulunamadı; silinmiş veya adresi değişmiş olabilir. <a class="text-link" href="./archive">Arşive dön →</a></div>`}</section>`;
  }
  const ad = tur === "zat" ? k.isim : k.ad;
  const olayZamani = (o) => [!bos(o.hicri) ? `Hicri ${o.hicri}` : "", !bos(o.miladi) ? `Miladi ${o.miladi}` : ""].filter(Boolean).join(" · ");
  const ust = [devirOf(k), tur === "zat" ? zatTarih(k) : olayZamani(k), tur === "zat" ? "Şahsiyet" : "Olay"].filter((x) => !bos(x));
  /* Akrabalık bloğunda zaten bağlantı olarak görünen isimleri metin olarak tekrar gösterme */
  let satirlar = [];
  if (tur === "zat") {
    const { g, ix } = grafikAl();
    const d = g.get(k.id);
    const bagli = new Set();
    if (d) {
      d.ebeveynler.forEach((_, pk) => bagli.add(pk)); d.es.forEach((x) => bagli.add(x)); d.cocuklar.forEach((x) => bagli.add(x));
      akrabalikHesapla(g, k.id).forEach((gr) => gr.ogeler.forEach((o) => bagli.add(o.key)));
    }
    const eksik = (metin) => esListesiniAyir(metin).filter((ad) => { const r = adCozumle(ad, ix, true); return !(r.kayit && bagli.has(r.kayit.id)); });
    satirlar = [["Anne", k.anne], ["Baba", k.baba], ["Eşi / Eşleri", k.es], ["Çocukları", k.cocuklar]]
      .filter(([, v]) => !bos(v) && v !== "Undefined")
      .map(([a, v]) => [a, eksik(v).join(", ")]).filter(([, v]) => v);
    const digerBag = baglariAyir(k.baglar).filter((b) => { const r = adCozumle(b.ad, ix, true); return !(r.kayit && bagli.has(r.kayit.id)); });
    if (digerBag.length) satirlar.push(["Diğer bağlar", digerBag.map((b) => b.ad + (b.tur ? ` (${b.tur})` : "")).join(", ")]);
  }
  const profil = tur === "zat" && sahabeSayfaYollari[k.id] ? `<a class="button" href="${esc(sahabeSayfaUrl(k.id))}">Biyografi sayfası</a>` : "";
  return `<section class="kayit-sayfa">
    ${crumbs}
    <p class="page-eyebrow"><span></span>${tur === "zat" ? "Şahsiyet kaydı" : "Tarihî olay"}</p>
    <h1>${esc(ad)}</h1>
    <div class="kayit-ust-bilgi">${ust.map((x) => `<span>${esc(x)}</span>`).join("")}</div>
    <div class="kayit-metin">${bilgiHtml(k.bilgi)}</div>
    ${!bos(k.kaynak) ? `<p class="kayit-kaynak"><strong>Kaynak:</strong> ${esc(k.kaynak)}</p>` : ""}
    ${tur === "zat" ? akrabaBlokHtml(grafikAl().g, k.id, { linkTur: "archive" }) : ""}
    ${satirlar.length ? `<div class="kayit-metin-bilgi"><h3>Arşivde ayrı kaydı olmayan isimler</h3><dl class="kayit-bilgi">${satirlar.map(([a, v]) => `<div><dt>${a}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></div>` : ""}
    <div class="kayit-eylemler">
      <a class="button primary" href="./archive">← Tüm arşiv</a>
      ${tur === "zat" ? `<a class="button" href="#genealogy/${esc(k.id)}">Soyağacında gör</a>` : `<a class="button" href="#timeline">Zaman çizelgesi</a>`}
      ${profil}
    </div>
    ${kisiselAlan(tur, k)}
  </section>`;
}

/* ---------- ARŞİV ---------- */
function sayfaArsiv() {
  const detay = arsivDetayParam();
  if (detay) return sayfaKayitDetay(detay.tur, detay.id);
  return `
  <section class="split">
    ${gorselYari({ f: "manuscript", alt: "Eski bir el yazması", sticky: true, icerik: `
      <p class="eyebrow">Dijital Arşiv</p>
      <h1>Sahâbe<br>Kataloğu</h1>
      <p class="visual-copy">Klasik siyer ve tarih kaynaklarından derlenen şahsiyet ve olay kayıtları.</p>
      <div class="mini-stats" id="arsiv-istatistik"></div>` })}
    <div class="half content ark-icerik">
      <div class="archive-tools">
        <input id="arama" class="search" type="search" placeholder="İsim veya içerik ara…" value="${esc(durum.arama)}" autocomplete="off" aria-label="Arşivde ara">
        <div class="filters" id="arsiv-tur"></div>
        <div class="filters" id="arsiv-devir"></div>
        <div class="quick-tags">${HIZLI_ETIKETLER.map((t) => `<button type="button" class="quick-tag" data-action="etiket" data-deger="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      </div>
      <div id="arsiv-alan"></div>
    </div>
  </section>`;
}

function arsivFiltrele() {
  const q = trKucuk(durum.arama.trim());
  const uygun = (k) => (durum.devir === "tumu" || devirOf(k) === durum.devir) && (!q || (k._ara || "").includes(q));
  return {
    z: durum.tur === "olay" ? [] : durum.zatlar.filter(uygun),
    o: durum.tur === "zat" ? [] : durum.olaylar.filter(uygun),
  };
}

/* ---------- Favori + kişisel not alanı (kayıt detayında) ---------- */
function kisiselAlan(tur, k) {
  if (!durum.kullanici) {
    return `<p class="kayit-giris">Favorilere eklemek ve kişisel not almak için <a href="#login">giriş yapın</a>.</p>`;
  }
  const key = favAnahtar(tur, k.id);
  const fav = !!durum.favoriler[key];
  const kayitli = durum.notlar[key] ? durum.notlar[key].metin : "";
  const metin = key in durum.notTaslak ? durum.notTaslak[key] : kayitli;
  return `<div class="kisisel">
    ${durum.kisiselHata ? `<div class="error">Favori ve notlar okunamadı: ${esc(durum.kisiselHata)}</div>` : ""}
    <div class="kisisel-ust">
      <button type="button" class="btn-small${fav ? " fav-dolu" : ""}" data-action="fav" data-tip="${tur}" data-id="${esc(k.id)}" aria-pressed="${fav}">${fav ? "★ Favorilerde" : "☆ Favorilere ekle"}</button>
    </div>
    <label class="kisisel-etiket" for="not-${esc(key)}">Kişisel notum <span>yalnızca siz görürsünüz</span></label>
    <textarea id="not-${esc(key)}" class="not-alani" rows="3" data-anahtar="${esc(key)}" placeholder="Bu kayıtla ilgili kendinize not alın…">${esc(metin)}</textarea>
    <div class="kisisel-alt">
      <button type="button" class="btn-small" data-action="not-kaydet" data-tip="${tur}" data-id="${esc(k.id)}">Notu kaydet</button>
      <span class="not-durum" data-anahtar="${esc(key)}" role="status"></span>
    </div>
  </div>`;
}

function kayitKarti(k, tur) {
  const ad = tur === "zat" ? k.isim : k.ad;
  const anahtar = `${tur}-${k.id}`;
  const acik = durum.acik.has(anahtar);
  const tarih = tur === "zat" ? zatTarih(k) : olayTarih(k);
  let detay = "";
  if (acik) {
    const satirlar = tur === "zat"
      ? [["Anne", k.anne], ["Baba", k.baba], ["Eşi / Eşleri", k.es], ["Çocukları", k.cocuklar], ["Diğer bağlar", k.baglar]].filter(([, v]) => !bos(v))
      : [];
    detay = `<div class="kayit-detay">
      <div class="kayit-metin">${bilgiHtml(k.bilgi)}</div>
      ${satirlar.length ? `<dl class="kayit-bilgi">${satirlar.map(([a, v]) => `<div><dt>${a}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
      ${!bos(k.kaynak) ? `<small>Kaynak: ${esc(k.kaynak)}</small>` : ""}
      ${tur === "zat" ? akrabaBlokHtml(grafikAl().g, k.id, { linkTur: "archive" }) : ""}
      ${tur === "zat" ? `<a class="text-link" href="#genealogy/${esc(k.id)}">Soyağacında gör →</a>` : `<a class="text-link" href="${esc(arsivDetayUrl("olay", k.id))}">Kaydı ayrı sayfada aç →</a>`}
      ${kisiselAlan(tur, k)}
    </div>`;
  }
  const adHtml = tur === "zat" && sahabeSayfaYollari[k.id]
    ? `<a class="profile-name-link" data-profile-link href="${esc(sahabeSayfaUrl(k.id))}" target="_blank" rel="noopener noreferrer">${esc(ad)}</a>`
    : esc(ad);
  return `<article class="record${tur === "zat" && kirmiziKartMi(k) ? " record-red" : ""}" id="kayit-${esc(anahtar)}">
    <div class="kayit-ust" role="button" tabindex="0" aria-expanded="${acik}" data-action="kayit" data-anahtar="${esc(anahtar)}">
      <div class="record-head"><h3>${adHtml}${durum.favoriler[favAnahtar(tur, k.id)] ? ` <span class="fav-isaret" title="Favorilerinizde">★</span>` : ""}</h3><span class="era">${esc(devirOf(k))}</span></div>
      ${acik ? "" : `<p>${esc(bos(k.bilgi) ? "Bu kayıt için henüz bilgi girilmemiş." : ozet(k.bilgi, 150))}</p>`}
      ${tarih ? `<small>${esc(tarih)}</small>` : ""}
    </div>
    ${detay}
  </article>`;
}

function arsivGuncelle() {
  const alan = $("#arsiv-alan");
  if (!alan) return;
  const btn = (islem, deger, etiket, aktif) =>
    `<button type="button" class="filter${aktif ? " active" : ""}" data-action="${islem}" data-deger="${esc(deger)}">${esc(etiket)}</button>`;
  $("#arsiv-tur").innerHTML = [["tumu", "Tümü"], ["zat", "Şahsiyetler"], ["olay", "Olaylar"]]
    .map(([k, l]) => btn("tur", k, l, durum.tur === k)).join("");
  $("#arsiv-devir").innerHTML = [["tumu", "Tüm devirler"], ...DEVIRLER.map((d) => [d, d])]
    .map(([k, l]) => btn("devir", k, l, durum.devir === k)).join("");

  const { z, o } = arsivFiltrele();
  const hepsi = [...z.map((k) => ["zat", k]), ...o.map((k) => ["olay", k])];

  const ist = $("#arsiv-istatistik");
  if (ist) ist.innerHTML = `<h3>Arşiv durumu</h3>
    <div class="mini-stat"><span>Şahsiyet</span><strong>${sahsiyetKayitSayisi()}</strong></div>
    <div class="mini-stat"><span>Olay</span><strong>${olayKayitSayisi()}</strong></div>
    <div class="mini-stat"><span>Eşleşen kayıt</span><strong>${hepsi.length}</strong></div>`;

  const dm = durumMesaji();
  if (dm) { alan.innerHTML = dm; return; }
  if (!hepsi.length) { alan.innerHTML = `<div class="empty">Aramanızla eşleşen kayıt bulunamadı.</div>`; return; }

  const gosterilen = hepsi.slice(0, durum.limit);
  alan.innerHTML = `<div class="record-list">${gosterilen.map(([t, k]) => kayitKarti(k, t)).join("")}</div>` +
    (hepsi.length > durum.limit
      ? `<div class="more-wrap"><button type="button" class="button" data-action="daha">Daha fazla göster (${hepsi.length - durum.limit})</button></div>` : "");

  if (durum.kaydirHedef) {
    const el = document.getElementById("kayit-" + durum.kaydirHedef);
    if (el) { el.scrollIntoView({ block: "center" }); durum.kaydirHedef = null; }
  }
}

/* ---------- ZAMAN ÇİZELGESİ ---------- */
function sayfaCizelge() {
  const ogeler = [];
  durum.olaylar.forEach((o) => { const y = yilSayi(o.miladi); if (!isNaN(y)) ogeler.push({ y, ad: o.ad, tur: "olay", id: o.id, etiket: "Olay", bilgi: o.bilgi }); });
  durum.zatlar.forEach((z) => { const y = yilSayi(z.d_miladi); if (!isNaN(y)) ogeler.push({ y, ad: z.isim, tur: "zat", id: z.id, etiket: "Doğum", bilgi: z.bilgi }); });
  ogeler.sort((a, b) => a.y - b.y);
  const dm = durumMesaji();
  const aralik = ogeler.length ? `M. ${ogeler[0].y} – M. ${ogeler[ogeler.length - 1].y} arasında ${ogeler.length} kayıt.` : "Miladi tarihi girilmiş kayıtlar burada sıralanır.";
  return `
  <section class="split">
    ${gorselYari({ f: "tiles", alt: "İslam mimarisinde geometrik desen", sticky: true, icerik: `
      <p class="eyebrow">Tarih Şeridi</p>
      <h1>Zaman<br>Çizelgesi</h1>
      <p class="visual-copy">${esc(aralik)}</p>` })}
    <div class="half content ark-icerik">
      ${dm || (ogeler.length ? `<div class="timeline">${ogeler.map((i) => `
        <div class="event">
          <time>M. ${i.y} · ${i.etiket}</time>
          <h3><a href="${esc(kayitUrl(i.tur, i.id))}"${i.tur === "zat" && sahabeSayfaYollari[i.id] ? ` target="_blank" rel="noopener noreferrer"` : ""}>${esc(i.ad)}</a></h3>
          ${!bos(i.bilgi) ? `<p>${esc(ozet(i.bilgi, 160))}</p>` : ""}
        </div>`).join("")}</div>` : `<div class="empty">Henüz miladi tarihi girilmiş kayıt yok.</div>`)}
    </div>
  </section>`;
}

/* ---------- SOYAĞACI (ID tabanlı) ---------- */
function adLink(ad, ix) {
  if (bos(ad)) return "";
  const s = adCozumle(ad, ix, true);
  return s.kayit ? `<a href="#genealogy/${esc(s.kayit.id)}">${esc(adTemiz(ad) || ad)}</a>` : esc(ad);
}
function baglariAyir(baglar) {
  if (bos(baglar)) return [];
  return String(baglar).split(/\s*,\s*/).map((p) => {
    const m = p.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (!m || /^r\.?\s?a/i.test(m[2].trim())) return { ad: p.trim(), tur: "" };
    return { ad: m[1].trim(), tur: m[2].trim() };
  }).filter((b) => b.ad);
}

function soyAgaci(k) {
  const { g, ix } = grafikAl();
  const d = g.get(k.id);
  const kisi = (n) => `<a href="#genealogy/${esc(n.kayit.id)}">${esc(adTemiz(n.kayit.isim))}</a>`;
  const ebv = d ? [...d.ebeveynler.entries()] : [];
  const bul = (rol) => { const e = ebv.find(([, r]) => r === rol); return e ? g.get(e[0]) : null; };
  const dugum = (iliski, n, metin) => n
    ? `<div class="family-node"><span class="relation">${iliski}</span><h3>${kisi(n)}</h3><p>${esc(devirOf(n.kayit))}</p></div>`
    : !bos(metin)
      ? `<div class="family-node"><span class="relation">${iliski}</span><h3>${esc(metin)}</h3><p>Arşivde ayrı bir kaydı yok.</p></div>`
      : `<div class="family-node"><span class="relation">${iliski}</span><h3>Kayıtlı değil</h3><p>Bu bilgi arşive girilmemiş.</p></div>`;
  const belirsizEbeveyn = ebv.filter(([, r]) => !r).map(([pk]) => kisi(g.get(pk)));

  const gruplar = d ? akrabalikHesapla(g, k.id) : [];
  const turetilen = new Set(ebv.map(([pk]) => pk));
  gruplar.forEach((gr) => gr.ogeler.forEach((o) => turetilen.add(o.key)));
  const elle = baglariAyir(k.baglar)
    .filter((b) => trKucuk(b.tur) !== "çocuk")
    .filter((b) => { const s = adCozumle(b.ad, ix, true); return !(s.kayit && turetilen.has(s.kayit.id)); })
    .map((b) => adLink(b.ad, ix) + (b.tur ? ` (${esc(b.tur)})` : ""));

  const satir = (e, h) => (h ? `<div class="family-detail"><span>${e}</span><strong>${h}</strong></div>` : "");
  const satirlar = [
    ...gruplar.map((gr) => satir(gr.baslik, gr.ogeler.map((o) => kisi(g.get(o.key)) + (gr.goster && o.etiket !== "Kardeş" ? ` (${esc(o.etiket)})` : "")).join(", "))),
    satir("Ebeveyni", belirsizEbeveyn.join(", ")),
    satir("Diğer akrabalar", elle.join(", ")),
    satir("Kaynak", bos(k.kaynak) ? "" : esc(k.kaynak)),
  ];
  const baskaBagVar = gruplar.length || belirsizEbeveyn.length || elle.length;
  const tarih = zatTarih(k);
  return `
    <div class="family-tree">
      ${dugum("Baba", bul("baba"), k.baba)}
      ${dugum("Anne", bul("anne"), k.anne)}
      <div class="family-node main"><span class="relation">Seçilen şahsiyet</span><h3>${esc(k.isim)}</h3><p>${esc(devirOf(k))}${tarih ? " · " + esc(tarih) : ""}</p></div>
    </div>
    <div class="family-details">
      ${satirlar.join("")}
      ${!baskaBagVar ? `<div class="family-detail"><span>Bağlantı</span><strong>Başka bağlantı kaydı yok</strong></div>` : ""}
    </div>
    <a class="text-link" href="${esc(arsivDetayUrl("zat", k.id))}">Tam kaydı oku →</a>`;
}

function sayfaSoy(param) {
  const secili = durum.zatlar.find((z) => z.id === param);
  const dm = durumMesaji();
  const secenekler = `<option value="">Bir şahsiyet seçin…</option>` +
    durum.zatlar.map((z) => `<option value="${esc(z.id)}"${secili && secili.id === z.id ? " selected" : ""}>${esc(z.isim)}</option>`).join("");
  return `
  <section class="split">
    ${gorselYari({ f: "ornate", alt: "Süslemeli bir el yazması sayfası", sticky: true, icerik: `
      <p class="eyebrow">Nesep ve Akrabalık</p>
      <h1>Soyağacı</h1>
      <p class="visual-copy">Bir isim seçin; anne, baba, eş, çocuk ve kardeş bağlarını görün.</p>` })}
    <div class="half content ark-icerik">
      <div class="genealogy-tools">
        <label for="soy-sec">Şahsiyet</label>
        <select id="soy-sec" class="person-select">${secenekler}</select>
      </div>
      ${dm && !durum.zatlar.length ? dm : secili ? soyAgaci(secili) : `<div class="empty">Ağacını görmek için yukarıdan bir isim seçin.</div>`}
    </div>
  </section>`;
}

/* ---------- RASTGELE ŞAHSİYET ---------- */
function sayfaRastgele() {
  const dm = durumMesaji();
  const adaylar = durum.zatlar.filter((z) => !bos(z.bilgi));
  let k = adaylar.find((z) => z.id === durum.rastgeleId);
  if (!k && adaylar.length) { k = adaylar[Math.floor(Math.random() * adaylar.length)]; durum.rastgeleId = k.id; }
  const meta = k ? [
    !bos(k.anne) && `Anne: ${k.anne}`, !bos(k.baba) && `Baba: ${k.baba}`,
    birlestir(k.d_hicri, k.d_miladi) && `Doğum: ${birlestir(k.d_hicri, k.d_miladi)}`,
    birlestir(k.v_hicri, k.v_miladi) && `Vefat: ${birlestir(k.v_hicri, k.v_miladi)}`,
  ].filter(Boolean) : [];
  return `
  <section class="split">
    ${gorselYari({ f: "dome", alt: "Cami kubbesinin iç mimarisi", sticky: true, icerik: `
      <p class="eyebrow">Keşfet</p>
      <h1>Rastgele<br>Şahsiyet</h1>
      <p class="visual-copy">Arşivden bilgisi girilmiş bir isim seçilir.</p>` })}
    <div class="half content">
      ${dm && !k ? dm : k ? `
      <div class="random-card${kirmiziKartMi(k) ? " record-red" : ""}">
        <h2>${esc(k.isim)}</h2>
        <p class="person-title">${esc(devirOf(k))}</p>
        <p>${esc(ozet(k.bilgi, 700))}</p>
        ${meta.length ? `<div class="random-meta">${meta.map((m) => `<span>${esc(m)}</span>`).join("")}</div>` : ""}
        <div class="actions">
          <a class="button primary" href="#archive/zat-${esc(k.id)}">Tam kaydı oku</a>
          ${durum.kullanici ? `<button type="button" class="button${durum.favoriler[favAnahtar("zat", k.id)] ? " fav-dolu" : ""}" data-action="fav" data-tip="zat" data-id="${esc(k.id)}">${durum.favoriler[favAnahtar("zat", k.id)] ? "★ Favorilerde" : "☆ Favorilere ekle"}</button>` : ""}
          <button type="button" class="button" data-action="rastgele">Başka bir şahsiyet</button>
        </div>
      </div>` : `<div class="empty">Henüz bilgisi girilmiş bir şahsiyet yok.</div>`}
    </div>
  </section>`;
}

/* ---------- MAKALELER ---------- */
/* ---------- MAKALELER ----------
   Kaynaklar: (1) koddaki yerleşik makaleler, (2) son derlemede site-data.json'a giren
   Firestore makaleleri (bunların /makaleler/<slug> statik sayfası vardır), (3) canlı Firestore.
   Aynı slug'a sahip makalede en güncel kaynak kazanır. */
function makaleSlug(metin) {
  const map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return trKucuk(metin).replace(/['’‘´`]/g, "").replace(/[çğıöşüâîû]/g, (c) => map[c])
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/, "");
}
function tumMakaleler() {
  const m = new Map();
  MAKALELER.forEach((a) => m.set(a.slug, { ...a, _statik: true }));
  durum.statikMakaleler.forEach((a) => { if (a && a.slug && a.yayinda !== false) m.set(a.slug, { ...a, _statik: true }); });
  durum.makaleler.forEach((a) => {
    if (!a || !a.slug) return;
    if (a.yayinda === false && !adminMi()) return;
    const onceki = m.get(a.slug);
    m.set(a.slug, { ...a, _statik: !!(onceki && onceki._statik) });
  });
  return [...m.values()].sort((a, b) => (a.yerlesik === b.yerlesik ? (b.tarih || 0) - (a.tarih || 0) : a.yerlesik ? 1 : -1));
}
function makaleUrl(m) { return m._statik ? `/makaleler/${encodeURIComponent(m.slug)}` : `#articles/${encodeURIComponent(m.slug)}`; }
function makaleGorseli(m, w = 1100) {
  if (m.gorsel) return m.gorsel;
  const id = m.image || (m.foto && FOTO[m.foto]) || FOTO.manuscript;
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;
}
function sayfaMakaleler(param) {
  const liste = tumMakaleler();
  const secili = param ? liste.find((m) => m.slug === param) : null;
  if (secili) return makaleDetayHtml(secili);
  return `
  <section class="page-hero">
    <nav class="page-crumbs" aria-label="breadcrumb"><a href="#home">Ana Sayfa</a><span>›</span><span aria-current="page">Makaleler</span></nav>
    <p class="page-eyebrow"><span></span>Temel Okumalar</p>
    <h1>Siyer ve ilim geleneği üzerine makaleler</h1>
    <p class="page-lead">Ashab-ı Kiram, İslam tarihi ve ilim geleneği üzerine hazırlanan yazıları okuyun.</p>
  </section>
  <section class="article-grid" aria-label="Makale listesi">
    ${liste.length ? liste.map((m) => `<a class="article-card" href="${esc(makaleUrl(m))}">
      <span class="article-card-image"><img src="${esc(makaleGorseli(m, 900))}" alt="" loading="lazy"></span>
      <span class="article-card-body">
        <span class="article-card-tag">${esc(m.etiket || "Makale")}</span>
        ${m.yayinda === false ? `<span class="article-card-badge">Taslak — yalnızca yöneticiler görür</span>` : ""}
        <span class="article-card-title">${esc(m.baslik)}</span>
        <span class="article-card-text">${esc(m.ozet || ozet(m.govde, 180))}</span>
        <span class="article-card-more">Makaleyi oku →</span>
      </span>
    </a>`).join("") : `<div class="article-empty">Henüz makale yok.</div>`}
  </section>`;
}
function makaleDetayHtml(m) {
  const duz = duzMetin(m.govde);
  const dakika = Math.max(1, Math.ceil(duz.split(/\s+/).filter(Boolean).length / 220));
  const kaynaklar = String(m.kaynaklar || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
  return `<div class="article-page">
    <nav class="article-crumbs" aria-label="breadcrumb"><a href="#home">Ana Sayfa</a><span>›</span><a href="./articles">Makaleler</a><span>›</span><span aria-current="page">${esc(m.baslik)}</span></nav>
    <header class="article-hero">
      <div class="article-hero-image"><img src="${esc(makaleGorseli(m, 1600))}" alt=""></div>
      <div class="article-hero-content">
        <p class="article-kicker"><span></span>${esc(m.etiket || "Makale")}</p>
        <h1>${esc(m.baslik)}</h1>
        ${m.ozet ? `<p class="article-deck">${esc(m.ozet)}</p>` : ""}
        <div class="article-byline"><span class="article-brand-mark">AS</span><span>Asr-ı Saadet Portalı</span><i></i><span>${dakika} dk okuma</span></div>
      </div>
    </header>
    <div class="article-reading-layout">
      <aside class="article-aside"><div class="article-aside-card"><span class="article-aside-label">Bu yazı</span><strong>${esc(m.etiket || "Makale")}</strong><span class="article-aside-rule"></span><span class="article-aside-label">Tahmini okuma</span><strong>${dakika} dakika</strong><a href="./articles">Tüm makaleler <span>↗</span></a></div></aside>
      <article class="article-body" aria-label="${esc(m.baslik)}">
        <div class="article-full">${temizHtml(m.govde || "")}</div>
        ${kaynaklar.length ? `<section class="article-sources" aria-label="Kaynaklar"><h2>Kaynaklar</h2><ol>${kaynaklar.map((k) => `<li>${esc(k)}</li>`).join("")}</ol></section>` : ""}
        <div class="article-endmark" aria-hidden="true"><span></span> ASR-I SAADET <span></span></div>
        <a class="article-back" href="./articles"><span>←</span> Makalelere dön</a>
      </article>
    </div>
  </div>`;
}

/* ---------- S.S.S. ve İLETİŞİM ---------- */
function faqListe() {
  return `<div class="faq-list">${SSS.map(([q, a], i) => {
    const acik = durum.faqAcik === i;
    return `<div class="faq-item" id="sss-${i}">
      <button type="button" class="faq-question" data-action="faq" data-i="${i}" aria-expanded="${acik}">
        <span>${esc(q)}</span><span class="faq-icon">${acik ? "−" : "+"}</span>
      </button>
      ${acik ? `<div class="faq-answer">${esc(a)}</div>` : ""}
    </div>`;
  }).join("")}</div>`;
}

function sayfaSss() {
  return `
  <section class="split">
    ${gorselYari({ f: "calligraphy", alt: "Arap hattı örneği", sticky: true, icerik: `
      <p class="eyebrow">Yardım</p>
      <h1>Sıkça Sorulan<br>Sorular</h1>
      <p class="visual-copy">Arşivin kullanımı, kaynaklar ve içerik hakkında merak edilenler.</p>` })}
    <div class="half content ark-icerik">
      <div id="faq-alan">${faqListe()}</div>
      <div class="contact-box">
        <h3>Sorunuzu bulamadınız mı?</h3>
        <p>Aklınıza takılan başka bir şey varsa, önerilerinizle ve düzeltme bildirimlerinizle birlikte bize yazabilirsiniz.</p>
        <a class="button primary" href="#contribute">Bize yazın</a>
      </div>
    </div>
  </section>`;
}

/* ---------- GİRİŞ ---------- */
function sayfaGiris() {
  const u = durum.kullanici;
  let govde;
  if (u) {
    govde = `<h2>Hesabınız</h2>
      <p>Giriş yaptınız.</p>
      <div class="login-user">${esc(u.email || u.displayName || "")}${adminMi() ? "<br>Yönetici hesabı" : ""}</div>
      <div class="login-actions">
        <a class="button primary" href="#account">Favorilerim ve notlarım</a>
        ${adminMi() ? `<a class="button" href="#admin">Yönetim paneli</a>` : ""}
        <button type="button" class="button" data-action="cikis">Çıkış yap</button>
      </div>`;
  } else {
    const kayit = durum.loginMod === "kayit";
    govde = `<h2>${kayit ? "Üye ol" : "Giriş yap"}</h2>
      <p>${kayit ? "E-posta ve şifrenizle hesap oluşturun." : "Hesabınızla giriş yapın. Yönetim paneli yalnızca yönetici hesabına açıktır."}</p>
      <div class="login-field"><label for="giris-eposta">E-posta</label><input id="giris-eposta" type="email" autocomplete="email"></div>
      <div class="login-field"><label for="giris-sifre">Şifre</label><div class="password-input"><input id="giris-sifre" type="password" autocomplete="${kayit ? "new-password" : "current-password"}"><button type="button" data-action="sifre-goster" aria-label="Şifreyi göster" aria-pressed="false">Göster</button></div></div>
      <p class="login-message" id="giris-mesaj" role="alert"></p>
      <div class="login-actions">
        <button type="button" class="button primary" data-action="${kayit ? "kayit-ol" : "giris"}">${kayit ? "Üye ol" : "Giriş yap"}</button>
        <button type="button" class="button" data-action="google">Google ile devam et</button>
      </div>
      ${kayit ? "" : `<p class="login-helper"><button type="button" class="text-link" data-action="sifre-sifirla">Şifremi unuttum</button></p>`}
      <p style="margin:1.25rem 0 0"><button type="button" class="text-link" data-action="login-mod" data-mod="${kayit ? "giris" : "kayit"}">${kayit ? "Zaten hesabım var" : "Hesabım yok, üye olmak istiyorum"}</button></p>`;
  }
  return `
  <section class="split">
    ${gorselYari({ f: "dome", alt: "Cami kubbesinin iç mimarisi", sticky: true, icerik: `
      <p class="eyebrow">Hesap</p>
      <h1>${u ? "Hoş geldiniz" : "Giriş"}</h1>
      <p class="visual-copy">Yönetici hesabıyla giriş yaparak arşive kayıt ekleyebilir ve düzenleyebilirsiniz.</p>` })}
    <div class="half content" style="align-items:flex-start"><div class="login-panel">${govde}</div></div>
  </section>`;
}

/* ---------- YÖNETİCİ PANELİ ---------- */
function sayfaAdmin() {
  if (adminEpostasiMi() && !adminMi()) {
    return `<section class="admin-page admin-denied">
      <h1>E-posta doğrulaması gerekli</h1>
      <p>${esc(durum.kullanici.email)} yönetici listesinde, ancak bu hesabın e-posta adresi henüz doğrulanmamış. Güvenlik için yönetim paneli yalnızca doğrulanmış hesaplara açılır.</p>
      <p>Doğrulama e-postasını gönderin, gelen bağlantıya tıklayın, sonra “Doğruladım” düğmesine basın. (Google ile giriş yaparsanız doğrulama otomatiktir.)</p>
      <div class="login-actions">
        <button type="button" class="button primary" data-action="dogrulama-gonder">Doğrulama e-postası gönder</button>
        <button type="button" class="button" data-action="dogrulama-yenile">Doğruladım, yenile</button>
        <button type="button" class="button" data-action="cikis">Çıkış yap</button>
      </div>
      <p class="login-message" id="dogrulama-mesaj" role="alert"></p>
    </section>`;
  }
  if (!adminMi()) {
    return `<section class="admin-page admin-denied">
      <h1>Yönetici alanı</h1>
      <p>${durum.kullanici ? `${esc(durum.kullanici.email)} hesabının bu bölüme erişim yetkisi yok.` : "Bu bölüm yalnızca yönetici hesabına açıktır. Devam etmek için giriş yapın."}</p>
      <a class="button primary" href="#login">${durum.kullanici ? "Hesap sayfasına git" : "Giriş yap"}</a>
    </section>`;
  }
  return `<section class="admin-page">
    <div class="admin-top">
      <div><p class="admin-kicker">Arşiv yönetimi</p><h1>Yönetici Paneli</h1><p class="admin-lead">Şahsiyetleri ve tarihî olayları tek merkezden ekleyin, düzenleyin ve denetleyin.</p></div>
      <div class="admin-top-actions">
        <button type="button" class="button primary" data-action="admin-yeni" data-tip="olay">Yeni olay ekle</button>
        <button type="button" class="button" data-action="admin-yeni" data-tip="zat">Yeni şahsiyet</button>
        <button type="button" class="button" data-action="admin-yedek">JSON yedeği indir</button>
        <button type="button" class="button" data-action="admin-baglari-temizle">Eski bağları temizle</button>
        <a class="button" href="#home">Siteyi gör</a>
        <button type="button" class="button" data-action="cikis">Çıkış yap</button>
      </div>
    </div>
    <div class="admin-overview" id="admin-ozet"></div>
    <div id="admin-uyarilar"></div>
    <div class="admin-create-callout">
      <div><span>Hızlı kayıt</span><strong>Arşive yeni bir içerik ekleyin</strong><p>Olaylar için tarih, dönem, açıklama ve kaynak; şahsiyetler için nesep ve hayat bilgilerini kaydedebilirsiniz.</p></div>
      <div class="admin-create-actions">
        <button type="button" class="button primary" data-action="admin-yeni" data-tip="olay">Olay ekleme formunu aç</button>
        <button type="button" class="button" data-action="admin-yeni" data-tip="zat">Şahsiyet ekle</button>
      </div>
    </div>
    <div class="admin-tabs" id="admin-sekmeler"></div>
    <div class="admin-grid">
      <div class="admin-col-list" id="admin-liste"></div>
      <div class="admin-col-form" id="admin-form"></div>
    </div>
  </section>`;
}

function adminSekmeleriGuncelle() {
  const el = $("#admin-sekmeler");
  if (!el) return;
  const s = durum.admin.sekme;
  el.innerHTML = `<div class="admin-tabs-label"><span>Kayıt türü</span><strong>${s === "zat" ? "Şahsiyet kayıtları" : s === "olay" ? "Olay kayıtları" : "Makaleler"}</strong></div>
    <button type="button" class="tab-btn${s === "zat" ? " active" : ""}" data-action="admin-sekme" data-sekme="zat">Şahsiyetler (${sahsiyetKayitSayisi()})</button>
    <button type="button" class="tab-btn${s === "olay" ? " active" : ""}" data-action="admin-sekme" data-sekme="olay">Olaylar (${olayKayitSayisi()})</button>
    <button type="button" class="tab-btn${s === "makale" ? " active" : ""}" data-action="admin-sekme" data-sekme="makale">Makaleler (${tumMakaleler().length})</button>`;
}

function adminOzetGuncelle() {
  const el = $("#admin-ozet");
  if (!el) return;
  const hazir = durum.yuklendi.zat && durum.yuklendi.olay && !durum.hata;
  const tumu = [...durum.zatlar, ...durum.olaylar];
  const eksik = tumu.filter((k) => bos(k.bilgi) || bos(k.kaynak)).length;
  const baglantili = baglantiliKayitSayisi();
  const n = (deger) => hazir ? deger : "…";
  el.innerHTML = `
    <div class="admin-stat"><span>Şahsiyet</span><strong>${n(sahsiyetKayitSayisi())}</strong></div>
    <div class="admin-stat"><span>Olay</span><strong>${n(olayKayitSayisi())}</strong></div>
    <div class="admin-stat"><span>Bağlantılı şahsiyet</span><strong>${n(baglantili)}</strong></div>
    <div class="admin-stat${hazir && eksik ? " needs-attention" : ""}"><span>Eksik içerik/kaynak</span><strong>${n(eksik)}</strong></div>`;
  const uy = $("#admin-uyarilar");
  if (uy) {
    const liste = hazir ? (grafikAl().g.uyarilar || []) : [];
    uy.innerHTML = liste.length ? `<details class="veri-uyarilari"><summary>Veri uyarıları (${liste.length}) — akrabalık hesabını bozan çelişkiler</summary><ul>${liste.map((u) => `<li>${esc(u.metin)} <button type="button" class="btn-small" data-action="admin-kayit-ac" data-id="${esc(u.ids[0])}">Kaydı aç</button></li>`).join("")}</ul></details>` : "";
  }
  const yedek = document.querySelector('[data-action="admin-yedek"]');
  if (yedek) {
    yedek.disabled = !hazir;
    yedek.title = hazir ? "Arşiv verilerini JSON olarak indir" : "Yedek için kayıtların yüklenmesini bekleyin";
  }
}

function adminFiltrelenmisListe() {
  const kaynak = durum.admin.sekme === "zat" ? durum.zatlar : durum.olaylar;
  const q = trKucuk(durum.admin.arama.trim());
  const liste = kaynak.filter((k) => {
    const eksik = bos(k.bilgi) || bos(k.kaynak);
    const metin = trKucuk(`${k.isim || k.ad || ""} ${devirOf(k)} ${duzMetin(k.bilgi)}`);
    return (!q || metin.includes(q)) && (!durum.admin.sadeceEksik || eksik);
  }).slice();
  if (durum.admin.siralama === "yeni") {
    liste.sort((a, b) => (b.guncellemeTarihi || b.eklenmeTarihi || 0) - (a.guncellemeTarihi || a.eklenmeTarihi || 0));
  } else liste.sort(adSirala);
  return liste;
}

function adminListeGovdesiGuncelle() {
  const el = $("#admin-liste-kayitlar");
  if (!el) return;
  const liste = adminFiltrelenmisListe();
  el.innerHTML = liste.length ? liste.map((k) => {
    const eksik = bos(k.bilgi) || bos(k.kaynak);
    return `<div class="admin-list-item">
      <div><h4>${esc(k.isim || k.ad)}</h4><span>${esc(devirOf(k))}</span>${eksik ? `<span class="admin-record-status">Eksik</span>` : ""}</div>
      <div class="admin-list-actions">
        <button type="button" class="btn-small" data-action="admin-duzenle" data-id="${esc(k.id)}">Düzenle</button>
        <button type="button" class="btn-small btn-danger" data-action="admin-sil" data-id="${esc(k.id)}">Sil</button>
      </div>
    </div>`;
  }).join("") : `<div class="admin-liste-bos">Filtrelerle eşleşen kayıt yok.</div>`;
  const sayi = $("#admin-sonuc-sayisi");
  if (sayi) sayi.textContent = `${liste.length} kayıt`;
}

function adminListeGuncelle() {
  const el = $("#admin-liste");
  if (!el) return;
  adminSekmeleriGuncelle();
  adminOzetGuncelle();
  if (durum.admin.sekme === "makale") { mkListeGuncelle(); return; }
  adminKisiListesiniGuncelle();
  adminKopyaUyarisiGuncelle();
  if (durum.hata) { el.innerHTML = `<div class="admin-liste-bos">Kayıtlar yüklenemedi: ${esc(durum.hata)}</div>`; return; }
  const yuk = durum.admin.sekme === "zat" ? durum.yuklendi.zat : durum.yuklendi.olay;
  if (!yuk) { el.innerHTML = `<div class="admin-liste-bos">Yükleniyor…</div>`; return; }
  el.innerHTML = `<div class="admin-list-toolbar">
      <input id="admin-arama" type="search" value="${esc(durum.admin.arama)}" placeholder="Kayıtlarda ara…" aria-label="Yönetici kayıtlarında ara">
      <select id="admin-sirala" aria-label="Kayıtları sırala">
        <option value="ad"${durum.admin.siralama === "ad" ? " selected" : ""}>Ada göre</option>
        <option value="yeni"${durum.admin.siralama === "yeni" ? " selected" : ""}>Son güncellenen</option>
      </select>
      <label class="admin-filter-check"><input id="admin-eksik" type="checkbox"${durum.admin.sadeceEksik ? " checked" : ""}> Yalnızca eksikler</label>
      <small id="admin-sonuc-sayisi"></small>
    </div><div id="admin-liste-kayitlar"></div>`;
  adminListeGovdesiGuncelle();
}

const EDITOR_HTML = `<div class="form-field"><label>Bilgi</label>
  <div class="editor-wrap">
    <div class="editor-toolbar">
      <button type="button" data-action="komut" data-komut="bold" title="Kalın"><b>B</b></button>
      <button type="button" data-action="komut" data-komut="italic" title="İtalik"><i>I</i></button>
      <button type="button" data-action="komut" data-komut="underline" title="Altı çizili"><u>U</u></button>
      <button type="button" data-action="komut" data-komut="insertUnorderedList" title="Madde işaretli liste">•</button>
      <button type="button" data-action="komut" data-komut="insertOrderedList" title="Numaralı liste">1.</button>
      <button type="button" data-action="komut" data-komut="formatBlock" data-deger="h3" title="Başlık">H</button>
      <button type="button" data-action="komut" data-komut="formatBlock" data-deger="blockquote" title="Alıntı">“</button>
      <button type="button" data-action="komut" data-komut="createLink" title="Bağlantı ekle">↗</button>
    </div>
    <div id="f-bilgi" class="rich-editor" contenteditable="true" data-placeholder="Metni buraya yazın…"></div>
  </div></div>`;

function adminAyniKisiBul(ad) {
  const anahtar = adAnahtar(ad);
  if (!anahtar) return null;
  return durum.zatlar.find((z) => z.id !== durum.admin.duzenleId && adAnahtar(z.isim) === anahtar) || null;
}

function adminKisiListesiniGuncelle() {
  const liste = $("#admin-kisi-listesi");
  if (!liste) return;
  liste.innerHTML = durum.zatlar
    .filter((z) => z.id !== durum.admin.duzenleId && !bos(z.isim))
    .map((z) => `<option value="${esc(adTemiz(z.isim))}">${esc(devirOf(z))}</option>`)
    .join("");
}

/* Anne/baba/eş/çocuk alanlarının altında, yazılan ismin hangi kayda bağlandığını gösterir */
function adminBagDurumuGuncelle() {
  const ix = adIndeksiKur(durum.zatlar.filter((z) => z.id !== durum.admin.duzenleId));
  const alanIdleri = { "f-anne": "anneId", "f-baba": "babaId", "f-es": "esIds", "f-cocuklar": "cocukIds" };
  const duzenlenen = durum.zatlar.find((z) => z.id === durum.admin.duzenleId);
  ["f-anne", "f-baba", "f-es", "f-cocuklar"].forEach((id) => {
    const alan = $("#" + id);
    if (!alan) return;
    let el = $("#" + id + "-bag");
    if (!el) { el = document.createElement("p"); el.id = id + "-bag"; el.className = "form-hint"; alan.parentNode.appendChild(el); }
    const coklu = id === "f-es" || id === "f-cocuklar";
    const adlar = coklu ? esListesiniAyir(alan.value) : (bos(alan.value) ? [] : [alan.value.trim()]);
    el.innerHTML = adlar.map((ad) => {
      const eskiAdaylar = mevcutBagAdaylari(duzenlenen, ad, alanIdleri[id]);
      if (eskiAdaylar.length === 1) return "✓ " + esc(eskiAdaylar[0].isim) + " (mevcut bağ korunur)";
      if (eskiAdaylar.length > 1) return "✓ " + esc(ad) + " (mevcut aynı isimli bağlar korunur)";
      const s = adCozumle(ad, ix, true);
      if (s.kayit) return "✓ " + esc(s.kayit.isim);
      if (s.durum === "belirsiz") return `⚠ “${esc(ad)}” birden fazla kayıtla eşleşiyor`;
      return `⚠ “${esc(ad)}” kayıtlı değil: yalnızca metin olarak saklanır, akrabalık bağı kurulmaz`;
    }).join("<br>");
  });
}

function adminKopyaUyarisiGuncelle() {
  const alan = $("#f-isim"), uyari = $("#f-kopya-uyari");
  if (!alan || !uyari) return null;
  const ayni = adminAyniKisiBul(alan.value);
  alan.toggleAttribute("aria-invalid", !!ayni);
  uyari.innerHTML = ayni
    ? `<strong>Bu şahsiyet sistemde zaten kayıtlı:</strong> ${esc(ayni.isim)}
       <button type="button" class="btn-small" data-action="admin-duzenle" data-id="${esc(ayni.id)}">Mevcut kaydı aç</button>`
    : "";
  uyari.hidden = !ayni;
  return ayni;
}

function adminKirliAyarla(kirli) {
  durum.admin.kirli = !!kirli;
  const el = $("#f-kirli");
  if (el) el.hidden = !durum.admin.kirli;
}

function adminDegisikligiBirakabilir() {
  const mesaj = document.documentElement.lang === "en"
    ? "There are unsaved changes. Continue anyway?"
    : "Kaydedilmemiş değişiklikler var. Yine de devam edilsin mi?";
  return !durum.admin.kirli || confirm(mesaj);
}

function adminYeniKayit(tip) {
  if (!adminMi() || !["zat", "olay"].includes(tip)) return;
  if (!adminDegisikligiBirakabilir()) return;
  durum.admin.sekme = tip;
  durum.admin.arama = "";
  durum.admin.sadeceEksik = false;
  adminListeGuncelle();
  adminFormuKur();
  const form = $("#admin-form");
  if (form && form.scrollIntoView) form.scrollIntoView({ behavior: "smooth", block: "start" });
  const ilkAlan = tip === "olay" ? $("#f-ad") : $("#f-isim");
  if (ilkAlan) setTimeout(() => ilkAlan.focus({ preventScroll: true }), 350);
}

function adminFormuKur() {
  const el = $("#admin-form");
  if (!el) return;
  durum.admin.duzenleId = null;
  if (durum.admin.sekme === "makale") { mkFormuKur(null); return; }
  const devirSecenek = DEVIRLER.map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
  if (durum.admin.sekme === "zat") {
    el.innerHTML = `<div class="admin-form">
      <h3 id="f-baslik">Yeni şahsiyet</h3>
      <div id="f-mesaj"></div>
      <div class="form-field"><label for="f-isim">İsim</label><input id="f-isim" type="text" autocomplete="off" aria-describedby="f-kopya-uyari"></div>
      <div id="f-kopya-uyari" class="form-duplicate" role="alert" aria-live="polite" hidden></div>
      <div class="form-field"><label for="f-cinsiyet">Cinsiyet</label><select id="f-cinsiyet"><option value="">Belirtilmedi</option><option value="erkek">Erkek</option><option value="kadin">Kadın</option></select><p class="form-hint">Amca, dayı, hala, teyze ve kuzen gibi akrabalıklar buna göre otomatik bulunur. Kişi başka bir kaydın anne/babası olarak yazılmışsa cinsiyeti zaten anlaşılır.</p></div>
      <div class="check-satir"><input type="checkbox" id="f-ra" checked><label for="f-ra">İsmin sonuna (ra) ekle</label></div>
      <p class="form-hint checkbox-hint">İşaret kaldırılırsa bu şahsiyetin kartı arşivde ve rastgele şahsiyet sayfasında kırmızı gösterilir.</p>
      <div class="form-field"><label for="f-devir">Yaşadığı devir</label><select id="f-devir">${devirSecenek}</select></div>
      <div class="form-row">
        <div class="form-field"><label for="f-anne">Anne</label><input id="f-anne" type="text" list="admin-kisi-listesi" autocomplete="off"><p class="form-hint">Yazmaya başlayın veya mevcut şahsiyetlerden seçin.</p></div>
        <div class="form-field"><label for="f-baba">Baba</label><input id="f-baba" type="text" list="admin-kisi-listesi" autocomplete="off"><p class="form-hint">Yazmaya başlayın veya mevcut şahsiyetlerden seçin.</p></div>
      </div>
      <datalist id="admin-kisi-listesi"></datalist>
      <div class="form-field"><label for="f-es">Eşi / Eşleri</label><input id="f-es" type="text"><p class="form-hint">Birden fazla ise virgülle ayırın. Karşı tarafta ayrıca yazmanız gerekmez.</p></div>
      <div class="form-field"><label for="f-cocuklar">Çocukları</label><input id="f-cocuklar" type="text"><p class="form-hint">Virgülle ayırın. Çocuğun kaydında anne/baba yazmasa da bu kişi onun ebeveyni sayılır (cinsiyeti seçiliyse anne veya baba olarak).</p></div>
      <div class="form-field"><label for="f-baglar">Diğer bağlar</label><input id="f-baglar" type="text" placeholder="Örn. Ali (Süt kardeşi)">
        <p class="form-hint">Kardeş, dede, nine, torun, amca, dayı, hala, teyze, yeğen ve kuzenler anne/baba/eş/çocuk bilgilerinden otomatik hesaplanır. Anne/baba bilinmiyorsa kardeşi buraya “İsim (Kardeş)” diye yazın: kardeşin anne/babası bu kayda da uygulanır. Süt kardeşlik nesep sayılmaz. Biçim: İsim (Tür), virgülle ayırın.</p></div>
      <div id="f-akraba-onizleme" class="admin-akraba-onizleme" aria-live="polite"></div>
      <div class="form-row">
        <div class="form-field"><label for="f-d-hicri">Doğum (Hicri)</label><input id="f-d-hicri" type="text"></div>
        <div class="form-field"><label for="f-d-miladi">Doğum (Miladi)</label><input id="f-d-miladi" type="text"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label for="f-v-hicri">Vefat (Hicri)</label><input id="f-v-hicri" type="text"></div>
        <div class="form-field"><label for="f-v-miladi">Vefat (Miladi)</label><input id="f-v-miladi" type="text"></div>
      </div>
      ${EDITOR_HTML}
      <div class="form-field"><label for="f-kaynak">Kaynak / sayfa no</label><input id="f-kaynak" type="text"></div>
      <div class="form-actions">
        <button type="button" class="button primary" data-action="admin-kaydet">Kaydet</button>
        <button type="button" class="button" data-action="admin-iptal">Temizle</button>
        <span id="f-kirli" class="unsaved-badge" hidden>Kaydedilmemiş değişiklik</span>
      </div>
    </div>`;
  } else {
    el.innerHTML = `<div class="admin-form">
      <div class="admin-form-heading"><span>Olay kaydı</span><h3 id="f-baslik">Yeni olay ekle</h3><p>Olayı zaman çizelgesinde doğru konumlandırmak için en az bir tarih ve doğrulanabilir kaynak ekleyin.</p></div>
      <div id="f-mesaj"></div>
      <div class="form-field"><label for="f-ad">Olay başlığı <span class="required-mark">Zorunlu</span></label><input id="f-ad" type="text" autocomplete="off" placeholder="Örn. Bedir Gazvesi" required></div>
      <div class="form-field"><label for="f-devir">Tarihî dönem</label><select id="f-devir">${devirSecenek}</select></div>
      <div class="form-row">
        <div class="form-field"><label for="f-hicri">Hicri tarih</label><input id="f-hicri" type="text" placeholder="Örn. H. 2"></div>
        <div class="form-field"><label for="f-miladi">Miladi tarih</label><input id="f-miladi" type="text" inputmode="numeric" placeholder="Örn. 624"></div>
      </div>
      ${EDITOR_HTML}
      <div class="form-field"><label for="f-kaynak">Kaynak / sayfa no</label><input id="f-kaynak" type="text" placeholder="Eser adı, cilt ve sayfa"></div>
      <div class="form-actions">
        <button type="button" class="button primary" data-action="admin-kaydet">Olayı kaydet</button>
        <button type="button" class="button" data-action="admin-iptal">Formu temizle</button>
        <span id="f-kirli" class="unsaved-badge" hidden>Kaydedilmemiş değişiklik</span>
      </div>
    </div>`;
  }
  adminKisiListesiniGuncelle();
  adminBagDurumuGuncelle();
  adminKirliAyarla(false);
}

function formMesaj(metin, hata, uyari = false) {
  const el = $("#f-mesaj");
  if (el) el.innerHTML = metin ? `<p class="${hata ? "form-error" : uyari ? "form-warning" : "form-ok"}">${esc(metin)}</p>` : "";
}

function adminFormuDoldur(k) {
  if (durum.admin.sekme === "makale") { mkFormuKur(k); return; }
  setTimeout(adminAkrabaOnizleme, 0);
  const zat = durum.admin.sekme === "zat";
  const set = (id, v) => { const e = $("#" + id); if (e) e.value = bos(v) ? "" : v; };
  durum.admin.duzenleId = k.id;
  adminKisiListesiniGuncelle();
  if (zat) {
    set("f-isim", k.isim); set("f-anne", k.anne); set("f-baba", k.baba); set("f-es", k.es); set("f-baglar", k.baglar); set("f-cocuklar", k.cocuklar); set("f-cinsiyet", cinsiyetOf(k));
    set("f-d-hicri", k.d_hicri); set("f-d-miladi", k.d_miladi); set("f-v-hicri", k.v_hicri); set("f-v-miladi", k.v_miladi);
    const ra = $("#f-ra");
    if (ra) ra.checked = typeof k.kirmiziKart === "boolean"
      ? !k.kirmiziKart
      : /\((r\.?\s?a|r\.?\s?anh)/i.test(k.isim || "");
  } else {
    set("f-ad", k.ad); set("f-hicri", k.hicri); set("f-miladi", k.miladi);
  }
  set("f-devir", devirOf(k)); set("f-kaynak", k.kaynak);
  const ed = $("#f-bilgi"); if (ed) ed.innerHTML = bos(k.bilgi) ? "" : temizHtml(k.bilgi);
  const b = $("#f-baslik"); if (b) b.textContent = zat ? "Şahsiyeti düzenle" : "Olayı düzenle";
  formMesaj("", false);
  adminKopyaUyarisiGuncelle();
  adminBagDurumuGuncelle();
  adminKirliAyarla(false);
  const f = $("#admin-form"); if (f && f.scrollIntoView) f.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- AKRABALIK: bağlar kayıt ID'siyle tutulur ----------
   Yönetici SADECE anne, baba, eş, çocuk (ve cinsiyet) girer. Formda yazılan isim, mevcut bir
   kayıtla TAM eşleşirse kaydın ID'si saklanır (anneId, babaId, esIds, cocukIds). Aynı isimli
   farklı kişiler bu sayede karışmaz. Kayıtlı olmayan isimler yalnızca metin olarak kalır.

   Kardeş, dede, nine, büyük dede/nine, torun, amca, dayı, hala, teyze, yeğen, kuzen, gelin/damat ve
   kayınlar veritabanına YAZILMAZ; soyağacı açılırken bu ID bağlarından HESAPLANIR
   (akrabalikGrafigi + akrabalikHesapla).

   - Çocuk yazmak, o çocuğun kaydında anne/baba yazmasa da yeterlidir. Ebeveyn rolü (anne/baba)
     ebeveynin cinsiyetinden bulunur. Aynı rolde iki ebeveyn olamaz: çocuğun kendi kaydı kazanır.
   - Eş bağı tek taraftan girilse de iki yönlü sayılır.
   - "Diğer bağlar" alanı yalnızca otomatik bulunamayan istisnalar içindir (ör. süt kardeşi).
   - Henüz ID'ye dönüştürülmemiş eski kayıtlarda yalnızca KESİN eşleşen isimler kullanılır. */
function kbBaglarString(bagListesi) {
  return bagListesi.map((b) => (b.tur ? `${b.ad} (${b.tur})` : b.ad)).join(", ");
}
function esListesiniAyir(es) {
  return bos(es) ? [] : String(es).split(/\s*,\s*/).filter(Boolean);
}
function esListesiniBirlestir(liste) {
  return liste.length ? liste.join(", ") : "?";
}
function cinsiyetOf(z) {
  /* "Kadın", "KADIN", "kadin", "Erkek" … hepsi aynı kabul edilir */
  const c = String((z && z.cinsiyet) || "").toLocaleLowerCase("tr").replace(/ı/g, "i").trim();
  return c === "erkek" || c === "kadin" ? c : null;
}
/* Cinsiyet girilmemişse isimden tahmin (yalnızca etiketler için: Amca/Hala, Oğlu/Kızı…) */
const KADIN_ADLARI = new Set(["ayşe", "aişe", "aise", "ayse", "fatıma", "fatima", "fatımatüz", "hatice", "zeynep", "zeyneb", "rukiyye", "rukayye", "rukıyye", "hafsa", "esma", "sevde", "meymune", "safiyye", "cüveyriye", "amine", "halime", "şeyma", "sümeyye", "hind", "ümame", "nesibe", "berre", "hamne", "hansa", "mariye", "ümmü", "ummu", "cemile", "atike", "erva", "selma", "leyla", "rabia", "naile", "sehle", "seleme"]);
const ERKEK_ADLARI = new Set(["ali", "ömer", "omer", "osman", "hasan", "hüseyin", "huseyin", "muhammed", "ahmed", "hamza", "abbas", "cafer", "akil", "abdullah", "abdurrahman", "abdülmüttalip", "abdulmuttalip", "kasım", "kasim", "ibrahim", "zeyd", "halid", "said", "saad", "sa'd", "talha", "zübeyr", "bilal", "enes", "ebu", "ebû", "muaviye", "amr", "haris", "muaz", "mus'ab", "musab", "cabir", "ubeyde", "selman", "ammar", "yasir", "ikrime", "usame", "üsame", "affan", "hattab", "vehb", "huveylid", "rafi", "safvan", "lebid", "hatıb", "ahnes", "rifaa", "sa'lebe", "salebe"]);
function cinsiyetTahmin(z) {
  const ad = trKucuk(adTemiz((z && (z.isim || z.ad)) || "")).replace(/^(hz|hazreti|hazret-i)\.?\s*/, "");
  if (!ad) return null;
  if (/\s(binti|bint|bintü)\s/.test(" " + ad + " ")) return "kadin";
  const ilk = ad.split(/[\s'-]+/)[0];
  if (KADIN_ADLARI.has(ilk)) return "kadin";
  if (/\s(bin|ibn|ibni|ibn-i|ibnü)\s/.test(" " + ad + " ") || ERKEK_ADLARI.has(ilk)) return "erkek";
  return null;
}
const dugumAdi = (n) => (n.kayit ? n.kayit.isim : n.ad);

const idListesi = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
const baglarGocMu = (z) => ["anneId", "babaId", "esIds", "cocukIds"].some((a) => a in z);
function mevcutBagAdaylari(kayit, ad, idAlan) {
  if (!kayit || bos(ad)) return [];
  const ids = Array.isArray(kayit[idAlan]) ? kayit[idAlan] : [kayit[idAlan]];
  return [...new Set(ids.filter(Boolean))]
    .map((id) => durum.zatlar.find((z) => z.id === id))
    .filter((z) => z && adAnahtar(z.isim) === adAnahtar(ad));
}
/* "Hz. Ali (ra)" ve "Ali" aynı anahtara iner */
const hzsiz = (ad) => adAnahtar(ad).replace(/^(hz|hazreti)\.?\s+/, "");

/* İsim → kayıt eşleştirme tablosu. "onek": başka bir ismin baş kısmı olan isimler
   (ör. "Abdullah", "Abdullah bin Ömer"in başıdır) → belirsiz sayılır. */
function adIndeksiKur(zatlar) {
  const tam = new Map(), onek = new Set();
  zatlar.forEach((z) => {
    const h = hzsiz(z.isim);
    if (!h) return;
    if (!tam.has(h)) tam.set(h, []);
    tam.get(h).push(z);
    const kel = h.split(" ");
    for (let i = 1; i < kel.length; i++) onek.add(kel.slice(0, i).join(" "));
  });
  return { tam, onek };
}

/* acik=true: yönetici formunda, isim tam yazılmışsa tek kayıtla eşleşmesi yeterli.
   acik=false: otomatik dönüştürmede, belirsiz isimler ASLA bağlanmaz. */
function adCozumle(ad, ix, acik) {
  const a = hzsiz(ad);
  const l = a ? ix.tam.get(a) : null;
  if (!l) return { durum: "yok" };
  if (l.length > 1 || (!acik && ix.onek.has(a))) return { durum: "belirsiz", adaylar: l };
  return { durum: "tamam", kayit: l[0] };
}

/* Bir kaydın bağlarını ID olarak döndürür.
   ID alanı olan kayıt: yalnızca ID'lere güvenilir.
   Henüz dönüştürülmemiş eski kayıt: sadece KESİN eşleşen isimler kullanılır. */
function baglariCoz(z, idx, ix) {
  const tek = (id) => (id && id !== z.id && idx.has(id) ? id : "");
  const liste = (a) => [...new Set(idListesi(a).filter((id) => id !== z.id && idx.has(id)))];
  if (baglarGocMu(z)) return { anne: tek(z.anneId), baba: tek(z.babaId), es: liste(z.esIds), cocuk: liste(z.cocukIds) };
  const bir = (ad) => {
    if (bos(ad)) return "";
    const s = adCozumle(ad, ix, false);
    return s.durum === "tamam" && s.kayit.id !== z.id ? s.kayit.id : "";
  };
  const cok = (ad) => [...new Set(esListesiniAyir(ad).map(bir).filter(Boolean))];
  const eskiCocuk = baglariAyir(z.baglar).filter((b) => trKucuk(b.tur) === "çocuk").map((b) => bir(b.ad)).filter(Boolean);
  return { anne: bir(z.anne), baba: bir(z.baba), es: cok(z.es), cocuk: [...new Set([...cok(z.cocuklar), ...eskiCocuk])] };
}

/* Tüm kayıtlardan bir akrabalık grafiği kurar. Düğüm anahtarı kayıt ID'sidir. Yazma yapmaz. */
function akrabalikGrafigi(zatlar) {
  const idx = new Map(zatlar.map((z) => [z.id, z]));
  const ix = adIndeksiKur(zatlar);
  const dugumler = new Map();
  zatlar.forEach((z) => {
    const c = cinsiyetOf(z);
    dugumler.set(z.id, { key: z.id, ad: adTemiz(z.isim), kayit: z, cinsiyet: c || cinsiyetTahmin(z), kesin: !!c, tahmin: !c, ebeveynler: new Map(), cocuklar: new Set(), es: new Set(), kardes: new Map(), cikarim: new Set() });
  });
  const baglar = new Map(zatlar.map((z) => [z.id, baglariCoz(z, idx, ix)]));

  const ebeveynBagla = (cocuk, ebeveyn, rol) => {
    if (!cocuk || !ebeveyn || cocuk.key === ebeveyn.key) return;
    /* Bir kişinin aynı rolde iki ebeveyni olamaz: ilk yazılan (çocuğun kendi kaydı) kazanır */
    if (rol && [...cocuk.ebeveynler].some(([k, r]) => r === rol && k !== ebeveyn.key)) {
      console.warn("Çelişen " + rol + " bilgisi:", cocuk.ad, "→", ebeveyn.ad);
      return;
    }
    if (!rol && !cocuk.ebeveynler.has(ebeveyn.key) && cocuk.ebeveynler.size >= 2) {
      console.warn("Fazla ebeveyn bilgisi:", cocuk.ad, "→", ebeveyn.ad);
      return;
    }
    const eski = cocuk.ebeveynler.get(ebeveyn.key);
    if (eski === undefined || (!eski && rol)) cocuk.ebeveynler.set(ebeveyn.key, rol || null);
    ebeveyn.cocuklar.add(cocuk.key);
  };

  /* 1. tur: kişinin KENDİ kaydındaki anne / baba (ve bunlardan cinsiyet çıkarımı) */
  zatlar.forEach((z) => {
    const d = dugumler.get(z.id), b = baglar.get(z.id);
    /* Anne/baba olarak yazılmak, isimden yapılan tahminden daha güçlü bir bilgidir */
    if (b.baba) { const p = dugumler.get(b.baba); ebeveynBagla(d, p, "baba"); if (p && !p.kesin) { p.cinsiyet = "erkek"; p.tahmin = false; } }
    if (b.anne) { const p = dugumler.get(b.anne); ebeveynBagla(d, p, "anne"); if (p && !p.kesin) { p.cinsiyet = "kadin"; p.tahmin = false; } }
  });
  /* 2. tur: çocuk listeleri ve eşler */
  zatlar.forEach((z) => {
    const d = dugumler.get(z.id), b = baglar.get(z.id);
    const rol = d.cinsiyet === "erkek" ? "baba" : d.cinsiyet === "kadin" ? "anne" : null;
    b.cocuk.forEach((cid) => ebeveynBagla(dugumler.get(cid), d, rol));
    b.es.forEach((eid) => {
      const q = dugumler.get(eid);
      if (q && q.key !== d.key) { d.es.add(q.key); q.es.add(d.key); }
    });
  });
  /* Eşlerden biri biliniyorsa diğerinin cinsiyeti (yalnızca bilinmiyorsa) */
  dugumler.forEach((d) => {
    if (d.cinsiyet || !d.es.size) return;
    const bilinen = [...d.es].map((k) => dugumler.get(k)).find((e) => e && e.cinsiyet);
    if (bilinen) { d.cinsiyet = bilinen.cinsiyet === "erkek" ? "kadin" : "erkek"; d.tahmin = true; }
  });

  /* 3. tur: "Diğer bağlar" alanına elle yazılmış kardeşlikler — ör. "Abbas (Kardeş)".
     Soy bilgisiyle çelişen kardeşlik (ör. aslında yeğen olan biri) kullanılmaz, uyarı olarak raporlanır. */
  const uyarilar = [];
  const ustler = (key, derinlik = 4) => {
    const out = new Set(); let sinir = [key];
    for (let i = 0; i < derinlik; i++) {
      const sonraki = [];
      sinir.forEach((k) => { const n = dugumler.get(k); if (n) n.ebeveynler.forEach((_, pk) => { if (!out.has(pk)) { out.add(pk); sonraki.push(pk); } }); });
      sinir = sonraki;
    }
    return out;
  };
  const altlar = (key, derinlik = 4) => {
    const out = new Set(); let sinir = [key];
    for (let i = 0; i < derinlik; i++) {
      const sonraki = [];
      sinir.forEach((k) => { const n = dugumler.get(k); if (n) n.cocuklar.forEach((ck) => { if (!out.has(ck)) { out.add(ck); sonraki.push(ck); } }); });
      sinir = sonraki;
    }
    return out;
  };
  const ortakEbeveyn = (a, b) => [...a.ebeveynler.keys()].some((k) => b.ebeveynler.has(k));
  const kardesAdaylari = [];
  zatlar.forEach((z) => {
    baglariAyir(z.baglar).forEach((bg) => {
      const tur = trKucuk(bg.tur);
      if (!/karde[şs]/.test(tur) || /süt|sut/.test(tur)) return; /* süt kardeşlik nesep bağı değildir */
      const s = adCozumle(bg.ad, ix, true);
      if (s.kayit && s.kayit.id !== z.id) kardesAdaylari.push([z.id, s.kayit.id, tur]);
    });
  });
  kardesAdaylari.forEach(([ak, bk, tur]) => {
    const a = dugumler.get(ak), b = dugumler.get(bk);
    if (!a || !b || ortakEbeveyn(a, b)) return;
    const aUst = ustler(ak), bUst = ustler(bk);
    const nesilFarki = aUst.has(bk) || bUst.has(ak) || altlar(ak).has(bk)
      || [...b.ebeveynler.keys()].some((pk) => { const p = dugumler.get(pk); return p && [...a.ebeveynler.keys()].some((ak2) => p.ebeveynler.has(ak2)); })
      || [...a.ebeveynler.keys()].some((pk) => { const p = dugumler.get(pk); return p && [...b.ebeveynler.keys()].some((bk2) => p.ebeveynler.has(bk2)); });
    if (nesilFarki) {
      uyarilar.push({ tur: "kardes", ids: [ak, bk], metin: `${a.ad} ↔ ${b.ad}: “${tur}” olarak yazılmış ama anne/baba bilgilerine göre farklı kuşaktan. Bu bağ kullanılmadı; “Diğer bağlar” alanını kontrol edin.` });
      return;
    }
    if (!a.kardes.has(bk)) a.kardes.set(bk, tur);
    if (!b.kardes.has(ak)) b.kardes.set(ak, tur);
  });
  /* Tam kardeşlerde eksik ebeveyni tamamla (ör. Ali'nin babası girilmişse, kardeşi Akil'e de aynı baba) */
  dugumler.forEach((d) => {
    d.kardes.forEach((tur, sk) => {
      if (!/^(kardeş|kardes|kız kardeş|erkek kardeş|abla|ağabey)$/.test(tur)) return;
      const s = dugumler.get(sk);
      s.ebeveynler.forEach((rol, pk) => {
        if (!rol || d.ebeveynler.has(pk) || pk === d.key) return;
        if ([...d.ebeveynler.values()].includes(rol)) return;
        if (ustler(pk).has(d.key) || altlar(d.key).has(pk)) return;
        d.ebeveynler.set(pk, rol); dugumler.get(pk).cocuklar.add(d.key); d.cikarim.add(pk);
      });
    });
  });
  /* Cinsiyet çelişkileri: kayıtta "Erkek" yazıp birinin annesi olarak geçen vb. */
  dugumler.forEach((d) => {
    if (!d.kesin) return;
    d.cocuklar.forEach((ck) => {
      const rol = dugumler.get(ck).ebeveynler.get(d.key);
      if ((rol === "anne" && d.cinsiyet === "erkek") || (rol === "baba" && d.cinsiyet === "kadin")) {
        uyarilar.push({ tur: "cinsiyet", ids: [d.key, ck], metin: `${d.ad}: cinsiyeti “${d.cinsiyet === "erkek" ? "Erkek" : "Kadın"}” girilmiş ama ${dugumler.get(ck).ad} kaydında ${rol} olarak geçiyor.` });
      }
    });
  });
  dugumler.uyarilar = [...new Map(uyarilar.map((u) => [u.tur + [...u.ids].sort().join("|"), u])).values()];
  return dugumler;
}

/* Akrabalık grafiği pahalıdır; veri değişmedikçe yeniden kurulmaz */
let grafikOnbellek = { surum: -1, g: null, ix: null };
function grafikAl() {
  if (grafikOnbellek.surum !== durum.veriSurum || !grafikOnbellek.g) {
    grafikOnbellek = { surum: durum.veriSurum, g: akrabalikGrafigi(durum.zatlar), ix: adIndeksiKur(durum.zatlar) };
  }
  return grafikOnbellek;
}

/* Bir kişinin (key) tüm akrabalarını gruplar hâlinde döndürür:
   [{ id, baslik, goster, ogeler: [{ key, ad, kayit, etiket }] }] */
const AKRABALIK_GRUPLARI = [
  ["es", "Eşi / Eşleri", false], ["cocuk", "Çocukları", true], ["torun", "Torunları", false],
  ["kardes", "Kardeşleri", true], ["dedenine", "Dede ve nineleri", true],
  ["amcahala", "Amca, dayı, hala, teyze", true], ["yegen", "Yeğenleri", false],
  ["kuzen", "Kuzenleri", true], ["damat", "Gelin ve damatları", true], ["kayin", "Kayınları", true],
];
function akrabalikHesapla(g, key) {
  const d = g.get(key);
  if (!d) return [];
  const gruplar = new Map(AKRABALIK_GRUPLARI.map(([id]) => [id, new Map()]));
  const ekle = (grup, k, etiket) => {
    if (!k || k === key || !g.has(k)) return;
    const m = gruplar.get(grup);
    if (!m.has(k)) m.set(k, etiket);
  };
  const kardesler = (n) => {
    const m = new Map();
    n.ebeveynler.forEach((_, pk) => {
      const p = g.get(pk);
      if (p) p.cocuklar.forEach((ck) => { if (ck !== n.key) m.set(ck, (m.get(ck) || 0) + 1); });
    });
    if (n.kardes) n.kardes.forEach((_, sk) => { if (sk !== n.key && !m.has(sk)) m.set(sk, 2); });
    return m;
  };
  const cins = (n, e, k, b) => (n.cinsiyet === "erkek" ? e : n.cinsiyet === "kadin" ? k : b);

  /* Eş, çocuk, torun, gelin/damat */
  d.es.forEach((ek) => {
    ekle("es", ek, "Eşi");
    const e = g.get(ek);
    if (e) e.ebeveynler.forEach((_, pk) => { const p = g.get(pk); if (p) ekle("kayin", pk, cins(p, "Kayınpeder", "Kayınvalide", "Eşinin ebeveyni")); });
  });
  d.cocuklar.forEach((ck) => {
    const c = g.get(ck);
    if (!c) return;
    ekle("cocuk", ck, cins(c, "Oğlu", "Kızı", "Çocuğu"));
    c.cocuklar.forEach((tk) => ekle("torun", tk, "Torun"));
    c.es.forEach((ek) => ekle("damat", ek, cins(c, "Gelin", "Damat", "Çocuğunun eşi")));
  });

  /* Kardeş, yeğen */
  const benimKardeslerim = kardesler(d);
  benimKardeslerim.forEach((sayi, sk) => {
    const s = g.get(sk);
    let etiket = "Kardeş";
    const elle = d.kardes && d.kardes.get(sk);
    if (elle && /ana bir|baba bir|üvey/.test(elle)) etiket = elle.replace(/^./, (h) => h.toLocaleUpperCase("tr"));
    else if (d.ebeveynler.size >= 2 && s.ebeveynler.size >= 2 && sayi === 1) {
      const ortak = [...d.ebeveynler.keys()].find((pk) => s.ebeveynler.has(pk));
      const rol = d.ebeveynler.get(ortak);
      etiket = rol === "baba" ? "Baba bir kardeş" : rol === "anne" ? "Ana bir kardeş" : "Yarı kardeş";
    }
    ekle("kardes", sk, etiket);
    s.cocuklar.forEach((yk) => ekle("yegen", yk, "Yeğen"));
  });

  /* Dede, nine, büyük dede/nine (3 kuşak yukarı) */
  const ata = (n, derinlik, yan) => {
    n.ebeveynler.forEach((rol, pk) => {
      const p = g.get(pk);
      if (!p) return;
      const taraf = derinlik === 1 ? rol : yan;
      if (derinlik >= 2) {
        const ad = derinlik === 2 ? cins(p, "Dede", "Nine", "Dede / nine") : cins(p, "Büyük dede", "Büyük nine", "Büyük dede / nine");
        ekle("dedenine", pk, ad + (taraf === "baba" ? " (baba tarafı)" : taraf === "anne" ? " (anne tarafı)" : ""));
      }
      if (derinlik < 3) ata(p, derinlik + 1, taraf);
    });
  };
  ata(d, 1, null);

  /* Amca, dayı, hala, teyze ve onların çocukları (kuzenler) */
  d.ebeveynler.forEach((rol, pk) => {
    const p = g.get(pk);
    if (!p) return;
    kardesler(p).forEach((_, ak) => {
      const a = g.get(ak);
      if (d.ebeveynler.has(ak)) return;
      let etiket;
      if (rol === "baba") etiket = cins(a, "Amca", "Hala", "Babanın kardeşi");
      else if (rol === "anne") etiket = cins(a, "Dayı", "Teyze", "Annenin kardeşi");
      else etiket = "Ebeveyninin kardeşi";
      ekle("amcahala", ak, etiket);
      const temel = ["Amca", "Dayı", "Hala", "Teyze"].includes(etiket) ? etiket : null;
      a.cocuklar.forEach((kk) => {
        const k = g.get(kk);
        ekle("kuzen", kk, temel && k ? temel + cins(k, " oğlu", " kızı", " çocuğu") : "Kuzen");
      });
    });
  });

  return AKRABALIK_GRUPLARI.map(([id, baslik, goster]) => ({
    id, baslik, goster,
    ogeler: [...gruplar.get(id).entries()].map(([k, etiket]) => { const n = g.get(k); return { key: k, ad: dugumAdi(n), kayit: n.kayit, etiket }; }),
  })).filter((gr) => gr.ogeler.length);
}

/* ---- İsim değişikliği / silme sonrası referans güncelleme yardımcıları ---- */
/* eskiIsim'e (anne/baba/eş/çocuk/bağ alanlarında) referans veren TÜM kayıtları tarar.
   yeniIsim bir metin ise referansı yeni isimle değiştirir; null ise (kayıt
   silindiğinde) referansı tamamen kaldırır. Sadece hesaplar, yazmaz.
   (Yalnızca ID'ye dönüştürülmemiş eski kayıtlar için kullanılır.) */
function isimReferanslariniGuncelle(calisma, eskiIsim, yeniIsim) {
  const eskiAnah = adAnahtar(eskiIsim);
  if (!eskiAnah) return [];
  const guncellemeler = [];
  calisma.forEach((z) => {
    const patch = {};
    if (!bos(z.anne) && adAnahtar(z.anne) === eskiAnah) patch.anne = yeniIsim || "?";
    if (!bos(z.baba) && adAnahtar(z.baba) === eskiAnah) patch.baba = yeniIsim || "?";
    ["es", "cocuklar"].forEach((alan) => {
      if (bos(z[alan])) return;
      let degisti = false;
      const yeni = esListesiniAyir(z[alan]).map((e) => {
        if (adAnahtar(e) === eskiAnah) { degisti = true; return yeniIsim; }
        return e;
      }).filter(Boolean);
      if (degisti) patch[alan] = esListesiniBirlestir(yeni);
    });
    if (!bos(z.baglar)) {
      const bagListesi = baglariAyir(z.baglar);
      let degisti = false;
      const yeniListe = bagListesi.map((b) => {
        if (adAnahtar(b.ad) === eskiAnah) {
          degisti = true;
          return yeniIsim ? { ad: yeniIsim, tur: b.tur } : null;
        }
        return b;
      }).filter(Boolean);
      if (degisti) patch.baglar = kbBaglarString(yeniListe) || "?";
    }
    if (Object.keys(patch).length) guncellemeler.push({ id: z.id, veri: patch });
  });
  return guncellemeler;
}

/* Bir kayıt yeniden adlandırılınca (yeniAd metin) veya silinince (yeniAd null),
   ONA ID İLE BAĞLI kayıtların gösterim metinlerini/ID'lerini günceller. Yazmaz, hesaplar. */
function idReferansYamalari(zatlar, hedefId, eskiAd, yeniAd) {
  const eskiAnah = adAnahtar(eskiAd);
  const yamalar = [];
  zatlar.forEach((z) => {
    if (z.id === hedefId) return;
    const p = {};
    [["anneId", "anne"], ["babaId", "baba"]].forEach(([idA, metinA]) => {
      if (z[idA] === hedefId) { p[metinA] = yeniAd || "?"; if (!yeniAd) p[idA] = ""; }
    });
    [["esIds", "es"], ["cocukIds", "cocuklar"]].forEach(([idA, metinA]) => {
      const ids = idListesi(z[idA]);
      if (!ids.includes(hedefId)) return;
      const adlar = esListesiniAyir(z[metinA]).map((e) => (adAnahtar(e) === eskiAnah ? yeniAd : e)).filter(Boolean);
      p[metinA] = esListesiniBirlestir(adlar);
      if (!yeniAd) p[idA] = ids.filter((x) => x !== hedefId);
    });
    if (Object.keys(p).length) yamalar.push({ id: z.id, veri: p });
  });
  return yamalar;
}
function tumReferansYamalari(calisma, hedefId, eskiAd, yeniAd) {
  return [
    ...idReferansYamalari(calisma, hedefId, eskiAd, yeniAd),
    ...isimReferanslariniGuncelle(calisma.filter((z) => z.id !== hedefId && !baglarGocMu(z)), eskiAd, yeniAd),
  ];
}

async function kbGuncellemeleriYaz(guncellemeler) {
  /* Firestore writeBatch en fazla 500 işlem alabildiğinden, güvenli olması için 400'lük parçalar hâlinde yazıyoruz */
  for (let i = 0; i < guncellemeler.length; i += 400) {
    const parca = guncellemeler.slice(i, i + 400);
    const batch = FS.writeBatch(db);
    const zaman = Date.now();
    parca.forEach((g) => batch.update(FS.doc(db, "zatlar", g.id), { ...g.veri, guncellemeTarihi: zaman }));
    await batch.commit();
  }
}

/* Bir zat kaydı kaydedildikten sonra çağrılır. Yalnızca İSİM DEĞİŞTİYSE, ona bağlı kayıtlardaki
   eski ismi yeni isimle değiştirir. (Akrabalıklar hesaplandığı için başka senkronizasyon yok.) */
async function kayitSonrasiSenkronizeEt(kayitId, kaydedilenObj, eskiIsim) {
  if (!FS || !db || !kayitId || !eskiIsim) return [];
  if (adAnahtar(eskiIsim) === adAnahtar(kaydedilenObj.isim)) return [];
  try {
    const calisma = durum.zatlar.filter((z) => z.id !== kayitId).map((z) => ({ ...z }));
    const guncellemeler = tumReferansYamalari(calisma, kayitId, eskiIsim, kaydedilenObj.isim);
    if (!guncellemeler.length) return [];
    await kbGuncellemeleriYaz(guncellemeler);
    return guncellemeler.map((g) => (calisma.find((z) => z.id === g.id) || {}).isim || g.id);
  } catch (e) {
    console.error("İsim referansı güncelleme hatası:", e);
    return [];
  }
}

/* Bir zat kaydı SİLİNDİKTEN sonra çağrılır: silinen kayda bağlı TÜM diğer kayıtlardan
   bu referansı (ID ve metin) kaldırır. */
async function adminSilinenReferanslariTemizle(silinenId, silinenIsim) {
  if (!FS || !db || bos(silinenIsim)) return [];
  try {
    const calisma = durum.zatlar.filter((z) => z.id !== silinenId).map((z) => ({ ...z }));
    const guncellemeler = tumReferansYamalari(calisma, silinenId, silinenIsim, null);
    if (!guncellemeler.length) return [];
    await kbGuncellemeleriYaz(guncellemeler);
    return guncellemeler.map((g) => (calisma.find((z) => z.id === g.id) || {}).isim || g.id);
  } catch (e) {
    console.error("Silinen kayıt referans temizleme hatası:", e);
    return [];
  }
}

/* "Eski bağları temizle" düğmesi. Bir kez çalıştırmanız yeterlidir; tekrar çalıştırmak zarar vermez.
   1) Tüm kayıtlarda anne/baba/eş/çocuk isimlerini kayıt ID'sine çevirir. Yalnızca KESİN eşleşenler
      bağlanır; belirsiz isimler (ör. sadece "Abdullah") bağlanmaz ve sonunda listelenir.
   2) "(Çocuk)" bağlarını "Çocukları" alanına taşır.
   3) Artık hesaplanan kardeş/dede/nine/torun/amca/dayı/hala/teyze/yeğen bağlarından doğrulananları
      "Diğer bağlar"dan siler. Doğrulanamayanlara dokunmaz, sonunda listeler. */
const TURETILEN_TURLER = {
  "kardeş": "kardes", "dede": "dedenine", "nine": "dedenine", "torun": "torun",
  "amca": "amcahala", "dayı": "amcahala", "hala": "amcahala", "teyze": "amcahala", "yeğen": "yegen",
};
const ID_YAMA_ALANLARI = ["anneId", "babaId", "esIds", "cocukIds", "cocuklar", "baglar"];
async function adminBaglariTemizle() {
  if (!adminMi()) return;
  if (!durum.yuklendi.zat) { alert("Şahsiyet listesi henüz yüklenmedi, birkaç saniye sonra tekrar deneyin."); return; }
  if (!confirm("Akrabalık bağları isim yerine kayıt ID'siyle tutulacak. Belirsiz isimler (ör. sadece \"Abdullah\") bağlanmaz ve size listelenir. (Çocuk) bağları \"Çocukları\" alanına taşınacak, artık otomatik hesaplanan kardeş/dede/amca/yeğen gibi bağlar silinecek. Önce JSON yedeği indirmeniz önerilir. Devam edilsin mi?")) return;
  try {
    const calisma = durum.zatlar.map((z) => ({ ...z }));
    const ix = adIndeksiKur(calisma);
    const belirsiz = new Set();
    const coz = (z, alan, ad) => {
      if (bos(ad)) return "";
      const s = adCozumle(ad, ix, false);
      if (s.durum === "tamam" && s.kayit.id !== z.id) return s.kayit.id;
      if (s.durum === "belirsiz") belirsiz.add(`${adTemiz(z.isim)} → ${alan}: ${ad}`);
      return "";
    };
    const cok = (z, alan, ad) => [...new Set(esListesiniAyir(ad).map((x) => coz(z, alan, x)).filter(Boolean))];

    /* 1) (Çocuk) bağlarını metne taşı, 2) ID alanlarını doldur */
    calisma.forEach((z) => {
      const liste = baglariAyir(z.baglar);
      const cocukB = liste.filter((b) => trKucuk(b.tur) === "çocuk");
      if (cocukB.length) {
        const m = esListesiniAyir(z.cocuklar), an = new Set(m.map(adAnahtar));
        cocukB.forEach((b) => { if (!an.has(adAnahtar(b.ad))) { an.add(adAnahtar(b.ad)); m.push(b.ad); } });
        z.cocuklar = m.join(", ");
        z.baglar = kbBaglarString(liste.filter((b) => trKucuk(b.tur) !== "çocuk")) || "?";
      }
      if (baglarGocMu(z)) return; /* zaten dönüştürülmüş */
      z.anneId = coz(z, "anne", z.anne);
      z.babaId = coz(z, "baba", z.baba);
      z.esIds = cok(z, "eş", z.es);
      z.cocukIds = cok(z, "çocuk", z.cocuklar);
    });

    /* 3) Artık hesaplanan bağları "Diğer bağlar"dan temizle */
    const g = akrabalikGrafigi(calisma);
    const dogrulanamayan = [];
    calisma.forEach((z) => {
      if (bos(z.baglar)) return;
      const liste = baglariAyir(z.baglar);
      if (!liste.some((b) => TURETILEN_TURLER[trKucuk(b.tur)])) return;
      const gruplar = akrabalikHesapla(g, z.id);
      const kalan = liste.filter((b) => {
        const grupId = TURETILEN_TURLER[trKucuk(b.tur)];
        if (!grupId) return true;
        const s = adCozumle(b.ad, ix, true);
        const gr = gruplar.find((x) => x.id === grupId);
        const onayli = !!(s.kayit && gr && gr.ogeler.some((o) => o.key === s.kayit.id));
        if (!onayli) dogrulanamayan.push(`${adTemiz(z.isim)} → ${b.ad} (${b.tur})`);
        return !onayli;
      });
      if (kalan.length !== liste.length) z.baglar = kbBaglarString(kalan) || "?";
    });

    /* Yalnızca değişen alanları yaz */
    const guncellemeler = [];
    calisma.forEach((z, i) => {
      const eski = durum.zatlar[i], veri = {};
      ID_YAMA_ALANLARI.forEach((a) => {
        if (JSON.stringify(z[a] === undefined ? null : z[a]) !== JSON.stringify(eski[a] === undefined ? null : eski[a])) veri[a] = z[a];
      });
      if (Object.keys(veri).length) guncellemeler.push({ id: z.id, veri });
    });
    if (guncellemeler.length) await kbGuncellemeleriYaz(guncellemeler);

    let mesaj = guncellemeler.length ? `${guncellemeler.length} kayıt güncellendi.` : "Güncellenecek kayıt bulunamadı.";
    if (belirsiz.size) {
      const b = [...belirsiz];
      mesaj += `\n\nBELİRSİZ olduğu için BAĞLANMAYAN ${b.length} isim var. Bu kayıtları düzenleyip formdaki listeden tam ismi seçin:\n` +
        b.slice(0, 25).map((x) => "• " + x).join("\n") + (b.length > 25 ? `\n… ve ${b.length - 25} tane daha (F12 → Console).` : "");
      console.log("Belirsiz isimler:", b);
    }
    if (dogrulanamayan.length) {
      mesaj += `\n\nHesaplanıp doğrulanamadığı için DOKUNULMAYAN ${dogrulanamayan.length} "Diğer bağ" var (F12 → Console).`;
      console.log("Doğrulanamayan bağlar:", dogrulanamayan);
    }
    alert(mesaj);
  } catch (e) {
    console.error("Bağ dönüştürme hatası:", e);
    alert("Dönüştürme sırasında bir hata oluştu: " + (e && e.message ? e.message : e));
  }
}

async function adminKaydet() {
  if (!adminMi()) return formMesaj("Bu işlem için yönetici hesabıyla giriş yapmalısınız.", true);
  const zat = durum.admin.sekme === "zat";
  const id = durum.admin.duzenleId;
  const v = (i) => { const e = $("#" + i); return e ? e.value.trim() : ""; };
  const q = (x) => (x === "" || x == null ? "?" : x);
  const editor = $("#f-bilgi");
  const bilgi = editor && duzMetin(editor.innerHTML) ? temizHtml(editor.innerHTML) : "";
  const iliskiUyarilari = [];

  try {
    if (zat) {
      let ad = baslikBuyut(v("f-isim"));
      if (!ad) return formMesaj("İsim alanı boş bırakılamaz.", true);
      if (!durum.yuklendi.zat) return formMesaj("Mükerrer kayıt kontrolü için şahsiyet listesinin yüklenmesini bekleyin.", true);
      const ayni = adminAyniKisiBul(ad);
      if (ayni) {
        adminKopyaUyarisiGuncelle();
        return formMesaj(`Bu şahsiyet zaten kayıtlı: ${ayni.isim}`, true);
      }
      const ra = $("#f-ra");
      const raIsaretli = !ra || ra.checked;
      if (raIsaretli) {
        const kucuk = trKucuk(ad);
        if (!kucuk.includes("(ra)") && !kucuk.includes("(r.a.)") && !kucuk.includes("(r.a)")) ad += " (ra)";
      }
      /* Anne/baba/eş/çocuk: tam eşleşen kayıtlar ID ile bağlanır, kanonik adla saklanır */
      const ix = adIndeksiKur(durum.zatlar.filter((z) => z.id !== id));
      const eskiKayit = id ? durum.zatlar.find((z) => z.id === id) : null;
      const eskiBagAdaylari = (ham, idAlan) => mevcutBagAdaylari(eskiKayit, ham, idAlan);
      const coz1 = (ham, alan, idAlan) => {
        if (bos(ham)) return { ad: "?", id: "" };
        const eskiAdaylar = eskiBagAdaylari(ham, idAlan);
        if (eskiAdaylar.length === 1) return { ad: eskiAdaylar[0].isim, id: eskiAdaylar[0].id };
        const s = adCozumle(ham, ix, true);
        if (s.kayit) return { ad: s.kayit.isim, id: s.kayit.id };
        iliskiUyarilari.push(`${alan}: ${ham} (${s.durum === "belirsiz" ? "aynı isimli birden fazla kayıt var" : "arşivde ayrı kayıt yok"})`);
        return { ad: baslikBuyut(ham), id: "" };
      };
      const coz2 = (ham, alan, idAlan) => {
        const l = esListesiniAyir(ham).flatMap((ad) => {
          const eskiAdaylar = eskiBagAdaylari(ad, idAlan);
          return eskiAdaylar.length
            ? eskiAdaylar.map((z) => ({ ad: z.isim, id: z.id }))
            : [coz1(ad, alan, idAlan)];
        });
        const adlar = [...new Map(l.map((x) => [adAnahtar(x.ad), x.ad])).values()];
        return { ad: esListesiniBirlestir(adlar), ids: [...new Set(l.map((x) => x.id).filter(Boolean))] };
      };
      const anne = coz1(v("f-anne"), "Anne", "anneId"), baba = coz1(v("f-baba"), "Baba", "babaId"), es = coz2(v("f-es"), "Eş", "esIds"), cocuk = coz2(v("f-cocuklar"), "Çocuk", "cocukIds");
      if (!bos(v("f-cocuklar")) && !v("f-cinsiyet")) iliskiUyarilari.push("Cinsiyet belirtilmedi; çocuk kayıtlarındaki anne/baba rolü otomatik belirlenemeyebilir");
      const obj = {
        isim: ad, isimAnahtar: adAnahtar(ad), devir: v("f-devir"),
        anne: anne.ad, anneId: anne.id, baba: baba.ad, babaId: baba.id,
        es: es.ad, esIds: es.ids, cocuklar: cocuk.ad, cocukIds: cocuk.ids,
        baglar: q(v("f-baglar")), cinsiyet: v("f-cinsiyet") || "?",
        d_hicri: q(v("f-d-hicri")), d_miladi: q(v("f-d-miladi")), v_hicri: q(v("f-v-hicri")), v_miladi: q(v("f-v-miladi")),
        bilgi, kaynak: q(v("f-kaynak")), kirmiziKart: !raIsaretli, guncellemeTarihi: Date.now(),
      };
      let kaydedilenId = id;
      if (id) { await FS.updateDoc(FS.doc(db, "zatlar", id), obj); }
      else { const yeniRef = await FS.addDoc(FS.collection(db, "zatlar"), obj); kaydedilenId = yeniRef.id; }
      var otomatikGuncellenenler = await kayitSonrasiSenkronizeEt(kaydedilenId, obj, eskiKayit ? eskiKayit.isim : null);
    } else {
      const ad = baslikBuyut(v("f-ad"));
      if (!ad) return formMesaj("Olay başlığı boş bırakılamaz.", true);
      const obj = {
        ad, devir: v("f-devir"), hicri: q(v("f-hicri")), miladi: q(v("f-miladi")),
        bilgi, kaynak: q(v("f-kaynak")), eklenmeTarihi: Date.now(), guncellemeTarihi: Date.now(),
      };
      if (id) {
        const mevcut = durum.olaylar.find((o) => o.id === id);
        if (mevcut && mevcut.eklenmeTarihi) obj.eklenmeTarihi = mevcut.eklenmeTarihi;
        await FS.updateDoc(FS.doc(db, "olaylar", id), obj);
      } else await FS.addDoc(FS.collection(db, "olaylar"), obj);
    }
    adminFormuKur();
    let mesaj = id ? "Kayıt güncellendi." : "Kayıt eklendi.";
    if (zat && Array.isArray(otomatikGuncellenenler) && otomatikGuncellenenler.length) {
      mesaj += ` (+ ${otomatikGuncellenenler.length} kayıtta bu isim değişikliği de güncellendi: ${otomatikGuncellenenler.slice(0, 8).join(", ")}${otomatikGuncellenenler.length > 8 ? "…" : ""})`;
    }
    const benzersizUyarilar = [...new Set(iliskiUyarilari)];
    if (zat && benzersizUyarilar.length) {
      mesaj += ` İlişki kontrolü: ${benzersizUyarilar.slice(0, 5).join("; ")}${benzersizUyarilar.length > 5 ? `; ve ${benzersizUyarilar.length - 5} uyarı daha` : ""}. Bu alanlar metin olarak saklandı; eşleşmeyenler soyağacına otomatik bağlanmaz.`;
    }
    formMesaj(mesaj, false, zat && benzersizUyarilar.length > 0);
  } catch (e) {
    console.error("kaydetme hatası:", e);
    formMesaj("Kaydedilemedi: " + (e && e.message ? e.message : e) + " (Firestore yazma izinlerini kontrol edin.)", true);
  }
}

async function adminSil(id) {
  if (!adminMi()) return;
  if (!confirm("Bu kayıt kalıcı olarak silinsin mi?")) return;
  const kol = durum.admin.sekme === "zat" ? "zatlar" : "olaylar";
  const silinenKayit = kol === "zatlar" ? durum.zatlar.find((z) => z.id === id) : null;
  try {
    await FS.deleteDoc(FS.doc(db, kol, id));
    /* Ziyaretçiler derleme verisini kullanır; silinen kaydın onlardan da kalkması için iz bırak */
    FS.setDoc(FS.doc(db, "silinenler", `${kol}_${id}`), { tur: kol === "zatlar" ? "zat" : "olay", kayitId: id, tarih: Date.now() })
      .catch((e) => console.warn("Silme izi yazılamadı (firestore.rules güncel mi?):", e && e.code));
    if (durum.admin.duzenleId === id) adminFormuKur();
    if (silinenKayit && !bos(silinenKayit.isim)) {
      const temizlenenler = await adminSilinenReferanslariTemizle(id, silinenKayit.isim);
      if (temizlenenler.length) {
        console.log("Silinen kayda ait bağlar temizlenen kişiler:", temizlenenler);
        formMesaj(`Kayıt silindi. ${temizlenenler.length} kişideki bağlantı otomatik temizlendi: ${temizlenenler.slice(0, 8).join(", ")}${temizlenenler.length > 8 ? "…" : ""}`, false);
      }
    }
  } catch (e) {
    console.error("silme hatası:", e);
    formMesaj("Silinemedi: " + (e && e.message ? e.message : e), true);
  }
}

/* ---------- Yönetici: kaydetmeden önce akrabalık önizlemesi ---------- */
let onizlemeZamanlayici = null;
function adminAkrabaOnizleme() {
  clearTimeout(onizlemeZamanlayici);
  onizlemeZamanlayici = setTimeout(() => {
    const el = $("#f-akraba-onizleme");
    if (!el || durum.admin.sekme !== "zat") return;
    const v = (i) => { const e = $("#" + i); return e ? e.value.trim() : ""; };
    const id = durum.admin.duzenleId || "__onizleme__";
    const digerleri = durum.zatlar.filter((z) => z.id !== id);
    const ix = adIndeksiKur(digerleri);
    const bir = (ad) => { if (bos(ad)) return ""; const r = adCozumle(ad, ix, true); return r.kayit ? r.kayit.id : ""; };
    const cok = (ad) => esListesiniAyir(ad).map(bir).filter(Boolean);
    const eski = durum.zatlar.find((z) => z.id === id) || {};
    const gecici = {
      ...eski, id, isim: v("f-isim") || eski.isim || "Bu kayıt", cinsiyet: v("f-cinsiyet") || "",
      anne: v("f-anne"), baba: v("f-baba"), es: v("f-es"), cocuklar: v("f-cocuklar"), baglar: v("f-baglar"),
      anneId: bir(v("f-anne")), babaId: bir(v("f-baba")), esIds: cok(v("f-es")), cocukIds: cok(v("f-cocuklar")),
    };
    const g = akrabalikGrafigi([...digerleri, gecici]);
    el.innerHTML = akrabaBlokHtml(g, id, {
      baslik: "Kaydedince oluşacak akrabalıklar (önizleme)",
      bosMetin: "Anne, baba, eş, çocuk veya “İsim (Kardeş)” girildiğinde kardeş, amca/hala, dayı/teyze, dede ve kuzen bağları burada otomatik görünür.",
    });
  }, 250);
}

/* ---------- Yönetici: MAKALE YÖNETİMİ (Firestore 'makaleler') ---------- */
function mkBirakabilir() { return !durum.mk.kirli || confirm("Kaydedilmemiş makale değişiklikleri silinsin mi?"); }
function mkListeGuncelle() {
  const el = $("#admin-liste");
  if (!el) return;
  const liste = tumMakaleler();
  el.innerHTML = `<div class="admin-list-toolbar"><button type="button" class="button primary" data-action="mk-yeni">Yeni makale</button><small>${liste.length} makale</small></div>
    <div class="mk-liste">${liste.map((m) => `<div class="mk-oge">
      <div><h4>${esc(m.baslik)}${m.yayinda === false ? `<span class="mk-durum taslak">Taslak</span>` : ""}${m.yerlesik && !m.id ? `<span class="mk-durum">Yerleşik</span>` : ""}</h4>
      <small>${esc(m.etiket || "Makale")}${m.tarih ? " · " + esc(hesapTarih(m.tarih, "")) : ""}</small></div>
      <div class="admin-list-actions">
        <a class="btn-small" href="${esc(makaleUrl(m))}" target="_blank" rel="noopener">Gör</a>
        <button type="button" class="btn-small" data-action="mk-duzenle" data-id="${esc(m.id || m.slug)}">Düzenle</button>
        ${m.id ? `<button type="button" class="btn-small btn-danger" data-action="mk-sil" data-id="${esc(m.id)}">Sil</button>` : ""}
      </div></div>`).join("")}</div>
    <p class="form-hint" style="margin-top:.8rem">Yeni makaleler kaydedildiği anda sitede görünür. Arama motorları için ayrı sayfası (/makaleler/…) bir sonraki yayınlamada (Vercel deploy) oluşur.</p>`;
}
function mkFormuKur(m) {
  const el = $("#admin-form");
  if (!el) return;
  durum.mk = { duzenleId: m && m.id ? m.id : null, kaynakSlug: m ? m.slug : null, gorsel: m ? (m.gorsel || "") : "", image: m ? (m.image || "") : "", kirli: false };
  const deger = (x) => esc(x == null ? "" : x);
  el.innerHTML = `<div class="admin-form mk-form">
    <div class="admin-form-heading"><span>Makale</span><h3>${m ? (m.id ? "Makaleyi düzenle" : "Yerleşik makaleyi düzenle") : "Yeni makale"}</h3>
      <p>${m && !m.id ? "Kaydettiğinizde düzenlenmiş kopya yerleşik makalenin yerine geçer." : "Başlık, kısa özet, metin, kaynaklar ve kapak görseli ekleyin."}</p></div>
    <div id="mk-mesaj"></div>
    <div class="form-field"><label for="mk-baslik">Başlık <span class="required-mark">Zorunlu</span></label><input id="mk-baslik" type="text" value="${deger(m && m.baslik)}" autocomplete="off"></div>
    <div class="mk-satir">
      <div class="form-field"><label for="mk-etiket">Kategori</label><input id="mk-etiket" type="text" list="mk-etiketler" value="${deger(m && m.etiket)}" placeholder="Örn. Siyer"><datalist id="mk-etiketler">${[...new Set(tumMakaleler().map((x) => x.etiket).filter(Boolean))].map((x) => `<option value="${esc(x)}">`).join("")}</datalist></div>
      <div class="form-field"><label for="mk-slug">Adres (isteğe bağlı)</label><input id="mk-slug" type="text" value="${deger(m && m.slug)}" placeholder="baslik-otomatik-olusur" ${m && m.slug ? "readonly" : ""}><p class="form-hint">/makaleler/… bölümü. Boş bırakılırsa başlıktan üretilir; sonradan değişmez.</p></div>
    </div>
    <div class="form-field"><label for="mk-ozet">Kısa özet</label><textarea id="mk-ozet" rows="3" placeholder="Listede ve arama sonuçlarında görünen 1-2 cümle">${deger(m && m.ozet)}</textarea></div>
    ${EDITOR_HTML.replace("<label>Bilgi</label>", "<label>Makale metni</label>").replace('id="f-bilgi"', 'id="mk-govde"')}
    <div class="form-field"><label for="mk-kaynaklar">Kaynaklar</label><textarea id="mk-kaynaklar" rows="4" placeholder="Her satıra bir kaynak: Eser adı, yazar, cilt/sayfa">${deger(m && m.kaynaklar)}</textarea></div>
    <div class="form-field"><label for="mk-gorsel-dosya">Kapak görseli</label>
      <input id="mk-gorsel-dosya" type="file" accept="image/*">
      <input id="mk-gorsel-url" type="url" placeholder="veya görsel adresi: https://…" value="${deger(m && m.gorsel && !String(m.gorsel).startsWith("data:") ? m.gorsel : "")}" style="margin-top:.5rem">
      <div class="mk-gorsel-onizleme" id="mk-gorsel-onizleme"></div>
      <p class="form-hint">Yüklenen görsel otomatik küçültülür (en fazla 1400 px, ~300 KB) ve makaleyle birlikte saklanır.</p></div>
    <label class="mk-yayin"><input id="mk-yayinda" type="checkbox" ${!m || m.yayinda !== false ? "checked" : ""}> Yayında (işaret kaldırılırsa taslak olarak yalnızca yöneticiler görür)</label>
    <div class="form-actions">
      <button type="button" class="button primary" data-action="mk-kaydet">Kaydet</button>
      <button type="button" class="button" data-action="mk-yeni">Temizle</button>
    </div>
  </div>`;
  const ed = $("#mk-govde");
  if (ed && m && m.govde) ed.innerHTML = temizHtml(m.govde);
  adminKirliAyarla(false);
  mkGorselOnizle();
}
function mkMesaj(metin, hata) {
  const el = $("#mk-mesaj");
  if (el) el.innerHTML = metin ? `<p class="${hata ? "form-error" : "form-ok"}">${esc(metin)}</p>` : "";
}
function mkGorselOnizle() {
  const el = $("#mk-gorsel-onizleme");
  if (!el) return;
  const src = durum.mk.gorsel || (durum.mk.image ? `https://images.unsplash.com/photo-${durum.mk.image}?w=400&q=60&auto=format&fit=crop` : "");
  el.innerHTML = src ? `<img src="${esc(src)}" alt="Kapak önizlemesi"><div><small>${durum.mk.gorsel.startsWith("data:") ? `Yüklendi · ${Math.round(durum.mk.gorsel.length * 0.75 / 1024)} KB` : "Mevcut görsel"}</small><br><button type="button" class="btn-small" data-action="mk-gorsel-kaldir">Görseli kaldır</button></div>` : `<small>Görsel seçilmedi; varsayılan kapak kullanılır.</small>`;
}
/* Görseli tarayıcıda küçültüp JPEG'e çevirir (Firestore belge sınırı 1 MB) */
async function mkGorselSec(input) {
  const dosya = input.files && input.files[0];
  if (!dosya) return;
  if (!/^image\//.test(dosya.type)) return mkMesaj("Lütfen bir görsel dosyası seçin.", true);
  mkMesaj("Görsel hazırlanıyor…");
  try {
    const url = URL.createObjectURL(dosya);
    const img = await new Promise((ok, hata) => { const i = new Image(); i.onload = () => ok(i); i.onerror = hata; i.src = url; });
    let w = img.naturalWidth, h = img.naturalHeight;
    const oran = Math.min(1, 1400 / w);
    w = Math.round(w * oran); h = Math.round(h * oran);
    const tuval = document.createElement("canvas");
    tuval.width = w; tuval.height = h;
    tuval.getContext("2d").drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    let kalite = 0.8, veri = tuval.toDataURL("image/jpeg", kalite);
    while (veri.length > 420000 && kalite > 0.4) { kalite -= 0.1; veri = tuval.toDataURL("image/jpeg", kalite); }
    durum.mk.gorsel = veri; durum.mk.kirli = true;
    const u = $("#mk-gorsel-url"); if (u) u.value = "";
    mkGorselOnizle(); mkMesaj("");
  } catch (e) {
    console.error("Görsel hazırlanamadı:", e);
    mkMesaj("Görsel okunamadı. Başka bir dosya deneyin.", true);
  }
}
async function mkKaydet() {
  if (!adminMi()) return mkMesaj("Bu işlem için yönetici hesabıyla giriş yapmalısınız.", true);
  if (!FS || !db) return mkMesaj("Veritabanı bağlantısı hazır değil. Sayfayı yenileyin.", true);
  const v = (i) => { const e = $("#" + i); return e ? e.value.trim() : ""; };
  const baslik = v("mk-baslik");
  if (!baslik) return mkMesaj("Başlık boş bırakılamaz.", true);
  const ed = $("#mk-govde");
  const govde = ed && duzMetin(ed.innerHTML) ? temizHtml(ed.innerHTML) : "";
  if (!govde) return mkMesaj("Makale metni boş olamaz.", true);
  const id = durum.mk.duzenleId;
  const mevcut = id ? durum.makaleler.find((m) => m.id === id) : null;
  let slug = durum.mk.kaynakSlug || makaleSlug(v("mk-slug") || baslik);
  if (!slug) return mkMesaj("Geçerli bir adres üretilemedi; başlığa harf ekleyin.", true);
  if (!durum.mk.kaynakSlug) {
    const kullanilan = new Set(tumMakaleler().map((m) => m.slug));
    let aday = slug, n = 2;
    while (kullanilan.has(aday)) aday = `${slug}-${n++}`;
    slug = aday;
  }
  const obj = {
    baslik, slug, etiket: v("mk-etiket") || "Makale", ozet: v("mk-ozet") || ozet(govde, 180), govde,
    kaynaklar: v("mk-kaynaklar"), gorsel: durum.mk.gorsel || "", image: durum.mk.gorsel ? "" : (durum.mk.image || ""),
    yayinda: !!($("#mk-yayinda") && $("#mk-yayinda").checked),
    tarih: (mevcut && mevcut.tarih) || Date.now(), guncellemeTarihi: Date.now(),
    yazar: (durum.kullanici && durum.kullanici.email) || "",
  };
  const boyut = new Blob([JSON.stringify(obj)]).size;
  if (boyut > 950000) return mkMesaj(`Makale çok büyük (${Math.round(boyut / 1024)} KB). Görseli küçültün veya metni bölün (sınır ~950 KB).`, true);
  mkMesaj("Kaydediliyor…");
  try {
    if (id) await FS.setDoc(FS.doc(db, "makaleler", id), obj);
    else { const ref = await FS.addDoc(FS.collection(db, "makaleler"), obj); durum.mk.duzenleId = ref.id; }
    durum.mk.kirli = false; durum.mk.kaynakSlug = slug; adminKirliAyarla(false);
    mkMesaj(obj.yayinda ? "Kaydedildi ve yayımlandı." : "Taslak olarak kaydedildi.");
    const s = $("#mk-slug"); if (s) { s.value = slug; s.readOnly = true; }
  } catch (e) {
    console.error("makale kaydetme hatası:", e);
    mkMesaj("Kaydedilemedi: " + (e && e.code === "permission-denied" ? "izin yok — firestore.rules dosyasındaki 'makaleler' kuralı yayımlandı mı?" : (e && e.message) || e), true);
  }
}
async function mkSil(id) {
  if (!adminMi() || !id) return;
  const m = durum.makaleler.find((x) => x.id === id);
  if (!confirm(`“${m ? m.baslik : "Bu makale"}” kalıcı olarak silinsin mi?`)) return;
  try {
    await FS.deleteDoc(FS.doc(db, "makaleler", id));
    if (durum.mk.duzenleId === id) mkFormuKur(null);
  } catch (e) {
    console.error("makale silme hatası:", e);
    mkMesaj("Silinemedi: " + ((e && e.message) || e), true);
  }
}

/* ---------- HESABIM / KİŞİSEL ÇALIŞMA ALANI ---------- */
function hesapTarih(zaman, yedek = "Henüz hareket yok") {
  if (!zaman) return yedek;
  const d = new Date(zaman);
  if (Number.isNaN(d.getTime())) return yedek;
  return new Intl.DateTimeFormat(document.documentElement.lang === "en" ? "en-GB" : "tr-TR", {
    day: "numeric", month: "short", year: "numeric",
  }).format(d);
}

function hesapHamVeri() {
  const favler = Object.values(durum.favoriler).sort((a, b) => (b.eklenmeTarihi || 0) - (a.eklenmeTarihi || 0));
  const notlar = Object.values(durum.notlar).filter((n) => n.metin && n.metin.trim())
    .sort((a, b) => (b.guncellemeTarihi || 0) - (a.guncellemeTarihi || 0));
  return { favler, notlar };
}

function hesapFiltrelenmisVeri() {
  const { favler, notlar } = hesapHamVeri();
  const q = trKucuk(durum.hesap.arama.trim());
  const tur = durum.hesap.tur;
  const ekle = (veri, turu) => veri.map((x) => {
    const k = kayitBul(x.tip, x.itemId);
    return {
      turu, veri: x, kayit: k,
      ad: kayitAdi(x.tip, k) || x.ad || "İsimsiz kayıt",
      zaman: turu === "favori" ? x.eklenmeTarihi : x.guncellemeTarihi,
    };
  });
  let liste = [
    ...(durum.hesap.sekme === "not" ? [] : ekle(favler, "favori")),
    ...(durum.hesap.sekme === "favori" ? [] : ekle(notlar, "not")),
  ];
  liste = liste.filter((x) => {
    if (tur !== "tumu" && x.veri.tip !== tur) return false;
    return !q || trKucuk(`${x.ad} ${x.veri.metin || ""}`).includes(q);
  });
  return liste.sort((a, b) => (b.zaman || 0) - (a.zaman || 0));
}

function hesapKayitSatiri(x) {
  const yuk = durum.yuklendi.zat && durum.yuklendi.olay;
  const var_ = !!x.kayit || !yuk;
  const tipAdi = x.veri.tip === "zat" ? "Şahsiyet" : "Olay";
  const turAdi = x.turu === "favori" ? "Favori" : "Kişisel not";
  return `<article class="account-entry account-entry-${x.turu}">
    <div class="account-entry-mark" aria-hidden="true">${x.turu === "favori" ? "F" : "N"}</div>
    <div class="account-entry-main">
      <div class="account-entry-meta"><span>${turAdi}</span><i></i><span>${tipAdi}</span><i></i><time>${hesapTarih(x.zaman, "Tarih yok")}</time></div>
      <h3>${var_ ? `<a href="${esc(arsivDetayUrl(x.veri.tip, x.veri.itemId))}">${esc(x.ad)}</a>` : esc(x.ad)}</h3>
      ${x.turu === "not" ? `<p>${esc(x.veri.metin)}</p>` : `<p>${var_ ? "Okumak veya not eklemek için kaydı açın." : "Bu kayıt arşivden kaldırılmış."}</p>`}
    </div>
    <div class="account-entry-actions">
      ${var_ ? `<a class="btn-small" href="${esc(arsivDetayUrl(x.veri.tip, x.veri.itemId))}">${x.turu === "not" ? "Notu düzenle" : "Kaydı aç"}</a>` : ""}
      <button type="button" class="btn-small btn-danger" data-action="${x.turu === "favori" ? "fav" : "not-sil"}" data-tip="${x.veri.tip}" data-id="${esc(x.veri.itemId)}">${x.turu === "favori" ? "Favoriden çıkar" : "Notu sil"}</button>
    </div>
  </article>`;
}

function hesapListeIcerigi() {
  const liste = hesapFiltrelenmisVeri();
  if (liste.length) return liste.map(hesapKayitSatiri).join("");
  const filtreli = durum.hesap.arama || durum.hesap.tur !== "tumu" || durum.hesap.sekme !== "tumu";
  return `<div class="account-empty"><span aria-hidden="true">${filtreli ? "0" : "+"}</span><h3>${filtreli ? "Eşleşen kayıt bulunamadı" : "Çalışma alanınız hazır"}</h3><p>${filtreli ? "Arama ifadenizi veya filtreleri değiştirin." : "Arşivdeki bir şahsiyeti ya da olayı favorilerinize ekleyin; kişisel notlarınız da burada bir araya gelsin."}</p>${filtreli ? `<button type="button" class="button" data-action="hesap-filtre-temizle">Filtreleri temizle</button>` : `<a class="button primary" href="#archive">Arşivi keşfet</a>`}</div>`;
}

function hesapListeGuncelle() {
  const el = $("#hesap-liste");
  if (el) el.innerHTML = hesapListeIcerigi();
  const sonuc = $("#hesap-sonuc");
  if (sonuc) sonuc.textContent = `${hesapFiltrelenmisVeri().length} öğe gösteriliyor`;
}

function hesapVerisiniIndir() {
  if (!durum.kullanici) return;
  const { favler, notlar } = hesapHamVeri();
  const veri = {
    format: "asr-saadet-kisisel-veri",
    version: SURUM,
    exportedAt: new Date().toISOString(),
    favorites: favler.map(({ docIds, ...x }) => x),
    notes: notlar.map(({ docId, ...x }) => x),
  };
  const blob = new Blob([JSON.stringify(veri, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asr-saadet-kisisel-veriler-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sayfaHesap() {
  const u = durum.kullanici;
  if (!u) {
    return `<section class="split">
      ${gorselYari({ f: "dome", alt: "Cami kubbesinin iç mimarisi", sticky: true, icerik: `<p class="eyebrow">Hesap</p><h1>Hesabım</h1>` })}
      <div class="half content" style="align-items:flex-start"><div class="login-panel">
        <h2>Giriş gerekli</h2><p>Favorilerinizi ve notlarınızı görmek için giriş yapın.</p><a class="button primary" href="#login">Giriş yap</a>
      </div></div>
    </section>`;
  }

  const { favler, notlar } = hesapHamVeri();
  const zatFav = favler.filter((x) => x.tip === "zat").length;
  const olayFav = favler.filter((x) => x.tip === "olay").length;
  const tumHareket = [
    ...favler.map((x) => ({ ad: kayitAdi(x.tip, kayitBul(x.tip, x.itemId)) || x.ad, tur: "Favoriye eklendi", zaman: x.eklenmeTarihi })),
    ...notlar.map((x) => ({ ad: kayitAdi(x.tip, kayitBul(x.tip, x.itemId)) || x.ad, tur: "Not güncellendi", zaman: x.guncellemeTarihi })),
  ].sort((a, b) => (b.zaman || 0) - (a.zaman || 0));
  const sonHareket = tumHareket[0];
  const ad = u.displayName || (u.email ? u.email.split("@")[0] : "Okur");
  const basHarf = String(ad).trim().charAt(0).toLocaleUpperCase("tr") || "A";
  const uyelik = hesapTarih(u.metadata && u.metadata.creationTime, "Üyelik tarihi bilinmiyor");
  const arsivToplam = durum.zatlar.length + durum.olaylar.length;
  const seciliOran = arsivToplam ? Math.min(100, Math.round((favler.length / arsivToplam) * 100)) : 0;

  return `<section class="account-page">
    <header class="account-hero">
      <div class="account-identity">
        <div class="account-avatar" aria-hidden="true">${esc(basHarf)}</div>
        <div><p class="account-eyebrow">Kişisel çalışma alanı</p><h1>Hoş geldiniz, ${esc(ad)}</h1><p>${esc(u.email || "")}<span class="account-dot"></span>${adminMi() ? "Yönetici hesabı" : `Üyelik: ${uyelik}`}</p></div>
      </div>
      <div class="account-hero-actions">
        ${adminMi() ? `<a class="button primary" href="#admin">Yönetim paneli</a>` : ""}
        <button type="button" class="button" data-action="hesap-disa-aktar">Verilerimi dışa aktar</button>
        <button type="button" class="button account-signout" data-action="cikis">Çıkış yap</button>
      </div>
    </header>

    ${durum.kisiselHata ? `<div class="error account-error">Favori ve notlar okunamadı: ${esc(durum.kisiselHata)}<br>Firestore kurallarında "favoriler" ve "notlar" koleksiyonlarına giriş yapmış kullanıcı için izin verildiğinden emin olun.</div>` : ""}

    <div class="account-stats" aria-label="Hesap özeti">
      <article><span>01</span><p>Favoriler</p><strong>${favler.length}</strong><small>Kaydedilmiş içerik</small></article>
      <article><span>02</span><p>Kişisel notlar</p><strong>${notlar.length}</strong><small>Size özel not</small></article>
      <article><span>03</span><p>Şahsiyetler</p><strong>${zatFav}</strong><small>Favori şahsiyet</small></article>
      <article><span>04</span><p>Olaylar</p><strong>${olayFav}</strong><small>Favori tarihî olay</small></article>
    </div>

    <div class="account-insights">
      <article class="account-pulse">
        <div class="account-card-heading"><div><span>Arşiv nabzı</span><h2>Kişisel seçkiniz</h2></div><strong>${seciliOran}%</strong></div>
        <div class="account-progress" role="progressbar" aria-label="Favorilere eklenen arşiv oranı" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${seciliOran}"><i style="width:${seciliOran}%"></i></div>
        <p>${arsivToplam ? `${arsivToplam} arşiv kaydından ${favler.length} tanesini favorilerinize eklediniz.` : "Arşiv kayıtları yükleniyor."}</p>
      </article>
      <article class="account-latest">
        <div class="account-card-heading"><div><span>Son hareket</span><h2>${esc((sonHareket && sonHareket.ad) || "Henüz bir hareket yok")}</h2></div><time>${hesapTarih(sonHareket && sonHareket.zaman)}</time></div>
        <p>${sonHareket ? `${sonHareket.tur}. Tüm hareketlerinizi çalışma alanından yönetebilirsiniz.` : "Bir kaydı favorileyerek veya not ekleyerek kişisel arşivinizi oluşturmaya başlayın."}</p>
      </article>
    </div>

    <div class="account-layout">
      <section class="account-workspace" aria-labelledby="account-workspace-title">
        <div class="account-workspace-head"><div><span>Arşiv masam</span><h2 id="account-workspace-title">Favoriler ve notlar</h2></div><small id="hesap-sonuc">${hesapFiltrelenmisVeri().length} öğe gösteriliyor</small></div>
        <div class="account-tabs" role="group" aria-label="İçerik türü">
          ${[["tumu", "Tüm hareketler", favler.length + notlar.length], ["favori", "Favoriler", favler.length], ["not", "Notlar", notlar.length]].map(([v, l, c]) => `<button type="button" class="account-tab${durum.hesap.sekme === v ? " active" : ""}" data-action="hesap-sekme" data-deger="${v}" aria-pressed="${durum.hesap.sekme === v}">${l}<span>${c}</span></button>`).join("")}
        </div>
        <div class="account-filters">
          <label class="account-search"><span>Çalışma alanında ara</span><input id="hesap-arama" type="search" value="${esc(durum.hesap.arama)}" placeholder="İsim veya not içinde ara…"></label>
          <label><span>Kayıt türü</span><select id="hesap-tur"><option value="tumu"${durum.hesap.tur === "tumu" ? " selected" : ""}>Tüm kayıt türleri</option><option value="zat"${durum.hesap.tur === "zat" ? " selected" : ""}>Şahsiyetler</option><option value="olay"${durum.hesap.tur === "olay" ? " selected" : ""}>Olaylar</option></select></label>
        </div>
        <div class="account-list" id="hesap-liste">${hesapListeIcerigi()}</div>
      </section>

      <aside class="account-sidebar">
        <section><span class="account-aside-index">01 / Keşfet</span><h2>Okumaya devam edin</h2><p>Arşivin farklı görünümlerinden yeni bağlantılar ve tarihî kayıtlar keşfedin.</p>
          <nav class="account-quick-links" aria-label="Hesap hızlı erişim">
            <a href="#archive"><span>Arşivde ara</span><b>→</b></a><a href="#timeline"><span>Zaman çizelgesini aç</span><b>→</b></a><a href="#genealogy"><span>Soyağacını incele</span><b>→</b></a><a href="#random"><span>Rastgele bir şahsiyet</span><b>→</b></a>
          </nav>
        </section>
        <section class="account-privacy"><span class="account-aside-index">02 / Gizlilik</span><h2>Yalnızca size özel</h2><p>Notlarınız ve favorileriniz hesabınızla ilişkilidir; diğer ziyaretçilere gösterilmez.</p><a href="#privacy">Gizlilik politikasını okuyun →</a></section>
      </aside>
    </div>
  </section>`;
}

/* ==========================================================================
   SİTE İÇİ ARAMA
   ========================================================================== */
const GRUP_ADI = { zat: "Şahsiyetler", olay: "Olaylar", makale: "Makaleler", sss: "Sıkça Sorulan Sorular" };
const ARAMA_LIMIT = 8;

const aramaTerimleri = (q) => trKucuk(q).split(/\s+/).filter(Boolean);

/* Eşleşen kelimeleri <mark> ile işaretler (metin önce güvenli hâle getirilir) */
function vurgula(metin, terimler) {
  const t = String(metin || "");
  const k = trKucuk(t);
  if (k.length !== t.length || !terimler.length) return esc(t);
  const aralik = [];
  terimler.forEach((terim) => {
    let i = k.indexOf(terim), n = 0;
    while (i !== -1 && n < 20) { aralik.push([i, i + terim.length]); i = k.indexOf(terim, i + terim.length); n++; }
  });
  if (!aralik.length) return esc(t);
  aralik.sort((a, b) => a[0] - b[0]);
  const birlesik = [aralik[0].slice()];
  aralik.slice(1).forEach(([b, s]) => {
    const son = birlesik[birlesik.length - 1];
    if (b <= son[1]) son[1] = Math.max(son[1], s); else birlesik.push([b, s]);
  });
  let cikti = "", imle = 0;
  birlesik.forEach(([b, s]) => { cikti += esc(t.slice(imle, b)) + "<mark>" + esc(t.slice(b, s)) + "</mark>"; imle = s; });
  return cikti + esc(t.slice(imle));
}

/* İlk eşleşmenin çevresinden kısa bir kesit alır */
function kesit(metin, terimler, uzunluk, yedek) {
  const t = String(metin || "");
  const k = trKucuk(t);
  let en = -1;
  if (k.length === t.length) terimler.forEach((x) => { const i = k.indexOf(x); if (i !== -1 && (en === -1 || i < en)) en = i; });
  if (en === -1) { const y = String(yedek || t); return y.length > uzunluk ? y.slice(0, uzunluk).trimEnd() + "…" : y; }
  const bas = Math.max(0, en - 60), son = Math.min(t.length, bas + uzunluk);
  return (bas > 0 ? "…" : "") + t.slice(bas, son).trim() + (son < t.length ? "…" : "");
}

/* Tüm kelimeler bulunmalı (VE). Başlıkta eşleşme, metinde eşleşmeden daha değerli. */
function puanla(baslik, icerik, terimler) {
  const b = trKucuk(baslik), m = trKucuk(icerik);
  let toplam = 0;
  for (const t of terimler) {
    let p = 0;
    if (b === t) p = 100; else if (b.startsWith(t)) p = 60; else if (b.includes(t)) p = 40; else if (m.includes(t)) p = 10;
    if (!p) return 0;
    toplam += p;
  }
  return toplam;
}

function aramaYap(q) {
  const terimler = aramaTerimleri(q);
  const grup = { zat: [], olay: [], makale: [], sss: [] };
  durum.zatlar.forEach((z) => {
    const duz = z._duz != null ? z._duz : duzMetin(z.bilgi);
    const icerik = [duz, z.anne, z.baba, z.es, z.cocuklar, z.baglar].filter((x) => !bos(x)).join(" ");
    const p = puanla(z.isim, icerik, terimler);
    if (p) grup.zat.push({ p, ad: z.isim || "", icerik, ozet: duz, href: arsivDetayUrl("zat", z.id), etiket: devirOf(z) });
  });
  durum.olaylar.forEach((o) => {
    const duz = o._duz != null ? o._duz : duzMetin(o.bilgi);
    const icerik = [duz, o.hicri, o.miladi].filter((x) => !bos(x)).join(" ");
    const p = puanla(o.ad, icerik, terimler);
    if (p) grup.olay.push({ p, ad: o.ad || "", icerik, ozet: duz, href: arsivDetayUrl("olay", o.id), etiket: devirOf(o) });
  });
  tumMakaleler().forEach((m) => {
    const duz = duzMetin(m.govde);
    const p = puanla(m.baslik, duz, terimler);
    if (p) grup.makale.push({ p, ad: m.baslik, icerik: duz, ozet: m.ozet, href: makaleUrl(m), etiket: m.etiket });
  });
  SSS.forEach(([soru, cevap], i) => {
    const p = puanla(soru, cevap, terimler);
    if (p) grup.sss.push({ p, ad: soru, icerik: cevap, ozet: cevap, href: `/faq#sss-${i}`, etiket: "S.S.S." });
  });
  Object.values(grup).forEach((g) => g.sort((a, b) => b.p - a.p || a.ad.localeCompare(b.ad, "tr")));
  return { terimler, grup };
}

function sonucKart(r, terimler) {
  const parca = r.icerik || r.ozet ? kesit(r.icerik, terimler, 170, r.ozet) : "";
  return `<a class="record" href="${esc(r.href)}">
    <div class="record-head"><h3>${vurgula(r.ad, terimler)}</h3><span class="era">${esc(r.etiket)}</span></div>
    ${parca ? `<p>${vurgula(parca, terimler)}</p>` : ""}
  </a>`;
}

function aramaGuncelle() {
  const alan = $("#arama-alan");
  if (!alan) return;
  const q = durum.genelArama.trim();
  if (q.length < 2) {
    alan.innerHTML = `<div class="empty">Aramaya başlamak için en az iki harf yazın. Şahsiyetler, olaylar, makaleler ve sıkça sorulan sorular birlikte aranır.</div>`;
    return;
  }
  const { terimler, grup } = aramaYap(q);
  const toplam = Object.values(grup).reduce((a, g) => a + g.length, 0);
  const dm = durumMesaji();
  if (!toplam) { alan.innerHTML = dm + `<div class="empty">“${esc(q)}” için sonuç bulunamadı. Farklı bir yazım deneyin.</div>`; return; }
  alan.innerHTML = dm + `<p class="arama-ozet">${toplam} sonuç</p>` + ["zat", "olay", "makale", "sss"].filter((k) => grup[k].length).map((k) => {
    const g = grup[k];
    return `<h3 class="hesap-bolum">${GRUP_ADI[k]} (${g.length})</h3>
      <div class="record-list">${g.slice(0, ARAMA_LIMIT).map((r) => sonucKart(r, terimler)).join("")}</div>
      ${g.length > ARAMA_LIMIT && (k === "zat" || k === "olay") ? `<button type="button" class="text-link" data-action="arsivde-ara" data-tur="${k}">Arşivde tümünü gör (${g.length}) →</button>` : ""}`;
  }).join("");
  cokSayfaliLinkleriDuzenle(alan);
}

function sayfaAra() {
  return `
  <section class="split">
    ${gorselYari({ f: "ornate", alt: "Süslemeli bir el yazması sayfası", sticky: true, icerik: `
      <p class="eyebrow">Portal</p>
      <h1>Portalda<br>Ara</h1>
      <p class="visual-copy">Şahsiyetler, olaylar, makaleler ve sıkça sorulan sorularda birlikte arayın.</p>` })}
    <div class="half content ark-icerik">
      <input id="genel-arama" class="search" type="search" placeholder="Bir isim, olay veya kelime yazın…" value="${esc(durum.genelArama)}" autocomplete="off" aria-label="Portalda ara">
      <div class="quick-tags" style="margin-top:.9rem">${HIZLI_ETIKETLER.map((t) => `<button type="button" class="quick-tag" data-action="ara-etiket" data-deger="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <div id="arama-alan" style="margin-top:1.5rem"></div>
    </div>
  </section>`;
}

/* ==========================================================================
   İLETİŞİM FORMU (S.S.S. ve Katkıda Bulun sayfalarında ortak)
   ========================================================================== */
function iletisimFormu(baslik, aciklama, konu) {
  return `<div class="contact-box">
    <h3>${esc(baslik)}</h3>
    <p>${esc(aciklama)}</p>
    <div class="login-field"><label for="ilt-isim">Adınız</label><input id="ilt-isim" type="text" autocomplete="name"></div>
    <div class="login-field"><label for="ilt-eposta">E-posta</label><input id="ilt-eposta" type="email" autocomplete="email"></div>
    <div class="login-field"><label for="ilt-konu">Konu</label><input id="ilt-konu" type="text" value="${esc(konu || "")}" placeholder="Örn. Soru, Hata bildirimi, Katkı önerisi"></div>
    <div class="login-field"><label for="ilt-mesaj">Mesajınız</label><textarea id="ilt-mesaj" rows="4"></textarea></div>
    <button type="button" class="button primary" data-action="iletisim">Mesajı gönder</button>
    <p class="login-message" id="iletisim-durum" role="status"></p>
  </div>`;
}

/* ==========================================================================
   BİLGİ SAYFALARI: Gizlilik, Kaynakça, Katkıda Bulun, Sürüm Notları
   ========================================================================== */
function statikSayfa({ f, alt, eyebrow, baslik, kopya, govde, ek }) {
  return `
  <section class="split">
    ${gorselYari({ f, alt, sticky: true, icerik: `
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${baslik}</h1>
      <p class="visual-copy">${esc(kopya)}</p>` })}
    <div class="half content ark-icerik">
      ${govde}
      ${ek || ""}
    </div>
  </section>`;
}

function sayfaGizlilik() {
  return statikSayfa({
    f: "manuscript", alt: "Eski bir el yazması", eyebrow: "Yasal", baslik: "Gizlilik<br>Politikası", kopya: "Son güncelleme: Eylül 2026",
    govde: `<div class="prose">
      <p>Asr-ı Saadet Portalı olarak ziyaretçilerimizin gizliliğine ve kişisel verilerinin güvenliğine önem veriyoruz. Portal, genel kullanıma açık tarihî bilgilerin sunulduğu bir eğitim ve araştırma platformudur. Bu sayfa, hangi bilgilerin hangi amaçla ve nerede tutulduğunu açıklar.</p>

      <h3>Ziyaretiniz sırasında</h3>
      <p>Arşivi, zaman çizelgesini, soyağacını ve makaleleri okumak için üye olmanız gerekmez. Bu sırada sizi kişisel olarak tanımlayan bir bilgi (ad, adres, telefon vb.) bizim tarafımızdan toplanmaz. Sitede reklam veya izleme amaçlı çerez kullanılmaz.</p>

      <h3>İletişim formu</h3>
      <p>İletişim formunu kullandığınızda yazdığınız ad, e-posta adresi, konu ve mesaj, size dönüş yapabilmemiz için Formspree hizmeti üzerinden bize iletilir. Bu bilgiler üçüncü kişilerle, kurumlarla veya reklam şirketleriyle paylaşılmaz.</p>

      <h3>Üyelik</h3>
      <p>İsterseniz e-posta ve şifrenizle ya da Google hesabınızla üye olabilirsiniz. Bu durumda Google Firebase Authentication hizmeti e-posta adresinizi ve Google ile girdiyseniz adınızı işler. Şifreniz açık metin olarak tutulmaz; Firebase tarafından korunur. Üyelik yalnızca favori ve not özelliklerini kullanmanız içindir.</p>

      <h3>Favoriler ve kişisel notlar</h3>
      <p>Favori olarak işaretlediğiniz kayıtlar ve yazdığınız kişisel notlar, hesabınızla ilişkilendirilerek Google Firestore veritabanında saklanır. Bunlar yalnızca siz giriş yaptığınızda gösterilir, diğer ziyaretçilere sunulmaz. İstediğiniz zaman Hesabım sayfasından silebilirsiniz.</p>

      <h3>Çerezler ve yerel depolama</h3>
      <p>Oturumunuzun açık kalması için Firebase, tarayıcınızın yerel depolama alanına oturum bilgisi yazabilir. Sitemizde reklam veya izleme amaçlı üçüncü taraf çerezi kullanılmaz.</p>

      <h3>Üçüncü taraf hizmetler</h3>
      <p>Sayfalar görüntülenirken tarayıcınız yazı tipleri için Google Fonts'a, görseller için Unsplash'a, veriler ve giriş için Google Firebase'e bağlanır. Bu hizmet sağlayıcılar, IP adresiniz gibi standart bağlantı bilgilerini görebilir. Portal Vercel üzerinde barındırılır; barındırma sağlayıcısı standart sunucu kayıtları tutabilir.</p>

      <h3>Yönetici paneli güvenliği</h3>
      <p>Veritabanına kayıt ekleme yetkisi bulunan yöneticilerin giriş işlemleri Google Firebase'in güvenlik altyapısı ile korunmaktadır.</p>

      <h3>Haklarınız ve iletişim</h3>
      <p>Hesabınızın ve verilerinizin silinmesi, verilerinize erişim veya düzeltme talepleri ile gizlilik politikamıza dair her türlü soru için <a href="#contribute">İletişim formunu</a> kullanabilirsiniz. Portalın işleyişi değiştikçe bu metin güncellenir.</p>
    </div>`,
  });
}

function sayfaKaynakca() {
  return statikSayfa({
    f: "calligraphy", alt: "Arap hattı örneği", eyebrow: "Referanslar", baslik: "Kaynakça ve<br>Temel Eserler", kopya: "Bilgilerin doğrulanmasında ve derlenmesinde temel alınan başlıca eserler.",
    govde: `<div class="prose">
      <p>Portalda yer alan bilgiler aşağıda sınıflandırılan eserlere dayanır. Kayda özel kaynak bilgisi varsa, kaydın altında “Kaynak” satırında ayrıca gösterilir.</p>
      ${KAYNAKCA.map((g) => `<h3>${esc(g.baslik)}</h3>
        <ul class="kaynak-liste">${g.eserler.map(([eser, yazar, yayin]) => `<li><strong>${esc(eser)}</strong><span>${esc(yazar)} · ${esc(yayin)}</span></li>`).join("")}</ul>`).join("")}
      <p>Eksik gördüğünüz bir kaynağı <a href="#contribute">Katkıda Bulun</a> sayfasından bize iletebilirsiniz.</p>
    </div>`,
  });
}

function sayfaKatki() {
  const maddeler = [
    ["Bilgi ve belge desteği", "Arşivimizde eksik olduğunu düşündüğünüz tarihî şahsiyetler, soyağacı bilgileri veya önemli olaylar hakkında kaynak belirterek bize bilgi gönderebilirsiniz."],
    ["Hata bildirimi", "Portalımızda karşılaştığınız yazım hatalarını, tarihsel uyuşmazlıkları veya teknik sorunları bize bildirerek sistemin kusursuzlaşmasına yardımcı olabilirsiniz."],
    ["Akademik inceleme", "Tarih alanında akademik çalışmalar yürütüyorsanız, mevcut verilerimizin doğruluğunu teyit etme konusunda gönüllü danışmanımız olabilirsiniz."],
  ];
  return statikSayfa({
    f: "tiles", alt: "İslam sanatında geometrik çini deseni", eyebrow: "Gönüllü Proje", baslik: "Katkıda<br>Bulun", kopya: "Bu arşivi birlikte büyütelim.",
    govde: `<div class="prose">
      <p>Asr-ı Saadet Portalı, İslam tarihini, Ashab-ı Kiram'ın hayatlarını ve bu döneme ait kıymetli bilgileri dijital ortamda herkes için erişilebilir kılmayı amaçlayan gönüllü bir projedir. Arşivi büyütmek ve daha kapsamlı hâle getirmek için desteğinize her zaman açığız.</p>
      <h3>Nasıl katkı sağlayabilirsiniz?</h3>
      <ul class="kaynak-liste uzun">${maddeler.map(([b, a]) => `<li><strong>${b}</strong><span>${a}</span></li>`).join("")}</ul>
      <p>Katkılarınız, bu dijital mirasın gelecek nesillere aktarılmasında büyük bir rol oynayacaktır.</p>
    </div>`,
    ek: iletisimFormu("Bize yazın", "Sorularınızı, eksik gördüğünüz kayıt, kaynak veya düzeltme önerilerinizi iletebilirsiniz.", ""),
  });
}

function sayfaSurum() {
  return statikSayfa({
    f: "manuscript2", alt: "Eski bir Arapça el yazması", eyebrow: "Güncellemeler", baslik: "Sürüm<br>Notları", kopya: `Güncel sürüm: v${SURUM}`,
    govde: `<div class="timeline">${SURUMLER.map((s) => `
      <div class="event">
        <time>${esc(s.ay)}</time>
        <h3>v${esc(s.surum)} — ${esc(s.baslik)}</h3>
        <ul class="surum-liste">${s.maddeler.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
      </div>`).join("")}</div>`,
  });
}

/* ==========================================================================
   Menü ve alt bilgiyi genişlet (index.html'e dokunmadan)
   ========================================================================== */
function arayuzuGenislet() {
  /* S.S.S. üst menüden kalktı; alt bilgide yer alır */
  document.querySelectorAll('.nav-links a[href="#faq"], .nav-links a[data-section="faq"]').forEach((a) => a.remove());
  const nav = $(".nav-links");
  if (nav && !$("#ara-nav-link")) {
    const a = document.createElement("a");
    a.id = "ara-nav-link"; a.href = "#search"; a.dataset.section = "search"; a.textContent = "Ara";
    a.setAttribute("aria-label", "Portalda ara");
    const giris = $("#login-nav-link");
    if (giris) nav.insertBefore(a, giris); else nav.appendChild(a);
  }
  document.querySelectorAll(".version").forEach((v) => {
    v.textContent = "v" + SURUM;
    if (v.dataset.action) return;
    v.dataset.action = "git"; v.dataset.hedef = "#changelog";
    v.setAttribute("role", "link"); v.tabIndex = 0; v.title = "Sürüm notları";
  });
  const kucuk = $(".footer-intro small");
  if (kucuk) kucuk.textContent = kucuk.textContent.replace(/v\d+\.\d+\.\d+/, "v" + SURUM);
  const kolonlar = document.querySelectorAll(".footer-links > div");
  /* Astro düzeni bu bağlantıların çoğunu zaten içeriyor: aynı sayfaya ikinci bağlantı ekleme */
  const anahtar = (h) => String(h || "").replace(/^[#./]+/, "").replace(/\.html$/, "").replace(/[#?].*$/, "") || "home";
  const mevcut = new Set([...document.querySelectorAll(".footer-links a")].map((a) => anahtar(a.getAttribute("href"))));
  const ekle = (kolon, liste, once) => {
    if (!kolon || kolon.querySelector(".ek-link")) return;
    liste.filter(([, href]) => !mevcut.has(anahtar(href))).forEach(([ad, href]) => {
      const a = document.createElement("a");
      a.className = "ek-link"; a.href = href; a.textContent = ad;
      if (once) kolon.insertBefore(a, once); else kolon.appendChild(a);
    });
  };
  ekle(kolonlar[0], [["Portalda Ara", "#search"]], kolonlar[0] ? kolonlar[0].querySelector('a[href="#login"], a[href$="login.html"]') : null);
  const hakkinda = [["Kaynakça", "#sources"], ["Katkıda Bulun", "#contribute"], ["Gizlilik Politikası", "#privacy"], ["Sürüm Notları", "#changelog"]];
  hakkinda.unshift(["Sıkça Sorulan Sorular", "#faq"]);
  ekle(kolonlar[1], hakkinda);
}

/* ---------- Kimlik doğrulama işlemleri ---------- */
function girisMesaji(m, ok) {
  const e = $("#giris-mesaj");
  if (e) { e.textContent = m || ""; e.classList.toggle("ok", !!ok); }
}
function hataMetni(err) {
  const kod = (err && err.code) || "";
  const alan = (typeof location !== "undefined" && location.hostname) || "bu adres";
  switch (kod) {
    case "auth/invalid-credential": case "auth/wrong-password": case "auth/user-not-found": case "auth/invalid-login-credentials":
      return "E-posta veya şifre hatalı.";
    case "auth/email-already-in-use": return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.";
    case "auth/weak-password": return "Şifre en az 6 karakter olmalı.";
    case "auth/invalid-email": return "Geçerli bir e-posta adresi girin.";
    case "auth/too-many-requests": return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.";
    case "auth/network-request-failed": return "Bağlantı hatası. İnternetinizi kontrol edin.";
    case "auth/unauthorized-domain":
      return `Bu site adresi ("${alan}") Firebase'te yetkili alan adları arasında değil. Firebase Console → Authentication → Settings → Authorized domains bölümüne "${alan}" ekleyin. (${kod})`;
    case "auth/operation-not-allowed":
      return `Google ile giriş Firebase'te etkin değil. Firebase Console → Authentication → Sign-in method bölümünde Google'ı etkinleştirin. (${kod})`;
    case "auth/popup-blocked":
      return "Tarayıcı Google penceresini engelledi. Adres çubuğundaki engel simgesinden bu site için açılır pencerelere izin verip tekrar deneyin.";
    case "auth/popup-closed-by-user":
      return "Giriş penceresi kapatıldı. Tekrar deneyebilirsiniz.";
    case "auth/cancelled-popup-request": return "";
    case "auth/operation-not-supported-in-this-environment": case "auth/web-storage-unsupported":
      return `Bu ortamda Google girişi çalışmıyor (dosyadan açılmış sayfa, uygulama içi tarayıcı veya çerezleri kapalı tarayıcı olabilir). Siteyi Chrome ya da Safari'de https adresinden açın. (${kod})`;
    case "auth/internal-error": case "auth/invalid-api-key": case "auth/app-not-authorized":
      if (/app ?check/i.test((err && err.message) || "")) return `Güvenlik doğrulaması (App Check) başarısız oldu. Reklam engelleyiciyi kapatıp sayfayı yenileyin; sorun sürerse yöneticiye bildirin. (${kod})`;
      return `Firebase yapılandırma hatası. (${kod})`;
    case "auth/account-exists-with-different-credential":
      return "Bu e-posta adresiyle daha önce şifreli hesap açılmış. Önce e-posta ve şifrenizle giriş yapın.";
    case "auth/user-disabled": return "Bu hesap devre dışı bırakılmış.";
    case "auth/firebase-app-check-token-is-invalid":
      return `Güvenlik doğrulaması (App Check) başarısız oldu. Sayfayı yenileyip tekrar deneyin. (${kod})`;
    default:
      if (/app ?check/i.test((err && err.message) || "")) return `Güvenlik doğrulaması (App Check) başarısız oldu. Sayfayı yenileyip tekrar deneyin. (${kod || "app-check"})`;
      return ((err && err.message) || "Bir hata oluştu.") + (kod ? ` (${kod})` : "");
  }
}
function girisAlanlari() {
  const e = $("#giris-eposta"), s = $("#giris-sifre");
  return { eposta: e ? e.value.trim() : "", sifre: s ? s.value : "" };
}
async function girisYap() {
  if (!AU) return girisMesaji("Kimlik doğrulama servisi yüklenemedi. Sayfayı yenileyin.");
  const { eposta, sifre } = girisAlanlari();
  if (!eposta || !sifre) return girisMesaji("E-posta ve şifre gerekli.");
  girisMesaji("Giriş yapılıyor…", true);
  durum.girisIstendi = true;
  try { await AU.signInWithEmailAndPassword(auth, eposta, sifre); }
  catch (err) { durum.girisIstendi = false; console.error("Giriş hatası:", err && err.code, err); girisMesaji(hataMetni(err)); }
}
async function kayitOl() {
  if (!AU) return girisMesaji("Kimlik doğrulama servisi yüklenemedi. Sayfayı yenileyin.");
  const { eposta, sifre } = girisAlanlari();
  if (!eposta || !sifre) return girisMesaji("E-posta ve şifre gerekli.");
  if (sifre.length < 6) return girisMesaji("Şifre en az 6 karakter olmalı.");
  girisMesaji("Hesap oluşturuluyor…", true);
  durum.girisIstendi = true;
  try { await AU.createUserWithEmailAndPassword(auth, eposta, sifre); }
  catch (err) { durum.girisIstendi = false; girisMesaji(hataMetni(err)); }
}
/* Google penceresi tıklamadan hemen sonra açılmalıdır; tarayıcılar (özellikle Safari ve mobil)
   birkaç saniye beklenen pencereyi engeller. Bu yüzden düğme, App Check belgesi hazır olana dek
   "Hazırlanıyor…" durumunda bekler. */
function googleDugmesiniGuncelle(hazir) {
  if (hazir) durum.googleHazir = true;
  const b = document.querySelector('[data-action="google"]');
  if (!b) return;
  b.disabled = !durum.googleHazir;
  b.textContent = durum.googleHazir ? "Google ile devam et" : "Google hazırlanıyor…";
}
function googleSaglayici() {
  const saglayici = new AU.GoogleAuthProvider();
  saglayici.setCustomParameters({ prompt: "select_account" });
  return saglayici;
}
async function yonlendirmeSonucunuKontrolEt() {
  try {
    const sonuc = await AU.getRedirectResult(auth);
    if (sonuc && sonuc.user) { durum.girisIstendi = true; authDegisti(sonuc.user); }
  } catch (err) {
    console.error("Google yönlendirme hatası:", err && err.code, err);
    girisMesaji(hataMetni(err));
  }
}
async function googleGiris() {
  if (typeof location !== "undefined" && location.protocol === "file:")
    return girisMesaji("Google girişi dosyadan açılan sayfada çalışmaz. Siteyi https adresinden açın.");
  if (!AU || !auth) return girisMesaji("Kimlik doğrulama servisi yüklenemedi. Sayfayı yenileyin.");
  girisMesaji("Google penceresi açılıyor…", true);
  durum.girisIstendi = true;
  try {
    await AU.signInWithPopup(auth, googleSaglayici());
  } catch (err) {
    console.error("Google giriş hatası:", err && err.code, err);
    if (err && (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-supported-in-this-environment")) {
      girisMesaji("Açılır pencere engellendi; Google sayfasına yönlendiriliyorsunuz…", true);
      try { await AU.signInWithRedirect(auth, googleSaglayici()); return; }
      catch (err2) { console.error("Google yönlendirme hatası:", err2); err = err2; }
    }
    durum.girisIstendi = false;
    girisMesaji(hataMetni(err));
  }
}

function sifreGosterGizle(el) {
  const alan = $("#giris-sifre");
  if (!alan) return;
  const goster = alan.type === "password";
  alan.type = goster ? "text" : "password";
  el.textContent = goster ? "Gizle" : "Göster";
  el.setAttribute("aria-pressed", String(goster));
  el.setAttribute("aria-label", goster ? "Şifreyi gizle" : "Şifreyi göster");
  alan.focus();
}

function dogrulamaMesaji(metin) {
  const el = $("#dogrulama-mesaj");
  if (el) el.textContent = metin;
}
async function dogrulamaGonder() {
  if (!AU || !auth || !auth.currentUser) return dogrulamaMesaji("Önce giriş yapın.");
  dogrulamaMesaji("Gönderiliyor…");
  try {
    await AU.sendEmailVerification(auth.currentUser);
    dogrulamaMesaji("Doğrulama bağlantısı " + auth.currentUser.email + " adresine gönderildi. Gereksiz (spam) klasörünü de kontrol edin.");
  } catch (err) {
    console.error("Doğrulama e-postası hatası:", err && err.code, err);
    dogrulamaMesaji(hataMetni(err));
  }
}
async function dogrulamaYenile() {
  if (!auth || !auth.currentUser) return;
  try {
    await auth.currentUser.reload();
    /* Firestore kuralları yeni "email_verified" bilgisini görsün diye kimlik belgesini tazele */
    await auth.currentUser.getIdToken(true);
    durum.kullanici = auth.currentUser;
    navGuncelle();
    if (!adminMi()) return dogrulamaMesaji("E-posta hâlâ doğrulanmamış görünüyor. Bağlantıya tıkladıktan sonra tekrar deneyin.");
    render({ scroll: false });
  } catch (err) {
    console.error("Kullanıcı yenileme hatası:", err);
    dogrulamaMesaji(hataMetni(err));
  }
}

async function sifreSifirla() {
  if (!AU || !auth) return girisMesaji("Kimlik doğrulama servisi yüklenemedi. Sayfayı yenileyin.");
  const { eposta } = girisAlanlari();
  if (!eposta) return girisMesaji("Şifre sıfırlama bağlantısı için e-posta adresinizi yazın.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) return girisMesaji("Geçerli bir e-posta adresi girin.");
  girisMesaji("Sıfırlama bağlantısı gönderiliyor…", true);
  try {
    await AU.sendPasswordResetEmail(auth, eposta);
    girisMesaji("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.", true);
  } catch (err) {
    console.error("Şifre sıfırlama hatası:", err && err.code, err);
    girisMesaji(hataMetni(err));
  }
}

function adminYedekIndir() {
  if (!adminMi()) return;
  if (durum.hata || !(durum.yuklendi.zat && durum.yuklendi.olay)) {
    alert("Yedek indirmeden önce tüm kayıtların yüklenmesini bekleyin.");
    return;
  }
  const temizle = (k) => {
    const { _ara, _duz, ...veri } = k;
    return veri;
  };
  const yedek = {
    format: "asr-saadet-archive-backup",
    version: SURUM,
    exportedAt: new Date().toISOString(),
    zatlar: durum.zatlar.map(temizle),
    olaylar: durum.olaylar.map(temizle),
  };
  const blob = new Blob([JSON.stringify(yedek, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asr-saadet-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function cikisYap() {
  oturumIpucuYaz("");
  try { if (AU) await AU.signOut(auth); } catch (e) { console.error(e); }
  if (rota.sec === "admin" || rota.sec === "account") sayfayaGit("home");
}

/* ---------- Favoriler ve kişisel notlar (yorum özelliği bilerek yok) ---------- */
function kisiselDurum(key, metin, hata) {
  const el = document.querySelector('.not-durum[data-anahtar="' + String(key).replace(/"/g, "") + '"]');
  if (!el) { if (hata) alert(metin); return; }
  el.textContent = metin;
  el.classList.toggle("hata", !!hata);
  if (!hata) setTimeout(() => { if (el.textContent === metin) el.textContent = ""; }, 2200);
}
const hataYazi = (e) => (e && e.code === "permission-denied")
  ? "İzin verilmedi. Firestore kurallarında bu koleksiyon için giriş yapmış kullanıcıya izin verin."
  : ((e && e.message) || String(e));

async function favToggle(tip, id) {
  if (!durum.kullanici) { sayfayaGit("login"); return; }
  const key = favAnahtar(tip, id);
  const mevcut = durum.favoriler[key];
  try {
    if (mevcut) {
      await Promise.all(mevcut.docIds.map((d) => FS.deleteDoc(FS.doc(db, "favoriler", d))));
    } else {
      await FS.addDoc(FS.collection(db, "favoriler"), {
        uid: durum.kullanici.uid, tip, itemId: id, ad: kayitAdi(tip, kayitBul(tip, id)), eklenmeTarihi: Date.now(),
      });
    }
  } catch (e) {
    console.error("favori hatası:", e);
    kisiselDurum(key, "Favori güncellenemedi: " + hataYazi(e), true);
  }
}

async function notKaydet(tip, id) {
  if (!durum.kullanici) return;
  const key = favAnahtar(tip, id);
  const alan = document.getElementById("not-" + key);
  if (!alan) return;
  const metin = alan.value;
  const mevcut = durum.notlar[key];
  const docId = mevcut ? mevcut.docId : durum.kullanici.uid + "_" + tip + "_" + id;
  const ad = kayitAdi(tip, kayitBul(tip, id));
  try {
    if (!metin.trim()) {
      if (mevcut) await FS.deleteDoc(FS.doc(db, "notlar", docId));
      delete durum.notlar[key]; delete durum.notTaslak[key]; alan.value = "";
      kisiselDurum(key, "Not silindi.");
    } else {
      const zaman = Date.now();
      await FS.setDoc(FS.doc(db, "notlar", docId), { uid: durum.kullanici.uid, tip, itemId: id, ad, metin, guncellemeTarihi: zaman });
      durum.notlar[key] = { docId, ad, tip, itemId: id, metin, guncellemeTarihi: zaman };
      delete durum.notTaslak[key];
      kisiselDurum(key, "Kaydedildi ✓");
    }
  } catch (e) {
    console.error("not hatası:", e);
    kisiselDurum(key, "Not kaydedilemedi: " + hataYazi(e), true);
  }
}

async function notSil(tip, id) {
  const key = favAnahtar(tip, id);
  const mevcut = durum.notlar[key];
  if (!durum.kullanici || !mevcut) return;
  if (!confirm("Bu not silinsin mi?")) return;
  try { await FS.deleteDoc(FS.doc(db, "notlar", mevcut.docId)); }
  catch (e) { console.error("not silme hatası:", e); alert("Not silinemedi: " + hataYazi(e)); }
}

/* Giriş yapan kullanıcının favori ve notlarını dinle (yalnızca kendi kayıtları) */
function kullaniciVerisiniBagla(user) {
  durum.kullaniciDinleyici.forEach((f) => { try { f(); } catch (e) { /* önemsiz */ } });
  durum.kullaniciDinleyici = [];
  durum.favoriler = {}; durum.notlar = {}; durum.notTaslak = {}; durum.kisiselHata = null;
  if (!user || !FS) return;
  const sorgu = (kol) => FS.query(FS.collection(db, kol), FS.where("uid", "==", user.uid));
  const hata = (kol) => (err) => {
    console.error(kol + " dinleme hatası:", err);
    durum.kisiselHata = hataYazi(err);
    planla();
  };
  durum.kullaniciDinleyici.push(FS.onSnapshot(sorgu("favoriler"), (snap) => {
    const m = {};
    snap.docs.forEach((d) => {
      const v = d.data(), key = favAnahtar(v.tip, v.itemId);
      if (!m[key]) m[key] = { docIds: [], ad: v.ad, tip: v.tip, itemId: v.itemId, eklenmeTarihi: v.eklenmeTarihi };
      m[key].docIds.push(d.id);
    });
    durum.favoriler = m; durum.kisiselHata = null;
    planla();
  }, hata("favoriler")));
  durum.kullaniciDinleyici.push(FS.onSnapshot(sorgu("notlar"), (snap) => {
    const m = {};
    snap.docs.forEach((d) => {
      const v = d.data();
      m[favAnahtar(v.tip, v.itemId)] = { docId: d.id, ad: v.ad, tip: v.tip, itemId: v.itemId, metin: v.metin, guncellemeTarihi: v.guncellemeTarihi };
    });
    durum.notlar = m;
    if (rota.sec === "account") planla(); /* arşivde yazarken sayfayı yenileme */
  }, hata("notlar")));
}

/* ---------- İletişim formu ---------- */
async function iletisimGonder() {
  const g = (i) => { const e = $("#" + i); return e ? e.value.trim() : ""; };
  const d = $("#iletisim-durum");
  const yaz = (m, ok) => { if (d) { d.textContent = m; d.classList.toggle("ok", !!ok); } };
  const isim = g("ilt-isim"), email = g("ilt-eposta"), konu = g("ilt-konu"), mesaj = g("ilt-mesaj");
  if (!isim || !email || !mesaj) return yaz("Ad, e-posta ve mesaj alanları gerekli.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return yaz("Geçerli bir e-posta adresi girin.");
  yaz("Gönderiliyor…", true);
  try {
    const r = await fetch(FORMSPREE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ isim, email, konu, mesaj }),
    });
    if (r.ok) {
      yaz("Mesajınız iletildi. Teşekkür ederiz.", true);
      ["ilt-isim", "ilt-eposta", "ilt-konu", "ilt-mesaj"].forEach((i) => { const e = $("#" + i); if (e) e.value = ""; });
    } else yaz("Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.");
  } catch (e) { yaz("Bağlantı hatası. Lütfen daha sonra tekrar deneyin."); }
}

/* ---------- Yönlendirme (çok sayfalı + eski hash bağlantılarıyla uyumlu) ---------- */
let rota = { sec: "home", param: "" };
const SAYFALAR = {
  home: sayfaHome, archive: sayfaArsiv, timeline: sayfaCizelge, genealogy: sayfaSoy,
  random: sayfaRastgele, articles: sayfaMakaleler, faq: sayfaSss, login: sayfaGiris, admin: sayfaAdmin, account: sayfaHesap,
  search: sayfaAra, privacy: sayfaGizlilik, sources: sayfaKaynakca, contribute: sayfaKatki, changelog: sayfaSurum,
};
const BASLIKLAR = {
  home: "Ana Sayfa", archive: "Arşiv", timeline: "Zaman Çizelgesi", genealogy: "Soyağacı",
  random: "Rastgele Şahsiyet", articles: "Makaleler", faq: "Sıkça Sorulan Sorular", login: "Giriş", admin: "Yönetici Paneli", account: "Hesabım",
  search: "Ara", privacy: "Gizlilik Politikası", sources: "Kaynakça", contribute: "Katkıda Bulun", changelog: "Sürüm Notları",
};

const SAYFA_DOSYALARI = {
  home: "index.html", archive: "archive", timeline: "timeline", genealogy: "genealogy",
  random: "random", articles: "articles", faq: "faq", login: "login", admin: "admin",
  account: "account", search: "search", privacy: "privacy", sources: "sources",
  contribute: "contribute", changelog: "changelog",
};
const DOSYADAN_SAYFA = Object.fromEntries(Object.entries(SAYFA_DOSYALARI).map(([sayfa, dosya]) => [dosya, sayfa]));

function rotaUrl(sec, param = "", sorgu = "") {
  const dosya = SAYFA_DOSYALARI[sec] || SAYFA_DOSYALARI.home;
  const query = sorgu ? (String(sorgu).startsWith("?") ? String(sorgu) : "?" + String(sorgu)) : "";
  return `./${dosya}${query}${param !== "" ? "#" + encodeURIComponent(param) : ""}`;
}

function sayfayaGit(sec, param = "", sorgu = "") {
  location.href = rotaUrl(sec, param, sorgu);
}

function eskiHashRotasi(hash) {
  const h = String(hash || "").replace(/^#\/?/, "");
  const i = h.indexOf("/");
  const sec = i < 0 ? h : h.slice(0, i);
  if (!SAYFALAR[sec]) return null;
  let param = i < 0 ? "" : h.slice(i + 1);
  try { param = decodeURIComponent(param); } catch (e) { /* olduğu gibi kalsın */ }
  return { sec, param };
}

function cokSayfaliLinkleriDuzenle(kok = document) {
  kok.querySelectorAll('a[href^="#"]').forEach((a) => {
    const hedef = eskiHashRotasi(a.getAttribute("href"));
    if (hedef) a.setAttribute("href", rotaUrl(hedef.sec, hedef.param));
  });
}

function rotaOku() {
  const dosya = location.pathname.split("/").pop() || "index.html";
  const sayfa = document.body.dataset.page || DOSYADAN_SAYFA[dosya] || "home";
  const eski = eskiHashRotasi(location.hash);
  if (eski && eski.sec !== sayfa) return eski;
  let param = eski ? eski.param : (location.hash || "").replace(/^#\/?/, "");
  try { param = decodeURIComponent(param); } catch (e) { /* olduğu gibi kalsın */ }
  return { sec: SAYFALAR[sayfa] ? sayfa : "home", param };
}

function rotaHazirla(eski) {
  if (rota.sec === "search") {
    if (rota.param) durum.genelArama = rota.param;
    else if (eski.sec !== "search") durum.genelArama = "";
  }
  if (rota.sec === "articles" && /^\d+$/.test(rota.param) && MAKALELER[Number(rota.param)]) {
    rota.param = MAKALELER[Number(rota.param)].slug;
  }
  if (rota.sec === "faq" && rota.param !== "") {
    const i = Number(rota.param);
    if (Number.isInteger(i) && SSS[i]) { durum.faqAcik = i; durum.kaydirId = "sss-" + i; }
  }
  if (rota.sec === "random" && eski.sec !== "random") durum.rastgeleId = null;
  if (rota.sec === "archive") {
    if (rota.param && !arsivDetayParam()) {
      durum.arama = ""; durum.devir = "tumu"; durum.tur = "tumu";
      durum.acik.add(rota.param); durum.kaydirHedef = rota.param;
    } else if (!rota.param && eski.sec !== "archive") {
      durum.limit = 50;
      const q = new URLSearchParams(location.search);
      if (q.has("q")) durum.arama = q.get("q") || "";
      if (["tumu", "zat", "olay"].includes(q.get("tur"))) durum.tur = q.get("tur");
      if (q.has("devir")) durum.devir = q.get("devir") || "tumu";
    }
  }
}

function navGuncelle() {
  const giris = $("#login-nav-link");
  if (giris) {
    giris.textContent = durum.kullanici ? "Hesabım" : "Giriş";
    giris.setAttribute("href", rotaUrl(durum.kullanici ? "account" : "login"));
    giris.dataset.section = durum.kullanici ? "account" : "login";
  }
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const aktif = a.dataset.section === rota.sec;
    a.classList.toggle("active", aktif);
    if (aktif) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const panel = $("#admin-nav-link");
  if (panel) panel.style.display = adminMi() ? "" : "none";
}

function render(secenek) {
  const scroll = !secenek || secenek.scroll !== false;
  const app = document.getElementById("app");
  if (!app) return;
  const { sec, param } = rota;
  app.innerHTML = SAYFALAR[sec](param);
  if (scroll) window.scrollTo(0, 0);
  if (sec === "archive") arsivGuncelle();
  if (sec === "admin" && adminMi()) { adminListeGuncelle(); adminFormuKur(); }
  if (sec === "login") googleDugmesiniGuncelle(false);
  if (sec === "search") {
    aramaGuncelle();
    const g = $("#genel-arama");
    if (g && scroll) { g.focus(); const n = g.value.length; if (g.setSelectionRange) g.setSelectionRange(n, n); }
  }
  if (durum.kaydirId) {
    const el = document.getElementById(durum.kaydirId);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" });
    durum.kaydirId = null;
  }
  navGuncelle();
  cokSayfaliLinkleriDuzenle(document);
  document.title = document.body.dataset.seoTitle || `${BASLIKLAR[sec]} | Asr-ı Saadet Portalı`;
}

/* Veri değişince: yazı yazılan sayfalarda sadece ilgili bölümü güncelle */
function veriGuncelle() {
  navGuncelle();
  switch (rota.sec) {
    case "archive": if (arsivDetayParam()) render({ scroll: false }); else arsivGuncelle(); break;
    case "admin": if (adminMi()) adminListeGuncelle(); break;
    case "search": aramaGuncelle(); break;
    case "faq": case "login": case "privacy": case "sources": case "contribute": case "changelog": break;
    default: render({ scroll: false });
  }
}
let planli = null;
function planla() {
  if (planli) return;
  planli = setTimeout(() => { planli = null; veriGuncelle(); }, 30);
}

function authDegisti(user) {
  durum.kullanici = user;
  oturumIpucuYaz(user ? (adminMi() ? "yonetici" : "uye") : "");
  /* Yönetici her zaman tam canlı veriyle çalışır; ziyaretçi/üye derleme verisi + değişikliklerle */
  if (adminMi() && VERI_SAYFALARI.has(rota.sec) && durum.canliMod !== "tam") tamDinle();
  if (MAKALE_SAYFALARI.has(rota.sec)) makaleleriDinle(adminMi());
  kullaniciVerisiniBagla(user);
  navGuncelle();
  if (user && durum.girisIstendi && rota.sec === "login") {
    durum.girisIstendi = false;
    if (adminMi()) hosgeldinBildirimGoster(user.email);
    sayfayaGit(adminEpostasiMi() ? "admin" : "account");
    return;
  }
  durum.girisIstendi = false;
  if (["login", "admin", "account", "random"].includes(rota.sec)) render({ scroll: false });
  else if (rota.sec === "archive") arsivGuncelle();
}

/* ---------- Olaylar (tek yerden, olay delegasyonu) ---------- */
const islem = {
  kayit(el) {
    const a = el.dataset.anahtar;
    if (durum.acik.has(a)) durum.acik.delete(a); else durum.acik.add(a);
    arsivGuncelle();
  },
  tur(el) { durum.tur = el.dataset.deger; durum.limit = 50; arsivGuncelle(); },
  devir(el) { durum.devir = el.dataset.deger; durum.limit = 50; arsivGuncelle(); },
  etiket(el) {
    durum.arama = el.dataset.deger; durum.limit = 50;
    const i = $("#arama"); if (i) i.value = durum.arama;
    arsivGuncelle();
  },
  daha() { durum.limit += 50; arsivGuncelle(); },
  faq(el) {
    const i = Number(el.dataset.i);
    durum.faqAcik = durum.faqAcik === i ? null : i;
    const a = $("#faq-alan"); if (a) a.innerHTML = faqListe();
  },
  makale(el) {
    const i = Number(el.dataset.i);
    if (durum.makaleAcik.has(i)) durum.makaleAcik.delete(i); else durum.makaleAcik.add(i);
    render({ scroll: false });
  },
  rastgele() { durum.rastgeleId = null; render({ scroll: false }); },
  "login-mod"(el) { durum.loginMod = el.dataset.mod; render({ scroll: false }); },
  giris: girisYap,
  "kayit-ol": kayitOl,
  google: googleGiris,
  "sifre-goster": sifreGosterGizle,
  "sifre-sifirla": sifreSifirla,
  "dogrulama-gonder": dogrulamaGonder,
  "dogrulama-yenile": dogrulamaYenile,
  cikis: cikisYap,
  iletisim: iletisimGonder,
  git(el) {
    const hedef = eskiHashRotasi(el.dataset.hedef);
    if (hedef) sayfayaGit(hedef.sec, hedef.param);
  },
  "ara-etiket"(el) {
    durum.genelArama = el.dataset.deger;
    const i = $("#genel-arama"); if (i) { i.value = durum.genelArama; i.focus(); }
    aramaGuncelle();
    history.replaceState(null, "", rotaUrl("search", durum.genelArama));
  },
  "arsivde-ara"(el) {
    durum.arama = durum.genelArama.trim(); durum.tur = el.dataset.tur; durum.devir = "tumu"; durum.limit = 50;
    const sorgu = new URLSearchParams({ q: durum.arama, tur: durum.tur });
    sayfayaGit("archive", "", sorgu.toString());
  },
  fav(el) { favToggle(el.dataset.tip, el.dataset.id); },
  "not-kaydet"(el) { notKaydet(el.dataset.tip, el.dataset.id); },
  "not-sil"(el) { notSil(el.dataset.tip, el.dataset.id); },
  "hesap-sekme"(el) {
    durum.hesap.sekme = el.dataset.deger;
    document.querySelectorAll(".account-tab").forEach((b) => {
      const aktif = b.dataset.deger === durum.hesap.sekme;
      b.classList.toggle("active", aktif); b.setAttribute("aria-pressed", String(aktif));
    });
    hesapListeGuncelle();
  },
  "hesap-filtre-temizle"() {
    durum.hesap = { sekme: "tumu", arama: "", tur: "tumu" };
    render({ scroll: false });
  },
  "hesap-disa-aktar": hesapVerisiniIndir,
  "admin-sekme"(el) {
    if (!adminDegisikligiBirakabilir()) return;
    durum.admin.sekme = el.dataset.sekme; durum.admin.arama = "";
    adminListeGuncelle(); adminFormuKur();
  },
  "admin-yeni"(el) { adminYeniKayit(el.dataset.tip); },
  "admin-duzenle"(el) {
    if (!adminDegisikligiBirakabilir()) return;
    const liste = durum.admin.sekme === "zat" ? durum.zatlar : durum.olaylar;
    const k = liste.find((x) => x.id === el.dataset.id);
    if (k) adminFormuDoldur(k);
  },
  "admin-sil"(el) { adminSil(el.dataset.id); },
  "admin-kayit-ac"(el) {
    if (!adminDegisikligiBirakabilir()) return;
    durum.admin.sekme = "zat"; durum.admin.arama = "";
    adminListeGuncelle(); adminFormuKur();
    const k = durum.zatlar.find((x) => x.id === el.dataset.id);
    if (k) { adminFormuDoldur(k); const f = $("#admin-form"); if (f) f.scrollIntoView({ block: "start" }); }
  },
  "mk-yeni"() { if (mkBirakabilir()) mkFormuKur(null); },
  "mk-duzenle"(el) {
    if (!mkBirakabilir()) return;
    const m = tumMakaleler().find((x) => (x.id || x.slug) === el.dataset.id);
    if (m) mkFormuKur(m);
  },
  "mk-sil"(el) { mkSil(el.dataset.id); },
  "mk-kaydet"() { mkKaydet(); },
  "mk-gorsel-kaldir"() { durum.mk.gorsel = ""; durum.mk.kirli = true; mkGorselOnizle(); },
  "admin-kaydet": adminKaydet,
  "admin-iptal"() { if (adminDegisikligiBirakabilir()) adminFormuKur(); },
  "admin-yedek": adminYedekIndir,
  "admin-baglari-temizle": adminBaglariTemizle,
  komut(el) {
    const kap = el.closest(".editor-wrap");
    const ed = (kap && kap.querySelector(".rich-editor")) || $("#f-bilgi");
    if (!ed) return;
    ed.focus();
    const k = el.dataset.komut;
    if (k === "createLink") {
      const url = prompt("Bağlantı adresi (https://…)");
      if (url && /^(https?:\/\/|mailto:)/i.test(url.trim())) document.execCommand("createLink", false, url.trim());
    } else if (k === "formatBlock") document.execCommand("formatBlock", false, el.dataset.deger);
    else document.execCommand(k, false, null);
  },
};

function olayBagla() {
  document.addEventListener("change", (e) => {
    if (e.target.id === "mk-gorsel-dosya") mkGorselSec(e.target);
    if (e.target.id === "f-cinsiyet") adminAkrabaOnizleme();
    if (e.target.id === "mk-gorsel-url") { durum.mk.gorsel = e.target.value.trim(); durum.mk.kirli = true; mkGorselOnizle(); }
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest("[data-profile-link]")) return;
    const baglanti = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (baglanti) {
      const hedef = eskiHashRotasi(baglanti.getAttribute("href"));
      if (hedef) { e.preventDefault(); sayfayaGit(hedef.sec, hedef.param); return; }
    }
    const el = e.target.closest ? e.target.closest("[data-action]") : null;
    if (!el) return;
    const f = islem[el.dataset.action];
    if (f) f(el, e);
  });
  document.addEventListener("keydown", (e) => {
    const hedef = e.target;
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && hedef.tagName && !/^(INPUT|TEXTAREA|SELECT)$/.test(hedef.tagName) && !hedef.isContentEditable) {
      e.preventDefault();
      if (rota.sec === "search") { const g = $("#genel-arama"); if (g) g.focus(); } else sayfayaGit("search");
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && hedef.matches && hedef.matches('[role="button"][data-action], [role="link"][data-action]')) {
      e.preventDefault(); hedef.click(); return;
    }
    if (e.key === "Enter" && hedef.id && (hedef.id === "giris-eposta" || hedef.id === "giris-sifre")) {
      e.preventDefault();
      if (durum.loginMod === "kayit") kayitOl(); else girisYap();
    }
  });
  document.addEventListener("mousedown", (e) => {
    if (e.target.closest && e.target.closest(".editor-toolbar button")) e.preventDefault(); /* seçim kaybolmasın */
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "hesap-arama") {
      durum.hesap.arama = e.target.value;
      hesapListeGuncelle();
      return;
    }
    if (e.target.id === "admin-arama") {
      durum.admin.arama = e.target.value;
      adminListeGovdesiGuncelle();
      return;
    }
    if (e.target.id === "f-isim") adminKopyaUyarisiGuncelle();
    if (/^f-(anne|baba|es|cocuklar)$/.test(e.target.id)) adminBagDurumuGuncelle();
    if (/^f-(anne|baba|es|cocuklar|baglar|isim)$/.test(e.target.id)) adminAkrabaOnizleme();
    if (e.target.closest && e.target.closest(".mk-form")) durum.mk.kirli = true;
    if (e.target.closest && e.target.closest(".admin-form")) adminKirliAyarla(true);
    if (e.target.classList && e.target.classList.contains("not-alani")) durum.notTaslak[e.target.dataset.anahtar] = e.target.value;
    if (e.target.id === "genel-arama") {
      durum.genelArama = e.target.value;
      aramaGuncelle();
      const q = durum.genelArama.trim();
      history.replaceState(null, "", rotaUrl("search", q));
    }
    if (e.target.id === "arama") { durum.arama = e.target.value; durum.limit = 50; arsivGuncelle(); }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "hesap-tur") {
      durum.hesap.tur = e.target.value;
      hesapListeGuncelle();
      return;
    }
    if (e.target.id === "admin-sirala") {
      durum.admin.siralama = e.target.value;
      adminListeGovdesiGuncelle();
      return;
    }
    if (e.target.id === "admin-eksik") {
      durum.admin.sadeceEksik = e.target.checked;
      adminListeGovdesiGuncelle();
      return;
    }
    if (e.target.closest && e.target.closest(".admin-form")) adminKirliAyarla(true);
    if (e.target.id === "soy-sec") sayfayaGit("genealogy", e.target.value || "");
  });
  window.addEventListener("beforeunload", (e) => {
    if (rota.sec !== "admin" || !durum.admin.kirli) return;
    e.preventDefault();
    e.returnValue = "";
  });
  window.addEventListener("hashchange", () => {
    const eski = rota;
    rota = rotaOku();
    if (rota.sec !== (document.body.dataset.page || "home")) {
      sayfayaGit(rota.sec, rota.param);
      return;
    }
    rotaHazirla(eski);
    render();
  });
}

/* ---------- Veri dinleme ve başlatma ---------- */
function dinle(koleksiyon, tur) {
  FS.onSnapshot(FS.collection(db, koleksiyon), (snap) => {
    const liste = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (snap.metadata && snap.metadata.fromCache && !liste.length) return; /* boş önbellek: sunucuyu bekle */
    if (!(snap.metadata && snap.metadata.fromCache)) durum.canliTam = true;
    veriyiUygula(tur, liste, true);
    planla();
  }, (err) => {
    console.error(koleksiyon + " dinleme hatası:", err);
    durum.hataKod = (err && err.code) || "";
    if (!durum.yuklendi[tur]) durum.hata = koleksiyon + " koleksiyonu: " + ((err && err.message) || String(err));
    durum.yuklendi[tur] = true;
    planla();
  });
}

/* App Check: Firestore/Auth kullanılmadan ÖNCE başlatılmalıdır */
let appCheckOrnegi = null, AC_MODUL = null;
function appCheckBaslat(uygulama, AC) {
  if (!APPCHECK_SITE_KEY || !AC) {
    if (!APPCHECK_SITE_KEY) console.warn("App Check anahtarı girilmemiş (APPCHECK_SITE_KEY). Firebase'te App Check zorunluysa kayıtlar yüklenmez.");
    durum.googleHazir = true;
    return;
  }
  AC_MODUL = AC;
  try {
    /* Yerelde (localhost) test için hata ayıklama belgesi; canlı sitede etkisizdir */
    if (typeof location !== "undefined" && location.hostname === "localhost") self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    const saglayici = APPCHECK_SAGLAYICI === "enterprise"
      ? new AC.ReCaptchaEnterpriseProvider(APPCHECK_SITE_KEY)
      : new AC.ReCaptchaV3Provider(APPCHECK_SITE_KEY);
    const ac = AC.initializeAppCheck(uygulama, { provider: saglayici, isTokenAutoRefreshEnabled: true });
    appCheckOrnegi = ac;
    /* Belgeyi gerçekten alabildiğimizi doğrula; alamazsak nedenini ekranda göster */
    durum.appCheck = "bekliyor";
    Promise.resolve(AC.getToken(ac, false)).then((r) => {
      if (r && r.error) throw r.error;
      durum.appCheck = "ok";
      googleDugmesiniGuncelle(true);
      planla();
    }).catch((e) => {
      durum.appCheck = { kod: (e && e.code) || "", mesaj: (e && e.message) || String(e) };
      console.error("App Check belgesi alınamadı:", e);
      googleDugmesiniGuncelle(true);
      planla();
    });
  } catch (e) {
    console.error("App Check başlatılamadı:", e);
  }
}

/* ---------- Hangi sayfa neye ihtiyaç duyar? ----------
   Firebase + App Check (reCAPTCHA) ağırdır: ~0,5 MB ve 1–3 sn. Veri istemeyen sayfalarda hiç
   yüklenmez. Ziyaretçiler veriyi derlemede üretilen /site-data.json'dan alır (CDN, anında) ve
   Firestore'dan YALNIZCA o tarihten sonra değişen kayıtları çeker. Giriş yapmış kullanıcılar
   (yönetici, favori/not sahipleri) tam canlı veriyle çalışır. */
const VERI_SAYFALARI = new Set(["home", "archive", "timeline", "genealogy", "random", "search", "articles", "admin", "account"]);
const OTURUM_SAYFALARI = new Set(["login", "admin", "account"]);
const OTURUM_ANAHTARI = "asr-oturum";
/* Son oturumun türü: "" (yok), "uye" veya "yonetici" — Firebase yüklenmeden hangi modda başlanacağını belirler */
function oturumIpucu() { try { return localStorage.getItem(OTURUM_ANAHTARI) || ""; } catch (e) { return ""; } }
function oturumIpucuYaz(deger) { try { if (deger) localStorage.setItem(OTURUM_ANAHTARI, deger); else localStorage.removeItem(OTURUM_ANAHTARI); } catch (e) { /* önemsiz */ } }
const MAKALE_SAYFALARI = new Set(["articles", "search", "admin"]);

let firebaseSozu = null;
function firebaseYukle() {
  if (firebaseSozu) return firebaseSozu;
  firebaseSozu = (async () => {
    /* Modüller paralel yüklenir (eskiden App Check ayrıca, sırayla bekleniyordu) */
    const [appM, fsM, auM, acM] = await Promise.all([
      yukle(FB("firebase-app")), yukle(FB("firebase-firestore")), yukle(FB("firebase-auth")),
      APPCHECK_SITE_KEY ? yukle(FB("firebase-app-check")).catch((e) => { console.error("App Check yüklenemedi:", e); return null; }) : null,
    ]);
    FS = fsM; AU = auM;
    const uygulama = appM.initializeApp(firebaseConfig);
    appCheckBaslat(uygulama, acM);
    try {
      /* Kalıcı önbellek (IndexedDB): sonraki ziyaretlerde kayıtlar diskten anında gelir, yalnızca
         değişenler indirilir. Long-polling otomatik algılama VPN/güvenlik duvarı arkasında bağlantıyı korur. */
      db = FS.initializeFirestore(uygulama, {
        experimentalAutoDetectLongPolling: true,
        localCache: FS.persistentLocalCache({ tabManager: FS.persistentMultipleTabManager() }),
      });
    } catch (e) {
      console.warn("Firestore kalıcı önbellek olmadan başlatılıyor:", e);
      try { db = FS.initializeFirestore(uygulama, { experimentalAutoDetectLongPolling: true }); }
      catch (e2) { db = FS.getFirestore(uygulama); }
    }
    auth = AU.getAuth(uygulama);
    return true;
  })();
  return firebaseSozu;
}

async function baslat() {
  ekStilEkle();
  arayuzuGenislet();
  rota = rotaOku();
  if (rota.sec !== (document.body.dataset.page || "home")) {
    location.replace(rotaUrl(rota.sec, rota.param));
    return;
  }
  rotaHazirla({ sec: "" });
  yerelVeriyiYukle();
  render();
  olayBagla();
  const sayfa = rota.sec;
  const veriGerek = VERI_SAYFALARI.has(sayfa);
  const oturumGerek = OTURUM_SAYFALARI.has(sayfa) || oturumIpucu();
  const statik = veriGerek || sayfa === "articles" ? await statikVeriyiYukle() : null;
  if (!veriGerek && !oturumGerek) return; /* S.S.S., gizlilik, kaynakça…: Firebase gerekmez */

  try { await firebaseYukle(); }
  catch (e) {
    console.error("Firebase yüklenemedi:", e);
    if (!statik && !durum.zatlar.length) {
      durum.hata = "Firebase yüklenemedi (" + ((e && e.message) || e) + ")";
      durum.yuklendi.zat = durum.yuklendi.olay = true;
    }
    veriGuncelle();
    return;
  }
  if (oturumGerek) {
    AU.onAuthStateChanged(auth, authDegisti);
    if (sayfa === "login") { yonlendirmeSonucunuKontrolEt(); setTimeout(() => googleDugmesiniGuncelle(true), 8000); }
  }
  if (!veriGerek) return;
  /* "Yalnızca değişenler" modu, derleme verisi doğrudan Firestore'dan alındıysa güvenlidir. Derleme yedek
     veriyle (canlı sitenin eski site-data.json'u) yapıldıysa arada silinen kayıtlar bilinemez; o durumda
     ziyaretçi de tam canlı veriyi okur ki ana sayfa ve yönetici paneli AYNI sayıları göstersin. */
  const guvenliStatik = statik && statik.generatedAt && statik.kaynak === "firestore";
  if (guvenliStatik && oturumIpucu() !== "yonetici" && sayfa !== "admin") degisiklikleriDinle(statik.generatedAt);
  else tamDinle();
  if (MAKALE_SAYFALARI.has(sayfa)) makaleleriDinle(false);
  /* App Check hiç cevap vermezse Google düğmesi sonsuza dek beklemesin */
  setTimeout(() => googleDugmesiniGuncelle(true), 8000);
  /* Kayıtlar 12 saniyede gelmezse kullanıcıya bilgi ver (sayfa sessizce takılı kalmasın) */
  setTimeout(() => {
    if (!(durum.yuklendi.zat && durum.yuklendi.olay)) { durum.yavas = true; planla(); }
  }, 12000);
}

/* Tam canlı veri (yönetici ve giriş yapmış kullanıcılar) */
function tamDinle() {
  if (durum.canliMod === "tam") return;
  durum.canliMod = "tam";
  dinle("zatlar", "zat");
  dinle("olaylar", "olay");
}
/* Ziyaretçi: yalnızca derlemeden SONRA değişen kayıtlar (+ silinenler) — okuma kotasını korur */
function degisiklikleriDinle(esik) {
  durum.canliMod = "degisiklik";
  const sinir = Math.max(0, Number(esik) - 15 * 60 * 1000); /* saat farklarına karşı 15 dk pay */
  [["zatlar", "zat"], ["olaylar", "olay"]].forEach(([kol, tur]) => {
    FS.onSnapshot(FS.query(FS.collection(db, kol), FS.where("guncellemeTarihi", ">", sinir)), (snap) => {
      if (durum.canliMod !== "degisiklik" || snap.empty) return;
      veriBirlestir(tur, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      planla();
    }, (err) => console.warn(kol + " değişiklikleri alınamadı (derleme verisi gösteriliyor):", err && err.code));
  });
  /* Güvenlik ağı: sunucudaki kayıt SAYISI (1 okuma) eldekiyle tutmuyorsa (ör. Firebase konsolundan
     silinen kayıt) tam canlı veriye geç. Böylece ana sayfa ile yönetici paneli hiçbir zaman ayrışmaz. */
  setTimeout(async () => {
    if (durum.canliMod !== "degisiklik" || typeof FS.getCountFromServer !== "function") return;
    try {
      const [z, o] = await Promise.all([FS.getCountFromServer(FS.collection(db, "zatlar")), FS.getCountFromServer(FS.collection(db, "olaylar"))]);
      if (z.data().count !== durum.zatlar.length || o.data().count !== durum.olaylar.length) {
        console.info("Kayıt sayısı derleme verisinden farklı; tam canlı veriye geçiliyor.");
        tamDinle();
      }
    } catch (e) { /* sayım yapılamazsa derleme verisi + değişikliklerle devam */ }
  }, 2500);
  FS.onSnapshot(FS.query(FS.collection(db, "silinenler"), FS.where("tarih", ">", sinir)), (snap) => {
    if (durum.canliMod !== "degisiklik" || snap.empty) return;
    const ids = { zat: [], olay: [] };
    snap.docs.forEach((d) => { const v = d.data(); if (ids[v.tur]) ids[v.tur].push(v.kayitId || d.id); });
    if (ids.zat.length) veriBirlestir("zat", [], ids.zat);
    if (ids.olay.length) veriBirlestir("olay", [], ids.olay);
    planla();
  }, () => { /* koleksiyon yoksa veya kural izin vermiyorsa sessiz geç */ });
}
/* Makaleler: ziyaretçiye yalnızca yayımlananlar; yöneticiye taslaklar da */
let makaleDinleyici = null;
function makaleleriDinle(yonetici) {
  if (!FS || !db) return;
  if (makaleDinleyici) { makaleDinleyici(); makaleDinleyici = null; }
  const kol = FS.collection(db, "makaleler");
  const sorgu = yonetici ? kol : FS.query(kol, FS.where("yayinda", "==", true));
  makaleDinleyici = FS.onSnapshot(sorgu, (snap) => {
    durum.makaleler = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    planla();
  }, (err) => console.warn("Makaleler okunamadı:", err && err.code));
}

baslat();
