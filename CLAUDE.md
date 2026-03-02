# CLAUDE.md

This file provides guidance for AI assistants supporting **LG CNS Chem/Battery Business Division** — covering IT, DX, and RX service development for process industry and battery enterprise clients.

---

## Division Overview

**LG CNS Chem/Battery Business Division** delivers enterprise IT and digital transformation services to companies operating in asset-intensive, regulated, and data-rich process industries. The division's value proposition centers on deep industry knowledge combined with LG CNS's full-stack technology capabilities.

### Service Categories

| Category | Description |
|----------|-------------|
| **IT** | Core enterprise systems — ERP, MES, SCM, infrastructure, systems integration |
| **DX** | Digital Transformation — AI/ML, IoT, cloud migration, smart factory, data platform |
| **RX** | Regulatory & Operational Excellence — compliance automation, quality systems, audit-readiness |

---

## Target Industries

### 1. Oil & Gas
**Key Segments:** Upstream (E&P), Midstream (pipelines, LNG), Downstream (refinery, distribution)

**Business Pain Points:**
- Unplanned asset downtime and high maintenance cost
- HSE (Health, Safety & Environment) incident risk and regulatory reporting burden
- Volatile commodity prices driving need for operational cost reduction
- Aging OT/IT infrastructure with siloed SCADA and historian data

**High-Value DX Opportunities:**
- Predictive maintenance using sensor/IoT data and ML models
- Digital twin of refinery or pipeline assets
- Integrated operations center (IOC) consolidating real-time data
- AI-assisted HSE incident prediction and near-miss analysis
- Smart energy management and carbon emission tracking (ESG)

**Key Systems:** SAP PM/MM/EAM, OSIsoft PI (AVEVA), Aspen PIMS, Meridium APM, ArcGIS

---

### 2. Petrochemical
**Key Segments:** Cracker, polymer, specialty chemical, fertilizer

**Business Pain Points:**
- Process variability affecting yield and product quality
- High energy consumption and carbon reduction mandates
- Complex supply chain from feedstock to downstream distribution
- EHS compliance across multiple plant sites

**High-Value DX Opportunities:**
- Advanced Process Control (APC) and real-time optimization
- AI-driven quality prediction (first-pass yield, OOSpec detection)
- Energy optimization and steam/utilities balancing
- Integrated planning & scheduling (feedstock → production → logistics)
- Lab information management (LIMS) modernization

**Key Systems:** SAP S/4HANA, Aspen Plus/HYSYS, DeltaV/PCS7 DCS, LIMS, MES (Werum, SIMATIC IT)

---

### 3. Pharmaceutical & Bio
**Key Segments:** Branded pharma, generics, CDMO, biologics/biosimilar, cell & gene therapy

**Business Pain Points:**
- GxP (GMP, GLP, GCP) compliance and data integrity requirements
- FDA/EMA/MFDS audit readiness and 21 CFR Part 11 / Annex 11 obligations
- Batch record complexity and paper-based processes
- Speed-to-market pressure in clinical development and tech transfer

**High-Value DX/RX Opportunities:**
- Electronic Batch Record (EBR) and paperless manufacturing
- MES implementation (Werum PAS-X, Rockwell PharmaSuite)
- Serialization and track-and-trace (DSCSA, EUDAMED compliance)
- Clinical trial data management and EDC integration
- AI-assisted deviation management and CAPA automation
- Regulatory submission data lifecycle management

**Regulatory Frameworks to Know:** GMP, GDP, GCP, GLP, 21 CFR Part 11, EU Annex 11, ICH Q10, GAMP 5, DSCSA, EUDAMED

**Key Systems:** SAP S/4HANA / SAP QM, Veeva Vault, MES (Werum, Rockwell), LIMS (LabWare, LabVantage), TrackWise

---

### 4. Materials
**Key Segments:** Specialty chemicals, advanced materials, semiconductor materials, display materials, composites

**Business Pain Points:**
- Long R&D cycles from material discovery to commercialization
- Formula / recipe management and IP protection
- Multi-site quality consistency for high-precision specifications
- Traceability of raw material lot to finished product

**High-Value DX Opportunities:**
- AI-accelerated materials informatics (structure-property prediction)
- Digital R&D lab (ELN — Electronic Lab Notebook, integrated with LIMS)
- Formula lifecycle management (PLM for process industry)
- Supplier quality management and incoming material traceability

**Key Systems:** SAP PLM/QM, Dotmatics, Benchling (ELN), LIMS, Materials Project integrations

---

### 5. CPG (Consumer Packaged Goods)
**Key Segments:** Home & personal care, food & beverage, cosmetics, household chemicals

**Business Pain Points:**
- Demand volatility and short shelf-life inventory risk
- SKU proliferation and product lifecycle complexity
- Retailer compliance (EDI, VMI, on-shelf availability)
- Sustainability and clean-label ingredient traceability

**High-Value DX Opportunities:**
- AI demand forecasting and S&OP automation
- Supply chain control tower (end-to-end visibility)
- Trade promotion management (TPM) optimization
- Product lifecycle management (PLM) — formulation to launch
- Consumer sustainability tracking (Scope 3 emissions, packaging)

**Key Systems:** SAP IBP/APO, SAP S/4HANA, Blue Yonder, o9 Solutions, Anaplan, Salesforce

