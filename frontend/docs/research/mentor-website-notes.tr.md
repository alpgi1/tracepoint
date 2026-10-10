# Mentor-Website (mentorsosyal.com) yeniden yazımı — frontend araştırma notları

Okunan kaynaklar (hepsi `/home/user/Mentor-Website/` altında, salt okunur):
`README.md`, `docs/website-yeniden-yazim-arastirma-ve-plan.md` (plan, 22 Eylül 2026), `docs/tasarim-referans-notlari.md` (referans turu), `docs/tasarim-yonu-fosforlu-defter.md` (tasarım yönü + R3/R5/26 Eylül uygulama notları), `docs/21st-dev-bilesen-adaylari.md`, `docs/referans/*.jpg` (01-apple, 02-yc-a/b/c, 03-deneysel-a…h, 04-egitim-rakipler-a/b, 05-mobil, 06-derin-a…d, 07-stil-karti-kagit/murekkep/mobil), `assets/screens/README.md`, `legacy/README.md` + `legacy/src/styles/tokens.css`, `src/app/globals.css`, `src/app/fonts.css`, `src/app/layout.tsx`, `src/content/site.ts`, `src/components/**` (ui, motion, landing, site, app), `src/lib/*`, `scripts/*` başlık yorumları, `package.json`, `next.config.ts`, `open-next.config.ts`, `wrangler.jsonc`, `lighthouserc.json`, `.github/workflows/ci.yml`, `.mcp.json`, `scripts/fonts/build.py`, `git log`.

---

## 1. Proje ve süreç

### 1.1 Bağlam ve çerçeve
- Ürün: "Mentor: YKS Sosyal" mobil uygulamasının tanıtım + mağaza yönlendirme + SEO sitesi. Eski site (Ağustos 2026, 2 commit) Vite + React 19 SPA, Cloudflare Worker'da; tek URL, hukuki sayfa yok, sitemap/robots yok, derin bağlantı yolları (`/v/<id>`, `/.well-known/*`) `index.html`e düşüyor. Plan belgesi bunu "SEO için yapısal olarak yetersiz" diye özetliyor; eski sitenin **tasarım anayasası, HTML/CSS ürün mockup'ları, `site.config.ts` disiplini ("uydurma sayı yayına çıkmaz") ve `/indir` mantığı** yeni siteye taşınır, gerisi sıfırdan.
- Ürün sahibinin çerçevesi (alıntı): *"tanıtım + App Store/Play yönlendirmesi, ama asıl sebep SEO — tek sayfa olmayacak; 10.000 dolarlık bir tasarım lazım, çok çekici animasyonlar, belki video."*
- Plan belgesinin kendi kuralı: *"Bu belge karar ve plan belgesidir; kod yok. Her iddia ya bir dosya yoluna ya bir arama sonucuna dayanır; ölçülemeyen şeyler (arama hacmi, mağaza sayfası metni) açıkça 'ölçülemedi' diye işaretlidir."* Arama hacmi sayısı hiç verilmiyor; Search Console ilk 30 gün verisiyle içerik takvimi yeniden sıralanacak.

