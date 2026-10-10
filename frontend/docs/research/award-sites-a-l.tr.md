# Görsel inceleme raporu: a–l grubu (38 site)

Kaynak: `/home/user/portfolio/docs/gorseller/siteler/` (1440px kahraman, 390px mobil, scroll filmleri; filmler kontakt-föy biçiminde, 3 kare "scrollY 0" ise sayfa kaydırılamamış demektir: kapı, canvas veya scroll kilidi). Hex değerleri ekran görüntüsünden yaklaşık okunmuştur. Erişilemeyen iki site: **hobro** (Cloudflare doğrulama), **jesperlandberg** (Cloudways 403); bunlar sentez sayımlarına girmedi (değerlendirilen: 36).

---

## Site site inceleme

### 1. abhishekjha
- **Kahraman:** Gri-mavi gökyüzü fotoğrafı (#b9c3cd) tam ekran; kenarlardan ~56px içeride beyaz (#f2f2f0) "sahne" kartı; kartın ortasında geniş elips maske gökyüzünü gösteriyor; krom-magenta 3D kala çiçeği (#b43a6a, yansımalar #e07ab0) elipsten taşıp kartın altından çıkıyor. Metin küçük: sol üst 11px caps "CREATIVE UI & VISUAL DESIGNER", iki satırlık kutu etiket; sağ alt "SCROLL DOWN TO EXPLORE" + 48px koyu daire ok; nav numaralı (①②③); merkezde ince artı işareti; altta açık gri marquee. Logo sıkışık condensed bold, geri kalanı 11–12px grotesk caps; ölçek kontrastı tipte değil nesnede; film greni. İlk kare: "nesne sahneyi deliyor", isim değil obje konuşuyor.
- **Hareket ipuçları:** Yalnız kahraman var. WebGL nesne (zaman/imleç ile dönüyor), marquee sürekli, crosshair imleç merkezi; kart içinden taşan obje = z-katman illüzyonu.
- **Sayfa yapısı / Mobil:** Scroll filmi ve mobil yok.
- **Ödül seviyesi detaylar:** Elips maske + nesnenin çerçeveden taşması; numaralı nav; sağ-alt "scroll" talimatı + sol-alt ince ilerleme çizgisi; gren.
- **Kaçınılacaklar:** Krom-pembe organik 3D obje B2B'de "render demosu" gibi; marquee + crosshair + gren üçlüsü portfolyo klişesi.

### 2. activetheory
- **Kahraman:** Tam ekran WebGL, lacivert-siyah (#05070f). Ortada metalik halka logo, iki kıvrımlı ışık çizgisi; solda mavi bokeh partiküller (#3b6cff, 4–14px, bulanık), sağ altta altın toz (#c9b36a, 1–2px). Tek metin mono caps "YOUR BROWSER IS NOT SUPPORTED" (headless tarayıcıda WebGL2 yok). İlk kare: "yüksek üretimli teknoloji stüdyosu".
- **Hareket:** Scroll yok (3 kare scrollY 0); canlı partikül sistemi; logo etrafında ışık izi.
- **Sayfa yapısı:** Tek sahne.
- **Mobil:** Aynı sahne dikey, partiküller korunmuş.
- **Ödül detayları:** İki ölçekli partikül (büyük yumuşak bokeh + ince toz) derinlik verir; tek odak nesnesi; uyarı metni bile sahnenin tipografisinde.
- **Kaçınılacaklar:** WebGL yoksa boş sahne; "uzay tozu" klişesi dozlanmalı; B2B'de statik fallback şart.

### 3. adcker
- **Kahraman:** Krem (#eeece6) üzerine viewport'u dolduran siyah grotesk caps "THE ART *( ) OF HACKING SOCIAL" (~170px, satır aralığı 0.85, ortalı); parantez içinde 140px gri kare = showreel yuvası; 18px serif italik kenar notları "Showreel", "We're built for". Nav yalnızca "adcker" / "Menu". İlk kare: manifesto.
- **Hareket:** Scroll yok. Mobil karede preloader: "*( fotoğraf ) 95%" yani yuva yüklenirken fotoğraf gösteriyor, yüzde sayacı yanında.
- **Sayfa yapısı:** Görülemedi.
- **Mobil:** Preloader ekranı; parantez-foto-yüzde kompozisyonu.
- **Ödül detayları:** Satır içi medya yuvası tipografinin parçası; serif italik kenar notlarıyla ton kontrastı; preloader hikâyenin parçası.
- **Kaçınılacaklar:** Viewport dolduran slogan bilgi vermez; yükleme kapı gibi.

### 4. adrienlamy
- **Kahraman:** Düz kırmızı (#ff1f3f), elle çizilmiş siyah-beyaz karikatür yüz (~300px), el yazısı "WHO AM I? ADRIEN LAMY", "ME →", yönergeler "DRAG / GRAB / PULL?" küçük figürlerle; sağdan giren dev işaret parmağı (imleç). İlk kare: oyun alanı.
- **Hareket:** Canvas fizik: yüzü sürükle/tut; parmak imleci; "pull" ile sayfa açılıyor. Scroll yok.
- **Sayfa yapısı (mobil tam sayfa):** Siyah panel "SUP, I'M ADRIEN LAMY…", telefon tutan el illüstrasyonu, proje listesi mono caps.
- **Mobil:** Kırmızı kahraman + ikon kutusu; sürükleme yerine dokunma.
- **Ödül detayları:** İmlecin karakter olması; yönergelerin sahnenin dilinde verilmesi; üç renk disiplini.
- **Kaçınılacaklar:** B2B için tamamen uygunsuz (oyun, el yazısı, kapı).

### 5. art-yakushev
- **Kahraman:** Siyah (#111). Üst ortada 26px lede: "A Creative Partner" (serif italik) + "for companies and brands that decide to move forward." (grotesk). Ortada video (DRM hatası). Alt kenara yaslı viewport genişliğinde isim "Artiom" (grotesk) + "Yakushev" (serif italik), ~190px. En altta durum satırı: "YEREVAN 02:06 PM" / "INSTAGRAM / BEHANCE / LINKEDIN" / nav. Vurgu kırmızı-turuncu #e0402a. İlk kare: "ortak" konumlandırması, isim imza gibi.
- **Hareket:** 16 kare: paragraf kelime kelime blur ile beliriyor; dev tipografik duraklar "V10", "19-26 ©"; cihaz mockup'lı projeler; turuncu boya izli portre; "KEY SKILLS & INTERESTS" kırmızı gradyan blok; footer "A® —26"; sonda dev isim + bulanık renkli arka plan, "back to top".
- **Sayfa yapısı:** hero → tanıtım (blur) → V10 → projeler → 19-26 → cihazlar → beceriler → ilham listesi → iletişim → footer isim. Tam kanlı görsel + siyah boşluk; bölüm perdeleri dev sayılar.
- **Mobil:** Görülmedi.
- **Ödül detayları:** İsim imza olarak alt kenarda, serif/sans karışık; blur-in kelime reveal (300–400ms); şehir + saat durum satırı; dev sayılar bölüm perdesi.
- **Kaçınılacaklar:** DRM'li video kahraman riski; boya efektleri; "Creative Partner" jenerik lede.

### 6. basement
- **Kahraman:** Saf siyah. Masaüstünde WebGL sahne boş kaldı; **mobilde beyaz tel-kafes 3D oda render'ı** görünüyor (ince beyaz çizgiler, nokta ızgara zemin). Nav'da üst simge sayaçlar "Showcase ⁽²⁶⁾ Blog ⁽²⁹⁾"; alt ortada "HUMAN / MACHINE" pill toggle (turuncu #ff4d00 aktif). Headline 56px grotesk "A digital studio & branding powerhouse…". İlk kare: iki modlu site vaadi.
- **Hareket:** Headline aşağıdan yukarı parallax; "Trusted by Visionaries" logo duvarı 6 sütun 1px çerçeveli hücre; "Featured Projects" büyük görsel + sağda metin; toggle sticky.
- **Sayfa yapısı:** hero(3D) → headline → logo duvarı → projeler → capabilities (chip) → contact → footer "BSMNT" dev + büyük nav listesi. 1px grid, kontrollü.
- **Mobil:** 3 sütun logo hücreleri; projeler tek sütun; dev wordmark; büyük nav listesi.
- **Ödül detayları:** Üst simge sayaçlar; hücreli logo duvarı (kart değil); sticky iki modlu toggle; **siyah üstüne beyaz tel-kafes 3D sahne (BMW için doğrudan referans)**.
- **Kaçınılacaklar:** "cool shit" tonu; WebGL olmadan boş kahraman.

### 7. bilal-show
- **Kahraman:** Düz mercan (#f05a5a), ortada 36px beyaz el yazısı logo. Başka hiçbir şey yok.
- **Hareket:** Kapı/preloader; kareler aynı. **Sayfa/Mobil:** Aynı.
- **Ödül detayları:** Tek renk + tek işaret cesareti.
- **Kaçınılacaklar:** Bilgi vermeyen kapı.

### 8. bleibtgleich
- **Kahraman:** Beyaz, İsviçre gridi: sayfa boyu 1px dikey çizgi (x≈520); solda siyah leke logo (iki bağlı nokta), 13px bold "Designer & Developer"; sağ üst "Based in Kyiv / Working w/ TFTL"; sağ sütunda 80px Helvetica bold "Maksym Bleibtgleich", altında basamaklı girintilerle "Design Digital Products, UX/UI & Webflow dev."; alt köşelerde açık gri (#ebebeb) 90px hayalet "bleibt" / "gleich"; pill "Menu". İlk kare: Swiss tipografi + imza.
- **Hareket:** Basamaklı satırlar scroll ile kayıyor; "Work 24-26" kartlar fizikle düşüyor/uçuşuyor (3D scatter); "Awards & Recognitions" tablo; "( 09 … 59 )" sayaç parantezi ve üstü çizili kelime; footer 3 daire buton + wordmark.
- **Sayfa yapısı:** hero → manifesto cümlesi → Work (düşen kartlar) → ödüller tablosu → alıntı → footer. Bol beyaz, 1px çizgi omurga.
- **Mobil:** Dikey çizgi korunmuş; basamaklı metin; kartlar yüklenmediği için uzun boşluklar.
- **Ödül detayları:** Tek 1px hizalama omurgası; basamaklı satır girintisi; köşelerde hayalet dev kelimeler; düşen kart fiziği.
- **Kaçınılacaklar:** Mobilde boş alanlar; üstü çizili kelime efekti anlamsız kalabilir.

### 9. boc-studio
- **Kahraman:** Üç dikey renk paneli (gri-beyaz gradyan, lacivert #0b2a7a, hardal #d0a060) üstünden geçen kırmızı (#f23a1e) marquee bandı: "Creative brand studio / Create, refresh and boost / 41.4120° N, 2.1580° E Barcelona / Boc.Studio®"; altta lacivert/mavi (#1c45e0) bloklar. Bu bir açılış perdesi. İlk kare: renk blokları + koordinat.
- **Hareket:** Paneller kayarak açılıyor; marquee sürekli; sonra siyah zeminde yoğun iş mozaiği ("Work / All / Filter"); kırmızı başlık çubuğu sabit.
- **Sayfa yapısı:** kapak → iş gridi. **Mobil:** Görülmedi.
- **Ödül detayları:** Koordinat mikro etiketi; marquee'nin renk panellerinin üstünden geçmesi; sabit renkli başlık çubuğu.
- **Kaçınılacaklar:** Yoğun görsel grid B2B'de gürültü; paneller dekoratif.

### 10. brittanychiang
- **Kahraman:** Lacivert (#0f172a); sol %40 sabit (48px bold isim, "Frontend Engineer", tagline, çizgili dikey nav ABOUT/EXPERIENCE/PROJECTS 12px caps tracking, sosyal ikonlar), sağ %60 kayan metin (#94a3b8 16px/1.6, beyaz bold linkler); deneyim satırı: sol mono 11px "2024 — PRESENT", sağ başlık + açıklama + teal (#2dd4bf) chip. İmleç etrafında ~600px, %6 opak radyal spotlight. İlk kare: okunur CV.
- **Hareket:** Sol sütun sticky; aktif bölümde nav çizgisi uzar; imleç spotlight; satır hover.
- **Sayfa yapısı:** about → experience → résumé → projects → writing → colophon; 1280px konteyner.
- **Mobil:** Tek sütun; nav çizgileri gider; sticky 12px caps bölüm başlıkları.
- **Ödül detayları:** Sticky sol + kayan sağ sütun (veri paneli deseni); mono tarih sütunu; çok düşük opak imleç spotlight; tek renk ailesi chip.
- **Kaçınılacaklar:** Teal chip + lacivert = "developer portfolio" / Tailwind klişesi.

### 11. bruno-simon
- **Kahraman:** Tam ekran WebGL; mor-lacivert düzlem (#1a1040 → #2a1550) perspektifte; düzlemde mavi (#3b25ff) parlayan "x" işaretleri ızgarası (~60px aralık, uzakta sıklaşıyor), çapraz ince çizgiler; merkezde neon beyaz-pembe (#e9c6ff) halka (glow). Metin yok. İlk kare: oyun sahnesi başlangıç noktası.
- **Hareket:** Araba ile gezilen fizik dünyası; scroll yok. **Sayfa/Mobil:** Yok.
- **Ödül detayları:** Perspektifte noktalı/çarpı işaretli zemin derinlik verir; tek vurgu glow halka; çok kısıtlı gradyan.
- **Kaçınılacaklar:** Oyun; B2B'de yalnızca doku fikri alınır.

### 12. by-kin
- **Kahraman:** Krem (#f3f0ea); sol üstte dev turuncu (#ff5a2b) küçük harf wordmark "'kin" (~230px); sağ üstte altı çizili 24px nav; "LAYOUT ① 2" mono toggle; alt yarı: "FEATURED WORKS" 10px mono, numaralı küçük thumbnail'ler 01–03, 26px açıklama, sağ altta çizgi illüstrasyon ekip; mono linkler. İlk kare: düşük yoğunluklu stüdyo kimliği.
- **Hareket:** Scroll yok; layout toggle gridi yeniden diziyor (varsayım).
- **Sayfa yapısı / Mobil:** Görülemedi.
- **Ödül detayları:** Layout toggle; tek vurgu rengi + mono mikro etiket; numaralı thumbnail sütunu.
- **Kaçınılacaklar:** Sevimli illüstrasyon B2B'de hafif; boş sağ orta alan.

### 13. clementgrellier
- **Kahraman:** Beyaz; en üstte viewport genişliğinde "CLEMENTGRELLIER" (fit-to-width ~150px Helvetica medium caps); orta solda 24px tagline; sağ altta 15px justify paragraf + outline pill "See my projects" + "Quick overview"; alt ortada üç sekmeli pill nav (aktif siyah). İlk kare: tipografik imza, çok beyaz.
- **Hareket:** Scroll yok; sayfa geçişleri (varsayım). **Sayfa/Mobil:** Görülemedi.
- **Ödül detayları:** Fit-to-width isim; alt ortada uygulama hissi veren pill nav; asimetrik metin yerleşimi.
- **Kaçınılacaklar:** "pixel-perfect" jargonu; büyük boş orta.

### 14. cuberto
- **Kahraman:** Beyaz; ortalı 96px medium grotesk "Digital design & development agency", 22px alt metin, siyah pill "Contacts". Altı boş (video yüklenmemiş). İlk kare: ajans beyanı.
- **Hareket:** Koyu mor-gri gradyan hizmet kartları; koyu 2 sütun proje gridi; "View all projects" pill; beyaz bölüm üst köşeleri yuvarlak giriyor; footer siyah, mor radyal parıltı, 4 sütun link.
- **Sayfa yapısı:** hero → showreel → services → projects → testimonials (beyaz yuvarlak) → blog → footer. Beyaz/siyah büyük bloklar.
- **Mobil:** Tek sütun, sola yaslı hero, beyaz testimonial kartı, 3D render blog görselleri.
- **Ödül detayları:** Bölüm geçişinde yuvarlatılmış üst kenar; tutarlı pill CTA; footer'da tek soru cümlesi.
- **Kaçınılacaklar:** Mor radyal glow + gradyan kartlar = AI-slop sinyali; 3D roket görselleri.

### 15. dennissnellenberg
- **Kahraman:** Düz gri (#9a9d9d), ortada kesilmiş portre; alt kenarda beyaz ~190px marquee "Snellenberg — Dennis"; sol kenardan taşan siyah pill "Located in the Netherlands" + **daire içinde dönen tel-kafes küre ikonu (~40px, beyaz çizgi)**; sağda 30px "Freelance Designer & Developer" + ↘; 15px nav. İlk kare: kişi + konum + imza.
- **Hareket:** Marquee (3 karede farklı konum), globe ikonu döner, pill soldan kayar; masaüstünde scroll yok.
- **Sayfa yapısı (mobil):** hero → beyaz "About me" daire buton → proje listesi (görsel + ad + kategori/yıl, 1px çizgi) → "More work ¹¹" → **kavisli alt kenar** → koyu footer "Let's work together" + mavi (#455ce9) daire "Get in touch" + e-posta/telefon pill + "VERSION 2022 © Edition / LOCAL TIME 12:35 PM GMT+2".
- **Mobil:** İsim marquee ortada, globe ikon sağ altta, kavisli geçiş, footer bilgi satırları.
- **Ödül detayları:** Pill içinde dönen tel-kafes globe; alt kenara yaslı kesik marquee isim; kavisli bölüm geçişi; footer'da versiyon + yerel saat.
- **Kaçınılacaklar:** Gri zemin + portre freelancer klişesi; marquee isim B2B'de gereksiz.

### 16. dontboardme
- **Kahraman:** Pembe (#f6c1cb), kırmızı (#e8322a) condensed caps 110px "BOUNCE A BALL TO GET TO THE SITE", sarı tenis topu (fizik), 12px caps açıklama. İlk kare: oyun kapısı.
- **Hareket:** Topu sektirince site açılır; 10 kare aynı (scroll kilitli). Mobil: "LOADING 100%" → krem/pembe illüstrasyonlu site ("A TIRED DOG IS A HAPPY DOG!", köpek çizgi illüstrasyonu, "DOG WALKING 01", form, testimonials, mavi CTA bölümü).
- **Sayfa yapısı (mobil):** kapı → hero → hizmet 01 → form → testimonials → CTA.
- **Ödül detayları:** Tek fikir tek etkileşim; condensed caps + iki renk; numaralı hizmet bölümleri.
- **Kaçınılacaklar:** Kapı, pembe palet; B2B'ye yalnız "tek fikir" disiplini taşınır.

### 17. eduardbodak
- **Kahraman:** Krem (#f6efe6); mono caps sekme nav (SERVICE aktif siyah); altında ✦ işaretli cetvel satırı ve kod etiketleri ("3D2Y", "A113", 9px); viewport genişliğinde condensed caps "EINFACHE WEBSITES" (~190px); ortada üç pastel oyun kartı (lavanta #d9ccf5, pembe #f9c8ec, şeftali #f5d5a0, 130×180px) piksel ikon + köşe mini mono etiketler; sol altta siyah pill "PRO MONAT € 3.245,-" + 28px paragraf (ikinci cümle gri); sağ altta mono "WEBDESIGN & WEBFLOW". İlk kare: fiyat şeffaf, üç kart = üç hizmet.
- **Hareket:** Kartlar scroll ile 3D uzayda tilt/dağılma; siyah bölümde 4 sarı nokta + alıntı (mobilde dikey cetvel "STANDARD → GEFÜHL"); "MEIN PROZESS" condensed caps + yanlarda pill etiket; "01 DEFINE 02 DESIGN 03 BUILD 04 RUN"; footer siyah mono sütunlar + sarı pill + "ZURÜCK NACH OBEN".
- **Sayfa yapısı:** hero → siyah manifesto → service (kartlar → listeler) → prozess → footer. Krem/siyah dönüşümlü.
- **Mobil:** Kartlar küçük yan yana; dikey cetvel; kart listeleri tam genişlik.
- **Ödül detayları:** Tutarlı mikro işaret sistemi (✦, kodlar, köşe etiketleri) "teknik belge" dili kuruyor; fiyat pill'i kahramanda; kart metaforu 3D tilt; mono sekme nav.
- **Kaçınılacaklar:** Pastel kartlar ve piksel ikonlar BMW tonuna uymaz.

### 18. elliott-mangham
- **Kahraman:** Siyah (#0a0a0a); üstte 5 sütun mono 11px "veri sayfası" (INTRO / POSITION / RECOGNITION / BRANDS / CONNECT, mor #7c5cff nokta başlıklar), gri chip etiketler ("Client Portfolio", "Avg project costs"), sayılar ($1B+, 23x Site Of The Day); orta solda 40px grotesk cümle, "agencies¹⁷" üst simge sayaç; altta "SCROLL" + çizgi, segment pill "Projects ⑨ / Awards ⑥", alt kenarda gri tonlu yatay proje şeridi. İlk kare: yoğun ama düzenli "güvenilirlik verisi".
- **Hareket:** Hero pinned; scroll ile orta cümle kelime kelime değişiyor (scramble/kaydırma); şerit sabit.
- **Sayfa yapısı:** Tek pinned sahne + cümle serisi; devamı görülmedi.
- **Mobil:** Mono başlık + "CREDENTIALS OPEN [+]" akordiyon; 22px cümle; yatay şerit; CONNECT listesi; **kesikli çerçeveli** "SCHEDULE A CALL" / "COST ESTIMATE".
- **Ödül detayları:** Veri sayfası üst bandı (mono, 5 sütun, chip) BMW PM dili için doğrudan referans; üst simge sayaçlar; kesikli çerçeveli ikincil butonlar; pinned hero + metin değişimi.
- **Kaçınılacaklar:** Emoji; 11px mono erişilebilirlik; scramble okunurluğu bozar.

### 19. emilkowalski
- **Kahraman:** Beyaz; 620px ortalanmış sütun, sola yaslı; 16px medium "Emil Kowalski" + gri "Design Engineer"; "Today" 15px paragraflar; "Projects" listesi. Tek yazı tipi, iki renk (#111, #777). İlk kare: metin-only, sakin.
- **Hareket:** Düz scroll; newsletter input + siyah pill.
- **Sayfa yapısı:** intro → today → projects → writing → newsletter → more; bölüm arası ~120px.
- **Mobil:** Görülmedi (aynı sütun).
- **Ödül detayları:** 620px tek sütun, 15/16px, 1.6 satır; hiyerarşi yalnız renk+ağırlık; dekor sıfır.
- **Kaçınılacaklar:** Landing için fazla pasif; görsel yok.

### 20. formandfun
- **Kahraman:** Beyaz; ortalı geometrik sans wordmark "Form&Fun™" 110px; üst satır logo işareti / "Creative Technology Studio" / nav 13px; altı boş. İlk kare: marka ismi.
- **Hareket:** 44px manifesto + satır içi "Learn more" pill; renkli 3D cam obje gridi; "Form&Fun" marquee; pastel capability kartları; ödül tablosu; 1px hücreli logo duvarı (Spotify, Google, Coca-Cola…); footer'da dev "Form&Fun" alttan clip ile yükseliyor.
- **Sayfa yapısı:** hero → manifesto → work → capabilities → awards → logos → footer wordmark. Çok beyaz, 1px çizgiler.
- **Mobil:** Wordmark kartı; "WORK / EXPERIENTIAL" hayalet dev başlık; proje listesi; kart karuseli; ödül tablosu; mavi "Trusted by…" blok.
- **Ödül detayları:** Satır içi pill buton; footer clip-reveal; mono düzenli ödül tablosu; hücreli logo duvarı.
- **Kaçınılacaklar:** Pastel cam 3D objeler (Spline görünümü) AI-slop sinyali.

### 21. gianlucagradogna
- **Kahraman:** Koyu (#161616) bulanık saç fotoğrafı zemin; sol yarıda ortalanmış beyaz "poster" kart (400×480): "Gianluca Gradogna / Based in Italy", "Multidisciplinary Designer", 40px "Crafting Narrative Through Design."; sağ yarı orman fotoğrafı, serif caps "THROUGH THIS [foto] LENS" (satır içi görsel), dipnot işaretleri {1*} {2*} ve alt açıklamalar; sol altta "Scroll Down", sağ üstte "Scroll Up". İlk kare: iki dünya, dergi hissi.
- **Hareket:** Çift yönlü split scroll: sol sütun aşağı, sağ yukarı; kart yukarı çıkıp "01" proje bloğu geliyor ("Oakley").
- **Sayfa yapısı:** split hero → projeler iki sütun ters yönlü. **Mobil:** Görülmedi.
- **Ödül detayları:** Dipnot sistemi; ters yönlü iki sütun; satır içi görsel başlık; poster-kart kompozisyonu.
- **Kaçınılacaklar:** Ters scroll B2B'de kafa karıştırır; fotoğraf ağırlıklı.

### 22. gilhuybrecht
- **Kahraman:** Siyah, ortada 13px "99%"; 11 kare siyah (yükleme bitmedi).
- **Mobil:** "Gil Huybrecht / Profile, Email me" 14px; önce thumbnail'li 3 proje, sonra yalnız isimler (Ray®, 53 West 53…) ~200px aralıkla; footer linkler.
- **Ödül detayları:** Metin listesi + dev dikey aralık; iki ton.
- **Kaçınılacaklar:** %99'da takılan preloader; içerik kapı arkasında.

### 23. gionatannese
- **Kahraman:** Beyaz; "GN .D" + sekme pill "Creative Space¹ 2 3"; ortada gevşek bir küre/halka üzerinde yüzen 16 küçük görsel (40–70px). İlk kare: sanat alanı, az bilgi.
- **Hareket:** Görsel bulutu 3D döner/sürüklenir (küre karusel); scroll yok.
- **Ödül detayları:** Küre formunda görsel karuseli; sekmeli alanlar.
- **Kaçınılacaklar:** Bilgi yok; görseller okunmaz.

### 24. gregorylalle
- **Kahraman:** Beyaz; sol üstte 110px bold "75" (sayaç), sağ kenarda koyu dikey çubuk; 7 karede "75" sabit (takıldı). Mobil: "55", sonra orta sütunda uzun thumbnail listesi.
- **Ödül detayları:** Sayacın merkezde değil köşede ve büyük olması.
- **Kaçınılacaklar:** Takılan sayaç kapısı.

### 25. hobro
- Cloudflare doğrulama ekranı; veri yok.

### 26. hubtown
- **Kahraman:** Lacivert-siyah (#061120) tam ekran 3D: su üzerinde parlayan mavi küp (#4fc3ff), karanlık dağlar, su yüzeyinde ince parıltı partikülleri; solda dikey bölüm listesi (FUTURE aktif kare madde, diğerleri opaklık kademeli, 11px caps tracking 0.2em); ortada 36px tracking'li caps "WE BUILD THE FUTURE OF REAL ESTATE", 15px paragraf, pahlı köşeli CTA "EXPLORE OUR PROJECTS"; üst nav mono caps + pahlı "LOGIN" "MENU"; alt HUD çubuğu üç hücre: "SOUND OFF" / "SCROLL TO EXPLORE" / "CHAT WITH US". İlk kare: kurumsal sci-fi.
- **Hareket:** Küp döner, su dalgalanır; scroll kilitli (bölümler sahne içinde değişiyor); mobilde başlık harf harf scramble ile beliriyor.
- **Sayfa yapısı:** Tek sahne, 6 bölüm (FUTURE…LEGACY) sahne içinde.
- **Mobil:** Aynı sahne; harf reveal; pahlı butonlar; alt çubukta "NEXT ››".
- **Ödül detayları:** Dikey bölüm listesi (aktif kare madde + opaklık kademesi) BMW navigasyonu için referans; üç hücreli HUD alt çubuğu; tutarlı 6px pah; partikül yalnız su yüzeyinde, düşük doz.
- **Kaçınılacaklar:** Sci-fi/oyun hissi, techno wordmark, parlayan küp, scroll kilidi, ses.

### 27. iamrossmason
- **Kahraman:** Beyaz; üst satır "3D, Motion, Art direction" / "Index, Patreon, Store, About, Lab" (gri ikincil) / altı çizili "Send me a message"; 200px karelik yatay karusel, numaralı "02. Stella Artois [CLIENT WORK]"; aktif kart 400×500'e büyüyüp aşağı taşıyor; "Carousel, List" toggle; "London, UK 11:30"; alt kenarda viewport genişliğinde "ROSSmason" (caps grotesk + italik serif ~200px) aktif görselle katmanlı. İlk kare: iş önce, isim imza.
- **Hareket:** Tekerlekle yatay karusel; aktif görsel ~2x ölçeklenir; isim sabit.
- **Mobil:** Dikey; karusel üstte; isim iki satır altta.
- **Ödül detayları:** "[CLIENT WORK]" köşeli parantez meta etiketi; karusel/liste toggle; aktif öğenin wordmark'la çakışması; şehir + saat.
- **Kaçınılacaklar:** Yatay tekerlek scroll B2B'de keşfedilmez.

### 28. igloo
- **Kahraman:** Düz gri-mavi (#a1a5b4); ortada 12px ASCII yükleme çubuğu "-----===++". Scroll filmi: **beyaz tel-kafes iglo (kubbe blokları + tünel), tel-kafes üçgen zemin ağı üstünde**, hafif parıltılı; kareler arasında dönüp monte oluyor. Mobil: boş gri, sonra küçük tel-kafes kubbe.
- **Hareket:** Nesne kendini kuruyor (çizgiler beliriyor), döner; imleç takibi (varsayım).
- **Ödül detayları:** ASCII yükleme göstergesi; tek renk tel-kafes nesne + tel-kafes zemin; doygun olmayan tek zemin.
- **Kaçınılacaklar:** Metinsiz kahraman; uzun yükleme.

### 29. iventions
- **Kahraman:** Bej (#e8e0d6) üzerine çapraz kesen mor (#9b8ff0) "spot ışığı" şekli; sol orta 40px bold "Step into the Spotlight"; sağda 20px paragraf; alt kenarda 200px "IVENTIONS" zemine göre renk değiştiren (mor üstünde #5b47e0, bej üstünde #d4c8bb) knockout; lime (#d9ff7a) köşe sekmeleri "MENU" / "GOT A PROJECT?". İlk kare: üç renk, geometrik.
- **Hareket:** Şekil scroll ile kayıyor; lime bant; logo satırı; "Events" lime bölüm; mor kart yığını; "Projects Delivered 270+" sayaç tile; "Inside Iventions" renkli nokta kartlar; footer siyah: nav sütunları + alttan yükselen lime→koyu gradyan "IVENTIONS".
- **Sayfa yapısı:** hero → logos → events → kart yığını → sayaçlar → insights → footer. Tam kanlı renk blokları.
- **Mobil:** Görülmedi.
- **Ödül detayları:** Zemine göre renk değiştiren wordmark; köşeye yapışık sekme butonlar; sayaç tile'ı; üç renk + siyah disiplini.
- **Kaçınılacaklar:** Mor + lime otomotiv B2B'de fazla; diyagonal şekil dekoratif.

### 30. jesperlandberg
- Cloudways 403; veri yok.

### 31. jordan-delcros
- **Kahraman:** Siyah, ortada beyaz pill "DISCOVER PORTFOLIO" (condensed mono caps 14px, ~290×48). Kapı; scroll yok.
- **Ödül detayları:** Tek CTA pill ölçüsü doğru (48px yükseklik).
- **Kaçınılacaklar:** Kapı.

### 32. karim-saab
- **Kahraman:** Hardal (#c98c0a) tam kanlı AI görünümlü portre; pill nav (HOME siyah aktif); ortada 80px bold caps "UNLOCK" + 64px serif "Your Brand's Personality"; mavi anahtar deliği 3D nesne; altta 1px çizgi + "ART DIRECTOR" / 15px cümle / "WEB DEVELOPER" üç hücre. İlk kare: kampanya afişi.
- **Hareket:** Beyaz "FEATURED PROJECTS" 2 sütun; "HOW I CAN HELP (03)" üç renkli portre (hover büyüme); gri tonlu görseller yüzüyor; **"IN A WORLD FULL OF NOISE": anahtar deliği maskesi scroll ile büyüyüp arkadaki yüzü açıyor (mask zoom)**; metin karışma/çizik; "START A PROJECT" pill; footer dev "KARIM Saab".
- **Sayfa yapısı:** hero → intro → featured → help → keyhole → CTA → footer.
- **Mobil:** Hizmetler tam genişlik portre; keyhole bölümü; dev isim.
- **Ödül detayları:** Maske ile scroll-zoom (tıkla-yakınlaş için referans); serif/sans çifti; "(03)" sayaç başlık; 1px çizgi + üç hücre durum satırı.
- **Kaçınılacaklar:** AI görünümlü portre, hardal, moda afişi; B2B'de güven kaybı.

### 33. lamalama
- **Kahraman:** Koyu antrasit (#1b1b19) üzerine **tüm sayfa ince nokta ızgarası/halftone dokusu (~4px aralık, ~%8 opak)**; üst ortada siyah pill çubuk (logo / mono "LOOKING SHARP TODAY" / hamburger, ~420×48); sağ üstte "GET IN TOUCH" avatar kartı + "THIS IS US ( - )" paneli; sol altta mono 11px "[ WE ARE LAMA LAMA ]"; krem (#f1ede4) 72px/0.95 caps üç satır "A CREATIVE DIGITAL AGENCY THAT GOES ALL IN OR NOT AT ALL."; sağ altta 22px paragraf; en altta 1px çizgi + mono durum çubuğu: "20+ DIGITAL FREAKS" / "AMSTERDAM BASED" / "[ • 12:46:36 ]" canlı saat / "FOLLOW US" / "INSTAGRAM +" / "LINKEDIN +" / "NL/EN". Üst yarı boş. İlk kare: ajans beyanı + terminal/HUD dili. Mobil: "6%" preloader.
- **Hareket:** Scroll yok (kareler aynı); canlı saat; mobil yüzde sayacı.
- **Ödül detayları:** Tüm zeminde nokta ızgara dokusu (dotted texture referansı); köşeli parantez mono etiketler; canlı saat + dil toggle'lı alt durum çubuğu; başlık sol-alt, paragraf sağ-alt, üst yarı nefes.
- **Kaçınılacaklar:** "DIGITAL FREAKS" tonu; mobil yüzde preloader.

### 34. landonorris-hafif
- **Kahraman:** Kırık beyaz (#f5f5f0) üzerine **topografik kontur çizgileri (1px #d9d9d4) + yumuşak gri (#e8e8e3) arazi lekeleri**; sol üst "LANDO NORRIS" (serif "LANDO" + bold sans "NORRIS"), ortada LN monogram, sağ üst lime (#d7ff00) "STORE" + outline menü; sol altta bilet benzeri kart "NEXT RACE" (pist çizgisi, "BAKU GP", defne kask rozeti, "MCLAREN F1 SINCE 2019"). Başlık yok; yüzey harita gibi. İlk kare: pilot markası, pist/harita dokusu.
- **Hareket (02 hero film, 0–2.1 s):** Lekeler ve kontur çizgileri yavaşça morph ediyor (noise displacement); imleç dairesel dalga/bozulma (ripple) bırakıyor. Scroll filmi: koyu yeşil (#1f2a1a) bölümler, lime SVG imza, "REDEFINING LIMITS, FIGHTING FOR WINS" (serif italik lime + sans), dağınık fotoğraf kolajı, "ON TRACK / OFF TRACK" ikili, "HELMETS HALL OF FAME" pahlı hücreli grid, merch, "WHAT'S UP ON SOCIALS" yelpaze kartlar, footer pahlı çerçeve + partner logoları.
- **Sayfa yapısı:** harita hero → manifesto → kolaj → on/off track → kasklar → şampiyonluk → sosyal → footer. Açık/koyu yeşil dönüşümü.
- **Mobil:** Aynı topografik hero; koyu yeşil bölümler tek sütun; lime butonlar.
- **Ödül detayları:** Düşük kontrastlı canlı topografik harita zemini (map referansı); imleç ripple; "NEXT RACE" mikro veri kartı; serif italik + bold sans ikili; pahlı hücre gridi.
- **Kaçınılacaklar:** Lime + koyu yeşil spor markası; imza ve kolaj B2B'de gürültü.

### 35. leoparpeix
- **Kahraman:** Kırık beyaz (#f7f7f5); yalnızca bir 13px satır: "Léo Parpeix | Art director, Interactive designer | ◌ World building" (spinner = yükleniyor). Scroll yok.
- **Mobil:** 24px "Driven by detail. Obsessed with seamless motion." + "Scroll down"; 12px paragraflar; bozuk harfli "INTERACTIVE DESIGNER" damga görseli; sarı vurgulu link; "Selected projects" numaralı liste dev aralıklı.
- **Ödül detayları:** Üç sütunlu gride oturan tek satır cesareti; dev boşluk.
- **Kaçınılacaklar:** Spinner kahraman; 12px okunurluk.

### 36. lisa-locomotive
- **Kahraman:** Açık gri radyal (#d8d8d8 → #b5b5b5); 3D figür: CRT televizyon kafa, ekranda yıldız alanı partikülleri + "CLICK", kablolar; "Locomotive®" sol üst, glyph, sağ üst "Let's talk" 20px. İlk kare: karakter, merak.
- **Hareket:** Kafa imleci takip ediyor/dönüyor (3 karede açı farklı); ekran içi starfield; scroll yok.
- **Mobil:** Cookie modalı (serif "We use cookies!", iki buton), ses toggle.
- **Ödül detayları:** Nötr zemin + tek 3D nesne + iki metin; ekran içinde ekran katmanı; serif başlıklı sade modal.
- **Kaçınılacaklar:** Cookie modalı ilk izlenimi yiyor; karakter B2B değil.

### 37. lusion
- **Kahraman:** Lavanta-beyaz (#eef0f8); sol üst 28px "LUSION"; ~1290×640, 24px radius koyu (#121418) **kart içinde** WebGL: parlak tüp konektörler (beyaz, mavi #1a3cff, siyah) fizikle devriliyor. Tam kanlı değil. İlk kare: 3D yetkinlik, ürün görünümü.
- **Hareket:** Scroll ile kart üst banda küçülüyor; 96px "Bold Ideas, Brought to Life" beliriyor; mavi SVG eğri çizilerek + mavi yuvarlak blok; grid köşelerinde "+" işaretleri; "SCROLL TO EXPLORE"; "OUR APPROACH" pill.
- **Sayfa yapısı:** kart hero → başlık + çizim → yaklaşım. **Mobil:** Yok.
- **Ödül detayları:** WebGL'in kart içinde tutulması; kartın scroll ile küçülmesi; köşe "+" işaretleri; üç renk 3D.
- **Kaçınılacaklar:** Oyuncak tüp objeler; lavanta zemin.

### 38. lxlcreative
- **Kahraman:** Sıcak siyah-kahve (#2a211c); sol %48 portre (12px radius), sağ orta 34px condensed caps krem (#f3e9c8) "REAL CRAFT. / Real people. (turuncu #ff4a1c script) / REAL RESULTS."; alt kenarda ~200px "lxl" turuncu script + "creative" krem geometrik sans, fotoğrafın üstüne taşıyor; 16px nav. İlk kare: prodüksiyon şirketi, sıcak, insani.
- **Hareket:** Koyu bölümler; caps başlık + tek script vurgu kelimesi ("brilliant", "great"); turuncu dalgalı çizgi dekor; "Our SERVICES"; "STEAL" poster; footer "GOT A PRODUCTION COMING UP?…" + turuncu pill.
- **Sayfa yapısı:** hero → manifesto (video) → services → featured → CTA footer. Tam kanlı görseller.
- **Mobil:** Video + "Sound" toggle; services; krem "Why lxl" akordiyon.
- **Ödül detayları:** Sıcak siyah (saf siyah değil) + krem + tek turuncu; wordmark'ın fotoğrafa taşması; tek script vurgu; ok butonlu akordiyon satırları.
- **Kaçınılacaklar:** Script ve dalga dekor "ajans" kokar; fotoğraf ağırlıklı.

---

## SENTEZ

### (a) En yaygın 10 kahraman kalıbı (36 değerlendirilen site)
1. **Dev tipografi (isim veya slogan) viewport'u dolduruyor ya da kenara yaslı: 15** (clementgrellier, adcker, eduardbodak, iventions, lxlcreative, dennissnellenberg, art-yakushev, iamrossmason, by-kin, bleibtgleich, lamalama, karim-saab, cuberto, basement, formandfun). Alt kalıp: isim/wordmark alt kenara yaslı ve kesik: 5 (art-yakushev, dennissnellenberg, iamrossmason, iventions, lxlcreative).
2. **Durum çubuğu / mikro meta etiketler (konum, saat, uygunluk, koordinat, sayaç): 12** (abhishekjha, art-yakushev, boc-studio, bleibtgleich, dennissnellenberg, eduardbodak, elliott-mangham, lamalama, iamrossmason, hubtown, landonorris, by-kin).
3. **Mono / köşeli parantezli teknik etiket dili: 11** (lamalama, elliott-mangham, eduardbodak, iamrossmason, gianlucagradogna, basement, hubtown, activetheory, by-kin, adrienlamy mobil, jordan-delcros).
4. **Pill (hap) nav veya CTA: 11** (cuberto, clementgrellier, karim-saab, bleibtgleich, jordan-delcros, formandfun, elliott-mangham, lamalama, dennissnellenberg, eduardbodak, lusion).
5. **Kapı / preloader (yüzde sayacı, giriş butonu, oyun): 10** (gilhuybrecht, gregorylalle, jordan-delcros, dontboardme, bilal-show, leoparpeix, igloo, adrienlamy, adcker mobil, lamalama mobil); yüzde sayaçlı: 5.
6. **Tam ekran veya kart içinde WebGL/3D sahne: 9** (activetheory, bruno-simon, hubtown, igloo, lisa-locomotive, lusion, abhishekjha, basement, gionatannese).
7. **Noktalı / tel-kafes / harita / partikül dokusu: 9** (lamalama, bruno-simon, landonorris, igloo, basement mobil, dennissnellenberg ikon, activetheory, hubtown, lisa-locomotive). Ayrıntı aşağıda.
8. **Doygun tek renk zemin: 8** (adrienlamy kırmızı, bilal-show mercan, dontboardme pembe, boc-studio paneller, karim-saab hardal, iventions mor/lime, by-kin turuncu, bruno-simon mor).
9. **Serif italik + grotesk (veya script) çifti: 7** (art-yakushev, iamrossmason, karim-saab, gianlucagradogna, landonorris, lxlcreative, adcker).
10. **Bölünmüş kompozisyon (iki sütun, dikey çizgi, diyagonal): 6** (gianlucagradogna, brittanychiang, iventions, lxlcreative, bleibtgleich, boc-studio). Ek: marquee 4 (abhishekjha, boc-studio, dennissnellenberg, formandfun); tam kanlı fotoğraf/video + tip 5; "boş beyaz, tek wordmark" minimalizmi 5 (cuberto, formandfun, clementgrellier, emilkowalski, leoparpeix).

### (b) Palet ve tipografi eğilimleri
- **Zemin:** Koyu 12 (saf siyah yerine antrasit/lacivert/sıcak siyah tercih ediliyor: #0a0a0a, #111, #1b1b19, #2a211c, #0f172a, #061120); açık 16 (beyaz değil kırık beyaz/krem: #f5f5f0, #eeece6, #f6efe6, #f3f0ea, #eef0f8); gri 2 (igloo #a1a5b4, lisa-locomotive); doygun 6.
- **Vurgu:** Her sitede tek vurgu. En sık: turuncu-kırmızı ailesi (#ff5a2b, #ff4a1c, #f23a1e, #e0402a, #ff4d00; 5 site), lime (#d7ff00, #d9ff7a; 2), mavi (#1a3cff, #455ce9, #4fc3ff; 3), mor (#5b47e0, #7c5cff; 2), teal (#2dd4bf; 1). Koyu sitelerde metin saf beyaz değil krem (#f1ede4, #f3e9c8) ya da #f2f2f2.
- **Yazı tipi:** Grotesk sans baskın (~28/36; Helvetica/Inter/Neue Montreal/Suisse tarzı). Mono yalnızca meta etiketler için (9 site; 10–12px, caps, tracking 0.08–0.2em). Serif italik tek kelime/isim kontrastı için (7). Condensed caps 4 (dontboardme, eduardbodak, jordan-delcros, landonorris). El yazısı/script 3 (adrienlamy, bilal-show, lxl).
- **Ölçek:** Aşırı kontrast kural: display 110–300px (sıklıkla viewport genişliğine fit) karşısında 11–13px mono etiket; gövde 14–16px, lede 18–26px. Üst simge sayaçlar (agencies¹⁷, Showcase ⁽²⁶⁾, More work ¹¹) ve parantezli sayılar ("(03)", "( 09 … 59 )") tekrar eden motif.
- **Büyük/küçük harf:** Koyu ve "premium" sitelerde caps display (lamalama, hubtown, eduardbodak, adcker, clementgrellier, karim-saab); ajanslarda sentence case (cuberto, basement, formandfun, lusion). Mono etiketler neredeyse hep caps + köşeli parantez.

### (c) Hareket kalıpları (sıklık sırası)
1. Canlı WebGL/3D nesne veya sahne (9).
2. Preloader sayacı / spinner / ASCII bar (7: gilhuybrecht, gregorylalle, adcker, lamalama, dontboardme, igloo, leoparpeix).
3. Pinned (sabitlenmiş) kahraman + scroll ile içerik değişimi (7: elliott-mangham cümle değişimi, brittanychiang sticky sütun, bleibtgleich düşen kartlar, karim-saab maske zoom, lusion kart küçülmesi, iventions şekil, art-yakushev perdeler).
4. Footer'da dev wordmark reveal (6: formandfun clip, iventions gradyan, karim-saab, art-yakushev, basement BSMNT, bleibtgleich).
5. Canlı saat / yerel zaman (5: art-yakushev, lamalama, iamrossmason, elliott-mangham, dennissnellenberg).
6. Metin reveal: blur-in (art-yakushev), harf scramble (hubtown mobil, karim-saab, elliott-mangham), word swap (5).
7. İmleç güdümlü: spotlight (brittanychiang), ripple bozulma (landonorris), nesne imleci takip eder (lisa-locomotive, igloo), karakter imleç (adrienlamy) (5).
8. Marquee/ticker (4).
9. Fizik / oyun (dontboardme, adrienlamy, bruno-simon, lusion, bleibtgleich kartlar) (5).
10. Yatay tekerlek karuseli (iamrossmason, formandfun mobil, boc-studio grid) (3).
11. 3D kart tilt / dağılma / küre karusel (eduardbodak, bleibtgleich, gionatannese) (3).
12. Kavisli veya yuvarlatılmış bölüm geçişi (cuberto, dennissnellenberg) (2); ters yönlü iki sütun (gianlucagradogna) (1).

### Küre / harita / gezegen / partikül / nokta dokusu / tel-kafes kullanan siteler (tam tarif)
- **dennissnellenberg:** ~40px beyaz çizgili tel-kafes küre ikonu, koyu pill ("Located in the Netherlands") içinde daire zeminde sürekli döner; pill sol kenardan taşarak girer; mobilde ikon sağ altta serbest.
- **landonorris-hafif:** Kırık beyaz zeminde 1px açık gri topografik kontur çizgileri ve yumuşak gri arazi lekeleri; 0–2.1 s boyunca noise ile morph ediyor; imleç dairesel dalga (ripple) bozulması bırakıyor; metin yok, harita yüzey dilidir. Boc-studio'da ise yalnızca koordinat metni ("41.4120° N, 2.1580° E").
- **bruno-simon:** Perspektif düzlemde ~60px aralıklı parlayan mavi "x" işaretleri (nokta alanı), çapraz ince kılavuz çizgiler, merkezde neon pembe-beyaz halka glow; mor-lacivert gradyan.
- **igloo:** Düz gri-mavi zeminde beyaz tel-kafes kubbe (iglo) + tel-kafes üçgen zemin ağı; çizgiler belirerek monte oluyor, döner; ASCII yükleme çubuğu.
- **basement (mobil):** Siyah üzerine beyaz ince çizgili tel-kafes 3D oda, zeminde nokta ızgarası; masaüstü sahne headless'ta boş.
- **lamalama:** Antrasit zeminin tamamında ~4px aralıklı, ~%8 opak nokta ızgarası (halftone); tipografi doğrudan dokunun üstünde, kart yok.
- **activetheory:** Mavi bokeh partiküller (4–14px, bulanık) sol, altın toz (1–2px) sağ alt; kıvrımlı ışık çizgileri; metal halka.
- **hubtown:** Su yüzeyinde 1px parıltı partikülleri, parlayan mavi küp, pahlı köşeli HUD çerçeveler.
- **lisa-locomotive:** CRT ekran içinde yıldız alanı (starfield) partikülleri; gionatannese: küre düzeninde yüzen görseller (globe benzeri karusel); abhishekjha: merkez crosshair; eduardbodak: ✦ işaretli "waypoint" kodları.

### (d) BMW ürün yöneticileri için koyu, premium veri-ürünü açılış sayfası: 10 somut fikir
Kahraman: etkileşimli tel-kafes/noktalı küre, üç tıklanabilir bölge (Çin, ABD, AB); hover'da parlama + kontur, tıklamada yakınlaşma.

1. **Kahraman yerleşimi (1440):** Küre sağ-orta, çap ~720px (viewport yüksekliğinin %80'i), merkez x≈900; sağ kenardan 60–80px taşabilir (iamrossmason/dennissnellenberg "kesik nesne" etkisi). Metin sol-alt köşeye yaslı (lamalama/art-yakushev): 11px mono caps etiket "[ MARKET SIGNAL · 03 REGIONS ]" + 72–88px grotesk başlık, en fazla 3 satır, 40ch; paragraf 18px/1.5 sağ-alt, 36ch. Üst yarı boş kalsın. Alt kenarda 1px #1f252d çizgi + mono durum çubuğu: "3 REGIONS · UPDATED 12:46:36 CET (canlı) · SOURCE: BMW GROUP INTERNAL · DE/EN". Zemin #0b0d10 (saf siyah değil), metin #f1ede4, ikincil #8a929c.
2. **Küre render dili:** Nokta küre: yalnız kara parçalarında 1.5px noktalar, ~2.5° aralık, varsayılan #3a4250; enlem/boylam ağı 15° aralıklı 1px #161c24 (igloo/bruno-simon tel-kafes zemini). Boşta dönüş 0.02 rad/s, hover'da 400ms yavaşlayarak durur; sürükleme ataletli (0.92 sönüm). Arka planda yalnız kahraman bölümünde 24px aralıklı %6 nokta ızgarası (lamalama), bölüm geçişinde biter.
3. **Hover durumu (bölge):** Bölgenin noktaları 180ms'de #e6edf5'e, ülke sınırı 1px kontur stroke-dashoffset ile 600ms çizilir (lusion'ın SVG çizgisi), altında 320px radyal glow #4fc3ff %18 (hubtown'dan düşük doz). Diğer iki bölge %60 opaklığa iner. Klavye: bölgeler tabbable, aynı kontur focus için.
4. **Mikro etiketler:** Bölge ağırlık merkezinden 24px, 45° 1px lider çizgi + pill: 11px mono caps "EU · 27 MARKETS · ▲ 4.2 %" (sayı tabular, canlı), zemin #0b0d10 %85 + 1px #2a313b; 120ms fade + 4px yükselme. Kalıcı üç küçük etiket (CN/US/EU) kürenin altında 12px mono chip olarak dursun (elliott-mangham chip dili); hover'da ilgili chip dolar.
5. **İmleç:** Metin üzerinde sistem imleci (B2B). Yalnız canvas üzerinde 12px 1px çizgili halka (bruno-simon halkasının minyatürü) + sağında 11px mono "DRAG"; bölge üzerinde halka 20px'e büyür, etiket "OPEN →" olur; 150ms. Blob/magnetik buton yok.
6. **Yükleme durumu:** Kapı ve yüzde sayacı yok; metin t=0'da görünür. Küre kendini kurar: noktalar kutuptan halkalar halinde 1.2 s'de belirir, ağ çizgileri 600ms'de çizilir (igloo montajı). Durum çubuğunda ASCII ilerleme "[ ■■■■□□ ] GEOMETRY" (igloo'nun "-----===++"). prefers-reduced-motion: statik render, dönüş kapalı.
7. **Tıklama / yakınlaşma durumu:** Kamera 900ms cubic-bezier(0.22,1,0.36,1) ile bölgeye dolly; küre sola kayıp viewport'un %40'ını kaplar, yüksekliği %110 (kenardan taşar, karim-saab maske zoom hissi), bölge merkezde; sağ %55'e veri paneli: bölge adı 56px, üç KPI tile (40px tabular mono sayı + 11px etiket), 1px çizgili satırlar, sparkline; satırlar 60ms stagger. Kahraman metni 300ms'de söner. Sol üstte "GLOBE / EU" breadcrumb + "ESC · BACK"; URL hash (#eu); altta "CN · US" chip ile 600ms yörünge geçişi. Diğer bölgeler %30 opak.
8. **Tipografi sistemi:** İki aile: sıkı grotesk (BMW'nin kurumsal yazı tipi varsa o; yoksa Inter Tight / Neue Haas) + mono (JetBrains Mono / IBM Plex Mono). Ölçek: 11 mono caps · 14 gövde · 18 lede · 40 KPI · 72–96 display; tabular-nums; display sentence case, mono caps; serif/script yok (BMW tonuna uymaz). Üst simge sayaçlar (Regions ³, Sources ¹²) ve "(03)" parantez sayaçları serbest.
9. **Kahraman altı bölüm sırası ve ritim:** (1) kanıt şeridi: 1px çerçeveli hücrelerde 6 sütun kaynak/partner logosu (basement) veya üç sayaç tile "270+" (iventions), count-up tek sefer 800ms; (2) sticky-split "Nasıl çalışır": solda sabit mini küre (bölge vurgusu adımla değişir), sağda her biri 100vh üç adım (brittanychiang/REGU üç adım); (3) üç bölge karşılaştırma tablosu: mono sayılar, 1px çizgiler, satır hover #11151a; (4) 40–56px manifesto cümlesi, kelime blur-in 320ms (art-yakushev); (5) "Verinin içi" 3 kart 1px grid, radius ≤ 8px; (6) güvenlik/gizlilik paneli; (7) kapanış: 20vw wordmark alt kenardan clip ile yükselir (formandfun) ama %60 opak ve tek satır; e-posta, yerel saat, versiyon (dennissnellenberg footer). Bölüm arası 160–200px, konteyner 1280, küre tek tam kanlı öğe.
10. **Mikro detaylar ve mobil:** Bölüm numaraları "01—06" mono; link hover'da soldan 200ms alt çizgi; sayfa geçişi 300ms fade; pahlı 6px köşe yalnız birincil CTA'da (hubtown), ikincil buton kesikli 1px çerçeve (elliott-mangham). Mobil: küre 80vw, metnin üstünde, sürükleme yok, altında üç chip (CN/US/EU), dokunma = yakınlaşma paneli tam genişlik alt sayfa (sheet) olarak 320ms; mono durum çubuğu iki satıra kırılır; hiçbir şey preloader arkasında beklemez.

### B2B için grup genelinde kaçınılacaklar
Kapı ekranları ve yüzde sayaçları (10 site); cookie modalı ve "browser not supported" ilk izlenimi (lisa-locomotive, activetheory); DRM'li video kahraman (art-yakushev); sci-fi HUD doz aşımı ve parlayan küp (hubtown); AI görünümlü portre (karim-saab); pembe/kırmızı/mor+lime oyun paletleri; mor radyal glow + gradyan kartlar (cuberto); pastel cam 3D objeler (formandfun); scroll kilidi ve yatay tekerlek karuseli; emoji (elliott-mangham); 11–12px mono gövde metni (leoparpeix, elliott-mangham); ters yönlü scroll (gianlucagradogna); marquee isim (B2B'de anlamsız).

Dosya yolları: tüm görseller `/home/user/portfolio/docs/gorseller/siteler/<slug>-01-hero.jpg`, `-06-scroll-film.jpg`, `-05-mobile.jpg`; tek hero filmi `/home/user/portfolio/docs/gorseller/siteler/landonorris-hafif-02-hero-film.jpg`.