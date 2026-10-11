# Situation analysis – BMW 5 Series Sedan (G60), market US

Run `RUN-20261011-024740-agent.analyze.G60.US-fb5f` · gpt-5.4-2026-03-05 · situation-analysis-v6 · 3 steps, 15 tool calls · 51 references cited, 0 not verified · 0 quotes not found in their verbatims · effort model `789fcb7624b8`

**US G60: keep the driving character, but reduce digital friction and everyday usability misses first**

The US G60 has a clear split in customer experience. Customers strongly value the car’s driving performance, handling and ride, with study scores above 6.0 on overall driving performance, handling/manoeuvrability and acceleration. But the largest pain points are concentrated in digital interaction and everyday usability: Software/HMI carries 723 complaints, far more than any other subsystem, and the weakest study attributes include infotainment menu structure (4.879) and heater/AC controls operation (4.804). Seats, climate control interaction, storage/practicality, phone integration, trunk hands-free opening, and ICE start-stop behavior are the most actionable H1 topics. Range is a real customer issue too, but the evidence splits between guidance/expectation problems that can be improved in H1 and a larger real-range step that belongs to H2.

## Data coverage
Analysis rests on the US context pack plus drilled-down evidence from subsystem overview, findings, requirements, effort estimates, study metrics, equipment catalogue, sales and verbatims for the main complaint and strength themes. Customer voice coverage is strong in volume for this scope: 3,628 verbatims in market US (3,610 US, 18 CA). Evidence is strongest where findings are level A or B with dozens of complaint rows, such as seats, operating concept, electric range, public charging, trunk opening and MSA. Study metrics are market-level only and compare with other BMW models, not competitors. Equipment evidence is from the German July 2026 catalogue and is used only as offering context, not as proof of US standard content.

## Insights

### Digital interaction is the main product friction, not a single bug
recurring_complaint · infotainment_digital · confidence high

Infotainment & Digital Services is the largest complaint domain with 752 complaints and a 70% complaint share of classified rows. In the engineering view, Software/HMI alone carries 723 complaints and 392 likes, by far the highest complaint load of any subsystem. The core issue is usability rather than outright failure: 'Operating concept, operating system' has 53 complaints, 39 of them difficult-to-use, and the study’s weakest digital attribute is menu structure of infotainment at 4.879; heater/AC controls operation is even lower at 4.804. Customers repeatedly describe too many menu layers, touchscreen dependence and loss of physical shortcuts.

> the screen layout is not very intuitive for accessing some functions

Subsystems of the cited evidence: Software/HMI (5)

Evidence: `FND-G60-US-VOC-operating_concept_operating_system`, `FND-G60-US-VOC-touch_screen_operation`, `FND-G60-US-VOC-instrument_cluster`, `metric:MET-US-US-G60-climate_controls_usability`, `verbatim:G60-0248`, `verbatim:G60-0397`

### Seats are a major comfort weakness in an otherwise strong long-distance sedan
recurring_complaint · interior_comfort · confidence high

Seats are the strongest interior complaint theme: 62 complaint rows, 54% of all rows on that theme, with level-A evidence. Complaints are not only about trim preference; they include lower-back pain, insufficient adjustment range and awkward controls. The issue is broad enough to affect perceived ergonomics and comfort over time, and it is supported by weak study ratings already captured in the existing requirement: front seat comfort 5.74 and rear seat comfort 5.27 in the US study context cited by the requirement. Verbatims show both discomfort and adjustment difficulty.

> the driver seat is extremely uncomfortable, especially in the lower back area

Subsystems of the cited evidence: Body/structure (2), Chassis (1), HV battery (1), E/E architecture (1), Software/HMI (2), Interior/console (1), Seats (6)

Evidence: `FND-G60-US-VOC-seats`, `REQ-G60-US-IC-01`, `verbatim:G60-0051`, `verbatim:G60-0291`, `verbatim:G60-0320`, `verbatim:G60-0468`

### Climate control is both hard to operate and not fully convincing in performance
metric_gap · interior_comfort · confidence high

Climate is a concentrated usability problem. Thermal/HVAC has 86 complaints versus only 11 likes. 'Air conditioning, setting' has 24 complaints with level-A evidence, and the study score for operation of heater/AC controls is 4.804, one of the weakest attributes in the whole study. Broader climate metrics are also middling: overall climate control 5.144 and air conditioner performance 5.188. The pattern points to a combined issue of hidden controls, settings persistence and cooling performance in US heat conditions.

