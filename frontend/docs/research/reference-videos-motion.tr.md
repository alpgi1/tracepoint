# Yedi referans video: hareket (motion) analizi

Kareler: `/tmp/claude-0/-home-user/a38dc448-1c77-5c07-9b89-d556855f388f/scratchpad/video-frames/<slug>/`
- `f01..f40.jpg` (960 px, 1 fps; 40 s'den uzun videolarda fps=40/süre), `sheet.jpg` (4x10 kontak sayfası)
- `hero/h01..h24.jpg` + `hero-sheet.jpg` (ilk 6 s, 4 fps)
- `mid-sheet-*.jpg`, `*-10fps.jpg`, `*-crops.jpg` (geçişler için 4-10 fps yoğun örnekler ve kırpmalar)

Hepsi 1280x800, VP8, 25 fps. Süreler: art-yakushev 39.96 s, bleibtgleich 40.6 s, elliott-mangham 30.48 s, landonorris 47.04 s, mevcut 29.6 s, noth-in 39.88 s, wodniack 40.2 s.

## 0. Ölçüm notları (süreleri okurken şart)
- Kayıtlar otomatik (Playwright, pointer yok): **hover ve imleç davranışı hiçbir videoda kaydedilmemiş**; "cursor" satırları bu yüzden zayıf kanıtlı. Hover önemliyse 2-3 siteyi elle, fare ile tekrar çekmek gerekir.
- Her kayıt ~1-1.5 s beyazla başlar (kaydedici gezinmeden önce açılmış). Uzun beklemeler (art-yakushev 17 s siyah, landonorris 30 s loader) konteynerin yavaş ağı; tasarım kararı değil. Loader'ların "ne yaptığı" güvenilir, "ne kadar sürdüğü" değil.
- 10 fps örneklerde kareler ikişer ikişer tekrarlıyor: headless render ~5 fps. Bu yüzden 200 ms altı tween'ler "kesme" gibi görünür; "≤200 ms" yazdığım yerlerde kısa bir tween de olabilir.
- art-yakushev'de hero videosu DRM'li ("Protected playback is unavailable" diyaloğu bulanık görünüyor), landonorris'te WebGL dokuları yüklenmemiş (yalnız düşük kontrastlı siluet katmanı var). Bu iki hero'nun gerçek içeriği bu kayıttan değerlendirilemez.

## 1. art-yakushev (39.96 s)
- **0-3 s:** beyaz (kayıt), sonra saf siyah. Siyah 16.5 s'ye kadar sürer (preloader, varlık bekliyor).
- **Preloader:** 16.5-17.25 s "A®" monogramı ~20 px blur'dan netleşerek belirir (≈750 ms, ease-out). 4.5 s bekler. 21.75-32.0 s: A ve ® birbirinden uzaklaşır, **hızlanarak** (ease-in; aralık yaklaşık her 2.5 s'de ikiye katlanıyor, yükleme ilerlemesine bağlı okunuyor). 32.25 s'de harfler viewport kenarlarına **oturur** (≤250 ms) ve ekranın sol/sağ kenarında dikey ortada nav olarak kalırlar (nadir bir yerleşim). Aynı anda altta hero içerik belirir.
- **Hero:** ortada bulanık katman (backdrop blur kullanımı), üstte tek satır "…for companies and brands that decide to move forward." 36.5-40 s: devasa serif kelime markası ("Ya…kushev") alt kenardan sabit hızla yükselir (~270 px/s @1280), lerp'li smooth-scroll ya da yavaş zamanlı reveal.
- **Easing karakteri:** blur-in yumuşak; ayrılma ivmeli (ease-in); kapanış "snap". Genel his çok yavaş, kasıtlı.
- **Bölüm geçişi / metin:** blur-to-sharp (logo), alttan yükselme (wordmark). Split harf yok.
- **Cursor/hover/küre/partikül:** yok (görülmedi).
- **Premium okunan:** aşırı sadelik; siyah zemin, iki glif, tek serif wordmark; her şeyin ağır olması.

