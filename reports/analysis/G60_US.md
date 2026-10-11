# Situation analysis – BMW 5 Series Sedan (G60), market US

Run `RUN-20261011-035557-agent.analyze.G60.US-2e8f` · gpt-5.4-2026-03-05 · situation-analysis-v7 · 4 steps, 22 tool calls · 55 references cited, 0 not verified · 0 quotes not found in their verbatims · effort model `789fcb7624b8`

**US G60 customers still love the 5 Series for ride, handling and performance, but the main product issues are HMI complexity, seat comfort, and the BEV range/charging experience.**

The strongest positives remain classic 5 Series strengths: handling, ride comfort, acceleration and overall drivetrain response, plus exterior design. The biggest concentration of complaints sits in Software/HMI, where many separate themes point to one broader usability problem. Seats are the clearest comfort gap, supported by both complaint volume and weak study scores. For electrified use, customers split their frustration between what the car offers itself (range confidence and prediction) and what they face outside the car (public charging compatibility, availability and planning). The first H1 priorities are simpler access to frequent functions, seat comfort tuning, climate-control usability, phone/CarPlay reliability, and better range guidance. A larger real-world range step belongs to H2.

## Data coverage
This analysis rests on the US context pack plus drilled-down evidence from 3,628 verbatims in market US (3,610 US, 18 CA), study metrics from US_2025, subsystem aggregation, extracted findings, existing US requirements and CPM effort estimates, and selected external evidence for software/HMI, HV battery and charging. Evidence strength is uneven: the main customer themes cited here are mostly level A or B findings with dozens of rows, while market and external rows are often weak single-source context and are used only as support, not alone.

## Insights

### HMI complexity is the broadest product issue, concentrated in one subsystem
recurring_complaint · infotainment_digital · confidence high

Infotainment & Digital Services is the largest complaint domain with 752 complaints. In engineering terms, Software/HMI alone carries 723 complaints across 67 themes, far above any other subsystem. The leading theme is Operating concept, operating system with 53 complaints, 39 of them usability issues, and the study also rates Menu structure of infotainment system at 4.879 and Operation of heater/ AC controls at 4.804, both among the weakest attributes. Customers repeatedly describe too many menu layers, profile confusion and a loss of physical controls, even though the same subsystem also has many likes, which shows the issue is not rejection of technology itself but ease of use.

> "the screen layout is not very intuitive for accessing some functions"

Subsystems of the cited evidence: Powertrain (1), Software/HMI (8), Interior/console (2)

Evidence: `FND-G60-US-VOC-operating_concept_operating_system`, `FND-G60-US-VOC-connecteddrive_and_infotainment_overall_technolo`, `FND-G60-US-VOC-touch_screen_operation`, `FND-G60-US-VOC-instrument_cluster`, `metric:MET-US-US-G60-infotainment_menu_structure`, `metric:MET-US-US-G60-climate_controls_usability`, `verbatim:G60-0248`, `verbatim:G60-0397`, `verbatim:G60-0081`, `external:EXT-T1-01-1`

### Seat comfort is a real comfort gap, not just a trim preference
recurring_complaint · interior_comfort · confidence high

Seats are the strongest interior complaint theme with 62 complaints, equal to 2.4% of all US complaint rows, and the subsystem has 124 complaints overall. This is supported by weak study scores for Overall comfort of the seats at 5.741 and Comfort of 2nd row seat at 5.269. Verbatims point to firmness, lower-back pain, limited adjustment range and lumbar settings that do not flatten enough. There are also wants around leather, massage and ventilation, but the core issue is basic long-drive comfort and fit across body sizes.

> "the driver seat is extremely uncomfortable, especially in the lower back area"

Subsystems of the cited evidence: Body/structure (2), Chassis (1), HV battery (1), E/E architecture (1), Software/HMI (2), Interior/console (1), Seats (5)

Evidence: `FND-G60-US-VOC-seats`, `metric:MET-US-US-G60-seat_comfort`, `metric:MET-US-US-G60-rear_seat_comfort`, `verbatim:G60-0051`, `verbatim:G60-0320`, `verbatim:G60-0468`, `REQ-G60-US-IC-01`

### Climate usability is part of the HMI problem, but also a standalone US comfort issue
metric_gap · interior_comfort · confidence high

