const fs = require('fs/promises');
const path = require('path');
const xlsx = require('xlsx');

const DEFAULT_URL =
  'https://ghgprotocol.org/sites/default/files/2024-05/Emission_Factors_for_Cross_Sector_Tools_V2.0_0.xlsx';
const DATA_DIR = path.join(process.cwd(), 'data');
const XLSX_PATH = path.join(DATA_DIR, 'ghg-protocol-factors.xlsx');
const OUTPUT_PATH = path.join(DATA_DIR, 'emission-factors.json');
const DEFAULT_STATEMENT =
  'Emission factors are periodically updated using the GHG Protocol Cross-Sector Tools workbook and U.S. EPA eGRID electricity datasets to cover stationary combustion, purchased electricity, public transportation, and flight activity with current published defaults.';

const GWP = {
  CH4: 28,
  N2O: 265
};

const downloadFile = async (url, outPath) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download Excel file: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buffer);
  return outPath;
};

const toRowsArray = (sheet) => {
  return xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
};

const findRowIndex = (rows, predicate) => {
  return rows.findIndex((row) => predicate(row || []));
};

const normalizeCell = (value) => String(value || '').trim();

const findColumnIndex = (row, matcher) => {
  return row.findIndex((cell) => matcher(normalizeCell(cell)));
};

const parseNumber = (value) => {
  const parsed = parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const toSlug = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const roundValue = (value, decimals = 12) => {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(decimals));
};

const normalizeDistanceFactor = (value, unit) => {
  if (!Number.isFinite(value)) return null;
  return String(unit || '').toLowerCase().includes('mile')
    ? value / 1.60934
    : value;
};

const toKg = (value, unit) => {
  const parsed = parseNumber(value);
  if (!Number.isFinite(parsed)) return 0;
  const normalizedUnit = String(unit || '').toLowerCase();

  if (normalizedUnit.includes('kg')) return parsed;
  if (normalizedUnit.includes('g')) return parsed / 1000;
  return parsed;
};

const parseStationaryCombustion = (rows) => {
  const headerRowIndex = findRowIndex(rows, (row) => row.some((cell) => normalizeCell(cell) === 'kg CO2/m3'));
  if (headerRowIndex < 0) return null;

  const headerRow = rows[headerRowIndex];
  const liquidColumnIndex = findColumnIndex(headerRow, (value) => value === 'kg CO2/litre');
  const gasColumnIndex = findColumnIndex(headerRow, (value) => value === 'kg CO2/m3');

  if (liquidColumnIndex < 0 && gasColumnIndex < 0) return null;

  const mappings = [
    {
      key: 'natural_gas',
      label: 'Natural Gas',
      unit: 'm3',
      columnIndex: gasColumnIndex,
      matcher: (text) => /(^|\|)\s*natural gas\s*(\||$)/i.test(text)
    },
    {
      key: 'lpg',
      label: 'LPG / Propane',
      unit: 'liter',
      columnIndex: liquidColumnIndex,
      matcher: (text) => /liquified petroleum gases/i.test(text)
    },
    {
      key: 'kerosene',
      label: 'Kerosene',
      unit: 'liter',
      columnIndex: liquidColumnIndex,
      matcher: (text) => /other kerosene/i.test(text)
    },
    {
      key: 'diesel',
      label: 'Gas / Diesel Oil',
      unit: 'liter',
      columnIndex: liquidColumnIndex,
      matcher: (text) => /gas\/diesel oil/i.test(text)
    },
    {
      key: 'fuel_oil',
      label: 'Residual Fuel Oil',
      unit: 'liter',
      columnIndex: liquidColumnIndex,
      matcher: (text) => /residual fuel oil/i.test(text)
    }
  ];

  const fuels = {};

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const normalizedText = row.map((cell) => normalizeCell(cell)).join(' | ');

    mappings.forEach((mapping) => {
      if (fuels[mapping.key]) return;
      if (mapping.columnIndex < 0) return;
      if (!mapping.matcher(normalizedText)) return;

      const value = parseNumber(row[mapping.columnIndex]);
      if (Number.isFinite(value)) {
        fuels[mapping.key] = {
          label: mapping.label,
          unit: mapping.unit,
          kg_co2e_per_unit: value
        };
      }
    });

    if (mappings.every((mapping) => fuels[mapping.key])) {
      break;
    }
  }

  return Object.keys(fuels).length ? fuels : null;
};

