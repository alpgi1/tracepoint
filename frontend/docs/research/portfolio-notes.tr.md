# Portfolyo (alpgiraycelik.me) ön-uç araştırma notları

Kaynak repo: `/home/user/portfolio` (salt okunur incelendi, hiçbir dosya değiştirilmedi). Okunan dosyalar: `CLAUDE.md`, `README.md`, `docs/01-arastirma-2026-09.md` (1.357 satır, tamamı), `docs/02-yasakli-liste.md` (tamamı), `docs/03-plan-taslak.md`, `docs/05-oturum-devir.md`, `docs/06-yayin.md`, `docs/gorseller/site/README.md`, `assets/video-src/README.md`, `tools/arastirma/README.md`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/fonts.ts`, `app/not-found.tsx`, `app/work/[slug]/page.tsx`, `content/site.ts`, `lib/og.tsx`, `lib/motion/*`, `components/` altındaki bütün bileşenler (home, scenes, motion, site, media, projects), `tools/olcum/*`, `tools/fonts/build.py`, `tools/media/build.py`, `tools/map/build.py`, `package.json`, git geçmişi.

Not: iç dokümanlar Türkçe, ürün arayüzü İngilizce; bu notta ürün metinleri olduğu gibi (İngilizce) bırakıldı.

---

## 1. Süreç: portfolyo nasıl planlandı ve adım adım nasıl kuruldu

### 1.1 Başlangıç ve sıra (2026-09-26)

Kullanıcının isteği: portfolyoyu "tamamen baştan, çok daha çekici" yapmak; "ödül alabilecek seviyede animasyonlu, geçişli, çekici; uygulamalarımı ve portfolyomu çekici şekilde gösteren"; "tasarım açısından mükemmellik, maliyetin önemi yok". Kullanıcının verdiği referanslar: muz.li 2025 "top 100 portfolio", Awwwards Sites of the Year, landonorris.com ("inanılmaz iyi").

Belirlenen sıra: (1) kardeş repo REGU'daki tasarım bulguları, (2) 2025–26 ödüllü siteler ve portfolyolar, kare kare fotoğraf ve video, (3) 21st.dev saha araştırması, (4) plan. Plan öncesi "şu siteyi kopyalayabiliriz" sorusu kullanıcıya soruldu. Kod yazılmadan önce üç doküman çıktı: R1 araştırma (`docs/01`, ~106 KB), yasaklı liste (`docs/02`), plan taslağı (`docs/03`); kullanıcı plandaki bütün önerileri tek seferde kabul etti ("plan konusunda dediklerine katılıyorum başlayabilirsin") ve adımlar S1'den başladı.

### 1.2 Araştırma yöntemi (R1)

- REGU R13 ile aynı yöntem ve aynı betik (`tools/arastirma/site-yakala.mjs`, REGU'dan kopyalandı): Playwright + `/opt/pw-browsers/chromium`, yazılımsal WebGL (SwiftShader). Çekimler 1440×900 ve 390×844.
- Her site için dosyalar: `<site>-01-hero.jpg` (yüklemeden ~5 sn sonra), `-02-hero-film.jpg` (ilk ~5 saniyenin 8 karesi: giriş animasyonu, shader hareketi), `-06-scroll-film.jpg` (**sürekli yavaş kaydırma** sırasında 10–20 kare; kaydırmayla tetiklenen animasyonlar oynarken; "esas kanıt", kullanıcının istediği "video" karşılığı; projede bu dosyaya "kaydırma filmi" deniyor), `-05-mobile.jpg` (390 px kahraman + tam sayfa), `-tech.json` (ölçülen envanter: kütüphaneler, canvas/video sayısı, fontlar, h1 ölçüsü, zemin, CTA, bölüm sayısı, sayfa yüksekliği, mobil taşma).
- İki mod: tam (8 kahraman + 20 film + 14 tur + tam sayfa + mobil) ve hafif (`site-yakala-hafif.mjs`: 4 + 10 + mobil). Ağır WebGL siteler tam modda 600 s'de bitmedi (Lando, Léo Parpeix); ilk 11 siteden sonra hafif moda geçildi; Lando ayrıca 1.800 s zaman aşımıyla tek başına çekildi.
- Yedi site için ~40 s yavaş kaydırma **videosu** (`video-yakala.mjs`, Playwright `recordVideo`): `docs/gorseller/video/*.webm` (Lando Norris, bleibtgleich, Wodniack, Nothin', Elliott Mangham, Artiom Yakushev, bugünkü site; 7 dosya ~13 MB).
- Görseller: `docs/gorseller/siteler/` 196 jpg (≤ 1400 px, q60), `docs/gorseller/21st/` 35 kontak sayfası, `docs/gorseller/lando/` 3 OFF+BRAND vaka görseli, `docs/gorseller/site/` 8 teslim görseli (kahraman 3D 1440, açılış tam sayfa 1440 ve 390, REGU proje sayfası, 13 karelik kaydırma filmi `kaydirma-filmi-1440.jpg`, iki OG görseli).
- Toplu çekim 68 sitede ~2,5 saat sürdü (3 paralel, hafif mod, 480 s zaman aşımı); 8 site zaman aşımına düştü, kısmi kareleri kullanıldı. `hepsi-hafif.sh` bitenleri atlar.
- Sınırlar (dokümanda "dürüstçe" başlığıyla): yazılımsal WebGL kareler **var/yok** için güvenilir, **akıcılık için değil** (ağır 3D'de kare başına 30–60 s); kapılı siteler ölçülemedi; içerik görünmüyorsa önce `requestfailed` olaylarına bakıldı; Awwwards sayfaları `curl` ile açılmıyor (bağlantı sıfırlanıyor), puanlar WebFetch ile okundu; 21st.dev kodu çekilmedi (her çekim kullanım hakkı), yalnız önizleme ve açıklama.

### 1.3 REGU'dan devralınanlar (R1 §1)

1. Yöntem: kare kare kanıt, ölçülmüş envanter, "tahmin ≠ ölçüm" (R13'te ajan tahminlerinin ikisi yanlış çıkmıştı).
2. Yasaklı liste (K75): dürüstlük (§1) ve metin (§2) maddeleri aynen; görsel (§3) ve hareket (§5) maddeleri portfolyo için yazılı muafiyetlerle gevşetildi (§7b).
3. R13 §4 örüntüleri (pahalı görünen siteler neyi paylaşıyor): tek görsel fikir, ürün kahramanda, üç sesli tipografi, anlam taşıyan hareket, bölüm ritmi, gezinme + büyük alt bilgi, ayrıntı özeni, hafiflik; portfolyolar için yeniden sayıldı, sekizi de tutuyor.
4. Uygulanmış yöntemler (kod REGU'da, buraya yeniden yazıldı): `manifesto.tsx` kelime maskesi (sunucuda kelime bölme, `IntersectionObserver`, reduced-motion'da `pending`e geçmeme), `sticky-steps.tsx` (native sticky + gözlemci, GSAP'siz), `reveal.tsx` (idle/pending/in; hiçbir içerik sekans arkasında beklemez), kanıt şeridi (sayılar veriden), cam hap gezinme ve dev wordmark alt bilgi, ölçüm araçları (`sayfa-denetimi.mjs`, `uctan-uca.mjs`, kare kare kontrast).
5. Kararlar: `h-screen` yasak (`min-h-[100dvh]`), 44 px dokunma hedefi ölçerek, `focus-visible`, renkle taşınan bilgiye metin, koyu tema anahtarı yok (K89: iki tema iki ölçüm), Instrument Serif vurgusu **alınmadı** (taste-skill "AI tell").
6. 21st.dev dersi (K91): hazır bileşen önce render edilip ölçülür, sonra yöntem alınır, token'larla yeniden yazılır.

Alınmayanlar: REGU'nun açık gövde/mavi kararı (ürün kararıydı; palet yeniden seçildi); REGU'da Lenis ve özel imleç ret (K85) ama burada M3/M4 muafiyet adayı, çünkü ölçülen ödüllü portfolyoların çoğunda ikisi de var.

### 1.4 Plan: "ödül seviyesi"nin ölçülebilir tanımı ve yön

Plan (`docs/03`) §1'de ödül alan portfolyoları ayıran 10 ölçüt sayım olarak verildi: (1) tek ve sert bir fikir, (2) yönetilmiş hareket, (3) ürün ekranda, kart değil sahne, (4) performans: orta sınıf Android'de 60 fps ("fails here and scores cap at mid-7s"), (5) kapı yok, (6) üç sesli tipografi, (7) ayrıntı özeni (canlı saat, konum, "available" satırı, imza), (8) ritim değişimi (açık/koyu bant), (9) dürüst içerik, (10) hafiflik pahalı görünmeye engel değil (Cerebrium 132 KB script ile SOTD).

taste-skill §0 formatıyla tasarım okuması: "Geliştirici portfolyosu, işe alım yapan mühendislik yöneticileri ve kurucular için, Awwwards-deneysel dile yakın ama veri-dürüst bir dille; GSAP + Lenis + tek 3D nesne + Archivo/Geist yığınına yaslanıyor." Kadranlar: **DESIGN_VARIANCE 8 · MOTION_INTENSITY 8 · VISUAL_DENSITY 4**.

Üç yön adayı: **A · Telemetri** (öneri: gerçek ürün bir nesne olarak sahnede, gerçek sayılar "yarış hafta sonu" verisi gibi, tek motif kontur çizgisi, açık gövde + koyu sahneler, NEXT kartı, SHIPPED/BUILDING anahtarı; referans Lando Norris yapı, Elliott Mangham veri, Tensordyne nesne), **B · Spec sheet** (koyu, mono veri yoğun üst şerit, yatay proje film şeridi; Elliott Mangham, SF Compute, Oxide; eksi: hareket az), **C · Dev tipografi** (beyaz, dev isim wordmark'ı, uçuşan 3D proje kartları, ödül tablosu biçiminde listeler; bleibtgleich'26, Nothin', Aspen Search; eksi: nesne yok). Öneri: **A omurga, C'nin tipografi disiplini, B'nin veri dürüstlüğü**; "Tek başına A yapılırsa Lando kopyası olur."

Tek fikir: **"telemetri"**: "Site bunu bir yarış mühendisinin ekranı gibi gösterir: gerçek nesne, gerçek sayı, gerçek zaman. Süs yok; her çizgi bir veriye bağlı."

### 1.5 Kararlar D1–D15 (nasıl alındı)

Plan §9 tablosu kullanıcıya sunuldu; kullanıcı 2026-09-26'da tabloyu olduğu gibi onayladı. Açık kalan iki madde D12 (isim yazımı; "Alpgiray Celik" ve `alpgiraycelik.me` korunuyor, `content/site.ts` tek yer) ve D14 (Awwwards başvurusu, S9'da tekrar soruldu, hâlâ açık).

| # | Konu | Karar |
|---|---|---|
| D1 | Yön | A + C + B karışımı |
| D2 | Lando kopyası | Yapı + fikir (kask→telefon, NEXT kartı, ON/OFF anahtarı, manifesto); motif ve palet bizim |
| D3 | Palet | P1 Signal: `#F3F2ED` kırık beyaz / `#0F0F10` mürekkep / `#FF4A00` turuncu, açık gövde + koyu sahneler |
| D4 | Tipografi | Archivo + aynı aile italik (serif yok) |
| D5 | Kahraman nesnesi | 3D telefon masaüstü (R3F) + 2D mobil |
| D6 | Özel imleç | Var, yalnız fine pointer (M4) |
| D7 | Giriş | Var, ≤ 600 ms wordmark maskesi, içerik arkada beklemez (M2) |
| D8 | Araçlar | GSAP + Lenis + R3F; `motion` (framer) kaldırılır |
| D9 | Proje anlatımı | 3 sahne + 4 liste |
| D10 | Proje sayfaları | `/work/[slug]` + geçiş, modal kalkar |
| D11 | Varlıklar | Ekran kaydı (Mentor YKS) en önemlisi |
| D12 | İsim ve alan | Kullanıcı (mevcut korunuyor) |
| D13 | Kontur motifi | Münih DEM verisi (prosedürel akış çizgisi B planı) |
| D14 | Awwwards başvurusu | Kullanıcı; ücretli, S9'da kontrol |
| D15 | Koyu tema anahtarı | Yok (tek tema; REGU K89 gerekçesi) |

Sonradan bildirilen karar değişikliği: D4'te gövde fontu Geist Sans yerine **Archivo (genişlik 100)**; Geist Sans 69 KB'lık tam dosyayla bütçeyi aşıyordu ve tek aile daha tutarlı. Geist Mono etiketlerde kaldı. Kural: "Kullanıcının kararını sessizce değiştirmek" yasak; değişiklik devir notunda açıkça yazıldı.

### 1.6 Varlık durumu (plan §10)

Mentor YKS ekran kaydı yok (10 gerçek ekranın yavaş geçişi kullanılıyor; `yksmentor/Mentor-Website` reposundaki **başka kullanıcıların adları bulanıklaştırılmış** webp kopyaları alındı, ham 1206×2622 PNG'ler alınmadı). Smart System Select gizli, görsel yok: gerçek sayılı şematik. REGU ekran kaydı geldi (41,6 s). Portre geldi (EXIF/GPS temizlendi). Dört video (Apex 32 MB, ChainSense 28 MB, GTM-Zero 23 MB, Agnes 99 MB) ham olarak 182 MB `assets/video-src/` altında; repoda kalıp kalmayacağı (LFS/CDN) açık karar.

### 1.7 Adım planı S0–S9 ve ne çıktı

Her adım tek commit, her adımda yasaklı §8 + ölçüm. Tahmin 9–10 oturum; en pahalı adımlar S2 (medya) ve S4 (3D).

| Adım | Çıktı (devir notundan) | Ölçüm |
|---|---|---|
| S0 | Kararlar ve varlık durumu plana işlendi; Mentor-Website reposu salt okunur klonlandı | yok |
| S1 | Token'lar (`app/globals.css` `@theme`, P1 palet), font altkümeleri (`app/fonts/*.woff2`, 128 KB, `tools/fonts/build.py`), kabuk (isim kilidi, cam hap, overlay menü, koyu kapanış bandı, dev wordmark perde, Münih saati), Lenis (M3) + reveal gözlemcisi + kütüphanesiz imleç (M4), 2D telefon (10 gerçek ekran, yavaş geçiş), kanıt şeridi, about; GSAP **tembel** (`lib/motion/gsap.ts`); eski `motion`, tilt, shine-border, particles silindi; `tools/olcum/` portu | `/` denetimi 0 bulgu, e2e 11/11, 375 px taşma 0; ilk yük JS 212 KB gz (çerçeve Next 16 + React 19 ≈ 199 KB, uygulama ≈ 13 KB), fontlar 99 KB ilk yük (italik yalnız kullanılınca), CSS 6 KB, HTML 11 KB gz |
| S2 | `tools/media/build.py` (imageio-ffmpeg: libx264 + libvpx-vp9): 4 ham kayıt → 720p H.264 tam video (1,0–5,9 MB), 6 sn sessiz döngü mp4 + webm (≤ 0,7 MB), poster JPEG; Apex kaydı Shots.so mockup'ıyla gelmişti, yalnız telefon ekranı kırpıldı; Agnes döngüsü 30. saniyeden; REGU yerelde derlenip Playwright ile kaydedildi; Mentor ekranları `public/media/mentor/` (480 + 960 webp) | Toplam `public/media/video` 12,9 MB (bugün 16,7 MB, REGU tam videosu eklendi) |
| S3 | Kontur zemini (EU-DEM 25 m, 5 m aralık, 103 kontur, 70 KB SVG / 23 KB gz), CSS giriş (≤ 600 ms, yalnız `html.js`), IdleGate ile yalnız görünürken oynayan kayma (90 sn, ±2 %); wordmark ölçeği `clamp(4.5rem, 1rem + 13.6vw, 14.5rem)` | Filmde 0,42 s'de boş, 0,69 s'de yerinde; 390–1920 arasında 2 satır, kırpma yok, yatay taşma 0; denetim 0 bulgu |
| S4 | `phone-stage.tsx` (2D telefon her zaman SSR, LCP adayı), `phone-scene.tsx` kapısı, `phone-3d.tsx` (R3F + three, drei yok) | Mobilde 3D chunk inmiyor (219 KB toplam); masaüstünde 3D paketi **243 KB gz** (three çekirdeği ≈ 200 KB; 200 KB hedefi aşıldı, LCP sonrası ve yalnız masaüstü olduğu için kabul); dokular 10 × ≤ 73 KB webp; yazılımsal WebGL'de render doğrulandı |
| S5 | SHIPPED üç koyu sahne (CSS sticky yığını + GSAP scrub), Mentor üçlü yelpaze, SSS şematik, Apex dikey döngü; BUILDING dört satır + imleci izleyen tek `<video>` önizleme; `VideoLoop`; `/work/[slug]` ×7 (S6 erkenden) | Denetim 8 sayfa 0 bulgu, e2e 12/12, mobil taşma 0 |
| S6 | Sayfa geçişi View Transitions API (`transition-link.tsx`, 1,2 s üst sınır), 404 kontur zeminli, OG görselleri `next/og` (Satori, TTF altkümeleri) | Denetim 0 bulgu, e2e 12/12 |
| S7 | Manifesto bandı (kelime kelime opacity scrub, SplitText gerekmedi), SHIPPED/BUILDING anahtarı (`role=switch`, GSAP Flip), parts list, zaman çizgisi (`DrawLine` scaleX scrub), about portre yuvası | Anahtar klavye, saat, wordmark reveal |
| S8 | Ölçüm turu: reduced motion turu, JS kapalı, mobil (pin yok, 3D yok, taşma 0), Lighthouse | Aşağıda |
| S9 | `app/sitemap.ts`, `app/robots.ts`, README, `docs/06-yayin.md` | Kullanıcı kararları açık: D14, ham videolar, portre, Mentor videosu |

**S8 Lighthouse (bu konteyner, yazılımsal GL):** masaüstü `/` perf 98 / a11y 100 / bp 100 / seo 100, LCP 0,94 s, TBT 0, CLS 0; mobil `/` benzetimli perf 79–85 (LCP 3,8–5,2 s, koşudan koşuya oynuyor), `/work/regu` 83; devtools kısıtlamalı mobil perf 69 (FCP 2,7 s, LCP 3,8 s, TBT 547 ms). Tarayıcıda ölçülen gerçek LCP kısıtlamasız 128 ms (h1). S8 düzeltmeleri: kontur `<img>` mobilde gizli (LCP adayıydı), giriş satır maskesi yerine kâğıt perde (kırpılan başlık LCP'ye girmiyordu, LCP 5,6 s görünüyordu), wordmark için 6 KB statik kesit (`archivo-display.woff2`) preload, gövde fontu preload'suz, boşta yükleme `load` sonrası 4 s üst sınır, manifesto başlangıç opacity 0,4 (0,15 kontrast uyarısı vermişti), indeks satırları renkle sönük, isim kilidi etiketi.

### 1.8 Geri bildirim turları (kod sonrası, hepsi 2026-09-26)

- **Tur 1:** imleç büyüyünce pikselli ve sistem imleci de görünüyor → 32 px nokta 0,3'e küçültülüyor, sistem imleci gizli (M4 güncellendi), blend modu kaldırıldı; telefon çerçeveleri kötü → iOS simülatörü ölçülerinde vektör iPhone çerçevesi (`iphone-frame.tsx`); 3D gövde titanyum + çerçeve + yuvarlatılmış ekran + island + düğmeler; sıralama Mentor, REGU, SSS, Apex (REGU shipped, kanıt şeridi 4 ürün); Mentor sayıları 70.000+ / 12.000+ / 1.500+ yeni ay / D1 %25+; zaman çizgisi eşit sütun; proje sayfasında alt bilgi wordmark'ı ScrollTrigger refresh ile; sonraki proje en üstten (Lenis `scrollTo(0)`); **backdrop-filter'lar kaldırıldı** (sabit hap, kahraman kartı), imleç blend'siz.
- **Tur 2:** 3D telefon "garip" → gövde `ExtrudeGeometry` ile köşeli (düz titanyum yan bant, 7 mm pah), `RoomEnvironment` PMREM ortam haritası, ekran üstünde %16 cam katmanı, ACES ton eşlemesi, dpr [1, 2], 700 ms crossfade, filtre kullanmayan zemin gölgesi; 3D paketi 244 KB gz. Açılıştaki REGU videosu yerine **kırılma noktası grafiği** (`regu-chart.tsx`; bulut 552 €/ay, 12 koltuk, donanım 7.045 €, kesişme 12. ay, 36 ayda 19.034 €, ROI %270, skor 87), çizgiler kaydırdıkça soldan açılır, mobilde dar viewBox'lı ayrı kopya (900 birimlik grafik 340 px'te 4 px yazı veriyordu). "900+ students on an average day" satırı kalktı (güncel günlük sayı yok). Portre EXIF/GPS kayıpsız temizlendi (APP1/APP13 segmentleri atıldı, ICC kaldı). Ölçüm: check geçti; denetim 8 sayfa 0; e2e 14/14; Lighthouse masaüstü 98/100/100/100 (LCP 0,96 s, TBT 0, CLS 0,005), mobil 84/100/100/100 (LCP 4,4 s yazılımsal GL şişmesi, TBT 49 ms, CLS 0).
- **Tur 3 (gerçek iPhone):** Mentor yelpazesi mobilde sola kayıp kesiliyordu: Tailwind v4 `translate` özelliği (`-translate-x-1/2`) ile satır içi `transform: translate(-50% …)` üst üste geliyordu, satır içi −50 % kaldırıldı; 3D telefon ekranı buğulu görünüyordu: beyaz cam katmanı (opacity 0,16 + ortam yansıması) kaldırıldı. Denetim 0, e2e 14/14.

### 1.9 Her adımın ölçümü (araçlar ve kurallar)

- `npm run check` (lint + tsc + build) her adımdan önce geçmeli.
- `npm run start` (3300) ayrı kabukta; `npm run audit:pages` (açılış + 7 proje sayfası: erişilebilirlik, klavye turu, dokunma hedefi, taşma, yasaklı liste; bulgu varsa çıkış 1); `npm run e2e` (açılış, hap, menü, saat, e-posta).
- 375 px taşma: denetim betiği her yolu 375 ve 1280 px'te sıfırdan yükleyip `scrollWidth − clientWidth` ölçer; e2e ayrıca 390 px'te ölçer.
- Klavye turu: 200 Tab'a kadar, her durağa benzersiz `data-tour-id`, odak halkası (`outlineWidth`) ve ≥ 44 px dokunma hedefi kontrolü, gizli öğeye odak uyarısı.
- Lighthouse mobil/masaüstü (komut §5'te); bu konteynerde mobil sayılar şişer, masaüstü güvenilir; gerçek ölçü PageSpeed Insights ve gerçek cihaz turu (`docs/06` §3).
- Yasaklı §8 kontrol listesi her teslimde.
- "Ölçmeden teslim yok" kalıcı kural 6.

### 1.10 Git kuralları ve geçmiş

Kalıcı kural 9: her adım tek commit, dal `claude/blissful-planck-wf3olv`; kullanıcı istemeden PR açılmaz. Geçmiş: `68d9489 R1 araştırması` → `db0b657 S1` → `e8d926a S2` → `433edc9 S3` → `7e3d268 S4` → `6642412 S5` → `c5bc7b8 S6` → `86b4d2b S7` → `2e47d73 S8` → `e916eaa S9` → `7fae734 Teslim görselleri` → `69d622b Geri bildirim turu 1` → `0c472bd Round 2` → `3a74fb7 Round 3`; kullanıcı PR #1–#5'i kendisi birleştirdi.

### 1.11 Ne ters gitti ve tuzaklar (devir notu §2 + `tools/arastirma/README.md`)

- Yazılımsal WebGL altında ağır 3D siteler çok yavaş; tam mod 600 s'de bitmedi; hafif mod gerekti.
- Kapılı siteler ölçülemez ("enter with sound", yüzde sayaçlı preloader, jest/sekme, "BEGIN"); ölçüm sınırı ama aynı zamanda erişilebilirlik bulgusu.
- `pkill -f` / `pgrep -f` kendi kabuğunu yakalar (çıkış 144); süreçleri `pgrep -af '[s]ite-yakala'` ile listele, **yalnız PID** ile öldür. Sunucu `nohup … & echo $! > next.pid` ile başlatılır, `fuser -k 3300/tcp` ile kapatılır (iki kez yaşandı).
- `hepsi.sh`'in "skip" satırı `xargs`'a gidiyor, atlanan slug başına ~19 s boş çalışma (zararsız).
- Awwwards sayfaları `curl` ile açılmıyor; WebFetch açıyor.
- 21st.dev: `magic.21st.dev` kapalı; arama `POST https://21st.dev/api/search` (`x-api-key`, ücretsiz); MCP `https://21st.dev/api/mcp`; kod çekimi kullanım hakkı yakar.
- Bu ortamın ffmpeg'i yalnız VP8 kodluyor; libx264/VP9 için `imageio-ffmpeg` gerekti.
- Videolar repoda 182 MB; `project-data.ts` REGU için var olmayan `/videos/regu.mp4` diyordu.
- `tech.json` kütüphane tespiti global nesnelere bakar; paketlenmiş GSAP/motion görünmez; kütüphane payları alt sınır, Awwwards etiketleriyle çapraz kontrol.
- Bash'te `cd X && …` paralel çağrılarda düşüyor, komutlar başka repoda koştu; her yol mutlak, git için `git -C /home/user/portfolio`.
- Next 16 çerçeve payı ≈ 199 KB gz; 120 KB bütçe yalnız **uygulama payı** için.
- React lint kuralı `react-hooks/set-state-in-effect`: matchMedia gibi dış durumlar için `useSyncExternalStore` (imleç, hover önizleme böyle yazıldı).
- Mentor ekranlarında başka kullanıcıların adları bulanık olmalı; yalnız işlenmiş webp'ler.
- 3D paketi hedefi (200 KB gz) aşıldı: 243–244 KB; kabul edildi, gerekçe yazıldı.
- Satır içi SVG kontur denendi: RSC yükünde ikinci kopya HTML'i 24 → 88 KB gz yapıyordu; düz `<img>` kaldı.
- Maskeli başlık LCP'ye girmiyordu (LCP 5,6 s); metin gizlenmeyip üstüne kâğıt perde konuldu.
- GitHub ekran görüntüsü alınamadı (proxy sertifikası, "Privacy error"); REGU v1 bölümü metin + bağlantı.
- Pano izni başsız tarayıcıda verilmez; e2e'de açıkça verilir; "Copied" durumu yarış yüzünden bir kez düştü, bekleme eklendi.
- `@react-three/drei` `package.json`'da kurulu ama kaynakta hiç import edilmiyor (grep ile doğrulandı); `loadSplit` yükleyicisi var ama kullanılmıyor (manifesto kelimeleri sunucuda bölüyor); planın "gren 0,04 yalnız koyu sahnelerde" maddesi kodda yok (grain/noise araması boş). Bunlar §8 "kullanılmayan bağımlılık" maddesi için not.

---

## 2. Araştırma bulguları (R1, `docs/01-arastirma-2026-09.md`)

### 2.1 Bugünkü (eski) site ölçümü (R1 §2)

Çekim `localhost:3100`, `next build` çıktısı. Ölçülen: koyu `#0a0a0a`; Geist Sans h1 **104 px w600 ls −3,1 px**, ortalanmış; zemin 21st.dev "fluid particles" canvas'ı (1.800 parçacık, sürekli); Lenis (`lerp 0.08`), özel imleç (nokta + halka), `TiltCard` (evade + spotlight), `ShineBorder` modal; script uygulama payı ~0 KB, font 137 KB; 5.538 px masaüstü, 8.445 px mobil; taşma yok; 6 bölüm; h2 yalnız "Let's build something."; `motion` + `lenis` + `lucide-react` bağımlı.

İyi (korunacak): metin dürüst ve somut (50.000+ indirme, 10.200+ aylık, 900+ günlük; "20–60 dk → 5 dk"; roller abartısız), `project-data.ts` tek kaynak, erişilebilirlik tabanı (modal odak yönetimi, Escape, reduced-motion dalı, 44 px'e yakın hedefler, `focus-visible`), hız (LCP metin).

Eksik: görsel fikir yok (parçacık zemini hazır bileşen); ürün ekranda değil (4 video ve 3 telefon ekranı **modal arkasında**); eşit kart ızgarası; hareket tek türde (her bölüm aynı fade-up; kaydırma filminde 8 karenin 3'ü aynı); ritim yok; kapanış zayıf; em dash ve klişe ("I build products people actually use —", "Let's build something"); REGU videosu referanslı ama dosya yok, ham videolar 182 MB repoda; alt bilgi tek satır, 404 varsayılan. Sonuç: "Sorun içerik değil sunum."

### 2.2 Ödül ölçütleri ve 2025–26 verisi (R1 §3)

**SOTY:** 2025 Lando Norris (OFF+BRAND; SOTD 17 Kas 2025, SOTM, SOTY), 2025 Messenger (abeto; Three.js çok oyunculu oyun, "BEGIN" kapısı), 2024 Igloo Inc (abeto), 2024 Don't Board Me (The First The Last), 2024 Opal Tadpole (Claudio Guglieri, ürün sayfası), 2023 Lusion v3, 2023 Noomo Agency, 2019 Bruno Simon.

**Portfolio Honors 2025–26:** NOTHIN' (Tem 26), Lama Lama (Haz 26), Podium (May 26), Pacôme Pertant (May 26), Adcker (Nis 26), MERSI (Mar 26), Gavin Schneider (Şub 26), Bruno Simon (Ara 25), Artiom Yakushev (Ara 25), Elliott Mangham (Kas 25), Olha Lazarieva (Eyl 25), Form&Fun (Ağu 25), Jam Area (Tem 25), Caffè Design, Phantom.Land (May 25), Studio Null (Nis 25), bleibtgleich'25 (Mar 25), Fiddle.Digital (Şub 25), Gianluca Gradogna (Oca 25).

**Eylül 2026 SOTD (26 gün, hepsi Developer Award):** Meer Mohsin (26), The Tie-break (25), Moto Finance (24), Sobha Privy (23), bleibtgleich'26 (22), Gil Huybrecht (21), Pensatori Irrazionali (20), Boc.Studio (19), Noho (18), LxL Creative (17), L.I.S.A. (16), Aspen Search (15), Léo Parpeix (14), Tuscan Journey (13), Warm & Fuzzy (12), White Desert (11), Cerebrium (10), USAvionix (9), Seasats (8), Why Zero (7), United Carriers (6), Gionatan Nese (5), Illoca (4), Trevor Noah (3, OFF+BRAND), Paul Kalkbrenner (2), Squarespace Foundations (1).

**Puan kırılımları (Awwwards):**

| Site | SOTD | Tasarım | Kullanılabilirlik | Yaratıcılık | İçerik | Dev | Etiketler |
|---|---|---|---|---|---|---|---|
| Lando Norris | 8,18 | 8,12 | 7,90 | 8,71 | 8,18 | 7,58 | WebGL, GSAP, Webflow, 3D; `#D2FF00` / `#111112`; "erişilebilirlik notu" |
| Pacôme Pertant | 7,76 | 7,88 | 7,41 | 8,09 | 7,66 | 7,62 | GSAP, Three.js, Nuxt; `#0a0a0a`/`#fafafa`; spiral galeri, sayfa geçişleri, imleç izi |
| Léo Parpeix | 7,69 | 7,79 | 7,34 | 8,04 | 7,63 | 7,47 | Animasyon 8,40 · Responsive 7,80 · WPO 7,20 · Erişilebilirlik 7,00 · SEO 7,00 |
| Gil Huybrecht | 7,66 | 7,93 | 7,33 | 7,46 | 7,92 | 7,40 | Animasyon 8,4; Next.js, DatoCMS, WebGL; `#0D0D0F`; sonsuz galeri |
| NOTHIN' | 7,45 | 7,58 | 7,24 | 7,60 | 7,23 | 7,24 | Webflow, GSAP, WebGL; AI video zemin |
| Gionatan Nese '26 | 7,32 | 7,28 | 7,09 | 7,73 | 7,33 | 7,27 | Erişilebilirlik **6,40**; ses, preloader |
| Meer Mohsin | 7,26 | 7,28 | 6,94 | 7,75 | 7,19 | 7,20 | Animasyon 8,0; `#990000`/`#090909`; sinematik kaydırma galerisi |

Okuma: yaratıcılık en yüksek alt puan, kullanılabilirlik ve erişilebilirlik en düşük; dev puanları 7,2–7,6; "bizim sessiz avantajımız ölçülmüş erişilebilirlik ve hız."

**Jüri ölçütleri (hontran.dev):** (1) art direction, "a specific point of view"; (2) directed motion, anlam taşıyan koreografi; (3) performance, orta sınıf Android'de ~60 fps, "fails here and scores cap at mid-7s". Örnekler: By-Kin (Next + GSAP + Strapi; yumuşak kaydırma, yüzey sürekliliği), Iventions (Three.js ışık atmosfer için), Mat Voyce (GSAP kinetik tipografi), Uncommon Studio (ızgara kırma + hız disiplini), Minh Pham (Three.js "tasteful", GSAP üstte). Kıyas stüdyoları: Active Theory, Lusion, Resn, Obys, Unseen.

**Three.js kuralları (utsubo.com 2026):** tek zor fikre bağlan ve her şeyi ona göre bütçele; performans bir özellik (instancing, baked lighting, byte bütçesi); önce anlamlı HTML; Draco/Meshopt/KTX2; orta sınıf telefonda test; TSL ile WebGPU'ya hazırlık; **"sell one object properly"**.

**muz.li 100:** 66'sı okundu (67'den sonra kesildi). Ortak dil: 3D/WebGL (Alche, Samsy, Chipsa, Karim Saab, Jordan Delcros, Phantom, Cyphr), kinetik tipografi (Joseph Santamaria, Adrien Lamy, Obys), minimal + akışkan etkileşim (Fine Thought, Marga Navarro, Clément Grellier); stüdyolar çoğunluk; kişisel geliştirici portfolyosu azınlık (Abhishek Jha, Clément Grellier, Marga Navarro, Eduard Bodak, Jordan Delcros, Samsy).

### 2.3 Lando Norris analizi (R1 §4 ve §5.1)

Kaynaklar: kendi çekim (`landonorris-hafif-*`), OFF+BRAND vaka çalışması (itsoffbrand.com/our-work/lando-norris; kolaj `docs/gorseller/lando/`), Awwwards puanı, webgpu.com vitrini.

**Ne (ölçüldü):** Webflow + GSAP + SplitText + three.js + Lenis; WebGL 3D kask; **Rive** hareketli grafik; **21 canvas**; script 165 KB, görsel 5,6 MB; 13.577 px masaüstü, 10.077 px mobil, taşma yok; fontlar **Mona Sans Variable** (grotesk, genişlik ekseni) + **Brier** (serif). Zemin kırık beyaz (`#F5F5F0` ailesi); üstünde **topografik/kamuflaj lekeler ve kontur çizgileri** sürekli yavaş akıyor (kahraman filmi: 8 karede 8 farklı leke düzeni, metin sabit). Sol üst "LANDO NORRIS" condensed bold kilit, ortada "LN" monogram, sağ üst **neon sarı "STORE" hapı** + hamburger. Sol altta **"NEXT RACE" kartı**: pist çizimi, "BAKU GP", laurel + "McLAREN F1 SINCE 2019". Kask başsızda çizilmedi; vaka kolajında neon sarı/siyah desenli kask ve portre üst üste, tek nesne.

**Akış:** kahraman (kask + portre) → **"ON TRACK" koyu paneli** (koyu yeşil `#282C20`): dev "ON TRACK" (ON fırça darbesi sarı, TRACK condensed beyaz), kask, "25 Y.O · BRISTOL, UK", serif italik vurgulu paragraf ("bringing the *fight to every race*"), **istatistik hücreleri** (PREVIOUS · MONACO 2nd / CURRENT RND. 4 · 1st / NEXT · AUSTRALIA), sarı imza + "REDEFINING LIMITS, FIGHTING FOR WINS" → **tipografik manifesto** siyah zeminde dev büyük harf ("I'M NOT INTERESTED IN JUST BATTLING MY TEAM-MATE FOR THE BACK OF THE GRID.") → fotoğraf yerleşimleri + serif alıntı ("It doesn't matter where you start…") + mono tarih etiketleri → açık gri bantta kontur üstünde **dağınık fotoğraf bulutu** → kırık beyazda fotoğraf + el yazısı not ("Since I was 7 years old…") → **"ON TRACK / OFF TRACK" anahtarı**: ikiye bölünmüş ekran (kask solda, portre sağda, "Most recent results…" / "Campaigns, shoots…") → koyu "HELMETS HALL OF FAME" ızgarası (mono "Season 2023" altyazıları) → "WORLD DRIVERS' CHAMPION" mağaza bloğu → "WHAT'S UP ON SOCIALS" kart yelpazesi → sarı-yeşil kapanış: "ALWAYS BRINGING THE FIGHT." + kasklı portre + linkler + sponsor logoları. Mobil: aynı sıra tek sütun, kontur zemin duruyor, fotoğraflar tam genişlik.

**Neden iyi (sayılabilir):** (1) tek nesne, tek motif, tek vurgu: kask her bölümde, kontur çizgileri her zemin, sarı yalnız sarı; (2) gerçek veri sahnede: yarış sonuçları, sıradaki yarış, yaş, şehir; NEXT RACE kartı canlı bileşen; (3) üç ses: condensed grotesk (başlık), serif italik (vurgu, el notu), mono büyük harf (etiket); (4) ritim: açık kahraman → koyu panel → siyah manifesto → açık fotoğraf → koyu kapanış; (5) hareket anlam taşıyor: kontur akışı hız hissi, kask dönüşü nesneyi tanıtıyor, ON/OFF anahtarı iki dünyayı değiştiriyor; sayaç, "scroll" ipucu, preloader yok (ilk kare içerik dolu); (6) kişilik: el yazısı, imza, "We Did It" gibi gerçek anlar.

**Neden birebir kopyalanmaz:** sarı ve kask McLaren/Lando markası; sporcu sitesi (mağaza, sosyal akış); Webflow + Rive yığını yok. Alınan: **yapı ve disiplin**. Plan §3.1 tablosu: kahraman tek nesne + isim + NEXT kartı → **al (yapı)**; topografik motif → **al (fikir), alma (çizim)**, kendi motifimiz Münih'in gerçek yükselti konturları; neon sarı `#D2FF00` + siyah → **alma**; condensed bold + serif italik → **al (üç ses)**, serif kararı D4 (aynı aile italiği); ON/OFF anahtarı → **al** ("SHIPPED / BUILDING"); koyu panelde istatistik → **al (biçim)** (ROLE · STACK · USERS · STATUS); manifesto → **al** (kendi cümle); sosyal karusel, mağaza → **alma**; Webflow + Rive + WebGL → **alma (araç)**; preloader: Lando'da hafif, 8 kare boyunca zemin hareketli içerik yerinde → M2 sınırında.

### 2.4 Referans siteler tek tek (R1 §5, 64 giriş)

Her giriş: yığın (ölçülen), kahraman, hareket (kaydırma filmi), tip/renk, "bize al / alma".

1. **Lando Norris:** yukarıda. Al: altı madde, NEXT kartı, ON/OFF anahtarı, mono tarihli yerleşim, koyu panel spec hücreleri. Alma: sarı, kask, mağaza, sosyal karusel, sponsor bandı, 21 canvas.
2. **bleibtgleich'26** (The First The Last; SOTD 22 Eyl 2026): Webflow + GSAP + SplitText + three + Lenis; 2 canvas; script 147 KB, görsel 561 KB; **3,2 s yükleme (listenin en hızlısı)**; 6.585 px; **Akzidenz Grotesk Pro**, h1 90 px w500. Kahraman beyaz; siyah leke logo (yüz silüeti), dikey ince çizgi, "Design Digital Products, UX/UI & Web-flow dev." asimetrik satır kaydırmalı, köşelerde soluk dev "bleibt / gleich". Film: "the best ideas deserve execution." → **"Work 24-26"** proje kartları 3D uzayda uçuşup diziliyor → "Awards & Recognitions" **tablo** (CSSDA, Awwwards, FWA) → "nothing more than a sentence." + "Available for selected projects" + dev wordmark. Al: beyaz + tek grotesk ile "pahalı" görünme kanıtı; uçuşan kartlar; ödül tablosu biçimi; asimetrik satır kaydırma; hız. Alma: boş alan fazla, projeler kart.
3. **Gil Huybrecht** (Jesper Landberg ile; SOTD 21 Eyl 2026): Nuxt + three + Lenis + Tailwind; 1 canvas; script 12 KB (+chunk), görsel 6 MB, medya 20 MB; 2 video; animasyon 8,4; `#0D0D0F`. **Preloader %99'da kaldı** (hero ve 11 film karesinin hepsi siyah + "99%"). Ders: yüzde sayaçlı preloader zayıf GPU'da içeriği tamamen gizliyor; SOTD aldı ama dev 7,40; bizde M2.
4. **Gionatan Nese '26** (SOTD 5 Eyl 2026): Next + three + Tailwind + Sanity; 1 canvas; **40 script**; görsel 1,8 MB, medya 13 MB; **LayGrotesk + Teodor**; erişilebilirlik 6,40 (en düşük). Beyaz; "GN.D" + "Creative Space ¹ ² ³" sekmeler; **dağınık görsel kümesi** (WebGL); kaydırma çalışmadı (jest/sekme). Al: dağınık görsel bulutu fikri yalnız gerçek ekran görüntüleriyle; sekmeli iki dünya. Alma: jest kapısı, ses, 40 script.
5. **Léo Parpeix** (SOTD 14 Eyl 2026): Lenis; 1 video (**24 MB**); animasyon 8,40, WPO 7,20, a11y 7,00. Kırık beyaz; üstte "Léo Parpeix · Art director, Interactive designer · Work About Playground"; "Driven by detail. Obsessed with seamless motion." + "Scroll down"; **tek ekranlık sahne**, sanal kaydırıcı ("World building" etiketi dönüyor). Al: üst şerit biçimi (ad · rol · üç link). Alma: "Scroll down", 24 MB video, sanal kaydırıcı.
6. **Elliott Mangham** (Portfolio Honors Kas 2025): GSAP + Lenis; canvas 0; script ~0, görsel 371 KB; **3.600 px**, mobil 1.057 px; **Roobert Mono + Neue Montreal**; `#121212`. **Beş sütunlu mono "spec sheet"**: INTRO (portre, "England: LON [11:05]", "$1B+ Client Revenue Portfolio"), POSITION ("£25–60K"), RECOGNITION ("23x Site Of The Day"), BRANDS, CONNECT ("Available September 2026", "Book 30-Min Discovery Call", `[ SCHEDULE CALL ]`). Ortada paragraf (Neue Montreal 40 px); "SCROLL" + "Projects ⓪ / Awards ⓪" + **yatay proje film şeridi**; paragraf satır satır scrub. Al: mono spec sheet (gerçek sayılarla), "Available <ay>", canlı saat, yatay şerit, hafiflik. Alma: tek koyu ton, hareket azlığı.
7. **Artiom Yakushev** (Portfolio Honors Ara 2025): Webflow + GSAP + SplitText + Lenis + Lottie; **18 video, 160 MB**; 12.412 px; Suisse + Apparel (serif italik); `#000`. Serif italik "A *Creative Partner*…"; dev "Artiom *Yakushev*" karışık wordmark; "YEREVAN 02:06 PM"; DRM video oynamadı. Film: "V10", **"19–26 ©" yıl damgası** dev punto → tam genişlik vaka videoları (mockup'lar, turuncu boya darbeleri) → "All (15)" → "KEY SKILLS" → "A®–26" turuncu bant → kapanış wordmark bulanıklıktan netleşiyor. Al: yıl damgası, karışık wordmark (aynı aile italiği), saat, tam genişlik vaka videoları, "All (15)" sayaçlı başlık, bulanıktan netleşme (≤ 600 ms). Alma: 160 MB, DRM, siyah zemin.
8. **NOTHIN'** (Portfolio Honors Tem 2026): Webflow + three + Lenis; 1 canvas; 4 video; script 117 KB, görsel 4 MB, medya 22 MB; 11.603 px; **PP Neue Montreal + IBM Plex Mono**. Beyaz; "Not a style, a perspective." + "BOOK A CALL →" siyah hap; **ekranı dolduran dev "NOTHIN'"**. Film: beyaz → siyah "WORKS": **3D laptop mockup'ları** dönüyor → sinematik 3D sahne → uçuşan nesneler → "Let's start from nothin'" + dev alt bilgi. Al: dev wordmark iki uçta, beyaz → siyah ritmi, işlerin **cihaz içinde 3D** gösterimi. Alma: AI video zemin, 22 MB.
9. **Pacôme Pertant** (Portfolio Honors May 2026): Nuxt + three + Lenis + Lottie; 1 canvas; 88 çalışan animasyon; hafif (192 KB). "enter with sound" kapısı; spiral galeri. Ders: ses kapısı içerik gizliyor; spiral 7 proje için fazla.
10. **Messenger** (SOTY 2025): Three.js çok oyunculu oyun; "BEGIN" kapısı; alınacak şey yok.
11. **Ağır WebGL:** **Bruno Simon** (mor ızgara + neon halka yükleme; 502 s; "tek nesne sahnede" fikrinin atası), **Igloo Inc** (mono "-----===++" yükleyici; **tel kafes iglo** 3D nesne kuruluyor; sanal kaydırma; ders: tel kafes → katı geçişi), **Lusion** (açık lavanta, büyük çerçeve içinde parlak 3D boru düğümleri; ders: 3D tek çerçeve içinde, sayfanın kalanı düz HTML), **Meer Mohsin** (kırmızı grenli preloader "012", siyah + kırmızı yükleme çubuğu; 480 s'de içerik gelmedi). Dördü de kapılı.
12. **Antoine Wodniack** (Portfolio Honors Kas 2024): GSAP + Lenis; 2 canvas; **34 video**; script ~0 (satır içi), görsel 1,2 MB; **21.944 px**; **Fraktion Mono + Bigger Display + Editorial New**; zemin **`#F40C3F` kırmızı**; h1 "Creative Developer" **216 px w700**; 2,1 s. Brutalist ızgara; "LOADING… COULD BE WORSE"; serif "Coding globally from France. / Available for freelance work → **Hire me**"; QR; **moiré çizgi shader'ı**; ikili sayı marquee; "CREATIVE ✦ DEVELOPER". Film: dev "WORK" ızgarası, "GO" düğmesi. Al: tek renk + tek display + mono; "Hire me" başlıkta; shader'ın tek renk oluşu. Alma: 22.000 px, QR, oyun metaforu, "LOADING".
13. **Grégory Lallé:** Lenis + SplitText + Tailwind; 15 video, 28 MB; 3.767 px; "75" yüzde sayacı. Kapı.
14. **Ross Mason** (Portfolio Honors Şub 2024): beyaz; "3D, Motion, Art direction · Index, Patreon, Store, About, Lab · Send me a message"; **numaralı mono etiketli yatay iş şeridi** ("02. Stella Artois [CLIENT WORK]"); dev "ROSS*mason*"; "Carousel, List" görünüm anahtarı; "London, UK 11:30"; yatay tekerlek kaydırma. Al: numaralı şerit, görünüm anahtarı, saat, italik wordmark. Alma: yatay kaydırma, düğmesiz CTA.
15. **Gianluca Gradogna** (Portfolio Honors Oca 2025): koyu sinematik; beyaz kart + fotoğraf paneli "THROUGH THIS [görsel] LENS" (**satır içi mikro görsel**); "Scroll Down"; yatay paneller. Al: satır içi mikro görsel. Alma: "Crafting Narrative Through Design", "Scroll Down", yatay panel.
16. **Trevor Noah** (OFF+BRAND; SOTD 3 Eyl 2026): three + Lenis + SplitText; 1 canvas; script 118 KB, görsel 1,6 MB; 10.730 px; **Die Grotesk**; lacivert `#1D2440`; h1 **361 px w700** pembe. Dev isim + portre + "açılmış kafa"dan çıkan nesneler; film: tarihli etkinlik tablosu, "Leaving so soon?" numaralı menü. Al: **dev isim + portre + nesne** formülü; tarihli tablo; numaralı kapanış menüsü. Alma: sticker/kolaj tonu, çerez bandı.
17. **Rauno Freiberg** (rauno.me): Next; script ~0; 6.108 px; **mobilde yatay taşma var**. Açık gri; ince **ilerleme cetveli**; beyaz kartlar yatay şerit; sarı/turuncu daireler; "Make it fast. Make it beautiful. Make it consistent… Make it." Al: az söz çok craft; ilerleme cetveli; ucuz güçlü geometri; kendi ilkelerini yazma. Alma: yatay şerit, üçlü ritim.
18. **Emil Kowalski:** Next + Tailwind; script ~0; 2.480 px; `#FDFDFC`; düz tek sütun metin. Karşı kutup ("craft ürünün içinde"); metin disiplini proje sayfalarında geçerli.
19. **Dennis Snellenberg:** GSAP + **Locomotive** + Tailwind; script 254 KB; "Dennis Sans" h1 216 px w450; `#1C1D20`; kaydırma ölçülemedi. Portre; "Located in the Netherlands" hapı + dönen küre ikonu; **isim marquee'si hıza bağlı**. Al: konum hapı; yalnız hıza bağlı marquee (M5 kaynağı). Alma: Locomotive, gri tek ton, sonsuz marquee.
20. **Ulaşılamayanlar:** Jesper Landberg (403), Olha Lazarieva (çekim hatası).
21. **Robin Noguier:** Next; 1 canvas; script 336 KB; tam ekran slayt destesi (sanal kaydırma); zemin rengi projeye göre (mavi, bordo, teal); serif proje adı (eksell 135 px); bükülen fotoğraf (WebGL). Al: projeden projeye zemin geçişi; serif ad + mono etiket. Alma: slayt destesi (kaydırma ele geçirme), emoji, 2019 kalıbı.
22. **Niccolò Miranda** ("The Paper Portfolio"): kâğıt dokulu bej; serif display; "TIP! Drag sideways"; "NEW" rozetleri; siyah bantta "MIRANDA". Al: koyu bant içinde dev wordmark; durum rozetinin gerçek karşılığı (LIVE, INTERNAL, MVP). Alma: kâğıt/serif, "TIP!", yatay sürükleme.
23. **Mousham:** torii kapısı + "Start Experience" kapısı; GLSL su yansıması. Kapı.
24. **Clément Grellier:** Lenis + SplitText; script 155 KB; **Amiamie**; h1 160 px; sanal kaydırma; klişe cümleler; **alt ortada yüzen hap gezinme**. Al: alt orta hap (S1'de ölçülecek). Alma: klişe, sanal kaydırma.
25. **Jordan Delcros:** three.js; script 8 KB; "DISCOVER PORTFOLIO" hapı: kapı.
26. **Adrien Lamy:** kırmızı; el çizimi karakter; "DRAG / GRAB / PULL?" fizik; kaydırma yok. Kişilik = tutarlı çizgi dili; bileşen yok.
27. **Abhishek Jha:** gökyüzü + gren; elips kesitten çıkan 3D metalik çiçek; **numaralı gezinme** ("① HOME ② ABOUT ③ WORKS"); "AVAILABLE FOR PROJECTS · HI@… · SEND PROJECT INQUIRY"; "SCROLL DOWN TO EXPLORE"; marquee. Al: numaralı gezinme, müsaitlik + e-posta bloğu, çerçeve + ince çizgi + gren. Alma: kaydırma ipucu, marquee, içerikle ilgisiz nesne.
28. **Eduard Bodak** (Köln): Webflow + Lenis; script ~0, görsel **37 KB**, 3,0 s; 6.140 px; `#F9F4EB`; h1 "Einfache Websites" 174 px w600 condensed; köşe `+` işaretleri, mono koordinat kodları ("3D2Y", "A113"); üç pastel kart yelpazeden düzene; **"PRO MONAT € 3.245,-"** gerçek fiyat; "13:46 KÖLN". Al: dürüst rakam; köşe işaretleri + mono kodlar ("REC 01" dili); saatli alt bilgi; 37 KB ile pahalı görünme. Alma: üç eşit kart, pastel.
29. **Lama Lama** (Portfolio Honors Haz 2026): GSAP + Lenis + Swiper + Tailwind; 3 canvas; 24 video; script 515 KB; **Sometype mono + Suisse BP Intl**; `#1A1C1C` + nokta ızgara; h1 72 px w700 condensed. Koyu hap gezinme; "[ WE ARE LAMA LAMA ]" köşeli parantezli mono; alt **mono şerit** "20+ DIGITAL FREAKS · AMSTERDAM BASED · [ ● 12:46:36 ] · …". Al: mono alt şerit (kanıt şeridi + saat tek satır), köşeli mono etiket, nokta doku, koyu hap. Alma: yuvarlak "20+" rakam, 24 video, Swiper.
30. **Karim Saab:** sarı AI görünümlü görsel; "UNLOCK Your Brand's Personality"; em dash, klişe. "Ne yapılmaz" örneği. Film: iki karo → "HOW I CAN HELP (03)" → anahtar deliği maskesi + glitch → dev "KARIM Saab" alt bilgi ("PARIS 12:50 PM").
31. **Samsy:** WebGPU/WebGL 3D dünya; telemetri satırı "Connected: 1, Engine: WebGL, Frame: 191.7 ms, 7 FPS"; SKIP kapısı. Telemetri satırı fikri ilginç; yön değil.
32. **Adcker** (Portfolio Honors Nis 2026): Lenis + Tailwind; **162 MB medya**; `#EFEDEA`; nhm + Kumbh Sans + serif etiket; "THE ART ( [showreel] ) OF HACKING SOCIAL": **başlığın içine gömülü video slotu**. Al: başlık içine gömülü canlı medya. Alma: 162 MB, sanal kaydırma.
33. **Podium** (Portfolio Honors May 2026): beyaz; **gooey/metaball maskesiyle** fotoğraflar; "SCROLL DOWN". Al: maske ile "görsel deliği". Film: koyu 3D kaya + mono yıllı liste; logo duvarı; "LET'S BUILD YOUR VISION"; Next + three + Lenis, 27 video, 98 MB.
34. **Form&Fun** (Portfolio Honors Ağu 2025): Webflow + GSAP + SplitText + Lenis + Lottie + Swiper; **script 4 MB, medya 261 MB**; 7.398 px; Aeonik; dört 3D karo; **ödül tablosu** numaralı 01–08; logo; dev "Form&Fun" alt bilgi kaydırdıkça yükseliyor. Al: numaralı tablo; wordmark'ın perdeden yükselişi. Alma: 261 MB, logo duvarı, üç kart.
35. **Studio Null** (Portfolio Honors Nis 2025): Webflow; script ~0, görsel 49 KB, medya 468 KB; ABC Areal; beyaz; **tek nesne mavi cam piramit (video döngüsü)**; "London, 11:53:15"; "Start a project" hapı. Al: "tek nesneyi düzgün sat" en ucuz hâli (video döngüsü 500 KB); saat; hap CTA; **3D telefon için B planı: önceden render edilmiş döngü video**. Alma: sanal kaydırma.
36. **Phantom:** Next + GSAP + three; 48 script; görsel 6,3 MB; **Helvetica Now + Ballinger Mono**; siyah; sonsuz karo ızgarası; karo başına mono meta ("COMMUNICATION · CAMPAIGN · CONTENT · 2024"); "SOUND [OFF]"; **iki şehirli saat**; alt hap gezinme + Filter. Al: karo başına mono meta (ROLE · STACK · YEAR), alt hap + filtre. Alma: sonsuz ızgara, ses.
37. **Boc.Studio** (SOTD 19 Eyl 2026): Next + Lenis + Tailwind + Sanity; **123 script**; PP Mori; `#181D21`; renkli düşey paneller; kırmızı marquee "**41.4120° N, 2.1580° E Barcelona**"; ince kırmızı üst şerit + "16:55 CET"; proje = satır: 4–5 görsel + ad + alt başlık + "View project". Al: koordinat satırı (bizde 48.1351° N, 11.5820° E), proje satır biçimi, ince renkli üst şerit + saat. Alma: sonsuz marquee, 123 script.
38. **The Tie-break:** tenis topu yükleyici; kampanya; kapı.
39. **Noho:** bej ikiye bölünmüş; **gerçek rakam kartları** ("99 % recycled nylon", "82 % renewable electricity", "5-year warranty"; mono "01"); dev "happy modern" alt bilgi. Al: kaynağı belli rakam kartı tonu. Alma: bej.
40. **Sharplink** (Studio Freight, Lenis'in yapımcısı; SOTD 27 Ağu 2026): koyu; "Ethereum with an Edge"; **patlatılmış 3D metal nesne + teknik çizim katmanı** (ince kutular, kesikli bağlantı çizgileri, köşe işaretleri); mono büyük harf gezinme kutuları; mavi ok düğme; "COMPANY NEWS · AUG 10, 2026" kartı. Film: açık bant → koyu bantta nesnenin başka bileşeni (mono etiketli sütunlar) → açık → mavi gradyan alt bilgi, dev "Sharplink". Al: **nesne + teknik açıklama katmanı** (telefon etrafında mono etiketler ve ince çizgilerle "50,000+ downloads → App Store" bağlantıları; Together AI ile aynı fikir); açık/koyu ritmi; tek nesnenin parçalanarak anlatılması. Alma: çerez bandı, kurumsal ton.
41. **L.I.S.A.** (Locomotive): CRT monitör kafalı 3D figür; "[CLICK]" kapısı; 1 MB script. Kapı.
42. **White Desert** (Malvah): gri gökyüzü video + **12 görünür dikey ızgara çizgisi**; hap gezinme; dev condensed "ANTARCTICA"; serif italik; 19.887 px; **"CPT — WFR" uçuş kodu dev puntoda**; turuncu tek vurgu. Al: görünür sütun ızgarası; kod/etiketi dev puntoda ("50,000+" veya "REC 01"); condensed dev başlık. Alma: 20.000 px, video zemin, serif.
43. **Warm & Fuzzy:** Next + Lenis; 18 canvas, 59 script, görsel 9,6 MB; Suisse Intl; 3D showreel; sticker duvarı; mono "DUNKIN PUMPKIN SPICE · 2025" altyazı. Al: mono "AD · YIL" altyazısı. Alma: video ağırlıklı ajans kalıbı.
44. **Don't Board Me** (SOTY 2024): "BOUNCE A BALL TO GET TO THE SITE" jest kapısı; SOTY bile kapılı.
45. **Noomo** (SOTY 2023): piksel logo yükleyici; kapı.
46. **Brittany Chiang:** Next + Tailwind + Contentful; **Inter + slate-900 `#0F172A`**; 2,6 s; 3.819 px; sol sabit sütun; "Hi there!"; teal **hap etiketler**. **Karşı örnek**: binlerce kez çatallanmış, taste-skill'in "LLM varsayılanı"nın kaynağı; eski sitemiz aynı aileye yakın; yeni sitede hiçbir parçası yok (hap etiket yerine parts list, sol sabit gezinme yerine cam hap + overlay).
47. **Cuberto:** Astro + Webflow + GSAP + Lenis + Tailwind; 12 video; Suisse Intl 81 px w500; numaralı yığılan hizmet kartları; "Trusted by"; soru başlık. Al: yığılan kartların koyu/koyu-mor yumuşak zemin geçişi (yöntem). Alma: soru başlık, Trusted by, ortalanmış SaaS kalıbı.
48. **Hobro Digital:** Cloudflare doğrulaması; çekilemedi.
49. **LxL Creative** (SOTD 17 Eyl 2026): Webflow + GSAP + SplitText + three + Lenis; koyu kahve `#27201D`, krem + turuncu; **Manrope + Owners Wide + Scribo**; 15.300 px; büyük portre; "REAL CRAFT. Real people. REAL RESULTS." (üçlü ritim); turuncu kıvrımlı çizgi motifi her bölümde; soru başlık kapanış. Al: tek motif disiplini; geniş display + el yazısı + gövde üç ses; krem/koyu/turuncu P1'e yakın kanıt. Alma: üçlü ritim, soru başlık, 15.000 px.
50. **Opal Tadpole** (SOTY 2024): ödüllü sayfa kalkmış; yerine Times ile mektup; "sayfa yerine mektup" uç örneği.
51. **Paul Kalkbrenner** (SOTD 2025): beyaz; "Paul Kalkbrenner" **ABC Diatype Plus Variable 150 px w700 ls −7,5 px**; isim ortasına gömülü küçük s/b kare fotoğraf; "Now playing"; "Sound OFF". Film: vinil daire maskesi; yeşil `#A7FF9C` şerit; "01/08" video listesi; turuncu `#FF6831` galeri şeridi; üç eşit hücre kapanış; 10.424 px; GSAP + SplitText + Lenis; canvas 0; 25 script; **4 zemin rengi, bölüm başına bir zemin**. Al: isim tek başına + gömülü fotoğraf; bölüm başına düz zemin (gradyan yok); sinyal turuncusu `#FF6831` P1'e çok yakın. Alma: ses çalar, üç eşit hücre.
52. **Moto Card** (fintech): siyah kaya dokusu; **3D kart + kaide**; "BUILT FOR MODERN WEALTH" condensed caps; tek CTA "Apply for Access"; SOTD rozeti; 4 karelik kahraman filmi 2,1 s değişmiyor. Al: tek nesne + kaide + tek CTA; ışığın nesneyi anlatması ("ürün kaidesi" örüntüsünün en temiz hâli). Alma: kaya dokusu, lüks tonu, caps başlık.
53. **basement.studio:** siyah; ilk 240 px boş (yazı geç); "A digital studio & branding powerhouse making cool shit that performs" **Geist 87 px w600 ls −3,48 px**; HUMAN / MACHINE anahtarı (metinleri değiştiriyor); "Trusted by Visionaries" ~36 logo ızgarası; Featured Projects iki sütun; 6.714 px; Next + Tailwind + GSAP + three (2 canvas) + Sanity; Geist + Geist Mono + "flauta"; 86 script. Al: Geist'in 87 px'te sıkı aralıkla editoryal durabildiğinin kanıtı; proje satırı düzeni; **metni değiştiren anahtar** fikri. Alma: logo ızgarası, 86 script.
54. **Active Theory:** yazılımsal WebGL'i tanıyıp `unsupported.html`'e yönlendirdi ("YOUR BROWSER IS NOT SUPPORTED"). Tarayıcı eleme.
55. **'kin:** krem `#F4F2ED`; turuncu (`#FF6A3D` civarı) "'kin" mono wordmark; **"LAYOUT 1 / 2" anahtarı**; tek ekran portfolyo (900 px); Next + Tailwind; Apercu Pro + Apercu Mono Pro; 22 script; 5,8 s. Al: yerleşim seçtiren küçük oyun; mono + grotesk; krem + tek turuncu. Alma: tek ekran, illüstrasyon.
56. **Mat Voyce:** krem; iki dev cam göbeği `#00D3FF` italik condensed "MAT" / "VOYCE" çapraz; "SCROLL" etiketi; emoji çıkartmalar; logolar; yeşil "CONTACT MAT"; tam mavi footer; 7.245 px; Next + Tailwind + three + Lenis; **F37 Judge + Extended**. Al: iki kelimenin çapraz yerleşimi, dev italik condensed ağırlık; footer'ın zemin rengini tümüyle değiştirmesi. Alma: çıkartma/emoji, kaydırma ipucu, logolar.
57. **Uncommon Studio:** CSS yüklenmedi; iskelet görüldü; **stil olmadan bile hiyerarşi okunuyor** (progressive enhancement'ın ölçülebilir karşılığı); "bizim sayfa da CSS'siz bu kadar okunmalı".
58. **Unseen Studio:** "Enter" / "ENTER WITHOUT AUDIO" ses kapısı; Neue Montreal + Saol Display; three.js.
59. **Minh Pham:** `#0D0D0D`; kedi logosu + "START" kapısı; h1 "making good shit since 2009" Avant Garde 117 px w700 ls −5,8 px; three + Lenis; 8 script; "Powered by DevHonTran" (jüri üyesinin kendi işi). Jüri üyesi bile kapı koyuyor; bizim ayrışma kapısız ilk kare.
60. **Sébastien Lempens:** 3D scooter figür; 5 ödül rozeti kahramanda; yükleyici. Bizde ödül yok, rozet yok.
61. **bilal.show:** mercan `#F25A5A`; el yazısı yükleyici; kapı.
62. **Iventions** (SOTD 2026): bej `#F3EFEB` + lila `#8072FF` çapraz maske; "Step into the Spotlight" (Söhne 36 px); dev "IVENTIONS" **maskenin iki yanında iki renk**; sarı-yeşil `#E0FF98` köşe çipleri; müşteri listesi **metin** (logo değil); "Projects Delivered 270+"; alt kenardan taşan sarı-yeşil degrade wordmark; 14.895 px; 82 script; Next + three + Lenis. Al: wordmark'ın maske sınırında renk değiştirmesi; müşteri listesinin metin olması; alt kenardan kesilen dev isim. Alma: üçlü kart, "270+" yalnız gerçek sayıyla, 82 script.
63. **Hubtown:** lacivert gece; su üstünde **tek mavi küp** (döner; sanal kaydırıcı); sol dikey menü; "WE BUILD THE FUTURE OF REAL ESTATE" + tek CTA; alt şerit "SOUND OFF · SCROLL TO EXPLORE · CHAT WITH US"; mono/geniş caps; ince çerçeve; three.js; 34 s yükleme. Al: tek nesne ve ışık anlatıcı (Moto Card sınıfı); alt şerit düzeni (üç köşe bilgisi). Alma: ses, kaydırma ipucu, sanal kaydırıcı, caps başlık.
64. **Weis Device:** Windows 2000 taklidi "LOADING 13 OF 13…" + "ENTER / ENTER (NO MUSIC)"; VT323 + Pixellari; three.js. Nostalji OS "tek fikir" örneği, yön değil.

### 2.5 Örüntüler: 68 sitede sayılanlar (R1 §6)

Sayımlar `istatistik.mjs` (63 `tech.json`) ve `say.mjs` (64 giriş) ile; kütüphane payları **alt sınır**.

- **6.1 Tek fikir, tek nesne:** her ödüllü sitede adı konabilecek tek fikir (kask ve kontur, wordmark ve Akzidenz, spec sheet, spiral, kâğıt, tel kafes iglo, boru düğümü, mavi küp, kart ve kaide, Windows 2000). **Tek 3D/fiziksel nesne kahramanda: 6 giriş** (Lando, Bruno Simon/Igloo/Lusion, Studio Null, L.I.S.A., Moto Card, Hubtown); "nesne her zaman ışıkla anlatılıyor, metin ikinci planda". **Dev wordmark / isim: 16 giriş**, en sık kalıp; kapanışta alt kenardan kesilen isim (Iventions, Form&Fun, Adcker), kahramanda çapraz iki kelime (Mat Voyce, Trevor Noah 361 px).
- **6.2 Ürün sahnede, modal yok:** hiçbir portfolyoda iş modal arkasında değil. Video 21/63; canvas 33/63; 3+ canvas yalnız 5 sitede (Lando 21, Warm & Fuzzy 18, Lama Lama/Lusion/Sharplink 3). Çoğunluk tek canvas.
- **6.3 Hareket araçları (63 site):** Lenis **32** (GSAP ile 12, three ile 15); three.js 28 (R3F tespit edilmedi); Tailwind 22; GSAP (global) 17 (SplitText 11); Next.js 17 (Nuxt 7, Astro 1, Webflow 12); Lottie 6; Rive 0; Locomotive 1; motion (framer) 0. "GSAP + Lenis + three üçlüsü standart; kütüphanesiz ödüllü portfolyo yok."
- **6.4 Tipografi:** 1 aile 19 site, 2 aile 26, 3+ 14 (medyan 2); tek aileyle SOTD var (bleibtgleich, Paul Kalkbrenner, Gil Huybrecht); üç ses Lando, Artiom, Wodniack, Robin Noguier, Adcker; serif vurgu 9, mono etiket 20. h1 medyan 40 px (43 site); ≥ 100 px 11 site (Trevor Noah 361, White Desert 256, Dennis Snellenberg ve Wodniack 216, Eduard Bodak 174, Clément Grellier 160, Artiom 158, Paul Kalkbrenner 150, Robin Noguier 135, Minh Pham 117, bugünkü site 104). **Negatif harf aralığı 20/43** (−3 … −7,5 px). Tekrar eden aileler: Neue Montreal (5), Suisse (4), Geist (3), Mona Sans, ABC Diatype, Söhne, Aeonik, Apercu, Roobert Mono, F37 Judge.
- **6.5 Kapılar:** **21/68 kapılı** (Gil Huybrecht, Gionatan Nese, Pacôme Pertant, Messenger, Bruno Simon, Igloo, Lusion, Meer Mohsin, Grégory Lallé, Mousham, Jordan Delcros, Samsy, The Tie-break, L.I.S.A., Don't Board Me, Noomo, Unseen, Minh Pham, Sébastien Lempens, bilal.show, Weis Device; Active Theory tarayıcı eledi). **SOTY kazananlarında 6/8 kapılı**; Lando kapısız. Ses kapısı/anahtarı 5. Sanal kaydırma 4 (Léo Parpeix, Hubtown, Dennis Snellenberg, Igloo): "Yerel kaydırma kaybolunca klavye ve ekran okuyucu da kayboluyor; Lenis yerel kaydırmayı koruduğu için tercih."
- **6.6 Ritim, kapanış, küçük özen:** açık/koyu ritim (Lando, Rauno, Niccolò Miranda, L.I.S.A., LxL; Paul Kalkbrenner bölüm başına düz zemin). Zeminler koyu 23 / açık 24; kişisel portfolyolarda koyu 12 / açık 10 ("açık zemin tek başına ayrıştırmaz, ritim ayrıştırır"). Sayfa uzunluğu ≥ 10.000 px 12 site (Wodniack 21.944, White Desert 20.782, LxL 15.300, Noho 14.965, Iventions 14.895, Lando 13.577); plan ~12.000 px. Canlı saat / müsaitlik / konum 10 giriş. Manifesto bandı 5 (Lando, Gianluca, Rauno, Adcker, LxL). İmza 3. Marquee 10, yalnız Dennis'te hıza bağlı.
- **6.7 Yasaklı listeyle çakışanlar (ödüllü sitelerde bile):** logo bandı (Lando, Form&Fun, basement 36 logo, Mat Voyce); üç eşit kart (Eduard Bodak, Form&Fun, Paul Kalkbrenner, Iventions); kaydırma ipucu (Léo Parpeix, Mat Voyce, Hubtown); ödül rozeti kahramanda (Sébastien Lempens, Moto Card).
- **6.8 Ağırlık:** script sayısı medyan 10; uçlar Boc.Studio 123, basement 86, Iventions 82, White Desert 65. bleibtgleich 147 KB ile SOTD; Elliott ~0 KB. Yazılımsal WebGL'de yükleme medyanı 11,8 s; uçlar White Desert 55 s, Sharplink 35 s, Hubtown 34 s.

### 2.6 21st.dev saha araştırması (R1 §7)

**Yöntem:** `POST /api/search`, **176 sorgu** (kahraman, metin, kaydırma, görsel/galeri, kart, imleç/düğme, gezinme/alt bilgi, zemin/shader/3D, bölümler; ikinci tur film grain, gooey, hover video, project list, menu overlay, awwwards, smooth scroll vb.; sorgu listesi `tools/arastirma/21st/sorgular.txt`), her sorgu 20 sonuç → **3.211 isabet, 1.431 tekil bileşen, 1.239'unda video önizleme**. 9 kovadan kullanım + video ağırlıklı en iyi 324 + ikinci tur 48 = **372 bileşen önizlemesi** 35 kontak sayfasında tek tek bakıldı. En üretken yazarlar: designali-in 73, ravikatiyar162 65, dhileepkumargm 58, ruixen.ui 54, manuarora700 (Aceternity) 50, dillionverma (Magic UI) 45, efferd 37, preetsuthar17 (HextaUI) 33, ibelick (Motion Primitives) 28, danielpetho (fancy components) 16.

**Genel bulgu:** "kütüphanenin büyük bölümü SaaS açılış sayfası slop'u: mor gradyan, glow kart, bento, testimonial, logo bulutu, '10X' rozeti, sayı sayma." İşe yarayan şey **yöntem**: satır maskesi, imleci izleyen önizleme, kaydırdıkça genişleyen medya, Flip düzen geçişi, blend-mode imleç, perde altından çıkan wordmark. Karar sözlüğü: **AL** = yöntem alınır, token'larla yeniden yazılır; **ADAY** = render edilip ölçülür; **ALMA** = alınmaz. Sayım: **AL 18 · ADAY 75 · ALMA 114** (207 değerlendirilen; kalan 165 şablon/ilgisiz). REGU'nun çektiği on JSON'dan burada da geçerli olanlar: `text-reveal-mask` 19257, `svg-follow-scroll` 7288, `sticky-content-wrapper` 26064, `large-name-footer` 872, `motion-navigation-menu` 21349. Kullanıcının 20 yer imi (squeeze carousel, morph gallery, sticky split, blur reveal, shader zeminler) envanterle örtüşüyor (2412 interactive-selector = squeeze; 6749/2381 shader).

**AL (18) ve nasıl kullanıldı:**

| Kategori | id | Bileşen | Kullanım | Nasıl |
|---|---|---|---|---|
| Kahraman/zemin | 6794 | Halide Topo Hero | 177 | Tek renk topografik paralaks + gren; Lando kontur motifine en yakın hazır yöntem; DEM verisiyle yeniden yazıldı (`contours.tsx`) |
| Metin | 221 | Text Effect (ibelick) | 1954 | Harf/kelime giriş efektleri; kahraman satır maskesi yöntemi |
| Metin | 884 | Vertical Cut Reveal (danielpetho) | 1157 | Dikey kesme reveal; satır maskesi |
| Metin | 10098 | Scroll Velocity Text | 323 | Hıza bağlı marquee (M5); tek izinli marquee biçimi (kullanılmadı) |
| Metin | 883 | Letter Swap | 161 | Hover'da harf yer değiştirme; gezinme |
| Kaydırma | 1755 | Scroll media expansion hero | 2606 | Kaydırdıkça genişleyen medya; SHIPPED medya girişi |
| Kaydırma | 4262 | Zoom Parallax | 1244 | Farklı hızlarda zoom paralaks; proje sayfası galerisi |
| Kaydırma | 1332 | Parallax Floating | 768 | İmleç paralaksıyla yüzen görseller |
| Kaydırma | 4906 | Svg follow scroll | 175 | Kaydırmayı izleyen SVG çizgi; zaman çizelgesi (`draw-line.tsx`) |
| Kaydırma | 687 | Morphing Dialog | 171 | Layout animasyonlu geçiş; liste → proje sayfası paylaşımlı geçiş fikri |
| Galeri | 908 | Image Trail | 260 | İmleç izinde görseller; yalnız gerçek fotoğrafla (kullanılmadı) |
| Galeri | 2352 | Infinite Drag + Scroll Gallery | 131 | Gil Huybrecht deseninin hazır yöntemi |
| Liste | 2067 | Animated Slideshow | 363 | Hover'da görsel değişen liste |
| Liste | 6495 | Project Showcase | 330 | Liste + imleci izleyen önizleme; BUILDING listesi (`hover-preview.tsx`) |
| İmleç | 5903 | Menu Toggle Icon | 1390 | Hamburger ↔ X morfu |
| İmleç | 1330 | Magnetic (ibelick) | 164 | Mıknatıs; GSAP quickTo yerine kütüphanesiz lerp (`cursor.tsx`) |
| İmleç | 6533 | Morphing Cursor | 124 | Morf eden imleç + mıknatıs (M4) |
| Alt bilgi | 7741 | Motion Footer | 251 | Perde altından çıkan dev wordmark (`wordmark-reveal.tsx`) |

**ADAY (75) öne çıkanlar:** zemin: 2326 Animated Shader Background (1819; GLSL çapraz ışık çizgileri), 356 Grid Pattern (1744), 2381 Shader Background (1456), 2486 Horizon Hero (1137), 4099 Shader Lines (955), 1644 Wave Background (799), 6474 Scroll Morph Hero (646), 275 Canvas Reveal Effect (542; Clerk nokta zemin), 6749 Hero Dithering Card (511), 6766 Flow Field Background (394; DEM gelmezse kontur yerine), 4496 Paper design shader (271), 5985 Hero ASCII (236; yalnız 404), 3820 Woven Light Hero (175), 4510 3D Animation (137); metin: 270 Gooey Text Morphing (1653), 1331 Text Rotate (1505), 353 Text Reveal (800; manifesto scrub yöntemi), 352 Hyper Text, 259 Text Scramble, 1657 Magic Text, 684 Morphing Text, 345 Gradual Spacing, 347 Word Pull Up, 1478 Liquid Text, 392 Scroll Velocity, 1162 Circular Reveal Heading, 349 Blur In (yalnız giriş ≤ 600 ms), 2702 Text Marque, 2362 Reveal Text, 344 Word Fade In, 2438 Interactive Text Particle (riskli); kaydırma: 331 Sticky Scroll Reveal (633), 1670 Hero Gallery Scroll, 1653 Cards Stack, 4162 Full Screen Scroll FX, 311 Layout Grid, 1953 Animated Cards Stack (üç sahnenin üst üste binmesi), 3776 Sticky scroll cards, 338 Parallax Grid Scroll, 1907, 1923, 234 Scroll Progress, 10101; galeri: 1287 Video Player (621; GSAP'siz yeniden yazılır), 4290 Wave Path, 4746, 4869, 5171 Bento Gallery, 365 Spotlight, 3528, 1018 Zoomable Image; liste: 2412 Interactive Selector (462; squeeze), 295 Focus Cards, 6535 3D Folder, 2310, 6445, 6037 Portfolio Hero, 675, 6590, 5770 Project Data Table; etkileşim: 1752 FlowButton (616), 1577 Entropy, 902 Pixel Trail (404), 1068, 373, 1239 Bottom menu (rauno esinli), 1310 Fluid menu, 3321; gezinme: 6014 Header 2 (1452), 339 Navbar Menu, 5448 Floating Header (cam hap), 5873 Hover Footer, 2632 Limelight Nav; bölüm: 325 Timeline (3487; yatay cetvel kaynağı), 1990 Agent Plan.

**ALMA (114) kategori olarak (§7.2):** preloader/yükleyiciler (kapı), dock'lar, **küreler** (171 Globe Magic UI 1570, 6863 Interactive Globe 256, 7686 COBE Globe 249; gerekçe "Münih tek nokta"), logo bulutu ve dönen ikon küresi (175), testimonial ve avatar yığınları (1789, 2439, 6564), bento ızgaraları (281 2698, 1308, 701, 6155 "10X" rozetli, 4301, 6484), glow/spotlight kartlar (1408 Glowing Effect 3907, 2358, 1107, 332, 282, 297, 2315, 4074), gradyan/shimmer metin (355, 1470, 1685, 1157, 1909, 4770, 1094, 374), sayı sayma (191 Number Ticker 1293, 1665), typewriter (895, 1100, 323), Aceternity "container scroll" (287, 4104) ve "hero parallax" (301), tracing beam (324), mor/neon shader zeminler (674 Aurora 6933, 1339 Background Paths 5843, 284 Sparkles 4187, 1447 Beams, 4125, 4015, 321, 278, 1224, 3842, 334, 680, 4179 Siri Orb, 279, 4657, 5655, 6499, 2409), stok görselli galeriler, tema anahtarı (4713, 936; D15), Spline Scene 929 (8953 kullanım; runtime ~1 MB), liquid glass / shimmer / shiny / glow düğmeler (2943 2910, 237 2335, 3642, 685, 1052, 7145, 1022, 4161, 3768), AI prompt/chat (2192, 1726), 3D carousel/galeriler (715, 4160, 5439, 3973, 4007, 3603, 6142), tilt/3D card (316, 2885), world map (320), stepper, orbiting circles/skills, AI loader, morphing square loader.

### 2.7 Çıkarımlar (R1 §8)

1. Sunum katmanı eksik, temel değil. 2. Tek fikir seçilmeli ve her bölümde tekrar etmeli ("telemetri"). 3. Ürün kahramanda, projeler sahne; modal yok. 4. Hareket araçları standart (Lenis 32, three 28, GSAP ≥ 17; motion imzası sıfır); GSAP + Lenis + R3F. 5. Kapı yok, ilk kare içerik (21/68; SOTY 6/8): "Jüri bunu affediyor, orta sınıf telefonda kullanıcı affetmiyor." 6. Üç sesli tipografi, condensed display; Archivo + Geist + Geist Mono ücretsiz karşılık. 7. Ayrıntı özeni ucuz ve etkili (saat, "Available <ay>", yıl damgası, mono tarih, imza). 8. Hafiflik (bleibtgleich 3,2 s / 147 KB; Elliott ~0 KB). 9. 21st.dev'den bileşen değil yöntem. 10. Kopya sorusu: Lando yapı olarak kopyalanabilir, palet ve motif kopyalanmaz.

### 2.8 Açık noktalar ve sınırlar (R1 §10)

Kapılı sitelerin içi görülmedi; muz.li 67–100 okunamadı; kahraman filmleri başsız kare hızıyla sınırlı (Lando'nun kask dönüşü ve Rive yalnız vaka kolajında); 21st.dev kodları çekilmedi; Awwwards puanları WebFetch özetinden.

---

## 3. Yasaklı liste (`docs/02-yasakli-liste.md`, 2026-09-26, REGU K75'ten uyarlama)

Giriş: REGU listesi "finansal karar belgesi" için yazılmıştı; burada ürün portfolyo. İki değişiklik: (1) "Dürüstlük ve metin kuralları aynen kaldı." (2) "Hareket kuralları gevşetildi, ama yazılı muafiyetle." Öncelik: "bu liste kurulu skill'lerin (`taste-skill`, `soft-skill`, `gpt-tasteskill`) üstündedir. Skill bir maddeyle çelişirse liste kazanır. Kullanıcının K-kararları listenin üstündedir."

### §1 Dürüstlük (en yüksek öncelik)

| Yasak | Yerine |
|---|---|
| **Uydurma sayı veya rozet.** "10× faster", "%99 memnuniyet", "500+ müşteri" | Yalnızca ölçülmüş, kaynağı söylenebilen sayılar. Her sayı `project-data.ts`'teki gerçek alandan gelir |
| **Sahte sosyal kanıt.** "Trusted by" logo duvarı, testimonial, yıldız puanı, avatar yığını | Hiç olmaz. İşveren ve okul adı **metin** olarak geçer (Knorr-Bremse, TUM); logo duvarı değil |
| **Ödül rozeti taklidi.** "Awwwards-worthy", "SOTD" sözleri, sahte laurel | Ödül alınırsa gerçek rozet; alınmadıysa hiçbir şey |
| **Olmayan projeyi göstermek.** Uydurma vaka, "coming soon" kartı | Yalnızca repoda gerçekten var olan 7 proje. Görselleri olmayan proje "internal, no public demo" diye dürüstçe işaretlenir |
| **Sayı sayma efekti** (count-up) | Rakam anında okunur, `tabular-nums`. Gerçek sayı sahnelenmez |
| **Yanıltıcı rol.** "Founder & CEO", "Lead" abartısı | Gerçek rol: sole engineer, working student, solo founder |

### §2 Metin (arayüz İngilizce)

| Yasak | Yerine |
|---|---|
| **Em dash (—)** | Nokta veya virgül; iki cümle |
| **Emoji** | İkon seti veya hiç |
| **AI klişe fiilleri:** Elevate, Unleash, Supercharge, Seamless, Effortless, Crafting digital experiences, Passionate about, Bringing ideas to life, Pixel-perfect | Ne yaptığını söyle: "I ship apps people use every day" |
| **"Simply", "just", "easy"** | Sil |
| **Üçlü ritim klişesi:** "Design. Build. Ship." | Tek cümle |
| **Soru başlık:** "Want to work together?" | Bildiren başlık: "Available from May 2027" |
| **Ünlem** | Nokta |
| **Lorem ipsum, TODO, "coming soon"** yayında | Gerçek metin veya bölüm hiç olmaz |
| **Meta etiket dolgusu:** "SECTION 01", "ABOUT ME" | Etiket bilgi taşır: "SHIPPED · 3 PRODUCTS", "MUNICH · 48.14° N" |
| **Klişe portfolyo başlıkları:** "Hi, I'm X 👋", "Welcome to my portfolio", "Let's build something amazing" | İsim ve gerçek konum/rol; kapanışta somut çağrı ("Book a 30-min call") |

### §3 Görsel ve düzen

| Yasak | Neden / yerine |
|---|---|
| **Mor→pembe gradyan kahraman**, neon glow (`box-shadow` renkli) | 2023 AI ürünü klişesi. Tek vurgu rengi, doygunluk kontrollü |
| **Başlıkta gradyan metin, shimmer metin** | Okunurluk düşer, tarih atar |
| **Eşit üç kart sırası**, eşit bento kutuları "3 feature" | En bilinen şablon refleksi. Projeler kart değil **sahne** |
| **Kart içinde kart**, cam kart üstünde cam kart | Yüzey sayısı azaltılır |
| **Saf siyah `#000`** zemin üstünde saf beyaz metin | Token'daki kırık siyah/beyaz |
| **Stok fotoğraf, AI görsel, 3D robot/beyin, "developer at desk"** | Yalnızca gerçek ekran kaydı, gerçek ekran görüntüsü, kullanıcının gerçek fotoğrafı |
| **Teknoloji logo bulutu / dönen ikon küresi** | Metin listesi (parts list); logo kullanılıyorsa tek renk, tek boy, marka izniyle |
| **"Scroll to explore", zıplayan ok** | Kahramanın altı zaten devam ediyor; ipucu gerekiyorsa tasarım yanlış |
| **İçeriği gizleyen preloader / "enter" kapısı / ses kapısı** | Ölçüldü: 8 ödüllü siteden 4'ü yazılımsal GPU'da hiç açılmadı. İçerik ilk boyamada yerinde; §7b M2 |
| **`h-screen`** | `min-h-[100dvh]` |
| **Yatay taşma**, 44 px altı dokunma hedefi, `focus-visible` halkasız etkileşim | Ölçüm araçlarıyla kontrol; gözle değil |
| **Renkle taşınan bilgi** (durum noktası tek başına) | Metin eşlik eder ("Available") |
| **Aynı hover'ı her şeye** (tilt + spotlight + glow bir arada) | Bileşen başına bir hareket fikri |

### §4 Hareket

| Yasak | Yerine |
|---|---|
| **`top/left/width/height` animasyonu** | `transform` ve `opacity`; `filter: blur()` yalnızca giriş, ≤ 600 ms |
| **Anlamsız sonsuz döngü:** nabız, shimmer, dönen rozet, yüzen ikon | Bir kez oynayan giriş veya kaydırmaya bağlı hareket. Muafiyet M1 ve M4/M5 |
| **Kaydırma ele geçirme:** scroll-jacking, snap ile sayfa sayfa zorlamak | Lenis yumuşatma (M3) ele geçirme değildir: kullanıcı istediği hızda kayar. Tam sayfa snap yok |
| **`prefers-reduced-motion` yok saymak** | Zorunlu: giriş animasyonları kapalı, scrub'lar son karede, 3D idle durur, Lenis kapalı, imleç kapalı |
| **60 fps altı** hareket | Orta sınıf Android'de ölçülür; sağlanamıyorsa efekt sadeleşir |
| **Hover'a bağlı bilgi** (yalnızca hover'da görünen link) | Dokunmatikte de erişilir |
| **Aynı anda birden çok hareketli zemin** | Tek shader/tek 3D nesne |

### §5 Kod

| Yasak | Neden |
|---|---|
| **Yer tutucu yorum** (`// ...`, `// TODO`) teslim edilen kodda | Yarım çıktı bozuk çıktıdır |
| **Sabit renk/ölçü gömmek** | Token (`globals.css` `@theme`) |
| **`package.json`'da olmayan paket** | Hayali bağımlılık |
| **Hazır bileşeni olduğu gibi yapıştırmak** (21st.dev kodu ölçülmeden) | Önce render + ölç, sonra yöntemi al, token'larla yeniden yaz (REGU K91) |
| **`useState` ile imleç/scroll değeri tutmak** | Her karede React ağacı yeniden çizilir; `useMotionValue` / GSAP quickTo |
| **Global `scroll` dinleyicisi** | `IntersectionObserver` / ScrollTrigger |
| **Video `autoplay` sessiz değilken**, `preload="auto"` her videoda | `muted playsInline preload="metadata"`, görünür alana girince oynar |
| **Optimize edilmemiş medya** (99 MB mp4) | Boru hattı: H.264 + AV1/WebM, ≤ 3 MB önizleme, poster kare |
| **Anahtar/token repoda** | `.env`, `.gitignore` |

### §6 Süreç (kendime)

| Yasak | Yerine |
|---|---|
| **Kullanıcının kararını sessizce değiştirmek** | Çatışmayı söyle, kararı bırak |
| **Emin değilken emin gibi yazmak** | "ölçmedim", "tahmin", "doğrulanmadı" |
| **"Tamamlandı" demek, kısmen yapılmışken** | Ne yapılmadığını da yaz |
| **Bir skill'i körü körüne uygulamak** | `gpt-tasteskill`'in "Python RNG" ritüeli ve picsum stok görselleri **uygulanmaz**; `soft-skill`'in "double-bezel her kartta" kuralı kart sayısı sıfıra yakınken **uygulanmaz** |
| **Ölçmeden "hızlı" demek** | Lighthouse + gerçek cihaz |

### §7 Skill çelişkileri (çözüldü)

| Skill der ki | Bu liste | Karar |
|---|---|---|
| `taste-skill`: serif vurgu yasak, aynı ailenin italiği | REGU'da Instrument Serif var | **Aynı ailenin italiği** (taste-skill kazanır; Instrument Serif tekrarı "AI tell") |
| `taste-skill`: Lucide yerine Phosphor | Mevcut kod Lucide | İkon sayısı 5'in altında; **Phosphor light**, Lucide kaldırılır |
| `soft-skill`: floating pill nav, hamburger morph, stagger menu | Uyumlu | Alınır |
| `gpt-tasteskill`: "stats hero'da yasak" | Lando ve Elliott kahramanda gerçek veri | Gerçek sayı kahraman **altındaki** kanıt şeridinde; kahraman tek fikir |
| `gpt-tasteskill`: picsum stok görsel | §3 stok yasak | Uygulanmaz |
| `fixing-motion-performance`: blur yalnızca sabit öğelerde | Uyumlu | Alınır |

### §7b Muafiyetler (aynen)

"Aşağıdakiler **öneri**; `03-plan-taslak.md` §9'daki D-kararlarıyla açılır veya kapanır." "yalnızca kullanıcı kararıyla açılır; §7b'de yazılı olmayan muafiyet yoktur"

- **M1 · Kahraman nesnesinin idle hareketi** (3D telefon yavaş salınım, kontur çizgileri): §4 "sonsuz döngü" muafiyeti; yalnızca kahraman alanında, görünür alandan çıkınca durur, `prefers-reduced-motion`'da donuk kare. (D5)
- **M2 · Kısa marka girişi** (≤ 600 ms wordmark maskesi): içerik **ilk boyamada yerinde**, giriş üstüne biner ve solar; hiçbir şey arkasında beklemez. Yüzde sayacı, "loading", kapı yok. (D7)
- **M3 · Lenis yumuşak kaydırma:** ele geçirme değil, yumuşatma; `lerp ≥ 0.1`, tekerlek çarpanı 1; reduced-motion ve dokunmatikte kapalı. (D8)
- **M4 · Özel imleç:** yalnızca `pointer: fine`; nokta zemine göre mürekkep/kâğıt (blend modu yok, performans), bağlantılarda mıknatıs. **Kullanıcı kararı 2026-09-26:** sistem imleci gizlenir, yalnız nokta görünür; metin alanlarında sistem imleci geri gelir. (D6)
- **M5 · Marquee:** yalnızca hızı kaydırmaya bağlı (`scroll velocity`), kaydırma durunca durur; kendi kendine dönen bant yok.

### §8 Teslim öncesi kontrol listesi (aynen)

- [ ] Ekrandaki her sayı `project-data.ts`'teki gerçek bir alandan mı geliyor?
- [ ] Em dash, emoji, ünlem, klişe fiil, soru başlık, "SECTION 01" etiketi kaldı mı?
- [ ] Eşit üç kart / eşit bento var mı?
- [ ] Mor gradyan, gradyan metin, glow, shimmer var mı?
- [ ] Stok veya AI görsel var mı? Her görsel gerçek ürün/ekran mı?
- [ ] Sonsuz döngü var mı; varsa M1/M5 kapsamında mı?
- [ ] İçerik giriş/preloader arkasında bekliyor mu? (JS kapalıyken sayfa okunuyor mu?)
- [ ] `prefers-reduced-motion` açıkken: giriş yok, scrub son karede, 3D durdu, Lenis kapalı, imleç kapalı mı?
- [ ] Klavyeyle gezilebiliyor mu, `focus-visible` görünüyor mu? Menü Escape ile kapanıyor mu?
- [ ] Her etkileşimli öğe ≥ 44 px mi? (ölçerek)
- [ ] 375 px'te yatay kaydırma var mı? Pinned sahneler mobilde düz akışa düşüyor mu?
- [ ] Lighthouse mobil (yavaş 4G, 4× CPU): LCP ≤ 2,5 s, CLS 0, TBT ≤ 200 ms?
- [ ] JS bütçesi: uygulama payı ≤ 120 KB gz (3D ve GSAP dinamik import, LCP sonrası)?
- [ ] Videolar: ≤ 3 MB önizleme, poster var, `muted playsInline`, görünürlükle oynuyor mu?
- [ ] Kodda yer tutucu yorum, sabit renk, kullanılmayan bağımlılık kaldı mı?
- [ ] Kullanıcının bir kararını değiştirdiysem söyledim mi?

Denetim betiğinin ölçebildiği yasaklı desenler (`sayfa-denetimi.mjs` `FORBIDDEN`): `[—–]` em/en dash; emoji aralığı `\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}`; `!` ünlem; `{` `}` çözülmemiş yer tutucu; `undefined|NaN`; `**` işlenmemiş markdown; `Lorem ipsum|John Doe|TODO|FIXME|Coming soon`; `simply|seamless|cutting-edge|passionate`; `SECTION 0\d`.

---

## 4. Görsel dil ve hareket

### 4.1 Palet (D3, plan §4.1) ve token'lar (`app/globals.css` `@theme`)

Adaylar: **P1 · Signal (seçildi):** `#F3F2ED` kırık beyaz / `#0F0F10` mürekkep; koyu sahneler `#0F0F10` üstüne `#F3F2ED`; vurgu `#FF4A00` uluslararası turuncu ("fren sistemi, pist, sinyal; REGU mavisinden ve Lando sarısından ayrışır"). Kontrast: turuncu üstü mürekkep 3,9 (yalnız büyük metin), turuncu üstü kırık beyaz plan 3,2 / `globals.css` yorumu 2,8 (yalnız grafik öğe). P2 Cobalt `#1E3AFF` (REGU `#0F62FE`'ye ve eski site `#3070B3`'e fazla yakın), P3 Acid `#C8FF3A` (Lando `#D2FF00`'a yakın, kopya okunur), P4 koyu taban `#0B0B0C` / `#F3F2ED` + `#FF4A00` (Artiom/Elliott/Meer ailesi). Gerekçe P1: Lando açık; ölçülen zeminler yarı yarıya; ayrıştıran şey açık gövde + koyu sahne **ritmi**; koyu sahneler videoya zemin.

Uygulanan token'lar:

| Token | Değer |
|---|---|
| `--color-paper` | `#f3f2ed` |
| `--color-paper-2` | `#e8e7e0` |
| `--color-ink` | `#0f0f10` |
| `--color-ink-2` | `#19191b` |
| `--color-signal` | `#ff4a00` |
| `--color-mute` | `#62625c` |
| `--color-mute-dark` | `#a3a39e` |
| `--color-line` | `rgb(15 15 16 / 0.16)` |
| `--color-line-dark` | `rgb(243 242 237 / 0.18)` |
| `--font-sans` | `var(--font-archivo), Arial, Helvetica, sans-serif` |
| `--font-mono` | `var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace` |
| `--ease-out` | `cubic-bezier(0.25, 1, 0.5, 1)` |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--spacing-gutter` | `clamp(1.25rem, 4vw, 4rem)` |
| `--container-site` | `96rem` (1536 px) |

Koyu sahne tema değil, bant düzeyinde (D15): `[data-scene="dark"]` zemin ink, metin paper, `--color-mute` → mute-dark, `--color-line` → line-dark, `--color-paper-2` → ink-2; selection ve focus rengi tersine döner. `::selection` signal/paper; `:focus-visible` `2px solid signal`, offset 3 px, radius 2 px. `html` zemini paper, `scroll-behavior: auto`; `body` `min-height: 100dvh`, `font-synthesis: none`. `themeColor #f3f2ed`, `colorScheme light`.

### 4.2 Tipografi (D4) ve tip ölçeği

Plan: display **Archivo** (Google Fonts, variable, ağırlık 100–900, **genişlik 62–125**): tek dosyadan condensed ultra-bold wordmark ve geniş etiketler; alternatifler Bricolage Grotesque, Big Shoulders; gövde Geist (sonradan Archivo 100), mono Geist Mono; vurgu Archivo italik (serif istenirse Instrument Serif **değil**, PP Editorial New veya Cormorant Garamond italik). Plan ölçeği: wordmark `clamp(72px, 14vw, 220px)` w800 genişlik 70; bölüm başlığı 64–96 px w500 genişlik 90, `letter-spacing −0,02em`; etiketler 11–12 px mono büyük harf `0,08em`; gövde 16–18 px; H1 en fazla 2 satır.

Uygulanan ölçek (`@theme`):

| Token | Boyut | Satır / aralık |
|---|---|---|
| `--text-eyebrow` | `0.6875rem` (11 px) | lh 1.3, ls `0.08em`, uppercase, mono, tabular-nums |
| `--text-body` | `1.0625rem` (17 px) | lh 1.55 |
| `--text-lead` | `clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)` | lh 1.35 |
| `--text-h3` | `clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)` | lh 1.1 |
| `--text-h2` | `clamp(2.5rem, 1.4rem + 5vw, 6.5rem)` | lh 0.96 |
| `--text-wordmark` | `clamp(4.5rem, 1rem + 13.6vw, 14.5rem)` | lh 0.86 |
| `--text-giant` | `clamp(4rem, 19vw, 22rem)` | lh 0.8 (alt bilgi dev isim) |

Bileşen sınıfları: `.wordmark` (Archivo display kesiti, `font-stretch: 62%`, w800, uppercase, ls −0.01em); `.display` (stretch 88 %, w600, ls −0.025em, lh 0.96); `.eyebrow`; `.tnum`; `.hairline`; `.link-underline` (1 px, offset 0.18em, `color-mix(in oklab, currentColor 40%, transparent)` → hover tam); `.tap` (min 2.8rem = 44,8 px). `@utility stretch-62/70/80/90/100`. `em, i` → `--font-archivo-italic`. İsim kilidi: `Alpgiray` + turuncu `/` + `Celik`, 1.35rem. Overlay menü bağlantıları `clamp(3.5rem, 16vw, 7rem)`.

Fontlar (`app/fonts.ts`, `tools/fonts/build.py`, fontTools instancer + subset, OFL): `archivo-display.woff2` **5,9 KB** (statik kesit wdth 62 / wght 800, yalnız büyük harf, rakam, noktalama; `font-stretch 62%`; **preload**, LCP için); `archivo-var.woff2` **74,1 KB** (wdth 62–100, wght 400–900; `preload: false`, `adjustFontFallback: "Arial"` ile düzen kaymaz); `archivo-italic.woff2` **28,8 KB** (wdth 100, wght 400–600, preload yok); `geist-mono.woff2` **15,5 KB** (wght 400–600, `node_modules/geist`'ten). Toplam ≈ 124 KB (devir notu 128 KB), bütçe 140 KB (betik eşiği 153.600 bayt). Unicode aralığı `U+0020-007E, 00A0-00FF, 0100-017F, 2018-201A, 201C-201E, 2022, 2026, 2030, 20AC, 2190-2193, 2212, 2215, 00D7`; özellikler kern, liga, tnum, pnum, lnum, calt, case, ccmp, locl, frac, sups, subs, zero, ss01–ss11 (mono dar liste). OG için statik TTF'ler `app/fonts/og/` (Satori woff2 okumaz): archivo-condensed-800 46 KB, archivo-semi-600 46 KB, geist-mono-500 21 KB.

### 4.3 Motif, doku, çizgi, köşe, ikon (plan §4.3)

- **Kontur çizgileri:** Lando'nun topografik çizgisinin karşılığı gerçek veri: Münih yükselti konturları. `tools/map/build.py`: EU-DEM 25 m (Copernicus) opentopodata `eudem25m` ucu; alan 48,02–48,26° K, 11,36–11,80° D; ızgara 96×64 (~500 m); marching squares; Douglas-Peucker sadeleştirme (TOL 0,9); SVG viewBox 1600×1000; S3 notu: 5 m aralık, 103 kontur, 70 KB SVG / 23 KB gz (diskte 60 KB). Kahraman zemininde yavaş kayar (`contours-drift` 90 s ease-in-out alternate, `translate3d(-52%, -50%)` → `(-48%, -50%)`, yani ±2 %), yalnız `IdleGate` `.is-visible` iken (`animation-play-state`); mask-image ile dikey solma; **mobilde gizli** (`hidden md:block`); düz `<img>` (`fetchPriority="low"`, `decoding="async"`); 404'te de kullanılıyor. B planı: prosedürel akış çizgileri (21st 6766).
- **Gren:** planda "sabit, `pointer-events-none`, `opacity 0.04`, yalnızca koyu sahnelerde"; kodda uygulanmadı.
- **Çizgi sistemi:** 1 px `--line` ayırıcılar (`border-line`), köşe işaretleri planı, "FIG. n" yerine "REC 01 · MENTOR YKS" mono altyazılar (uygulanan: "01 / 04 · Live on iOS and Android", "Real screens · Mentor YKS · Sep 2026").
- **Köşe:** tek ölçek: sahneler 0 (keskin), etkileşimli haplar tam yuvarlak (`rounded-full`); medya `rounded-sm`.
- **İkon:** Phosphor (`@phosphor-icons/react/dist/ssr`), en fazla 6; kullanılan ArrowRight, ArrowUpRight, ArrowLeft, Play, Copy, Check.
- **iPhone çerçevesi** (`iphone-frame.tsx`): vektör, viewBox 430×880, ekran 18..412 × 18..862 (394×844), gövde köşe 70, ekran köşe 52, gövde gradyanı `#5a5a5e → #3c3c40 → #2a2a2d`, çerçeve `#0b0b0c`, Dynamic Island 124×37 r18.5 `#050506`, düğmeler sol 188/252/332, sağ 282.

### 4.4 Hareket dili (plan §8) ve uygulanan parametreler

İlkeler (aynen): "Her hareket bir anlam taşır: giriş (bir kez), kaydırmaya bağlı (scrub/pin), tepki (hover, tık). Sonsuz döngü yalnız M1 ve M5." "Yalnızca `transform` ve `opacity`; blur yalnız giriş ve ≤ 600 ms; `backdrop-filter` yalnız sabit hap ve overlay" (tur 1'de backdrop-filter'lar tamamen kaldırıldı; yalnız VideoLoop Play düğmesinde `backdrop-blur-sm` kaldı). "Hiçbir içerik sekans arkasında beklemez; JS kapalıyken sayfa okunur (sunucu çıktısı tam)." "`prefers-reduced-motion`: Lenis kapalı, giriş yok, scrub son kare, 3D sabit, imleç kapalı." "Mobil: pin yok (düz akış), 3D yok (poster video), hover yok (dokunma eşdeğeri var)."

Araç seti (D8):

| Araç | Ne için | Boyut (gz, plan) | Not |
|---|---|---|---|
| GSAP 3.15 + ScrollTrigger + SplitText + Flip | Pin, scrub, satır maskesi, düzen geçişi | ≈ 35 KB | Ücretsiz; tembel (`lib/motion/gsap.ts`: `loadGsap/loadScroll/loadSplit/loadFlip`, tek söz; ScrollTrigger `ignoreMobileResize`, `refresh` load + fonts.ready + 800 ms sonra) |
| Lenis 1.3 | Yumuşak kaydırma | ≈ 3 KB | `lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false, anchors: true`; yalnız fine pointer ve reduced motion yoksa; kendi rAF döngüsü; `scroll` deposu ScrollTrigger.update'i bağlar; menü açılınca `stop()` |
| three + React Three Fiber (+ drei kurulu, kullanılmıyor) | Kahraman telefonu | ≈ 180 KB hedef, **243–244 KB ölçülen** | Yalnız `/`, LCP sonrası, kapılı; prosedürel gövde + ekran dokusu |
| Motion (`motion/react`) | eski | ≈ 30 KB | Kaldırıldı (iki hareket kütüphanesi olmaz) |
| CSS scroll-driven / CSS geçişleri | Reveal, giriş | 0 KB | Desteklemeyen tarayıcıda son kare |
| View Transitions API | Sayfa geçişi | 0 KB | Kütüphanesiz (React 19.2 kararlıda `ViewTransition` yok) |

Uygulanan hareketler ve sayılar:
- **Reveal** (`[data-reveal]`, `reveal-observer.tsx`): `opacity 0 → 1`, `translate3d(0, 1.5rem, 0) → none`, 0,9 s `--ease-out`, `--reveal-delay` kademesi (kanıt şeridi 50 ms, liste 40 ms, parça listesi 30 ms); IntersectionObserver `rootMargin 0 0 -8% 0`, threshold 0.05, tek gözlemci + MutationObserver; yalnız `html.js`.
- **Giriş (M2)**: `.intro-line` yükselme 0,6 s `--ease-out-expo` (`translate3d(0, 0.18em, 0)`), `::after` kâğıt rengi perde `scaleX 1 → 0` 0,55 s (transform-origin right); `.intro-fade` 0,6 s; `.intro-settle` 0,7 s (scale 0.97). Kahraman gecikmeleri: eyebrow 0, satırlar 0 / 90 ms, cümle 280, NEXT kartı 380, telefon 200, altyazı 520 ms. Film: 0,42 s boş, 0,69 s yerinde.
- **Kontur kayması (M1)**: 90 s, ±2 %, yalnız görünürken.
- **3D telefon (M1)** (`phone-3d.tsx`): idle `rotation.y = sin(t·0.4)·0.12 + pointer.x·0.28`, `rotation.x = cos(t·0.3)·0.04 − pointer.y·0.12`, lerp `min(1, delta·3)`, `position.y = sin(t·0.6)·0.015`; ekran crossfade her 4.200 ms, 700 ms; `frameloop="never"` görünmezken (threshold 0.1) ve sekme gizliyken; dpr [1, 2], fov 24, kamera z 6,5, ACES ton eşlemesi, `alpha`, `antialias`, `powerPreference high-performance`; ışık ambient 0,35 + directional [3,5,6] 1,2 + RoomEnvironment PMREM (0,04); metal `#8d8d92` roughness 0,28 metalness 0,9 envMapIntensity 1,2; arka cam `#1d1d20`; çerçeve `#070708`; island `#050506`; gövde `ExtrudeGeometry` (430×880 birim, derinlik 0,076, köşe 70, pah 0,007, 5 pah segmenti, 32 eğri segmenti); ekran dokuları sRGB, anisotropy 8, `toneMapped: false`; zemin gölgesi `radial-gradient` (filtre yok); sarmalayıcı `inset-[-14%]`, 700 ms solarak gelir, 2D telefon 700 ms solar ve durur. **Kapı** (`phone-scene.tsx`): `load` sonrası `whenIdle` (2.500 ms üst sınır); koşullar: reduced motion yok, `pointer: fine`, `innerWidth ≥ 1024`, `navigator.connection.saveData` kapalı, `webgl2` var; yoksa hiçbir şey yüklenmez, 2D telefon (SSR, `priority` ilk görsel) yerinde.
- **Sticky yığın** (`stack-scenes.tsx`): sahneler `lg:sticky lg:top-0 lg:min-h-svh`, bg ink / ink-2 dönüşümlü; masaüstü ≥ 1024 ve reduced motion yoksa, sonraki sahne "top bottom" → "top top" arasında öndeki iç kap `scale 1 → 0.94`, `opacity 1 → 0.35`, scrub 0,4; JS'siz CSS sticky çalışır.
- **Mentor yelpazesi** (`mentor-fan.tsx`): pozlar x ±46 %, y 6 %, rotate ±9°; masaüstünde "top 90%" → "top 35%" scrub 0,5 ile ortadan açılır; mobil ve reduced motion'da açık durur.
- **Manifesto** (`scrub-words.tsx`): kelimeler sunucuda span; `opacity 0.4 → 1`, stagger 0,08, "top 85%" → "bottom 45%", scrub 0,5.
- **Zaman çizgisi** (`draw-line.tsx`): `scaleX 0 → 1`, "top 85%" → "top 35%", scrub 0,5; mobilde liste.
- **REGU grafiği** (`reveal-clip.tsx`): clipPath `rect` `scaleX 0 → 1` sol merkez, `transform-box: fill-box`, "top 80%" → "top 30%", scrub 0,5; reduced motion ve JS'siz tam çizili.
- **Alt bilgi wordmark** (`wordmark-reveal.tsx`): `yPercent 55 → 0`, "top bottom" → "bottom bottom", scrub 0,6, `overflow-hidden` perde, `text-giant`.
- **İki dünya anahtarı** (`index-switch.tsx`): `role="switch"`, `aria-checked`; Flip görünür alana girince boşta yüklenir; `Flip.from(state, { duration: 0.55, ease: "power3.inOut", stagger: 0.03, absolute: true })`; yüklenmediyse anında sıralama.
- **Hover önizleme** (`hover-preview.tsx`): tek `<video muted loop playsInline preload="none">`, 22rem sabit kutu, imleç + 24 px / − 90 px, lerp 0,18, kaynaklar satırdaki `data-preview-mp4/webm/poster`'dan takılır, 300 ms opacity; yalnız fine pointer + hareket izni; dokunmatikte satırda 192×108 poster (`pointer-coarse:block`).
- **İmleç (M4)** (`cursor.tsx`): 32 px nokta, `scale 0.3`, etkileşimlide (`a, button, [role=button], [role=switch], [data-cursor=hover]`) 1; konum lerp 0,4, ölçek lerp 0,2; renk `[data-scene="dark"]` içinde paper, dışında ink (blend modu yok); `[data-magnetic]` öğeler imlece `0.22` oranında kayar (lerp 0,18), bırakınca 0,35 s `cubic-bezier(0.25,1,0.5,1)`; `html.has-cursor` sistem imlecini gizler, `input/textarea/select`te geri gelir; `useSyncExternalStore` ile `(pointer: fine)` ve reduced motion izlenir.
- **Sayfa geçişi** (`transition-link.tsx`, `route-change.tsx`): `document.startViewTransition` + `router.push`; tıklanan başlık `view-transition-name: vt-title`, proje h1'i aynı ad; kök çapraz solma 0,42 s, başlık 0,55 s `--ease-out-expo`; üst sınır 1,2 s; desteklemeyen tarayıcıda ve reduced motion'da düz gezinme; rota değişince Lenis `scrollTo(0, immediate)`.
- **Video** (`video-loop.tsx`): poster her zaman, `muted loop playsInline preload="metadata"`, görünür alanda (threshold 0.25) oynar, çıkınca durur; reduced motion'da kendiliğinden oynamaz, ≥ 44 px Play düğmesi; webm önce, mp4 yedek.
- **Saat** (`clock.tsx`): `Intl.DateTimeFormat en-GB`, `Europe/Berlin`, HH:mm:ss, 1 s; sunucuda rakam basılmaz (sahte saat olmasın), `min-w-[8ch]` düzen kaymaz.
- **Reduced motion** (`globals.css`): `[data-reveal]` görünür, intro/kontur `animation: none`, view transition `none !important`, bütün animasyon/geçiş süreleri `0.01ms`; `prefersReducedMotion()` sunucuda `true` döner ("hareket hiçbir zaman içeriği bekletmez").

### 4.5 Bütçe (plan §8, teslim ölçütü) ve ölçülen

| Ölçü | Hedef | Ölçülen |
|---|---|---|
| JS uygulama payı (`/`, 3D hariç) | ≤ 120 KB gz (çerçeve ≈ 199 KB ayrı) | ≈ 13 KB uygulama; ilk yük toplam 212–219 KB gz |
| 3D paketi | ≤ 200 KB gz, LCP sonrası, yalnız masaüstü | 243–244 KB gz (kabul, gerekçeli) |
| LCP mobil (yavaş 4G, 4× CPU) | ≤ 2,5 s; masaüstü ≤ 1,5 s | Masaüstü 0,94–0,96 s; mobil benzetimli 3,8–5,2 s (yazılımsal GL şişmesi); gerçek LCP 128 ms |
| CLS | 0 | 0 / 0,005 |
| INP | ≤ 200 ms | TBT 0 masaüstü, 49 ms mobil (tur 2) |
| Kare hızı | 60 fps masaüstü; orta sınıf Android pin sahneleri ≥ 50 fps | Gerçek cihaz turu kullanıcıda |
| Video | Önizleme ≤ 3 MB, 720p, H.264 + AV1/WebM, poster; tam ≤ 12 MB | Döngüler 46 KB–1,3 MB; tam videolar 1,1–6,2 MB |
| Font | ≤ 140 KB | ≈ 124–128 KB |
| Görsel | AVIF/WebP, `next/image`, telefon ekranları ≤ 200 KB | Mentor ekranları ≤ 73 KB webp |
| Kaydırma uzunluğu | Masaüstü 9–11 ekran, mobil ≤ 14 ekran | |

---

## 5. Teknik

### 5.1 Yığın ve sürümler (`package.json`)

`next 16.2.4`, `react 19.2.4`, `react-dom 19.2.4`, `tailwindcss ^4` + `@tailwindcss/postcss ^4`, `typescript ^5`, `eslint ^9` + `eslint-config-next 16.2.4`, `gsap ^3.15.0`, `lenis ^1.3.23`, `three ^0.186.1` + `@types/three ^0.186.0`, `@react-three/fiber ^9.8.1`, `@react-three/drei ^10.7.9` (kaynakta kullanılmıyor), `@phosphor-icons/react ^2.1.10`, `geist ^1.7.0` (yalnız mono font kaynağı), `clsx ^2.1.1`, `tailwind-merge ^3.5.0`. Vercel: Node 22.x, preset Next.js, varsayılan `npm install` / `npm run build`, ortam değişkeni gerekmiyor (`metadataBase` `content/site.ts`'ten); DNS `A 76.76.21.21`, `CNAME www → cname.vercel-dns.com`, www → apex.

### 5.2 Mimari (`app/layout.tsx`)

`<html lang="en" class="no-js …">` + head'de satır içi `document.documentElement.classList.replace('no-js','js')` (reveal ve giriş yalnız JS varsa gizler; JS kapalıyken her şey görünür). Gövdede sırayla: "Skip to content" bağlantısı, `SmoothScroll`, `RouteChange`, `RevealObserver`, `Cursor`, `SiteHeader`, `<main id="main">`, `SiteFooter`. Açılış sırası (`app/page.tsx`): Hero, Proof, Shipped, Building, Manifesto, IndexSwitch, Parts, Timeline, About (+ Footer kapanış). Veri tek kaynak: `content/site.ts` (isim, konum, koordinat 48.1374/11.5755 "48.14° N, 11.58° E", e-posta, müsaitlik "13 to 17 week full-time internship" / "May, June or July 2027", nav, eğitim, zaman çizgisi `precision: month|year|plan`, sertifikalar) ve `components/projects/project-data.ts` (7 proje, `kind: shipped|building`, `media: screens|video|schematic`, `metric {value,label,source,asOf}`, `stats` kanıt şeridi: 70,000+ Downloads / 12,000+ Monthly active / 1,500+ New users a month / 4 Products shipped / 60 to 5 min Per brake test case, `AS_OF "Sep 2026"`; `mentorFigures`; `reguExample` altın çıktıdan 13 noktalı seri; `partsList()` stack alanından türetilir). Veri öznitelikleri: `data-reveal`, `data-magnetic`, `data-scene="dark"`, `data-vt`, `data-project`, `data-preview-*`, `data-row/data-flip-id`, `data-pose`. Kabuk: fixed header, isim kilidi (`data-magnetic`), cam hap nav (`border-line bg-paper shadow`, "Available May 2027" + sinyal noktası), mobilde "Menu" düğmesi → `role="dialog" aria-modal`, `data-scene="dark"`, ilk öğeye odak, Tab tuzağı, Escape, `scroll.stop()`; alt bilgi koyu bant: müsaitlik h2, e-posta hapı + `CopyEmail` (`navigator.clipboard`, yoksa mailto), 4 bağlantı, dev isim, şehir + saat + koordinat + ©. 404: kontur zemin, "404 · Not found", wordmark "Not / found", tek çıkış. OG: `next/og` Satori, 1200×630, kâğıt zemin, mono eyebrow + sinyal noktası, condensed başlık 150/210 px, sabit renkler (`lib/og.tsx`, tek istisna). `sitemap.ts`, `robots.ts`.

### 5.3 Fontlar, görseller, videolar

- Fontlar: `next/font/local`, altkümeler `python3 tools/fonts/build.py` (ayrıntı §4.2). Preload yalnız display kesiti; gövde CSS ilk kullanımda iner.
- Görseller: Mentor ekranları `public/media/mentor/*-{480,960}.webp` (bulanıklaştırılmış kopyalar) `next/image` ile (`sizes` tanımlı, ilk ekran `priority`); portre `public/portrait/alpgiray.jpg` 3024×4032, EXIF/GPS temizlenmiş, About'ta 4:5 `object-cover`, dosya yoksa bölüm fotoğrafsız (`existsSync`); kontur SVG düz `<img>`; app ikonu `app/icon.svg`.
- Videolar: `python3 tools/media/build.py [slug…]` (imageio-ffmpeg): tam `<slug>.mp4` 1280 genişlik 30 fps libx264 preset slow CRF 26 yuv420p high 4.0 faststart ≤ 12 MB; döngü `<slug>-loop.mp4` 6 sn 960 px 24 fps CRF 28 ≤ 3 MB; `<slug>-loop.webm` VP9 `-b:v 0 -crf 36 -deadline good -cpu-used 2 -row-mt 1`; poster JPEG `-q:v 4` 1280 px; bütçe aşılırsa CRF +2 ile yeniden (40'a kadar), yine aşarsa çıkış 1. `LOOP_START`: agnes 30,0 / apex-coach 8,0 / chainsense 10,0 / gtm-zero 9,0 / regu 29,5; `CROP` apex `482:1040:690:178` (dikey); `POSTER_AT` regu 0,5. Ham kaynaklar `assets/video-src/` (agnes 49,8 s 2534×1440; apex-coach 57,4 s 1856×1388; chainsense 63,7 s 2534×1440; gtm-zero 46,9 s 2940×1664; regu 41,6 s 2940×1666), 182 MB, siteye doğrudan girmez. Çıktı bugün: agnes 6,15 MB / loop 0,70 mp4 + 1,30 webm; apex 1,83 / 0,14 + 0,14; chainsense 2,10 / 0,13 + 0,11; gtm-zero 1,10 / 0,05 + 0,08; regu 2,43 / 0,24 + 0,28; dizin ≈ 16,7 MB.

### 5.4 Betikler

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme |
| `npm run check` | `eslint` + `tsc --noEmit` + `next build` (her adımdan önce) |
| `npm run start` | `next start -p 3300` |
| `npm run audit:pages` | `node tools/olcum/sayfa-denetimi.mjs http://localhost:3300` |
| `npm run e2e` | `node tools/olcum/uctan-uca.mjs http://localhost:3300` |
| `python3 tools/fonts/build.py` | Font altkümeleri |
| `python3 tools/media/build.py` | Video boru hattı |
| `python3 tools/map/build.py` | Kontur SVG (`.cache/map/grid.json` önbellek; `STEP`, `TOL`, `OUT` env) |
| `node tools/arastirma/site-yakala.mjs <url> <slug> <outdir>` | Referans site yakalama |

### 5.5 Ölçüm araçları nasıl çalışır

**`sayfa-denetimi.mjs`** (Playwright, `/opt/pw-browsers/chromium`, 1280×900; yol verilmezse `/` + 7 proje sayfası; çıkış kodu bulgu varsa 1). Her sayfada: HTTP 200; tam bir `h1`; başlık atlaması yok; `main/header/footer` var; `lang=en`; her `img`'de `alt`; her `a/button`un erişilebilir adı; `ul/ol` içinde yalnız `li`; her `video` `muted`, `playsinline`, `poster`; yasaklı metin desenleri (gizli ve script/style hariç gövde metni); **375 ve 1280 px'te sıfırdan yüklenerek yatay taşma**; **klavye turu**: her odaklanabilir öğeye `data-tour-id`, 200 Tab'a kadar, gizli öğeye odak, odak halkası (`outlineWidth` 0 ise bulgu), **≥ 44 px dokunma hedefi** ("Skip to content" hariç), hiç durak yoksa bulgu; konsol hataları ve `pageerror`. Baştaki tuzak notu: "Dokunma hedefi kontrolün kendisi değil, kontrol ile etiketinin büyüğü. Klavye turu iki durağı 'aynı görünüyor' diye eleyince erken bitiyor; her öğeye benzersiz işaret konuyor. Odak halkası yalnızca gerçek Tab ile çıkıyor; `focus()` çağırmak yetmiyor. Yatay taşma her genişlikte sıfırdan yüklenerek ölçülüyor."

**`uctan-uca.mjs`** (masaüstü 1280×900 + pano izni; mobil 390×844 dokunmatik): açılış h1; `main [data-project]` sayısı = 7; BUILDING satırından `/work/gtm-zero`'ya geçiş, h1 "GTM-ZERO", en üstten başladı; sonraki proje (`nav[aria-label="Next project"]`) en üstten; hap "About" bölüme kaydırdı (|top| < 120); footer saati `HH:MM:SS`; "Copy email" → "Copied"; konsol hatası yok; mobil: Menu → dialog açık, Escape kapattı, menüden Work'e gidildi, 390 px taşma 0, konsol hatası yok. 14 adım.

**Lighthouse (komut aynen):** `CHROME_PATH=/opt/pw-browsers/chromium npx lighthouse@12 http://localhost:3300/ --output=json --chrome-flags="--headless=new --no-sandbox --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader"`. Bilinen yanlış alarmlar: bu konteynerde mobil sayılar şişer (yazılımsal GL, zayıf CPU; LCP 3,8–5,2 s koşudan koşuya oynuyor; REGU'da da aynı, token-analizi §19: `/` sayfasının TBT'si yazılımsal WebGL yanlış alarmıdır), masaüstü güvenilir; gerçek ölçü PageSpeed Insights ve gerçek cihaz. Maskeli başlık LCP'ye girmiyordu (5,6 s), kontur mobilde LCP adayı sayılıyordu, gövde fontu LCP öncesi 74 KB kritik bayt: üçü de düzeltildi. REGU kuralı: "Yanlış alarm üretirlerse önce aracı sorgula." Başsız tarayıcı akıcılığı ölçmez; gerçek cihaz turu (`docs/06` §3): iPhone Safari (giriş, sahneler düz, posterler), orta sınıf Android Chrome (takılıyorsa ilk şüpheli kontur SVG'si), masaüstü Chrome/Safari (3D LCP sonrası, imleç, mıknatıs), reduced-motion.

---

## 6. Bu projede işe yarayacak fikirler (BMW ürün yöneticileri için koyu, premium veri-ürün açılış sayfası; kahraman etkileşimli tel kafes küre, üç tıklanabilir bölge: Çin, ABD, AB; hover parlama + dış çizgi; tıkla-yakınlaş)

1. **Küreyi "tek nesne" olarak sat, her şeyi ona bütçele.** Araştırmanın en sağlam örüntüsü: ödüllü sitelerde tek fikir, tek nesne (6/68'de kahramanda tek 3D nesne; Lando kask, Moto Card kart + kaide, Hubtown mavi küp, Studio Null cam piramit, Igloo tel kafes iglo). utsubo kuralı "sell one object properly": nesne ışıkla anlatılır, metin ikinci planda; başka hareketli zemin yok ("Aynı anda birden çok hareketli zemin" yasak). Küre dışında shader/parçacık zemini koyma; tek canvas (çoğunluk 1 canvas, 3+ yalnız 5 site).
2. **Tel kafes → teknik çizim katmanı dili.** Sharplink (Studio Freight): patlatılmış 3D nesne + ince kutular, kesikli bağlantı çizgileri, köşe işaretleri, mono büyük harf etiketler; Igloo: tel kafes nesnenin kurulması; Together AI: 3D + mono etiket. Küre için: üç bölge etrafında mono etiketler (`CN · US · EU`), kesikli yönlendirici çizgilerle gerçek KPI kutularına bağlantı, köşe `+` işaretleri, Eduard Bodak tarzı mono kodlar. Dürüstlük kuralı: her kutudaki sayı gerçek bir veri alanından ve kaynak + tarih satırıyla ("Source: … · as of …" örüntüsü, `proof.tsx`).
3. **Hover: parlama değil, dış çizgi + tek vurgu.** Yasaklı §3: "neon glow (`box-shadow` renkli)" ve "aynı hover'ı her şeye" yasak; §4: bileşen başına bir hareket fikri. Bölge hover'ında mesh kenar çizgisini (stroke/emissive) tek vurgu rengine çevir, hafif opaklık artışı; sayfa düzeyinde "glow" yok. İmleç noktasını etkileşimli öğede büyüt (`cursor.tsx`: scale 0,3 → 1), bölge düğmesine `data-magnetic` (0,22 çarpanı) uygula. Hover'a bağlı bilgi yasak: üç bölgenin adı ve verisi dokunmatikte ve klavyede de görünür (küre altında üç gerçek `button role="switch"`/sekme, `focus-visible` 2 px halka, ≥ 44 px).
4. **Tıkla-yakınlaş: kamera lerp'i, kaydırma ele geçirme yok.** Telefon paralaksındaki yöntem: hedef açıyı belirle, her karede `min(1, delta·3)` ile yaklaş; kaydırmayla değil tıklamayla tetikle (scroll-jacking ve sanal kaydırıcı yasak; Léo Parpeix/Hubtown/Locomotive örneklerinde klavye ve ekran okuyucu kayboluyor). Geri dönüş düğmesi; reduced motion'da anında kesme; yakınlaşınca bölgenin verisi HTML'de (canvas içinde metin değil) gelsin ki SSR ve erişilebilirlik korunsun.
5. **M1 idle kuralı:** küre yalnız görünürken döner (`IntersectionObserver` threshold 0,1 → `frameloop="never"`), sekme gizliyken durur, imleç paralaksı küçük (x·0,28, y·0,12), `prefers-reduced-motion`'da donuk kare. Lenis ve ScrollTrigger'ı tek rAF döngüsü üstünden bağla (`scroll.onScroll(() => ScrollTrigger.update())`).
6. **Kapı yok, ilk kare içerik, 3D LCP sonrası.** 21/68 site kapılı, SOTY'de 6/8; jüri affediyor, kullanıcı affetmiyor; Gil Huybrecht %99'da kaldı, Active Theory tarayıcı eledi. Uygulanan yöntem birebir alınabilir: `phone-stage` deseni = 2D poster/SVG her zaman SSR (LCP adayı), 3D `load` sonrası `whenIdle` (2,5 s üst sınır) ve kapı (WebGL2 + `pointer: fine` + ≥ 1024 px + `saveData` kapalı + reduced motion yok), hazır olunca 700 ms çapraz solma. Küre için 2D yedek: aynı üç bölge işaretli statik SVG tel kafes (JS kapalı ve mobilde de çalışır). Giriş ≤ 600 ms, metni gizleme, üstüne perde koy (maskeli başlık LCP'yi 5,6 s'ye atmıştı).
7. **Koyu premium palet kuralları:** saf `#000` yasak; ölçülen kırık siyahlar `#0F0F10` (P1 ink), `#0D0D0F` (Gil Huybrecht), `#121212` (Elliott), `#0B0B0C` (P4), `#1D2440` lacivert (Trevor Noah), `#181D21` (Boc); tek vurgu rengi, mor→pembe gradyan ve gradyan/shimmer metin yasak; koyu zeminde turuncu okunur (LxL kanıtı), vurgu küçük metinde kullanılmaz (3,9 yalnız büyük). Koyu sayfada bile **ritim**: açık veya daha açık bant (`ink` / `ink-2` dönüşümü, Sharplink açık/koyu bant, Paul Kalkbrenner bölüm başına düz zemin). Hareketli zeminde kontrast **kare kare** ölçülür. Gren istenirse sabit, `opacity 0.04`, yalnız koyu sahnede.
8. **Üç sesli tipografi:** condensed display (Archivo genişlik ekseni 62 %, w800, ls −0,01em, lh 0,86) + gövde (Archivo 100 %, 17 px / 1,55) + mono etiket (Geist Mono 11 px, 0,08em, uppercase, tabular-nums); büyük başlıkta negatif aralık (20/43 site; −0,025em display); H1 ≤ 2 satır; tek aile ile SOTD mümkün (bleibtgleich Akzidenz, Paul Kalkbrenner ABC Diatype). Kaçın: Inter + slate-900 + hap etiketler (Brittany Chiang kalıbı, "LLM varsayılanı"), Instrument Serif vurgusu (AI tell). Yalnız büyük harf ve rakam içeren 6 KB statik display kesiti preload; gövde fontu `adjustFontFallback` ile preload'suz.
9. **Mono spec sheet / kanıt şeridi:** Elliott Mangham'ın beş sütunlu mono spec sheet'i, Lando'nun "NEXT RACE" kartı ve istatistik hücreleri (PREVIOUS / CURRENT / NEXT), Lama Lama'nın mono alt şeridi (sayılar + canlı saat tek satırda), Noho'nun kaynaklı rakam kartları. BMW için: bölge başına mono `dl` (MARKET · MODELS · DATA POINTS · UPDATED), kanıt şeridi 5 sütun `divide-x`, sayı anında (count-up yasak), altında "As of … Sources: …". "SECTION 01" yerine bilgi taşıyan etiket ("CN · 3 PLANTS · 2026-Q3").
10. **Kaydırma koreografisi (yalnız transform/opacity, GSAP boşta yüklenir):** sticky yığın (sonraki bölüm gelirken öndeki `scale 0.94`, `opacity 0.35`, scrub 0,4; CSS sticky JS'siz çalışır), kelime kelime opacity scrub (0,4 → 1), çizgi çizimi (`scaleX`), SVG clipPath ile grafik serilerinin soldan açılması. Mobilde pin yok, düz akış; reduced motion'da son kare. 21st yöntemleri: 1755 scroll-expansion, 1953 cards stack, 4906 svg-follow-scroll, 7741 motion-footer; bileşen değil yöntem, token'larla yeniden yaz.
11. **Veri grafiği bir sahne olsun:** `regu-chart.tsx` yöntemi: SVG `viewBox`, mono etiketler, kesikli seri (bulut) vs vurgu rengi seri (lokal), kırılma noktası işareti, `role="img"` + `title`/`desc`; **mobil için ayrı dar viewBox** (900 birimlik grafik 340 px'te 4 px yazı veriyordu); alt bilgi `figcaption` ile 4 hücreli özet + kaynak. Bölge karşılaştırması için aynı kalıp (üç seri, tek vurgu + iki nötr ton; kategorik renkler doğrulayıcıdan geçirilir).
12. **Hover video / görsel önizleme:** tek `<video preload="none">` imleci izler (lerp 0,18, +24/−90 px), kaynaklar satırdaki `data-*`'dan takılır; dokunmatikte satır içi poster. Video kuralları: `muted playsInline preload="metadata"`, poster şart, görünürken oynar, reduced motion'da Play düğmesi; boru hattı 720p H.264 ≤ 12 MB, 6 sn döngü ≤ 3 MB mp4 + VP9, poster JPEG; ham dosya repoda kalmaz.
13. **İmleç ve mıknatıs:** yalnız `pointer: fine`, sistem imleci gizli, nokta 32 px × 0,3, blend modu yok (tüm sayfayı kompozitlemek kasıyordu), zemine göre renk (`data-scene`), kütüphanesiz rAF lerp; `useSyncExternalStore` ile matchMedia (React 19 lint kuralı). Koyu zeminde nokta rengi kâğıt.
14. **Sayfa geçişi ve kabuk özeni:** View Transitions API (paylaşımlı `vt-title`, 1,2 s üst sınır, desteklemeyen tarayıcıda düz gezinme), rota değişince en üstten; cam hap gezinme + "Available …" sinyal noktası ve metin; overlay menü `role=dialog`, odak tuzağı, Escape, kaydırma durur; canlı saat (sunucuda sahte rakam yok), koordinat satırı (Boc.Studio `41.4120° N, 2.1580° E`; BMW için Münih `48.14° N, 11.58° E`), dev wordmark perde altından (`yPercent 55 → 0`), numaralı mono "01 / 04", yıl damgası, "two worlds" anahtarı (Lando ON/OFF; GSAP Flip 0,55 s power3.inOut; `role="switch"`) → bölge anahtarı CN/US/EU satırları yeniden sıralar.
15. **Yükleme ve bütçe:** uygulama JS ≤ 120 KB gz (çerçeve ayrı), 3D paketi LCP sonrası ≤ 200 KB hedef (three çekirdeği tek başına ≈ 200 KB; ölçülen 243 KB, bu yüzden küre için drei/postprocessing eklemeden önce ölç; Spline runtime ~1 MB "ALMA"), fontlar ≤ 140 KB, LCP mobil ≤ 2,5 s, CLS 0, INP ≤ 200 ms, 60 fps masaüstü / ≥ 50 fps orta sınıf Android; `whenIdle` üst sınır 4 s; GSAP eklentileri tek söz ile tembel; ScrollTrigger `refresh` load + fonts.ready + 800 ms.
16. **Ölçmeden teslim yok:** denetim betiğini port et (h1 sayısı, başlık sırası, landmark'lar, alt, erişilebilir ad, video öznitelikleri, yasaklı metin regex'i, 375/1280 px taşma, 200 duraklı klavye turu ile ≥ 44 px ve odak halkası, konsol hataları), uçtan uca akış, Lighthouse (swiftshader bayrakları; mobil sayılar konteynerde şişer, masaüstü güvenilir, gerçek ölçü PSI + cihaz), reduced motion ve JS kapalı turu, CSS'siz okunurluk (Uncommon Studio dersi).

**Kaçınılacaklar (araştırmanın ve listenin doğrudan söyledikleri):** preloader/yüzde sayacı/ses kapısı/jest kapısı; "Scroll to explore"; sonsuz marquee (yalnız hıza bağlı M5); logo duvarı ve testimonial; sayı sayma; eşit üç kart/bento; glow/spotlight kartlar; gradyan/shimmer metin; mor/neon shader zeminler (Aurora, Background Paths, Beams, Siri Orb); Aceternity "container scroll" ve "hero parallax"; typewriter; tema anahtarı (iki tema iki ölçüm); dock'lar; yatay kaydırma/sürükleme (dokunmatikte zayıf, Rauno'da taşma ölçüldü); slayt destesi/snap; sanal kaydırıcı; `backdrop-filter` yaygın kullanımı (kaldırıldı); `mix-blend-mode` imleç; DRM video; ağır medya (160–261 MB örnekleri); 40–123 script; hazır küre bileşenini (Magic UI 171, COBE 7686, interactive-globe 6863) olduğu gibi yapıştırmak: 21st'te "ALMA" gerekçesi bu projede tek nokta olmasıydı; üç bölgeli BMW küresi içerik taşıdığı için gerekçe düşer, ama kural aynı: önce render + ölç, sonra yöntemi al, token'larla yeniden yaz.

İlgili dosyalar: `/home/user/portfolio/docs/01-arastirma-2026-09.md`, `/home/user/portfolio/docs/02-yasakli-liste.md`, `/home/user/portfolio/docs/03-plan-taslak.md`, `/home/user/portfolio/docs/05-oturum-devir.md`, `/home/user/portfolio/docs/06-yayin.md`, `/home/user/portfolio/app/globals.css`, `/home/user/portfolio/app/fonts.ts`, `/home/user/portfolio/components/home/phone-3d.tsx`, `/home/user/portfolio/components/home/phone-scene.tsx`, `/home/user/portfolio/components/home/phone-stage.tsx`, `/home/user/portfolio/components/home/hero.tsx`, `/home/user/portfolio/components/home/contours.tsx`, `/home/user/portfolio/components/scenes/regu-chart.tsx`, `/home/user/portfolio/components/scenes/stack-scenes.tsx`, `/home/user/portfolio/components/motion/cursor.tsx`, `/home/user/portfolio/components/motion/smooth-scroll.tsx`, `/home/user/portfolio/components/motion/transition-link.tsx`, `/home/user/portfolio/components/site/header.tsx`, `/home/user/portfolio/components/site/wordmark-reveal.tsx`, `/home/user/portfolio/lib/motion/gsap.ts`, `/home/user/portfolio/tools/olcum/sayfa-denetimi.mjs`, `/home/user/portfolio/tools/olcum/uctan-uca.mjs`, `/home/user/portfolio/tools/media/build.py`, `/home/user/portfolio/tools/fonts/build.py`, `/home/user/portfolio/tools/map/build.py`, `/home/user/portfolio/package.json`.