> replacing physical buttons with more touch screens is a terrible trend

Subsystems of the cited evidence: Thermal/HVAC (2), Software/HMI (1), Interior/console (1)

Evidence: `FND-G60-US-VOC-air_conditioning_setting`, `REQ-G60-US-IC-02`, `metric:MET-US-US-G60-climate_controls_usability`, `metric:MET-US-US-G60-climate_control`, `metric:MET-US-US-G60-air_conditioning_performance`, `verbatim:G60-0397`

### Everyday practicality misses are small individually but add up in one interior package
unmet_need · space_practicality · confidence high

Space & Practicality has a very high complaint share at 78%. The main issues are not cargo volume alone but daily-use details: storage compartments (28 complaints, level A), front center console (30 complaints, level A), door open/close (31 complaints, level A), and non-contact trunk lid opening (44 complaints, level B). In subsystem terms, these complaints cluster mainly in body_structure and interior_console, suggesting several customer irritants may be addressed through a limited set of packaging and trim changes rather than many unrelated projects.

> Hard to figure out the exact place and movement needed to get it to activate

Subsystems of the cited evidence: Body/structure (3), Interior/console (2)

Evidence: `FND-G60-US-VOC-storage_compartments`, `FND-G60-US-VOC-center_console_front`, `FND-G60-US-VOC-door_open_close`, `FND-G60-US-VOC-non_contact_trunk_lid_opening`, `verbatim:G60-0488`

### Hands-free trunk opening is a clear execution problem, not just low awareness
recurring_complaint · space_practicality · confidence high

The non-contact trunk lid opening theme is unusually one-sided: 44 complaints out of 46 rows on the theme, or 96% complaint share. Customers describe inconsistent activation even after dealer explanation or software updates. This is strong evidence of poor robustness and/or poor gesture tolerance in a feature customers expect to work first time.

> It rarely works on the first try and sometimes will not work at all

Subsystems of the cited evidence: Body/structure (4)

Evidence: `FND-G60-US-VOC-non_contact_trunk_lid_opening`, `verbatim:G60-0180`, `verbatim:G60-0835`, `verbatim:G60-1184`

### Phone integration problems damage trust in the digital experience disproportionately
recurring_complaint · infotainment_digital · confidence high

Beyond general HMI complexity, there is a specific reliability/usability cluster around phone integration. Apple CarPlay has 37 complaints, including 12 defects, and wireless charging has 26 complaints with 11 defects and a 90% complaint share of theme rows. This matters because these are frequent, high-visibility daily interactions. The existing requirement also cites weak phone charging study performance at 5.46.

> with 2 user profiles the system seems to get mixed up

Subsystems of the cited evidence: Powertrain (1), E/E architecture (2), Software/HMI (3), Interior/console (1)

Evidence: `FND-G60-US-VOC-apple_carplay`, `FND-G60-US-VOC-mobile_device_wireless_charging`, `REQ-G60-US-ID-02`, `verbatim:G60-0081`

### Electric range is a real customer issue, but the evidence splits between expectation/guidance and fundamental hardware limits
recurring_complaint · powertrain_range_charging · confidence medium

Electric Range has 67 complaints and only 37 likes, with 64% of theme rows negative. The issue is concentrated in BEV/PHEV usage and includes both perceived shortfall and inaccurate prediction. Verbatims show a wide spread: some customers say range is good or better than quoted, while others report severe disappointment such as about 100 miles indicated after overnight charging. This contradiction means the need is real, but not uniform; some of it is likely solvable through better estimation and guidance, while a larger real-world range step is an H2 battery topic. The only stored market context is weak: US EV share at 7.8%, which is background only and does not change the customer need.

> range estimates are off, the efficiency stats shown are basically made up

Subsystems of the cited evidence: Body/structure (1), Powertrain (1), HV battery (6), E/E architecture (1), Software/HMI (1), Interior/console (1), Seats (1)

Evidence: `FND-G60-US-VOC-electric_range`, `REQ-G60-US-PR-02`, `REQ-G60-US-PR-03`, `verbatim:G60-0051`, `verbatim:G60-0195`, `verbatim:G60-0116`, `market:MKT-US-powertrain-1`

