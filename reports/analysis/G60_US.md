# Situation analysis – BMW 5 Series Sedan (G60), market US

Run `RUN-20261011-022444-agent.analyze.G60.US-fbea` · gpt-5.4-2026-03-05 · situation-analysis-v5 · 4 steps, 14 tool calls · 56 references cited, 0 not verified · 0 quotes not found in their verbatims · effort model `789fcb7624b8`

**US G60 customers still buy into the 5 Series for how it drives, but the ownership friction is concentrated in software/HMI, everyday usability and EV experience.**

The strongest customer asset in the US is the G60's driving character: handling/riding has 210 likes, drivetrain 349 likes, and the study is strongest on handling/maneuverability (6.058), overall driving performance (6.039), riding comfort (6.03) and acceleration from stop (6.026). The main product risk is not one isolated defect but a broad usability burden, especially in Software/HMI: 723 complaints sit there, far more than any other subsystem, with operating concept alone at 53 complaints and the study weak on infotainment menu structure (4.879) and heater/AC controls (4.804). Beyond HMI, customers repeatedly call out seat comfort and adjustment, climate-control usability, missing everyday practicality features, inconsistent hands-free trunk opening, and EV pain points around real-world range and public charging. For near-term action, the first priorities should be the H1 items already captured in requirements for one-touch/physical access to frequent functions, climate-control simplification, seat comfort, and phone/profile robustness; for EV range, split the response into H1 expectation management and guidance versus H2 battery-range improvement.

## Data coverage
Analysis rests on the US context pack plus subsystem overview, 226 extracted findings, 20 US requirements, CPM effort scenarios, US sales, study metrics, and drilled-down verbatims for major complaint and strength themes. Customer voice coverage is strong for this scope: 3,628 verbatims in the US market context pack, 2,625 complaint rows in findings quantification, and large theme counts for the main issues (for example 98 complaints on body equipment/overall technology, 67 on electric range, 62 on seats, 55 on public charging, 53 on operating concept). Confidence is highest where verbatims, findings and study metrics align; lower where evidence is mainly verbatims or where the issue depends on external infrastructure.

## Insights

### Driving dynamics remain the core strength and should be protected
strength · driving_dynamics · confidence high

The G60's strongest customer asset in the US is still how it drives. Handling / Riding has 210 likes, Drivetrain has 349 likes, and the study's strongest attributes are Handling/Maneuverability at 6.058, Overall driving performance at 6.039, Riding comfort at 6.03 and Acceleration from stop at 6.026. In subsystem terms, chassis shows 391 likes vs 171 complaints, and powertrain 377 likes vs 170 complaints, so the product earns goodwill here even while other areas create friction.

> really hugs the road.

Subsystems of the cited evidence: Chassis (3), Powertrain (1)

Evidence: `verbatim:G60-0085`, `verbatim:G60-0030`, `verbatim:G60-0012`, `metric:MET-US-US-G60-driving_performance`, `metric:MET-US-US-G60-acceleration_from_stop`, `sales:SAL-G60-US-2025`, `REQ-G60-US-DD-03`

### The biggest product problem is cumulative HMI complexity, not a single feature failure
recurring_complaint · infotainment_digital · confidence high

Software/HMI is the dominant complaint concentration: 723 complaints, 392 likes and 67 criticised themes, far above any other subsystem. Operating concept alone contributes 53 complaints, equal to 2.0% of all complaint rows, mostly usability rather than defects (39 difficult-to-use, 14 wants). This aligns with weak study scores for Menu structure of infotainment system at 4.879 and Operation of heater/ AC controls at 4.804. Customers describe too many steps, too much touchscreen dependence and loss of eyes-on-road usability.

> the screen layout is not very intuitive for accessing some functions

Subsystems of the cited evidence: Software/HMI (5)

Evidence: `verbatim:G60-0248`, `verbatim:G60-0397`, `verbatim:G60-0337`, `metric:MET-US-US-G60-climate_controls_usability`, `metric:MET-US-US-G60-controls_usability`, `metric:MET-US-US-G60-controls_intuitiveness`, `FND-G60-US-VOC-operating_concept_operating_system`, `REQ-G60-US-ID-01`

