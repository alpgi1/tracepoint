# Requirement list, G60 US

20 requirements. Priority scores follow in Phase 5.

## REQ-G60-US-IC-01 – Front and rear seats comfortable for long drives across body sizes

*interior_comfort · H1 · markets US · evidence A · recommended · status proposed (v1)*

The front seats shall allow a pain-free two-hour drive for drivers from 1.60 m to 1.90 m, including a lumbar support that can be set completely flat, and the rear seat cushion and backrest shall match the comfort of the front seats.

**Why:** Seats are the largest complaint theme of the interior (62 complaint rows, 2.4 % of all US complaints, level A) and both study attributes sit below the peer: front seat comfort 5.74 vs 6.04, rear seat comfort 5.27 vs 6.24. Customer comments name back pain, firmness and a lumbar support that cannot be flattened.
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
**Effort:** 4.58 % of a new vehicle generation (adapt, P5 to P95 2.02 to 7.15, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 2.58 % of a new vehicle generation (adapt, P5 to P95 1.25 to 4.75, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 3.52 % of a new vehicle generation (adapt, P5 to P95 1.63 to 6.48, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 3.05 % of a new vehicle generation (adapt, P5 to P95 1.47 to 5.48, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 1.45 % of a new vehicle generation (adapt, P5 to P95 0.69 to 2.67, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 2.08 % of a new vehicle generation (adapt, P5 to P95 0.94 to 4.07, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.44 % of a new vehicle generation (adapt, P5 to P95 0.21 to 0.79, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.2 % of a new vehicle generation (adapt, P5 to P95 0.08 to 0.36, layer K0), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.32 % of a new vehicle generation (adapt, P5 to P95 0.14 to 0.56, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 1.02 % of a new vehicle generation (adapt, P5 to P95 0.51 to 1.72, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.2 % of a new vehicle generation (adapt, P5 to P95 0.08 to 0.36, layer K0), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.42 % of a new vehicle generation (adapt, P5 to P95 0.18 to 0.75, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 1.88 % of a new vehicle generation (adapt, P5 to P95 0.91 to 3.55, layer K1), effort model 789fcb7624b8, assumptions not calibrated

## REQ-G60-US-PR-02 – Reliable range prediction and cold-weather range guidance for BEV and PHEV

*powertrain_range_charging · H1 · markets US · evidence B · recommended · status proposed (v1)*

The displayed remaining range shall stay within an agreed tolerance of the real range in cold weather, and the car shall explain the expected winter range and the effect of pre-conditioning before a trip.

**Why:** Electric range is the second-largest powertrain complaint (67 rows, 2.6 %, 83 of them BEV); customer comments report estimates that are "off" and range that collapses in winter.
**Horizon:** Range estimation and guidance are software.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Deviation of displayed vs actual range at 0 °C | <= 10 % | Fleet data analysis | assumption |
| US | Winter range guidance in navigation | Shown before departure when the trip exceeds 70 % of predicted range | Function test | assumption |

**Findings:** `FND-G60-US-VOC-electric_range` (primary); `FND-G60-US-VOC-high_voltage_battery` (supporting)
**Effort:** 0.42 % of a new vehicle generation (adapt, P5 to P95 0.18 to 0.75, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Assumptions:** Customer wishes of 350 to 400 miles in the customer comments represent the US BEV buyer.
**Effort:** 48.98 % of a new vehicle generation (new generation, P5 to P95 36.73 to 56.87, layer K3), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.92 % of a new vehicle generation (adapt, P5 to P95 0.44 to 1.54, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.2 % of a new vehicle generation (adapt, P5 to P95 0.08 to 0.37, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.61 % of a new vehicle generation (adapt, P5 to P95 0.29 to 1.17, layer K1), effort model 789fcb7624b8, assumptions not calibrated

## REQ-G60-US-ID-04 – Factory CD player

*infotainment_digital · H1 · markets US · evidence C · not recommended · status proposed (v1)*

Offer a factory CD player.

**Why:** Seven explicit wishes, all from ICE owners; physical media is declining and the cabin has no package space for it. Kept visible so the PM can confirm the rejection.
**Horizon:** Would only be possible as an accessory.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| US | Not applicable | Not recommended | PM confirmation | assumption |

**Findings:** `FND-G60-US-VOC-cd_dvd_changer_playback` (primary)
**Effort:** 2.08 % of a new vehicle generation (adapt, P5 to P95 0.94 to 4.07, layer K2), effort model 789fcb7624b8, assumptions not calibrated
