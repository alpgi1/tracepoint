# Requirement list – all vehicles, all markets

57 requirements. Priority scores follow in Phase 5.

## REQ-G60-US-IC-01 – Front and rear seats comfortable for long drives across body sizes

*interior_comfort · H1 · markets US · evidence A · recommended · status proposed (v1)*

The front seats shall allow a pain-free two-hour drive for drivers from 1.60 m to 1.90 m, including a lumbar support that can be set completely flat, and the rear seat cushion and backrest shall match the comfort of the front seats.

**Why:** Seats are the largest complaint theme of the interior (62 complaint rows, 2.4 % of all US complaints, level A) and both study attributes sit below the peer: front seat comfort 5.74 vs 6.04, rear seat comfort 5.27 vs 6.24. Verbatims name back pain, firmness and a lumbar support that cannot be flattened.
**Horizon:** Cushion, contour and lumbar calibration change within the life-cycle impulse; no new architecture needed.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study front seat comfort (1-7) | >= 6.0 (today 5.74, peer 6.04) | Next US customer study wave | evidence |
| US | Study rear seat comfort (1-7) | >= 6.0 (today 5.27, peer 6.24) | Next US customer study wave | evidence |
| US | Share of seat complaint rows | <= 1.2 % of complaint rows (today 2.4 %) | Customer feedback sources A-D, rolling 6 months | assumption |
| US | Lumbar support travel | Can be set to a completely flat position | Seat test | evidence |

**Findings:** `FND-G60-US-VOC-seats` (primary); `FND-G60-US-MET-us_2025-seat_comfort` (supporting); `FND-G60-US-MET-us_2025-rear_seat_comfort` (supporting); `FND-G60-US-VOC-adjustment_of_lower_lumbar_support` (supporting); `FND-G60-US-EQ-seats` (context)
**Assumptions:** Study scores of the next wave are comparable with the 2025 wave.
**Uncertainties:** Comfort perception differs between ICE (71 rows) and BEV (38 rows) buyers; the split is small.

## REQ-G60-US-IC-02 – Climate control direct, strong enough for US heat, and remembers its settings

*interior_comfort · H1 · markets US · evidence A · recommended · status proposed (v1)*

Temperature and fan speed shall have a physical or always-visible control; recirculation, zone sync and seat-ventilation defaults shall persist per driver profile across drives; the system shall cool the cabin from a heat-soaked state within an agreed time.

**Why:** Climate setting is a level-A complaint (24 rows) supported by the study attribute climate controls usability (4.80); blower (19) and control panel (17) complaints add hidden vents, weak airflow and settings that reset after every drive.
**Horizon:** Persistence and control placement are software; vent and blower tuning fit the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study climate controls usability (1-7) | >= 5.3 (today 4.80) | Next US customer study wave | assumption |
| US | Settings kept after ignition off | Recirculation, sync and seat ventilation default kept per profile | Function test | evidence |
| US | Cabin cool-down from 60 °C soak to 25 °C | <= 10 min (to be validated) | Climate chamber test | assumption |

**Findings:** `FND-G60-US-VOC-air_conditioning_setting` (primary); `FND-G60-US-MET-us_2025-climate_controls_usability` (supporting); `FND-G60-US-VOC-blower_function` (supporting); `FND-G60-US-VOC-air_conditioning_control_panel` (supporting); `FND-G60-US-VOC-vehicle_climatization` (supporting)

## REQ-G60-US-IC-03 – Interior materials that match the price class

*interior_comfort · H1 · markets US · evidence A · recommended · status proposed (v1)*

Door panels, dashboard and trim within reach shall use soft-touch or leather materials, and a full-leather upholstery option shall be offered.

**Why:** Upholstery and trim is level A (20 rows) and supported by the study attribute interior material quality (5.62 vs 5.95); door panels add 19 rows. Owners compare the cabin with the previous generation and with Audi.
**Horizon:** Material and option changes within the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study interior material quality (1-7) | >= 5.95 (today 5.62, peer 5.95) | Next US customer study wave | evidence |
| US | Leather upholstery option | Available on every variant | Offer check | assumption |

**Findings:** `FND-G60-US-VOC-upholstery_interior_trim` (primary); `FND-G60-US-MET-us_2025-interior_material_quality` (supporting); `FND-G60-US-VOC-door_finisher_panel_front` (supporting); `FND-G60-US-EQ-upholstery_interior_trim` (context)

## REQ-G60-US-ID-01 – Frequently used functions reachable with one touch or a physical control

*infotainment_digital · H1 · markets US · evidence A · recommended · status proposed (v1)*

Climate temperature and fan, seat and steering wheel heating, drive mode, start-stop, assistance on/off, volume, map and phone shall each be operable with one touch or a physical control while driving, without leaving the current screen.

**Why:** The operating concept is a level-A recurring complaint (53 rows, 39 of them usability) and is linked to the study attribute infotainment menu structure (4.88). Touch screen (35 rows) and instrument cluster (38 rows) complaints repeat the same pattern: functions are buried in menus and pull the eyes off the road.
**Horizon:** Mostly software (shortcut layer, widget placement); physical controls only where the panel allows them in the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Touches to reach each of the ten listed functions while driving | <= 1 | HMI test protocol | assumption |
| US | Study infotainment menu structure (1-7) | >= 5.3 (today 4.88) | Next US customer study wave | assumption |
| US | Share of operating-concept complaint rows | <= 1.0 % (today 2.0 %) | Customer feedback, rolling 6 months | assumption |

**Findings:** `FND-G60-US-VOC-operating_concept_operating_system` (primary); `FND-G60-US-MET-us_2025-infotainment_menu_structure` (supporting); `FND-G60-US-VOC-touch_screen_operation` (supporting); `FND-G60-US-VOC-instrument_cluster` (supporting)
**Uncertainties:** Part of the criticism is unfamiliarity; onboarding (REQ-G60-US-GE-01) may reduce it without HMI changes.

## REQ-G60-US-ID-02 – Phone integration that just works

*infotainment_digital · H1 · markets US · evidence A · recommended · status proposed (v1)*

Apple CarPlay shall connect to the phone of the active driver profile, play at the same loudness as the native sources, and wireless charging shall keep the phone charged without overheating.

**Why:** Apple CarPlay (37 rows, 12 defects) and wireless charging (26 rows, level A, 11 defects, supported by the study attribute phone charging) are among the most frequent digital complaints; low CarPlay volume and the wrong phone connecting are repeated themes.
**Horizon:** Software and charger thermal management.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | CarPlay audio level vs native sources | Within 3 dB at the same volume step | Audio test | assumption |
| US | Phone connected at start | Phone of the active profile in >= 98 % of starts | Fleet telemetry | assumption |
| US | Wireless charging with navigation running | Battery level does not drop over 60 min at 30 °C cabin | Lab test | assumption |

**Findings:** `FND-G60-US-VOC-apple_carplay` (primary); `FND-G60-US-VOC-mobile_device_wireless_charging` (primary); `FND-G60-US-MET-us_2025-phone_charging` (supporting); `FND-G60-US-VOC-manage_pair_mobile_device_bluetooth` (supporting)

