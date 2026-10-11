# BMW Challenge – Makro trend kaynakları

Tarih: 2026-10-10 · 76 kaynak · Sinyal bileşenleri: pazar momentumu %35, müşteri çekişi %35, kanıt kalitesi %20, güncellik %10, çelişki cezası

Güven: 4 Yüksek · 3 Orta-yüksek · 2 Orta · 1 Düşük. Doğrulama: evet / kısmen (ikincil aktarım) / hayır.

## Powertrain payı (birincil veri)

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-01 | [ACEA – 2025 tam yıl kayıtlar](https://www.acea.auto/pc-registrations/new-car-registrations-1-8-in-2025-battery-electric-17-4-market-share/) | EU | 27.01.2026 | BEV %17,4; PHEV %9,4; HEV %34,5; benzin %26,6; dizel %8,9 | 4 | Pazar momentumu | core | evet |
| P-02 | [ACEA – Ocak–Ağustos 2026 (electrive üzerinden)](https://www.electrive.com/2026/09/24/eu-bevs-made-up-more-than-a-quarter-of-new-cars-sold-in-august/) | EU | 24.09.2026 | YTD BEV %21,7; PHEV %10,0; HEV %36,6; Ağustos BEV %27,7 | 4 | Pazar momentumu | core | kısmen |
| P-03 | [CPCA – 2025 tam yıl (CnEVPost üzerinden)](https://cnevpost.com/2026/01/09/china-dec-2025-nev-retail-record-high/) | CN | 09.01.2026 | NEV perakende 12,81M = %53,9; BEV ~%33, PHEV ~%14, EREV ~%5 (alt kırılım toplamı tutmuyor, yaklaşık) | 3 | Pazar momentumu | core | kısmen |
| P-04 | [CPCA – Ağustos 2026 (CnEVPost üzerinden)](https://cnevpost.com/2026/09/08/china-aug-2026-nev-retail/) | CN | 08.09.2026 | NEV payı %65,2 (rekor); PHEV −%29,6, EREV −%22,2 yıllık | 3 | Pazar momentumu, Çelişki girdisi | core | kısmen |
| P-05 | [EIA Today in Energy – 2025](https://www.eia.gov/todayinenergy/detail.php?id=67144) | US | 09.02.2026 | HEV+PHEV+BEV ≈ %22; BEV %7,5; PHEV %1,6 | 4 | Pazar momentumu | core | evet |
| P-06 | [EIA Today in Energy – Q2 2026](https://www.eia.gov/todayinenergy/detail.php?id=67885) | US | 27.07.2026 | HEV %16 (rekor), BEV %6, PHEV %1,4; lüks segmentte BEV %14 (Q2 2025: %22) | 4 | Pazar momentumu, Çelişki girdisi | core | evet |
| P-07 | [Argonne – aylık elektrikli araç satışları](https://www.anl.gov/esia/light-duty-electric-drive-vehicles-monthly-sales-updates) | US | 17.09.2026 | 2025 plug-in ≈ %9,1; Ağustos 2026 HEV 216k, plug-in payı %7,7 | 4 | Pazar momentumu | ikincil | evet |
| P-08 | [Benchmark (Rho Motion verisi) – küresel EV satışları](https://source.benchmarkminerals.com/article/global-ev-sales-reach-1-8-million-units-in-august-2026) | Global | 11.09.2026 | Ağustos 2026 1,83M; YTD Avrupa +%29, Çin −%12, Kuzey Amerika −%21 | 3 | Pazar momentumu, Çelişki girdisi | ikincil | evet |

## Elektrifikasyon deneyimi

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T5-01 | [BloombergNEF Electric Vehicle Outlook 2026 (yönetici özeti)](https://assets.bbhub.io/professional/sites/44/EVO2026-Executive-Summary.pdf) | Global, EU, US, CN | 16.06.2026 | 2030 EV payı: küresel %38, Çin %76, Almanya %58; ABD 2040 tahmini %71'den %57'ye düşürüldü | 4 | Pazar momentumu | core | evet |
| T5-02 | [BCG – Changing Lanes: EV Strategies in the US, Europe and China](https://bcg.com/publications/2025/ev-strategies-in-us-europe-china) | EU, US, CN | 10.09.2025 | 2030: Çin plug-in ≈%80, Avrupa ≈%60, ABD <%30; ABD tam hibrit %15 → %28 | 4 | Pazar momentumu | core | evet |
| T5-03 | [IEA Global EV Outlook 2026](https://www.iea.org/reports/global-ev-outlook-2026/trends-in-electric-cars) | Global | 20.05.2026 | 2025 EV payı: Çin ≈%55, Avrupa %28, ABD ≈%10; ortalama BEV menzili ≈380 km ve sabit; ilk 1.000 V modeller | 4 | Pazar momentumu | core | evet |
| T5-04 | [IEA şarj altyapısı verisi (EV Infrastructure News üzerinden)](https://www.evinfrastructurenews.com/ev-networks/iea-1-8-million-public-ev-chargepoints-added-globally-in-2025-china-accounts-for-65-) | Global, EU, US, CN | 21.05.2026 | 2025'te 1,8M yeni kamu şarj noktası; nokta başına EV: Çin ≈10, Avrupa ≈15, ABD ≈33 | 4 | Pazar momentumu | core | kısmen |
| T5-05 | [Shell Recharge Driver Survey 2026](https://www.shell.com/what-we-do/mobility/mobility-news/shell-recharge-driver-survey-2026.html) | EU, US, CN | 29.06.2026 | EV'yi düşünen EV'siz sürücü: Avrupa %40 (sabit), ABD %27 (2025: %31); ABD/Çin'de %70+ kamu şarjı güvenilirliğinin arttığını söylüyor; AB/ABD'de PHEV eğilimi | 3 | Müşteri çekişi, Çelişki girdisi | core | evet |
| T5-06 | [EY Mobility Consumer Index 2025](https://www.ey.com/en_gl/newsroom/2025/12/global-consumers-driven-back-to-ice-vehicles-as-ev-enthusiasm-cools-ey-research) | Global | 09.12.2025 / Ocak 2026 | 24 ayda satın alma niyeti: ICE %50 (+13), BEV %14 (−10); endişeler: menzil %29, şarj altyapısı %28 | 3 | Müşteri çekişi, Çelişki girdisi | core | evet |
| T5-07 | [S&P Global Mobility – 2025 Electrification Consumer Survey](https://autotechinsight.spglobal.com/shop/product/5003676/2025-electrification-consumer-analysis-overcoming-range-anxiety-consumers-weigh-in-on-acceptable-ev-charging-time-and-range) | Global | 09.12.2025 | Kabul edilen menzil ≈480 km; kabul edilen şarj süresi 30–60 dk; %50+ batarya değişimine ilgili | 4 | Müşteri çekişi | ikincil | evet |
| T5-08 | [S&P Global Mobility – Light Vehicle Powertrain Outlook 2026](https://www.mobilityglobal.com/en-us/automotive-insights/blog/light-vehicle-powertrain-outlook-2026) | Global, EU | 03.02.2026 | Avrupa BEV payı %14 → %19 → %24 (2025–27); hibritler küresel olarak artıyor | 4 | Pazar momentumu | ikincil | evet |
| T5-09 | [Roland Berger EV Charging Index 2026](https://www.rolandberger.com/en/Insights/Publications/EV-Charging-Index-2026-Currents-of-change.html) | Global, CN, EU | 29.07.2026 | Avrupa'da hızlı şarj noktalarının yarısından fazlası 150 kW+; Çin kamu ağının ≈%50'si hızlı | 3 | Pazar momentumu | ikincil | evet |
| T5-10 | [Çin NEA şarj verisi (Gasgoo üzerinden)](https://autonews.gasgoo.com/articles/ev/chinas-charging-facility-total-exceeds-2148-million-up-nearly-50-year-on-year-2048732668508844032) | CN | 27.04.2026 | Mart 2026 sonu 21,48M şarj soketi (+%46,9); kamu 4,86M, ev 16,62M | 4 | Pazar momentumu | core | kısmen |
| T5-11 | [BMW – Neue Klasse iX3 duyurusu](https://www.bmwgroup.com/en/news/general/2025/the-new-BMW-iX3.html) | Global | 05.09.2025 | 805 km WLTP'ye kadar, 400 kW, 10 dakikada +372 km | 4 | Pazar momentumu | ikincil | evet |
| T5-12 | [BYD Super e-Platform](https://www.byd.com/mea/news-list/byd-unveils-super-e-platform-with-megawatt-flash-charging.html) | CN | 17.03.2025 | 1.000 kW, 5 dakikada 400 km; Çin'de 4.000+ flaş şarj istasyonu planı | 4 | Pazar momentumu | ikincil | evet |

## Sahiplik modeli ve sunum

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T8-01 | [J.D. Power Valuation / Autovista24 – Avrupa ikinci el değerleri 2026](https://www.jdpower.com/business/news/mmu-are-rvs-still-vulnerable-2026) | EU | 02.03.2026 (güncelleme 20.08.2026) | 36 ay / 60.000 km'de BEV her pazarda en düşük kalan değer (DE BEV %37,1 vs benzin %48,3); 2028'e kadar düşüş öngörüsü | 4 | Çelişki girdisi | core | evet |
| T8-02 | [Ayvens Mobility Monitor 2026](https://www.ayvens.com/en-cp/news/newsroom/press-releases-2026/ayvens-mobility-monitor-2026/) | EU | 06.05.2026 | Bireysel alıcıların %49'u leasinge olumlu, ama sadece %26'sı 5 yılda leasing yapar | 3 | Müşteri çekişi | ikincil | evet |
| T8-03 | [Cubic³ – Consumer & OEM Attitudes to SDVs](https://www.businesswire.com/news/home/20250429601913/en) | US, EU | 29.04.2025 | %25 dijital servise ödeme yapmış (18–24 yaşta %44); beklenen aylık ödeme 7,70$ vs OEM tahmini 11$; %51 otonom sürüş gibi servislere öder | 2 | Müşteri çekişi | ikincil | evet |
| T8-04 | [Tesla FSD benimsenmesi Q2 2026 (Not a Tesla App üzerinden)](https://notateslaapp.com/news/4483/tesla-fsd-reaches-148-million-active-subscriptions) | Global, US | 23.07.2026 | ≈1,48M ücretli FSD kullanıcısı (+%56); Kuzey Amerika teslimatlarının ≈%55'inde FSD açık | 3 | Müşteri çekişi | ikincil | kısmen |
| T8-05 | [GM Q2 2026 yazılım ve servis gelirleri (GM Authority üzerinden)](https://gmauthority.com/blog/2026/07/gm-onstar-business-revenue-increases-20-percent-in-q2-2026/) | US | 27.07.2026 | Super Cruise tercih oranı %30–40; ≈22M OTA güncellenebilir araç | 3 | Pazar momentumu, Müşteri çekişi | ikincil | kısmen |

## Kokpit ve HMI

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T1-01 | [S&P Global Mobility – 2025 HMI Consumer Study](https://www.mobilityglobal.com/en-us/automotive-insights/blog/what-consumers-value-in-human-machine-interface-technologies) | Global, EU, US, CN | 12.02.2026 (blog) | %48 dokunmatik + fiziksel düğme karmasını tercih ediyor; %80 sesli komutu kullanıyor; %40 telefonun sesli asistanını OEM'inkine tercih ediyor; ödeme isteği: kablosuz şarj 261$ | 4 | Müşteri çekişi | core | evet |
| T1-02 | [OEM fiziksel düğme dönüşü (VW ID. Polo, Mercedes, Çinli OEM'ler)](https://www.automotiveworld.com/news/volkswagen-reveals-new-cockpit-design-with-id-polo/) | EU, CN | 05.01.2026 / 19.09.2025 / 26.08.2026 | VW ve Mercedes müşteri geri bildirimine dayanarak fiziksel kontrolleri geri getiriyor; Geely, BYD, Changan, Chery de aynı yönde | 4 | Pazar momentumu | core | evet |
| T1-03 | [BMWBLOG – BMW: iX3 kullanıcıları fiziksel düğmeyi aramıyor](https://www.bmwblog.com/2026/01/14/bmw-says-idrive-x-users-do-not-miss-physical-knob/) | Global | 14.01.2026 | BMW: "kimse fiziksel kontrol düğmesinin geri gelmesini istemedi"; hava yönü dokunmatik ekrandan | 1 | Çelişki girdisi | ikincil | evet |
| T1-04 | [Çin MIIT fiziksel kontrol standardı (Paul Tan üzerinden)](https://paultan.org/2026/07/10/china-cracks-down-on-touchscreen-reliance-physical-controls-mandatory/) | CN | 10.07.2026 | 1 Temmuz 2027'den itibaren sinyal, dörtlü, korna, vites, silecek, buğu çözme, cam ve ADAS aktivasyonu fiziksel olmalı | 4 | Pazar momentumu | ikincil | kısmen |
| T1-05 | [ResearchInChina – Çin HUD raporu](https://www.businesswire.com/news/home/20250915951501/en) | CN | 15.09.2025 | Çin'de HUD takılma oranı %15,5 (2024); AR-HUD 900k+ adet (+%300) | 3 | Pazar momentumu | core | evet |
| T1-06 | [Omdia – otomotiv ekran pazarı 1H 2025](https://www.businesswire.com/news/home/20251027178061/en/Omdia-Automotive-Display-Market-in-1H-2025-Growth-Slows-but-Technology-Upgrades-Accelerate) | Global | 27.10.2025 | 120,96M adet (+%5,1); HUD sevkiyatları +%25,3 | 4 | Pazar momentumu | ikincil | evet |
| T1-07 | [J.D. Power + Tongji Intelligent Cabin Innovation Index (China Daily üzerinden)](https://www.chinaservicesinfo.com/s/202512/02/WS692ecccb498e36855033857e/reliability-responsiveness-valued-in-smart-car-cabins.html) | CN | 02.12.2025 | %25,3 fiziksel düğme eksikliğini eleştiriyor; %56,5 AI tabanlı araç kontrolünü daha az kullanıyor | 3 | Müşteri çekişi, Çelişki girdisi | ikincil | evet |

## Araç içi AI ve dijital servisler

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T2-01 | [Deloitte 2026 Global Automotive Consumer Study (PDF)](https://www.deloitte.com/content/dam/assets-shared/docs/industries/consumer/2026/global-automotive-consumer-study-2026.pdf) | Global, EU, US, CN | 2026 | AI kişiselleştirmeyi kullanma olasılığı: Çin %76, ABD %46, UK %42, DE %34; OTA ile aracı daha uzun tutma: Çin %72, ABD %52, DE %36; veri endişesi: DE %58, ABD %62, Çin %44 | 4 | Müşteri çekişi | core | evet |
| T2-02 | [McKinsey China Auto Consumer Insights 2025](https://www.mckinsey.com/industries/automotive-and-assembly/our-insights/china-auto-consumer-insights-2025-gaining-momentum) | CN | 30.09.2025 | Teknoloji yükseltmeleri satın alma niyetini artırıyor; 2026 baskısında %84 proaktif AI asistan bekliyor | 4 | Müşteri çekişi | core | evet |
| T2-03 | [McKinsey – connectivity and digital services](https://www.mckinsey.com/industries/automotive-and-assembly/our-insights/how-do-consumers-perceive-in-car-connectivity-and-digital-services) | Global | Eylül 2023 | Çinli alıcıların %54'ü daha iyi dijital deneyim için marka değiştirir (DE/US <%40); %30 kişisel asistana değer veriyor | 3 | Müşteri çekişi | ikincil | evet |
| T2-04 | [Counterpoint – connected car outlook](https://counterpointresearch.com/en/reports/by-2030-94-percent-of-new-cars-sold-will-be-connected-from-premium-feature-to-industry-baseline) | Global | 07.10.2025 | 2030'da yeni araçların %94'ü bağlantılı | 3 | Pazar momentumu | ikincil | evet |
| T2-05 | [Gasgoo Institute – Çin akıllı kokpit raporu](https://autonews.gasgoo.com/articles/news/chinese-smart-cockpits-go-global-the-real-battle-has-just-begun-2088519023041200129) | CN | 2026 | Çin binek araçlarında akıllı kokpit penetrasyonu %80+; 2030'da 330 milyar ¥ pazar | 3 | Pazar momentumu | ikincil | evet |
| T2-06 | [OEM AI asistan hamleleri (derleme)](https://press.bmwgroup.com/usa/article/detail/T0454794EN_US/the-bmw-ix3-ushers-in-next-generation-innovations-at-ces-2026) | Global, EU, US, CN | 2025–2026 | BMW: Alexa+ tabanlı Intelligent Personal Assistant (DE/US, 2026 H2), Çin'de Alibaba Qwen; Mercedes: Google Gemini (CLA); GM/Volvo: Gemini; Tesla: Grok Avrupa'da; BYD, Geely, Zeekr vb.: DeepSeek; Auto China 2026'nın ana teması LLM kokpitler | 4 | Pazar momentumu | core | evet |
| T2-07 | [S&P Global Mobility – CES 2026 değerlendirmesi](https://www.mobilityglobal.com/en-us/automotive-insights/blog/ces-2026-spotlights-automotive-technology) | Global | 15.01.2026 | Honda, Mercedes, VW LLM entegre ediyor; BMW ve Mercedes OTA ile güncellenebilir uzamsal ses gösterdi; "para kazanma geride" | 3 | Pazar momentumu | ikincil | evet |

## Telefon ve ekosistem entegrasyonu

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T3-01 | [9to5Mac – CarPlay Ultra üretici takibi](https://9to5mac.com/2026/05/04/carplay-ultra-automakers/) | Global, US | 04.05.2026 | Sadece Aston Martin canlı; Hyundai, Kia, Genesis, Porsche, JLR, Honda, Nissan, Ford planlıyor; Mercedes, Audi, Volvo, Polestar, Renault reddetti; BMW listede yok | 3 | Pazar momentumu | core | evet |
| T3-02 | [McKinsey ekran yansıtma verisi (TTAC üzerinden)](https://thetruthaboutcars.com/cars/news-blog/report-a-third-of-new-car-buyers-wouldn-t-consider-a-purchase-without-smartphone-44507608) | Global, US | Haziran 2024 | Küresel olarak EV alıcılarının %30'u, ICE alıcılarının %35'i CarPlay/Android Auto olmayan aracı almaz | 3 | Müşteri çekişi | core | kısmen |
| T3-03 | [Apple Newsroom – CarPlay Ultra lansmanı](https://www.apple.com/newsroom/2025/05/carplay-ultra-the-next-generation-of-carplay-begins-rolling-out-today/) | Global | 15.05.2025 | Gösterge paneli ve klima/radyo kontrolünü üstleniyor; 12 ayda yaygınlaşma planı gecikti | 4 | Pazar momentumu | ikincil | evet |
| T3-04 | [9to5Google – Android Auto ve Google built-in](https://9to5google.com/2025/05/14/android-auto-is-now-on-over-250-million-cars/) | Global | 14.05.2025 | Android Auto 250M+ araçta; Google built-in 50+ modelde | 4 | Pazar momentumu | ikincil | evet |
| T3-05 | [Car Connectivity Consortium – dijital anahtar sertifikaları](https://www.businesswire.com/news/home/20260106270279/en/CCC-Digital-Key-Certifications-Surged-in-2025-Reinforcing-the-Global-Standard-for-Secure-Vehicle-Access) | Global, CN | 06.01.2026 | 2025'te 115 ürün sertifikalandı; BMW, Mercedes, Audi, NIO, XPENG, Zeekr dahil 16 yeni OEM | 4 | Pazar momentumu | core | evet |
| T3-06 | [Huawei HIMA / HarmonyOS kokpit (TechNode)](https://technode.com/2026/04/01/huawei-highlights-ai-harmonyos-and-auto-momentum-in-2015-annual-report/) | CN | 01.04.2026 | 2025'te 589.100 HIMA teslimatı (+%32); Huawei HMS for Car 70+ modelde | 3 | Pazar momentumu | ikincil | evet |

## Sürüş asistanı deneyimi

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T4-01 | [S&P Global Mobility – 2025 Autonomous Driving Consumer Survey](https://www.mobilityglobal.com/en-us/automotive-insights/blog/autonomous-vehicles-and-rising-consumer-trust) | Global | Mayıs 2025 | ~2/3 otoyolda otonom özellikleri kullanmak istiyor; L2/L2+ L3'e tercih ediliyor; otomatik park için ödeme isteği | 4 | Müşteri çekişi | core | evet |
| T4-02 | [AutoPacific Future Attribute Demand Study 2025](https://www.autopacific.com/autopacific-insights/2025/7/24/autopacifics-newest-future-attribute-demand-study-fads-shows-increase-in-demand-for-autonomous-driving-and-adas-features) | US | 24.07.2025 | %43 eller serbest/gözler yolda otoyol sürüşü istiyor (+20 puan); olmazsa olmaz oranı %33 | 4 | Müşteri çekişi | core | evet |
| T4-03 | [AutoPacific 2026 Future Vehicle Planner (WardsAuto üzerinden)](https://www.wardsauto.com/news/heated-seats-tops-list-of-most-wanted-vehicle-features-autopacific-survey/827244/) | US | 07.08.2026 | Otomatik park ilk kez ilk 15'te; Y kuşağında ADAS güveni %56 → %62; ısıtmalı koltuk %47 ile 1 numara | 4 | Müşteri çekişi | core | evet |
| T4-04 | [CAAM – Urban NOA Assisted Driving Research Report 2025 (36Kr üzerinden)](https://eu.36kr.com/en/p/3646532844359559) | CN | 14.01.2026 | Ocak–Kasım 2025'te şehir içi NOA sigortalı binek araçların %15,1'inde (+5,6 puan) | 3 | Pazar momentumu | core | kısmen |
| T4-05 | [Gasgoo – Smart Driving is Far from Democratized](https://autonews.gasgoo.com/articles/market-industry/smart-driving-is-far-from-democratized-2069793062271033345) | CN | 24.06.2026 | Standart L2+ donanım 2025'te %28, Nisan 2026'da %41+; aktivasyonların ~%70'i otoyolda; otoyol NOA kullanım sürekliliği %60–70 | 3 | Pazar momentumu, Müşteri çekişi | core | evet |
| T4-06 | [newmobility.news – BMW 200M eller serbest km](https://newmobility.news/en/2026/06/15/bmws-200-million-km-milestone-raises-stakes-in-eus-hands-free-driving-race/) | EU | 15.06.2026 | BMW Highway Assistant 200M km'yi geçti; 20+ ülkede yaygınlaşma planı; Ford BlueCruise 15 AB ülkesinde onaylı | 3 | Pazar momentumu | ikincil | evet |
| T4-07 | [Telemetry – Assisted & Automated Driving Forecast (Tech Brew üzerinden)](https://www.techbrew.com/stories/2025/10/06/telemetry-forecast-projects-hands-free-driving-systems) | Global, US | 06.10.2025 | 2028'e kadar yeni araçların yarısından fazlası eller serbest sürüşe sahip olacak | 3 | Pazar momentumu | ikincil | evet |
| T4-08 | [Ford – 2025 BlueCruise trendleri](https://www.fromtheroad.ford.com/us/en/articles/2026/2025-bluecruise-trends-hands-free-usage-skyrockets.html) | US | 27.01.2026 | 1,22M donanımlı araç (2025'te +500k); ABD eller serbest km +%88 | 2 | Müşteri çekişi | ikincil | evet |

## Kabin konforu ve iyi oluş

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T6-01 | [ResearchInChina – koltuk inovasyonu raporu 2025](https://www.businesswire.com/news/home/20251013573719/en) | CN | 13.10.2025 | Standart havalandırma + ısıtma + masajlı ön koltuk 200–300k RMB bandında 2024 %3,7 → H1 2025 %5,5; 300k+ üstünde sıfır yerçekimi koltuk temel donanım | 3 | Pazar momentumu | core | evet |
| T6-02 | [Gasgoo – sıfır yerçekimi koltuk tuzağı](https://autonews.gasgoo.com/articles/market-industry/who-set-the-comfort-trap-of-zero-gravity-seats-2054544130686996481) | CN | 13.05.2026 | Sıfır yerçekimi koltuklu model sayısı 32 (2022) → 117 (2024); penetrasyon %5+; güvenlik tepkisi | 3 | Pazar momentumu, Çelişki girdisi | core | evet |
| T6-03 | [S&P AutoTechInsight – Auto China 2026 raporu](https://autotechinsight.spglobal.com/_assets/ckfinder_library/files/SPG_Mobility_AutoTechInsight_AutoChinaBeijing_May2026.pdf) | CN | Mayıs 2026 | 181 lansmanın 60+'ı D/E SUV veya MPV; arka ekranlar (AITO M9 32" projektör), sıfır yerçekimi koltuk, değişken camlar | 3 | Pazar momentumu | core | evet |
| T6-04 | [Asahi Kasei – 5. Küresel Otomotiv Tüketici Anketi](https://www.asahi-kasei.com/news/2024/e241217.html) | Global, EU, US, CN | 17.12.2024 | ~2'de 1 kişi sessiz kabini en değerli iç mekan özelliği sayıyor; BEV kullanıcılarının ~4'te 1'i gürültüyü en rahatsız edici deneyim olarak görüyor | 4 | Müşteri çekişi | core | evet |
| T6-05 | [AutoPacific FADS 2025 (Gentherm üzerinden)](https://gentherm.com/en/?p=7281) | US | Aralık 2025 | Isıtmalı direksiyon %38; ısıtmalı + havalandırmalı ön koltuk %37 | 4 | Müşteri çekişi | core | evet |
| T6-06 | [AutoScout24 trend araştırması (Integral)](https://cms-assets.autoscout24.com/uaddx06iwzdz/3GJg4XoDQIyRSrcdiSpfCa/a5799b2b38f795621c40f6d9896bf13c/260117_PA_AS24_Ausstattungsmerkmale___1_.pdf) | EU | 22.01.2026 | Koltuk ısıtma %35 vazgeçilmez, %44 istenir; panoramik tavan %6 vazgeçilmez | 2 | Müşteri çekişi | ikincil | evet |
| T6-07 | [Zhiyan Consulting – Çin araç içi buzdolabı](https://www.chyxx.com/industry/1215715.html) | CN | 13.03.2025 | NEV'lerde gömülü buzdolabı ~%7,26 (2024), ICE'de %0,22; Dongchedi: 385 NEV modelinin 45'inde (%11,7) | 2 | Pazar momentumu | ikincil | evet |
| T6-08 | [ifeng – "%5 kullanım" iddiasının kaynağı](https://tech.ifeng.com/c/8wmbTabIvzV) | CN | 28.09.2026 | Deepal başkanı buzdolabı kullanımının %5 olduğunu söyledi; kaynak ve tanım yok | 1 | Çelişki girdisi | ikincil | evet |

## Malzeme, tasarım ve sürdürülebilirlik

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T7-01 | [Asahi Kasei – sürdürülebilirlik algısı (aynı anket)](https://www.asahi-kasei.com/news/2024/e241217.html) | EU, US, CN | 17.12.2024 | Batıda "sürdürülebilir araç" = geri dönüştürülebilir malzeme ve üretim; Çin/Japonya'da = güç aktarımı; DE/US'de %35 daha sürdürülebilir markaya geçer | 4 | Müşteri çekişi | core | evet |
| T7-02 | [McKinsey Luxury Car Survey – Shifting gears](https://www.mckinsey.com/industries/automotive-and-assembly/our-insights/shifting-gears-what-buyers-are-saying-about-the-luxury-car-experience) | Global | 28.03.2025 | 150k$+ alıcılarda 1 numara kusursuzluk (kalite ve dayanıklılık), sürdürülebilirlik 6. sırada; %71 Çin lüks markasını düşünmez | 3 | Müşteri çekişi | core | evet |
| T7-03 | [YouGov – Green premium on cars](https://business.yougov.com/content/49364-the-green-premium-on-cars-how-much-more-are-consumers-willing-to-pay-for-eco-friendly-vehicles) | Global | Mayıs 2024 | Daha fazla ödemeye istekli olanların %48'i %10'a kadar fazla öder | 3 | Müşteri çekişi | ikincil | evet |
| T7-04 | [APLF – Çin otomotiv derisi 2024–25](https://www.aplf.com/2025/08/25/aplf-report-automotive-leather-production-and-consumption-in-china-2024-2025/) | CN | 25.08.2025 | Çin otomotiv deri üretimi 500M ft² üzeri, 2025'te +%6–8; orta segment SUV'larda deri koltuk standartlaşıyor | 2 | Pazar momentumu, Çelişki girdisi | ikincil | evet |
| T7-05 | [ResearchInChina – aydınlatma ve ambiyans raporu 2025](https://www.businesswire.com/news/home/20251203916369/en) | CN | 03.12.2025 | LED kısa far %89,1; ADAS mavi işaret lambaları %7,1 (+%1.098); ambiyans ışığı tavana, kapı kollarına yayılıyor | 3 | Pazar momentumu | core | evet |
| T7-06 | [TechNode – Çin mavi ADAS ışıklarını yasaklıyor](https://technode.com/2026/07/30/china-reportedly-moves-to-bar-blue-adas-lights-on-newly-certified-vehicle-models/) | CN | 30.07.2026 | Yeni onaylanan modellerde mavi dış ADAS ışığı kullanılamayabilir | 3 | Çelişki girdisi | ikincil | kısmen |

## Çapraz (tüm kategoriler)

| ID | Kaynak | Bölge | Baskı | Ana veri | Güven | Besler | Öneri | Doğrulama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| X-01 | [BCG – What car buyers want (NIQ-GfK ile)](https://www.bcg.com/publications/2025/what-car-buyers-want-global-guide-automotive-oems) | Global, EU, US, CN | 04.11.2025 | Yarı/yüksek otomasyon kullananların %79'u yararlı buluyor (kullanmayanlarda %45); aynı markayı tekrar alma niyeti Çin ~%10, DE premium %53; Çin markalarına açıklık Avrupa %10–20, ABD %7 | 4 | Müşteri çekişi | core | evet |
| X-02 | [EY Mobility Consumer Index 2025 (tam rapor)](https://www.ey.com/content/dam/ey-unified-site/ey-com/en-ca/noindex/ey-global-mobility-consumer-index-2025.pdf) | Global, EU, US, CN | Ocak 2026 | L3+ ile rahat: küresel %26, Çin %47, ABD %23, UK %21, DE %19; %47 bağlı servislerde yüksek fiyatı sorun görüyor | 4 | Müşteri çekişi | core | evet |
| X-03 | [Roland Berger Automotive Disruption Radar 14](https://www.rolandberger.com/en/Insights/Publications/Automotive-Disruption-Radar-14-China-leads-the-way-as-the-industry-regroups.html) | Global, EU, CN | 10.09.2025 | Çin'de %95 sonraki aracını EV olarak alır; Almanya'da BEV değerlendirmesi %55 → %45; otonom sürüşe tüketici ilgisi düşüyor | 4 | Pazar momentumu, Müşteri çekişi | core | evet |
| X-04 | [KPMG Global Automotive Executive Survey (25.)](https://kpmg.com/fr/fr/insights/transport/global-automotive-executive-survey-2025.html) | Global | Şubat 2026 | Yöneticilerin %36'sı 3 yılda tam dönüşüm bekliyor; OEM'lerin %86'sı AI'ya yoğun yatırım yapıyor | 3 | Pazar momentumu | ikincil | evet |
| X-05 | [WIPO Technology Trends 2025 – Future of Transportation](https://wipo.int/edocs/pubdocs/en/wipo-pub-1055-2025-en-wipo-technology-trends-future-of-transportation.pdf) | Global | Şubat 2025 | 85.739 HMI patent ailesi (2000–23); kara aracı HMI'da "orta" momentum | 4 | Pazar momentumu | ikincil | evet |
| X-06 | [S&P AutoTechInsight – CES 2026 webinar sunumu](https://autotechinsight.spglobal.com/_assets/ckfinder_library/files/SPG_Mobility_AutoTechInsight_Webinar_Series_CES_2026.pdf) | Global, US | Ocak 2026 | Mercedes CLA şehir içi L2++; Ford 2027 yeni BlueCruise, 2028 gözler serbest; AI kokpit ajanları | 3 | Pazar momentumu | ikincil | evet |
| X-07 | [Hurun – Chinese Luxury Consumer Survey 2026 (Dragon Trail üzerinden)](https://dragontrail.com/resources/blog/6-top-takeaways-from-huruns-2026-luxury-consumer-survey) | CN | Ocak 2026 | 2026 lüks harcama planı −%10,2; BBA'ya ilgi azalıyor, Huawei bağlantılı markalar tercih ediliyor | 3 | Müşteri çekişi | ikincil | kısmen |
| X-08 | [Google Trends API (alpha)](https://developers.google.com/search/blog/2025/07/trends-api) | EU, US | 24.07.2025 | Tutarlı ölçekleme, 1.800 günlük pencere, ISO bölge kodları; erişim başvuruyla | 2 | Müşteri çekişi | ikincil | kısmen |
| X-09 | [Baidu Index](https://index.baidu.com/v2/index.html) | CN | Canlı | Google Trends'in Çin karşılığı | 2 | Müşteri çekişi | ikincil | hayır |

## Kodlanması önerilen çelişkiler

- **AB elektrifikasyon:** beyan ile davranış çelişiyor. EY'de BEV niyeti −10 puan, Shell'de değerlendirme sabit; ama ACEA'da BEV payı %17,4 → %21,7.
- **ABD elektrifikasyon:** BEV payı düşüyor (lüks segmentte %22 → %14), HEV rekor (%16); BCG 2030'da ABD HEV %28 öngörüyor.
- **Çin elektrifikasyon:** NEV payı rekor (%65), ama PHEV ve EREV hacmi düşüyor.
- **Menzil beklentisi:** S&P kabul edilen menzil ≈480 km, IEA satış ağırlıklı ortalama ≈380 km, yeni amiral modeller 800 km+.
- **Kokpit:** müşteriler ve birçok OEM fiziksel kontrollere dönüyor; BMW Neue Klasse ise dijitalde ısrar ediyor.
- **Çin AI kokpit:** %84 proaktif AI asistan bekliyor; %56,5 güvenilirlik nedeniyle AI kontrolünü daha az kullanıyor.
- **Çin buzdolabı:** donanım payı artıyor (~%7 NEV), kullanım oranı tartışmalı (%5 iddiası kaynaksız).
- **Çin sıfır yerçekimi koltuk:** hızlı yayılıyor, güvenlik tepkisi başladı.
- **Çin deri:** derisiz trend Batı'da, Çin'de deri koltuk orta segmentte standartlaşıyor.

