(function () {
  "use strict";

  const STORAGE = { language: "asr-language", theme: "asr-theme" };
  const root = document.documentElement;
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  let language = root.lang === "en" ? "en" : "tr";
  let translating = false;

  const EN = {
    "Asr-ı Saadet Portalı": "Age of Felicity Portal",
    "Ana menü": "Main navigation",
    "Asr-ı Saadet Portalı ana sayfa": "Age of Felicity Portal home",
    "İslam tarihi ve Ashab-ı Kiram arşivi": "Islamic history and Companions archive",
    "Ana Sayfa": "Home",
    "Arşiv": "Archive",
    "Zaman Çizelgesi": "Timeline",
    "Soyağacı": "Genealogy",
    "Rastgele Şahsiyet": "Random Figure",
    "Makaleler": "Articles",
    "S.S.S.": "FAQ",
    "Giriş": "Sign in",
    "Panel": "Dashboard",
    "Menü": "Menu",
    "Ara": "Search",
    "Hesabım": "My Account",
    "Yönetici Paneli": "Admin Dashboard",
    "Portalda Ara": "Search the Portal",
    "Kaynakça": "Sources",
    "Katkıda Bulun": "Contribute",
    "Gizlilik Politikası": "Privacy Policy",
    "Sürüm Notları": "Release Notes",
    "Sıkça Sorulan Sorular": "Frequently Asked Questions",
    "Hızlı Erişim": "Quick Links",
    "Hakkında": "About",
    "Klasik İslâm kaynaklarından\nderlenen açık erişimli arşiv.": "An open-access archive compiled\nfrom classical Islamic sources.",
    "Klasik İslâm kaynaklarından": "Compiled from classical Islamic sources",
    "derlenen açık erişimli arşiv.": "as an open-access archive.",
    "Ashâb-ı Kirâm'ın hayatlarını, nesep bağlarını ve çağın izlerini belgeleyen bağımsız dijital arşiv.": "An independent digital archive documenting the Companions, their lineages, and the history of their age.",
    "Tüm hakları saklıdır": "All rights reserved",
    "Arşiv yükleniyor…": "Loading archive…",
    "Cami kubbesinin iç mimarisi": "Interior architecture of a mosque dome",
    "İslam sanatında geometrik çini deseni": "Geometric tilework in Islamic art",
    "Eski bir Arapça el yazması": "An old Arabic manuscript",
    "Eski bir el yazması": "An old manuscript",
    "İslam mimarisinde geometrik desen": "Geometric pattern in Islamic architecture",
    "Süslemeli bir el yazması sayfası": "An illuminated manuscript page",
    "Arap hattı örneği": "A sample of Arabic calligraphy",
    "Dijital Siyer Arşivi": "Digital Sira Archive",
    "“Ashabım, yıldızlar gibidir. Hangisine tabi olursanız hidayete erersiniz.”": "“My Companions are like the stars. Whichever of them you follow, you will be guided.”",
    "— Peygamber Efendimiz (s.a.v.)": "— Prophet Muhammad (peace be upon him)",
    "Ashab-ı Kiram'ın hayatlarını, nesep bağlarını ve dönemin olaylarını tek yerde okuyun.": "Explore the lives, lineages, and historical setting of the Companions in one place.",
    "Kayıtlar klasik siyer ve tarih kaynaklarına dayanır. Bir şahsiyetten akrabalarına, bir olaydan zaman çizelgesindeki yerine geçebilirsiniz.": "Records draw on classical sira and historical sources. Move seamlessly from a person to their relatives, or from an event to its place on the timeline.",
    "Şahsiyet": "Figure",
    "Şahsiyetler": "Figures",
    "Olay": "Event",
    "Olaylar": "Events",
    "Bağlantı": "Connection",
    "Arşivi Keşfet": "Explore the Archive",
    "Öne Çıkan Şahsiyetler": "Featured Figures",
    "Arşivde en kapsamlı kaydı bulunan isimler.": "Figures with the most extensive records in the archive.",
    "Henüz bilgi girilmiş bir şahsiyet yok.": "No figure with a completed record is available yet.",
    "Tüm arşivi görüntüle →": "View the full archive →",
    "Son Eklenen Olaylar": "Recently Added Events",
    "Zaman çizelgesine en son giren tarihî olaylar.": "The latest historical events added to the timeline.",
    "Henüz olay kaydı yok.": "No events have been added yet.",
    "Zaman çizelgesine git →": "Go to the timeline →",
    "Temel Okumalar": "Essential Reading",
    "Ashab-ı Kiram'ı ve ilim geleneğini anlatan üç okuma.": "Three readings on the Companions and the tradition of learning.",
    "İtikat, ilim ve Kur'an eğitimi üzerine hazırlanmış kısa yazılar.": "Short essays on faith, scholarship, and Qur'anic education.",
    "Makaleleri oku →": "Read the articles →",
    "Dijital Arşiv": "Digital Archive",
    "Sahâbe": "Companions",
    "Kataloğu": "Catalogue",
    "Klasik siyer ve tarih kaynaklarından derlenen şahsiyet ve olay kayıtları.": "Records of people and events compiled from classical sira and historical sources.",
    "İsim veya içerik ara…": "Search names or content…",
    "Arşivde ara": "Search the archive",
    "Tümü": "All",
    "Tüm devirler": "All periods",
    "Asr-ı Saadet": "Age of Felicity",
    "Hulefâ-yi Râşidîn": "Rightly Guided Caliphs",
    "Emeviler": "Umayyads",
    "Abbasiler": "Abbasids",
    "Endülüs": "Al-Andalus",
    "Diğer": "Other",
    "Arşiv durumu": "Archive status",
    "Gösterilen": "Shown",
    "Aramanızla eşleşen kayıt bulunamadı.": "No records matched your search.",
    "Bu kayıt için henüz bilgi girilmemiş.": "No information has been added to this record yet.",
    "Daha fazla göster": "Show more",
    "Anne": "Mother",
    "Baba": "Father",
    "Eşi / Eşleri": "Spouse / Spouses",
    "Diğer bağlar": "Other relationships",
    "Kaynak": "Source",
    "Soyağacında gör →": "View in genealogy →",
    "Favorilere eklemek ve kişisel not almak için": "To add favorites and private notes,",
    "giriş yapın": "sign in",
    "Favorilerde": "In favorites",
    "Favorilere ekle": "Add to favorites",
    "Kişisel notum": "My private note",
    "yalnızca siz görürsünüz": "visible only to you",
    "Bu kayıtla ilgili kendinize not alın…": "Add a private note about this record…",
    "Notu kaydet": "Save note",
    "Tarih Şeridi": "Historical Record",
    "Zaman": "Historical",
    "Çizelgesi": "Timeline",
    "Miladi tarihi girilmiş kayıtlar burada sıralanır.": "Records with Gregorian dates are listed here.",
    "Doğum": "Birth",
    "Vefat": "Death",
    "Henüz miladi tarihi girilmiş kayıt yok.": "No records with Gregorian dates are available yet.",
    "Nesep ve Akrabalık": "Lineage and Kinship",
    "Bir isim seçin; anne, baba, eş, çocuk ve kardeş bağlarını görün.": "Choose a name to explore parents, spouses, children, and siblings.",
    "Bir şahsiyet seçin…": "Choose a figure…",
    "Ağacını görmek için yukarıdan bir isim seçin.": "Choose a name to view their family tree.",
    "Kayıtlı değil": "Not recorded",
    "Bu bilgi arşive girilmemiş.": "This information has not been added to the archive.",
    "Arşivde ayrı bir kaydı yok.": "No separate archive record is available.",
    "Seçilen şahsiyet": "Selected figure",
    "Çocukları": "Children",
    "Kardeşleri": "Siblings",
    "Diğer akrabalar": "Other relatives",
    "Başka bağlantı kaydı yok": "No other relationships recorded",
    "Tam kaydı arşivde oku →": "Read the full archive record →",
    "Keşfet": "Discover",
    "Rastgele": "Random",
    "Arşivden bilgisi girilmiş bir isim seçilir.": "Discover a randomly selected figure with an archive record.",
    "Tam kaydı oku": "Read full record",
    "Başka bir şahsiyet": "Another figure",
    "Daha az göster ↑": "Show less ↑",
    "Devamını oku →": "Continue reading →",
    "İtikat": "Faith",
    "İlim": "Learning",
    "Siyer": "Sira",
    "Ashab-ı Kiram'ın İzinde": "Following the Companions",
    "Neden Bu İlimleri Öğreniyoruz?": "Why Do We Study These Sciences?",
    "Rasulullah Sevgisi ve Kur'an Eğitimi": "Love of the Messenger and Qur'anic Education",
    "İslam’ın kuvvetli olduğu zamanlarda doğduk. Kuran-ı Kerim'i bize öğretenler oldu. Maalesef ki yeni nesil elimizden kayıp gidiyor...": "We were born when Islamic learning was strong and had teachers who taught us the Qur'an. Yet the new generation is increasingly losing touch with that inheritance...",
    "İslam dini, okuyup ilim sahibi olmaya çok önem vermiştir. Hatta Peygamber Efendimize indirilen ilk ayeti kerime “Oku” emri ile başlar...": "Islam places great importance on reading and gaining knowledge. The first verse revealed to the Prophet begins with the command “Read”...",
    "Resulullah efendimiz bir hadisi şeriflerinde şöyle buyuruyor; \"Evlatlarınızı üç haslet üzerine edeplendiriniz...\"": "The Messenger of Allah teaches in a hadith: “Raise your children upon three qualities...”",
    "Yardım": "Help",
    "Sıkça Sorulan": "Frequently Asked",
    "Sorular": "Questions",
    "Arşivin kullanımı, kaynaklar ve içerik hakkında merak edilenler.": "Answers about using the archive, its sources, and its content.",
    "Sorunuzu bulamadınız mı?": "Could not find your question?",
    "Aklınıza takılan başka bir şey varsa, önerilerinizle ve düzeltme bildirimlerinizle birlikte bize yazabilirsiniz.": "Send us your questions, suggestions, or corrections.",
    "Bize yazın": "Contact us",
    "Hesap": "Account",
    "Hoş geldiniz": "Welcome",
    "Hesabınız": "Your account",
    "Giriş yaptınız.": "You are signed in.",
    "Yönetici hesabı": "Administrator account",
    "Favorilerim ve notlarım": "My favorites and notes",
    "Yönetim paneli": "Admin dashboard",
    "Çıkış yap": "Sign out",
    "Üye ol": "Create account",
    "Giriş yap": "Sign in",
    "E-posta ve şifrenizle hesap oluşturun.": "Create an account with your email and password.",
    "Hesabınızla giriş yapın. Yönetim paneli yalnızca yönetici hesabına açıktır.": "Sign in to your account. The admin dashboard is restricted to administrators.",
    "E-posta": "Email",
    "Şifre": "Password",
    "Şifreyi göster": "Show password",
    "Şifreyi gizle": "Hide password",
    "Göster": "Show",
    "Gizle": "Hide",
    "Şifremi unuttum": "Forgot password",
    "Şifre sıfırlama bağlantısı için e-posta adresinizi yazın.": "Enter your email address to receive a password reset link.",
    "Sıfırlama bağlantısı gönderiliyor…": "Sending reset link…",
    "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.": "A password reset link has been sent to your email address.",
    "Google ile devam et": "Continue with Google",
    "Zaten hesabım var": "I already have an account",
    "Hesabım yok, üye olmak istiyorum": "I need to create an account",
    "Yönetici hesabıyla giriş yaparak arşive kayıt ekleyebilir ve düzenleyebilirsiniz.": "Administrators can sign in to add and edit archive records.",
    "Giriş gerekli": "Sign-in required",
    "Favorilerinizi ve notlarınızı görmek için giriş yapın.": "Sign in to view your favorites and notes.",
    "Favorilerim": "My favorites",
    "Notlarım": "My notes",
    "Kaldır": "Remove",
    "Kayıtta düzenle": "Edit in record",
    "Notu sil": "Delete note",
    "Portal": "Portal",
    "Portalda": "Search the",
    "Şahsiyetler, olaylar, makaleler ve sıkça sorulan sorularda birlikte arayın.": "Search figures, events, articles, and frequently asked questions together.",
    "Bir isim, olay veya kelime yazın…": "Enter a name, event, or keyword…",
    "Portalda ara": "Search the portal",
    "Aramaya başlamak için en az iki harf yazın. Şahsiyetler, olaylar, makaleler ve sıkça sorulan sorular birlikte aranır.": "Enter at least two characters. Figures, events, articles, and FAQs are searched together.",
    "Adınız": "Your name",
    "Konu": "Subject",
    "Mesajınız": "Your message",
    "Mesajı gönder": "Send message",
    "Örn. Soru, Hata bildirimi, Katkı önerisi": "E.g. question, correction, contribution",
    "Yasal": "Legal",
    "Gizlilik": "Privacy",
    "Politikası": "Policy",
    "Son güncelleme: Eylül 2026": "Last updated: September 2026",
    "Referanslar": "References",
    "Kaynakça ve": "Sources &",
    "Temel Eserler": "Core Works",
    "Bilgilerin doğrulanmasında ve derlenmesinde temel alınan başlıca eserler.": "Principal works used to compile and verify the archive.",
    "Gönüllü Proje": "Volunteer Project",
    "Katkıda": "Contribute",
    "Bulun": "to the Archive",
    "Bu arşivi birlikte büyütelim.": "Help us expand this archive.",
    "Nasıl katkı sağlayabilirsiniz?": "How can you contribute?",
    "Bilgi ve belge desteği": "Information and source material",
    "Hata bildirimi": "Report a correction",
    "Akademik inceleme": "Academic review",
    "Sorularınızı, eksik gördüğünüz kayıt, kaynak veya düzeltme önerilerinizi iletebilirsiniz.": "Send questions, missing records, source material, or correction suggestions.",
    "Güncellemeler": "Updates",
    "Sürüm": "Release",
    "Notları": "Notes",
    "Güncel sürüm": "Current version",
    "Yeni tasarım, arama ve hesap özellikleri": "New design, search, and account features",
    "Arşiv ve devirler": "Archive and historical periods",
    "Yönetici alanı": "Administrator area",
    "Siteyi gör": "View site",
    "JSON yedeği indir": "Download JSON backup",
    "Arşiv verilerini JSON olarak indir": "Download archive data as JSON",
    "Yedek için kayıtların yüklenmesini bekleyin": "Wait for all records to load before downloading a backup",
    "Bağlantılı kayıt": "Linked records",
    "Eksik içerik/kaynak": "Missing content/source",
    "Kayıtlarda ara…": "Search records…",
    "Yönetici kayıtlarında ara": "Search admin records",
    "Kayıtları sırala": "Sort records",
    "Ada göre": "By name",
    "Son güncellenen": "Recently updated",
    "Yalnızca eksikler": "Only incomplete",
    "Eksik": "Incomplete",
    "Filtrelerle eşleşen kayıt yok.": "No records match these filters.",
    "Kaydedilmemiş değişiklik": "Unsaved changes",
    "Yazmaya başlayın veya mevcut şahsiyetlerden seçin.": "Start typing or choose an existing figure.",
    "Bu şahsiyet sistemde zaten kayıtlı:": "This figure already exists:",
    "Mevcut kaydı aç": "Open existing record",
    "Düzenle": "Edit",
    "Sil": "Delete",
    "Henüz kayıt yok.": "No records yet.",
    "Yeni şahsiyet": "New figure",
    "Yeni olay": "New event",
    "İsim": "Name",
    "İsmin sonuna (ra) ekle": "Append (ra) to the name",
    "İşaret kaldırılırsa bu şahsiyetin kartı arşivde ve rastgele şahsiyet sayfasında kırmızı gösterilir.": "If unchecked, this figure's card appears red in the archive and on the random figure page.",
    "Yaşadığı devir": "Historical period",
    "Diğer bağlar": "Other relationships",
    "Birden fazla ise virgülle ayırın.": "Separate multiple entries with commas.",
    "Doğum (Hicri)": "Birth (Hijri)",
    "Doğum (Miladi)": "Birth (Gregorian)",
    "Vefat (Hicri)": "Death (Hijri)",
    "Vefat (Miladi)": "Death (Gregorian)",
    "Bilgi": "Details",
    "Metni buraya yazın…": "Write the text here…",
    "Kaynak / sayfa no": "Source / page number",
    "Kaydet": "Save",
    "Temizle": "Clear",
    "Olay başlığı": "Event title",
    "Dönem": "Period",
    "Hicri": "Hijri",
    "Miladi": "Gregorian",
    "Kalın": "Bold",
    "İtalik": "Italic",
    "Altı çizili": "Underline",
    "Madde işaretli liste": "Bulleted list",
    "Numaralı liste": "Numbered list",
    "Başlık": "Heading",
    "Alıntı": "Quote",
    "Bağlantı ekle": "Add link",
    "Görünüm ve dil ayarları": "Appearance and language settings",
    "Dil seçimi": "Language selection",
    "Kişisel çalışma alanı": "Personal workspace",
    "Verilerimi dışa aktar": "Export my data",
    "Hesap özeti": "Account summary",
    "Favoriler": "Favorites",
    "Kaydedilmiş içerik": "Saved content",
    "Kişisel notlar": "Private notes",
    "Size özel not": "Private note",
    "Favori şahsiyet": "Favourite figure",
    "Favori tarihî olay": "Favourite historical event",
    "Arşiv nabzı": "Archive pulse",
    "Kişisel seçkiniz": "Your personal selection",
    "Son hareket": "Latest activity",
    "Arşiv masam": "My archive desk",
    "Favoriler ve notlar": "Favorites and notes",
    "Tüm hareketler": "All activity",
    "Notlar": "Notes",
    "Çalışma alanında ara": "Search workspace",
    "İsim veya not içinde ara…": "Search names or notes…",
    "Kayıt türü": "Record type",
    "Tüm kayıt türleri": "All record types",
    "Eşleşen kayıt bulunamadı": "No matching records",
    "Arama ifadenizi veya filtreleri değiştirin.": "Change your search or filters.",
    "Filtreleri temizle": "Clear filters",
    "Çalışma alanınız hazır": "Your workspace is ready",
    "Arşivi keşfet": "Explore the archive",
    "Okumaya devam edin": "Continue reading",
    "Arşivin farklı görünümlerinden yeni bağlantılar ve tarihî kayıtlar keşfedin.": "Discover new connections and historical records through different archive views.",
    "Arşivde ara": "Search the archive",
    "Zaman çizelgesini aç": "Open the timeline",
    "Soyağacını incele": "Explore genealogy",
    "Rastgele bir şahsiyet": "A random figure",
    "Yalnızca size özel": "Private to you",
    "Notlarınız ve favorileriniz hesabınızla ilişkilidir; diğer ziyaretçilere gösterilmez.": "Your notes and favorites are linked to your account and are not shown to other visitors.",
    "Gizlilik politikasını okuyun →": "Read the privacy policy →",
    "Favori": "Favorite",
    "Kişisel not": "Private note",
    "Notu düzenle": "Edit note",
    "Kaydı aç": "Open record",
    "Favoriden çıkar": "Remove favorite",
    "Okumak veya not eklemek için kaydı açın.": "Open the record to read or add a note.",
    "Bu kayıt arşivden kaldırılmış.": "This record has been removed from the archive.",
    "Arşiv yönetimi": "Archive management",
    "Şahsiyetleri ve tarihî olayları tek merkezden ekleyin, düzenleyin ve denetleyin.": "Add, edit, and review figures and historical events from one place.",
    "Yeni olay ekle": "Add new event",
    "Hızlı kayıt": "Quick entry",
    "Arşive yeni bir içerik ekleyin": "Add new archive content",
    "Olaylar için tarih, dönem, açıklama ve kaynak; şahsiyetler için nesep ve hayat bilgilerini kaydedebilirsiniz.": "Record dates, periods, descriptions, and sources for events; lineage and life details for figures.",
    "Olay ekleme formunu aç": "Open event form",
    "Şahsiyet kayıtları": "Figure records",
    "Olay kayıtları": "Event records",
    "Olay kaydı": "Event record",
    "Olayı zaman çizelgesinde doğru konumlandırmak için en az bir tarih ve doğrulanabilir kaynak ekleyin.": "Add at least one date and a verifiable source to place the event correctly on the timeline.",
    "Zorunlu": "Required",
    "Tarihî dönem": "Historical period",
    "Hicri tarih": "Hijri date",
    "Miladi tarih": "Gregorian date",
    "Eser adı, cilt ve sayfa": "Work, volume, and page",
    "Olayı kaydet": "Save event",
    "Formu temizle": "Clear form",
    "Kişisel çalışma alanı ve hızlı olay ekleme": "Personal workspace and quick event entry"
  };

  Object.assign(EN, {
    "Bu projenin temel amacı nedir?": "What is the main purpose of this project?",
    "Asr-ı Saadet döneminde yaşamış Ashab-ı Kiram'a ait biyografik bilgileri, akrabalık ve sosyal ilişkileri sistemli bir yapıda sunarak tarihsel bilginin daha anlaşılır ve erişilebilir hâle getirilmesini sağlamaktır.": "To present biographical information and family and social relationships of the Companions in a systematic way, making historical knowledge easier to understand and access.",
    "Asr-ı Saadet Portalı hangi ihtiyaca cevap vermektedir?": "What need does the Age of Felicity Portal address?",
    "Ashab-ı Kiram'ın sayıca fazla olması ve bilgilerin farklı kaynaklara dağılmış olması nedeniyle oluşan bilgi karmaşasını gidermeyi amaçlar. Portal, bu bilgileri tek bir dijital platformda toplayarak düzenli ve bütüncül bir yapı sunar.": "It addresses the fragmentation of information about the many Companions across different sources by bringing it together in one structured digital platform.",
    "Proje hangi tarihsel dönemi kapsamaktadır?": "Which historical period does the project cover?",
    "Proje, Asr-ı Saadet olarak adlandırılan ve Peygamber Efendimiz Muhammed Mustafa (s.a.v.)'in yaşadığı dönemi esas alır. Arşivde Hulefâ-yi Râşidîn, Emeviler, Abbasiler ve Endülüs dönemlerine ait kayıtlar da yer alabilir.": "The project centers on the Age of Felicity, the lifetime of Prophet Muhammad (peace be upon him). The archive may also contain records from the periods of the Rightly Guided Caliphs, Umayyads, Abbasids, and Al-Andalus.",
    "Portalda yer alan bilgiler hangi kaynaklara dayanmaktadır?": "What sources are used for the portal's information?",
    "Klasik İslam tarihi eserleri, siyer kaynakları ve güvenilir akademik çalışmalara dayanır. Her kaydın altında, varsa kaynak bilgisi gösterilir.": "It draws on classical works of Islamic history, sira sources, and reliable academic studies. A source is shown beneath each record when available.",
    "Bilgilerin doğruluğu nasıl sağlanmaktadır?": "How is the information verified?",
    "Bilgiler birden fazla güvenilir kaynaktan karşılaştırmalı olarak incelenir. Şüpheli veya kesinlik içermeyen bilgiler akademik yaklaşım gereği dikkatle ele alınır.": "Information is checked comparatively against multiple reliable sources. Uncertain material is handled with appropriate academic caution.",
    "Portal nasıl kullanılmaktadır?": "How do I use the portal?",
    "Arşiv sayfasından şahsiyet ve olayları arayabilir, dönemlere göre süzebilir ve kayıtları açarak okuyabilirsiniz. Soyağacı sayfasında bir isim seçerek anne, baba, eş ve diğer akrabalık bağlarını görebilirsiniz.": "Use the Archive to search people and events, filter by period, and open records. In Genealogy, choose a name to view parents, spouses, and other family connections.",
    "Sahabeler arası akrabalık ve sosyal ilişkiler nasıl gösterilmektedir?": "How are relationships among the Companions shown?",
    "Sistem; nesep bağlarını, evlilikleri ve diğer ilişkileri kayıtlar üzerinden ilişkilendirerek Soyağacı sayfasında gösterir.": "The system connects lineage, marriage, and other relationships across records and presents them in Genealogy.",
    "Portal akademik çalışmalarda kaynak olarak kullanılabilir mi?": "Can the portal be cited in academic work?",
    "Portal doğrudan birincil kaynak olma iddiası taşımaz; ancak araştırmacılar için yardımcı ve yönlendirici bir dijital referans olarak kullanılabilir.": "The portal does not claim to be a primary source, but it may serve as a supporting digital reference for researchers.",
    "Proje kimlere hitap etmektedir?": "Who is the project for?",
    "Öğrencilere, akademisyenlere, araştırmacılara ve İslam tarihiyle ilgilenen herkese.": "Students, academics, researchers, and anyone interested in Islamic history.",
    "İçerik genel kullanıcılar için anlaşılır mıdır?": "Is the content accessible to general readers?",
    "Evet. İçerikler akademik temele dayanmakla birlikte sade ve anlaşılır bir dille hazırlanmıştır.": "Yes. Although grounded in scholarship, the content is written in clear and accessible language.",
    "Portalın gelecekte geliştirilmesi planlanmakta mıdır?": "Will the portal continue to be developed?",
    "Evet. İçeriklerin genişletilmesi, yeni sahabelerin eklenmesi ve görselleştirme araçlarının geliştirilmesi planlanmaktadır.": "Yes. Plans include expanding the content, adding more Companions, and improving visualisation tools.",
    "Portal eğitim amaçlı kullanılabilir mi?": "Can the portal be used for education?",
    "Evet. Portal, eğitim kurumlarında yardımcı bir kaynak olarak kullanılabilecek niteliktedir.": "Yes. It can be used as a supporting resource in educational settings.",
    "Asr-ı Saadet Portalı olarak ziyaretçilerimizin gizliliğine ve kişisel verilerinin güvenliğine önem veriyoruz. Portal, genel kullanıma açık tarihî bilgilerin sunulduğu bir eğitim ve araştırma platformudur. Bu sayfa, hangi bilgilerin hangi amaçla ve nerede tutulduğunu açıklar.": "The Age of Felicity Portal respects visitors' privacy and the security of personal data. It is an educational and research platform presenting historical information to the public. This page explains what information is stored, where it is stored, and why.",
    "Ziyaretiniz sırasında": "During your visit",
    "Arşivi, zaman çizelgesini, soyağacını ve makaleleri okumak için üye olmanız gerekmez. Bu sırada sizi kişisel olarak tanımlayan bir bilgi (ad, adres, telefon vb.) bizim tarafımızdan toplanmaz. Sitede reklam veya izleme amaçlı çerez kullanılmaz.": "You do not need an account to read the archive, timeline, genealogy, or articles. We do not collect information that personally identifies you, such as your name, address, or telephone number. The site does not use advertising or tracking cookies.",
    "İletişim formu": "Contact form",
    "İletişim formunu kullandığınızda yazdığınız ad, e-posta adresi, konu ve mesaj, size dönüş yapabilmemiz için Formspree hizmeti üzerinden bize iletilir. Bu bilgiler üçüncü kişilerle, kurumlarla veya reklam şirketleriyle paylaşılmaz.": "When you use the contact form, your name, email address, subject, and message are sent to us through Formspree so we can reply. This information is not shared with third parties, institutions, or advertising companies.",
    "Üyelik": "Membership",
    "İsterseniz e-posta ve şifrenizle ya da Google hesabınızla üye olabilirsiniz. Bu durumda Google Firebase Authentication hizmeti e-posta adresinizi ve Google ile girdiyseniz adınızı işler. Şifreniz açık metin olarak tutulmaz; Firebase tarafından korunur. Üyelik yalnızca favori ve not özelliklerini kullanmanız içindir.": "You may register with an email and password or a Google account. Google Firebase Authentication then processes your email address and, when using Google, your name. Passwords are not stored as plain text and are protected by Firebase. Membership is only needed for favorites and notes.",
    "Favoriler ve kişisel notlar": "Favorites and private notes",
    "Favori olarak işaretlediğiniz kayıtlar ve yazdığınız kişisel notlar, hesabınızla ilişkilendirilerek Google Firestore veritabanında saklanır. Bunlar yalnızca siz giriş yaptığınızda gösterilir, diğer ziyaretçilere sunulmaz. İstediğiniz zaman Hesabım sayfasından silebilirsiniz.": "Records you favorite and private notes you write are associated with your account and stored in Google Firestore. They are visible only when you sign in and are not shown to other visitors. You can delete them at any time from My Account.",
    "Çerezler ve yerel depolama": "Cookies and local storage",
    "Oturumunuzun açık kalması için Firebase, tarayıcınızın yerel depolama alanına oturum bilgisi yazabilir. Sitemizde reklam veya izleme amaçlı üçüncü taraf çerezi kullanılmaz.": "Firebase may store session information in your browser's local storage to keep you signed in. The site does not use third-party advertising or tracking cookies.",
    "Üçüncü taraf hizmetler": "Third-party services",
    "Sayfalar görüntülenirken tarayıcınız yazı tipleri için Google Fonts'a, görseller için Unsplash'a, veriler ve giriş için Google Firebase'e bağlanır. Bu hizmet sağlayıcılar, IP adresiniz gibi standart bağlantı bilgilerini görebilir. Portal Vercel üzerinde barındırılır; barındırma sağlayıcısı standart sunucu kayıtları tutabilir.": "When pages load, your browser connects to Google Fonts for typefaces, Unsplash for images, and Google Firebase for data and authentication. These providers may receive standard connection details such as your IP address. The portal is hosted on Vercel, which may retain standard server logs.",
    "Yönetici paneli güvenliği": "Administrator security",
    "Veritabanına kayıt ekleme yetkisi bulunan yöneticilerin giriş işlemleri Google Firebase'in güvenlik altyapısı ile korunmaktadır.": "Administrator sign-in and permission to add database records are protected by Google Firebase's security infrastructure.",
    "Haklarınız ve iletişim": "Your rights and contact",
    "Portalda yer alan bilgiler aşağıda sınıflandırılan eserlere dayanır. Kayda özel kaynak bilgisi varsa, kaydın altında “Kaynak” satırında ayrıca gösterilir.": "Portal content is based on the works grouped here. When a record has a specific citation, it is also shown on that record's Source line.",
    "Eksik gördüğünüz bir kaynağı": "If a source is missing, use",
    "sayfasından bize iletebilirsiniz.": "to let us know.",
    "Asr-ı Saadet Portalı, İslam tarihini, Ashab-ı Kiram'ın hayatlarını ve bu döneme ait kıymetli bilgileri dijital ortamda herkes için erişilebilir kılmayı amaçlayan gönüllü bir projedir. Arşivi büyütmek ve daha kapsamlı hâle getirmek için desteğinize her zaman açığız.": "The Age of Felicity Portal is a volunteer project making Islamic history, the lives of the Companions, and knowledge of their era digitally accessible to everyone. Contributions that broaden and strengthen the archive are welcome.",
    "Arşivimizde eksik olduğunu düşündüğünüz tarihî şahsiyetler, soyağacı bilgileri veya önemli olaylar hakkında kaynak belirterek bize bilgi gönderebilirsiniz.": "Send sourced information about historical figures, genealogy, or important events that may be missing from the archive.",
    "Portalımızda karşılaştığınız yazım hatalarını, tarihsel uyuşmazlıkları veya teknik sorunları bize bildirerek sistemin kusursuzlaşmasına yardımcı olabilirsiniz.": "Report typographical errors, historical inconsistencies, or technical problems to help improve the portal.",
    "Tarih alanında akademik çalışmalar yürütüyorsanız, mevcut verilerimizin doğruluğunu teyit etme konusunda gönüllü danışmanımız olabilirsiniz.": "If you conduct academic research in history, you can volunteer to help review and verify our existing data.",
    "Katkılarınız, bu dijital mirasın gelecek nesillere aktarılmasında büyük bir rol oynayacaktır.": "Your contributions help preserve this digital heritage for future generations."
  });

  const NORMALIZED_EN = Object.keys(EN).reduce(function (map, key) {
    map[key.replace(/\s+/g, " ").trim()] = EN[key];
    return map;
  }, {});
  const ATTRIBUTE_NAMES = ["placeholder", "aria-label", "title", "alt"];
  const SKIP_SELECTOR = "script, style, noscript, [data-no-translate], [contenteditable='true']";

  function translatePhrase(value) {
    if (typeof value !== "string" || !value) return value;
    const leading = (value.match(/^\s*/) || [""])[0];
    const trailing = (value.match(/\s*$/) || [""])[0];
    const core = value.trim();
    const normalized = core.replace(/\s+/g, " ");
    let translated = NORMALIZED_EN[normalized];
    if (!translated && core.includes(" | ")) {
      const parts = core.split(" | ");
      const mapped = parts.map(function (part) { return NORMALIZED_EN[part] || part; });
      if (mapped.some(function (part, index) { return part !== parts[index]; })) translated = mapped.join(" | ");
    }
    if (!translated) {
      translated = core
        .replace(/^Daha fazla göster \((\d+)\)$/u, "Show more ($1)")
        .replace(/^(\d+) sonuç$/u, "$1 results")
        .replace(/^(\d+) kayıt$/u, "$1 records")
        .replace(/^Şahsiyetler \((\d+)\)$/u, "Figures ($1)")
        .replace(/^Olaylar \((\d+)\)$/u, "Events ($1)")
        .replace(/^Makaleler \((\d+)\)$/u, "Articles ($1)")
        .replace(/^Sıkça Sorulan Sorular \((\d+)\)$/u, "Frequently Asked Questions ($1)")
        .replace(/^Favorilerim \((\d+)\)$/u, "My favorites ($1)")
        .replace(/^Notlarım \((\d+)\)$/u, "My notes ($1)")
        .replace(/^(\d+) öğe gösteriliyor$/u, "$1 items shown")
        .replace(/^Hoş geldiniz, (.+)$/u, "Welcome, $1")
        .replace(/^Üyelik: (.+)$/u, "Member since: $1")
        .replace(/^(\d+) arşiv kaydından (\d+) tanesini favorilerinize eklediniz\.$/u, "You have added $2 of $1 archive records to your favorites.")
        .replace(/^Güncel sürüm:/u, "Current version:")
        .replace(/^Doğum:/u, "Birth:")
        .replace(/^Vefat:/u, "Death:")
        .replace(/^Anne:/u, "Mother:")
        .replace(/^Baba:/u, "Father:")
        .replace(/^Kaynak:/u, "Source:")
        .replace(/ · Doğum$/u, " · Birth")
        .replace(/ · Olay$/u, " · Event")
        .replace(/★ Favorilerde/gu, "★ In favorites")
        .replace(/☆ Favorilere ekle/gu, "☆ Add to favorites")
        .replace(/Tüm hakları saklıdır/gu, "All rights reserved");
      const range = core.match(/^M\. (\d+) – M\. (\d+) arasında (\d+) kayıt\.$/u);
      if (range) translated = `${range[3]} records from CE ${range[1]} to CE ${range[2]}.`;
      const missing = core.match(/^“(.+)” için sonuç bulunamadı\. Farklı bir yazım deneyin\.$/u);
      if (missing) translated = `No results for “${missing[1]}”. Try a different spelling.`;
      if (translated === core) translated = null;
    }
    return translated ? leading + translated + trailing : value;
  }

  function mayTranslate(node) {
    const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return !!parent && !parent.closest(SKIP_SELECTOR);
  }

  function translateTextNode(node) {
    if (!mayTranslate(node) || !node.nodeValue || !node.nodeValue.trim()) return;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const original = originalText.get(node);
    node.nodeValue = language === "en" ? translatePhrase(original) : original;
  }

  function translateAttributes(element) {
    if (!mayTranslate(element) || element.closest(".preference-controls")) return;
    let originals = originalAttributes.get(element);
    if (!originals) { originals = {}; originalAttributes.set(element, originals); }
    ATTRIBUTE_NAMES.forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      if (!(name in originals)) originals[name] = element.getAttribute(name);
      element.setAttribute(name, language === "en" ? translatePhrase(originals[name]) : originals[name]);
    });
  }

  function translateTree(container) {
    if (!container) return;
    if (container.nodeType === Node.TEXT_NODE) { translateTextNode(container); return; }
    if (container.nodeType !== Node.ELEMENT_NODE && container.nodeType !== Node.DOCUMENT_NODE) return;
    if (container.nodeType === Node.ELEMENT_NODE) translateAttributes(container);
    const elements = container.querySelectorAll ? container.querySelectorAll("*") : [];
    elements.forEach(translateAttributes);
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateTextNode(node);
  }

  function updateThemeButton() {
    const button = document.querySelector(".theme-toggle");
    if (!button) return;
    const dark = root.dataset.theme === "dark";
    const label = language === "en"
      ? (dark ? "Switch to day mode" : "Switch to night mode")
      : (dark ? "Gündüz moduna geç" : "Gece moduna geç");
    button.setAttribute("aria-pressed", String(dark));
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function updateControls() {
    document.querySelectorAll("[data-language]").forEach(function (button) {
      const active = button.dataset.language === language;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("active", active);
    });
    const preferenceGroup = document.querySelector(".preference-controls");
    const languageGroup = document.querySelector(".language-switch");
    if (preferenceGroup) preferenceGroup.setAttribute("aria-label", language === "en" ? "Appearance and language settings" : "Görünüm ve dil ayarları");
    if (languageGroup) languageGroup.setAttribute("aria-label", language === "en" ? "Language selection" : "Dil seçimi");
    updateThemeButton();
  }

  function speak(message) {
    let status = document.getElementById("preference-status");
    if (!status) {
      status = document.createElement("p");
      status.id = "preference-status";
      status.className = "sr-only";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      document.body.appendChild(status);
    }
    status.textContent = "";
    requestAnimationFrame(function () { status.textContent = message; });
  }

  function applyLanguage(nextLanguage, announce) {
    language = nextLanguage === "en" ? "en" : "tr";
    root.lang = language;
    try { localStorage.setItem(STORAGE.language, language); } catch (e) { /* Storage may be blocked. */ }
    translating = true;
    observer.disconnect();
    translateTree(document);
    updateControls();
    observer.observe(root, { childList: true, characterData: true, subtree: true });
    translating = false;
    window.dispatchEvent(new CustomEvent("portal:languagechange", { detail: { language } }));
    if (announce) speak(language === "en" ? "Language changed to English." : "Dil Türkçe olarak değiştirildi.");
  }

  function applyTheme(nextTheme, announce) {
    const theme = nextTheme === "dark" ? "dark" : "light";
    root.dataset.theme = theme;
    try { localStorage.setItem(STORAGE.theme, theme); } catch (e) { /* Storage may be blocked. */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#091713" : "#f3efe5";
    updateThemeButton();
    window.dispatchEvent(new CustomEvent("portal:themechange", { detail: { theme } }));
    if (announce) speak(language === "en"
      ? (theme === "dark" ? "Night mode enabled." : "Day mode enabled.")
      : (theme === "dark" ? "Gece modu açıldı." : "Gündüz modu açıldı."));
  }

  const observer = new MutationObserver(function (mutations) {
    if (translating) return;
    observer.disconnect();
    mutations.forEach(function (mutation) {
      if (mutation.type === "characterData") originalText.delete(mutation.target);
      mutation.addedNodes.forEach(function (node) { translateTree(node); });
      if (mutation.type === "characterData") translateTextNode(mutation.target);
    });
    updateControls();
    observer.observe(root, { childList: true, characterData: true, subtree: true });
  });

  function initialise() {
    document.addEventListener("click", function (event) {
      const languageButton = event.target.closest("[data-language]");
      if (languageButton) { applyLanguage(languageButton.dataset.language, true); return; }
      if (event.target.closest(".theme-toggle")) applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
    observer.observe(root, { childList: true, characterData: true, subtree: true });
    applyTheme(root.dataset.theme, false);
    applyLanguage(language, false);
    try {
      if (!localStorage.getItem(STORAGE.theme) && window.matchMedia) {
        const query = window.matchMedia("(prefers-color-scheme: dark)");
        if (query.addEventListener) query.addEventListener("change", function (event) {
          applyTheme(event.matches ? "dark" : "light", false);
        });
      }
    } catch (e) { /* Storage may be blocked. */ }
  }

  window.portalPreferences = { applyLanguage, applyTheme };
  initialise();
}());