Climate complaints are spread across Thermal/HVAC and HMI: Thermal/HVAC has 86 complaints and very few likes, with Vehicle, climatization at 26 complaints, Air conditioning, setting at 24, and Blower function at 19. The study score for Operation of heater/ AC controls is 4.804, one of the weakest in the whole study. Customers complain both about how to control climate and about cooling performance or settings persistence, so this is not only a screen-layout issue.

> "the car takes a long time to cool down"

Subsystems of the cited evidence: Chassis (1), HV battery (1), Thermal/HVAC (3), E/E architecture (1), Interior/console (2), Seats (1)

Evidence: `FND-G60-US-VOC-air_conditioning_setting`, `metric:MET-US-US-G60-climate_controls_usability`, `metric:MET-US-US-G60-air_conditioning_performance`, `metric:MET-US-US-G60-climate_control`, `verbatim:G60-0551`, `REQ-G60-US-IC-02`

### Electric range dissatisfaction is partly about absolute range, partly about confidence and winter transparency
recurring_complaint · powertrain_range_charging · confidence high

Electric Range has 67 complaints, 50 of them usability-related, and dominates the HV battery subsystem, which has 89 complaints versus 45 likes. Customers ask for more range, but many verbatims focus on poor predictability, cold-weather drop-off and unclear guidance by condition. At the same time, the evidence is mixed rather than one-sided: the same theme also has 37 likes, and official EPA figures vary widely by variant and wheel size, from 239 to 310 miles for 2025-2026 i5 versions and 34 miles electric for the 550e. This points to a near-term need for better expectation-setting and range guidance, while a larger range step is a successor-generation topic.

> "range estimates are off"

Subsystems of the cited evidence: Body/structure (1), Powertrain (1), HV battery (9), E/E architecture (1), Software/HMI (1), Interior/console (1), Seats (1)

Evidence: `FND-G60-US-VOC-electric_range`, `verbatim:G60-0051`, `verbatim:G60-0398`, `verbatim:G60-0443`, `external:EXT-E-37-A3`, `external:EXT-E-37-A6`, `external:EXT-E-37-A5`, `REQ-G60-US-PR-02`, `REQ-G60-US-PR-03`

### Public charging is a major BEV pain point, but much of it sits outside the vehicle
context · powertrain_range_charging · confidence medium

Public charging / external providers has 55 complaints, almost all from BEV users, and the charging subsystem totals 123 complaints. Customers struggle with finding compatible stations, sparse coverage on some routes, occupied chargers and awkward planning. This is partly a market problem, not only a vehicle problem: external evidence says the United States has 33 EVs per public charging point, versus 11 in the EU and 10 in China, which is medium-strength context. There is also contradictory context: some external rows say US charging satisfaction has improved and some owners report Tesla charging as seamless, while many G60 owners still describe the experience as harder than Tesla. So the need is real, but the best H1 lever is in-car routing, compatibility guidance and charging access communication rather than trying to solve infrastructure itself.

> "it is hard for her to locate a charging station that is compatible"

Subsystems of the cited evidence: Charging (7)

Evidence: `FND-G60-US-VOC-public_charging_external_providers`, `verbatim:G60-0159`, `verbatim:G60-0256`, `verbatim:G60-0469`, `external:EXT-T5-04-1`, `external:EXT-E-45-1`, `external:EXT-E-41-1`

### Phone integration reliability is undermining an otherwise strong digital offer
recurring_complaint · infotainment_digital · confidence high

Beyond general HMI complexity, there is a specific reliability issue around phone integration. Apple CarPlay has 37 complaints and wireless charging 26 complaints, with 11 defects in the latter. The study score for Phone charging is 5.465, not catastrophic but weaker than the vehicle's driving scores. Customers mention wrong-profile connections, low CarPlay volume, switching confusion and charging trays that do not keep up. This matters because digital expectations are high in this segment and external evidence shows smartphone mirroring ecosystems are expanding strongly, though those rows are global context rather than US customer feedback.

> "the system seems to get mixed up, constantly flipping profiles"

Subsystems of the cited evidence: Powertrain (1), E/E architecture (2), Software/HMI (4), Interior/console (1)

Evidence: `FND-G60-US-VOC-apple_carplay`, `FND-G60-US-VOC-mobile_device_wireless_charging`, `metric:MET-US-US-G60-phone_charging`, `verbatim:G60-0081`, `REQ-G60-US-ID-02`, `external:EXT-T3-03-1`

