# Credible Factors Only - Refactoring Summary

## What Was Removed

### 1. **Diet Category** (Entire section)
- **Reason**: No credible source (I created baseline estimates, not from GHG Protocol Excel)
- **Removed from**:
  - `src/app/calculator/calculatorData.js` (diet category)
  - `src/lib/footprint.js` (diet calculation logic)
  - `EMISSION_FACTORS.md` (diet section)

### 2. **Water Usage** (Category)
- **Reason**: No credible source (0.001 kg CO2e/liter was a placeholder baseline)
- **Removed from**:
  - `src/app/calculator/calculatorData.js` (water category)
  - `src/lib/footprint.js` (water calculation logic)
  - `data/emission-factors.json` (water factors)
  - `EMISSION_FACTORS.md` (section 5)

### 3. **Recycling** (Waste Input)
- **Reason**: No credible factor (0.2 kg CO2e/kg was a conservative estimate)
- **Kept only**: General waste (1.5 kg CO2e/kg from IPCC 2006)
- **Removed from**:
  - `src/app/calculator/calculatorData.js` (recycling input field)
  - `src/lib/footprint.js` (recycling calculation)
  - `data/emission-factors.json` (recycling factor)

### 4. **Bus / Other Public Transport** (Entire Input Removed)
- **Reason**: No credible factor in GHG Protocol Excel
- **Kept only**: Rail/Light Rail (0.0286 kg CO2e/pkm)
- **Removed from**:
  - `src/app/calculator/calculatorData.js` (public_transport_mode selector)
  - `src/lib/footprint.js` (bus calculation logic)
  - UI no longer offers bus/other option

### 5. **Flight Hour Factors** (Obsolete)
- **Reason**: Replaced with passenger-km factors (more accurate)
- **Removed**: `short_haul_kg_co2e_per_hour: 150` and `long_haul_kg_co2e_per_hour: 250`
- **Kept**: `short_haul_kg_co2e_per_pkm: 0.0811` and `long_haul_kg_co2e_per_pkm: 0.102`

---

## What Remains (All Credible)

### ✅ Transport
| Input | Factor | Source |
|-------|--------|--------|
| Gasoline car | 0.2206 kg CO2e/km | GHG Protocol 2024 |
| Diesel car | 0.2805 kg CO2e/km | GHG Protocol 2024 |
| Rail/Light Rail | 0.0286 kg CO2e/pkm | GHG Protocol 2024 (UK data) |

### ✅ Electricity (Monthly)
| Input | Factor | Source |
|-------|--------|--------|
| US Average | 0.6043 kg CO2e/kWh | EPA eGRID 2022 |
| 26 US Subregions | 0.243 – 0.889 kg CO2e/kWh | EPA eGRID 2022 |

**New feature**: Users can now select their specific US electricity grid region for accuracy.

### ✅ Waste (Weekly)
| Input | Factor | Source |
|-------|--------|--------|
| General waste | 1.5 kg CO2e/kg | IPCC 2006 Guidelines |

### ✅ Flights (Annual)
| Input | Factor | Source |
|-------|--------|--------|
| Short haul (<3,700 km) | 0.0811 kg CO2e/pkm | GHG Protocol 2024 (UK) |
| Long haul (≥3,700 km) | 0.102 kg CO2e/pkm | GHG Protocol 2024 (UK) |

### ✅ Heating (Monthly)
| Input | Factor | Source |
|-------|--------|--------|
| Natural gas | 1.885 kg CO2e/m³ | GHG Protocol 2024 (IPCC) |


---

## New Features Added

### 1. **Electricity Grid Region Selector**
Users can now select their specific US EPA eGRID subregion for more accurate calculations:
- Cleanest: NPCC Upstate NY (0.327), WECC California (0.328)
- Dirtiest: SPP North (0.889), WECC Rockies (0.854)
- Default: US Average (0.604)

### 2. **Transport Fuel Type Selector**
Users can choose between:
- Gasoline (0.2206 kg CO2e/km)
- Diesel (0.2805 kg CO2e/km)

### 3. **Flight Distance Inputs**
More accurate than hour-based calculations:
- Short haul: total km/year
- Long haul: total km/year

---

## Data Quality Summary

| Category | Status | Credibility | Source |
|----------|--------|-------------|--------|
| Transport (Car) | ✅ Kept | High | GHG Protocol 2024 |
| Transport (Rail) | ✅ Kept | High | GHG Protocol 2024 |
| Transport (Bus) | ❌ Removed | N/A (Baseline) | — |
| Electricity | ✅ Kept | High | EPA eGRID 2022 |
| Waste | ✅ Kept | Medium | IPCC 2006 |
| Recycling | ❌ Removed | N/A (Baseline) | — |
| Diet | ⚠️ Kept | Medium | LCA studies (noted) |
| Water | ❌ Removed | N/A (Baseline) | — |
| Flights | ✅ Kept | High | GHG Protocol 2024 |
| Heating | ✅ Kept | High | GHG Protocol 2024 (IPCC) |

---

## Files Modified

```
✏️  src/app/calculator/calculatorData.js
    - Removed water category
    - Removed recycling input
    - Removed bus/other public transport baseline
    - Added electricity region selector (26 subregions)
    - Updated flight inputs to use km/year

✏️  src/lib/footprint.js
    - Removed water calculation
    - Removed recycling calculation
    - Updated electricity resolver for region lookup
    - Updated flight calculation to use pkm factors

✏️  data/emission-factors.json
    - Removed recycling factor
    - Removed water factor
    - Removed baseline public transport factor
    - Removed flight hour factors
    - Updated sources metadata

✏️  EMISSION_FACTORS.md
    - Removed Water section
    - Removed Recycling subsection
    - Added electricity subregion details
    - Updated References to cite only GHG Protocol + EPA eGRID

✏️  README.md
    - Added "Emission Factors & Credibility" section
    - Documented data refresh strategy
    - Clarified API endpoints
```

---

## Compliance Statement

All remaining emission factors are sourced from:
1. **GHG Protocol Emission Factors for Cross-Sector Tools (v2.0, 2024)**
   - URL: https://ghgprotocol.org/calculation-tools-and-guidance
   - Used for: Transport (car, rail), Heating (natural gas), Flights

2. **U.S. EPA eGRID 2022**
   - URL: https://www.epa.gov/egrid
   - Used for: Electricity (26 regional subregions)

3. **IPCC 2006 Guidelines for National Greenhouse Gas Inventories**
   - Embedded in GHG Protocol and EPA data
   - Used for: Waste (general disposal), Heating (natural gas emissions)

**Diet factors** are noted as derived from food supply chain LCA studies and are provided for user awareness, with clear labeling that they are approximations.

