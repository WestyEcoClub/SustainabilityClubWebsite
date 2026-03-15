# Emission Factors & Calculation Formulae

This document outlines the CO2e emission factors used in the Sustainability Calculator and their sources.

**Data Sources:**
- **GHG Protocol**: Emission Factors for Cross-Sector Tools (v2.0, 2024) – [Download](https://ghgprotocol.org/sites/default/files/2024-05/Emission_Factors_for_Cross_Sector_Tools_V2.0_0.xlsx)
- **U.S. EPA eGRID**: Electricity grid emission factors (2022 data)
- **IPCC 2006 Guidelines**: National Greenhouse Gas Inventories – fuel carbon accounting methods

---

## 1. Transport (Daily)

### Formula
```
Daily CO2e (transport) = (car_distance × car_factor) + (rail_distance × rail_factor)
```

### Factors

#### Personal Vehicle (Car)
| Fuel Type | Factor | Source | Note |
|-----------|--------|--------|------|
| **Gasoline** | **0.2206 kg CO2e / km** | GHG Protocol Mobile Combustion (Fuel Use) | Derived from 2.084 kg CO2/L ÷ 9.44 km/L |
| **Diesel** | **0.2805 kg CO2e / km** | GHG Protocol Mobile Combustion (Fuel Use) | Derived from 2.648 kg CO2/L ÷ 9.44 km/L |

**Calculation Logic:**
- Motor gasoline (GHG Protocol): 2.084 kg CO2/L (other region)
- Average passenger car fuel economy: 9.44 km/L (US data, converted from 24.4 mpg)
- CO2e per km = kg CO2 per liter ÷ fuel economy

#### Public Transport
| Mode | Factor | Source | Note |
|------|--------|--------|------|
| **Rail / Light Rail** | **0.0286 kg CO2e / passenger-km** | GHG Protocol Mobile Combustion (Public) | UK Light Rail average (2023 data), includes CH4 & N2O |

**Calculation Logic (for Rail):**
- UK Rail (Light Rail and Tram): 0.02832 kg CO2e / passenger-km
- Includes CO2, CH4 (28 GWP), and N2O (265 GWP) emissions
- Formula: CO2 + (CH4 × 28) + (N2O × 265)

---

## 2. Electricity (Monthly)

### Formula
```
Daily CO2e (electricity) = (monthly_consumption_kWh × regional_factor) / 30 days
```

### Factors

| Region | Factor | Source | Note |
|--------|--------|--------|------|
| **US Average** | **0.6043 kg CO2e / kWh** | EPA eGRID 2022 (all subregions) | Weighted average across 26 US subregions |
| **Specific US Subregion** | Varies: 0.243 – 0.889 kg CO2e / kWh | EPA eGRID 2022 Subregional Data | See full list below |

**US EPA eGRID Subregions (2022 data):**
- **Cleanest:** WECC Northwest (0.409), NPCC Upstate NY (0.327), WECC California (0.328)
- **Cleanest Tier 2:** NPCC New England (0.421), SERC Mississippi Valley (0.463)
- **Average:** US Average (0.604)
- **Dirtiest Tier 2:** WECC Rockies (0.854), SPP North (0.889)
- **Dirtiest:** HICC Oahu (0.822), MRO East (0.832)

**Calculation Logic:**
- EPA eGRID reports CO2 in lb/MWh
- Conversion: lb/MWh × 0.00045359237 = kg CO2e/kWh
- Example: WECC Northwest 902.24 lb/MWh × 0.00045359237 = 0.409 kg CO2e/kWh

---

## 3. Waste (Weekly)

### Formula
```
Daily CO2e (waste) = (general_waste_kg / 7) × 1.5
```

### Factors

| Waste Type | Factor | Source | Note |
|------------|--------|--------|------|
| **General Waste** | **1.5 kg CO2e / kg waste** | IPCC 2006 default | Includes methane from decomposition and processing |

**Calculation Logic:**
- General waste: 1.5 kg CO2e per kg (IPCC 2006 default for mixed waste)
- Converted to daily by dividing weekly value by 7 days

---

## 4. Diet (Daily)

### Formula
```
Daily CO2e (diet) = base_diet_factor + meat_frequency_factor + dairy_frequency_factor
```

### Factors

#### Base Diet Type
| Diet | CO2e (kg/day) | Notes |
|------|---------------|-------|
| **Omnivore** | **4.5** | Mixed meat and dairy |
| **Vegetarian** | **2.5** | No meat; includes dairy & eggs |
| **Vegan** | **1.5** | Plant-based only |

#### Red Meat Consumption Frequency
| Frequency | CO2e (kg/day) | Notes |
|-----------|---------------|-------|
| **Daily** | **2.0** | High impact |
| **Few times/week** | **1.0** | Moderate impact |
| **Rarely** | **0.2** | Low additional impact |
| **None** | **0** | No impact |

#### Dairy Consumption Frequency
| Frequency | CO2e (kg/day) | Notes |
|-----------|---------------|-------|
| **High** | **1.0** | Frequent dairy/cheese |
| **Moderate** | **0.5** | Occasional dairy |
| **None** | **0** | No dairy |

**Calculation Logic:**
- Base factors are aggregated from food supply chain Life Cycle Assessment (LCA) studies
- Meat & dairy add incrementally on top of base diet
- *Note: Diet factors are approximations and vary significantly by region, sourcing, and production methods*
- Example: Omnivore + daily red meat + high dairy = 4.5 + 2.0 + 1.0 = **7.5 kg CO2e/day**

---

## 4. Flights (Annual)

### Formula
```
Daily CO2e (flights) = [(short_haul_km / 365) × short_factor] + [(long_haul_km / 365) × long_factor]
```

### Factors

| Flight Type | Factor | Source | Note |
|-------------|--------|--------|------|
| **Short Haul (<3,700 km)** | **0.0811 kg CO2e / passenger-km** | GHG Protocol Mobile Combustion (Public) | UK average (2023) |
| **Long Haul (≥3,700 km)** | **0.102 kg CO2e / passenger-km** | GHG Protocol Mobile Combustion (Public) | UK average (2023) |

**Calculation Logic:**
- UK Government GHG Conversion Factors (2023 publication)
- UK Air - Short Haul average: 0.0804 kg/pkm
- UK Air - Long Haul average: 0.1011 kg/pkm
- Includes CO2, CH4 (radiative forcing index ≈ 28), and N2O
- Converted to daily by dividing annual km by 365 days
- Example: 5,000 km short-haul flights/year = (5,000 × 0.0811) / 365 = **1.11 kg CO2e/day**

---

## 5. Home Heating (Monthly)

### Formula
```
Daily CO2e (heating) = (monthly_gas_usage_m³ × 1.885) / 30 days
```

### Factors

| Fuel | Factor | Source | Note |
|------|--------|--------|------|
| **Natural Gas (m³)** | **1.885 kg CO2e / m³** | GHG Protocol Stationary Combustion | IPCC 2006 compliant |

**Calculation Logic:**
- Natural gas: 1.8849 kg CO2/m³ (GHG Protocol default, "Other" region)
- Based on IPCC 2006 Lower Heating Value (LHV) method
- Typical monthly usage: 10–50 m³ (varies by climate)
- Converted to daily by dividing monthly value by 30 days
- Example: 30 m³/month = (30 × 1.885) / 30 = **1.89 kg CO2e/day**

---

## Data Refresh Strategy

Emission factors are automatically updated monthly using credible peer-reviewed sources:

```bash
npm run ingest:ghg
```

This script:
1. Downloads the latest **GHG Protocol** Excel file (Cross-Sector Tools)
2. Parses sheets: Mobile Combustion (fuel, rail), Stationary Combustion (natural gas)
3. Downloads latest **EPA eGRID** electricity grid data (all 26 US subregions)
4. Updates `data/emission-factors.json` with new factors
5. Records the update date and source

**Update Frequency:** Monthly (automatically triggered)
**Sources:** GHG Protocol v2.0 (2024) + EPA eGRID 2022

---

## References

1. **GHG Protocol** (2024). *Emission Factors for Cross-Sector Tools v2.0*  
   URL: https://ghgprotocol.org/calculation-tools-and-guidance  
   Sheets used:
   - Mobile Combustion - Fuel Use (gasoline, diesel for cars)
   - Mobile Combustion - Public (UK air & rail data)
   - Stationary Combustion (natural gas for heating)

2. **U.S. EPA** (2023). *eGRID 2022 Technical Guidance*  
   URL: https://www.epa.gov/egrid  
   Data: 26 US subregional electricity grid emission factors

---

## Disclaimer

These factors are **credible, peer-reviewed values** from the GHG Protocol and EPA eGRID datasets and do not account for:
- Individual vehicle efficiency or age
- Specific electricity grid composition changes or time-of-use patterns
- Specific food sourcing or agricultural practices
- Regional variations not covered by EPA eGRID subregions

For more granular assessments, consult primary source data or specialized calculators.

