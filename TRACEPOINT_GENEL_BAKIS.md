# Tracepoint: Genel Bakış

*Hackathon, challenge, ürün manifestosu ve çözüm. Claude'a (veya projeye yeni katılan birine) bağlam vermek için hazırlandı. Kaynak: `alpgi1/tracepoint` reposunun `main` dalı (PR #39'a kadar). Ayrıntılar için en sondaki "Nereden okunur" bölümüne bakın.*

---

## 1. Tek cümlede

**Tracepoint, bir BMW ürün yöneticisinin (PM) müşteri geri bildiriminden izlenebilir ve onaylı ürün gereksinimlerine ulaşmasını sağlayan, yapay zekâ destekli bir hackathon prototipidir.**

---

## 2. Hackathon hakkında bildiklerimiz

- Proje, **BMW'nin düzenlediği bir hackathon'daki bir challenge** için geliştirildi. Repo kendini "BMW'nin sağladığı örnek veriler üzerine kurulmuş bir hackathon prototipi; resmî bir BMW ürünü değildir" diye tanımlıyor.
- Etkinlikte **BMW mentorları**, bir **jüri** ve bir **demo day** var. Ekip, jürinin değerlendirmede "kanıttan insan kararına giden yolu" puanlayacağını varsayarak tasarım yaptı.
- BMW, katılımcılara **gerçek müşteri verisinden derlenmiş örnek bir veri seti** ve bir **challenge brief'i** verdi. Brief'te bir "THE PROCESS" slaytı ve dört teslimat (D1–D4) tanımlı.
- Geliştirme Ekim 2026'da yapıldı (adım raporları 10–11 Ekim 2026 tarihli). Kodun ve dokümantasyonun büyük kısmı ekibin yönlendirmesiyle Claude tarafından yazıldı. Her adım bir rapor ve bir pull request ile kayıt altına alındı.
- **Bilinmeyenler:** Hackathon'un adı, tarihi, yeri, süresi, resmî değerlendirme kriterleri ve jüri bilgisi repoda yok. Asıl brief dosyası da repoda değil; challenge'ı ekibin özetinden biliyoruz (`reports/step-01-challenge-and-data-analysis.md`).

---

## 3. Challenge

