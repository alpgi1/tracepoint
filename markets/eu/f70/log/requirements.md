# Requirement list, F70 EU

18 requirements. Priority scores follow in Phase 5.

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
**Effort:** 0.37 % of a new vehicle generation (adapt, P5 to P95 0.17 to 0.65, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 2.07 % of a new vehicle generation (adapt, P5 to P95 0.97 to 3.51, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 1.11 % of a new vehicle generation (adapt, P5 to P95 0.54 to 1.97, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 1.44 % of a new vehicle generation (adapt, P5 to P95 0.73 to 2.52, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.24 % of a new vehicle generation (adapt, P5 to P95 0.11 to 0.42, layer K0), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 2.13 % of a new vehicle generation (adapt, P5 to P95 1.0 to 3.69, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 2.55 % of a new vehicle generation (adapt, P5 to P95 1.24 to 4.77, layer K2), effort model 789fcb7624b8, assumptions not calibrated

## REQ-F70-EU-IC-03 – Cockpit lighting without reflections in the mirrors and windscreen

*interior_comfort · H1 · markets EU · evidence B · recommended · status proposed (v1)*

Ambient and display lighting shall not reflect in the side mirrors, side windows or windscreen at night at any brightness setting.

**Why:** Instrument panel complaints (33 rows, 11 defects) include repeated reports that dash and ambient lights reflect in the door mirrors and windscreen at night, which owners call a safety issue.
**Horizon:** Light guide and default brightness changes.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Visible reflection of interior lighting in the side mirrors at night | None at default brightness | Night visibility test | assumption |

**Findings:** `FND-F70-EU-VOC-instrument_panel` (primary)
**Effort:** 1.22 % of a new vehicle generation (adapt, P5 to P95 0.58 to 2.33, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 4.17 % of a new vehicle generation (adapt, P5 to P95 2.13 to 6.41, layer K2), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.99 % of a new vehicle generation (adapt, P5 to P95 0.45 to 1.72, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.23 % of a new vehicle generation (adapt, P5 to P95 0.1 to 0.41, layer K0), effort model 789fcb7624b8, assumptions not calibrated

## REQ-F70-EU-ID-05 – Music from USB sticks

*infotainment_digital · H1 · markets EU · evidence B · recommended · status proposed (v1)*

The USB-C ports shall play audio files from a USB stick, without requiring a smartphone.

**Why:** 30 complaint rows, 17 wishes: owners copied their CDs to USB sticks and lost playback with the new generation; several say USB only charges.
**Horizon:** Software (media player and USB data path), possibly a hub change in the life-cycle impulse.

| Market | Metric | Target | Method | Basis |
|---|---|---|---|---|
| EU | Playback of MP3 and AAC from a FAT32 or exFAT USB stick | Yes | Function test | evidence |

**Findings:** `FND-F70-EU-VOC-usb_port` (primary)
**Effort:** 0.37 % of a new vehicle generation (adapt, P5 to P95 0.17 to 0.65, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 0.49 % of a new vehicle generation (adapt, P5 to P95 0.22 to 0.86, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 3.27 % of a new vehicle generation (adapt, P5 to P95 1.63 to 6.31, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 3.42 % of a new vehicle generation (adapt, P5 to P95 1.75 to 6.0, layer K1), effort model 789fcb7624b8, assumptions not calibrated

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
**Effort:** 1.74 % of a new vehicle generation (adapt, P5 to P95 0.85 to 3.23, layer K1), effort model 789fcb7624b8, assumptions not calibrated