## REQ-G60-US-SP-02 – Practical storage for everyday items

*space_practicality · H1 · markets US · evidence A · recommended · status proposed (v1)*

The cabin shall provide seat-back pockets, a sunglasses holder, a covered console tray and a glove box and door pockets that take a bottle and an umbrella.

**Why:** Storage compartments (28 rows, half of them wishes) and front centre console (30 rows) are level-A findings supported by the study attribute interior storage (5.15 vs peer 5.33); owners miss the removed seat-back pockets and sunglasses holder.
**Horizon:** Trim parts within the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study interior storage (1-7) | >= 5.5 (today 5.15, peer 5.33) | Next US customer study wave | assumption |
| US | Seat-back pockets and sunglasses holder | Present on every variant | Offer check | evidence |

**Findings:** `FND-G60-US-VOC-storage_compartments` (primary); `FND-G60-US-VOC-center_console_front` (primary); `FND-G60-US-MET-us_2025-interior_storage` (supporting); `FND-G60-US-VOC-glove_box` (supporting); `FND-G60-US-VOC-cupholder` (supporting)

## REQ-G60-US-SP-03 – Keyless access on all four doors and easy door handling

*space_practicality · H1 · markets US · evidence A · recommended · status proposed (v1)*

Comfort access shall lock and unlock from all four door handles, the doors shall close without slamming and the handles shall be easy to find in the dark.

**Why:** Door open/close is level A (31 rows) and linked to the study attribute rear entry/exit (5.41 vs 6.0); comfort access (30 rows, 17 wishes) and lock/unlock (38 rows) complain that the rear doors lost the touch sensor of earlier generations.
**Horizon:** Rear handle sensors and closing-force tuning fit the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Doors with comfort-access sensor | 4 of 4 where comfort access is fitted | Offer check | evidence |
| US | Door closing energy | Closes fully without slamming (value to be set by engineering) | Door test | assumption |
| US | Study entry/exit rear (1-7) | >= 5.8 (today 5.41) | Next US customer study wave | assumption |

**Findings:** `FND-G60-US-VOC-door_open_close` (primary); `FND-G60-US-VOC-comfort_access` (supporting); `FND-G60-US-VOC-vehicle_lock_unlock` (supporting); `FND-G60-US-MET-us_2025-entry_exit_rear` (supporting)

## REQ-G70-US-DA-01 – Assistance and camera package as standard on the flagship

*driver_assistance · H1 · markets US · evidence A · recommended · status proposed (v1)*

Adaptive cruise control with stop and go, surround view and front camera shall be standard on every G70, with following distance and lane keeping adjustable by one control.

**Why:** Active cruise control is level A (23 rows), parking assistant (19) and surround view (7 wishes) add that owners expect these on a 100k car; adaptive driving assist (5.32 vs 5.77) and parking cameras (5.46 vs 5.80) score below the peer.
**Horizon:** Standard-content decision; hardware exists.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Variants with ACC stop and go and surround view as standard | All | Offer check | evidence |
| US | Study parking cameras and sensors (1-7) | >= 5.8 (today 5.46) | Next US customer study wave | evidence |

**Findings:** `FND-G70-US-VOC-active_cruise_control` (primary); `FND-G70-US-VOC-parking_assistant` (supporting); `FND-G70-US-VOC-surround_view` (supporting); `FND-G70-US-MET-us_2025-parking_camera_sensors` (supporting)

## REQ-G70-US-DD-01 – Fully customisable personal drive mode

*driving_dynamics · H1 · markets US · evidence A · recommended · status proposed (v1)*

The personal mode shall let the driver combine suspension, steering, throttle, sound and energy settings, start in the last chosen mode and hide modes that are not used.

**Why:** My Modes is level A (31 rows, 14 wishes) and linked to the study attribute customisation ease (4.34 vs peer 5.20).
**Horizon:** Software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study customisation ease (1-7) | >= 5.2 (today 4.34, peer 5.20) | Next US customer study wave | evidence |
| US | Mode kept after ignition off | Last mode per profile | Function test | evidence |

**Findings:** `FND-G70-US-VOC-my_modes_driving_experience` (primary); `FND-G70-US-MET-us_2025-customisation_ease` (supporting)

## REQ-G70-US-EX-01 – Headlights that light the road like a flagship

*exterior_design · H1 · markets US · evidence A · recommended · status proposed (v1)*

The headlights shall offer strong low-beam reach and selective high-beam masking in the US as allowed by regulation, and lighting faults shall not occur in the first year.

**Why:** Exterior lighting is level A (24 rows, 10 defects) and supported by headlight performance (5.55 vs 5.93); owners note that US cars lack the selective beam available elsewhere.
**Horizon:** Software activation where the hardware allows; fault fixes in production.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study headlight performance (1-7) | >= 5.9 (today 5.55, peer 5.93) | Next US customer study wave | evidence |
| US | Adaptive driving beam | Activated in the US where legally permitted | Offer check | assumption |

**Findings:** `FND-G70-US-VOC-exterior_lighting` (primary); `FND-G70-US-MET-us_2025-headlight_performance` (supporting)
**Uncertainties:** Depends on the US adaptive driving beam regulation as applied to the current hardware.

## REQ-G70-US-GE-01 – Personal onboarding for flagship owners

*general · H1 · markets US · evidence A · recommended · status proposed (v1)*

Every owner shall be offered a personal introduction (at delivery and again after four weeks) plus an in-car guided tour and a searchable model-specific manual.

**Why:** The largest complaint cluster (89 rows, level A) is about complexity; owner's manual (22 rows) and general enquiries (21 rows) ask for more guidance after delivery.
**Horizon:** Service and software content.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Owners offered a follow-up introduction after four weeks | 100 % | Dealer process audit | assumption |
| US | Complaint rows about complexity | -30 % within 12 months | Customer feedback | assumption |

**Findings:** `FND-G70-US-VOC-body_equipment_overall_technology` (primary); `FND-G70-US-VOC-owner_s_manual` (supporting); `FND-G70-US-VOC-general_enquiry_customer_feedback` (supporting)

## REQ-G70-US-IC-02 – Climate system that cools a large cabin fast and lets passengers direct the air

*interior_comfort · H1 · markets US · evidence A · recommended · status proposed (v1)*

The climate system shall cool the cabin quickly after sun soak, let front and rear occupants direct the airflow, and offer temperature and fan controls that do not require menus.

**Why:** Vehicle climatisation (42 rows), blower (23) and air conditioning (20) are all level A; the study puts air conditioning performance at 4.48 vs peer 5.19 and climate control at 4.74 vs 5.14. Owners in hot states describe the car as undriveable for minutes after parking.
**Horizon:** Vent design and blower calibration in the life-cycle impulse; controls in software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study air conditioning performance (1-7) | >= 5.2 (today 4.48, peer 5.19) | Next US customer study wave | evidence |
| US | Cabin cool-down from 60 °C soak to 25 °C | <= 10 min (to be validated) | Climate chamber test | assumption |
| US | Adjustable airflow direction at front vents | Yes | Design review | evidence |