## 2. bleibtgleich (40.6 s)
- **0-3 s:** beyaz, sonra 8 s'ye kadar açık gri (#f2f2f2) boş sayfa; üstte 4 ince grid çentiği var (ızgara iskeleti içerikten önce çiziliyor).
- **Preloader:** 8.0 s meta etiketler ("Based in Kyiv / Working w/ TFTL", "Designer & Developer", ince dikey cetvel), 8.75 s "Menu" hapı. 8.0-9.0 s sol altta siyah bir leke **eriyerek** "100%" olur (sıvı distorsiyon, feTurbulence/feDisplacement tipi), 9.0-9.5 tutar, 9.75-10.5 tekrar lekeye eriyip kaybolur. 10.75 s alt köşelerde sabit soluk filigran "bleibt / gleich" belirir (sayfa boyunca sabit).
- **Hero:** 12.0 s siyah dikdörtgen (görsel yer tutucu) + başlık "Maksym Bleibtgleich / Design Digital Products," tamamen erimiş halde gelir, **~2 s içinde netleşir** (12.0→~14.0). 15.5 s ikinci blok "UX/UI & Web-flow". Başlık satırları sola kademeli girintili (İsviçre tipografisi).
- **Bölüm geçişleri:** 17.25 "Work 24-26". 19.9-21.3 s: eğik (rotateX/Y) küçük proje kartları **tek tek pop** eder (100-300 ms aralık), başlığın etrafında ~9 kartlık bir halka + ortada bir kart oluşur. Kaydırmayla kartlar yukarı uçar; "Work" ve "24-26" birbirine **yaklaşır** (scroll'a bağlı tracking) ve 22.6 s'de altı çizili "All Works" linkine dönüşür. Her başlık aynı erime efektiyle gelir ("Awards & Recognitions" ~0.6 s, "Everything that exists"). 25 s civarı "(10 : [küçük görsel] : 38)" saat benzeri gösterim, footer "nothing more than a sentence." + üç yuvarlak düğme.
- **Cursor:** 11.6 ve 15.75 s'de başlığın yanında küçük yumuşak gri nokta; özel imleç olabilir (düşük güven).
- **Easing:** erime uzun kuyruklu (üstel sönüm gibi); kart pop'ları hızlı; başlık yakınsaması scroll ile lineer.
- **Premium okunan:** tek imza efektin (erime) sayaçtan her başlığa tutarlı kullanımı; içerikten önce çizilen ızgara; sabit filigran; "nesne" gibi duran eğik küçük kartlar.
- **Not:** SVG filtre distorsiyonu CPU'da rasterize edilir; büyük metinde pahalıdır.

## 3. elliott-mangham (30.48 s)
- **0-3 s:** beyaz, 1.5 s koyu zemin, **2.0 s'de iki paragraflık giriş metni ekranda** (giriş animasyonu ≤250 ms; preloader yok).
- **Hero koreografisi (veri gelişi):** 5.3-5.9 s etiket çipleri ("Awwwards /CSSDA /FWA /GSAP", "Avg. project costs", "Client Portfolio", "Highlights", "Previous") genişlik 0→%100 **yatay wipe** (~500 ms). 5.9-7.0 s beş mono sütun aynı anda **satır satır** açılır (~100 ms/satır, satırlar soldan kırpılarak, daktilo/decoder hissi; 12 satır ≈1.1 s). Kesikli "SCHEDULE CALL / COST ESTIMATE" düğmeleri en son. 7.25 s "SCROLL ———" ipucu çizgisi. 8.2-8.5 s alt kart şeridi **yalnız opacity ile** 300 ms'de gelir (translate yok), gelirken zaten kayıyor. 8.6 s paragraf altında "Projects ⓘ / Awards ⓘ" segmentli hap.
- **Hero hareketi:** şerit sola sürekli lineer marquee, ~27 px/s (bir kart genişliği ≈8 s). Başka hiçbir şey hareket etmiyor; tek ekran, pin/scrub yok.
- **Cursor/hover:** yok. **Küre/partikül:** yok.
- **Premium okunan:** yoğunluk ve disiplin: mono spec-sheet, çip etiketleri, çok sütunlu ızgara; hareket yalnız "verinin gelişi" olarak kullanılmış. Veri ürünü için en doğrudan transfer edilebilir dil.

## 4. landonorris (47.04 s)
- **0-3 s:** beyaz, 1.75 s neon sarı-yeşil tam ekran + altta minik "LANDO NORRIS". 3.5 s ortada "LN" monogramı **pop** eder (tween görülmedi).
- **Preloader anlatısı (adımlı):** ~7.6 s LN → "L" (N katlanıp kaybolur), 9-20 s "L" küçülüp tek vuruşa iner, 20-26 s küçük tik "'" , 26.2 s beyaz italik **"4"** (yarış numarası) pop eder (≤100 ms; ince diyagonal çizgiyle ikiye ayrılmış, tik içinde kalır), ~5 s tutar, 31.3→31.4 s hero'ya **sert kesme** (wipe yok).
- **Hero:** kırık beyaz zemin, ince topografik kontur çizgileri, düşük kontrastlı gri siluetler (dokusuz 3D katman), sol üst "LANDO NORRIS" (hayalet gri), orta üst "LN", sağ üst neon "STORE" + menü, sol alt "NEXT RACE / BAKU GP / McLaren F1 since 2019" bilet kartı. **32-36.5 s arasında hiçbir idle hareket ölçülemedi** (siluet ve konturlar piksel piksel aynı).
- **Bölüm geçişleri:** 37.0 s wordmark siyaha döner, bilet kaybolur, siluet halka+loblara dönüşür; 42.0 ve 46.0 s'de başka siluetler. Her değişim ≤500 ms; scroll'a bağlı durum değişimi.
- **Cursor/hover:** yok. **Küre:** yok (harita dokusu var).
- **Premium okunan:** tek neon ton + siyah, monogramdan numaraya giden loader hikayesi, harita dokusu, bilet widget'ı. Gerçek 3D içerik bu kayıtta yok; 3D hareketi buradan yargılama.

## 5. mevcut (kullanıcının eski portfolyosu, 29.6 s), taban çizgisi
- **0-3 s:** 0.75 s önce nav şeridi ("AC", work/about/contact) beyaz sayfada; 1.0 s zemin açık griye atlar, "Alpgiray Celik" %20 opaklıkta; 1.0-2.0 s başlık opacity ile belirir (~1 s), 1.75-2.5 s mavi vurgulu alt satır, 2.5-3.5 s mono rol satırı, 3.0-4.5 s meta satırı. Zemin 1.0→4.5 s arasında açık griden koyu antrasite **~3.5 s'lik** uzun geçiş.
- **Hero:** canvas akış alanı (kısa beyaz kavisli çizgiler, her karede değişiyor, sürekli animasyon); zeminle birlikte kararıp görünmez hale geliyor. Preloader yok.
- **Scroll:** 10-11 s'de düz smooth scroll; "// selected work" kartları, "// stack", "// about", "// contact" ("Let's build something."). **Bölüm reveal'ı yok** (girerken zaten opak), pin/scrub yok, imleç/hover kaydı yok. Nav'da aktif bölüm için nokta işareti.
- **Easing:** yalnız opacity; stagger aralığı 0.5-0.75 s (4 satır için toplam ~3.5 s, yavaş).
- **Değerlendirme:** "opacity-only" koreografi; scroll'a ya da etkileşime bağlı hiçbir şey yok; tek canlı öğe akış dokusu ve o da kararıp siliniyor. Jenerik koyu dev-portfolyo dili.

## 6. noth-in (39.88 s)
- **0-3 s:** beyaz, 1.5 s siyah, 1.75 s alt ortada minik "000" sayacı.
- **Preloader:** 3.5-4.5 s sayaç 000→100 (<1 s). 4.75 s ortada küçük kalın "N'" pop. 5.0 s N ile ' ayrılıp bir yuva açar; 5.5-5.75 s yuvaya 3D nesne (örgü kalp) ölçeklenerek girer. 7.75-13.0 s nesneler **flipbook gibi değişir** (mavi dikenli yıldız, beyaz parıltı, pembe tüylü top, gümüş buruşuk folyo, mavi yastık küp, kalp, pembe halka, krom smiley…), her biri 250-500 ms, tween yok; bu sırada sayaç **100→000 geri sayar** (8.5→12.5 s, ~20 birim/s). 13.25 s yuva kapanır ("N'").
- **Hero reveal:** 14.2-15.0 s alttan beyaz panel wipe (≈800 ms, ease-out). 14.6-15.9 s "NOTHIN'" harfleri taban çizgisinin altından **~100 ms stagger** ile yükselir; **O en son, alçak ve dönük gelir, yuvarlanarak yerine oturur** (hafif overshoot), apostrof en son; toplam ≈1.3 s. Wordmark oturduğunda nav (N', LINKEDIN / INSTAGRAM / EN, MENU) zaten yerinde.
- **Bölüm geçişleri:** 16.3-19.6 s siyah panel wordmark'ı örterken wordmark altında paralaksla kayar (kayıt yavaş kaydırdığı için uzun), 19.8 s beyaz manifesto "Most brands produce content. / We prefer ideas." (harf animasyonu yok). 27.5 s "WORKS" siyah bant, proje görselleri, koyu iletişim bölümü; **footer'da aynı harf-yükselme animasyonu tekrar oynar** (32.5-33.5 s).
- **Cursor/hover:** yok. **Küre/partikül:** yok; 3D nesneler var.
- **Premium okunan:** iki yönlü sayaç, render nesne flipbook'u (stüdyo gösterisi), sert siyah/beyaz kesmeler, imza animasyonun footer'da tekrarı.

## 7. wodniack (40.2 s)
- **0-3 s:** beyaz, 1.5 s düz kırmızı (#f50a3c civarı). 2.25-3.5 s ortada küçük siyah "çubuk" ikon çubuk çubuk dolar (4-5 dikey çubuk, ~300 ms/çubuk, sinyal göstergesi gibi), sonra 9.2 s'ye kadar bekler.
- **Hero inşası:** 9.3 s ekranın %72-90 yüksekliğinde kalın siyah bant belirir (başlığın maske bloğu); bandın üst kenarından iki uçta ince çizgi "tepeleri" filizlenip merkeze doğru büyür (9.3→10.6, ≈1.3 s) ve tam genişlikte **dalga gibi yer değiştiren dikey çizgi alanı** oluşur (sırt sürekli hareket ediyor); bant ~10.0 s'de incelip kaybolur. Loader ikonu 10.3 s'de ortadan ayrılır, 11.9 s'de **sol üstte nav logosu olarak** durur (loader = logo). 11.3 s ikili rakamlı cetvel satırı. 11.6-11.9 s "CREATIVE × DEVELOPER" (sıkışık display) alanın altında **dönük/eğik gelir** (DEVELOPER ≈ -8°, bant kenarıyla kırpılı) ve 300-400 ms'de düzleşir. 11.9 s nav tamam (ABOUT/WORK/CONTACT, "Coding globally from France / Available for freelance work → Hire me").
- **Bölüm geçişleri:** serif paragraf; siyah "AWARDS" kutusu ve yanıp sönen kırmızı "+" parıltılar; 14-16 s **3D tel kafes oda** (kırmızı çizgi duvarlar/zemin) içinde siyah karelerden oluşan küme kaydırdıkça piksel blok gibi yeniden dizilir; kümede küçük bir **tel kafes küre ikonu** var (setteki tek küre). 16-17 s dikey "WORK" rozeti. 18.75 s'den sonra **harf duvarı**: siyah üstünde kırmızı W / O / R / K satırları + nokta ızgarası; satırlar scroll ile adım adım yatay kayar (scroll'a bağlı, satırlar zıt yönlerde), tek tek glifler küçülüp/dönüp kaybolarak arkadaki koyu proje görselini gösterir, ortada minik proje adı. Kayıt sonuna kadar duvar.
- **Cursor/hover:** yok. **Partikül:** parıltılar; **küre ikonu** var.
- **Premium okunan:** tek renk + siyah, loader'ın logoya dönüşmesi, çizgi alanı, maskeli/eğik başlık, tel kafes oda, tipografik duvar.

---

# SENTEZ

## a) Hareket kalıpları, sıklığa göre (6 referans; mevcut hariç)
1. **Marka işaretli preloader → hero'ya devir** (5/6): art-yakushev logo ayrılması, bleibtgleich %100 erime, landonorris monogram→"4", noth-in sayaç+nesne flipbook+wordmark, wodniack çubuk ikon. Tek istisna elliott-mangham (içerik önce).
2. **Preloader işareti nav'a dönüşür / kalır** (4/6): A ve ® kenarlara, wodniack ikonu sol üste, N' sol üste, LN üst ortaya. Marka hiç "ikinci kez" girmez.
3. **Display tipografinin "malzemeli" girişi** (4/6): harf yükselme + dönme (noth-in), sıvı erime (bleibtgleich), maske bandı + eğim düzelmesi (wodniack), blur-in + alttan yükselme (art-yakushev).
4. **Scroll'a bağlı durum değişimi, otomatik oynatma değil** (4/6): wodniack harf duvarı, bleibtgleich başlık yakınsaması ve kart halkası, landonorris bölüm siluetleri, noth-in örtme geçişi.
5. **3D, küçük aksan olarak** (4/6): eğik kart halkası, render nesneler, tel kafes oda, siluetler. Hiçbirinde "dönen büyük 3D hero" yok.
6. **Hero'da ambient zemin alanı** (3/7): wodniack dalga çizgileri (canlı), landonorris kontur haritası (bu kayıtta sabit), mevcut akış dokusu (canlı, sonra kararıyor).
7. **Yavaş lineer sürüklenme** (2/6): elliott şeridi ~27 px/s, art-yakushev wordmark yükselişi.
8. **Sabit filigran / devasa marka metni** (2/6): bleibtgleich köşe kelimeleri, noth-in footer wordmark'ı.
9. **Satır satır "veri gelişi" reveal** (1/6, elliott): çip wipe + 100 ms/satır daktilo. Frekansı düşük ama veri ürününe en uygun olanı.
10. **Özel imleç / hover**: kanıt yok (bleibtgleich'te belirsiz gri nokta). Otomatik kayıt nedeniyle ölçülemedi.

## b) Zamanlama ve easing normları (kare zamanlamasından tahmin)
| Hareket | Süre | Karakter |
|---|---|---|
| Logo blur-in (art-yakushev) | ~750 ms | ease-out, ~20 px → 0 |
| Sayaç yukarı sayma (noth-in) | <1000 ms | hızlı, tekdüze |
| Sayaç geri sayma (noth-in) | ~5000 ms | lineer, ~20/s |
| Sıvı erime oturması, büyük başlık (bleibtgleich) | 1500-2000 ms | uzun kuyruklu sönüm |
| Sıvı erime, küçük başlık | 500-800 ms | aynı |
| Harf yükselme + stagger (noth-in) | toplam ~1300 ms, ~100 ms/harf | ease-out, bir glifte dönme + hafif overshoot |
| Panel wipe (noth-in) | ~800 ms | ease-out |
| Eğik başlık düzleşmesi (wodniack) | 300-400 ms | ease-out |
| Çizgi alanı büyümesi (wodniack) | ~1300 ms | kenarlardan merkeze, ease-in-out |
| Çip genişlik wipe (elliott) | ~500 ms | ease-out |
| Satır reveal (elliott) | ~100 ms/satır, 12 satır ≈1100 ms | lineer stagger, soldan kırpma |
| Öğe fade-in (elliott şerit) | ~300 ms | yalnız opacity |
| Kart pop (bleibtgleich) | 100-300 ms aralıkla | hızlı, muhtemelen back.out |
| Loader → hero | ≤100-250 ms | sert kesme / snap |
| Marquee | ~27 px/s | lineer, sürekli |
| Logo ayrılması (art-yakushev) | ~10 s (ağ yavaş), hızlı ağda 1-2 s | ease-in, ilerlemeye bağlı |
Genel: giriş hızlı-çıkış yavaş değil, **giriş yavaş ve kasıtlı, kapanış sert** ("ağır + snap"). Elastik/zıplayan easing yalnız tek bir glifte (noth-in O). Hiçbir referansta 2 s'den uzun blokaj eden tween yok; uzun süreler yüklemeden geliyor.

## c) Koyu, premium veri ürünü açılışı için 10 somut fikir (hero: etkileşimli tel kafes/noktalı küre, üç tıklanabilir bölge: Çin, ABD, AB)
1. **Preloader yok, "cihaz açılışı" var (≤1.2 s).** İçerik 0 ms'de DOM'da (elliott gibi). Küre: noktalar enlem bandı bandı belirir ya da tek bir radyal tarama bir kez geçer (900-1200 ms, cubic-bezier(0.16,1,0.3,1)). Üç bölge konturu stroke-dashoffset ile çizilir (600-800 ms, bölge başına 120 ms stagger; anlatı sırası: AB → ABD → Çin ya da ürünün hikayesi). Başlık satırları clip-mask ile translateY(100%→0), 600 ms, cubic-bezier(0.22,1,0.36,1), satır başına 80 ms; etiketler küreden sonra opacity + 8 px translate, 350 ms. Toplam <2 s, metin ~600 ms'de okunur.
2. **Marka işareti ilk kareden nav'da**, ayrı giriş animasyonu yok (referansların ortak kuralı). Hero geçildikten sonra nav'a 1 px alt çizgi + arka plan, 200 ms.
3. **Hover (bölge):** kontur token rengi → accent, kalınlık 1 → 1.5 px; glow için **CSS filter blur kullanma**, SVG radialGradient dolgu ya da ayrı düşük çözünürlüklü canvas katmanı; bölge içindeki noktalar opacity 0.35 → 1, scale 1 → 1.3 (instanced attribute). Etiket çipi bağlantı çizgisiyle çıkar: çizgi 200 ms, çip 150 ms gecikmeli. **Giriş 180-220 ms ease-out, çıkış 300-350 ms** (çıkış daha yavaş). Özel imleç yok; cursor: pointer + glow yeter.
4. **Tıkla-yakınlaş kamera:** orbit + dolly, bölgeyi merkeze alır, **900-1100 ms, cubic-bezier(0.65,0,0.35,1)** (ease-in-out, overshoot yok, "enstrüman" hissi). Dönüş en kısa yaydan (quaternion slerp); yakınlaşma mesafe ya da FOV ile. Diğer iki bölge ilk 300 ms'de %40'a söner. Başlık değişimi: eski satırlar yukarı mask-out (250 ms, 40 ms stagger), yeni bölge satırları mask-in (400 ms, 60 ms stagger), kamera hareketinin ~%60'ında başlar ki metin kamera otururken yere insin. Geri/Esc: ters kamera 700 ms (dönüş daha kısa).
5. **Bölge istatistikleri:** sayılar noth-in sayacı gibi sayarak gelir (600-800 ms, ease-out expo, `font-variant-numeric: tabular-nums`), etiket çipleri elliott gibi genişlik wipe (400 ms), sparkline yolu stroke-dashoffset ile çizilir (900 ms, ease-in-out).
6. **Idle mikro-hareket (otomatik dönüş yok):** (a) nokta opaklığında noise tabanlı "nefes" (periyot 6-9 s, ±%15), (b) 12-20 s'de bir tek tarama/terminatör bandı (1.5 s sweep), (c) imleç paralaksı ±3° (frame başına 0.08 lerp, ~300 ms oturma), (d) bölge konturunda 8 s'de bir 1 px glow nabzı (500 ms). Hepsi uniform/shader; DOM animasyonu yok. mevcut'un akış dokusunun "canlılık" fikri doğru, dozu yanlıştı; burada %15 genlikle kalmalı.
7. **Hero'dan ilk bölüme geçiş (masaüstü):** küre scroll'a bağlı scrub ile scale 1 → 0.85, opacity 1 → 0.3 (hero yüksekliğinin %60'ı boyunca, scroll ile lineer), ilk veri bölümü üzerine gelir (noth-in/wodniack "örtme" hissi). Yalnız transform/opacity. Mobilde pin ve scrub yok (repo kuralı 4); sadece opacity.
8. **Bölüm içi reveal:** elliott'ın satır satır decode'u (100 ms/satır, en fazla 10 satır) başlık ve tablo için; kartlar 300 ms opacity + 8 px translate, 60 ms stagger. Hiçbir reveal 1 s'yi geçmesin, tetik: viewport'a %20 girince.
9. **Kart/CTA hover:** 150-200 ms, translateY(-2px) + border token; scale ≤1.02. Link altı çizgi 250 ms çizilir. Düğme arka planı 150 ms.
10. **Reduced-motion fallback:** kamera tween'i yok, 150 ms opacity crossfade ile durum değişimi; idle noise, tarama ve imleç paralaksı kapalı; noktalar sabit; bölgeye tıklama yalnız vurgu + metin değişimi (200 ms opacity); scroll scrub statik; sayaçlar nihai değeri anında gösterir. Kontrolü WebGL render döngüsünde de yap (matchMedia), yalnız CSS'te değil.

**Kaçınılacaklar (referanslardan çıkan dersler):**
- Preloader > 1 s: bu kayıtta loader'lı her site 3-30 s duvar oldu; yavaş ağda loader cezaya dönüşür.
- Otomatik dönüş (kullanıcı kararı) ve her yerde uçuşan partikül.
- SVG sıvı distorsiyon (bleibtgleich): büyük metinde CPU rasterizasyonu, kare düşürür.
- Büyük alanlarda backdrop blur ve blur() geçişi (art-yakushev premium okunuyor ama pahalı; kullanılacaksa ≤8 px, ≤600 ms, yalnız küçük öğede).
- Tam ekran harf duvarı (wodniack): okunabilirlikle kavga eder, veri ürününe yabancı.
- 3D nesne flipbook'u (noth-in): stüdyo gösterisi, veri ürünü ipucu değil.
- Kamera için elastik/zıplayan easing; küçük overshoot (back.out(1.2)) yalnız etiket çiplerinde.
- Layout animasyonu (width/height; istisna: küçük çipler), DOM'da frame başına stil yazma.
- Sert siyah/beyaz kesmeler (noth-in) koyu temada iyi durur ama veri ürününde güven için 150-200 ms crossfade daha doğru.

## d) Baseline: mevcut sitenin hareket dili
Nav 0.75 s'de, başlık 1.0-2.0 s, alt satırlar 0.5-0.75 s arayla, hepsi yalnız opacity; zemin 3.5 s'de kararıyor; canvas akış dokusu sürekli canlı ama kararıp siliniyor; preloader, scroll reveal, pin, scrub, hover, özel imleç yok; bölüm etiketleri mono "// section", nav'da aktif nokta. Yani: zamanlamalar yavaş, hiçbir şey scroll'a ya da etkileşime bağlı değil, tek "canlı" öğe anlamsız dekor. Yeni hero'nun fark yaratacağı yer tam burası: etkileşime bağlı hareket (hover/tıklama/scroll), kısa ve kesin süreler, idle hareketin dozu.