### Climate control is a specific usability pain inside the broader HMI issue
metric_gap · interior_comfort · confidence high

Climate is not just part of the general HMI burden; it is a distinct customer pain point. Air conditioning, setting has 24 complaints and Vehicle climatization 26, while Thermal/HVAC overall has 86 complaints and only 11 likes. The study is especially weak on Operation of heater/ AC controls at 4.804, and climate-system performance itself is only 5.144, with air-conditioner performance at 5.188. Customers complain about touchscreen-only access, settings that do not persist, and cooling performance in heat-soaked conditions.

> having the climate controls only on the touchscreen takes a lot of taps to adjust and is very distracting

Subsystems of the cited evidence: Body/structure (1), Chassis (1), Powertrain (1), Thermal/HVAC (5), Software/HMI (2), Interior/console (2), Seats (1), Exterior design (1)

Evidence: `verbatim:G60-0921`, `verbatim:G60-0401`, `verbatim:G60-0545`, `metric:MET-US-US-G60-climate_controls_usability`, `metric:MET-US-US-G60-climate_control`, `metric:MET-US-US-G60-air_conditioning_performance`, `FND-G60-US-VOC-air_conditioning_setting`, `REQ-G60-US-IC-02`

### Seat comfort and adjustment are a real product weakness, not just preference noise
recurring_complaint · interior_comfort · confidence high

Seats are one of the clearest interior weaknesses: 62 complaints, 13 defects, 33 usability problems and 16 wishes, making up 2.4% of all complaint rows. The issue is broad enough to earn finding level A and is supported by weak study ratings cited in the requirement set: front seat comfort 5.74 and rear seat comfort 5.27. Verbatims point to lower-back pain, firmness, insufficient adjustment range and controls that are hard to understand.

> the driver seat is extremely uncomfortable, especially in the lower back area

Subsystems of the cited evidence: Body/structure (2), Chassis (1), HV battery (1), E/E architecture (1), Software/HMI (2), Interior/console (1), Seats (6)

Evidence: `verbatim:G60-0051`, `verbatim:G60-0320`, `verbatim:G60-0291`, `verbatim:G60-0468`, `FND-G60-US-VOC-seats`, `REQ-G60-US-IC-01`

### Everyday practicality has regressed in ways customers notice quickly
unmet_need · space_practicality · confidence high

Space & Practicality has the highest complaint share among major domains at 78%. The complaints are less about absolute trunk volume alone than about missing everyday-use details: Storage compartments has 28 complaints and Center console, front 30, both level-A findings, while non-contact trunk lid opening adds 44 complaints and Door, open / close 31. Customers repeatedly mention removed seat-back pockets, limited small-item storage and awkward access features compared with prior BMWs.

> you removed the pockets on the back of the seats

Subsystems of the cited evidence: Body/structure (5), Chassis (1), Thermal/HVAC (2), E/E architecture (2), Software/HMI (1), Interior/console (7), Seats (3), Exterior design (1)

Evidence: `verbatim:G60-0872`, `verbatim:G60-1294`, `verbatim:G60-0236`, `verbatim:G60-0944`, `FND-G60-US-VOC-storage_compartments`, `FND-G60-US-VOC-center_console_front`, `FND-G60-US-VOC-door_open_close`, `REQ-G60-US-SP-02`, `REQ-G60-US-SP-03`

### Hands-free trunk opening is a concentrated annoyance with very little offsetting praise
recurring_complaint · space_practicality · confidence high

The non-contact trunk lid opening function is a focused usability problem: 44 complaints from 46 rows, meaning 96% of what customers say about this theme is negative. Most are difficult-to-use rather than hard failures, but the pattern is consistent: customers struggle to trigger it reliably, ask for coaching on the motion, or report random activation. Because this sits in body_structure alongside other access complaints, it adds to a broader impression that convenience features are less polished than expected.

> It rarely works on the first try and sometimes will not work at all even after several attempts.

Subsystems of the cited evidence: Body/structure (5)

Evidence: `verbatim:G60-0835`, `verbatim:G60-0488`, `verbatim:G60-1403`, `verbatim:G60-0180`, `FND-G60-US-VOC-non_contact_trunk_lid_opening`