const parseMobileFuelUse = (rows) => {
  const headerRowIndex = findRowIndex(rows, (row) => {
    return row.some((cell) => normalizeCell(cell) === 'Region')
      && row.some((cell) => normalizeCell(cell) === 'Fuel')
      && row.some((cell) => normalizeCell(cell) === 'Fossil CO2 EF');
  });

  if (headerRowIndex < 0) return null;

  const headerRow = rows[headerRowIndex];
  const regionIndex = findColumnIndex(headerRow, (value) => value === 'Region');
  const fuelIndex = findColumnIndex(headerRow, (value) => value === 'Fuel');
  const valueIndex = findColumnIndex(headerRow, (value) => value === 'Fossil CO2 EF');
  const unitIndex = findColumnIndex(headerRow, (value) => value === 'EF Unit');

  const fuels = {};

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const region = normalizeCell(row[regionIndex]);
    const fuel = normalizeCell(row[fuelIndex]);
    const unit = normalizeCell(row[unitIndex]);
    const value = parseNumber(row[valueIndex]);

    if (!region || !fuel || !value || !unit) continue;
    if (region !== 'Other1') continue;

    if (fuel.toLowerCase().includes('motor gasoline') && unit === 'kg/L') {
      fuels.gasolineKgPerLiter = value;
    }

    if (fuel.toLowerCase().includes('on-road diesel') && unit === 'kg/L') {
      fuels.dieselKgPerLiter = value;
    }
  }

  return fuels;
};

const parseMobileDistance = (rows) => {
  const headerRowIndex = findRowIndex(rows, (row) => row.some((cell) => normalizeCell(cell) === 'Vehicle Type'));
  if (headerRowIndex < 0) return null;

  const headerRow = rows[headerRowIndex];
  const vehicleIndex = findColumnIndex(headerRow, (value) => value === 'Vehicle Type');

  const unitRow = rows[headerRowIndex + 1] || [];
  const kmLIndex = findColumnIndex(unitRow, (value) => value === 'km/L');

  if (vehicleIndex < 0 || kmLIndex < 0) return null;

  const mappings = [
    {
      key: 'passenger_car',
      matcher: (vehicle) => vehicle.toLowerCase().includes('passenger cars')
    },
    {
      key: 'motorcycle',
      matcher: (vehicle) => vehicle.toLowerCase().includes('motorcycles')
    },
    {
      key: 'diesel_bus',
      matcher: (vehicle) => vehicle.toLowerCase().includes('diesel buses')
    }
  ];

  const vehicles = {};

  for (let i = headerRowIndex + 2; i < rows.length; i += 1) {
    const row = rows[i];
    const vehicle = normalizeCell(row[vehicleIndex]);
    if (!vehicle) continue;

    mappings.forEach((mapping) => {
      if (vehicles[mapping.key]) return;
      if (!mapping.matcher(vehicle)) return;

      const value = parseNumber(row[kmLIndex]);
      if (Number.isFinite(value)) {
        vehicles[mapping.key] = value;
      }
    });

    if (mappings.every((mapping) => vehicles[mapping.key])) break;
  }

  return Object.keys(vehicles).length ? vehicles : null;
};

