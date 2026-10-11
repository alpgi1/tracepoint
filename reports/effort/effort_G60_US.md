# Effort estimate – G60 US

Effort is a share of a new vehicle generation (new vehicle = 100), not money (rule 49). CPM model `789fcb7624b8` (`config/effort/model.yaml`), every weight and link is an assumption, not calibrated (rule 50). Ranges are P5–P95 of the sensitivity runs (rule 51). Decision: < 15 adapt, 15–50 major revision, ≥ 50 or a K3 platform change new generation (rule 47).

Back-test: 8/8 documented BMW decisions classified correctly (7/7 independent), 2000 sensitivity runs, scope `all`.

## Variations

Changes of all recommended, not rejected requirements combined per subsystem (rule 45): shared work is counted once, the certification add-on once per package.

| Scenario | Requirements | Effort % | P5–P95 | Decision | Stable % | Sum of single % | Main subsystems |
|---|---|---|---|---|---|---|---|
| Evolve the current model (H1 requirements in one life-cycle impulse) | 17 | 18.4 | 10.4–26.8 | major revision | 73 | 23.9 | Software/HMI 7.0 via Seats → E/E architecture → Software/HMI; Interior/console 2.7; E/E architecture 2.5 |
| Successor generation (H2 requirements) | 2 | 49.0 | 36.7–56.9 | new generation | 100 | 49.0 | HV battery 10.0; Body/structure 7.6; Software/HMI 4.5 via HV battery → E/E architecture → Software/HMI |
| Everything on the current model (H1 + H2 in one impulse) | 19 | 60.9 | 46.5–70.5 | new generation | 100 | 72.9 | HV battery 10.0; Software/HMI 8.3 via HV battery → E/E architecture → Software/HMI; Body/structure 7.9 |

## Requirements

| ID | Title | H | Effort % | P5–P95 | Size | Layer | Decision | Flags |
|---|---|---|---|---|---|---|---|---|
| REQ-G60-US-PR-03 | More real-world electric range in the successor generation | H2 | 49.0 | 36.7–56.9 | L | K3 | new generation | – |
| REQ-G60-US-IC-01 | Front and rear seats comfortable for long drives across body sizes | H1 | 4.6 | 2.0–7.2 | S | K1 | adapt | – |
| REQ-G60-US-IC-03 | Interior materials that match the price class | H1 | 3.5 | 1.6–6.5 | S | K1 | adapt | – |
| REQ-G60-US-ID-01 | Frequently used functions reachable with one touch or a physical control | H1 | 3.0 | 1.5–5.5 | S | K2 | adapt | – |
| REQ-G60-US-IC-02 | Climate control direct, strong enough for US heat, and remembers its settings | H1 | 2.6 | 1.2–4.8 | S | K2 | adapt | – |
| REQ-G60-US-ID-04 | Factory CD player (not recommended) | H1 | 2.1 | 0.9–4.1 | S | K2 | adapt | – |
| REQ-G60-US-SP-02 | Practical storage for everyday items | H1 | 2.1 | 0.9–4.1 | S | K1 | adapt | – |
| REQ-G60-US-PR-01 | Auto start-stop can be switched off permanently by the driver | H1 | 1.9 | 0.9–3.5 | S | K1 | adapt | – |
| REQ-G60-US-ID-02 | Phone integration that just works | H1 | 1.4 | 0.7–2.7 | S | K1 | adapt | – |
| REQ-G60-US-DD-02 | Progressive brake pedal feel and predictable recuperation | H1 | 1.0 | 0.5–1.7 | S | K1 | adapt | – |
| REQ-G60-US-PR-04 | Dependable public fast charging on US trips | H1 | 0.9 | 0.4–1.5 | XS | K2 | adapt | – |
| REQ-G60-US-SP-01 | Hands-free tailgate opens on the first kick and closes from inside | H1 | 0.6 | 0.3–1.2 | XS | K1 | adapt | – |
| REQ-G60-US-SP-03 | Keyless access on all four doors and easy door handling | H1 | 0.4 | 0.2–0.8 | XS | K1 | adapt | – |
| REQ-G60-US-ID-03 | Driver profiles and settings survive updates and shared use | H1 | 0.4 | 0.2–0.8 | XS | K1 | adapt | – |
| REQ-G60-US-PR-02 | Reliable range prediction and cold-weather range guidance for BEV and PHEV | H1 | 0.4 | 0.2–0.8 | XS | K1 | adapt | – |
| REQ-G60-US-DD-01 | Personal drive mode that is really personal | H1 | 0.3 | 0.1–0.6 | XS | K1 | adapt | – |
| REQ-G60-US-DA-01 | Adaptive cruise control as standard and simple assistance controls | H1 | 0.2 | 0.1–0.4 | XS | K0 | adapt | – |
| REQ-G60-US-GE-01 | Guided onboarding for a feature-rich car | H1 | 0.2 | 0.1–0.4 | XS | K0 | adapt | – |
| REQ-G60-US-PR-05 | Charging flap opens reliably in every condition | H1 | 0.2 | 0.1–0.4 | XS | K1 | adapt | – |
| REQ-G60-US-DD-03 | Keep the handling and ride character in the next generation | H2 | 0.0 | – | - | preserve | no change | – |