**Findings:** `FND-G70-US-VOC-vehicle_climatization` (primary); `FND-G70-US-VOC-blower_function` (supporting); `FND-G70-US-VOC-air_conditioning_overall_technology` (supporting); `FND-G70-US-MET-us_2025-air_conditioning_performance` (supporting); `FND-G70-US-MET-us_2025-climate_control` (supporting)

## REQ-G70-US-ID-01 – Intuitive controls for a flagship driver

*infotainment_digital · H1 · markets US · evidence A · recommended · status proposed (v1)*

The frequently used functions (climate, seat functions, drive mode, start-stop, assistance, audio source and volume, navigation zoom) shall be operable with one touch, a physical control or a reliable voice command, without searching through apps.

**Why:** The operating concept is the largest digital complaint (66 rows, 62 usability, level A) and the study puts controls intuitiveness at 4.36 vs peer 5.20 and controls usability at 4.51 vs 5.12; touch screen complaints (39 rows, level A) say the same.
**Horizon:** Software layer and shortcut concept; physical controls in the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study controls intuitiveness (1-7) | >= 5.2 (today 4.36, peer 5.20) | Next US customer study wave | evidence |
| US | Study controls usability (1-7) | >= 5.1 (today 4.51) | Next US customer study wave | evidence |
| US | Touches for the listed functions while driving | <= 1 | HMI test protocol | assumption |

**Findings:** `FND-G70-US-VOC-operating_concept_operating_system` (primary); `FND-G70-US-MET-us_2025-controls_intuitiveness` (supporting); `FND-G70-US-MET-us_2025-controls_usability` (supporting); `FND-G70-US-VOC-touch_screen_operation` (supporting); `FND-G70-US-MET-us_2025-screen_interface_usability` (supporting)

## REQ-G70-US-ID-02 – In-car connectivity that stays connected

*infotainment_digital · H1 · markets US · evidence A · recommended · status proposed (v1)*

The personal eSIM, Wi-Fi hotspot and connected services shall activate once and stay working with all major US carriers, including business plans, without repeated resets.

**Why:** Personal eSIM is a large complaint cluster (42 rows, 14 defects) and connected drive / infotainment technology is level A (39 rows, 24 defects); Wi-Fi hotspot (4.51 vs 4.98) and connected services (4.83 vs 5.13) score below the peer. The rear theatre screen depends on it.
**Horizon:** Backend, carrier integration and software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | eSIM activation success on first attempt | >= 98 % across the four largest US carriers | Activation logs | assumption |
| US | Study Wi-Fi hotspot (1-7) | >= 5.0 (today 4.51, peer 4.98) | Next US customer study wave | evidence |

**Findings:** `FND-G70-US-VOC-personal_esim` (primary); `FND-G70-US-VOC-connecteddrive_and_infotainment_overall_technolo` (primary); `FND-G70-US-VOC-wifi_hotspot` (supporting); `FND-G70-US-MET-us_2025-wifi_hotspot` (supporting); `FND-G70-US-MET-us_2025-connected_services` (supporting)
**Uncertainties:** Carrier-side provisioning is partly outside BMW's control.

## REQ-G70-US-ID-04 – Seamless smartphone integration and audio worthy of the flagship

*infotainment_digital · H1 · markets US · evidence A · recommended · status proposed (v1)*

Apple CarPlay and Bluetooth shall pair once, connect to the active driver's phone and play at the same loudness as native sources; the premium audio systems shall deliver the bass and clarity customers expect at this price.

**Why:** Apple CarPlay (28 rows, level A) and pairing (16 rows) complaints match the study gaps in smartphone integration (4.79 vs 5.49) and phone pairing (5.03 vs 5.59); audio is level A (27 rows) with bass 4.97 vs 5.59 and clarity 5.06 vs 5.68.
**Horizon:** Software, tuning and speaker placement within the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study smartphone integration (1-7) | >= 5.5 (today 4.79, peer 5.49) | Next US customer study wave | evidence |
| US | Study audio bass (1-7) | >= 5.6 (today 4.97, peer 5.59) | Next US customer study wave | evidence |
| US | CarPlay audio level vs native sources | Within 3 dB at the same volume step | Audio test | assumption |

**Findings:** `FND-G70-US-VOC-apple_carplay` (primary); `FND-G70-US-VOC-audio_mode_sound` (primary); `FND-G70-US-MET-us_2025-smartphone_integration` (supporting); `FND-G70-US-MET-us_2025-audio_bass` (supporting); `FND-G70-US-VOC-manage_pair_mobile_device_bluetooth` (supporting)

## REQ-G70-US-ID-05 – Navigation and voice assistant that get it right the first time

*infotainment_digital · H1 · markets US · evidence A · recommended · status proposed (v1)*

Route guidance shall give lane advice early and clearly on multi-lane highways, and the voice assistant shall understand natural phrasing of common commands without exact wording.

**Why:** Navigation is level A (28 rows) with the study at 4.85 vs peer 5.53; the personal assistant is level A (23 rows) linked to voice recognition (4.76 vs 4.99).
**Horizon:** Software over the air.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study navigation (1-7) | >= 5.5 (today 4.85, peer 5.53) | Next US customer study wave | evidence |
| US | Voice command success on a 50-command natural-language test set | >= 90 % | Voice test protocol | assumption |

**Findings:** `FND-G70-US-VOC-navigation` (primary); `FND-G70-US-VOC-intelligent_personal_assistant` (primary); `FND-G70-US-MET-us_2025-navigation` (supporting); `FND-G70-US-MET-us_2025-voice_recognition` (supporting)

## REQ-G70-US-PR-02 – Electric range that matches the flagship's long-distance role

*powertrain_range_charging · H2 · markets US · evidence A · recommended · status proposed (v1)*

The successor of the i7 shall offer a real-world range that covers long US highway stages in cold weather without range anxiety.

**Why:** Electric range is level A (45 rows, 17 wishes for 350 to 400 miles); winter range below 150 miles is reported, and fuel economy scores 4.99 vs 5.48.
**Horizon:** Needs the next battery generation.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | EPA range of the BEV | >= 350 mi | Homologation | assumption |
| US | Range at -7 °C | >= 75 % of EPA range | Cold-weather test | assumption |

**Findings:** `FND-G70-US-VOC-electric_range` (primary); `FND-G70-US-MET-us_2025-fuel_economy` (supporting)

## REQ-G70-US-QN-01 – Fault-free first months of ownership

*quality_nvh · H1 · markets US · evidence A · recommended · status proposed (v1)*

A new car shall reach the customer free of drivetrain, electrical and paint faults; repairs in the first three months shall be the exception, not the experience.

**Why:** Drivetrain complaints (51 rows, 27 defects) and exterior complaints (43 rows, 27 defects: paint, trim) report breakdowns, warnings and long workshop stays in the first weeks; reliability (5.52 vs 5.92) and electrical reliability (5.18 vs 5.42) are below the peer.
**Horizon:** Launch quality measures in production and pre-delivery inspection.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study reliability (1-7) | >= 5.9 (today 5.52, peer 5.92) | Next US customer study wave | evidence |
| US | Workshop visits for faults in the first 90 days | -50 % vs current model year | Warranty data | assumption |