### Public charging complaints are strong in voice of customer but much of the pain sits outside the vehicle
context · powertrain_range_charging · confidence high

Public charging / external providers has 55 complaints, 83% of theme rows negative, and is almost entirely a BEV issue. Customers struggle with charger availability, compatibility, occupancy and perceived safety of charger locations. This is important context for BEV satisfaction, but much of it is infrastructure rather than vehicle product. Vehicle-side improvements should therefore focus on routing, compatibility guidance and charging workflow rather than assuming BMW can solve network coverage itself.

> it is hard for her to locate a charging station that is compatible

Subsystems of the cited evidence: Charging (4)

Evidence: `FND-G60-US-VOC-public_charging_external_providers`, `verbatim:G60-0159`, `verbatim:G60-0256`, `verbatim:G60-0469`

### ICE customers strongly dislike current start-stop behavior and especially the lack of persistent off
recurring_complaint · powertrain_range_charging · confidence high

Automatic engine start-stop function (MSA) has 45 complaints and only 2 likes; 96% of theme rows are negative. Complaints are concentrated in ICE vehicles and combine two issues: the behavior itself feels intrusive or harsh, and customers resent having to disable it every drive. This is a focused, high-clarity need with an existing H1 requirement already defined.

> Customer would like a way to turn off the auto start-stop permanently.

Subsystems of the cited evidence: Powertrain (5)

Evidence: `FND-G60-US-VOC-automatic_engine_start_stop_function_msa`, `REQ-G60-US-PR-01`, `verbatim:G60-0059`, `verbatim:G60-0623`, `verbatim:G60-0708`

### The core dynamic character is a strength to protect, not trade away while fixing usability
strength · driving_dynamics · confidence high

Driving is the G60’s strongest product asset in the US. Handling / Riding has 210 likes, Drivetrain has 349 likes, and the study’s strongest product attributes include handling/manoeuvrability 6.058, overall driving performance 6.039, riding comfort 6.03 and acceleration from stop 6.026. Complaints exist in drivetrain and braking, but they do not overturn the broader positive dynamic picture. Any H1 fixes should avoid degrading this character.

> really hugs the road.

Subsystems of the cited evidence: Chassis (3), Powertrain (1)

Evidence: `metric:MET-US-US-G60-driving_performance`, `metric:MET-US-US-G60-acceleration_from_stop`, `verbatim:G60-0085`, `verbatim:G60-0030`, `verbatim:G60-0012`, `REQ-G60-US-DD-03`

## Recommendations (proposals for the product manager)

### Simplify access to frequent functions in the current generation (H1)
Consider prioritising one-touch access for the most-used driving and comfort functions, with software shortcuts first and physical controls only where the panel can realistically support them in the life-cycle update.

This is the clearest cross-cutting pain point: 53 complaints on operating concept, plus touch-screen and instrument-cluster complaints, backed by weak study scores for infotainment menu structure and climate-controls usability. The subsystem concentration is also decisive: Software/HMI carries 723 complaints, so one HMI simplification package can address many rows at once. An existing requirement already covers this and its stored effort profile should be used.

Existing requirement: `REQ-G60-US-ID-01`

Effort (CPM estimate): **3.05 %** of a new vehicle generation (P5–P95 1.47–5.48) · adapt, kept in 100 % of the sensitivity runs · size S · layer K2 · from the change profile of REQ-G60-US-ID-01
- software_hmi 0.1 K2: Shortcut layer and widget placement for ten functions
- interior_console 0.1 K2: Physical controls where the panel allows them

Subsystems of the cited evidence: Software/HMI (6)

Evidence: `FND-G60-US-VOC-operating_concept_operating_system`, `FND-G60-US-VOC-touch_screen_operation`, `FND-G60-US-VOC-instrument_cluster`, `REQ-G60-US-ID-01`, `metric:MET-US-US-G60-climate_controls_usability`, `verbatim:G60-0248`, `verbatim:G60-0397`

### Fix seat comfort and adjustment before adding more seat features (H1)
Consider making seat comfort a first-wave H1 action: revise cushion foam, contour and lumbar travel on the existing seat structure, with special attention to lower-back comfort and adjustment range across body sizes.

