# Requirement list, G70 US

19 requirements. Priority scores follow in Phase 5.

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
**Effort:** 0.2 % of a new vehicle generation (adapt, P5 to P95 0.08 to 0.36, layer K0), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.32 % of a new vehicle generation (adapt, P5 to P95 0.14 to 0.56, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.95 % of a new vehicle generation (adapt, P5 to P95 0.47 to 1.73, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.2 % of a new vehicle generation (adapt, P5 to P95 0.08 to 0.36, layer K0), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 2.73 % of a new vehicle generation (adapt, P5 to P95 1.31 to 5.07, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 2.06 % of a new vehicle generation (adapt, P5 to P95 0.99 to 3.64, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.32 % of a new vehicle generation (adapt, P5 to P95 0.14 to 0.56, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 1.35 % of a new vehicle generation (adapt, P5 to P95 0.64 to 2.51, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.64 % of a new vehicle generation (adapt, P5 to P95 0.28 to 1.12, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 48.98 % of a new vehicle generation (new generation, P5 to P95 36.73 to 56.87, layer K3), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 1.72 % of a new vehicle generation (adapt, P5 to P95 0.87 to 2.86, layer K1), effort model 789fcb7624b8, assumptions not calibrated

## REQ-G70-US-EX-02 – Calmer front design (split grille, smaller black areas)

*exterior_design · H2 · markets US · evidence B · not recommended · status proposed (v1)*

Redesign the front with a less dominant grille and less black surface.

**Why:** The grille draws 10 complaint rows and 18 design wishes, but exterior design is the strongest praise theme of the car (210 likes). The criticism is real but polarising; a redesign risks the main reason buyers chose the car. Kept visible for the PM's decision.
**Horizon:** Front-end design change belongs to the successor or the next life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Not applicable | Not recommended | PM confirmation | assumption |

**Findings:** `FND-G70-US-VOC-radiator_grille` (primary); `FND-G70-US-VOC-exterior_design` (supporting); `FND-G70-US-VOC-STRENGTH-exterior_design` (context)
**Effort:** 5.74 % of a new vehicle generation (adapt, P5 to P95 3.38 to 8.42, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.84 % of a new vehicle generation (adapt, P5 to P95 0.39 to 1.56, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 24.97 % of a new vehicle generation (major revision, P5 to P95 15.98 to 32.27, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 2.06 % of a new vehicle generation (adapt, P5 to P95 0.97 to 3.84, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 1.88 % of a new vehicle generation (adapt, P5 to P95 0.91 to 3.55, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.72 % of a new vehicle generation (adapt, P5 to P95 0.36 to 1.19, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 2.08 % of a new vehicle generation (adapt, P5 to P95 0.94 to 4.07, layer K1), effort model 789fcb7624b8, assumptions not calibrated