## Why: affected subsystems (rule 52)

* REQ-G60-US-PR-03: HV battery 10.0; Body/structure 7.6; Software/HMI 4.5 via HV battery → E/E architecture → Software/HMI; E/E architecture 4.2, certification add-on. Changes: hv_battery 100% K3
* REQ-G60-US-IC-01: Software/HMI 2.2 via Seats → E/E architecture → Software/HMI; Seats 1.2; E/E architecture 0.8; Thermal/HVAC 0.4. Changes: seats 25% K1
* REQ-G60-US-IC-03: Software/HMI 1.4 via Interior/console → E/E architecture → Software/HMI; Interior/console 1.1; E/E architecture 0.5; Seats 0.4. Changes: interior_console 15% K1; seats 5% K1
* REQ-G60-US-ID-01: Software/HMI 1.8; Interior/console 0.7; E/E architecture 0.3; Seats 0.1. Changes: software_hmi 10% K2; interior_console 10% K2
* REQ-G60-US-IC-02: Software/HMI 1.1 via Interior/console → E/E architecture → Software/HMI; Thermal/HVAC 0.6; E/E architecture 0.4; Interior/console 0.3. Changes: thermal_hvac 10% K2; interior_console 5% K1; software_hmi 3% K1
* REQ-G60-US-ID-04: Software/HMI 0.9 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.7; E/E architecture 0.3; Seats 0.1. Changes: interior_console 10% K2
* REQ-G60-US-SP-02: Software/HMI 0.9 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.7; E/E architecture 0.3; Seats 0.1. Changes: interior_console 10% K1
* REQ-G60-US-PR-01: Software/HMI 0.6 via Powertrain → E/E architecture → Software/HMI; Powertrain 0.4; Body/structure 0.3; E/E architecture 0.2. Changes: software_hmi 2% K0; powertrain 3% K1
* REQ-G60-US-ID-02: Software/HMI 0.8 via Interior/console → E/E architecture → Software/HMI; Interior/console 0.3; E/E architecture 0.2; Seats 0.1. Changes: software_hmi 4% K1; interior_console 5% K1
* REQ-G60-US-DD-02: Chassis 0.5; Software/HMI 0.2; Body/structure 0.2; Interior/console 0.1 via Chassis → Body/structure → Interior/console. Changes: chassis 5% K1; software_hmi 2% K1
* REQ-G60-US-PR-04: Charging 0.6; Software/HMI 0.3; E/E architecture 0.0. Changes: charging 15% K2; software_hmi 3% K1
* REQ-G60-US-SP-01: Exterior design 0.2; Software/HMI 0.2 via Exterior design → E/E architecture → Software/HMI; Body/structure 0.1; Chassis 0.1 via Exterior design → Body/structure → Chassis. Changes: exterior_design 4% K1
* REQ-G60-US-SP-03: Exterior design 0.3; Software/HMI 0.1 via Exterior design → E/E architecture → Software/HMI; Body/structure 0.0; Chassis 0.0 via Exterior design → Body/structure → Chassis. Changes: exterior_design 5% K1
* REQ-G60-US-ID-03: Software/HMI 0.4; E/E architecture 0.0. Changes: software_hmi 4% K1
* REQ-G60-US-PR-02: Software/HMI 0.4; E/E architecture 0.0. Changes: software_hmi 4% K1
* REQ-G60-US-DD-01: Software/HMI 0.3; E/E architecture 0.0. Changes: software_hmi 3% K1
* REQ-G60-US-DA-01: Software/HMI 0.2. Changes: software_hmi 2% K0
* REQ-G60-US-GE-01: Software/HMI 0.2. Changes: software_hmi 2% K0
* REQ-G60-US-PR-05: Charging 0.2. Changes: charging 5% K1
* REQ-G60-US-DD-03: preserve – Protects today's handling for the successor; no change to estimate.