Seats are the largest interior complaint theme with level-A evidence and clear customer harm, including pain on longer drives. This is a product weakness in a car customers otherwise praise for ride and long-distance character. An existing requirement already defines the customer-facing target and has an estimated H1 effort package.

Existing requirement: `REQ-G60-US-IC-01`

Effort (CPM estimate): **4.58 %** of a new vehicle generation (P5–P95 2.02–7.15) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the change profile of REQ-G60-US-IC-01
- seats 0.25 K1: Front and rear cushion foam, contour and lumbar travel on the existing seat structure

Subsystems of the cited evidence: Body/structure (2), Chassis (1), HV battery (1), E/E architecture (1), Software/HMI (2), Interior/console (1), Seats (6)

Evidence: `FND-G60-US-VOC-seats`, `REQ-G60-US-IC-01`, `verbatim:G60-0051`, `verbatim:G60-0291`, `verbatim:G60-0320`, `verbatim:G60-0468`

### Treat climate control as a combined HMI and HVAC package (H1)
Consider a bundled H1 climate update: always-visible or direct controls for temperature/fan, persistence of key settings by profile, and HVAC tuning for faster cool-down in heat-soak conditions.

Customers do not separate climate usability from climate performance, and neither should the fix. The evidence combines level-A complaint themes with one of the weakest study scores in the vehicle. The existing requirement already packages software, console and HVAC changes together; that is likely more effective than isolated tweaks.

Existing requirement: `REQ-G60-US-IC-02`

Effort (CPM estimate): **2.58 %** of a new vehicle generation (P5–P95 1.25–4.75) · adapt, kept in 100 % of the sensitivity runs · size S · layer K2 · from the change profile of REQ-G60-US-IC-02
- thermal_hvac 0.1 K2: Vent and blower tuning for heat-soak cool-down
- interior_console 0.05 K1: Always-visible temperature and fan control
- software_hmi 0.03 K1: Persist recirculation, sync and seat-ventilation defaults per profile

Subsystems of the cited evidence: Thermal/HVAC (2), Interior/console (1)

Evidence: `FND-G60-US-VOC-air_conditioning_setting`, `REQ-G60-US-IC-02`, `metric:MET-US-US-G60-climate_controls_usability`, `metric:MET-US-US-G60-climate_control`, `metric:MET-US-US-G60-air_conditioning_performance`

### Address everyday practicality as one interior usability package (H1)
Consider a single H1 package for practical storage and front-console usability, including the missing everyday stowage items customers call out and easier access/use of the console area.

Storage compartments and center console are both level-A findings, and Space & Practicality has the highest complaint share of any major domain at 78%. In subsystem terms these issues cluster in interior_console, so several small customer irritants may be solved together. An existing requirement already covers the storage package.

Existing requirement: `REQ-G60-US-SP-02`

Effort (CPM estimate): **2.08 %** of a new vehicle generation (P5–P95 0.94–4.07) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the change profile of REQ-G60-US-SP-02
- interior_console 0.1 K1: Seat-back pockets, sunglasses holder, covered tray, larger door pockets

Subsystems of the cited evidence: Interior/console (3)

Evidence: `FND-G60-US-VOC-storage_compartments`, `FND-G60-US-VOC-center_console_front`, `REQ-G60-US-SP-02`

### Stabilise hands-free trunk opening or remove the promise from the experience (H1)
Consider a focused H1 field fix for the kick-to-open trunk function, prioritising activation robustness and gesture tolerance so the feature works consistently in normal use.

This feature is almost entirely negative in customer feedback: 44 complaints out of 46 theme rows. Because the complaint is about inconsistent execution rather than desire for a new feature, a targeted fix could remove a disproportionate annoyance. No matching stored requirement was surfaced in the retrieved set, so this is proposed as a new change.

Effort (CPM estimate): **1.92 %** of a new vehicle generation (P5–P95 0.94–3.43) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the analyst's change profile
- body_structure 0.05 K1: Smaller than the long-wheelbase body change at 0.4 K2 and aligned with other small body-function fixes; this is a sensor/activation robustness update on an existing trunk-opening feature.
- size of body_structure 0.05 among 3 reference change(s): at or below 0.05 K1, REQ-F70-EU-QN-01: Sealing and damping material (acoustic package); at or above 0.05 K1, REQ-F70-EU-QN-01: Sealing and damping material (acoustic package)
- catalogue scan for body_structure with power tailgate, comfort access, trunk lid: G70 standard (Comfort Access)
- warning (43): body_structure: catalogue shows G70 standard; the change could carry over (carryover: true) instead of a new development

