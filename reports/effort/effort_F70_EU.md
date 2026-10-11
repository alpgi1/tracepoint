# Effort estimate – F70 EU

Effort is a share of a new vehicle generation (new vehicle = 100), not money (rule 49). CPM model `789fcb7624b8` (`config/effort/model.yaml`), every weight and link is an assumption, not calibrated (rule 50). Ranges are P5–P95 of the sensitivity runs (rule 51). Decision: < 15 adapt, 15–50 major revision, ≥ 50 or a K3 platform change new generation (rule 47).

Back-test: 8/8 documented BMW decisions classified correctly (7/7 independent), 2000 sensitivity runs, scope `all`.

## Variations

Changes of all recommended, not rejected requirements combined per subsystem (rule 45): shared work is counted once, the certification add-on once per package.

| Scenario | Requirements | Effort % | P5–P95 | Decision | Stable % | Sum of single % | Main subsystems |
|---|---|---|---|---|---|---|---|
| Evolve the current model (H1 requirements in one life-cycle impulse) | 17 | 21.4 | 12.3–31.2 | major revision | 85 | 25.8 | Software/HMI 6.6 via Interior/console → E/E architecture → Software/HMI; Interior/console 3.9; Chassis 2.8 |
| Successor generation (H2 requirements) | 1 | 0.0 | 0.0–0.0 | no change | 100 | 0.0 | – |
| Everything on the current model (H1 + H2 in one impulse) | 18 | 21.4 | 12.3–31.2 | major revision | 85 | 25.8 | Software/HMI 6.6 via Interior/console → E/E architecture → Software/HMI; Interior/console 3.9; Chassis 2.8 |

## Requirements

| ID | Title | H | Effort % | P5–P95 | Size | Layer | Decision | Flags |
|---|---|---|---|---|---|---|---|---|
| REQ-F70-EU-ID-01 | Physical controls for climate and a rotary controller option | H1 | 4.2 | 2.1–6.4 | S | K2 | adapt | – |
| REQ-F70-EU-QN-01 | Quiet, solid-feeling cabin without rattles | H1 | 3.4 | 1.8–6.0 | S | K1 | adapt | – |
| REQ-F70-EU-PR-01 | Smooth dual-clutch gearbox and immediate response when pulling away | H1 | 3.3 | 1.6–6.3 | S | K1 | adapt | – |
| REQ-F70-EU-IC-02 | Dual-zone climate as standard and rear ventilation | H1 | 2.5 | 1.2–4.8 | S | K2 | adapt | – |
| REQ-F70-EU-IC-01 | Supportive, durable seats with lumbar adjustment | H1 | 2.1 | 1.0–3.7 | S | K1 | adapt | – |
| REQ-F70-EU-DD-01 | Comfortable ride on poor road surfaces | H1 | 2.1 | 1.0–3.5 | S | K1 | adapt | info |
| REQ-F70-EU-SP-01 | Practical boot with power tailgate and luggage fixtures | H1 | 1.7 | 0.8–3.2 | S | K1 | adapt | – |
| REQ-F70-EU-EX-02 | Quiet tyres and wheels that are easy to clean | H1 | 1.4 | 0.7–2.5 | S | K1 | adapt | – |
| REQ-F70-EU-IC-03 | Cockpit lighting without reflections in the mirrors and windscreen | H1 | 1.2 | 0.6–2.3 | S | K1 | adapt | – |
| REQ-F70-EU-EX-01 | Reliable exterior lights and helpful door mirrors | H1 | 1.1 | 0.5–2.0 | S | K1 | adapt | – |
| REQ-F70-EU-ID-02 | Stable infotainment and settings that survive updates | H1 | 1.0 | 0.5–1.7 | XS | K1 | adapt | – |
| REQ-F70-EU-ID-06 | Navigation route choice and clear guidance | H1 | 0.5 | 0.2–0.9 | XS | K1 | adapt | – |
| REQ-F70-EU-DA-01 | Assistance systems that help instead of irritating | H1 | 0.4 | 0.2–0.7 | XS | K1 | adapt | – |
| REQ-F70-EU-ID-05 | Music from USB sticks | H1 | 0.4 | 0.2–0.7 | XS | K1 | adapt | – |
| REQ-F70-EU-GE-01 | No silent de-contenting against the previous 1 Series | H1 | 0.2 | 0.1–0.4 | XS | K0 | adapt | – |
| REQ-F70-EU-ID-04 | Printed quick-start handbook and better in-car help | H1 | 0.2 | 0.1–0.4 | XS | K0 | adapt | – |
| REQ-F70-EU-DD-02 | Keep the sporty handling and the fuel economy in the next generation | H2 | 0.0 | – | - | preserve | no change | – |
| REQ-F70-EU-ID-03 | Functions bought with the car stay included for the first owner | H1 | 0.0 | – | - | no_vehicle_change | no change | – |