**Findings:** `FND-G70-US-VOC-drivetrain` (primary); `FND-G70-US-VOC-exterior` (primary); `FND-G70-US-MET-us_2025-reliability` (supporting); `FND-G70-US-MET-us_2025-electrical_reliability` (supporting)

## REQ-F70-EU-DA-01 – Assistance systems that help instead of irritating

*driver_assistance · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Speed-limit warning and lane assistance shall be switchable off with one press per drive, and the emergency brake shall not intervene without a real obstacle.

**Why:** Driver assistance draws 24 rows with 17 defects (unexpected braking) and the speed-limit assistant 16 rows (14 usability) because it must be switched off after every start.
**Horizon:** Software within the limits of EU safety regulation.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Presses to switch off speed-limit warning and lane assistance | 1 (one shortcut for both) | Function test | assumption |
| EU | Unjustified emergency brake interventions reported | 0 in the next feedback wave | Customer feedback | assumption |

**Findings:** `FND-F70-EU-VOC-driver_assistance_automated_driving_overall_tech` (primary); `FND-F70-EU-VOC-speed_limit_assistant` (supporting)
**Uncertainties:** EU General Safety Regulation requires these systems to be active at every start; only the switch-off effort can change.

## REQ-F70-EU-DD-01 – Comfortable ride on poor road surfaces

*driving_dynamics · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Non-M variants shall offer a comfort-oriented suspension that absorbs sharp bumps on poor European roads without losing the car's sporty handling.

**Why:** Suspension and damping draw 41 complaint rows (2.2 %, 12 wishes for a softer ride) and the study scores ride comfort at 9.20 vs peer 9.73; adaptive suspension is standard only on the M135.
**Horizon:** Damper tuning and an adaptive-suspension option fit the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Study ride comfort (1-10) | >= 9.6 (today 9.20, peer 9.73) | Next EU customer study wave | evidence |
| EU | Adaptive suspension | Available as option on all variants | Offer check | assumption |

**Findings:** `FND-F70-EU-VOC-cushioning_damping_vehicle` (primary); `FND-F70-EU-MET-cn_eu_2025-ride_comfort` (supporting); `FND-F70-EU-EQ-cushioning_damping_vehicle` (context)

## REQ-F70-EU-DD-02 – Keep the sporty handling and the fuel economy in the next generation

*driving_dynamics · H2 · markets EU · evidence B · recommended · status proposed (v1)*

The successor shall keep the agile handling and the fuel economy that customers praise today.

**Why:** Sportiness (9.34 vs peer 7.30) and fuel economy (9.30 vs 7.56) are the strongest study advantages; driving dynamics collects 415 likes. Strengths to protect.
**Horizon:** Applies to the successor generation.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Study sportiness and fuel economy (1-10) | >= 9.0 each | Customer study of the successor | evidence |

**Findings:** `FND-F70-EU-MET-STRENGTH-cn_eu_2025-sportiness` (primary); `FND-F70-EU-MET-STRENGTH-cn_eu_2025-fuel_economy` (primary); `FND-F70-EU-VOC-STRENGTH-drive_driving_dynamics_and_chassis_overall_techn` (supporting)

## REQ-F70-EU-EX-01 – Reliable exterior lights and helpful door mirrors

*exterior_design · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Exterior lights shall work without fault messages; door mirrors shall tilt down on the kerb side when reversing and fold automatically when locking.

**Why:** Exterior lighting draws 26 rows with 19 defects (failed or falsely reported lamps); door mirrors 28 rows with 11 wishes for kerb tilt and auto-fold that previous 1 Series had.
**Horizon:** Production quality and software functions.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Lighting defect rows | <= 5 per 6 months (today 19) | Customer feedback | assumption |
| EU | Kerb-side mirror tilt in reverse | Standard on all variants | Offer check | assumption |

**Findings:** `FND-F70-EU-VOC-exterior_lighting` (primary); `FND-F70-EU-VOC-exterior_rearview_mirror` (primary)

## REQ-F70-EU-EX-02 – Quiet tyres and wheels that are easy to clean

*exterior_design · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Standard tyres shall keep road noise low on rough surfaces, and wheel designs shall be easy to clean and resist corrosion.

**Why:** Wheels and tyres draw 34 complaint rows (15 defects): tyre noise, early corrosion and intricate wheel designs that are hard to clean.
**Horizon:** Tyre sourcing and wheel design in the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | EU tyre label noise class of standard tyres | A (<= 70 dB) | Tyre label | assumption |
| EU | Wheel corrosion reports in the first year | 0 | Warranty data | assumption |

**Findings:** `FND-F70-EU-VOC-wheels_tires` (primary); `FND-F70-EU-EQ-wheels_tires` (context)

## REQ-F70-EU-GE-01 – No silent de-contenting against the previous 1 Series

*general · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Items that loyal customers used on the previous generation (12 V socket in the boot, rear USB charging, mirror kerb tilt, dual-zone climate, fog lights, glove-box light) shall stay standard on the comparable trim, or the change shall be shown clearly at configuration.

**Why:** The general equipment theme draws 73 complaint rows with 35 wishes, mostly from repeat buyers listing features that were standard on the F40 and are now missing or optional.
**Horizon:** Standard-content and configurator decision.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Listed items standard on the M Sport trim | All | Offer check | assumption |
| EU | Complaint rows about missing standard equipment | -50 % within 12 months | Customer feedback | assumption |

**Findings:** `FND-F70-EU-VOC-body_equipment_overall_technology` (primary)
**Uncertainties:** Cost impact not quantified; rough effort follows in Phase 5.

## REQ-F70-EU-IC-01 – Supportive, durable seats with lumbar adjustment

*interior_comfort · H1 · markets EU · evidence B · recommended · status proposed (v1)*

The front seats shall support the back on long drives, offer lumbar adjustment on the volume trims and keep their stitching and shape over the warranty period.

**Why:** Seats draw 50 complaint rows with 24 defects (stitching, loss of shape, squeaks) and comfort complaints about M Sport seats; active seats are an option on all six variants.
**Horizon:** Seat trim, foam and lumbar option within the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Seat defect rows | <= 8 per 6 months (today 24) | Customer feedback | assumption |
| EU | Lumbar adjustment | Available on every trim with electric seats | Offer check | assumption |

**Findings:** `FND-F70-EU-VOC-seats` (primary); `FND-F70-EU-EQ-seats` (context)

## REQ-F70-EU-IC-02 – Dual-zone climate as standard and rear ventilation

*interior_comfort · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Driver and passenger temperatures shall be adjustable independently on every variant, the display shall not suggest zones that are not fitted, and rear passengers shall get air vents.

**Why:** Climatisation (24 rows), climate control panel (24) and climate settings (17, nine wishes) describe synced temperatures that cannot be split and a display that looks dual-zone; the study scores climate control at 7.31 vs peer 8.13, the largest interior gap.
**Horizon:** Software activation plus standard-content decision; rear vents in the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Study climate control (1-10) | >= 8.0 (today 7.31, peer 8.13) | Next EU customer study wave | evidence |
| EU | Independent driver and passenger temperature | Standard on all variants | Offer check | assumption |