Subsystems of the cited evidence: Body/structure (5)

Evidence: `FND-G60-US-VOC-non_contact_trunk_lid_opening`, `verbatim:G60-0180`, `verbatim:G60-0488`, `verbatim:G60-0835`, `verbatim:G60-1184`

### Make phone integration boringly reliable (H1)
Consider prioritising CarPlay profile binding, source-volume consistency and wireless charging thermal robustness as one H1 digital-quality package.

These are frequent daily-use interactions with defect content, so they damage trust more than their raw counts suggest. The existing requirement already covers the main customer outcomes and has a modest H1 effort estimate compared with larger interior or battery changes.

Existing requirement: `REQ-G60-US-ID-02`

Effort (CPM estimate): **1.45 %** of a new vehicle generation (P5–P95 0.69–2.67) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the change profile of REQ-G60-US-ID-02
- software_hmi 0.04 K1: CarPlay profile binding and loudness matching
- interior_console 0.05 K1: Wireless charger tray cooling

Subsystems of the cited evidence: E/E architecture (2), Software/HMI (2)

Evidence: `FND-G60-US-VOC-apple_carplay`, `FND-G60-US-VOC-mobile_device_wireless_charging`, `REQ-G60-US-ID-02`

### For ICE, allow persistent start-stop off if open points can be cleared (H1)
Consider enabling a persistent driver-profile setting to keep auto start-stop off, together with smoother restart calibration, subject to the open certification check already noted in the stored requirement.

This is a narrow but very clear customer need in ICE cars: 45 complaints and almost no offsetting likes. Because the requirement already exists and explicitly notes the uncertainty, it is a good candidate for product-manager review rather than re-framing.

Existing requirement: `REQ-G60-US-PR-01`

Effort (CPM estimate): **1.88 %** of a new vehicle generation (P5–P95 0.91–3.55) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the change profile of REQ-G60-US-PR-01
- software_hmi 0.02 K0: Persistent off setting in the driver profile (OTA)
- powertrain 0.03 K1: Restart calibration; certification credit check stays open (requirement uncertainty)

Subsystems of the cited evidence: Powertrain (4)

Evidence: `FND-G60-US-VOC-automatic_engine_start_stop_function_msa`, `REQ-G60-US-PR-01`, `verbatim:G60-0059`, `verbatim:G60-0708`

### Split range work into H1 guidance and H2 hardware (H2)
Consider a two-step range response: in H1, improve range prediction, winter guidance and route-planning confidence; in H2, evaluate a larger real-world range step through the next battery generation.

The customer need is real, but the evidence is mixed: some owners are satisfied while others are far below expectation. That makes it important not to treat all range complaints as a single hardware problem. The stored requirements already separate H1 estimation/guidance from H2 battery change, which matches the evidence and the effort logic. The H2 battery requirement carries a very large CPM estimate based on assumptions, so it is a successor-generation topic, not a current-generation patch.

Existing requirement: `REQ-G60-US-PR-03`

Effort (CPM estimate): **48.98 %** of a new vehicle generation (P5–P95 36.73–56.87) · new generation, kept in 100 % of the sensitivity runs · size L · layer K3 · certification add-on · from the change profile of REQ-G60-US-PR-03
- hv_battery 1.0 K3: New cell and pack generation for more range (same case as the Gen6 anchor)

Subsystems of the cited evidence: Body/structure (1), HV battery (6), E/E architecture (1), Software/HMI (1), Interior/console (1), Seats (1)

Evidence: `FND-G60-US-VOC-electric_range`, `REQ-G60-US-PR-02`, `REQ-G60-US-PR-03`, `verbatim:G60-0051`, `verbatim:G60-0195`, `verbatim:G60-0116`

### Protect the current ride and handling character while making fixes (H2)
Consider treating ride comfort, handling precision and strong acceleration response as protected attributes in any H1 change package and explicitly carrying them into the successor brief.