### EV customers ask for both more range and more trustworthy range guidance
recurring_complaint · powertrain_range_charging · confidence high

Electric Range is a major EV pain point with 67 complaints, 50 of them difficult-to-use and 17 wants; 64% of all rows on the theme are negative. The verbatims show two linked needs: more real-world range, especially in cold weather, and better prediction/explanation of what range remains under conditions. This is concentrated in the HV battery subsystem, which has 89 complaints and only 45 likes, with Electric Range accounting for 67 of those complaints.

> range estimates are off

Subsystems of the cited evidence: Body/structure (1), Powertrain (1), HV battery (7), E/E architecture (1), Software/HMI (1), Interior/console (1), Seats (1)

Evidence: `verbatim:G60-0051`, `verbatim:G60-0195`, `verbatim:G60-0398`, `verbatim:G60-0443`, `FND-G60-US-VOC-electric_range`, `REQ-G60-US-PR-02`, `REQ-G60-US-PR-03`

### Public charging pain is real for EV owners, but much of it sits outside the vehicle
context · powertrain_range_charging · confidence medium

Public charging / external providers has 55 complaints, 83% of all rows on that theme, and Charging overall has 123 complaints vs 39 likes. Customers struggle with charger availability, compatibility and provider experience. This is important to the ownership experience, but much of the pain is external to the vehicle. The only stored market context is weak evidence that EVs were 7.8% of US new-vehicle sales in 2025; that helps frame the market but does not change the customer need frequency inside this sample.

Subsystems of the cited evidence: Powertrain (1), Charging (1)

Evidence: `FND-G60-US-VOC-public_charging_external_providers`, `market:MKT-US-powertrain-1`

## Recommendations (proposals for the product manager)

### Reduce HMI friction on the top ten in-drive tasks first (H1)
Prioritise a near-term simplification pass for the most-used driving tasks so they are reachable in one touch or by a dedicated physical control where the panel allows it, starting with climate temperature/fan, seat and steering-wheel heating, drive mode, start-stop, assistance on/off, volume, map and phone.

This is the broadest complaint concentration in the vehicle: Software/HMI carries 723 complaints, operating concept alone has 53 complaints, and the study is weak on menu structure and climate-control operation. Because many small complaints sit in one subsystem, this is likely to unlock more customer gain than chasing isolated issues one by one. An existing US requirement already covers this and its CPM estimate remains in adapt territory, but the effort figures are model assumptions, not measured effort.

Existing requirement: `REQ-G60-US-ID-01`

Effort (CPM estimate): **3.05 %** of a new vehicle generation (P5–P95 1.47–5.48) · adapt, kept in 100 % of the sensitivity runs · size S · layer K2 · from the change profile of REQ-G60-US-ID-01
- software_hmi 0.1 K2: Shortcut layer and widget placement for ten functions
- interior_console 0.1 K2: Physical controls where the panel allows them

Subsystems of the cited evidence: Software/HMI (5)

Evidence: `verbatim:G60-0248`, `verbatim:G60-0397`, `verbatim:G60-0337`, `metric:MET-US-US-G60-climate_controls_usability`, `metric:MET-US-US-G60-controls_usability`, `FND-G60-US-VOC-operating_concept_operating_system`, `REQ-G60-US-ID-01`

### Treat climate controls as a separate H1 fix, not only as part of general HMI cleanup (H1)
Consider a dedicated climate-control improvement package for the US: always-visible temperature and fan access, persistence of recirculation/sync/seat-ventilation defaults per profile, and cooling/blower tuning for hot-soak conditions.

Climate complaints are frequent enough and specific enough to justify their own workstream: 24 complaints on air-conditioning setting, 26 on vehicle climatization, and the weakest relevant study score is heater/AC control operation at 4.804. The stored requirement already packages software, console and HVAC changes and is still classed as adapt by the CPM model; that estimate is assumption-based and should be used only for rough prioritisation.

Existing requirement: `REQ-G60-US-IC-02`

Effort (CPM estimate): **2.58 %** of a new vehicle generation (P5–P95 1.25–4.75) · adapt, kept in 100 % of the sensitivity runs · size S · layer K2 · from the change profile of REQ-G60-US-IC-02
- thermal_hvac 0.1 K2: Vent and blower tuning for heat-soak cool-down
- interior_console 0.05 K1: Always-visible temperature and fan control
- software_hmi 0.03 K1: Persist recirculation, sync and seat-ventilation defaults per profile