### Hands-free trunk access is a focused usability defect theme with a contained scope
recurring_complaint · space_practicality · confidence high

Non-contact trunk lid opening has 44 complaints and 39 of them are usability complaints, with almost no offsetting likes. Customers describe inconsistent triggering, unclear foot motion and occasional false openings. Compared with the broad HMI issue, this is a narrower problem concentrated in one body-related feature, so it looks like a targeted fix rather than a concept rethink.

> "It rarely works on the first try"

Subsystems of the cited evidence: Body/structure (4)

Evidence: `FND-G60-US-VOC-non_contact_trunk_lid_opening`, `verbatim:G60-0488`, `verbatim:G60-0835`, `verbatim:G60-1403`

### The core 5 Series dynamic character is a strength to protect
strength · driving_dynamics · confidence high

The strongest positives remain classic BMW sedan attributes. Handling / Riding has 210 likes, Drivetrain has 349 likes, and the study's strongest attributes include Handling/Maneuverability at 6.058, Overall driving performance at 6.039, Riding comfort at 6.03 and Acceleration from stop at 6.026. Customers consistently praise smoothness, road-holding and immediate response. This is strong evidence and should be protected while fixing usability and comfort issues.

> "really hugs the road"

Subsystems of the cited evidence: Body/structure (1), Chassis (4), Powertrain (1), Software/HMI (1)

Evidence: `verbatim:G60-0085`, `verbatim:G60-0030`, `verbatim:G60-0008`, `metric:MET-US-US-G60-acceleration_from_stop`, `REQ-G60-US-DD-03`

## Recommendations (proposals for the product manager)

### Simplify access to frequent functions and reduce menu depth (H1)
Consider prioritising a simpler interaction layer for the functions customers use while driving: climate, seat and steering-wheel heating, drive mode, start-stop, assistance on/off, volume, map and phone. Where feasible in the life-cycle impulse, add or restore direct physical access for the highest-frequency controls.

This is the biggest concentration of complaints in the vehicle: 723 complaints in Software/HMI, with level-A evidence on Operating concept and supporting weak study scores on infotainment menu structure and climate controls. The subsystem concentration matters: many separate complaints likely roll up into one HMI workstream. An existing requirement already covers this. Its CPM estimate is assumption-based, not calibrated, but useful for scale: 3.05% of a new generation, adapt, driven mainly by software_hmi 0.1 K2 plus interior_console 0.1 K2.

Existing requirement: `REQ-G60-US-ID-01`

Effort (CPM estimate): **3.05 %** of a new vehicle generation (P5–P95 1.47–5.48) · adapt, kept in 100 % of the sensitivity runs · size S · layer K2 · from the change profile of REQ-G60-US-ID-01
- software_hmi 0.1 K2: Shortcut layer and widget placement for ten functions
- interior_console 0.1 K2: Physical controls where the panel allows them

Subsystems of the cited evidence: Software/HMI (7), Interior/console (1)

Evidence: `REQ-G60-US-ID-01`, `FND-G60-US-VOC-operating_concept_operating_system`, `FND-G60-US-VOC-touch_screen_operation`, `FND-G60-US-VOC-instrument_cluster`, `metric:MET-US-US-G60-infotainment_menu_structure`, `metric:MET-US-US-G60-climate_controls_usability`, `verbatim:G60-0248`, `verbatim:G60-0397`, `external:EXT-T1-01-1`

### Fix seat comfort first, then review feature-content gaps around seats (H1)
Consider making seat comfort the first interior hardware priority: improve cushion foam, contour and lumbar travel on the existing seat structure for front and rear seats, then review whether leather, massage and ventilation content should be adjusted once the base comfort issue is solved.

Seats are the clearest comfort problem with level-A evidence and weak study support. The customer pain is basic comfort and adjustability, not only missing premium features. An existing requirement covers the core comfort fix. Its effort estimate is assumption-based and rough, but it is still an H1 adaptation rather than a new architecture: 4.58% of a new generation, adapt, starting in seats at own_impact 0.25 K1.

Existing requirement: `REQ-G60-US-IC-01`

Effort (CPM estimate): **4.58 %** of a new vehicle generation (P5–P95 2.02–7.15) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the change profile of REQ-G60-US-IC-01
- seats 0.25 K1: Front and rear cushion foam, contour and lumbar travel on the existing seat structure