**Findings:** `FND-F70-EU-VOC-vehicle_climatization` (primary); `FND-F70-EU-VOC-air_conditioning_control_panel` (supporting); `FND-F70-EU-VOC-air_conditioning_setting` (supporting); `FND-F70-EU-MET-cn_eu_2025-climate_control` (supporting)

## REQ-F70-EU-IC-03 – Cockpit lighting without reflections in the mirrors and windscreen

*interior_comfort · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Ambient and display lighting shall not reflect in the side mirrors, side windows or windscreen at night at any brightness setting.

**Why:** Instrument panel complaints (33 rows, 11 defects) include repeated reports that dash and ambient lights reflect in the door mirrors and windscreen at night, which owners call a safety issue.
**Horizon:** Light guide and default brightness changes.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Visible reflection of interior lighting in the side mirrors at night | None at default brightness | Night visibility test | assumption |

**Findings:** `FND-F70-EU-VOC-instrument_panel` (primary)

## REQ-F70-EU-ID-01 – Physical controls for climate and a rotary controller option

*infotainment_digital · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Temperature, fan and seat or steering wheel heating shall have physical controls, and a rotary controller (or an equivalent haptic control) shall operate map zoom, lists and shortcuts so the driver does not have to aim at the touch screen while driving.

**Why:** Touch screen operation is the largest complaint theme of the F70 in Europe (141 rows, 7.4 % of all complaints, 91 usability); 25 owners explicitly ask for the iDrive controller back and the operating concept adds 30 rows. Many describe touch-only climate control as unsafe.
**Horizon:** Physical climate keys and a controller are a life-cycle-impulse change of the centre console.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Share of touch-screen complaint rows | <= 3 % of complaint rows (today 7.4 %) | Customer feedback, rolling 6 months | assumption |
| EU | Climate temperature and fan operable without the touch screen | Yes | Function test | evidence |
| EU | Glance time for a temperature change while driving | <= 1.5 s | HMI eye-tracking test | assumption |

**Findings:** `FND-F70-EU-VOC-touch_screen_operation` (primary); `FND-F70-EU-VOC-controller_operation` (primary); `FND-F70-EU-VOC-operating_concept_operating_system` (supporting); `FND-F70-EU-VOC-instrument_cluster` (supporting)

## REQ-F70-EU-ID-02 – Stable infotainment and settings that survive updates

*infotainment_digital · H1 · markets EU · evidence B · recommended · status proposed (v1)*

The central display and connected functions shall not freeze, go blank or reboot in normal use, and over-the-air updates shall keep all personal settings.

**Why:** Connected drive and infotainment technology draws 107 complaint rows with 51 defects (blank screens, freezes, lost functions); software updates add 13 rows with 9 defects that wiped settings, and the study scores connected services at 7.36 vs peer 7.62.
**Horizon:** Software quality and update process.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Infotainment defect rows | -60 % within 12 months (today 51) | Customer feedback | assumption |
| EU | User settings kept after an OTA update | 100 % of profile settings | Update regression test | evidence |
| EU | Study connected services (1-10) | >= 7.6 (today 7.36, peer 7.62) | Next EU customer study wave | evidence |

**Findings:** `FND-F70-EU-VOC-connecteddrive_and_infotainment_overall_technolo` (primary); `FND-F70-EU-VOC-remote_software_upgrade_rsu` (supporting); `FND-F70-EU-MET-cn_eu_2025-connected_services` (supporting)

## REQ-F70-EU-ID-03 – Functions bought with the car stay included for the first owner

*infotainment_digital · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Functions that are fitted and shown at handover (high-beam assistant, traffic information, 3D maps, media apps) shall stay active for the first owner without a subscription, and any time-limited content shall be stated clearly at the point of sale.

**Why:** 47 complaint rows about connected upgrades, all usability: functions such as automatic high beam and live traffic switch off after three months; the catalogue lists Digital Premium as time-limited (480 EUR option). Owners feel misled and say they will change brand.
**Horizon:** Offer and licensing decision; no hardware change.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Hardware-enabled safety and lighting functions behind a subscription | None | Offer check | assumption |
| EU | Complaint rows about expiring functions | <= 10 per 6 months (today 47) | Customer feedback | assumption |

**Findings:** `FND-F70-EU-VOC-bmw_connecteddrive_upgrades_mini_connected_upgra` (primary); `FND-F70-EU-EQ-connecteddrive_and_infotainment_overall_technolo` (context)
**Uncertainties:** Touches the digital revenue model; needs a commercial decision beyond the product scope.

## REQ-F70-EU-ID-04 – Printed quick-start handbook and better in-car help

*infotainment_digital · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Every car shall be delivered with a printed, model-specific quick-start handbook, and the in-car manual shall be searchable and show only the functions fitted to the car.

**Why:** The owner's manual is the third-largest digital complaint (86 rows, 37 wishes for a printed handbook); older owners report being unable to use functions without it.
**Horizon:** Content and print; no vehicle change.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Printed quick-start handbook at delivery | Every car | Delivery audit | evidence |
| EU | Manual complaint rows | <= 20 per 6 months (today 86) | Customer feedback | assumption |

**Findings:** `FND-F70-EU-VOC-owner_s_manual` (primary)

## REQ-F70-EU-ID-05 – Music from USB sticks

*infotainment_digital · H1 · markets EU · evidence B · recommended · status proposed (v1)*

The USB-C ports shall play audio files from a USB stick, without requiring a smartphone.

**Why:** 30 complaint rows, 17 wishes: owners copied their CDs to USB sticks and lost playback with the new generation; several say USB only charges.
**Horizon:** Software (media player and USB data path), possibly a hub change in the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Playback of MP3 and AAC from a FAT32 or exFAT USB stick | Yes | Function test | evidence |

**Findings:** `FND-F70-EU-VOC-usb_port` (primary)

## REQ-F70-EU-ID-06 – Navigation route choice and clear guidance

*infotainment_digital · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Navigation shall offer fastest, shortest and road-type preferences, avoid single-track lanes on main routes and keep map zoom operable without the touch screen.

**Why:** Navigation draws 29 complaint rows (11 defects) about routes through narrow lanes and missing route options; the study scores navigation at 8.30 vs peer 8.71.
**Horizon:** Software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Study navigation (1-10) | >= 8.7 (today 8.30, peer 8.71) | Next EU customer study wave | evidence |
| EU | Route preference options | Fastest, shortest, avoid narrow roads | Function test | assumption |

**Findings:** `FND-F70-EU-VOC-navigation` (primary); `FND-F70-EU-MET-cn_eu_2025-navigation` (supporting)

## REQ-F70-EU-PR-01 – Smooth dual-clutch gearbox and immediate response when pulling away

*powertrain_range_charging · H1 · markets EU · evidence B · recommended · status proposed (v1)*

The car shall pull away without a perceptible delay or jerk, including when the throttle is pressed while still rolling, and the gearbox shall shift smoothly at low speed and when cold.