Subsystems of the cited evidence: Body/structure (1), Chassis (1), Powertrain (1), Thermal/HVAC (5), Software/HMI (2), Interior/console (2), Seats (1), Exterior design (1)

Evidence: `verbatim:G60-0921`, `verbatim:G60-0401`, `verbatim:G60-0545`, `metric:MET-US-US-G60-climate_controls_usability`, `metric:MET-US-US-G60-climate_control`, `metric:MET-US-US-G60-air_conditioning_performance`, `FND-G60-US-VOC-air_conditioning_setting`, `REQ-G60-US-IC-02`

### Improve front and rear seat comfort and adjustment range in the current generation (H1)
Advance the seat-comfort package for H1, focusing on cushion/foam tuning, contour and lumbar calibration, and adjustment range that works across body sizes without pain or visibility compromises.

Seats are one of the largest single complaint themes and carry level-A evidence. The issue is not only trim preference; customers report pain, firmness and insufficient adjustment range. The existing requirement already covers this and remains an H1 adapt in the CPM model, though the model inputs are assumptions and not calibrated measurements.

Existing requirement: `REQ-G60-US-IC-01`

Effort (CPM estimate): **4.58 %** of a new vehicle generation (P5–P95 2.02–7.15) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the change profile of REQ-G60-US-IC-01
- seats 0.25 K1: Front and rear cushion foam, contour and lumbar travel on the existing seat structure

Subsystems of the cited evidence: Body/structure (2), Chassis (1), HV battery (1), E/E architecture (1), Software/HMI (2), Interior/console (1), Seats (6)

Evidence: `verbatim:G60-0051`, `verbatim:G60-0320`, `verbatim:G60-0291`, `verbatim:G60-0468`, `FND-G60-US-VOC-seats`, `REQ-G60-US-IC-01`

### Stabilise phone integration and driver-profile behaviour as a trust repair item (H1)
Prioritise fixes for profile binding, wrong-phone connection, CarPlay loudness consistency and wireless charging robustness so the digital basics work predictably every day.

The broader HMI burden is amplified when core digital functions feel unreliable. Existing requirements already cover phone integration and profile persistence, and both are low-effort H1 adaptations in the CPM model. This is worth pulling forward because it addresses repeated daily irritants rather than niche features.

Existing requirement: `REQ-G60-US-ID-02`

Effort (CPM estimate): **1.45 %** of a new vehicle generation (P5–P95 0.69–2.67) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the change profile of REQ-G60-US-ID-02
- software_hmi 0.04 K1: CarPlay profile binding and loudness matching
- interior_console 0.05 K1: Wireless charger tray cooling

Subsystems of the cited evidence: Powertrain (1), E/E architecture (2), Software/HMI (4), Interior/console (1)

Evidence: `verbatim:G60-0081`, `FND-G60-US-VOC-apple_carplay`, `FND-G60-US-VOC-mobile_device_wireless_charging`, `REQ-G60-US-ID-02`, `REQ-G60-US-ID-03`

### Restore everyday practicality features customers miss from prior 5 Series cars (H1)
Consider an H1 practicality package that restores or adds small-item storage features customers explicitly miss, such as seat-back pockets and improved covered-console/glove-box usability, and review whether convenience-access content has been cut too far for this market.

Space & Practicality has the highest complaint share, and the complaints are concrete and repeated rather than vague. The existing storage requirement already covers much of this. Customers also connect these removals with a perceived step-down versus earlier BMWs, which risks loyalty more than the raw complaint count alone suggests.

Existing requirement: `REQ-G60-US-SP-02`

Effort (CPM estimate): **2.08 %** of a new vehicle generation (P5–P95 0.94–4.07) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the change profile of REQ-G60-US-SP-02
- interior_console 0.1 K1: Seat-back pockets, sunglasses holder, covered tray, larger door pockets

Subsystems of the cited evidence: Body/structure (3), Chassis (2), Thermal/HVAC (2), E/E architecture (2), Software/HMI (2), Interior/console (7), Seats (3), Exterior design (1)