Subsystems of the cited evidence: Body/structure (2), Chassis (1), HV battery (1), E/E architecture (1), Software/HMI (2), Interior/console (1), Seats (5)

Evidence: `REQ-G60-US-IC-01`, `FND-G60-US-VOC-seats`, `metric:MET-US-US-G60-seat_comfort`, `metric:MET-US-US-G60-rear_seat_comfort`, `verbatim:G60-0051`, `verbatim:G60-0320`, `verbatim:G60-0468`

### Treat climate control as a combined usability and performance package (H1)
Consider an H1 package that keeps climate controls always visible or directly accessible, preserves key settings per profile, and improves hot-soak cool-down performance for US conditions.

Climate complaints are frequent enough to stand on their own and also reinforce the broader HMI issue. The existing requirement already bundles the right levers across thermal_hvac, interior_console and software_hmi. Its effort estimate is assumption-based and rough: 2.58% of a new generation, adapt.

Existing requirement: `REQ-G60-US-IC-02`

Effort (CPM estimate): **2.58 %** of a new vehicle generation (P5–P95 1.25–4.75) · adapt, kept in 100 % of the sensitivity runs · size S · layer K2 · from the change profile of REQ-G60-US-IC-02
- thermal_hvac 0.1 K2: Vent and blower tuning for heat-soak cool-down
- interior_console 0.05 K1: Always-visible temperature and fan control
- software_hmi 0.03 K1: Persist recirculation, sync and seat-ventilation defaults per profile

Subsystems of the cited evidence: Chassis (1), HV battery (1), Thermal/HVAC (3), E/E architecture (1), Interior/console (2), Seats (1)

Evidence: `REQ-G60-US-IC-02`, `FND-G60-US-VOC-air_conditioning_setting`, `metric:MET-US-US-G60-climate_controls_usability`, `metric:MET-US-US-G60-air_conditioning_performance`, `metric:MET-US-US-G60-climate_control`, `verbatim:G60-0551`

### Improve phone integration reliability and charging-tray performance (H1)
Consider prioritising a focused digital-quality fix for CarPlay profile binding, source switching and loudness matching, together with wireless charging thermal management so the tray maintains charge during normal use.

This is a narrower and more actionable digital issue than the full HMI concept, with clear defect content and customer irritation. The existing requirement covers it. Its effort estimate is assumption-based and rough: 1.45% of a new generation, adapt, starting in software_hmi and interior_console.

Existing requirement: `REQ-G60-US-ID-02`

Effort (CPM estimate): **1.45 %** of a new vehicle generation (P5–P95 0.69–2.67) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the change profile of REQ-G60-US-ID-02
- software_hmi 0.04 K1: CarPlay profile binding and loudness matching
- interior_console 0.05 K1: Wireless charger tray cooling

Subsystems of the cited evidence: Powertrain (1), E/E architecture (2), Software/HMI (3), Interior/console (1)

Evidence: `REQ-G60-US-ID-02`, `FND-G60-US-VOC-apple_carplay`, `FND-G60-US-VOC-mobile_device_wireless_charging`, `metric:MET-US-US-G60-phone_charging`, `verbatim:G60-0081`

### Improve range confidence and winter guidance in H1 (H1)
Consider an H1 software-focused response to electric-range dissatisfaction: improve range prediction, winter guidance and route-planning transparency so customers better understand expected range by conditions and usage.

A large share of range complaints is about confidence, prediction and cold-weather transparency rather than only absolute battery size. The existing H1 requirement covers this and stays small enough for the current generation. Its effort estimate is assumption-based and rough: 0.42% of a new generation, adapt, starting in software_hmi.

Existing requirement: `REQ-G60-US-PR-02`

Effort (CPM estimate): **0.42 %** of a new vehicle generation (P5–P95 0.18–0.75) · adapt, kept in 100 % of the sensitivity runs · size XS · layer K1 · from the change profile of REQ-G60-US-PR-02
- software_hmi 0.04 K1: Range estimation model and winter guidance in navigation

Subsystems of the cited evidence: Body/structure (1), Powertrain (1), HV battery (5), E/E architecture (1), Software/HMI (1), Interior/console (1), Seats (1)

Evidence: `REQ-G60-US-PR-02`, `FND-G60-US-VOC-electric_range`, `verbatim:G60-0051`, `verbatim:G60-0398`, `verbatim:G60-0443`