## Flags for the PM

* **info** REQ-F70-EU-DD-01 (rule 43): chassis: already standard on F70 (standard on 1, optional on 0 of 6 F70 variants); check whether only configuration (K0) is needed

## Why: affected subsystems (rule 52)

* REQ-F70-EU-ID-01: Interior/console 2.0; Software/HMI 1.7; E/E architecture 0.3; Seats 0.1. Changes: interior_console 25% K2; software_hmi 8% K2
* REQ-F70-EU-QN-01: Body/structure 1.1; Software/HMI 0.8 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.6; Chassis 0.4. Changes: interior_console 5% K1; body_structure 5% K1
* REQ-F70-EU-PR-01: Powertrain 0.8; Software/HMI 0.8 via Powertrain → E/E architecture → Software/HMI; Body/structure 0.5; E/E architecture 0.4. Changes: powertrain 5% K1
* REQ-F70-EU-IC-02: Software/HMI 1.1 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.8; E/E architecture 0.3; Thermal/HVAC 0.2. Changes: thermal_hvac 2% K0; interior_console 10% K2
* REQ-F70-EU-IC-01: Seats 1.2; Software/HMI 0.7 via Seats → E/E architecture → Software/HMI; E/E architecture 0.2; Thermal/HVAC 0.1. Changes: seats 20% K1
* REQ-F70-EU-DD-01: Chassis 1.7; Body/structure 0.2; Interior/console 0.1 via Chassis → Body/structure → Interior/console; Exterior design 0.0 via Chassis → Body/structure → Exterior design. Changes: chassis 15% K1
* REQ-F70-EU-SP-01: Software/HMI 0.7 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.4; E/E architecture 0.2; Exterior design 0.2. Changes: interior_console 5% K1; exterior_design 3% K1
* REQ-F70-EU-EX-02: Chassis 0.4; Exterior design 0.4; Software/HMI 0.3 via Exterior design → E/E architecture → Software/HMI; Body/structure 0.2. Changes: exterior_design 5% K1; chassis 3% K1
* REQ-F70-EU-IC-03: Software/HMI 0.5 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.4; E/E architecture 0.2; Seats 0.1. Changes: interior_console 5% K1
* REQ-F70-EU-EX-01: Software/HMI 0.5 via Exterior design → E/E architecture → Software/HMI; Exterior design 0.3; Chassis 0.1 via Exterior design → Body/structure → Chassis; E/E architecture 0.1. Changes: exterior_design 5% K1; software_hmi 2% K0
* REQ-F70-EU-ID-02: Software/HMI 0.9; E/E architecture 0.1. Changes: software_hmi 8% K1
* REQ-F70-EU-ID-06: Software/HMI 0.5; E/E architecture 0.0. Changes: software_hmi 4% K1
* REQ-F70-EU-DA-01: Software/HMI 0.3; E/E architecture 0.0. Changes: software_hmi 3% K1
* REQ-F70-EU-ID-05: Software/HMI 0.3; E/E architecture 0.0. Changes: software_hmi 3% K1
* REQ-F70-EU-GE-01: Interior/console 0.2. Changes: interior_console 3% K0
* REQ-F70-EU-ID-04: Software/HMI 0.2. Changes: software_hmi 2% K0
* REQ-F70-EU-DD-02: preserve – Protects today's handling and fuel economy for the successor; no change to estimate.
* REQ-F70-EU-ID-03: no vehicle change – Offer and licensing decision; no hardware or software change.
