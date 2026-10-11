# Effort estimate – G70 US

Effort is a share of a new vehicle generation (new vehicle = 100), not money (rule 49). CPM model `789fcb7624b8` (`config/effort/model.yaml`), every weight and link is an assumption, not calibrated (rule 50). Ranges are P5–P95 of the sensitivity runs (rule 51). Decision: < 15 adapt, 15–50 major revision, ≥ 50 or a K3 platform change new generation (rule 47).

Back-test: 8/8 documented BMW decisions classified correctly (7/7 independent), 2000 sensitivity runs, scope `all`.

## Variations

Changes of all recommended, not rejected requirements combined per subsystem (rule 45): shared work is counted once, the certification add-on once per package.

| Scenario | Requirements | Effort % | P5–P95 | Decision | Stable % | Sum of single % | Main subsystems |
|---|---|---|---|---|---|---|---|
| Evolve the current model (H1 requirements in one life-cycle impulse) | 16 | 14.4 | 8.1–22.2 | adapt | 55 | 18.1 | Software/HMI 6.1; Interior/console 2.3; E/E architecture 1.7 |
| Successor generation (H2 requirements) | 2 | 57.4 | 43.7–65.0 | new generation | 100 | 74.0 | Body/structure 10.7; HV battery 10.0; Software/HMI 5.6 via HV battery → E/E architecture → Software/HMI |
| Everything on the current model (H1 + H2 in one impulse) | 18 | 65.0 | 49.6–73.7 | new generation | 100 | 92.0 | Body/structure 11.0; HV battery 10.0; Software/HMI 8.3 via HV battery → E/E architecture → Software/HMI |

## Requirements

| ID | Title | H | Effort % | P5–P95 | Size | Layer | Decision | Flags |
|---|---|---|---|---|---|---|---|---|
| REQ-G70-US-PR-02 | Electric range that matches the flagship's long-distance role | H2 | 49.0 | 36.7–56.9 | L | K3 | new generation | – |
| REQ-G70-US-IC-03 | Robust glass roof with an opening option and blinds that work | H2 | 25.0 | 16.0–32.3 | L | K2 | major revision | – |
| REQ-G70-US-EX-02 | Calmer front design (split grille, smaller black areas) (not recommended) | H2 | 5.7 | 3.4–8.4 | M | K2 | adapt | info |
| REQ-G70-US-IC-02 | Climate system that cools a large cabin fast and lets passengers direct the air | H1 | 2.7 | 1.3–5.1 | S | K2 | adapt | – |
| REQ-G70-US-SP-01 | Storage for phone, sunglasses and drinks | H1 | 2.1 | 0.9–4.1 | S | K1 | adapt | – |
| REQ-G70-US-ID-01 | Intuitive controls for a flagship driver | H1 | 2.1 | 1.0–3.6 | S | K2 | adapt | – |
| REQ-G70-US-ID-03 | Rear theatre screen usable without blocking the driver's rear view | H1 | 2.1 | 1.0–3.8 | S | K2 | adapt | – |
| REQ-G70-US-PR-01 | Auto start-stop can be switched off permanently and restarts smoothly | H1 | 1.9 | 0.9–3.5 | S | K1 | adapt | – |
| REQ-G70-US-DD-02 | Confident braking, including under assisted driving | H1 | 1.7 | 0.9–2.9 | S | K1 | adapt | – |
| REQ-G70-US-ID-04 | Seamless smartphone integration and audio worthy of the flagship | H1 | 1.4 | 0.6–2.5 | S | K1 | adapt | – |
| REQ-G70-US-EX-01 | Headlights that light the road like a flagship | H1 | 0.9 | 0.5–1.7 | XS | K1 | adapt | – |
| REQ-G70-US-IC-01 | Automatic doors that never open unintentionally while driving | H1 | 0.8 | 0.4–1.6 | XS | K1 | adapt | – |
| REQ-G70-US-PR-03 | Easy and reliable public charging, including the Supercharger network | H1 | 0.7 | 0.4–1.2 | XS | K2 | adapt | – |
| REQ-G70-US-ID-05 | Navigation and voice assistant that get it right the first time | H1 | 0.6 | 0.3–1.1 | XS | K1 | adapt | – |
| REQ-G70-US-DD-01 | Fully customisable personal drive mode | H1 | 0.3 | 0.1–0.6 | XS | K1 | adapt | – |
| REQ-G70-US-ID-02 | In-car connectivity that stays connected | H1 | 0.3 | 0.1–0.6 | XS | K1 | adapt | – |
| REQ-G70-US-DA-01 | Assistance and camera package as standard on the flagship | H1 | 0.2 | 0.1–0.4 | XS | K0 | adapt | – |
| REQ-G70-US-GE-01 | Personal onboarding for flagship owners | H1 | 0.2 | 0.1–0.4 | XS | K0 | adapt | – |
| REQ-G70-US-QN-01 | Fault-free first months of ownership | H1 | 0.0 | – | - | no_vehicle_change | no change | – |