**Why:** Drivetrain complaints (123 rows, 6.5 %, 73 usability) and transmission complaints (48 rows, 12 defects) describe a dead spot when pulling away at junctions and jerky DCT behaviour; the study scores acceleration at 8.21 vs 8.90.
**Horizon:** Engine, hybrid and gearbox calibration.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Delay from throttle input to traction when rolling below 10 km/h | <= 0.3 s | Vehicle measurement | assumption |
| EU | Study acceleration (1-10) | >= 8.8 (today 8.21, peer 8.90) | Next EU customer study wave | evidence |
| EU | Pull-away and gearbox complaint rows | -50 % within 12 months | Customer feedback | assumption |

**Findings:** `FND-F70-EU-VOC-drivetrain` (primary); `FND-F70-EU-VOC-transmission` (primary); `FND-F70-EU-MET-cn_eu_2025-acceleration` (supporting)

## REQ-F70-EU-QN-01 – Quiet, solid-feeling cabin without rattles

*quality_nvh · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Doors and interior trim shall be free of rattles and buzzing, and the cabin noise at motorway speed shall match the premium compact segment.

**Why:** Front door complaints (16 rows, 13 defects: buzzing, rattles) support the study gaps in quietness (7.62 vs peer 8.79, the largest gap of the car) and build quality (7.95 vs 8.23).
**Horizon:** Acoustic package and assembly fixes.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Study quietness (1-10) | >= 8.5 (today 7.62, peer 8.79) | Next EU customer study wave | evidence |
| EU | Interior noise at 130 km/h | Segment benchmark (value to be set by engineering) | Acoustic measurement | assumption |

**Findings:** `FND-F70-EU-MET-cn_eu_2025-quietness` (primary); `FND-F70-EU-VOC-door_front` (supporting); `FND-F70-EU-MET-cn_eu_2025-build_quality` (supporting)

## REQ-F70-EU-SP-01 – Practical boot with power tailgate and luggage fixtures

*space_practicality · H1 · markets EU · evidence B · recommended · status proposed (v1)*

The boot shall offer tie-down points, a 12 V socket and a parcel shelf that stays in place; the tailgate shall close from a button on the lid where a power tailgate is fitted.

**Why:** Luggage compartment (23 rows), trunk lid (15 defects) and tailgate operation (19 rows, 12 wishes) complaints match the study gaps in cargo capacity (7.07 vs 7.47) and loading ease (7.50 vs 7.95); the power tailgate is an option on all variants.
**Horizon:** Boot fixtures and offer changes in the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Study loading ease (1-10) | >= 7.9 (today 7.50, peer 7.95) | Next EU customer study wave | evidence |
| EU | Tie-down points and 12 V socket in the boot | Every variant | Offer check | evidence |

**Findings:** `FND-F70-EU-VOC-luggage_compartment` (primary); `FND-F70-EU-VOC-trunk_lid_open_close` (supporting); `FND-F70-EU-VOC-trunk_lid` (supporting); `FND-F70-EU-MET-cn_eu_2025-loading_ease` (supporting); `FND-F70-EU-EQ-luggage_compartment` (context)

## REQ-G60-US-DA-01 – Adaptive cruise control as standard and simple assistance controls

*driver_assistance · H1 · markets US · evidence B · recommended · status proposed (v1)*

Adaptive cruise control shall be standard; following distance, lane keeping and assistance on/off shall be adjustable with one control while driving.

**Why:** Active cruise control (23 rows) and parking assistant (22 rows) complaints mention paying extra for functions expected as standard and awkward controls; the catalogue offers Driving Assistant Plus only as an option (1,000 EUR, 0 of 10 variants standard).
**Horizon:** Hardware is fitted; standard content and HMI are a product decision.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Variants with adaptive cruise control as standard | All | Offer check | evidence |
| US | Gap adjustment while driving | One control on the steering wheel | Function test | assumption |

**Findings:** `FND-G60-US-VOC-active_cruise_control` (primary); `FND-G60-US-EQ-active_cruise_control` (supporting); `FND-G60-US-VOC-parking_assistant` (supporting); `FND-G60-US-VOC-lane_departure_warning` (supporting)
**Uncertainties:** The catalogue is the German price list; US standard content may differ.

## REQ-G60-US-DD-01 – Personal drive mode that is really personal

*driving_dynamics · H1 · markets US · evidence B · recommended · status proposed (v1)*

The personal mode shall let the driver combine steering, suspension, throttle, sound and energy settings freely, hide unused modes and start in the last chosen mode.

**Why:** My Modes draws 36 complaint rows, 15 of them wishes: owners want to start in sport or efficient mode and to configure the personal mode instead of fixed presets.
**Horizon:** Software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Mode kept after ignition off | Last mode per profile | Function test | evidence |
| US | Configurable parameters in personal mode | Steering, damping, throttle, sound, energy | Function test | assumption |

**Findings:** `FND-G60-US-VOC-my_modes_driving_experience` (primary)

## REQ-G60-US-DD-02 – Progressive brake pedal feel and predictable recuperation

*driving_dynamics · H1 · markets US · evidence B · recommended · status proposed (v1)*

Brake pedal response shall be progressive without an initial grab, and lifting off the accelerator shall decelerate the car predictably, with an option for one-pedal driving to a standstill.

**Why:** Braking draws 37 complaint rows (28 usability: grabbing, poor modulation) and recuperation 13 rows asking for consistent engine braking and a full stop in one-pedal mode.
**Horizon:** Brake-by-wire and recuperation calibration.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Braking complaint rows | <= 15 per 6 months (today 37) | Customer feedback | assumption |
| US | One-pedal stop | Car stops and holds without the brake pedal in the strongest mode | Function test | assumption |

**Findings:** `FND-G60-US-VOC-braking` (primary); `FND-G60-US-VOC-brake_energy_regeneration_recuperation` (supporting)

## REQ-G60-US-DD-03 – Keep the handling and ride character in the next generation

*driving_dynamics · H2 · markets US · evidence B · recommended · status proposed (v1)*

The successor shall keep the handling precision and ride composition that customers praise today.

**Why:** Handling and riding is the strongest praise theme (210 likes) and handling/manoeuvrability scores above the peer (6.06 vs 5.62); a strength to protect, not to change.
**Horizon:** Applies to the chassis of the successor generation.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study handling/manoeuvrability (1-7) | >= 6.0 (today 6.06) | Customer study of the successor | evidence |

**Findings:** `FND-G60-US-VOC-STRENGTH-handling_riding` (primary); `FND-G60-US-MET-STRENGTH-us_2025-handling_manoeuvrability` (supporting)

## REQ-G60-US-GE-01 – Guided onboarding for a feature-rich car

*general · H1 · markets US · evidence B · recommended · status proposed (v1)*

Every new owner shall get an in-car guided tour and a searchable, model-specific help function that explains the ten most used functions within the first week.

**Why:** The largest single complaint cluster (98 rows, 63 usability) is about the car being hard to figure out; owner's manual complaints (16 rows) add that the manual is hard to search.
**Horizon:** Software and content.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Owners who completed the guided tour in week 1 | >= 60 % | Telemetry | assumption |
| US | Complaint rows about complexity | -30 % within 12 months | Customer feedback | assumption |

**Findings:** `FND-G60-US-VOC-body_equipment_overall_technology` (primary); `FND-G60-US-VOC-owner_s_manual` (supporting)

## REQ-G60-US-ID-03 – Driver profiles and settings survive updates and shared use