### Move the larger real-world range step to the successor (H2)
Consider treating a meaningful real-world electric-range increase as an H2 successor topic, using the next battery generation rather than trying to force a current-cycle fix.

Some customers clearly want more absolute range, but the stored requirement already shows this is a new-generation battery change, not an H1 adaptation. The estimate is assumption-based and rough, but directionally clear: 48.98% of a new generation, classed as new generation, starting in hv_battery at K3.

Existing requirement: `REQ-G60-US-PR-03`

Effort (CPM estimate): **48.98 %** of a new vehicle generation (P5–P95 36.73–56.87) · new generation, kept in 100 % of the sensitivity runs · size L · layer K3 · certification add-on · from the change profile of REQ-G60-US-PR-03
- hv_battery 1.0 K3: New cell and pack generation for more range (same case as the Gen6 anchor)

Subsystems of the cited evidence: HV battery (5), Charging (2)

Evidence: `REQ-G60-US-PR-03`, `FND-G60-US-VOC-electric_range`, `external:EXT-E-37-A6`, `external:EXT-T5-07-1`, `external:EXT-T5-11-1`

### Use charging access and planning as the main H1 lever on public charging pain (H1)
Consider improving in-car charging guidance first: route planning that prefers working and compatible stations, clearer communication of Tesla/Supercharger access and adapter status, and simpler compatibility cues in the UI.

Customers clearly feel the charging pain, but much of it is infrastructure outside BMW's control. The best vehicle-side response is planning and guidance. Existing evidence also shows some contradiction: public charging satisfaction in the US is improving in external studies, and some G60 owners report seamless Tesla charging, so the product opportunity is to reduce uncertainty and failed planning rather than assume the whole network experience can be fixed by the car alone.

Effort (CPM estimate): **0.32 %** of a new vehicle generation (P5–P95 0.14–0.56) · adapt, kept in 100 % of the sensitivity runs · size XS · layer K1 · from the analyst's change profile
- software_hmi 0.03 K1: Smaller than the OS 7 release at 0.4: this is route-planner preference and compatibility guidance on the existing system, close to the reference scale of small G60 software changes.
- size of software_hmi 0.03 among 33 reference change(s): at or below 0.03 K1, REQ-G70-US-PR-03: Charging offer registration and station reliability in the planner; at or above 0.03 K1, REQ-F70-EU-DA-01: One-press off per drive within EU regulation, emergency-brake false po …
- catalogue scan for software_hmi with route planner, charging, navigation: F70 standard (2 USB-C ports in the front centre console (charging)); G60 standard (Wireless charging tray); G70 standard (AC Charging Professional: AC charging at home and on the road (22 kW, 3-phase))
- warning (map): the change starts in software_hmi; the cited evidence sits in charging by the theme mapping. Check the reason given for it
- info (43): software_hmi: already standard on G60 (standard on 10, optional on 0 of 10 G60 variants); check whether only configuration (K0) is needed

Subsystems of the cited evidence: HV battery (1), Charging (7)

Evidence: `FND-G60-US-VOC-public_charging_external_providers`, `verbatim:G60-0159`, `verbatim:G60-0256`, `verbatim:G60-0500`, `external:EXT-T5-04-1`, `external:EXT-E-45-1`, `external:EXT-E-41-1`

### Protect the current ride, handling and drivetrain character (H2)
Consider treating the current dynamic balance as a protected attribute in future updates and especially in the successor: keep the smooth ride, precise handling and immediate response while solving usability and comfort issues around it.

This is one of the strongest and cleanest positives in the evidence, with both high like counts and top study scores. The stored preserve requirement already captures it and needs no vehicle change estimate.

Existing requirement: `REQ-G60-US-DD-03`

Effort: none, the proposal is declared not to change the vehicle.

Subsystems of the cited evidence: Body/structure (1), Chassis (4), Powertrain (1), Software/HMI (1)

Evidence: `REQ-G60-US-DD-03`, `verbatim:G60-0085`, `verbatim:G60-0030`, `verbatim:G60-0008`, `metric:MET-US-US-G60-acceleration_from_stop`

## Effort of the proposals as packages
CPM, share of the development effort of a new vehicle generation; never money; every model input is an uncalibrated assumption (config/effort/model.yaml).
Changes are combined per subsystem, so work that several proposals share counts once.