### 1.2 Planlanan faz sırası (plan §8)
- **F0 Hazırlık (1 hafta, paralel):** dokuz karar, hesaplar (Search Console, GA4, piksel), Mentor+ fiyatları, mentor listesi, gerçek cihaz görüntüleri, **21st.dev tasarım turu** (parça listesi için aday toplama; günde 2 kod çekme hakkıyla en kritik parçalar). Çıkış: karar listesi kapanmış, stil kılavuzu taslağı (token'lar + hareket kuralları).
- **F1 Temel + landing (≈2 hafta):** Next.js iskeleti, token'lar, bileşen çekirdeği, CI/Lighthouse; `/`, `/indir` (+QR, kampanya), `/mentor-plus`, `/ozellikler` hub + 3 özellik sayfası, `/hakkimizda`, `/iletisim`, `/sss`, dört hukuki sayfa, `/hesap-silme`, 404; **P0:** `/v/:id` + `/.well-known/*` proxy'si `curl` ile doğrulanır. Çıkış ölçütü: Lighthouse ≥ 95 (perf/SEO/a11y) mobil; Playwright ekran görüntüleri onaylı.
- **F2 Araçlar + programatik müfredat (≈2 hafta, hedef Kasım):** YKS puan motoru TS portu + ortak test vektörleri, 5 hesaplayıcı sayfası, sayaç, `/konular/*`.
- **F3 İçerik motoru (sürekli):** MDX boru hattı, blog/rehber, `/mentorlar`, veri gazeteciliği ucu.
- **F4 Paylaşım landing'i + seçilmiş anonim topluluk alıntıları (≈1 hafta; forum İNDEKSLENMEZ).**
- **F5 Büyüme ve ölçüm.**

### 1.3 Dokuz karar (ürün sahibi, 22 Eylül 2026, plan §9)
1. Hosting: **Cloudflare Workers + `@opennextjs/cloudflare`** (ISR/OG sürtünmesi bir güne mal olursa Vercel'e geçiş açık, kod aynı).
2. Stack: **Next.js App Router + TS + Tailwind v4 + shadcn/ui + Motion + MDX** (21st.dev uyumu).
3. Forum içeriği herkese açık indekslensin mi? **HAYIR** (`/topluluk/*` açılmaz, `GET /forum` web'den çağrılmaz; yalnız seçilmiş anonim statik alıntılar).
4. Blog: **repo MDX** ile başla, hacim artınca panel modülü.
5. Kanonik alan adı: **apex `https://mentorsosyal.com`**, `www` → 301.
6. Tema: **"Her yerde koyu"** → bu karar F1 içinde ürün sahibinin "eski siteyle aynı" geri bildirimiyle **devrildi**; kâğıt zemin + mürekkep bantları ("Fosforlu Defter") geldi.
7. Hukuki metinler: Google Docs'taki metinler siteye; gözden geçirme ürün sahibinde (onay 26 Eylül'de geldi).
8. Mentor+ fiyatları: RevenueCat'ten; gelene kadar `pending` disiplini ("Fiyatı uygulamada gör"). Hâlâ bekliyor.
9. Video: `premiumvideo.mp4` **KULLANILMAZ** (eski ürünü anlatıyor, anayasa dışı, ölü varlık); 26 Eylül'de "video istenmiyor" kararıyla video tamamen düştü.

### 1.4 Gerçekleşen icra sırası (git log, 22–26 Eylül 2026; üç PR `claude/sleepy-darwin-5oxate` → `main`)
1. `7f2b46c` 21st.dev MCP sunucusunu proje kapsamında tanımla (`.mcp.json`).
2. `a633024` araştırma + plan + yol haritası belgesi.
3. `6ba3a1a` dokuz karar işlendi, 21st.dev aday listesi eklendi; `a7754a5` F2 araç parçaları (sekme, slider, radyal gösterge, puan kartı) listeye eklendi.
4. `1c970cd` yeni iskelet: Next.js 16 + Tailwind v4 + OpenNext; eski Vite sitesi `legacy/` altına.
5. `8d1f98d` temel katman + derin bağlantı proxy'si + `/indir`.
6. `6f2ea9f` **ilk landing turu** (hero telefon kaydırma, altı sekme turu, spotlight özellik ızgarası, canlı sayı, yorum şeridi, Mentor+ bandı, SSS, kapanış) — koyu tema, mavi accent.
7. Ürün sahibi geri bildirimi: *"Tasarımlar hâlâ eski siteyle neredeyse aynı; marjinal, deneysel takıl. Renk seçimi, genel tasarım vs. farklı davran. Önce Apple/YC landing'lerine ve son 2 yılın ödüllü sitelerine bak, ss'ler ve notlar çıkar."* → `b145f95` referans turu (kontakt tabakalar + notlar), üç yön karşılaştırması, **"Fosforlu Defter"** seçimi ve stil kartı renderları.
8. `e79c61d` landing yeniden kuruldu (kâğıt/mürekkep/lime token'ları, Archivo + Instrument Serif, yeni bölümler, hareket ilkelleri) — belgede **R3**.
9. `dd7f3a0` iç sayfalar aynı dile taşındı (sayfa başlığı, ekmek kırıntısı, CTA bandı, özellik blokları, Mentor+, iletişim, hakkımızda, hesap silme, indir, 404, hukuk).
10. `f4f1270` **performans turu (R5)**: kendi font altkümeleri (462 → 111 KB), `motion/react` kaldırıldı, kıvrım altı `content-visibility`, kontrast/a11y, SEO altyapısı, Lighthouse CI, README. Lighthouse mobil `/` 70 → 94–98, iç sayfalar 72–88 → 93–98, a11y 92 → 100.
11. 26 Eylül: `0f0f769` YKS 2027 tarihi (19–20 Haziran) girildi (hero sayacı açık), hukuki dört sayfa onayla indekse; `0ef04c0` 10 cihaz görüntüsü; `313ee4d` gerçek görüntüler siteye girdi + **font yedeklerinin yanlış ölçüsü** bulunup düzeltildi (CLS dört sayfada 0).

### 1.5 Karar alma ve belge disiplini
- Her tur sonunda belgeye "**Uygulama notları: plandan sapmalar ve öğrenilenler; kod yorumlarında da yazılı**" bölümü (§9, §10, §11) eklenir; tuzaklar numaralanır (Ekran görüntüsü tuzağı 1–4).
- Her belgede "**Ürün sahibinden beklenen girdiler**" listesi vardır; girdi gelmeden ilgili blok çizilmez (tarih `null` → sayaç yok; fiyat yok → "fiyat uygulamada").
- 21st.dev belgesi ürün sahibi seçimleriyle güncellenir (seçilen satır kalın, gerekçe eklenir); önizlemeler görülemediği için görsel karar ürün sahibine bırakılmıştır.
- "Doğrulama disiplini: … tasarım cihazda ilk kez görülmez." (plan §5) → Playwright ekran görüntüleri + Lighthouse CI her adımda.
- Ölçümlerde **önce araç sorgulanır**: yatay bant "çalışmıyor" diye iki tur yanlış teşhis, sebebi eski `next-server` sürecinin eski build'i sunmasıydı; `scripts/lib/dev-server.mjs` bu yüzden sunucuyu kendi süreç grubunda açar, port doluysa HATA verir.

### 1.6 Ölçüm, Lighthouse ve CI'nin kullanımı
- **Araç seti (README tablosu):** `scripts/shots.mjs` (tam sayfa; mobil 390×844 @2× + masaüstü 1440×900; varsayılan `reducedMotion: "reduce"`; uzun sayfa parçalı; `content-visibility` bölümleri zorla çizdirir), `scripts/scroll-shots.mjs "#sekmeler" 0 0.5 1` (yapışkan sahneleri oranlara kaydırıp viewport çeker; `pageerror`, konsol hatası ve 4xx/5xx basar), `scripts/overflow-check.mjs` (16 rota, **390 px, 1.0× ve 1.6× yazı ölçeği**, tolerans 2 px; CI'da), `scripts/paint-probe.mjs` (kısıtsız ilk boyama/LCP/longtask; varyantlar `nojs`, `nofonts`, `nograin`, `noblend`, `notextwrap`; `HIDE=` bölüm bisect'i; `TRACE`/`LHTRACE`), `scripts/cls-probe.mjs` (fontları 1,5 s geciktirip her layout-shift'in **kaynak düğümünü** yazar — Lighthouse "Web font loaded" der, düğümü söylemez), `scripts/og/render.mjs`, `scripts/fetch.mjs`, `scripts/fonts/build.py`, `scripts/screens/build.py`, `scripts/refshots.mjs` (referans siteleri proxy'den çeker), `npx lhci autorun`.
- **Lighthouse CI (`lighthouserc.json`):** `npm run start -- -p 3994`; dört URL (`/`, `/ozellikler`, `/mentor-plus`, `/sss`); **3 koşu**; mobil emülasyon; kapı **perf ≥ 0.90, a11y/BP/SEO ≥ 0.95**; `upload: temporary-public-storage`. Hedef belgede 95 kaldı; kapının 90 olmasının sebebi "Lantern'ın font/ilk-boyama yarışı ±3 puan oynatıyor" (aynı derlemede 0,94 ↔ 0,98). Son ölçüm: `/` 0,91–0,95 · `/ozellikler` 0,93–0,95 · `/mentor-plus` 0,94–0,97 · `/sss` 0,95–0,96; a11y/BP/SEO 100; **CLS 0,000**. Kalan zayıf halka `/` LCP 2,8–3,5 s (~160 KB Next/React JS Lantern ağında).
- **CI (`.github/workflows/ci.yml`, `site-ci`):** push `main` + PR; concurrency iptal; ubuntu, Node 22, `npm ci` → `typecheck` → `lint` → `build` → `npx playwright install --with-deps chromium` → taşma denetimi → `lhci autorun` (Playwright Chromium `CHROME_PATH`). **Deploy CI'da değil**; `npm run deploy` elle.
- CWV bütçesi (plan §3.4): LCP < 2,5 s, INP < 200 ms, CLS ≈ 0.

### 1.7 Takım kuralları (README "Kurallar (kısa)" — verbatim başlıklar)
- "**Sayı uydurulmaz.** Sitedeki her sayı `src/content/site.ts`'ten gelir ve kaynağı yorumda yazar … Bilinmeyen değer … `null` kalır ve o blok ÇİZİLMEZ ya da 'uygulamada' der."
- "**Tek accent lime**, yalnız dolgu (kâğıt üstünde metin rengi değil); mor yalnız Mentor+; kırmızı yalnız canlı nokta. Gradient/blur/glow/cam yok."
- "**Sunucu her şeyi GÖRÜNÜR basar.**" (gizli başlangıç yalnız `html.js` varken ve öğe ilk ekranın altındayken; reduced motion'da her şey statik ve görünür).
- "**Bir bölüme `overflow-hidden` vermeden önce içinde sticky var mı bak**."
- "**Font eklenmez, üretilir.**" (@fontsource / next/font yok; aile başına tek altküme; yedek yüz ölçüleri ÖLÇÜMDEN).
- "**Cihaz görüntüsü eklenmez, üretilir.**" (ham PNG `assets/screens/`, script, çıktı commit; hero dışında her görüntü `lazy`).
- "**Kıvrım altı bölümler tembel çizilir**" (`content-visibility: auto`; ölçü alan kod bölüm çizildiğinde yeniden ölçmeli).
- Hukuki dört sayfa onaylı ve indekste; forum içeriği web'de indekslenmez.

---

## 2. Tasarım yönü: "Fosforlu Defter"

### 2.1 Tek cümle ve gerekçe
*"Bir öğrencinin ders defteri: kâğıt, siyah mürekkep, fosforlu kalem."* Geniş ve ağır tipografi iddiayı söyler, fosforlu işaret neyin önemli olduğunu gösterir, mono etiketler sayfayı "şekil dizisi" gibi numaralandırır, uygulamanın koyu ekranları kâğıda yapıştırılmış kesikler gibi durur. Dört gerekçe: (1) eski site/uygulamanın antrasit+mavi dilinden en görünür kopuş; (2) ürünle bağı olan tek metafor (öğrenci masası); (3) 2024–26 ödüllü işlerin ortak paydası (kâğıt zemin, kahraman tipografi, mono etiket, tek çığlık renk, sert kenar); (4) Türkiye'deki YKS sitelerinin tamamı gradient/madalya/stok fotoğraf dilinde.

### 2.2 Değerlendirilen üç yön
| | A · Fosforlu Defter (seçildi) | B · Gece Etüdü | C · Renk Blokları |
|---|---|---|---|
| Zemin | kâğıt `#F4F1EA` | mürekkep `#121110` | tam genişlik doygun bloklar |
| Accent | lime `#D8FF3D` | lime | 4–5 pastel/doygun |
| Referans | Anthropic, Dia iç sayfaları, Gumroad, Lando Norris, Granola | Warp, Rive, Sanity, Resend | Clay, Family, Duolingo |
| Kopuş | en büyük | orta ("yine koyu") | büyük ama 3D/illüstrasyon ister |
| Risk | koyu ekranlar "kesik" gibi durmalı | "yine karanlık site" | maskot/3D yok; ton küçük yaşa kayar |

B elenmedi: aynı token sistemi `data-theme="ink"` ile koyu bant üretir. Sayfa ritmi: kâğıt (hero) → mürekkep (şerit) → kâğıt (Şekil 01) → mürekkep (Şekil 02) → kâğıt (Şekil 03, yorumlar) → mor (Mentor+) → kâğıt (SSS) → mürekkep (kapanış + footer). Footer her sayfada mürekkep.

### 2.3 Palet (`src/app/globals.css` `@theme`)
**Site:** `--color-paper #f4f1ea` (sayfa) · `paper-2 #ece8de` (kart) · `paper-3 #e1dccf` (hover/ikinci düzlem) · `ink #141311` (metin, kontur, birincil düğme) · `ink-2 #4e4b45` · `ink-3 #6a665d` (belgede #8A867C idi; kontrast için düzeltildi: kâğıtta 5,07:1, paper-2'de 4,67:1) · `line rgb(20 19 17/.14)` · `line-strong /.34` · **`mark #d8ff3d`** (TEK accent) · `mark-2 #c4f226` (hover) · `plus #772ce8` (YALNIZ Mentor+; uygulamayla aynı, ton 286°, "AI-slop indigo bandının bilinçli dışında") · `plus-deep #2a0f52` · `plus-paper #efe4ff` · `pen #e0382b` (kırmızı kalem: canlı nokta, çarpı).
**Mürekkep bandı `[data-theme="ink"]`:** paper `#141311`, paper-2 `#1c1b18`, paper-3 `#26241f`, ink `#f4f1ea`, ink-2 `#b9b5aa`, ink-3 `#938e83` (5,69:1), line `rgb(244 241 234/.14)`, `color-scheme: dark`; `mark` aynı kalır (lime siyah üstünde 16:1).
**Mor blok `[data-theme="plus"]`:** paper `#772ce8`, paper-2 `#6a25d0`, paper-3 `#5e1fbb`, ink `#ffffff`, ink-2 `#e6d6ff`, ink-3 `#e6dafd` (4,78:1), line `rgb(255 255 255/.22)`.
**Uygulama mockup paleti (ayrı ad uzayı, yalnız `components/app/*`):** page `#0f0f12`, raised `#121317`, surface `#1a1b1f`, surface-2 `#26272c`, surface-3 `#303137`, glass `rgb(32 33 38/.72)`, hair `rgb(255 255 255/.1)`, hair-strong `/.17`, fg `#fff`, fg-2 `#a4a6ac`, fg-3 `#9fa1a9` (uygulamadaki #85878f 4,0:1 kalıyordu → 5,78:1), accent `#3e8bff`, accent-hover `#5c9dff`, accent-soft, accent-text `#b9d4ff`, accent-chart `#6ea8ff`, plus-hover `#8a45f0`, plus-text `#c96ae6`, plus-surface `#201722`, live `#f0556a`, done `#34c759`, missed `#e0556a`, none `#4a4c55`, star `#f5b544`. "Site kromunda bu adlar KULLANILMAZ."
**shadcn alias'ları** (`@theme inline`): background→paper, foreground→ink, card→paper-2, muted→paper-3, primary→ink, border→line, input→line-strong, ring→ink, destructive→pen — 21st.dev/shadcn parçaları site paletini otomatik giysin diye.
Diğer: `themeColor #f4f1ea`, `::selection` lime zemin, `:focus-visible` 2 px ink, offset 3 px.

**Renk kuralları (verbatim):** "Lime hiçbir zaman kâğıt üstünde METİN rengi değildir (1.3:1). Yalnız dolgu (vurgu şeridi, düğme, stiker) ya da koyu zeminde metin." · "Eski mavi accent (`#3E8BFF`) site kromunda YOK; yalnız uygulama mockup'larının içinde." · "Mor yalnız Mentor+ bloğu, rozeti ve düğmesi. Kırmızı yalnız canlı nokta ve 'kaçırıldı' işareti." · "Gradient, blur, glow, cam yüzey, sonsuz shimmer YOK … Kâğıt greni tek doku." Tek istisna: Mentor+ CTA'sındaki tek huzme (`.shine-sweep`, uygulamadaki ShineSweep). Yıldızlar mürekkep (sarı yok).

### 2.4 Tipografi
| Rol | Aile | Ayar | Kullanım |
|---|---|---|---|
| Display | **Archivo** (variable `wdth` 62–125, `wght` 100–900; sitede iki STATİK kesit) | `wdth 118 · wght 850 · tracking −0.03em · leading .9`; kart başlığı `wdth 108 · 800` | h1/h2, footer dev söz |
| Vurgu | **Instrument Serif Italic** 400 | display boyunun aynısı | başlıkta tek kelime (*zorunda*, *aynı odada*) |
| Mono | **JetBrains Mono** 400–700 | 11.5–12.5 px, versal, tracking .12em; sayaç rakamları 72 px 700 | "Şekil 01", CANLI, şerit |
| Gövde/UI | **Inter** (opsz 14, wght 400–700) | 16–19 px | paragraf, düğme, form |

Gerçek CSS değerleri: `h1,h2,h3,.display` → 850 / `font-stretch 118%` / lh .92 / ls −0.03em / `text-wrap: balance`; **h1** `clamp(min(3.1rem,12.5vw), 1.2rem + 7.6vw, 7.75rem)` lh .88 ls −0.035em (vw'ye bağlı taban: 1,6×'te 3.1rem = 79 px olup "çalışmak" 390 px'e sığmıyordu); **h2** `clamp(2.1rem, 1.2rem + 3.2vw, 4rem)` lh .94; **h3** `clamp(1.35rem, 1.1rem + .9vw, 1.75rem)` 800 / 108% lh 1.02 ls −0.022em; gövde 1rem lh 1.55, `overflow-wrap: anywhere`, `font-synthesis-weight: none`; `.lede` `clamp(1.0625rem, .98rem + .4vw, 1.25rem)` lh 1.5 max 46ch ink-2; `.mono-label`/`.kicker` .72rem 500 ls .12em uppercase ink-3 (kicker önünde 22×1.5 px mürekkep çizgi); `.stamp` .68rem 700 ls .14em; `.prose` 1.0625rem lh 1.7 max 66ch, h2 üstünde 1.5 px çizgi; hero büyük sayı `clamp(3.4rem, 2rem + 5.6vw, 6.6rem)` lh .85 ls −0.045em; kapanış h2 `clamp(4.2rem, 2rem + 11vw, 12.5rem)` lh .86; iç sayfa h1 `clamp(2.6rem, 1.3rem + 4.8vw, 5.6rem)`; hayalet şekil numarası `clamp(4rem, 3rem + 5vw, 8rem)` lh .8 ls −0.05em paper-3; şerit `clamp(1.45rem, 1rem + 2.2vw, 2.7rem)` versal display; OG h1 128 px (sığmazsa 84'e kadar iner), lede 26 px.
Karar notları: "**Bricolage'a veda** — geçen sürümün sesiydi, 'aynı' hissinin ana kaynağı." Türkçe glifler `latin` + `latin-ext` altkümelerinde fontTools ile doğrulandı. "Mono'da `₺` yok → fiyat satırları Inter ile yazılır." Versal Türkçe: `text-transform: uppercase` yalnız `lang="tr"` altında doğru; JS'te `toLocaleUpperCase("tr")`.

### 2.5 Boşluk ve ölçü
Kapsayıcı `--container-page 1240px`, yan boşluk `clamp(20px, 4.5vw, 52px)`; `--container-prose 66ch`. Bölüm dikey `clamp(72px, 10vw, 140px)`, `tight` `clamp(48px, 7vw, 96px)`; hero `pt clamp(28px,5vw,72px)` / `pb clamp(56px,8vw,112px)`; iç sayfa hero `pt clamp(32px,5vw,72px)` / `pb clamp(40px,6vw,76px)`. Nav 64 px, `scroll-padding-top 88px`. Defter çizgileri 32 px aralık (yalnız hero; OG'de 40 px). Yarıçap token'ları sm 4 / md 6 / lg 10 / xl 14 / 2xl 20 / 3xl 28 px; kart 10 px, düğme 6 px. Düğme boyları sm h40/px16/.875rem, md h50/px22/.9375rem, lg h56/px28/1rem. Hero ızgarası `1.25fr/0.75fr` (sol sütun 660 px; "çalışmak" 124 px'te 638 px ölçüldü). Eski sitenin 8pt ızgara token'ları (`--s4…--s128`) taşınmadı; Tailwind ölçeği + clamp kullanılıyor.

### 2.6 Kenar, düzlem, dokunulabilirlik
- "**Kontur 1.5 px mürekkep**, kart köşesi 10 px, düğme 6 px. **Sert ofset gölge** 4 px (düğme) / 6 px (kart) / 12 px (telefon kesiği); basınca gölge 2 px'e iner ve gövde 2 px kayar (`transform`), 120 ms. Yumuşak gölge yok." Kodda: `--shadow-press 4px 4px 0 0 ink`, `press-sm 3px`, `press-lg 6px`, `cut 12px`, `cut-mark` / `press-mark` (mürekkep bantlarında lime gölge). `.press` hover `translate(-1px,-1px)` + 5 px gölge; active `translate(3px,3px)` + 1 px gölge; 0.14 s ease-out-cubic.
- Kâğıt kart = `paper-2` dolgu + kontur; uygulama yüzeyleri = kontur + koyu dolgu ("kesik yapıştırma"). `Phone`: `aspect 9/19.5`, `rounded 2.7rem`, 3 px kontur, `bg #08080a`, genişlik **px** (240/264/288; hero 248/272/296 — rem olsaydı 1,6×'te taşıyordu), `tilt −3.5°`, Dynamic Island çizilir. `CutOut`: `rounded-2xl`, 1.5 px, tilt −2…2°.
- **Stiker/kaşe:** 2 px kontur, −4°/8° dönük (kodda `.stamp` −3.5°, `.stamp-mark` 6°, hap köşe, 3 px gölge), mono versal; "Sayfada en fazla 2–3 tane." Diğer dönüklükler: yorum kartları `[-1.6, 1.1, -0.7, 1.8]°`, Şekil 01 kesikleri 1.4 / −1.2°, Şekil 03 −1.2 / 1.1 / −0.8°, QR 3°.
- Cam, blur, glow yok; başlıkta `blur` yalnız basamak animasyonunda (8 px, tek sayı).

### 2.7 Hareket kuralları (belge §4, "yönetmenli, 60 fps, hepsi transform/opacity")
1. Hero satırları maskeyle yukarı açılır (kelime kelime, 0.6 s, expo-out); fosforlu şerit soldan sağa çizilir (`scaleX`, 0.45 s). Kodda: `.lr` 0.9 s `--ease-out-expo`, `translateY(125%)`, stagger 0.09–0.1 s; `.mark-draw` 0.55 s, gecikme 0.15 s (hero'da 0.75 s).
2. Sayaç rakamları değişince kayar (`AnimateDigits`, yalnız değişen basamak; giriş 0.55 s `cubic-bezier(.2,1.3,.4,1)`, çıkış 0.42 s).
3. Şerit CSS marquee (varsayılan 48 s, şeritte 64 s), hover'da durur.
4. Altı sekme turu: masaüstünde yatay kaydırma bandı (sticky + `x` transform, `screens=3`, yalnız ≥1024 px), mobilde dikey liste.
5. Özellik kartları üst üste biner (stacking cards; `scaleStep 0.035`, `topOffset 88`).
6. CTA basınca çöker; masaüstünde hafif mıknatıs (±6 px) opsiyonel (uygulanmadı).
7. "`prefers-reduced-motion`: her şey statik ve GÖRÜNÜR (sunucu asla `opacity:0` basmaz)."
Diğer: `.reveal` 0.7 s, `translateY(18px)` yalnız `.js .reveal.below`; canlı nokta `live-pulse` 2.4 s, `scale(3.2)`; `shine-sweep` 3.6 s yalnız Mentor+; sayı yükselişi ~1 s / 12 adım / ease-out kübik; easing token'ları `--ease-out-cubic (.22,.61,.36,1)`, `--ease-out-expo (.19,1,.22,1)`, `--ease-spring (.34,1.28,.64,1)`. Reduced motion'da tüm animasyon/transition 0.001 ms, `scroll-behavior: auto`, marquee kaydırılabilir düz satır. "WebGL/3D yok. Video yok (F1). Lighthouse ≥ 95 hedefi korunuyor."

### 2.8 Doku (gren) ve zemin
`.grain`: `position: fixed; inset: 0; z-index 60; opacity .09; background 176px × 176px` **2-bit PNG (siyah + rastgele alfa, 7,7 KB)**, karışım modu yok. Önceki feTurbulence SVG + `mix-blend-mode: multiply` + 2×2 ekranlık katman her karede tüm sayfayı ayrı yüzeyde birleştiriyordu (ölçüm: ilk boyama −24 ms). `.ruled`: `repeating-linear-gradient` 31/32 px + dikey maske, yalnız hero.

### 2.9 Sayfa planı (landing, §5) ve stil kartı
1 Nav (64 px, kaydırınca 1.5 px mürekkep çizgi, "Ücretsiz indir" mürekkep dolgulu; cam/blur yok) → 2 Hero (canlı satır kırmızı nokta + "Bugün N kişi çalıştı", 4 satırlık başlık "Yalnız / çalışmak / *zorunda* / **değilsin.**", lede, iki mağaza düğmesi + kaşe "ÜCRETSİZ · KAYIT OLMADAN DENE", mürekkep çizgi altında büyük mono sayı; sağda −3.5° telefon + "4,4 ★ App Store" stikeri) → 3 Şerit (mürekkep zemin, lime rakamlar) → 4 Şekil 01 Her gün (üç kâğıt kart Odak/Görev/Tahmin, üst üste biner) → 5 Şekil 02 Altı sekme (koyu bant, liste 01–06 + telefon; yatay bant) → 6 Şekil 03 Disiplin → 7 Yorumlar (App Store, kâğıt kart, marquee) → 8 Mentor+ (mor blok) → 9 SSS (hairline, "+") → 10 Kapanış ("Bugün çalış." + lime düğme) + mono footer. Stil kartı renderı `docs/referans/07-stil-karti-kagit.jpg` tam bu düzeni gösteriyor (altı sekme bandında telefonun lime ofset gölgesi, mor bantta "—,— ₺ / Fiyat ürün sahibinden gelecek (site.config pending)" kutusu dâhil).
Sapma (§9): hero'daki büyük sayı canlı sayı DEĞİL — tarih varsa gün sayacı, yoksa onaylı "50.000+" (sunucuda basılır, kayma yok); canlı sayı üst satırda ve şeritte, yalnız gelince.

### 2.10 Açıkça reddedilenler ve nedenleri
- **Bricolage Grotesque:** "aynı" hissinin ana kaynağı.
- **Antrasit + mavi (`#3E8BFF`) site kromu** ve "her yerde koyu": eski site/uygulamayla aynı okunuyordu; mavi yalnız mockup içinde kaldı.
- **Koyu zemin + mor/mavi glow** (Framer, Superlist, Evervault): "2024'ün 'dark + glow' kalıbı — artık AI-slop sinyali".
- **Gradient blob, glow, indigo→mor gradient, sonsuz shimmer, cam, blur, yumuşak gölge, gradient metin, "floating glow"** (yasak liste).
- **Apple nötrlüğü:** "bir YKS uygulamasında 'kurumsal dershane' gibi okunur".
- **"Ürün demodur" kalıbı** (ürün ekranı tek kahraman): "bizim ekranlarımız küçük ve karanlık; kahraman tipografi olmalı".
- **Maskot/oyuncu illüstrasyon** (Duolingo/Brilliant): "varlığımız yok, tonu küçük yaşa kayıyor".
- **Dershane broşürü dili** (gradient, madalya, stok fotoğraf, slider).
- **3B eğik telefon hero** (21st #27355): önceki turun "aynı site" hissinin parçası; yerine −3.5° düz kesik.
- **İmleci izleyen radyal spot** (#26797): glow yasağı.
- **WebGL/3D/shader zeminleri:** performans ölçütü; "Film greni CSS'ten taşınır, WebGL gerekmez".
- **Video:** `premiumvideo.mp4` eski ürünü anlatıyor (sahte ayrıcalıklar, açık zemin, gradyan hap); 26 Eylül'de video tamamen istenmedi.
- **Sarı yıldız, forum alıntısı, uydurma istatistik, Linear tarzı JS'e bağımlı boş mobil hero.**
- **`motion/react` paketi** (R5): yalnız `/`'de 60 KB gz; yapışkan sahneler ve basamaklar paketsiz yazıldı.
- `backdrop-blur`'lu mockup parçaları (alt nav opak, oynat düğmesi düz beyaz/20).

---

## 3. Referans notları (`docs/tasarim-referans-notlari.md`, 22 Eylül 2026)

**Nasıl çekildi:** Playwright + sandbox proxy'si (Chromium NSS deposuna proxy CA'sı), 1440×900 masaüstü ve 390×844 mobil, tam sayfa; kontakt tabaka başına 6 site, üstten ~2 ekran. awwwards.com proxy'den geçmedi; WebGL ağırlıklı siteler yükleyicide kaldı (Igloo, Lusion, Lando Norris kaskı) → ödüllüler için görüntü + jüri notları birlikte okundu.

### 3.1 Apple (`01-apple.jpg`: ana sayfa, iPhone, iPhone 17 Pro, MacBook Pro, iPad Pro, Vision Pro, AirPods Pro 3)
- "Nesne önce, cümle sonra": tek ürün fotoğrafı, altında 2–4 kelimelik başlık (SF Pro, ~48–56 px, tight); tek iddia; alt satır 16 px gri.
- Ritim siyah/beyaz bloklarla; bölümler arasında hairline yok, boşluk 120–160 px.
- Gradient yalnız markanın renginde ve metinde ("Mmmmm. Power." altın→mavi); zemin daima düz.
- Kart yarıçapı büyük (18–24 px), gölge yok; kart yalnız ton farkıyla (`#f5f5f7` üstünde beyaz).
- Nav 44 px, 11 öğe, 12 px yazı.
- Kaydırma animasyonu deseni: `position: sticky` + kare dizisi/video `currentTime` scrub.
- **Alınacak:** tek iddia/tek nesne; siyah–beyaz blok ritmi; büyük boşluk. **Alınmayacak:** nötrlük.

### 3.2 YC ve startup landing'leri (`02-yc-a/b/c.jpg`)
- **Linear:** near-black `#08090a`, Inter 56 px, iki tonlu paragraf (beyaz + gri), mor accent, ürün UI'ı; "FIG 0.2" teknik doküman etiketleri; en çok kopyalanan B2B sitesi.
- **Vercel:** `#fafafa`, Geist 48 px hafif, −0.06em, siyah accent, dev siyah üçgen; blueprint ızgarası, 11 px mono etiketler, sıkı 3 sütun.
- **Stripe:** beyaz, Sohne, iki tonlu başlık, WebGL gradient şerit tek sağ üstte, istatistik satırı (135+, $1.9T…).
- **Clay:** koyu yeşil gradient hero, grotesk 56 px, sarı-lime CTA `#d9ff00`, 3D kil figürler; sonraki bölümler pastel bloklar (mavi/şeftali/lime/pembe) ürün sütunlarını renkle kodluyor.
- **Mercury:** near-black + sinematik manzara, Arcadia 480, indigo, "alpine banking", tek chromatic accent.
- **Resend:** siyah, Domaine Display serif, mor, 3D Rubik; "serif display 2025–26 trendi".
- **PostHog:** çim yeşili + retro OS pencere kromu, sistem fontu, turuncu buton, kirpi; "en cesur B2B markası".
- **Warp:** beyaz, her şey monospace, elektrik mavi `#1500ff` blok, "fig. 1 — the factory"; mono brutalizm.
- **Replit:** krem/şeftali, grotesk, turuncu `#f26207`, şablon poster ızgarası; kart gruplarını renkle ayırıyor.
- **Speak (YC):** beyaz, yumuşak grotesk, mavi `#3d5cff`, tam genişlik mavi bant, LEARN/PRACTICE/APPLY adımları.
- **Cal.com, Attio, Brex, Rippling, Deel, Retool:** "ürün demodur" kalıbı; ayırt edilmesi zor.
- **Framer, Superlist, Evervault:** koyu + mor/mavi glow — AI-slop sinyali.
- **Alınacak:** Linear'ın iki tonlu lede'si; Vercel/Warp mono etiket sistemi ("Şekil 01"); Clay'in renkle kodlanmış sütunları ve lime CTA; Stripe'ın gerçek istatistik satırı; Speak'in tam genişlik renk bandı. **Alınmayacak:** koyu + mor glow; "ürün demodur".

### 3.3 Ödüllü ve deneysel siteler (`03-deneysel-a…h.jpg`)
- Awwwards SOTY 2024 **Igloo Inc** (WebGL/Three.js), Users' Choice **Don't Board Me**; adaylar Opal Tadpole, Lusion v3; Studio of the Year Immersive Garden; Independent Jesper Landberg. 2025: **Ponpon Mania** (SOTY + Developer; WebGL çizgi roman, iki renk `#7E7EFF`/`#F894C0`, müzik çalar gibi gezinme), **Lando Norris** (SOTM Aralık 2025; 3D kask, Rive, scroll sinematiği, "vibrant lime accents"), Terminal Industries, Cartier W&W.
- Jüri ölçütü (Hon Tran, 2026): *"Art direction — a point of view; Directed motion — the motion has a director, not just a library; Performance — jurors test on real devices, beauty at 60fps is the whole discipline."* Kazanan By-Kin: *"remarkable in restraint — confident editorial typography, generous smooth scroll, transitions that never call attention to themselves."*
- **Dia:** siyah hero, Instrument-Serif tarzı serif logotype + çığlık atan yüz; krem bölümler, mono etiketler ("Decks", "Live Work"), serif başlıklar; "editoryal + brutal karışımının en temiz örneği"; mobilde aynı kararlılık.
- **Anthropic:** sıcak kâğıt zemin, serif başlıkta altı çizili anahtar kelimeler, kâğıt kesme kolaj, 3 sütunlu kartlarda mono meta satırları (DATE / CATEGORY / DETAILS); "kâğıt-mürekkep dilinin kurumsal ölçekte çalıştığının kanıtı".
- **Gumroad:** krem, 2 px siyah konturlu kart/buton, sert ofset gölge, pembe 3D "G"; "neo-brütalizmin ticari, okunur hâli".
- **Teenage Engineering:** saf siyah/beyaz, ağır kondanse tipografi, hairline tablo listeleri; "brutalizmin ürün kataloğu yorumu".
- **Lando Norris:** krem `#F2F1EC` + topografya çizgileri, lime `#D7FF00` mağaza düğmesi, kondanse bold logotype; "krem + lime çiftinin en iyi örneği".
- **Locomotive:** kırmızı tam ekran portre, serif + grotesk logotype, "OPS / DES / DEV" etiketler. **Readymag:** kırmızı/siyah, dev kesik tipografi, turuncu CTA. **basement.studio:** siyah, tel kafes 3D merdiven, serif dev başlık, hairline logo ızgarası. **Family:** beyaz, 3D stiker emojiler. **Amie:** el çizimi oklar, not düşülmüş ekran görüntüleri (defter hissi). **Granola:** krem + serif + lime kâğıt kesikleri. **Arc:** elektrik mavisi + tırtıklı kenar, serif alıntı. **Sanity:** siyah + turuncu bant, mono liste. **Rive:** siyah + versal mono + CLI kutusu. **x.ai:** beyaz, ürün karoları, kırmızı gradient kod kartı. **Poolsuite:** retro Mac OS pembe. **Daylight:** çim/yosun fotoğraf + turuncu CTA.
- Yüklenemeyenler: Igloo, Lusion, Cursor, awwwards.com, lovable/openai/perplexity/quizlet (Cloudflare doğrulaması), Nothing (çerez kapısı).
- **Ortak paydalar:** (1) tipografi kahraman, çoğu zaman grotesk + serif italik; (2) kâğıt/krem zemin geri döndü; (3) mono etiketler ve şekil numaraları; (4) tek çığlık renk; (5) hareket yönetmenli (sticky sahne, maskeyle açılan satır, sayan rakam; sonsuz parlama yok); (6) sert kenar ve ofset gölge "dokunulabilirlik".

### 3.4 Eğitim uygulamaları ve YKS rakipleri (`04-egitim-rakipler-a/b.jpg`)
Duolingo (beyaz, `#58cc02`, Feather Bold, karakterler, mobil tek CTA); Brilliant (krem, yeşil CTA, Koji maskotu, kart ızgarası); Kunduz (beyaz/mavi kurumsal, stok fotoğraf); Notion; Doping Hafıza (lacivert, altın madalyalar, "Sayısız Ödül ve Başarı!", 44.900 TL fiyat kartı); Tonguç Akademi (turuncu/mor gradient, çizgi film çocuk); Raunt (stok fotoğraf, "+35 dakika kazan!" rozeti, kırmızı buton, slider); Hocalara Geldik (mavi kurumsal, şube duyuruları). **Sonuç:** *"Türkiye'deki YKS sitelerinin tamamı dershane broşürü dilinde … Sessiz, keskin, tipografik bir site bu kategoride tek başına duracak — 'farklı olmak' için abartıya değil disipline ihtiyaç var."*

### 3.5 Mobil (`05-mobil.jpg`: Apple iPhone, Clay, Dia, Duolingo, Family, Lando Norris, Linear, Mercury)
Tek sütun, dev başlık (Clay 44 px, Family 40 px), tek CTA, kahraman nesne başlığın altında; Dia ve Clay karakteri korumuş; Linear mobilde tamamen boş (JS'e bağımlı hero) — kaçınılacak.

### 3.6 "Derin" tabakalar (`06-derin-a…d.jpg`)
Aynı sitelerin kıvrım altı derin kesitleri (6 site × 4 tabaka): a) Dia, Anthropic, Gumroad, Family, Teenage Engineering, Duolingo; b) Stripe, Vercel, Clay, Mercury, Speak, Brilliant; c) Warp, Resend, PostHog, Replit, x.ai, Apple iPhone 17 Pro; d) Dia, Gumroad, Stripe, Clay, Teenage Engineering, Duolingo (daha aşağısı). Notlar belgesinde ayrı başlığı yok; gözlemleri §2–§3'e işlenmiş (tabakada görülenler: Anthropic'in DATE/CATEGORY/DETAILS mono satırları ve hairline haber listesi; Dia "Built for how you actually work" / "Privacy first, with you in control" serif + mono çip; Stripe istatistik satırı 135+ / $1.9T / 99.999% / 200M+; Warp'ın `#1500ff` "Cutting our cost per PR from $80 to $30" bloğu ve "fig." etiketli mono grafikler; Clay'in DATA/AGENTS/ORCHESTRATION/EXECUTION pastel sütunları; Speak'in LEARN/PRACTICE/APPLY kartları; Teenage Engineering'in koyu zeminde ürün fotoğrafı + hairline ürün listesi; Duolingo'nun "Super Duolingo" mor bandı).

### 3.7 Çıkarımlar (§6)
1. "Zemin kâğıt olsun, mürekkep siyah" — koyu ton bant olarak dönsün. 2. "Tek çığlık renk: fosforlu lime" (öğrencinin fosforlu kalemi; mavi accent'e veda). 3. "Tipografi kahraman" (wdth 118 ağır grotesk + serif italik + mono etiket; Bricolage'a veda). 4. "Dokunulabilir kenar" (1.5–2 px kontur, sert ofset gölge, çöken düğme; cam/blur/glow yok). 5. "Hareket yönetmenli, 60 fps" (WebGL yok). 6. "Gerçek sayılar, gerçek metin."

---

## 4. 21st.dev aday bileşenler (`docs/21st-dev-bilesen-adaylari.md`)

**Koşullar:** 22 Eylül 2026, 21st.dev MCP `search` (`.mcp.json`: `https://21st.dev/api/mcp`, `x-api-key: ${TWENTYFIRST_API_KEY}`). Ücretsiz katman: arama sınırsız, **kod çekme günde 2**, AI üretimi kapalı; sonra Builder üyeliği (sınırsız). Önizlemeler görülemedi (`cdn.21st.dev` CONNECT 403) → uyum notları açıklamalara dayanır, görsel karar ürün sahibinde. Bu belge plan §5'teki parça listesinin katalog karşılığıdır; **kod yok**.

**Seçim süzgeci ("anayasa", §0 — verbatim):** "Bir aday şu dördünden birini ihlal ediyorsa doğrudan alınmaz, soyulur: 1. Gradient blob / glow / indigo→mor gradient / sonsuz shimmer … 'Floating glow background' yazan her hero'nun o katmanı silinir. 2. Mor yalnız Mentor+ işaretinde; birincil accent tek mavi `#3E8BFF` [ilk tur; sonra lime]. 3. Hareket bilgi taşımalı; `prefers-reduced-motion`da statik ve TAM. 4. Sunucuda çizilebilir olmalı (SEO gövdesi istemci adasına gömülmez)."
**Çekme ekonomisi:** Aceternity (manuarora700), Magic UI (dillionverma), Origin UI, Motion örnekleri (motiondotdev), shadcn kendi sitelerinde açık kaynak → hak harcamaz; günlük 2 hak kapalı katalog yazarları için (ruixen.ui, hirael, solaceui, shadcnspace, unlumen, abui, flexnative, 7ovr, ln-dev7, uilayout, componentry, efferd). Kurulum biçimi: `npx shadcn@latest add "https://21st.dev/r/<yazar>/<slug>?api_key=$API_KEY_21ST"` — "anahtar ortam değişkeninde, repoya ASLA yazılmaz." Uygulamada registry proxy'den geçmediği için kod MCP'den alınıp **elle** yerleştirildi; lisanslar MIT, dosya başına yazar notu.

**Kabul kuralı (bir 21st.dev parçası nasıl girer):** (a) dört maddelik süzgeç; (b) "Seçilen parça birebir alınmaz, token'lara giydirilir" (plan §5); (c) hareket CSS'e taşınır, JS yalnız sınıf verir, sunucu görünür basar; (d) R5'ten sonra `motion/react` bağımlılığı olmadan yeniden yazılır (`lib/scroll-progress.ts`, CSS keyframe); (e) `src/components/motion/` altına kopyalanır, kaynak numarası + yazar + lisans dosya başında; (f) Playwright ekran görüntüsüyle onaya gelir.

### Aday listesi ve sonuçlar
**§1 Navbar:** 18120 Navbar Section 2 · solaceui (koyu nav + mega-menü; "Öneri") · 2307 Navbar 5 · shadcnblockscom (güvenli, saf shadcn) · 2046 Navbar 1 · preetsuthar17 (yüzen kapsül) · 25735 Adaptive Notch · arunachalam (cesur, gimmick riski) → **Hiçbiri alınmadı:** "kâğıt üst çubuk tek satır, mega-menü F2/F3'te içerik geldiğinde." Header kendi yazımı (paketsiz).
**§2 Hero:** 27355 Phone Scroll Hero · ruixen.ui ("1. öneri, ilk çekme adayı"; reduced-motion yedeği var) → **Elendi** (3B eğik telefon "aynı site" hissi; yerine −3.5° düz kesik + stiker; kasa `app/phone.tsx` kendi yazımı) · 20020 Phone Mockups 1 · solaceui (dönen iPhone; ikincil) · 1492 Hero with Mockup · Launch UI ("floating glow" + "gradient text" SİLİNİR; iskelet iyi) · 24478 Hero with Device Mockups · solaceui (masaüstü ürün yok) · 23322 Great UI Mobile Mockup · saurabh-2607 (gerçek kasa çerçevesi) · 2532/11494 Hero With Video / Cinematic · jahed (video kararı; `poster` + LCP) · 6474 Iphone Mockup · lovesickfromthe6ix (yardımcı) → hiçbiri çekilmedi.
**§3 Kaydırmalı anlatım:** 952 Sticky Scroll Reveal · Aceternity (açık kaynak, "doğrudan uygun") · 19203 Scroll Reveal Content A · abui (numaralı bloklar + ilerleme çizgisi; çekme adayı) · 18041 Scroll 01 · flexnative · 1959 Animated Video on Scroll · youcefbnm ("10.000 dolar anı", CWV riski, F1 stretch) · 6265 Interactive Scrolling Story · minhxthanh → yerine **24623 Scroll Horizontal Gallery · motion.dev "deseni alındı"** (`motion/horizontal-scroll.tsx`; genişlik ölçülür, `lg` altında dikey liste; R5 paketsiz).
**§4 Metin reveal:** **19257 Text Reveal (Mask) · soralabs → "Alındı, yeniden yazıldı"** (`in-view.tsx` `LineReveal`; hareket CSS `.lr`, JS yalnız `in` sınıfı) · 24525 Scroll word reveal · motiondotdev · 9386 Reading Text Reveal · waleedkibhen (manifesto) · 27105 Text Blur Reveal · wensity ("blur pahalı; yalnız tek başlıkta") · 856 Text Reveal · Magic UI → alınmadı; **18595 Vertical Cut Reveal · cnippet-dev → "Alınmadı"** (karakter bazlı animasyon fazla; `LineReveal` yeterli).
**§5 Bento:** 26797 Feature Grid Spotlight Cards · hirael ("1. öneri": hairline ayraçlar, köşe artıları, imleç spotu) → **Elendi** (radyal spot = glow yasağı; yerine üst üste binen kâğıt kartlar) · 18898 Feature Bento · uilayout · 28481 Bento Grid · arihantcodes · 1327 · tommyjepsen · 1197 · Aceternity → alınmadı; **25275 Stacking Cards · danielpetho (fancycomponents, MIT) → "Alındı"** (`motion/stacking-cards.tsx`, Şekil 01; reduced motion: yapışma yok; R5 paketsiz).
**§6 Sosyal kanıt:** 822 Testimonials with Marquee · Launch UI ("Öneri", CSS tabanlı) · 24457 Testimonial Marquee · componentry · 26568 Vertical · shadcnspace · 19852 · shadcnspace · 19354 CTA Section 2 · shadcnstore (avatar yığını) → **kendi CSS marquee** (`.marquee`), kartlar kâğıt ve dönük; kod çekilmedi.
**§7 Sayaçlar:** 21515 Number Ticker Real-Time · shadcnspace ("Öneri") → yerine kendi `LiveCount` · 20068 Count Up · unlumen · **20071 Animate Digits · unlumen → "Alındı"** (`motion/digits.tsx`; yalnız değişen basamak; R5 CSS keyframe) · 1054 Count Animation · bundui · NumberFlow (npm, bileşen gerekmez).
**§8 YKS sayacı:** 19328 Animated Countdown · nexus-ui ("Öneri", minimal) · 3809 FlipCountdown · jahed (retro) · 19154 Timer · cult-ui → kendi `countdown.tsx`; flip sayaç F2 araç sayfasına ertelendi.
**§9 Mentor+:** 21218 Feature Comparison Table · 7ovr ("Öneri") · 26895 Two-Plan Pricing · ln-dev7 · 18957 Pricing with Toggle · efferd · 1541 Pricing Table · kokonutd · 29547 · uiable → kararsız/ertelendi (fiyat gelene kadar "Fiyatı uygulamada gör").
**§10 SSS:** 23530 Accordion · ddoemonn ("Öneri") · 24907 Plus/Minus · cnippet-dev · 11311 · coss.com → yerine **native `<details>/<summary>`** (`name` ile tek açık; FAQPage JSON-LD aynı metin).
**§11 Nasıl çalışır:** 26891 How It Works Steps · ln-dev7 ("Öneri", ikonsuz) · 19861 · chamaac · 19863 Timeline · 7ovr → alınmadı.
**§12 CTA/indirme:** 28155 CTA Section · shadcndesign ("sayfadaki tek dolu mavi yüzey") · 18475 · felipemenezes098 · 8291 App Download Section · ravikatiyar162 (`/indir`) · 12248 QR Code · tom_ui · 8280/7268 mağaza rozetleri → kendi `cta-band.tsx`, `/indir`, satır içi QR SVG (`content/qr.ts`), Phosphor ikonlu düğmeler.
**§13 Footer:** 8284 Footer 2 · efferd ("Öneri") · 2223 Footer 7 · shadcnblockscom · 19358 Footer Section 5 · solaceui (shader panel; "görüp karar") · 28291 · shadcnui-blocks → kendi footer.
**§14 Düğme/mikro:** 12909 Native Button · moumensoliman ("Öneri", glow KAPALI) · 833 Shimmer Button · Magic UI (yalnız Mentor+ CTA, mor) · 1878 Shining Button · 2220/986 Spotlight Card · **5793 Glow Button → "Alınmaz" (glow yasak)** → kendi `.press` düğmesi + `.shine-sweep`.
**§14b F2 araç parçaları:** 24930 Animated Tabs · educalvolpz ("Öneri"; TYT↔AYT) · 24956 Underline Tabs · 310 Slider · originui (açık kaynak; net girişi) · 10326 Slider · micka_design · 22095 Circular Progress · shadcnui-blocks · 4300 · sean0205 · 7506 Review Summary Card · lavikatiyar ("yalnız gerçek sayıyla") · 926 Testimonial Card · preetsuthar17 → F2'de değerlendirilecek.
**§15 Elenenler:** shader arka planlar (paper-design Grain Gradient 17835/24043, Nice BG 19967, Ocean grain 24379: "gradient blob sınıfı — anayasa dışı"), Glow Button 5793, Shiny Button gradient 10381, hero "gradient text"/"floating glow" katmanları (1492, 829); şablon araması boş ("mobile app landing page dark") → parça birleştirme yolu.
**§16 Önerilen çekme sırası (günde 2):** 1. gün 27355 + 26797; 2. gün 21515 + 19203; 3. gün 21218 + 24457; 4. gün 19328 + 8291; açık kaynaklar (952, 1197, 833, 856, 24525, 1327) hak harcamadan.
**Diğer:** 27010 Hover Expand Gallery · kedhareswer → "Ertelendi" (/ozellikler dokuz paneli, F2).
**Kodda kalan 21st.dev izi:** `stacking-cards.tsx` (#25275), `horizontal-scroll.tsx` (#24623 deseni), `digits.tsx` (#20071), `in-view.tsx` `LineReveal` (#19257 yeniden yazım). Tasarım belgesi §6'daki ilk "alınanlar" tablosu (19257, 18595, 25275, 24623, 20071, 27010, 27355/26797) sonradan R3 seçim tablosuyla daraltıldı.

---

## 5. Kurallar (numaralı; kısa olanlar verbatim)

**Renk ve yüzey**
1. "Tek accent lime, yalnız dolgu (kâğıt üstünde metin rengi değil)."
2. "Lime hiçbir zaman kâğıt üstünde METİN rengi değildir (1.3:1)."
3. "Mor yalnız Mentor+; kırmızı yalnız canlı nokta ve 'kaçırıldı'."
4. "Gradient / blur / glow / cam / sonsuz shimmer YOK. Tek doku: kâğıt greni. Tek istisna Mentor+ CTA'sındaki tek huzme."
5. "Düzlemler kontur + sert ofset gölgeyle ayrışır; yumuşak gölge yok."
6. "Eski mavi accent (`#3E8BFF`) site kromunda YOK; yalnız uygulama mockup'larının içinde."
7. Uygulama mockup'ları kendi paletini kullanır ve "daima bir 'kesik' (CutOut / Phone) içinde çizilir"; site kromunda uygulama token adları kullanılmaz.
8. Yıldızlar mürekkep, sarı değil; uygulamanın sarısı yalnız mockup içinde.
9. Kontrast ölçülür: ikincil metin AA (ink-3 5,07:1; mürekkep bandı 5,69:1; mor bant 4,78:1; mockup fg-3 5,78:1).
10. Stiker/kaşe sayfada en fazla 2–3; defter çizgileri yalnız hero.

**Tipografi**
11. Display Archivo yalnız iki statik kesit (118 %/850, 108 %/800), `font-stretch` ile seçilir; "Yeni ağırlık/kesit gerekirse SPEC'e satır ekle, koştur, commit'le."
12. Serif italik vurgu başlıkta TEK kelime.
13. Mono etiketler versal, 11.5–12.5 px, tracking .12em; mono'da `₺` yok → fiyat Inter.
14. `text-transform: uppercase` yalnız `lang="tr"` altında; JS'te `toLocaleUpperCase("tr")`; URL slug'ları ASCII (`ı→i`, `ş→s`, `ğ→g`).
15. Uzun okuma 17–18 px gövde, 65–75 karakter satır (`.prose` 66ch).
16. h1 tabanı `min(3.1rem, 12.5vw)`; başlık satırları `nowrap` (kelime kırılmaz), gövdede `overflow-wrap: anywhere`.
17. Bricolage/next/font/@fontsource yok; "Font eklenmez, üretilir"; `size-adjust` ölçümden; display `optional` + ön-yüklü, gövde/mono `swap`; kıvrım üstünde kullanılacak yeni kesit ön-yükleme listesine girer.

**Hareket**
18. "Hareket BİLGİ taşımalı; süsleyen hareket kesilir."
19. Yalnız `transform/opacity`, 60 fps; WebGL/3D yok; video yok.
20. "`prefers-reduced-motion`da her şey statik ve TAM/GÖRÜNÜR"; sunucu asla `opacity:0` basmaz; gizli başlangıç yalnız `html.js` + öğe ilk ekranın altındayken.
21. Kıvrımın üstündeki açılış hidrasyonu beklemez (CSS animasyonu, `in` sunucuda basılı).
22. Sonsuz parlama yok; huzme yalnız Mentor+ CTA'sında; hover parlaması sürekli değil hover'da (ArenaMotion kuralı).
23. Yapışkan sahnelerin hiçbir atası `overflow: hidden/auto` taşımaz; yatay bant yalnız ≥1024 px, mobilde dikey liste; mobilde pin yok.
24. Blur animasyonu yalnız tek sayı/başlıkta ("blur pahalı").

**Dürüstlük**
25. "Sayı uydurulmaz." Her sayı `site.ts`'ten, kaynağı yorumda; `null`/`pending` iken blok çizilmez.
26. Canlı sayı yalnız API'den gelince ve eşik (20) üstündeyse çizilir; "sahte değer yok".
27. Mağaza puanı yalnız doğrulanmış değerle (4,4 / 38; `itunes.apple.com/lookup` ile teyit).
28. "'Garanti' dili yok (sıralama tahmini 'tavan senaryo')"; "envanterde olmayan özellik yazılmaz"; mağaza açıklamasındaki eski ifadeler siteye girmez.
29. Toplam kullanıcı sayısı yalnız ürün sahibinin onayladığı yuvarlak rakamla ("50.000+"), başka hiçbir yerde.
30. Forum içeriği indekslenmez; web'e yalnız seçilmiş anonim alıntılar; ad/avatar/gönderi bağlantısı asla.
31. Başka kullanıcıların adları görüntülerde bulanıklaştırılır; mentorlar ve ürün sahibi kalır.
32. Mentor+ sayfası paywall karşılaştırma tablosunun dışına çıkmaz (App Store 2.3.1).

**Dil ve metin**
33. "Ses: 'sen', kısa cümle, ünlem yok, emoji yok"; her sayfanın tek vaadi.
34. Eski sitenin üç ana cümlesi korunur ("Yalnız çalışmak zorunda değilsin." / "Motivasyon biter. Düzen kalır." / "Sınavı kazanmış biriyle aynı odada ol.").
35. Tek CTA "İndir" ("kayıt ol" değil; misafir varsayılan).
36. E-E-A-T: rehber yazarı gerçek mentor; tarih + "güncellendi"; ÖSYM kaynağı.
37. İç belgeler Türkçe; ürün arayüzü Türkçe (`html lang="tr"`).

**Mühendislik ve SEO**
38. Hiçbir sayfa yalnız istemcide çizilmez; SSS/araç gövdesi sunucuda, JSON-LD ile aynı metin.
39. Kanonik apex; `www` 301; sayfa başına `canonical`; sitemap yalnız gerçek sayfalar; `/api/`, `/v/` robots'ta kapalı.
40. JSON-LD'de `<` kaçırılır.
41. Görseller önceden boyutlandırılmış WebP + `srcset`; `next/image` yok (`images.unoptimized`); hero dışında `loading="lazy"`; "`eager` verme".
42. "Kıvrım altı bölümler tembel çizilir" (`main > section:nth-of-type(n+3)`, `.lazy-render`); ilk iki section ve footer hariç.
43. `BACKEND_ORIGIN` tek kaynak (`wrangler.jsonc vars`); derin bağlantı proxy'si yönlendirme takip etmez, Set-Cookie geçirmez; AASA statik kopya ELENDİ.
44. Canlı istekler kendi `/api/*` rotasından, 60 sn önbellek; backend'e sayfa görüntüleme başına istek gitmez.
45. `.woff2` yeniden üretilince bayt değişir; CSS aynıysa ikiliyi commit'leme.
46. Ölçüm olmadan teslim yok: shots + overflow 390 px 1.0×/1.6× + Lighthouse; "önce aracı sorgula".
47. Analitik/çerez kararı gelene kadar site çerez koymaz.

**21st.dev**
48. Dört maddelik süzgeç (§4); "Floating glow background" katmanı silinir; parça token'lara giydirilir; API anahtarı repoya yazılmaz.

**Miras (legacy anayasa, kısmen devralındı)**
49. "Derinlik gölgeyle değil, ton + 1px hairline ile" (`rgba(255,255,255,.10)`) — mockup iç yüzeylerinde hâlâ geçerli.
50. "Logoyu tek renge boyama (`fill: currentColor`, `filter: invert()`): beyin sembolünün iç çizgileri kayboluyor" — yeni sitede kâğıt üstünde `filter: invert(1)` kullanıldı (iç çizgiler korunur), sönükleştirme opaklıkla.
51. "Görev serisinde renk tek başına anlam taşımaz (tik / çarpı ikonu da var)."

---

## 6. Teknik kararlar

- **Stack (gerçekleşen):** Next.js **16.3.5** (App Router, Turbopack; plan "15" demişti), React 19.2.8, Tailwind v4 (`@tailwindcss/postcss`), TypeScript 5 strict, ESLint 9 + `eslint-config-next` (core-web-vitals + typescript; `@next/next/no-img-element` kapalı), `class-variance-authority`, `clsx`, `tailwind-merge`, `@phosphor-icons/react`. `motion/react` KALDIRILDI; shadcn yalnız token alias'ı olarak var (Radix paketi yok); MDX henüz yok (F3). Astro elendi (ağır animasyonlu landing + React bileşen ihtiyacı).
- **Hosting:** Cloudflare Workers + `@opennextjs/cloudflare` ^1.20.6, `wrangler` ^4.136. `wrangler.jsonc`: `main .open-next/worker.js`, `compatibility_date 2026-09-01`, flags `nodejs_compat` + `global_fetch_strictly_public`, `assets` binding `ASSETS`, `vars.BACKEND_ORIGIN`, `routes` apex + www `custom_domain: true` (elle A/CNAME varsa deploy 100117 ile düşer), observability açık, `send_metrics false`, `account_id` sabit. `open-next.config.ts`: ISR/önbellek katmanı YOK. `next.config.ts`: `initOpenNextCloudflareForDev()`, `images.unoptimized: true`, `poweredByHeader: false`, redirects (www→apex 301, `/download` ve `/app` → `/indir`), rewrites (`/.well-known/apple-app-site-association` → `/api/deep-link/aasa`, `assetlinks.json` → `/api/deep-link/assetlinks`). Deploy elle `npm run deploy`; Vercel yedek seçenek.
- **Backend köprüsü:** `src/lib/backend.ts proxyBackend` (`redirect: "manual"`, `cf.cacheTtl`, 502 düz metin, `vary: User-Agent`); `/v/[id]/route.ts`; `/api/active-today` (`force-dynamic`, 60 sn edge, hata → `count: null`).
- **Fontlar (kendi altküme, `scripts/fonts/build.py`):** fontTools + brotli + uharfbuzz; kaynak google/fonts OFL (`.cache/fonts/`, lisanslar `src/fonts/OFL-*.txt`); kod aralığı ASCII + Latin-1 + Latin Ext-A + noktalama/ok/yıldız/`₺` (`UNICODES`); SPEC: `archivo-wide-850.woff2` (wdth 118/wght 850), `archivo-semiwide-800.woff2` (108/800), `inter-text.woff2` (opsz 14, 400–700), `jetbrains-mono.woff2` (400–700), `instrument-serif-italic.woff2`; toplam **462 KB/7 → 111 KB/5**; fontTools sırası önce altküme sonra kesit. Yedek yüzler: Arial/Helvetica/Liberation Sans ve Roboto (sans), Times/Liberation Serif Italic ve Noto Serif Italic (serif); `size-adjust` + ascent/descent/line-gap override **ölçümle** (sitenin Türkçe `CORPUS`u HarfBuzz ile iki fontta şekillendirilir; Arimo/Tinos metrik ikizleri); ağırlık başına ayrı yüz (Inter 105.46 / 106.66 / 107.82 / 109.01 % Arial; Archivo 118.75 % ve 132.28 % Arial; Instrument Serif 88.94 % Times). İlk hesap (next/font tarzı xWidthAvg) %10–17 fazla çıkıp CLS 0,136 üretmişti. Display aileleri `font-display: optional` + `layout.tsx`te `react-dom preload` (Turbopack `import` ile hash'li URL, `src/types/assets.d.ts`); gövde/mono `swap`. Sonuç: font isteği 344 → 67 ms, FCP 1,8 → 1,4 s, CLS 0.
- **Görsel boru hattı:** `assets/screens/*.png` (1206×2622, iPhone 16 Pro) → `scripts/screens/build.py` (Pillow; `BLUR` sözlüğü; 480/768/960 w, WebP q75) → `public/screens/`; `Shot` (kasada tam ekran, `object-cover`, hero `priority` eager + `fetchpriority=high`, diğerleri lazy) / `ShotCrop` (aynı dosya `object-position` ile kupür; dilim = (1/aspect)/2.174). Düz `<img>` + `srcset/sizes`. Marka varlıkları uygulamadan olduğu gibi (`mentor-wordmark.png/.webp`, `app-icon`, `favicon`, `apple-touch-icon`, `avatars/a1–a8.webp`, `mentor-plus.webp`).
- **OG üretimi:** `next/og` (Satori) DEĞİL — "Cloudflare'de font dosyalarını ayrıca yüklemeyi ister ve değişken font eksenlerini (wdth) desteklemez". `scripts/og/render.mjs` Playwright Chromium'da `template.html`i 1200×630 çizer (`--allow-file-access-from-files`), gerçek fontlar `src/app/fonts.css`, token'lar siteyle aynı, başlık 128 → en az 84 px otomatik küçülür; çıktılar `public/og.png`, `og-mentor-plus.png`, `og-ozellikler.png`. `layout.tsx`: `metadataBase`, başlık şablonu `%s — Mentor`, OG `tr_TR`, twitter `summary_large_image`, ikonlar, `robots index/follow`, `viewport.themeColor #f4f1ea`.
- **SEO:** `sitemap.ts` 15 rota (öncelik 1 → 0.2), `robots.ts` (`disallow /api/, /v/`), `JsonLd` (MobileApplication + AggregateRating 4,4/38, Organization, FAQPage; iç sayfalarda BreadcrumbList), sayfa başına `canonical`, `lang="tr"`, hukuki metinler `scripts/legal-import.py` ile Dart kaynağından üretilir ("iki taraf AYNI metni gösterir").
- **`/indir`:** `force-dynamic`; UA'ya göre 302 (iOS/Android), botlar `unknown` (sayfa indekslensin), iPadOS masaüstü; `?src=` kampanya (`hero, nav, footer, closing, plus, feature, tool, qr, indir, blog`) → Play `referrer=utm_*`; iOS `pt/ct` sağlayıcı kimliği gelene kadar eklenmez; masaüstünde iki düğme + QR.
- **Performans teknikleri:** `content-visibility: auto; contain-intrinsic-size: auto 800px`; `trackScrollProgress` (rAF + ResizeObserver + IntersectionObserver `rootMargin 100%`, React state yok, DOM'a doğrudan yazar); `Reveal` `useLayoutEffect` kullanmaz (karar IO'nun ilk girişindeki rect'ten, eşik `innerHeight*0.92`); `useReducedMotion` `useSyncExternalStore`; `html.js` bayrağı `<head>`te satır içi script; gren PNG; tek inflight canlı sayı isteği.
- **CI/kalite kapısı:** §1.6. `.gitignore`: `.open-next`, `.wrangler`, `.lighthouseci`, `.shots`, `.cache/`.
- **Legacy:** `legacy/` (Vite + React 19, Worker `links.ts`/`qr.ts`/`downloadPage.ts`) referans için tutulur; tsconfig/eslint dışında.

---

## 7. Bu projede işe yarayacak fikirler (BMW ürün yöneticileri için koyu, premium, veri ürünü landing'i; hero: etkileşimli tel kafes küre, üç tıklanabilir bölge Çin / ABD / AB)

1. **Tek palet, bant başına kaskat edilen `data-theme`.** Mentor'un "aynı adlar, ters değerler" yaklaşımını tersten kur: koyu zemin varsayılan (`paper #141311`-benzeri), `ink` metin; bölge vurgusu ya da "karşılaştırma" paneli için ikinci bir bant (`data-theme="region"`) yalnız değişken değerlerini değiştirsin, bileşen sınıfları değişmesin. Ürün ekran görüntüleri/dashboard'lar için **ayrı ad uzayı** (`page/surface/fg`) tut ki ürün paleti site kromuna sızmasın; shadcn alias'larını (`--color-background → …`) `@theme inline` ile haritala.
2. **Tek çığlık renk kuralı + ikinci rengin tek görevi.** Lime benzeri tek accent yalnız dolgu/işaret; koyu zeminde metin olabilir (lime siyah üstünde 16:1). Üç bölgeyi üç renkle değil **şekil + mono etiket + konumla** ayır; renk gerekirse ikinci hue'yu Mentor'un "mor yalnız Mentor+" disipliniyle tek bir ürün katmanına rezerve et. Kırmızı yalnız "CANLI" nokta.
3. **Mono etiket + şekil numarası omurgası.** `FIG. 01 — CHINA`, `02 — USA`, `03 — EU`; kicker önünde 22×1.5 px çizgi; hayalet dev rakam `::before` + `data-figure` (erişilebilirlik ağacına girmez, axe kontrast alarmı vermez). Vercel/Warp/Anthropic'in "teknik şartname" hissi veri ürününe doğrudan uyar.
4. **Sayı dürüstlüğü altyapısı.** Tüm metrikler tek `content/site.ts`'te, kaynağı yorumda; `null` → blok çizilmez; canlı metrik yalnız API dönünce ve eşik üstünde; `pending` iken "veri bekleniyor" satırı. Küre üzerindeki bölge sayıları için `verified/estimated` bayrağı ve tarih. Sahte yer tutucu değer hiç basılmaz.
5. **Küre için "sunucu görünür basar" ilkesi.** Hero'nun statik SVG tel kafes küresi SSR'da gelsin (LCP adayı, JS'siz ve reduced-motion'da da tam); WebGL/canvas yalnız `html.js` + `prefers-reduced-motion: no-preference` + ilk boyamadan sonra devreye girsin, sekme görünmezken dursun. Mentor WebGL'i tamamen reddetti ("performans ölçütü"); küre zorunluysa jüri ölçütünü bütçe yap: "beauty at 60fps", gerçek cihazda test.
6. **Üç bölge = üç "oda" kaydırma sahnesi.** Altı sekme turunun deseni: sticky sahne + `trackScrollProgress` (rAF + RO + IO, React state yok) ile küre kaydırdıkça Çin → ABD → AB'ye döner; sol liste 01–03; ≥1024 px'te yapışkan, mobilde düz dikey liste. Tuzak: sticky'nin hiçbir atası `overflow: hidden/auto` olmasın.
7. **Tıklanabilir bölgeler canvas hit-test'ine bırakılmaz.** Küre üstüne gerçek `<button>` (≥44 px hedef, `aria-pressed`, klavye), aktif bölge fosforlu alt çizgi (header'daki `decoration-mark 3px` kalıbı), odak halkası 2 px / offset 3 px. Reduced motion'da bölge seçimi anında, animasyonsuz.
8. **Satır maskesi + çizilen vurgu + değişen basamak.** `.lr` (overflow-y clip, 0.1em/0.16em pay, `translateY(125%)`, 0.9 s expo-out, stagger 0.09 s) başlık için; `.mark-draw` (`scaleX`, 0.55 s, gecikmeli) tek anahtar kelime için; `AnimateDigits` bölge KPI'ları değişince yalnız değişen basamağı kaydırır. Kıvrım üstünde `immediate` → CSS animasyonu, hidrasyon beklenmez.
9. **Koyu premiumda derinlik: ton + 1 px hairline, gölge yok.** Legacy anayasa ("`rgba(255,255,255,.10)` hairline, L0/L1/L2 ton kademesi, glow yok") veri ürünü kartları için doğru temel; Mentor'un sert ofset gölgesi (`6px 6px 0 0 accent`) ise tek bir "kesik" öğede (dashboard ekran görüntüsü kasası) kullanılabilir. Glow, gradient blob, cam, blur yasak listesi aynen.
10. **Gren ucuz yapılır.** 176 px 2-bit PNG (7,7 KB), `opacity .09`, `position: fixed; inset 0`, karışım modu YOK; feTurbulence + `multiply` ilk boyamaya 24 ms maliyet. Koyu zeminde alfa greni aynı şekilde çalışır.
11. **Font boru hattı.** Aile başına tek altküme (Latin + Latin-1 → Almanca ß/ü/ö dâhil), display için statik kesit (variable 176 KB yerine ~40 KB), yedek yüz `size-adjust`i gerçek site metninin HarfBuzz ölçümünden ve ağırlık başına; display `optional` + `preload`, gövde `swap`; `cls-probe` ile kaymanın kaynak düğümü bulunur. Hedef CLS 0.
12. **Ölçüm kiti olduğu gibi.** `overflow-check` (390 px, 1.0× ve 1.6× yazı), `shots` (reduced motion varsayılan; `content-visibility` bölümleri zorla çizdir), `scroll-shots` (yapışkan sahne oranları; `pageerror`/konsol/4xx basılır), `paint-probe` (nojs/nofonts/nograin varyantları ve `HIDE=` bisect), kendi süreç grubunda sunucu, Lighthouse CI 3 koşu / perf kapısı gürültüye göre 90. "Önce aracı sorgula" notunu koru.
13. **`content-visibility: auto` disiplini.** `main > section:nth-of-type(n+3)` + `.lazy-render`, `contain-intrinsic-size: auto 800px`; ilk iki bölüm ve footer hariç; sahne içinde ölçü alan kod bölüm çizilince yeniden ölçer. Bölge sahneleri ve grafik blokları için aynı.
14. **OG görselleri gerçek fontla Playwright'tan.** Satori yerine token'ları paylaşan HTML şablonu, 1200×630, başlık otomatik küçülür; bölge başına varyant (`og-china.png` …) kolay.
15. **Yöntem: referans turu → üç yön → stil kartı → kod.** 6'lı kontakt tabakalar (masaüstü 1440×900 + mobil 390×844 + kıvrım altı "derin" tabakalar), her referans için "Alınacak / Alınmayacak", üç aday yönün tablo karşılaştırması (zemin, accent, referans, kopuş, risk), seçilen yönün kâğıt/mürekkep/mobil stil kartı renderları, ürün sahibi onayı, ardından §9 tarzı "plandan sapmalar" günlüğü. 21st.dev için dört maddelik süzgeç: glow katmanı silinir, iskelet alınır, token'lara giydirilir, paketsiz yeniden yazılır, lisans/yazar notu dosya başında.
16. **Kampanya atıflı tek CTA.** `/indir?src=hero|closing|footer` deseni → BMW'de `?src=` ile "demo iste"/"rapor indir" tıklamalarının kaynağı; botlar yönlendirilmez (sayfa indekslenir).

Önemli dosya yolları: `/home/user/Mentor-Website/docs/tasarim-yonu-fosforlu-defter.md` (token, tipografi, hareket, R3/R5/26 Eylül notları), `/home/user/Mentor-Website/docs/tasarim-referans-notlari.md`, `/home/user/Mentor-Website/docs/21st-dev-bilesen-adaylari.md`, `/home/user/Mentor-Website/docs/website-yeniden-yazim-arastirma-ve-plan.md`, `/home/user/Mentor-Website/src/app/globals.css`, `/home/user/Mentor-Website/src/app/fonts.css`, `/home/user/Mentor-Website/scripts/fonts/build.py`, `/home/user/Mentor-Website/src/lib/scroll-progress.ts`, `/home/user/Mentor-Website/src/components/motion/in-view.tsx`, `/home/user/Mentor-Website/scripts/og/render.mjs`, `/home/user/Mentor-Website/lighthouserc.json`, `/home/user/Mentor-Website/.github/workflows/ci.yml`, `/home/user/Mentor-Website/wrangler.jsonc`.