*infotainment_digital · H1 · markets US · evidence B · recommended · status proposed (v1)*

Personal settings shall survive over-the-air updates; each profile shall support at least two keys or phones, and the car shall recognise the right driver when two key holders approach together.

**Why:** Driver profile complaints (25 rows) and software update complaints (15 rows) report seat memories, wake words and assistance settings wiped by updates and the wrong profile loaded.
**Horizon:** Software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | User settings kept after an OTA update | 100 % of profile settings | Update regression test | evidence |
| US | Keys or phones per profile | >= 2 | Function test | evidence |

**Findings:** `FND-G60-US-VOC-driver_profile` (primary); `FND-G60-US-VOC-remote_software_upgrade_rsu` (supporting); `FND-G60-US-VOC-digital_key` (supporting)

## REQ-G60-US-PR-01 – Auto start-stop can be switched off permanently by the driver

*powertrain_range_charging · H1 · markets US · evidence B · recommended · status proposed (v1)*

Drivers of ICE and mild-hybrid variants shall be able to switch auto start-stop off with one control and keep it off across drives in their profile; the restart shall not jolt the car.

**Why:** 45 complaint rows, all from ICE drivers (1.7 % of US complaints): the function cannot be disabled permanently, cuts in too early and feels harsh and unsafe at intersections.
**Horizon:** Software setting and calibration, deliverable over the air.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Start-stop off setting kept after ignition off | Yes, per driver profile | Function test | evidence |
| US | Start-stop complaint rows | <= 10 per 6 months (today 45) | Customer feedback | assumption |

**Findings:** `FND-G60-US-VOC-automatic_engine_start_stop_function_msa` (primary)
**Uncertainties:** Fuel economy certification credits may constrain a persistent off setting; legal check needed.

## REQ-G60-US-PR-02 – Reliable range prediction and cold-weather range guidance for BEV and PHEV

*powertrain_range_charging · H1 · markets US · evidence B · recommended · status proposed (v1)*

The displayed remaining range shall stay within an agreed tolerance of the real range in cold weather, and the car shall explain the expected winter range and the effect of pre-conditioning before a trip.

**Why:** Electric range is the second-largest powertrain complaint (67 rows, 2.6 %, 83 of them BEV); verbatims report estimates that are "off" and range that collapses in winter.
**Horizon:** Range estimation and guidance are software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Deviation of displayed vs actual range at 0 °C | <= 10 % | Fleet data analysis | assumption |
| US | Winter range guidance in navigation | Shown before departure when the trip exceeds 70 % of predicted range | Function test | assumption |

**Findings:** `FND-G60-US-VOC-electric_range` (primary); `FND-G60-US-VOC-high_voltage_battery` (supporting)

## REQ-G60-US-PR-03 – More real-world electric range in the successor generation

*powertrain_range_charging · H2 · markets US · evidence B · recommended · status proposed (v1)*

The successor of the i5 shall offer a usable real-world range that covers typical US long-distance stages without a charging stop, including in cold weather.

**Why:** Range wishes (17 rows) and usability complaints (50 rows) ask for 350 to 400 miles; the battery capacity of the current generation cannot be raised within the life cycle.
**Horizon:** Needs a new cell and pack generation.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | EPA range of the volume BEV variant | >= 350 mi | Homologation | assumption |
| US | Range at -7 °C | >= 75 % of EPA range | Cold-weather test | assumption |

**Findings:** `FND-G60-US-VOC-electric_range` (primary)
**Assumptions:** Customer wishes of 350 to 400 miles in the verbatims represent the US BEV buyer.

## REQ-G60-US-PR-04 – Dependable public fast charging on US trips

*powertrain_range_charging · H1 · markets US · evidence B · recommended · status proposed (v1)*

BEV owners shall be able to use the Tesla Supercharger (NACS) network without improvising, the route planner shall prefer stations that are reported working, and the car shall hold its advertised peak charging power for a meaningful part of the session.

**Why:** Public charging draws 55 complaint rows (65 BEV mentions) and battery charging 31 more: broken stations, no NACS access, slow sessions and charge cut-offs make long trips stressful.
**Horizon:** Adapter, network agreement and route-planner logic do not need a new vehicle generation.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | NACS access | Adapter supplied or available at delivery; Supercharger usable from the car | Offer check | evidence |
| US | Planned stops at stations reported out of order | <= 5 % | Route-planner logs | assumption |
| US | Charging complaint rows | -50 % within 12 months | Customer feedback | assumption |

**Findings:** `FND-G60-US-VOC-public_charging_external_providers` (primary); `FND-G60-US-VOC-charge_high_voltage_battery` (supporting); `FND-G60-US-EQ-charge_high_voltage_battery` (context)
**Uncertainties:** Third-party network reliability is outside BMW's direct control.

## REQ-G60-US-PR-05 – Charging flap opens reliably in every condition

*powertrain_range_charging · H1 · markets US · evidence B · recommended · status proposed (v1)*

The charge port cover shall open on the first request whenever the car is unlocked, including in frost.

**Why:** 20 complaint rows with 13 defects (BEV 19); owners report being stranded because the flap stays locked.
**Horizon:** Field fix of the actuator and its software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Flap opening success rate | >= 99.9 % down to -20 °C | Endurance and climate test | assumption |
| US | Defect reports on the flap | 0 in the next feedback wave | Customer feedback | assumption |

**Findings:** `FND-G60-US-VOC-opening_closing_charging_socket_cover` (primary)

## REQ-G60-US-SP-01 – Hands-free tailgate opens on the first kick and closes from inside

*space_practicality · H1 · markets US · evidence B · recommended · status proposed (v1)*

The hands-free tailgate shall open on the first foot movement and the trunk shall have a close button on the lid.

**Why:** Non-contact trunk opening is one of the largest single usability complaints (44 rows, 39 usability); trunk lid open/close adds 18 rows with 9 defects.
**Horizon:** Sensor calibration and a close button fit the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | First-attempt opening rate | >= 95 % | User test with 30 participants | assumption |
| US | Close button on the tailgate | Present on every variant with power tailgate | Offer check | evidence |

**Findings:** `FND-G60-US-VOC-non_contact_trunk_lid_opening` (primary); `FND-G60-US-VOC-trunk_lid_open_close` (supporting)

## REQ-G70-US-DD-02 – Confident braking, including under assisted driving

*driving_dynamics · H1 · markets US · evidence B · recommended · status proposed (v1)*

The brakes shall feel strong and progressive at highway speeds, and assisted driving shall slow down early and smoothly for slower traffic instead of braking late and hard.

**Why:** Braking draws 33 complaint rows with 10 defects (weak stopping above 60 mph, late harsh braking in cruise); adaptive driving assist scores 5.32 vs 5.77.
**Horizon:** Brake system calibration and assistance software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Braking complaint rows | <= 12 per 6 months (today 33) | Customer feedback | assumption |
| US | Peak deceleration of ACC when approaching slower traffic | <= 3 m/s² outside emergencies | Test track | assumption |

**Findings:** `FND-G70-US-VOC-braking` (primary); `FND-G70-US-MET-us_2025-adaptive_driving_assist` (supporting)