- **H1**: 6 proposal(s) with a change, together **10.57 %** (P5–P95 5.48–16.17) · adapt, kept in 91 % of the runs · sum of the single estimates 12.4 %
  - footprint: Software/HMI 5.18 %, E/E architecture 1.6 %, Seats 1.4 %, Interior/console 1.31 %, Thermal/HVAC 1.08 %
- **H2**: 1 proposal(s) with a change, together **48.98 %** (P5–P95 36.73–56.87) · new generation, kept in 100 % of the runs · sum of the single estimates 48.98 %
  - footprint: HV battery 10.0 %, Body/structure 7.59 %, Software/HMI 4.47 %, E/E architecture 4.2 %, Thermal/HVAC 3.26 %, Chassis 3.11 %

Not settled by the correction request:
- "Use charging access and planning as the main H1 lever on public charging pain": the change starts in software_hmi; the cited evidence sits in charging by the theme mapping. Cite evidence for software_hmi, move the start of the change to where the evidence sits, or state in the change's why what puts the work there.

## Assumptions and gaps
- The German catalogue is not a US order guide, so equipment conclusions are used cautiously and not as sole evidence for US content gaps.
- Country scope is market US; 18 Canadian verbatims are included in the market evidence and a few cited rows come from CA. Study metrics, sales and findings are market-level only.
- External evidence is supportive context only here. Many rows are weak single-source items, some are Global rather than US-specific, and unverified rows were not used alone for recommendations.
- Source B verbatims are call-centre notes and can mix product feedback with explanation or process content; they still align with other sources on the main themes.
- The subsystem mapping and CPM effort model are assumptions. Effort figures are rough prioritisation aids, not measured engineering effort or cost.
- There is only one stored US market row in the pack, about EV share, and it is weak context. There is no stronger stored market-row set for the main interior or HMI issues.
- No additional BMW strategy or delivery document passages were needed because the customer priorities were already clear from verbatims, findings, metrics and requirements.

## Tool calls
- `get_requirements` {'vehicle': 'G60', 'market': 'US'} → 20
- `get_effort` {'vehicle': 'G60', 'market': 'US', 'scenarios': True} → 20
- `get_subsystems` {'vehicle': 'G60', 'market': 'US'} → 12
- `get_external_evidence` {'market': 'US', 'vehicle': 'G60', 'subsystem': 'software_hmi', 'limit': 10} → 35
- `get_external_evidence` {'market': 'US', 'vehicle': 'G60', 'subsystem': 'hv_battery', 'limit': 10} → 12
- `get_external_evidence` {'market': 'US', 'vehicle': 'G60', 'subsystem': 'charging', 'limit': 10} → 11
- `get_metric` {'vehicle': 'G60', 'market': 'US', 'domain': 'infotainment_digital'} → 22
- `get_metric` {'vehicle': 'G60', 'market': 'US', 'domain': 'powertrain_range_charging'} → 6
- `get_metric` {'vehicle': 'G60', 'market': 'US', 'domain': 'interior_comfort'} → 17
- `get_findings` {'vehicle': 'G60', 'market': 'US', 'limit': 20} → 226
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Operating concept, operating system', 'feedback_type': 'Difficult to Use', 'limit': 8} → 39
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Seats', 'feedback_type': 'Difficult to Use', 'limit': 8} → 31
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Electric Range', 'feedback_type': 'Difficult to Use', 'limit': 8} → 50
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Public charging / external providers', 'feedback_type': 'Difficult to Use', 'limit': 8} → 33
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'non-contact trunk lid opening', 'feedback_type': 'Difficult to Use', 'limit': 8} → 39
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Handling / Riding', 'feedback_type': 'Likes', 'limit': 6} → 210
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Drivetrain', 'feedback_type': 'Likes', 'limit': 6} → 332
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Exterior design', 'feedback_type': 'Likes', 'limit': 6} → 193
- `get_subsystems` {'vehicle': 'G60', 'market': 'US', 'subsystem': 'software_hmi'} → 1
- `get_subsystems` {'vehicle': 'G60', 'market': 'US', 'subsystem': 'charging'} → 1
- `get_subsystems` {'vehicle': 'G60', 'market': 'US', 'subsystem': 'hv_battery'} → 1
- `get_subsystems` {'vehicle': 'G60', 'market': 'US', 'subsystem': 'seats'} → 1