const parseElectricityUS = (rows) => {
  const headerRowIndex = findRowIndex(rows, (row) => row.some((cell) => normalizeCell(cell) === 'eGRID subregion name'));
  if (headerRowIndex < 0) return null;

  const headerRow = rows[headerRowIndex];
  const nameIndex = findColumnIndex(headerRow, (value) => value === 'eGRID subregion name');

  const co2RowIndex = findRowIndex(rows, (row) => {
    return row.some((cell) => normalizeCell(cell) === 'eGRID subregion annual CO2 output emission rate (lb/MWh)');
  });

  if (nameIndex < 0 || co2RowIndex < 0) return null;

  const co2Row = rows[co2RowIndex];
  const co2Index = findColumnIndex(
    co2Row,
    (value) => value === 'eGRID subregion annual CO2 output emission rate (lb/MWh)'
  );

  if (co2Index < 0) return null;

  const subregions = {};

  for (let i = co2RowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const name = normalizeCell(row[nameIndex]);
    const value = parseNumber(row[co2Index]);
    if (!name || !value) continue;

    const kgPerKwh = value * 0.00045359237;
    subregions[name] = {
      co2_lb_per_mwh: value,
      kg_co2e_per_kwh: kgPerKwh
    };
  }

  const values = Object.values(subregions).map((item) => item.kg_co2e_per_kwh);
  const average = values.length
    ? values.reduce((sum, val) => sum + val, 0) / values.length
    : null;

  if (average) {
    subregions['US Average'] = {
      co2_lb_per_mwh: null,
      kg_co2e_per_kwh: average
    };
  }

  return {
    subregions,
    average_kg_co2e_per_kwh: average
  };
};

const parsePublicTransport = (rows) => {
  const headerRowIndex = findRowIndex(rows, (row) => {
    return row.some((cell) => normalizeCell(cell) === 'Region')
      && row.some((cell) => normalizeCell(cell) === 'Transport Type')
      && row.some((cell) => normalizeCell(cell) === 'CO2 EF');
  });

  if (headerRowIndex < 0) return null;

  const headerRow = rows[headerRowIndex];
  const regionIndex = findColumnIndex(headerRow, (value) => value === 'Region');
  const transportIndex = findColumnIndex(headerRow, (value) => value === 'Transport Type');
  const classIndex = findColumnIndex(headerRow, (value) => value === 'Class');
  const co2Index = findColumnIndex(headerRow, (value) => value === 'CO2 EF');
  const ch4Index = findColumnIndex(headerRow, (value) => value === 'CH4 EF');
  const n2oIndex = findColumnIndex(headerRow, (value) => value === 'N2O EF');

  const co2UnitIndex = co2Index >= 0 ? co2Index + 1 : -1;
  const ch4UnitIndex = ch4Index >= 0 ? ch4Index + 1 : -1;
  const n2oUnitIndex = n2oIndex >= 0 ? n2oIndex + 1 : -1;

  const results = [];

  for (let i = headerRowIndex + 2; i < rows.length; i += 1) {
    const row = rows[i];
    const region = normalizeCell(row[regionIndex]);
    const transport = normalizeCell(row[transportIndex]);
    const className = normalizeCell(row[classIndex]);

    if (!region || !transport) continue;

    const co2Value = parseNumber(row[co2Index]);
    const ch4Value = parseNumber(row[ch4Index]);
    const n2oValue = parseNumber(row[n2oIndex]);

    const co2Unit = normalizeCell(row[co2UnitIndex]);
    const ch4Unit = normalizeCell(row[ch4UnitIndex]);
    const n2oUnit = normalizeCell(row[n2oUnitIndex]);

    if (!co2Value || !co2Unit) continue;

    const co2Kg = toKg(co2Value, co2Unit);
    const ch4Kg = toKg(ch4Value, ch4Unit);
    const n2oKg = toKg(n2oValue, n2oUnit);

    const co2e = co2Kg + ch4Kg * GWP.CH4 + n2oKg * GWP.N2O;
    const normalizedCo2e = normalizeDistanceFactor(co2e, co2Unit);
    const normalizedUnit = String(co2Unit || '').toLowerCase();
    const basis = normalizedUnit.includes('vehicle') ? 'vehicle_km' : 'passenger_km';

    results.push({
      region,
      transport,
      className,
      basis,
      source_unit: co2Unit,
      co2e_kg_per_km: normalizedCo2e
    });
  }

  return results;
};