This is the strongest product equity in the US evidence. Customers forgive some complexity because the car drives like a BMW should. The existing preserve-type requirement already captures this and needs no vehicle change profile.

Existing requirement: `REQ-G60-US-DD-03`

Effort: none, the proposal is declared not to change the vehicle.

Subsystems of the cited evidence: Chassis (3)

Evidence: `REQ-G60-US-DD-03`, `metric:MET-US-US-G60-driving_performance`, `metric:MET-US-US-G60-acceleration_from_stop`, `verbatim:G60-0085`, `verbatim:G60-0030`

## Effort of the proposals as packages
CPM, share of the development effort of a new vehicle generation; never money; every model input is an uncalibrated assumption (config/effort/model.yaml).
Changes are combined per subsystem, so work that several proposals share counts once.

- **H1**: 7 proposal(s) with a change, together **14.75 %** (P5–P95 7.89–22.22) · adapt, kept in 53 % of the runs · sum of the single estimates 17.54 %
  - footprint: Software/HMI 5.69 %, E/E architecture 2.06 %, Interior/console 2.05 %, Seats 1.49 %, Thermal/HVAC 1.25 %, Body/structure 1.15 %
  - warning (rule 51): borderline: only 53 % of the sensitivity runs keep the decision; show the PM both options
- **H2**: 1 proposal(s) with a change, together **48.98 %** (P5–P95 36.73–56.87) · new generation, kept in 100 % of the runs · sum of the single estimates 48.98 %
  - footprint: HV battery 10.0 %, Body/structure 7.59 %, Software/HMI 4.47 %, E/E architecture 4.2 %, Thermal/HVAC 3.26 %, Chassis 3.11 %

## Assumptions and gaps
- Study metrics, sales and findings are market-level US; there is no competitor study data in the stored metrics.
- The equipment catalogue is the German July 2026 price list in EUR; it shows model-line offering context, not confirmed US standard/optional content.
- Source B verbatims are call-centre notes written by agents and can mix product feedback with process content.
- Theme-to-subsystem mapping and subsystem weights are authored assumptions used for engineering concentration and effort reasoning.
- CPM effort estimates are rough prioritisation inputs only, expressed as share of a new vehicle generation and based on uncalibrated assumptions, not measured engineering effort.
- The only stored market row for the US is weak evidence on EV share [market:MKT-US-powertrain-1]; there is no stronger market or competitor context stored here for charging or range.
- Sales evidence notes that the G60/G68 sheet is combined, although the US figures are still the stored market evidence to use: 75,600 units in 2024 and 78,000 in 2025 [sales:SAL-G60-US-2024, sales:SAL-G60-US-2025].
- No dedicated retrieved requirement in this session covered the hands-free trunk-opening issue, so that recommendation is proposed newly rather than linked to an existing REQ id.
- Some top-strength and top-complaint examples in the context pack reuse the same verbatim across opposite labels; conclusions therefore rely on the broader counts and drilled-down verbatims, not on a single quoted example.

## Tool calls
- `get_subsystems` {'vehicle': 'G60', 'market': 'US'} → 12
- `get_findings` {'vehicle': 'G60', 'market': 'US', 'limit': 20} → 226
- `get_requirements` {'vehicle': 'G60', 'market': 'US'} → 20
- `get_effort` {'vehicle': 'G60', 'market': 'US', 'scenarios': True} → 20
- `get_sales` {'vehicle': 'G60', 'market': 'US'} → 3
- `get_metric` {'vehicle': 'G60', 'market': 'US'} → 103
- `get_equipment` {'vehicle': 'G60', 'domain': 'interior_comfort', 'limit': 50} → 42
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Operating concept, operating system', 'feedback_type': 'Difficult to Use', 'limit': 8} → 39
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Seats', 'feedback_type': 'Difficult to Use', 'limit': 8} → 31
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Electric Range', 'limit': 8} → 98
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'non-contact trunk lid opening', 'limit': 8} → 45
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Handling / Riding', 'feedback_type': 'Likes', 'limit': 6} → 210
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Drivetrain', 'feedback_type': 'Likes', 'limit': 6} → 332
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Public charging / external providers', 'limit': 8} → 59
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Automatic engine start-stop function (MSA)', 'limit': 8} → 38