Evidence: `verbatim:G60-0872`, `verbatim:G60-1294`, `verbatim:G60-0236`, `verbatim:G60-1416`, `FND-G60-US-VOC-storage_compartments`, `FND-G60-US-VOC-center_console_front`, `REQ-G60-US-SP-02`

### Fix or de-risk the hands-free trunk experience (H1)
Review whether the best H1 response is a calibration/sensor improvement, clearer trigger logic, or a content decision to avoid over-promising the feature if robust performance cannot be achieved consistently.

This function is almost entirely criticised and creates disproportionate annoyance for a convenience feature: 44 complaints from 46 rows. Because the issue is concentrated and specific, it is a good candidate for a targeted fix if technically feasible within the current generation. No stored requirement in the returned set clearly covers this exact theme, so a fresh proposal is justified.

Effort (CPM estimate): **1.92 %** of a new vehicle generation (P5–P95 0.95–3.42) · adapt, kept in 100 % of the sensitivity runs · size S · layer K1 · from the analyst's change profile
- body_structure 0.04 K1: The complaint sits in body_structure and likely starts with sensor placement, trigger calibration or local hardware/software integration for the kick-open function.
- ee_architecture 0.02 K1: Signal interpretation and key-presence logic may need adjustment where random or missed activation is reported.
- catalogue scan for body_structure with Comfort Access, automatic tailgate, hands-free trunk: F70 optional (Automatic tailgate operation); G70 standard (Automatic tailgate operation)
- catalogue scan for ee_architecture with Comfort Access, Digital Key: G60 standard (BMW Digital Key); G70 standard (Comfort Access)
- info (map): the change starts in ee_architecture; the cited evidence sits in body_structure by the theme mapping. Check the profile's reason
- warning (43): body_structure: catalogue shows F70 optional, G70 standard; the change could carry over (carryover: true) instead of a new development
- info (43): ee_architecture: already standard on G60 (standard on 10, optional on 0 of 10 G60 variants); check whether only configuration (K0) is needed

Subsystems of the cited evidence: Body/structure (5)

Evidence: `verbatim:G60-0835`, `verbatim:G60-0488`, `verbatim:G60-1403`, `verbatim:G60-0180`, `FND-G60-US-VOC-non_contact_trunk_lid_opening`

### Split EV range response into H1 guidance and H2 hardware ambition (H2)
For H1, improve range prediction, condition-based guidance and winter/preconditioning communication; for H2, consider a successor-generation battery step aimed at materially better real-world electric range.

Customers ask for both more range and better understanding of the range they have. The stored requirements already separate these horizons well: H1 software guidance versus H2 battery change. That split should be kept, because the CPM model treats the H2 battery step as a new-generation-scale change; those effort figures are assumption-based, but directionally they show this is not a current-generation patch.

Existing requirement: `REQ-G60-US-PR-03`

Effort (CPM estimate): **48.98 %** of a new vehicle generation (P5–P95 36.73–56.87) · new generation, kept in 100 % of the sensitivity runs · size L · layer K3 · certification add-on · from the change profile of REQ-G60-US-PR-03
- hv_battery 1.0 K3: New cell and pack generation for more range (same case as the Gen6 anchor)

Subsystems of the cited evidence: Body/structure (1), Powertrain (2), HV battery (7), E/E architecture (1), Software/HMI (1), Interior/console (1), Seats (1)

Evidence: `verbatim:G60-0051`, `verbatim:G60-0195`, `verbatim:G60-0398`, `verbatim:G60-0443`, `FND-G60-US-VOC-electric_range`, `REQ-G60-US-PR-02`, `REQ-G60-US-PR-03`, `market:MKT-US-powertrain-1`

### Protect the current ride and handling character while fixing usability issues (H2)
Keep the present chassis and powertrain character as a non-negotiable reference when making H1 updates and when defining the successor, so usability fixes do not dilute the main reason customers love the car.

The G60 earns strong advocacy on handling, ride and acceleration. This is already captured as a preserve requirement for the successor. It changes nothing on the current vehicle by itself, but it should guide trade-offs when other changes are packaged.

Existing requirement: `REQ-G60-US-DD-03`

