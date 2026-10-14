# SAT-TWIN: Sattenapalli 400/220 kV Substation Digital Image

[![Utility: APTRANSCO](https://img.shields.io/badge/Utility-APTRANSCO-emerald)](https://aptransco.co.in)
[![Substation ID: 4012](https://img.shields.io/badge/Substation%20ID-4012-cyan)](https://aptransco.co.in)
[![Voltage: 400/220 kV](https://img.shields.io/badge/Voltage%20Class-400%2F220%2F33%20kV-amber)](https://aptransco.co.in)
[![Mode: Simulation & Monitoring](https://img.shields.io/badge/Operating%20Mode-Digital%20Image%20Simulation-blue)](https://aptransco.co.in)

> **SAT-TWIN** is a working, extensible **Digital Image** platform for the **400/220 kV Sattenapalli Substation** operated by the Transmission Corporation of Andhra Pradesh Limited (**APTRANSCO**), Public Substation Identifier **4012**.
>
> Designed for transmission operations and maintenance engineers, SAT-TWIN combines physics-based real-time telemetry simulation, an interactive vector Single-Line Diagram (SLD), a 3D WebGL switchyard with dynamic time-based lighting, condition-based asset monitoring (DGA & Duval Triangle), SCADA alarm lifecycle auditing, and IEC 61850 substation automation mapping.

---

## Table of Contents

1. [Project Mission & Scope](#project-mission--scope)
2. [Substation Baseline & Configuration](#substation-baseline--configuration)
3. [Key Modules & Architecture](#key-modules--architecture)
   - [Substation Overview Dashboard](#1-substation-overview-dashboard)
   - [Navigable 3D Switchyard Scene (Three.js)](#2-navigable-3d-switchyard-scene-threejs)
   - [Interactive Single-Line Diagram (SLD)](#3-interactive-single-line-diagram-sld)
   - [Asset Telemetry & Condition Inspector](#4-asset-telemetry--condition-inspector)
   - [Physics-Based Telemetry & Fault Injection Sandbox](#5-physics-based-telemetry--fault-injection-sandbox)
   - [Alarm Lifecycle & Operator Audit Log](#6-alarm-lifecycle--operator-audit-log)
   - [Configurable Asset Inventory & Bay Registry](#7-configurable-asset-inventory--bay-registry)
   - [IEC 61850 Utility Integration Workbench](#8-iec-61850-utility-integration-workbench)
   - [Provisional Site Verification Ledger](#9-provisional-site-verification-ledger)
   - [Mobile & Touch Interaction Architecture](#10-mobile--touch-interaction-architecture)
4. [Cybersecurity & Network Segmentation (IEC 62351)](#cybersecurity--network-segmentation-iec-62351)
5. [Getting Started & Local Development](#getting-started--local-development)
6. [Technology Stack](#technology-stack)
7. [Provisional Data & Site Audit Roadmap](#provisional-data--site-audit-roadmap)

---

## Project Mission & Scope

- **Utility:** APTRANSCO (Transmission Corporation of Andhra Pradesh Limited)
- **Substation Name:** Sattenapalli 400/220 kV Substation
- **Public Substation Identifier:** 4012
- **Location:** Sattenapalli, Guntur District, Andhra Pradesh, India
- **Operating Mode:** Read-Only Digital Image & Synthetic Physics Telemetry Simulation
- **Protection Safety Boundary:** The platform is strictly read-only and air-gapped from live protection tripping circuits and cannot issue switching commands or alter relay settings.

All site-specific equipment parameters, ratings, and bay allocations are maintained in editable configuration registries marked as **provisional** pending formal verification from APTRANSCO field engineering drawings.

---

## Substation Baseline & Configuration

| Asset Class | Provisional Quantity | Typical Voltage / Rating | Description |
| :--- | :--- | :--- | :--- |
| **Interconnecting Transformers** | 3 Units (`ICT-01`, `ICT-02`, `ICT-03`) | 315 MVA, 400/220/33 kV | 3-Phase Auto-transformers, YNa0d11, ONAN/ONAF cooling, 17-step OLTC |
| **Shunt Bus Reactor** | 1 Unit (`RE-401`) | 125 MVAR, 400 kV | Line capacitance & Ferranti effect overvoltage absorption |
| **400 kV Switchyard** | 7 Bays (`BAY-401` to `BAY-407`) | 400 kV (Moose / Quad conductor) | Double Bus scheme with Bus Coupler, ICT bays, VTPS-1 & Tallapalli-2 line feeders |
| **220 kV Switchyard** | 7 Bays (`BAY-201` to `BAY-207`) | 220 kV (Twin Zebra ACSR) | Double Bus scheme with Coupler, ICT secondary bays, Perecherla, Chilakaluripet, Nadikudi feeders |
| **SF6 Circuit Breakers** | 13 Units | 420 kV / 245 kV Live Tank | SF6 insulated, spring-spring mechanism, 50 kA / 40 kA interrupting duty |
| **Disconnectors & Earth Switches** | 20+ Units | 420 kV / 245 kV | Horizontal centre break / pantograph with electrical and mechanical interlocks |

---

## Key Modules & Architecture

### 1. Substation Overview Dashboard
- **Grid Telemetry:** Live monitoring of Indian Grid Frequency ($50.00\,\text{Hz}$ nominal band with stochastic governor oscillations), total active throughput ($\text{MW}$), reactive power ($\text{MVAR}$), and ambient yard temperature.
- **Bus Voltages:** Real-time $400\,\text{kV}$ Bus 1 & 2 voltages, $220\,\text{kV}$ Bus 1 & 2 voltages, and feeder load summaries.
- **Transformer Loading:** Apparent load gauge ($\%$, $\text{MVA}$), active/reactive power split, winding hot-spot temperature, top oil temperature, cooling stage, and OLTC tap positions.
- **Quality & Health:** Communication heartbeat indicators (`GOOD`, `STALE`, `COMM_FAIL`), active alarm count, and quick bay navigation.

### 2. Navigable 3D Switchyard Scene (Three.js)
- **High-Fidelity Switchyard Environment:** Realistic 3D rendering featuring lattice steel gantries, high-voltage bus conductors, crushed gravel switchyard ground, vehicle roads, concrete plinths, and blast walls between 315 MVA transformers.
- **3D Asset Geometries:**
  - 3 x 315 MVA Power Transformers with corrugated tanks, conservators, stepped porcelain bushings, and radiator banks with animated spinning fans.
  - 1 x 125 MVAR Shunt Bus Reactor.
  - 400 kV & 220 kV SF6 live-tank circuit breakers with dynamic open/close beacon indicators.
  - Control & Relay Building (CRB) with APTRANSCO signage.
- **Dynamic Time-Based Lighting & Override:**
  - **Auto Mode:** Automatically switches between day and night based on the substation's simulated Indian Standard Time (IST, UTC+5:30).
  - **Daytime (06:00 to 18:00 IST):** Bright daylight ambient light (`#ffffff`, 0.85 intensity), warm directional sunlight (`#fff8e7`, 1.25 intensity) angled at $[60, 80, 50]$, and daylight utility sky.
  - **Nighttime (18:00 to 06:00 IST):** Atmospheric dark ambient illumination (`#0b132b`, 0.16 intensity), cool moonlight (`#93c5fd`), dark sky, and **5 active switchyard floodlights** mounted on physical mast towers illuminating the 400 kV yard, 220 kV yard, transformers, CRB, and busbars.
  - **Manual Override Controls:** Top-right floating controls to force **Auto**, **Bright Day**, or **Night Mode**.
- **Interactive Raycasting & Camera Presets:** Hover tooltips and click-to-inspect on all 3D assets. Presets for *Overview Aerial*, *400 kV Yard*, *ICTs 1-3*, *220 kV Yard*, *Bus Reactor*, and *Control Room*.

### 3. Interactive Single-Line Diagram (SLD)
- Vector electrical schematic conforming to **IEC 60617 / IEEE** standards (dual-winding circles, breaker squares, disconnector blades, earth symbols, inductor coils).
- Color-coded voltage paths: $400\,\text{kV}$ (Orange/Red), $220\,\text{kV}$ (Cyan), De-energized/Tripped (Slate).
- Breaker states: Red = Closed (Energized), Green = Open (Isolated/Safe).
- Pan and zoom support with scale indicator and click-to-inspect asset linkage.

### 4. Asset Telemetry & Condition Inspector
- **Thermal Model (IEEE C57.91 / IEC 60076-7):** Distinguishes measured sensor inputs (RTD top-oil) from calculated dynamic thermal model outputs (winding hot-spot temperature with load ratio exponent).
- **Dissolved Gas Analysis (DGA):** Online tracking of $\text{H}_2, \text{CH}_4, \text{C}_2\text{H}_2, \text{C}_2\text{H}_4, \text{C}_2\text{H}_6, \text{CO}, \text{CO}_2$ ($\text{ppm}$), Total Combustible Gas (TCG), and Duval Triangle 1 fault zone classification.
- **Circuit Breaker Condition:** $\text{SF}_6$ gas pressure in bar (with $5.5\,\text{bar}$ warning and $5.2\,\text{bar}$ lockout thresholds), trip coil 1 & 2 supervision, spring mechanism status, cycle counter, and accumulated electrical duty ($\text{kA}^2\text{s}$).

### 5. Physics-Based Telemetry & Fault Injection Sandbox
Configurable operational scenarios to test digital image behavior:
1. **Nominal Grid Operation:** Balanced 65% load at $50.00\,\text{Hz}$.
2. **Guntur Summer Peak Ambient ($43^{\circ}\text{C}$):** Elevated oil and winding hot-spot temperatures.
3. **ICT-1 Peak Overload (110%):** Triggers Stage-2 ONAF fans and high-temperature alerts.
4. **400 kV Fault & CB-401 Trip:** Opens the HV breaker, clears load, and redistributes flow to ICT-2 and ICT-3.
5. **SF6 Gas Leakage on CB-404:** Decays gas pressure to trigger Stage-1 alarm ($< 5.5\,\text{bar}$).
6. **220 kV SAS Gateway Comm Loss:** Triggers stale telemetry (`STALE`) and gateway failure (`COMM_FAIL`) states.

### 6. Alarm Lifecycle & Operator Audit Log
- IEC/SCADA alarm state machine: **ACTIVE (Unacknowledged) $\rightarrow$ ACKNOWLEDGED $\rightarrow$ CLEARED**.
- Filter by severity (`CRITICAL`, `MAJOR`, `WARNING`, `MINOR`, `INFO`) and status.
- Immutable audit trail recording timestamps, responsible engineer identity, actions taken, and justification comments.

### 7. Configurable Asset Inventory & Bay Registry
- Hierarchical asset tree by voltage level and bay.
- Search and filter by identifier, name, or manufacturer.
- Inline rating plate editor and "Add Asset / Bay Point" workflow for dynamic configuration.

### 8. IEC 61850 Utility Integration Workbench
- **Point Mapping Table:** Standard IEC 61850-7-4 Logical Nodes mapped to digital image points:
  - `MMXU`: Total active power, reactive power, bus frequency, phase voltages.
  - `XCBR`: Circuit breaker double-point position (`stVal`), operation counter.
  - `XSWI`: Disconnector and earth switch position and interlocking status.
  - `YPTR`: Transformer winding hot-spot and top-oil temperatures.
  - `SIML`: SF6 gas insulation pressure sensor.
  - `YLTC`: Tap changer position indicator.
- **Protocol Profiles Documented:** IEC 61850-8-1 MMS (Station Bus), IEC 61850-8-1 GOOSE (Inter-bay / Protection), and IEC 61850-9-2 LE (Process Bus Sampled Values).
- **Substation Configuration Language (SCL):** Exportable `.scd` XML generator conforming to IEC 61850-6.

### 9. Provisional Site Verification Ledger
- Centralized verification matrix tracking preliminary assumptions (transformer nameplate data, busbar conductor sizes, feeder bay destinations, shunt reactor ratings) against required APTRANSCO engineering documents.

### 10. Mobile & Touch Interaction Architecture
- **Responsive Navigation:** Hamburger drawer on mobile viewports with min 48px touch targets, quick status indicators, and collapsible view switches.
- **3D Switchyard Touch Gestures:**
  - 1-Finger Drag: Orbit & tilt around switchyard.
  - 2-Finger Pinch: Smooth camera zoom in and out.
  - 2-Finger Drag: Pan switchyard coordinate space.
  - `touchAction: 'none'` on canvas preventing page scroll / pull-to-refresh conflicts.
  - Floating touch overlay drawer for camera presets and daylight/night lighting overrides.
  - GPU mobile throttle with `devicePixelRatio` clamp to 2 for sustained 60fps rendering.
- **Single-Line Diagram (SLD) Mobile Pinch & Pan:** SVG viewport with multi-touch gestures, scale reset, and generous 44px+ hit-test targets around circuit breakers, transformers, and busbars.
- **Bottom-Sheet Modal Inspections:** Asset Detail Inspector and Add Asset modals slide up as full-screen/bottom sheets with pull handles on mobile screens.
- **High-Density Table Touch Scrolling:** Horizontal touch-scroll containers (`-webkit-overflow-scrolling: touch`) across Alarm logs, Audit records, IEC 61850 point mapping, and Asset inventory tables.

---

## Cybersecurity & Network Segmentation (IEC 62351)

SAT-TWIN adheres to Central Electricity Authority (CEA) Cybersecurity Guidelines and APTRANSCO OT security mandates:

```
+-------------------------------------------------------------+
| ZONE 1: Protection & Control (Air-Gapped)                  |
| Numerical Relays (SEL / ABB / Siemens), Merging Units       |
| Direct hardwired trip circuits. Zero inbound IP routes.     |
+-------------------------------------------------------------+
                              | (Read-Only Mirror / SPAN)
                              v
+-------------------------------------------------------------+
| ZONE 2: Substation SAS Gateway & DMZ                        |
| MMS Station Bus (TCP Port 102, TLS 1.3, IEC 62351-4)        |
| Hardware Unidirectional Data Diode / Optical Tap             |
+-------------------------------------------------------------+
                              | (Outbound-Only Telemetry)
                              v
+-------------------------------------------------------------+
| ZONE 3: SAT-TWIN Digital Image Platform                     |
| Ingestion Service, Thermal Models, 3D WebGL, Operator GUI   |
| TLS 1.3, Role-Based Access Control (RBAC), Audit Logs       |
+-------------------------------------------------------------+
```

---

## Getting Started & Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will start on `http://localhost:3000`.

### Building for Production

```bash
# Build production bundle
npm run build

# Run TypeScript type check
npm run lint
```

---

## Technology Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS v4, Lucide React Icons
- **3D Graphics Engine:** Three.js (WebGL PCF Soft Shadows, ACES Filmic Tone Mapping)
- **Animation & Motion:** Motion (Framer Motion v12)
- **Data Protocols:** IEC 61850-8-1 (MMS & GOOSE), IEC 61850-9-2 LE, SCL XML
- **Standards Applied:** IEEE C57.91 (Transformer Thermal Loading), IEEE C57.104 (DGA Interpretation), IEC 60617 (Electrical Schematics), IEC 62351 (Power System Security)

---

## Provisional Data & Site Audit Roadmap

To transition this digital image from prototype to site-certified operational twin:
1. **Nameplate Audit:** Verify serial numbers, impedance test certificates, and exact cooling stages for ICT 1, 2, and 3 at Sattenapalli CRB.
2. **SLD Drawing Audit:** Reconcile double-bus single-breaker vs. one-and-a-half breaker layout against APTRANSCO drawing `#APTRANSCO/SAT/E-01`.
3. **Gateway SCD File:** Import the official Substation Configuration Description (`.scd`) file from the Sattenapalli station gateway for automated logical node binding.
4. **Data Diode Deployment:** Coordinate with APTRANSCO IT/OT division for hardware data diode installation on the station bus network.

---

*SAT-TWIN is developed as a utility engineering digital image platform for APTRANSCO Sattenapalli Substation 4012.*