## Flags for the PM

* **info** REQ-G70-US-EX-02 (rule 48): H2 but the estimate fits a life-cycle impulse; could be pulled forward to H1

## Why: affected subsystems (rule 52)

* REQ-G70-US-PR-02: HV battery 10.0; Body/structure 7.6; Software/HMI 4.5 via HV battery → E/E architecture → Software/HMI; E/E architecture 4.2, certification add-on. Changes: hv_battery 100% K3
* REQ-G70-US-IC-03: Body/structure 5.4; Chassis 2.0; Software/HMI 2.0 via Body/structure → Interior/console → E/E architecture → Software/HMI; Interior/console 1.4, certification add-on. Changes: body_structure 30% K2; exterior_design 5% K1; interior_console 5% K1
* REQ-G70-US-EX-02: Exterior design 3.0; Software/HMI 1.3 via Exterior design → E/E architecture → Software/HMI; Chassis 0.4 via Exterior design → Body/structure → Chassis; E/E architecture 0.4. Changes: exterior_design 50% K2
* REQ-G70-US-IC-02: Software/HMI 1.1 via Thermal/HVAC → E/E architecture → Software/HMI; Thermal/HVAC 0.8; E/E architecture 0.4; Interior/console 0.3. Changes: thermal_hvac 12% K2; interior_console 5% K1; software_hmi 2% K1
* REQ-G70-US-SP-01: Software/HMI 0.9 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.7; E/E architecture 0.3; Seats 0.1. Changes: interior_console 10% K1
* REQ-G70-US-ID-01: Software/HMI 1.4; Interior/console 0.3; E/E architecture 0.2; Seats 0.1. Changes: software_hmi 10% K2; interior_console 5% K1
* REQ-G70-US-ID-03: Software/HMI 1.1 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.6; E/E architecture 0.3; Seats 0.1. Changes: interior_console 8% K2; software_hmi 4% K1
* REQ-G70-US-PR-01: Software/HMI 0.6 via Powertrain → E/E architecture → Software/HMI; Powertrain 0.4; Body/structure 0.3; E/E architecture 0.2. Changes: software_hmi 2% K0; powertrain 3% K1
* REQ-G70-US-DD-02: Chassis 0.8; Software/HMI 0.4; Body/structure 0.3; Interior/console 0.1 via Chassis → Body/structure → Interior/console. Changes: chassis 8% K1; software_hmi 4% K1
* REQ-G70-US-ID-04: Software/HMI 0.7 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.3; E/E architecture 0.2; Seats 0.1. Changes: software_hmi 3% K1; interior_console 5% K1
* REQ-G70-US-EX-01: Software/HMI 0.4 via Exterior design → E/E architecture → Software/HMI; Exterior design 0.3; Chassis 0.1 via Exterior design → Body/structure → Chassis; E/E architecture 0.1. Changes: software_hmi 2% K0; exterior_design 5% K1
* REQ-G70-US-IC-01: Software/HMI 0.5 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.2; E/E architecture 0.1; Seats 0.0. Changes: software_hmi 2% K1; interior_console 3% K1
* REQ-G70-US-PR-03: Charging 0.4; Software/HMI 0.3; E/E architecture 0.0. Changes: charging 10% K2; software_hmi 3% K1
* REQ-G70-US-ID-05: Software/HMI 0.6; E/E architecture 0.0. Changes: software_hmi 6% K1
* REQ-G70-US-DD-01: Software/HMI 0.3; E/E architecture 0.0. Changes: software_hmi 3% K1
* REQ-G70-US-ID-02: Software/HMI 0.3; E/E architecture 0.0. Changes: software_hmi 3% K1
* REQ-G70-US-DA-01: Software/HMI 0.2. Changes: software_hmi 2% K0
* REQ-G70-US-GE-01: Software/HMI 0.2. Changes: software_hmi 2% K0
* REQ-G70-US-QN-01: no vehicle change – Launch quality in production and pre-delivery inspection; process, not a development change.
