# 🌱 Sustainability Calculator - Credible Factors Implementation

## Overview

The Sustainability Calculator now uses **only credible, peer-reviewed emission factors** from authoritative sources. All baseline/placeholder data has been removed.

---

## ✅ What's Available Now

### 1. **Transport (Daily)**
Calculate CO2e from personal vehicle and public rail usage.

**Inputs:**
- Main transport distance (km/day)
- Fuel type: Gasoline OR Diesel
- Rail/Light Rail distance (km/day)

**Emission Factors:**
- Gasoline: **0.2206 kg CO2e/km** (GHG Protocol 2024)
- Diesel: **0.2805 kg CO2e/km** (GHG Protocol 2024)
- Rail: **0.0286 kg CO2e/passenger-km** (GHG Protocol 2024, UK data)

---

### 2. **Electricity (Monthly)**
Calculate CO2e from grid electricity with **regional accuracy**.

**Inputs:**
- Monthly consumption (kWh)
- Electricity grid region (26 US EPA eGRID subregions or US Average)

**Emission Factors:**
- US Average: **0.6043 kg CO2e/kWh** (EPA eGRID 2022)
- **Cleanest regions:**
  - NPCC Upstate NY: 0.327
  - WECC California: 0.328
  - WECC Northwest: 0.409
- **Dirtiest regions:**
  - SPP North: 0.889
  - WECC Rockies: 0.854
  - MRO East: 0.832

---

### 3. **Waste (Weekly)**
Calculate CO2e from general household waste disposal.

**Inputs:**
- General waste (kg/week)

**Emission Factors:**
- General waste: **1.5 kg CO2e/kg** (IPCC 2006)

---

### 4. **Flights (Annual)**
Calculate CO2e from commercial air travel using **distance-based factors**.

**Inputs:**
- Short haul flights (<3,700 km) - total km/year
- Long haul flights (≥3,700 km) - total km/year

**Emission Factors:**
- Short haul: **0.0811 kg CO2e/passenger-km** (GHG Protocol 2024, UK)
- Long haul: **0.102 kg CO2e/passenger-km** (GHG Protocol 2024, UK)

---

### 5. **Home Heating (Monthly)**
Calculate CO2e from natural gas consumption.

**Inputs:**
- Monthly gas usage (m³)

**Emission Factors:**
- Natural gas: **1.885 kg CO2e/m³** (GHG Protocol 2024, IPCC compliant)

---

## ❌ What Was Removed

| Category | Reason |
|----------|--------|
| **Water Usage** | No credible source (baseline only) |
| **Recycling** | No credible factor (estimate only) |
| **Bus/Other Transport** | No credible public transport baseline |
| **Flight Hour Factors** | Replaced with distance-based (more accurate) |

---

## 📊 Data Sources

All factors are sourced from:

1. **GHG Protocol Emission Factors for Cross-Sector Tools (v2.0, 2024)**
   - URL: https://ghgprotocol.org/calculation-tools-and-guidance
   - Used for: Transport, Flights, Heating
   - Sheets: Mobile Combustion (fuel, rail, flights), Stationary Combustion (gas)

2. **U.S. EPA eGRID 2022**
   - URL: https://www.epa.gov/egrid
   - Used for: Electricity (26 US subregions)
   - Data year: 2022 (latest available)

3. **IPCC 2006 Guidelines for National Greenhouse Gas Inventories**
   - Embedded in GHG Protocol and EPA data
   - Used for: Waste, Heating (natural gas)

---

## 🔄 Automatic Updates

Emission factors are automatically refreshed monthly:

```bash
npm run ingest:ghg
```

This script:
1. Downloads the latest GHG Protocol Excel workbook
2. Parses Mobile Combustion, Stationary Combustion, and Electricity sheets
3. Fetches EPA eGRID electricity data
4. Updates `data/emission-factors.json`
5. Records update timestamp and source metadata

**Update Frequency:** Monthly (configurable)

---

## 📝 Documentation

- **`EMISSION_FACTORS.md`** - Complete formulae and methodology for each category
- **`CREDIBLE_FACTORS_SUMMARY.md`** - This document; what was removed, why, and what remains
- **`README.md`** - Project overview with emission factors credibility section

---

## 🎯 Quality Assurance

All code changes have been linted and validated:
- No errors in calculator inputs
- API correctly calculates using stored factors
- Server-side calculation supports region lookups for electricity

**Linter Status:** ✅ No errors (only pre-existing warnings about `<img>` tags in posts)

---

## 🚀 Current Capabilities

### Single-Country/Regional Accuracy
- ✅ US electricity (26 EPA eGRID subregions)
- ⚠️ Gasoline/diesel for personal vehicles (global average)
- ✅ Rail transport (UK average, applies globally)
- ✅ Natural gas heating (IPCC default)

### Multi-Region Support
- ✅ Electricity: Full 26 US EPA eGRID regions selectable in UI
- ⚠️ Transport, flights, heating: Use global/UK averages

### Data Freshness
- ✅ Automatic monthly refresh from GHG Protocol
- ✅ EPA eGRID data (2022, latest available)

---

## 🔮 Future Enhancements

Potential additions (requiring credible data sources):

1. **International Electricity Grids** - Add grids for other countries
2. **Regional Transport Factors** - More vehicle efficiency data by region
3. **Waste Stream Details** - Differentiate landfill vs. incinerators vs. composting
4. **Seasonal Adjustments** - Account for heating/cooling variations
5. **Vehicle Type Options** - Distinguish SUVs, sedans, EVs, hybrids

---

## 📞 Support & Questions

For questions about:
- **Calculation methodology**: See `EMISSION_FACTORS.md`
- **Data sources**: See references in `EMISSION_FACTORS.md` and `README.md`
- **Why something was removed**: See `CREDIBLE_FACTORS_SUMMARY.md`

---

**Last Updated:** February 25, 2026  
**Version:** 1.0 (Credible Factors Only)  
**Status:** ✅ Production Ready