### 3.1 Görev
Heterojen girdileri işleyen bir AI uygulaması kurmak. Girdiler: BMW müşteri yorumları (verbatim'ler), müşteri çalışmaları, satış hacimleri, donanım ve opsiyon listeleri, ayrıca web'den yapılandırılmış bilgi. Uygulama şunları yapmalı:

1. **Sinyal çıkarmak:** tekrar eden şikâyetler, karşılanmamış ihtiyaçlar, rakip avantajları, pazar trendleri. Her sinyal kaynağına bağlı olmalı.
2. **Gereksinim türetmek:** net, uygulanabilir, müşteriye dönük ve gerçekçi ürün gereksinimleri.
3. **Önceliklendirmek:** açıklanabilir bir mantıkla.
4. **PM'i döngüde tutmak:** PM önerileri onaylar, reddeder, düzenler veya itiraz eder; her karar gerekçe ve kanıtla birlikte verilir.
5. **Tam bir denetim izi (audit trail) tutmak:** kronolojik olarak, kim, ne zaman, neden.

Bu en az bir türev araç ve bir pazar için gösterilmeli, ama başka BMW araçlarına ve pazarlarına uyarlanabilir olmalı.

### 3.2 Kapsam
- **Kapsam içi:** üründen beklenen müşteri gereksinimleri. Donanım, konfor, iç mekân, bilgi-eğlence ve dijital servisler, tasarım ve kalite algısı, sürüş deneyimi, *müşterinin deneyimlediği haliyle* menzil ve şarj, varyant ve paket sunumu.
- **Kapsam dışı:** regülasyon ve homologasyon, mühendislik spesifikasyonu, fiyat, business case, maliyet hesabı. **Maliyet veya efor sadece kaba bir önceliklendirme faktörü olarak** kullanılabilir.

### 3.3 Teslimatlar
| Kod | Teslimat |
|---|---|
| D1 | Konsept ve gösterilebilir prototip: girdiler → gereksinimler → önceliklendirme → insan incelemesi |
| D2 | Yapılandırılmış örnek gereksinim listesi. Her satırda ID, açıklama, bağlı bulgular ve kaynaklar, öncelik veya skor, önceliklendirme gerekçesi, kanıt seviyesi, geleceğe dönük varsayımlar ve belirsizlikler, karar durumu |
| D3 | Uçtan uca iş akışı: AI'ın neyi kendi başına yaptığı, insan onayının nerede zorunlu olduğu |
| D4 | Gösterilebilir audit trail: her gereksinim kaynaktan karara kadar izlenebilir, her değişiklik kim/ne, ne zaman ve neden bilgisiyle kayıtlı |

### 3.4 BMW'nin süreç slaytı
Durum analizi (önceki model, portföy, satış, rakipler, müşteri geri bildirimi, trendler) → yapılandırma ve bağlam (sınıflandırma, kümeleme, mükerrerleri ayıklama, her potansiyel gereksinim için 0/1 "uygulansın mı?" kararı) → gereksinim tanımı (ölçülebilir hedefler, kabul kriterleri) → önceliklendirme (müşteri ve iş bakışı) → dokümantasyon (sürekli takip).

### 3.5 Verilen veri
| Dosya | İçerik |
|---|---|
| `F70/G60/G70_feedback_hackathon.xlsx` | Müşteri yorumları; BMW'nin VFC taksonomisiyle kısmen etiketli. F70 yaklaşık 2.100, G60 ve G70 yaklaşık 4.000'er benzersiz yorum |
| `F70_G60_G68_G70_customer_studies.xlsx` | Müşteri çalışmaları: CN/EU ortalamaları (1–10), US dağılımları (1–7) |
| `sales_volumes.xlsx` | Pazar bazında 2024 ve 2025 satışları, 2030 tahmini |
| `*_OptionList.PDF` | Almanca fiyat listeleri: varyantlar, donanımın standart/opsiyon durumu, teknik veriler |
| `BMW-Group-Report-2025-en.pdf` | BMW Group yıllık raporu (434 sayfa) |

Araçlar: **F70** (1 Serisi), **G60** (5 Serisi Sedan), **G68** (5 Serisi uzun şasi, sadece Çin), **G70** (7 Serisi). Pazarlar: Avrupa, ABD, Çin, Dünyanın geri kalanı. Ekip buna sonradan iki dış kaynak listesi ekledi: `docs/trend_sources.md` ve `docs/external_sources_v2.json`.

---

## 4. Ürün manifestosu

**Misyon:** Bir aracın ürün kararlarını besleyen dağınık kanıtları (binlerce serbest metin yorum, çalışma skorları, satışlar, kataloglar, trendler, rakipler) tek bir yerde toplamak. Bu kanıtlardan **kaynağına kadar izlenebilir** gereksinimler üretmek. Karar yetkisini **PM'de** bırakmak.

Ürünün cevap vermek istediği üç soru:
1. *Bu pazardaki müşteriler gerçekte neden ve ne sıklıkla şikâyet ediyor?*
2. *Hangi değişiklik bunu düzeltir ve mühendislik eforu ne olur?*
3. *Kim, neye dayanarak, ne zaman, ne karar verdi?*

**İlkeler:**
1. **Önce kanıt.** Kaynağına (dosya, sayfa, satır, URL) dönen bir locator'ı olmayan hiçbir şey bulgu veya gereksinim olamaz.
2. **AI önerir, PM karar verir.** Agent'lar sınıflandırır, analiz eder ve önerir. Her gereksinim yine de G2 kapısında açık bir *Onay / Ret / Erteleme* kararı ister.
3. **Tekrarlanabilirlik.** Skor ve efor hesapları, saklanan kanıtın ve konfigürasyonun saf fonksiyonudur. Aynı girdi her zaman aynı sonucu verir; AI sayı uydurmaz.
4. **Görünür gerekçe.** Hiçbir sönümleme ya da artırma sessizce yapılmaz. Örneğin 1 Serisi'nde lüks bir özellik isteği daha düşük ağırlık alırsa, PM bunun nedenini görür.
5. **Konfigürasyon, kod değil.** Yeni bir araç veya pazar eklemek konfigürasyon değişikliğidir. Veritabanı türetilmiş bir çıktıdır; kalıcı her şey `config/` ve `docs/` altında dosya olarak durur.
6. **Kanonik taksonomi.** BMW'nin VFC taksonomisi temel yapıdır. LLM sadece boşlukları doldurur.
7. **Dürüstlük.** Varsayım "varsayım" olarak etiketlenir. Belirsizlik tek bir sayı yerine aralık olarak gösterilir. Çelişen kanıt gizlenmez.

---

## 5. Çözüm

### 5.1 Akış
```
docs/ (ham girdiler) + config/ (yazılmış eşlemeler, gereksinimler, efor modeli, kararlar)
        │
        ▼
1. Ingest              → PostgreSQL kanıt deposu, her satırda bir locator
2. Sınıflandırma       → etiketsiz yorumlara LLM ile VFC etiketi, kör doğrulama
3. Bulgular            → deterministik: şikâyet, istek, güçlü yön, çalışma skoru, katalog boşluğu; kanıt seviyesi A–D
4. Gereksinimler       → versiyonlu; bulgulara ve kanıta bağlı; H1/H2 ufku; pazar bazında kabul kriteri
5. CPM efor motoru     → "yeni bir aracın yüzde kaçı", P5–P95 aralığı, etkilenen alt sistemler
6. Analist agent'lar   → araç × pazar ve seri × bölge durum analizleri, PM'in dilinde brief'ler
7. G2 kapısı + audit   → onay / ret / erteleme; her olay kayıtlı
        │
        ▼
FastAPI okuma API'si (:8000)  →  Next.js PM çalışma alanı (:3400)
```

### 5.2 Kanıt katmanları
Müşteri sesi (verbatim'ler) · metrikler (çalışmalar) · bölgesel talep (satışlar) · rakip ve dış kanıt · portföy ve sunum (kataloglar, Group Report) · trendler. Her katmanın önceliğe katkısı ayrı ve açıklamalı olarak gösterilir.

### 5.3 Ayırt edici unsur: CPM efor motoru
Challenge eforu sadece kaba bir faktör olarak kabul ediyor ve fiyatı kapsam dışı tutuyor. Bu yüzden efor **para olarak değil, yeni bir araç neslinin geliştirme eforunun yüzdesi olarak** hesaplanır.

- **Yöntem:** Cambridge'in hakemli *Change Prediction Method*'u (Clarkson, Simons, Eckert 2004).
- **Model:** Araç 12 alt sisteme bölünür (gövde, şasi, powertrain, HV batarya, termal, E/E, yazılım/HMI, iç mekân, koltuklar, dış tasarım, boya, şarj). Her alt sistemin bir ağırlığı vardır. Alt sistemler arasındaki bağlar olasılık ve etki değerleriyle tanımlanır. Bir değişiklik bu bağlar üzerinden en fazla 3 adım yayılır.
- **Karar eşikleri:** %15'in altı → mevcut aracı uyarla (LCI/opsiyon). %15–50 → büyük revizyon. %50'nin üstü veya platform değişikliği (K3) → yeni nesil.
- **Doğrulama:** Model, kamuya açık 8 BMW kararıyla back-test ediliyor ve 8'ini de doğru sınıflandırıyor. Örnekler: G30 makyajı, i4'ün menzil güncellemesi, Çin'e özel uzun şasi G68, Gen6/800V bataryanın ancak halef modelde gelmesi. Tüm girdiler ±%50 oynatıldığında kararlar korunuyor.
- **İçgörü:** Gereksinimler tek tek küçük çıkabilir, ama hepsi aynı makyaja konduğunda paket "büyük revizyon" seviyesine çıkabilir. Değişiklik saymak bunu göstermez.

### 5.4 Agent'lar
- **Gereksinim agent'ı:** potansiyel gereksinimleri 0/1 önerisi, ufku ve kabul kriterleriyle birlikte yazar.
- **Analist:** sadece okur. Araç × pazar veya ülke için durum analizi, seri × bölge karşılaştırması ve PM'in dilinde brief'ler üretir. Her alıntı ve referans doğrulanır.
- Agent'lar efor rakamı yazmaz. Sadece değişiklik profili önerir; rakamı motor hesaplar.
- Tüm araç çağrıları audit'e yazılır.

### 5.5 PM çalışma alanı (web arayüzü)
Noktalı dünya haritasından bir pazar ve bir araç seçilir, ardından beş aşamadan geçilir:

| Aşama | İçerik |
|---|---|
| 1. Araç | Aracın teknik çizimi ve 12 CPM alt sistemi. Her alt sistemde müşterinin beğendikleri ve eleştirdikleri, pazar kanıtı ve ilgili gereksinimler |
| 2. Yapı ve bağlam | Analistin brief'i ve tüm potansiyel gereksinimler; agent önerisi ve efor bilgisiyle |
| 3. Gereksinimler | Tek bir gereksinim: kabul kriterleri, kanıt (yorumlar yazıldığı gibi), varsayımlar, efor, geçmiş ve G2 kararı |
| 4. Önceliklendirme | Müşteri kanıtı ile efor yan yana, H1/H2/hepsi paketleri, paket oluşturucu, CPM yöntem sayfası |
| 5. Dokümantasyon | Karar kaydı, audit trail, gereksinim listesinin CSV ve Markdown dışa aktarımı |

Backend çalışıyorsa arayüz **canlı modda** çalışır ve kararlar gerçekten kaydedilir. Çalışmıyorsa commit'lenmiş bir anlık görüntü gösterilir ve karar düğmeleri kapalı olur. Ayrıca GitHub Pages için statik bir showcase build'i var (`dist/`).

### 5.6 İnsan kontrol noktaları
G1: bulgu seti · **G2: her gereksinim (zorunlu)** · G3: ağırlık profili ve öncelikler · G4: listenin yayınlanması. "İtiraz" (challenge): PM bir kanıtı veya gerekçeyi sorgular; AI kayıtlı bir yeniden analizle, kanıtıyla birlikte cevap verir.

---

## 6. Kapsam ve rakamlar (yaklaşık, step 19 itibarıyla)

| | |
|---|---|
| Araç × pazar | F70/EU · G60/EU, US · G68/CN · G70/EU, US, CN |
| Gereksinimler | 57 adet (G60 US 20, G70 US 19, F70 EU 18) |
| Bulgular | 763 bulgu, 232 bağlantı |
| LLM gap etiketleri | 4.433 (commit'li; API anahtarı olmadan da yeniden uygulanır) |
| Group Report | 434 sayfa, aranabilir |
| Dış kanıt | 124 kaynak, 143 iddia; kapsam kararı her biri için dosyada |
| CPM back-test | 8/8 |
| Testler | Backend yaklaşık 100, frontend yaklaşık 60 |

---

## 7. Teknik yapı (kısaca)

- **Backend:** Python 3.12, PostgreSQL 16, SQLAlchemy, FastAPI, Typer CLI. Sağlayıcıdan bağımsız LLM gateway (önce OpenAI; maliyet limiti ve önbellekle). pytest ve ruff.
- **Frontend:** Next.js 16, TypeScript, Tailwind v4, shadcn. Ekranda gördüğünüz her rakam backend'den gelir; frontend kendi rakamını üretmez.
- **Çalıştırma:** `./start.sh` tek komutla her şeyi kurar ve çalıştırır (Docker'da Postgres, ingest, bulgular, raporlar, testler). LLM adımları dışında her şey API anahtarı olmadan çalışır.

---

## 8. Dürüst sınırlar

- Gereksinimler şu an sadece üç kapsam için yazılmış (G60 US, G70 US, F70 EU). Diğer kapsamlarda bazı aşamalar boş.
- CPM ağırlıkları ve bağ değerleri kalibre edilmemiş varsayımlar. Model BMW'nin gerçek mühendislik değişiklik geçmişiyle kalibre edilebilir.
- Hedef değerlerin çoğu "varsayım" olarak etiketli ve mühendislik doğrulaması gerektiriyor.
- Katalog verisi Almanca fiyat listesine dayanıyor; ABD ve Çin standart donanım ifadeleri bu yüzden belirsiz.
- G68 için müşteri yorumu yok, sadece Çin çalışma ortalamaları var. F70, Çin ve ABD'de satılmıyor.
- LLM adımları için OpenAI anahtarı gerekiyor; bu adımların sonuçları repoda dosya olarak duruyor.

---

## 9. Claude ile çalışırken bilinmesi gerekenler

- Repoda her şey İngilizce. Her adım `reports/step-NN-*.md` olarak raporlanıyor, kararlar `plan/decisions.md` dosyasına D-xxx numarasıyla yazılıyor.
- Kalıcı olan her şey `config/` altında dosya olarak duruyor. Veritabanı her zaman yeniden üretilebilir (`./start.sh --reset`).
- Kanıt referansları sabit dizgilerdir: `verbatim:G60-0123`, `metric:...`, `equipment:EQ-F70-0112`, `document:DOC-GROUP-REPORT-0079`.
- Frontend teslimatlarından önce `frontend/docs/02-forbidden-list.md` kontrol ediliyor.

---

## 10. Nereden okunur

| Belge | İçerik |
|---|---|
| `README.md` | Ürünün güncel özeti, ekranlar, kurulum |
| `reports/step-01-challenge-and-data-analysis.md` | Challenge özeti, kapsam, teslimatlar, veri envanteri |
| `plan/00-master-plan.md` | Vizyon, ilkeler, mimari, fazlar |
| `plan/06-pm-workspace-ux-spec.md` | Ekranlar ve demo senaryosu |
| `plan/decisions.md` | Tüm kararlar |
| `reports/step-12/15/16-*` | CPM efor motoru ve analize entegrasyonu |
| `reports/step-14`, `step-18` | Analist agent'ı ve seri analizi |
| `reports/step-19-backend-frontend-integration.md` | Sistemin bütünleşik son hali |
| `backend/README.md`, `frontend/README.md` | Komutlar ve API uçları |