const findTransportEntry = (entries, matcher) => {
  return entries.find((entry) => {
    if (!entry) return false;
    if (matcher.region && entry.region !== matcher.region) return false;
    if (matcher.basis && entry.basis !== matcher.basis) return false;
    if (matcher.transport && entry.transport !== matcher.transport) return false;
    if (matcher.transportStartsWith && !entry.transport.startsWith(matcher.transportStartsWith)) return false;
    if (matcher.className && entry.className !== matcher.className) return false;
    if (matcher.classIncludes && !entry.className.toLowerCase().includes(matcher.classIncludes.toLowerCase())) return false;
    return true;
  });
};

const factorValue = (entry, fallback) => {
  if (Number.isFinite(entry?.co2e_kg_per_km)) {
    return roundValue(entry.co2e_kg_per_km);
  }
  return fallback;
};

const readJson = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

const main = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const url = process.argv[2] || DEFAULT_URL;
  try {
    await fs.access(XLSX_PATH);
  } catch (error) {
    await downloadFile(url, XLSX_PATH);
  }

  const workbook = xlsx.readFile(XLSX_PATH, { cellDates: true });

  const stationaryRows = toRowsArray(workbook.Sheets['Stationary Combustion']);
  const mobileFuelRows = toRowsArray(workbook.Sheets['Mobile Combustion - Fuel Use']);
  const mobileDistanceRows = toRowsArray(workbook.Sheets['Mobile Combustion - Distance']);
  const electricityRows = toRowsArray(workbook.Sheets['Electricity US']);
  const publicTransportRows = toRowsArray(workbook.Sheets['Mobile Combustion - Public']);

  const stationaryFuelFactors = parseStationaryCombustion(stationaryRows) || {};
  const mobileFuel = parseMobileFuelUse(mobileFuelRows) || {};
  const vehicleEconomy = parseMobileDistance(mobileDistanceRows) || {};
  const electricity = parseElectricityUS(electricityRows);
  const publicTransport = parsePublicTransport(publicTransportRows) || [];

  const gasolineKgPerL = mobileFuel.gasolineKgPerLiter;
  const dieselKgPerL = mobileFuel.dieselKgPerLiter;
  const passengerCarKmPerL = vehicleEconomy.passenger_car;
  const motorcycleKmPerL = vehicleEconomy.motorcycle;
  const carKgPerKm = gasolineKgPerL && passengerCarKmPerL
    ? gasolineKgPerL / passengerCarKmPerL
    : null;
  const dieselKgPerKm = dieselKgPerL && passengerCarKmPerL
    ? dieselKgPerL / passengerCarKmPerL
    : null;
  const motorcycleKgPerKm = gasolineKgPerL && motorcycleKmPerL
    ? gasolineKgPerL / motorcycleKmPerL
    : null;

  const ukDomesticFlight = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - Domestic',
    classIncludes: 'average'
  });
  const ukShortHaul = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - Short Haul',
    classIncludes: 'average'
  });
  const ukShortHaulEconomy = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - Short Haul',
    classIncludes: 'economy'
  });
  const ukShortHaulBusiness = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - Short Haul',
    classIncludes: 'business'
  });
  const ukLongHaul = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - Long Haul',
    classIncludes: 'average'
  });
  const ukLongHaulEconomy = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - Long Haul',
    classIncludes: 'economy'
  });
  const ukLongHaulPremiumEconomy = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - Long Haul',
    classIncludes: 'premium economy'
  });
  const ukLongHaulBusiness = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - Long Haul',
    classIncludes: 'business'
  });
  const ukLongHaulFirst = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - Long Haul',
    classIncludes: 'first'
  });
  const ukInternationalAverage = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - International',
    classIncludes: 'average'
  });
  const ukInternationalEconomy = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - International',
    classIncludes: 'economy class'
  });
  const ukInternationalPremiumEconomy = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - International',
    classIncludes: 'premium economy'
  });
  const ukInternationalBusiness = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - International',
    classIncludes: 'business class'
  });
  const ukInternationalFirst = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transportStartsWith: 'Air - International',
    classIncludes: 'first class'
  });

  const ukRail = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transport: 'Rail',
    classIncludes: 'light rail'
  });
  const usTransitRail = findTransportEntry(publicTransport, {
    region: 'US',
    basis: 'passenger_km',
    transport: 'Transit Rail',
    classIncludes: 'subway, tram'
  });
  const usCommuterRail = findTransportEntry(publicTransport, {
    region: 'US',
    basis: 'passenger_km',
    transport: 'Commuter Rail'
  });
  const usIntercityRail = findTransportEntry(publicTransport, {
    region: 'US',
    basis: 'passenger_km',
    transport: 'Intercity Rail',
    classIncludes: 'national average'
  });
  const usBus = findTransportEntry(publicTransport, {
    region: 'US',
    basis: 'passenger_km',
    transport: 'Bus'
  });
  const ukCoach = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transport: 'Bus',
    classIncludes: 'coach'
  });
  const ukFerry = findTransportEntry(publicTransport, {
    region: 'UK',
    basis: 'passenger_km',
    transport: 'Average Ferry'
  });

  const payload = (await readJson(OUTPUT_PATH)) || {};

  const factors = payload.factors || {};
  const transportModes = {
    ...(factors?.transport?.public_transport?.modes || {}),
    rail: ukRail
      ? {
          label: 'Light Rail / Tram',
          region: ukRail.region,
          basis: ukRail.basis,
          kg_co2e_per_pkm: factorValue(ukRail, factors?.transport?.public_transport?.modes?.rail?.kg_co2e_per_pkm)
        }
      : factors?.transport?.public_transport?.modes?.rail,
    transit_rail: usTransitRail
      ? {
          label: 'Subway / Tram',
          region: usTransitRail.region,
          basis: usTransitRail.basis,
          kg_co2e_per_pkm: factorValue(usTransitRail, factors?.transport?.public_transport?.modes?.transit_rail?.kg_co2e_per_pkm)
        }
      : factors?.transport?.public_transport?.modes?.transit_rail,
    commuter_rail: usCommuterRail
      ? {
          label: 'Commuter Rail',
          region: usCommuterRail.region,
          basis: usCommuterRail.basis,
          kg_co2e_per_pkm: factorValue(usCommuterRail, factors?.transport?.public_transport?.modes?.commuter_rail?.kg_co2e_per_pkm)
        }
      : factors?.transport?.public_transport?.modes?.commuter_rail,
    intercity_rail: usIntercityRail
      ? {
          label: 'Intercity Rail',
          region: usIntercityRail.region,
          basis: usIntercityRail.basis,
          kg_co2e_per_pkm: factorValue(usIntercityRail, factors?.transport?.public_transport?.modes?.intercity_rail?.kg_co2e_per_pkm)
        }
      : factors?.transport?.public_transport?.modes?.intercity_rail,
    bus: usBus
      ? {
          label: 'Bus',
          region: usBus.region,
          basis: usBus.basis,
          kg_co2e_per_pkm: factorValue(usBus, factors?.transport?.public_transport?.modes?.bus?.kg_co2e_per_pkm)
        }
      : factors?.transport?.public_transport?.modes?.bus,
    coach: ukCoach
      ? {
          label: 'Coach',
          region: ukCoach.region,
          basis: ukCoach.basis,
          kg_co2e_per_pkm: factorValue(ukCoach, factors?.transport?.public_transport?.modes?.coach?.kg_co2e_per_pkm)
        }
      : factors?.transport?.public_transport?.modes?.coach,
    ferry: ukFerry
      ? {
          label: 'Ferry',
          region: ukFerry.region,
          basis: ukFerry.basis,
          kg_co2e_per_pkm: factorValue(ukFerry, factors?.transport?.public_transport?.modes?.ferry?.kg_co2e_per_pkm)
        }
      : factors?.transport?.public_transport?.modes?.ferry
  };

  const heatingFuels = {
    ...(factors?.heating?.fuels || {}),
    natural_gas: stationaryFuelFactors.natural_gas
      ? {
          ...stationaryFuelFactors.natural_gas,
          kg_co2e_per_unit: roundValue(stationaryFuelFactors.natural_gas.kg_co2e_per_unit)
        }
      : factors?.heating?.fuels?.natural_gas,
    lpg: stationaryFuelFactors.lpg
      ? {
          ...stationaryFuelFactors.lpg,
          kg_co2e_per_unit: roundValue(stationaryFuelFactors.lpg.kg_co2e_per_unit)
        }
      : factors?.heating?.fuels?.lpg,
    kerosene: stationaryFuelFactors.kerosene
      ? {
          ...stationaryFuelFactors.kerosene,
          kg_co2e_per_unit: roundValue(stationaryFuelFactors.kerosene.kg_co2e_per_unit)
        }
      : factors?.heating?.fuels?.kerosene,
    diesel: stationaryFuelFactors.diesel
      ? {
          ...stationaryFuelFactors.diesel,
          kg_co2e_per_unit: roundValue(stationaryFuelFactors.diesel.kg_co2e_per_unit)
        }
      : factors?.heating?.fuels?.diesel,
    fuel_oil: stationaryFuelFactors.fuel_oil
      ? {
          ...stationaryFuelFactors.fuel_oil,
          kg_co2e_per_unit: roundValue(stationaryFuelFactors.fuel_oil.kg_co2e_per_unit)
        }
      : factors?.heating?.fuels?.fuel_oil
  };

  const nextFactors = {
    ...factors,
    transport: {
      ...(factors.transport || {}),
      car_kg_co2e_per_km: roundValue(carKgPerKm) || factors?.transport?.car_kg_co2e_per_km || 0.2,
      car_diesel_kg_co2e_per_km: roundValue(dieselKgPerKm) || factors?.transport?.car_diesel_kg_co2e_per_km,
      motorcycle_kg_co2e_per_km: roundValue(motorcycleKgPerKm) || factors?.transport?.motorcycle_kg_co2e_per_km,
      vehicle_factors: {
        ...(factors?.transport?.vehicle_factors || {}),
        passenger_car: {
          ...(factors?.transport?.vehicle_factors?.passenger_car || {}),
          average_fuel_economy_km_per_l: roundValue(passengerCarKmPerL) || factors?.transport?.vehicle_factors?.passenger_car?.average_fuel_economy_km_per_l,
          gasoline_kg_co2e_per_km: roundValue(carKgPerKm) || factors?.transport?.vehicle_factors?.passenger_car?.gasoline_kg_co2e_per_km,
          diesel_kg_co2e_per_km: roundValue(dieselKgPerKm) || factors?.transport?.vehicle_factors?.passenger_car?.diesel_kg_co2e_per_km
        },
        motorcycle: {
          ...(factors?.transport?.vehicle_factors?.motorcycle || {}),
          average_fuel_economy_km_per_l: roundValue(motorcycleKmPerL) || factors?.transport?.vehicle_factors?.motorcycle?.average_fuel_economy_km_per_l,
          gasoline_kg_co2e_per_km: roundValue(motorcycleKgPerKm) || factors?.transport?.vehicle_factors?.motorcycle?.gasoline_kg_co2e_per_km
        }
      },
      public_transport: {
        ...(factors?.transport?.public_transport || {}),
        default_region: 'US',
        modes: transportModes
      }
    },
    flights: {
      ...(factors.flights || {}),
      domestic_kg_co2e_per_pkm: factorValue(ukDomesticFlight, factors?.flights?.domestic_kg_co2e_per_pkm),
      short_haul_kg_co2e_per_pkm: factorValue(ukShortHaul, factors?.flights?.short_haul_kg_co2e_per_pkm),
      long_haul_kg_co2e_per_pkm: factorValue(ukLongHaul, factors?.flights?.long_haul_kg_co2e_per_pkm),
      domestic: {
        ...(factors?.flights?.domestic || {}),
        average: factorValue(ukDomesticFlight, factors?.flights?.domestic?.average)
      },
      short_haul: {
        ...(factors?.flights?.short_haul || {}),
        average: factorValue(ukShortHaul, factors?.flights?.short_haul?.average),
        economy: factorValue(ukShortHaulEconomy, factors?.flights?.short_haul?.economy),
        business: factorValue(ukShortHaulBusiness, factors?.flights?.short_haul?.business)
      },
      long_haul: {
        ...(factors?.flights?.long_haul || {}),
        average: factorValue(ukLongHaul, factors?.flights?.long_haul?.average),
        economy: factorValue(ukLongHaulEconomy, factors?.flights?.long_haul?.economy),
        premium_economy: factorValue(ukLongHaulPremiumEconomy, factors?.flights?.long_haul?.premium_economy),
        business: factorValue(ukLongHaulBusiness, factors?.flights?.long_haul?.business),
        first: factorValue(ukLongHaulFirst, factors?.flights?.long_haul?.first)
      },
      international: {
        ...(factors?.flights?.international || {}),
        average: factorValue(ukInternationalAverage, factors?.flights?.international?.average),
        economy: factorValue(ukInternationalEconomy, factors?.flights?.international?.economy),
        premium_economy: factorValue(ukInternationalPremiumEconomy, factors?.flights?.international?.premium_economy),
        business: factorValue(ukInternationalBusiness, factors?.flights?.international?.business),
        first: factorValue(ukInternationalFirst, factors?.flights?.international?.first)
      }
    },
    electricity: {
      ...(factors.electricity || {}),
      kg_co2e_per_kwh: electricity?.average_kg_co2e_per_kwh
        || factors?.electricity?.kg_co2e_per_kwh,
      us: electricity || factors?.electricity?.us
    },
    heating: {
      ...(factors.heating || {}),
      gas_kg_co2e_per_m3: heatingFuels?.natural_gas?.kg_co2e_per_unit || factors?.heating?.gas_kg_co2e_per_m3,
      lpg_kg_co2e_per_liter: heatingFuels?.lpg?.kg_co2e_per_unit || factors?.heating?.lpg_kg_co2e_per_liter,
      kerosene_kg_co2e_per_liter: heatingFuels?.kerosene?.kg_co2e_per_unit || factors?.heating?.kerosene_kg_co2e_per_liter,
      fuels: heatingFuels
    }
  };

  const next = {
    ...payload,
    updatedAt: new Date().toISOString().split('T')[0],
    statement: DEFAULT_STATEMENT,
    factors: nextFactors,
    sources: [
      {
        id: 'ghg-protocol-2024',
        title: 'GHG Protocol Emission Factors for Cross-Sector Tools (v2.0, 2024)',
        url: 'https://ghgprotocol.org/calculation-tools-and-guidance',
        sheets: [
          'Stationary Combustion',
          'Mobile Combustion - Fuel Use',
          'Mobile Combustion - Distance',
          'Mobile Combustion - Public'
        ]
      },
      {
        id: 'epa-egrid-2022',
        title: 'U.S. EPA eGRID 2022 (Electricity Grid Emissions)',
        url: 'https://www.epa.gov/egrid',
        year: 2022,
        method: 'Location-based approach for 26 US subregions'
      }
    ]
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(next, null, 2), 'utf8');

  console.log('Updated emission-factors.json with parsed values.');
};

main().catch((error) => {
  console.error('Failed to ingest GHG Protocol workbook:', error);
  process.exit(1);
});