## REQ-G70-US-EX-02 – Calmer front design (split grille, smaller black areas)

*exterior_design · H2 · markets US · evidence B · not recommended · status proposed (v1)*

Redesign the front with a less dominant grille and less black surface.

**Why:** The grille draws 10 complaint rows and 18 design wishes, but exterior design is the strongest praise theme of the car (210 likes). The criticism is real but polarising; a redesign risks the main reason buyers chose the car. Kept visible for the PM's decision.
**Horizon:** Front-end design change belongs to the successor or the next life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Not applicable | Not recommended | PM confirmation | assumption |

**Findings:** `FND-G70-US-VOC-radiator_grille` (primary); `FND-G70-US-VOC-exterior_design` (supporting); `FND-G70-US-VOC-STRENGTH-exterior_design` (context)

## REQ-G70-US-IC-01 – Automatic doors that never open unintentionally while driving

*interior_comfort · H1 · markets US · evidence B · recommended · status proposed (v1)*

The electric doors shall not open from an inside button while the car is moving or a gear is engaged, shall start moving within an agreed delay, and shall close reliably from outside with a clearly placed button.

**Why:** Automatic doors draw 40 complaint rows (9 defects, 30 usability) next to 45 likes. Several owners report that a knee touches the inside button and the door opens while driving: a safety risk on a flagship feature.
**Horizon:** Interlock logic is software; button guard or relocation fits the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Door opening from inside button above walking speed or in gear | Not possible | Function and safety test | evidence |
| US | Delay from button press to door movement | <= 0.5 s | Function test | assumption |
| US | Automatic door defect rows | 0 in the next feedback wave | Customer feedback | assumption |

**Findings:** `FND-G70-US-VOC-automatic_doors` (primary)

## REQ-G70-US-IC-03 – Robust glass roof with an opening option and blinds that work

*interior_comfort · H2 · markets US · evidence B · recommended · status proposed (v1)*

The panoramic glass roof shall not crack in normal use, shall limit heat entry, and an opening sunroof shall be offered; the rear and side blinds shall operate by button and not get stuck.

**Why:** The panorama glass roof draws 38 complaint rows with 14 defects (cracks, bubbles) and 17 wishes for an opening roof; sun protection adds 27 rows (blinds stuck, operated only via the screen).
**Horizon:** An opening roof needs a body-in-white change; glass quality and blind fixes start in H1 but the full requirement lands with the successor.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Roof glass defect reports | 0 cracks without impact | Warranty data | assumption |
| US | Opening sunroof | Offered as option | Offer check | evidence |
| US | Blind operation | Physical button per blind; no stuck blind in endurance test | Function test | assumption |

**Findings:** `FND-G70-US-VOC-panorama_glass_roof` (primary); `FND-G70-US-VOC-sun_protection` (supporting)

## REQ-G70-US-ID-03 – Rear theatre screen usable without blocking the driver's rear view

*infotainment_digital · H1 · markets US · evidence B · recommended · status proposed (v1)*

When the rear theatre screen or rear blind is deployed, the driver shall keep a full rear view (camera image in the interior mirror or on demand), and the screen shall be easy to operate and stream without cables.

**Why:** Rear seat entertainment draws 34 complaint rows next to 20 likes: the lowered screen blocks the rear view and streaming often fails; 13 owners explicitly ask for a camera rear-view mirror, and rear visibility scores 5.23 vs 5.63.
**Horizon:** Camera mirror and software fit the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Rear view with theatre screen down | Camera image available in the interior mirror | Function test | assumption |
| US | Study rear visibility (1-7) | >= 5.6 (today 5.23, peer 5.63) | Next US customer study wave | evidence |

**Findings:** `FND-G70-US-VOC-rear_seat_entertainment` (primary); `FND-G70-US-VOC-interior_rearview_mirror` (supporting); `FND-G70-US-MET-us_2025-rear_visibility` (supporting); `FND-G70-US-VOC-rear_view_camera` (supporting)

## REQ-G70-US-PR-01 – Auto start-stop can be switched off permanently and restarts smoothly

*powertrain_range_charging · H1 · markets US · evidence B · recommended · status proposed (v1)*

The driver shall be able to keep auto start-stop off across drives with one control, the engine shall not stop before the car is stationary, and the restart shall not jolt the car.

**Why:** 43 complaint rows (28 usability, 13 wishes): the engine stops before standstill, restarts with a jolt and can only be avoided in sport mode; drivers describe it as unsafe at intersections.
**Horizon:** Calibration and software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Start-stop off setting kept after ignition off | Yes, per driver profile | Function test | evidence |
| US | Engine stop before standstill | Never | Calibration test | assumption |

**Findings:** `FND-G70-US-VOC-automatic_engine_start_stop_function_msa` (primary)
**Uncertainties:** Fuel economy certification may constrain a persistent off setting.

## REQ-G70-US-PR-03 – Easy and reliable public charging, including the Supercharger network

*powertrain_range_charging · H1 · markets US · evidence B · recommended · status proposed (v1)*

i7 owners shall be able to charge at Tesla Superchargers, register the included charging offer without help, and plan trips around stations that are reported working.

**Why:** Public charging (33 rows) and charging the battery (20 rows) complaints describe broken stations, queues, failed registration for the free charging offer and no NACS adapter.
**Horizon:** Adapter, partner network and app.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | NACS access | Adapter supplied at delivery | Offer check | evidence |
| US | Charging offer activation without dealer help | >= 95 % of owners | App analytics | assumption |

**Findings:** `FND-G70-US-VOC-public_charging_external_providers` (primary); `FND-G70-US-VOC-charge_high_voltage_battery` (supporting)

## REQ-G70-US-SP-01 – Storage for phone, sunglasses and drinks

*space_practicality · H1 · markets US · evidence B · recommended · status proposed (v1)*

The cabin shall offer a phone place with the screen visible, a sunglasses holder, cup holders that hold different bottle sizes and more covered storage for the driver.

**Why:** Storage compartments (20 rows) and front console (15 rows) complaints match the study gaps in phone storage (4.78 vs 5.47) and cup holders (4.80 vs 5.42).
**Horizon:** Trim parts in the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Study phone storage (1-7) | >= 5.4 (today 4.78, peer 5.47) | Next US customer study wave | evidence |
| US | Study cup holders (1-7) | >= 5.4 (today 4.80, peer 5.42) | Next US customer study wave | evidence |

**Findings:** `FND-G70-US-VOC-storage_compartments` (primary); `FND-G70-US-MET-us_2025-phone_storage` (supporting); `FND-G70-US-MET-us_2025-cupholders` (supporting); `FND-G70-US-VOC-center_console_front` (supporting)

## REQ-G60-US-ID-04 – Factory CD player

*infotainment_digital · H1 · markets US · evidence C · not recommended · status proposed (v1)*

Offer a factory CD player.

**Why:** Seven explicit wishes, all from ICE owners; physical media is declining and the cabin has no package space for it. Kept visible so the PM can confirm the rejection.
**Horizon:** Would only be possible as an accessory.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Not applicable | Not recommended | PM confirmation | assumption |

**Findings:** `FND-G60-US-VOC-cd_dvd_changer_playback` (primary)