Effort: none, the proposal is declared not to change the vehicle.

Subsystems of the cited evidence: Chassis (3), Powertrain (1)

Evidence: `verbatim:G60-0085`, `verbatim:G60-0030`, `verbatim:G60-0012`, `metric:MET-US-US-G60-driving_performance`, `metric:MET-US-US-G60-acceleration_from_stop`, `REQ-G60-US-DD-03`

## Effort of the proposals as packages
CPM, share of the development effort of a new vehicle generation; never money; every model input is an uncalibrated assumption (config/effort/model.yaml).
Changes are combined per subsystem, so work that several proposals share counts once.

- **H1**: 6 proposal(s) with a change, together **13.2 %** (P5–P95 6.97–20.08) · adapt, kept in 68 % of the runs · sum of the single estimates 15.66 %
  - footprint: Software/HMI 5.48 %, E/E architecture 2.0 %, Interior/console 1.99 %, Seats 1.48 %, Thermal/HVAC 1.16 %, Body/structure 0.72 %
  - warning (rule 51): borderline: only 68 % of the sensitivity runs keep the decision; show the PM both options
- **H2**: 1 proposal(s) with a change, together **48.98 %** (P5–P95 36.73–56.87) · new generation, kept in 100 % of the runs · sum of the single estimates 48.98 %
  - footprint: HV battery 10.0 %, Body/structure 7.59 %, Software/HMI 4.47 %, E/E architecture 4.2 %, Thermal/HVAC 3.26 %, Chassis 3.11 %

## Assumptions and gaps
- The analysis is market-level US. There is no country narrowing beyond the market pack, and Canada contributes only 18 verbatims inside the US market scope.
- Study metrics are compared only with other BMW models, not competitors; no competitor benchmark should be inferred from the scores.
- The equipment catalogue is the German July 2026 price list, so equipment references indicate model-line availability, not confirmed US standard/optional status.
- Source B verbatims are call-centre notes written by agents and can mix product feedback with process content; they were used as customer evidence but interpreted cautiously.
- Some labels were assigned by an AI assistant where original labels were missing; this may add classification noise at theme level.
- Only one stored market-context row was available for the US, and it is weak evidence: EVs at 7.8% of US new-vehicle sales in 2025 [market:MKT-US-powertrain-1]. There was no stronger market or competitor evidence returned for other subsystems.
- Sales references are market-level and the note says the G60 volumes are reported on the combined G60/G68 sheet; for the US this is still the stored evidence and was used only as scale context, not as proof of customer need.
- CPM effort outputs are assumption-based and uncalibrated. They were used only to separate likely H1 from H2 and to judge packaging, not to decide whether a customer need is real.
- No additional document search was needed because the stored market evidence and sales already framed the market context, and strategy or delivery passages would not materially change the product conclusions here.

## Tool calls
- `get_subsystems` {'vehicle': 'G60', 'market': 'US'} → 12
- `get_requirements` {'vehicle': 'G60', 'market': 'US'} → 20
- `get_effort` {'vehicle': 'G60', 'market': 'US', 'scenarios': True} → 20
- `get_sales` {'vehicle': 'G60', 'market': 'US'} → 3
- `get_metric` {'vehicle': 'G60', 'market': 'US'} → 103
- `get_findings` {'vehicle': 'G60', 'market': 'US', 'limit': 50} → 226
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Operating concept, operating system', 'feedback_type': 'Difficult to Use', 'limit': 8} → 39
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Seats', 'feedback_type': 'Difficult to Use', 'limit': 8} → 31
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Electric Range', 'feedback_type': 'Difficult to Use', 'limit': 8} → 50
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'non-contact trunk lid opening', 'feedback_type': 'Difficult to Use', 'limit': 8} → 39
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Handling / Riding', 'feedback_type': 'Likes', 'limit': 6} → 210
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Drivetrain', 'feedback_type': 'Likes', 'limit': 6} → 332
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Air conditioning, setting', 'feedback_type': 'Difficult to Use', 'limit': 6} → 14
- `get_verbatims_by_theme` {'vehicle': 'G60', 'market': 'US', 'theme': 'Storage compartments', 'feedback_type': 'Wants', 'limit': 6} → 14