---

### 6. Battery
**Key Segments:** EV battery cell manufacturers, pack assembly, ESS, battery materials (cathode, anode, electrolyte, separator)

**Business Pain Points:**
- Yield loss in electrode/cell/formation processes
- Traceability requirements across cell genealogy (raw material → cell → pack → vehicle)
- Ramp-up speed for new cell chemistry or form factor
- Safety — thermal runaway risk, early detection in field
- CBAM / ESG — battery passport regulations (EU Battery Regulation 2023)

**High-Value DX Opportunities:**
- Battery MES — cell genealogy, formation data management, grading automation
- AI-driven defect detection (electrode coating, tab welding, X-ray inspection)
- Digital twin for formation/aging process optimization
- Battery data platform — integrating formation, cycle test, and field BMS data
- Battery passport — EU regulatory compliance (carbon footprint, material traceability)
- Predictive SOH (State of Health) model for warranty and second-life use cases

**Key Standards & Regulations:** EU Battery Regulation (2023/1542), IATF 16949, IATF traceability, IEC 62619, UN 38.3

**Key Systems:** Battery-specific MES (custom or SAP ME), SAP S/4HANA, OSIsoft PI, data lake / lakehouse, BMS integration APIs

---

## Business Development Guidance for AI Assistants

### When Drafting Proposals or Responses

1. **Lead with industry pain, not technology** — Frame solutions around the client's operational challenge first, then introduce the technology fit.
2. **Quantify value** — Reference benchmark figures where possible (e.g., "predictive maintenance typically reduces unplanned downtime by 20–30%").
3. **Acknowledge regulatory context** — For pharma/bio and battery, compliance is non-negotiable; always address it explicitly.
4. **Reference LG Group synergies** — LG CNS has natural credibility with LG Chem, LG Energy Solution, LG H&H. Mention relevant LG Group reference cases where applicable.
5. **Use industry-standard terminology** — Avoid generic tech buzzwords; use terms like APC, EBR, cell genealogy, formation, GMP, LIMS that resonate with domain experts.

### Proposal Structure (Standard)
```
1. Executive Summary — client pain and proposed value (1 page)
2. Industry & Client Context — show domain understanding
3. Proposed Solution Architecture — IT/DX/RX scope
4. Implementation Roadmap — phased approach with milestones
5. Expected Benefits & KPIs — quantified where possible
6. LG CNS Credentials — relevant references and team
7. Investment & Timeline
```

### Common DX Solution Patterns

| Pattern | Industries | Core Stack |
|---------|-----------|------------|
| Smart Factory / MES | Battery, Pharma, Petrochem | MES + IoT + SAP S/4HANA |
| Predictive Maintenance | O&G, Petrochem, Material | IoT + ML + APM + PI |
| Digital Twin | O&G, Battery, Petrochem | Simulation + IoT + 3D visualization |
| AI Quality Control | Battery, Pharma, CPG | Vision AI + MES + LIMS |
| Supply Chain Control Tower | CPG, Battery, O&G | IBP + real-time logistics + BI |
| Regulatory Compliance Platform | Pharma, Battery | GxP systems + DMS + audit trail |
| Data Platform / Lakehouse | All | Cloud (AWS/Azure/GCP) + Spark + BI |

---

## Key Terminology Reference

| Term | Meaning |
|------|---------|
| APC | Advanced Process Control |
| APM | Asset Performance Management |
| BMS | Battery Management System |
| CAPA | Corrective and Preventive Action (pharma quality) |
| CDMO | Contract Development and Manufacturing Organization |
| DCS | Distributed Control System |
| DSCSA | Drug Supply Chain Security Act (US serialization) |
| EBR | Electronic Batch Record |
| ELN | Electronic Lab Notebook |
| ESS | Energy Storage System |
| EHS / HSE | Environment, Health & Safety |
| Formation | Electrochemical activation step in battery cell manufacturing |
| GAMP 5 | Good Automated Manufacturing Practice (pharma IT validation) |
| GxP | Good Practice regulations (GMP, GLP, GCP) |
| IOC | Integrated Operations Center |
| LIMS | Laboratory Information Management System |
| MES | Manufacturing Execution System |
| OT | Operational Technology (PLCs, SCADA, DCS) |
| PI / AVEVA PI | OSIsoft process historian platform |
| PLM | Product Lifecycle Management |
| S&OP | Sales and Operations Planning |
| SCM | Supply Chain Management |
| SOH | State of Health (battery) |
| SOC | State of Charge (battery) |
| TPM | Trade Promotion Management |
| VMI | Vendor Managed Inventory |

---

## Repository Context

This repository (`hello-world`) is a minimal static GitHub Pages site used as a working environment. It contains:

```
hello-world/
├── index.html     # Static GitHub Pages entry point
├── styles.css     # Basic layout stylesheet
├── images/        # Static image assets
└── README.md      # GitHub onboarding guide
```

**No build tooling** — plain HTML/CSS, no npm or bundlers. Edit files directly and push to deploy via GitHub Pages.

### Git Branch Conventions
| Branch | Purpose |
|--------|---------|
| `master` | Production — served by GitHub Pages |
| `claude/*` | AI-assisted development branches |

Always develop on a `claude/` branch and open a pull request to `master`.
