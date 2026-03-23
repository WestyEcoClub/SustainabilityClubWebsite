import emissionFactorPayload from '../../data/emission-factors.json';

const STATIC_DEFAULTS = {
  transport: {
    car_kg_co2e_per_km: 0.2206,
    car_diesel_kg_co2e_per_km: 0.2805,
    motorcycle_kg_co2e_per_km: 0.1223,
    vehicle_factors: {
      passenger_car: {
        average_fuel_economy_km_per_l: 10.3741,
        gasoline_kg_co2e_per_km: 0.2206,
        diesel_kg_co2e_per_km: 0.2805
      },
      motorcycle: {
        average_fuel_economy_km_per_l: 18.7075,
        gasoline_kg_co2e_per_km: 0.1223
      }
    },
    public_transport: {
      default_region: 'US',
      modes: {
        rail: { label: 'Light Rail / Tram', kg_co2e_per_pkm: 0.0286 },
        transit_rail: { label: 'Subway / Tram', kg_co2e_per_pkm: 0.0581 },
        commuter_rail: { label: 'Commuter Rail', kg_co2e_per_pkm: 0.0833 },
        intercity_rail: { label: 'Intercity Rail', kg_co2e_per_pkm: 0.0708 },
        bus: { label: 'Bus', kg_co2e_per_pkm: 0.0445 },
        coach: { label: 'Coach', kg_co2e_per_pkm: 0.0272 },
        ferry: { label: 'Ferry', kg_co2e_per_pkm: 0.1127 }
      }
    }
  },
  electricity: {
    kg_co2e_per_kwh: 0.6043,
    us: {
      subregions: {}
    }
  },
  waste: {
    general_kg_co2e_per_kg: 1.5
  },
  flights: {
    domestic_kg_co2e_per_pkm: 0.1299,
    short_haul_kg_co2e_per_pkm: 0.0811,
    long_haul_kg_co2e_per_pkm: 0.102,
    domestic: {
      average: 0.1299
    },
    short_haul: {
      average: 0.0811,
      economy: 0.0798,
      business: 0.1196
    },
    long_haul: {
      average: 0.102,
      economy: 0.0781,
      premium_economy: 0.1249,
      business: 0.2265,
      first: 0.3126
    },
    international: {
      average: 0.097,
      economy: 0.0743,
      premium_economy: 0.1188,
      business: 0.2154,
      first: 0.2971
    }
  },
  heating: {
    gas_kg_co2e_per_m3: 1.885,
    lpg_kg_co2e_per_liter: 1.4731,
    kerosene_kg_co2e_per_liter: 2.6716,
    fuels: {
      natural_gas: { label: 'Natural Gas', unit: 'm3', kg_co2e_per_unit: 1.885 },
      lpg: { label: 'LPG / Propane', unit: 'liter', kg_co2e_per_unit: 1.4731 },
      kerosene: { label: 'Kerosene', unit: 'liter', kg_co2e_per_unit: 2.6716 }
    }
  },
  analysis: {
    global_comparison_electricity: {
      basis: 'electricity_use_only',
      unit: 'kg_co2e_per_kwh',
      countries: []
    }
  }
};

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mergeFactors = (factors) => {
  const source = factors || {};

  return {
    transport: {
      ...STATIC_DEFAULTS.transport,
      ...(source.transport || {}),
      vehicle_factors: {
        ...(STATIC_DEFAULTS.transport.vehicle_factors || {}),
        ...(source.transport?.vehicle_factors || {}),
        passenger_car: {
          ...(STATIC_DEFAULTS.transport.vehicle_factors?.passenger_car || {}),
          ...(source.transport?.vehicle_factors?.passenger_car || {})
        },
        motorcycle: {
          ...(STATIC_DEFAULTS.transport.vehicle_factors?.motorcycle || {}),
          ...(source.transport?.vehicle_factors?.motorcycle || {})
        }
      },
      public_transport: {
        ...(STATIC_DEFAULTS.transport.public_transport || {}),
        ...(source.transport?.public_transport || {}),
        modes: {
          ...(STATIC_DEFAULTS.transport.public_transport?.modes || {}),
          ...(source.transport?.public_transport?.modes || {})
        }
      }
    },
    electricity: {
      ...STATIC_DEFAULTS.electricity,
      ...(source.electricity || {}),
      us: {
        ...(STATIC_DEFAULTS.electricity.us || {}),
        ...(source.electricity?.us || {}),
        subregions: {
          ...(STATIC_DEFAULTS.electricity.us?.subregions || {}),
          ...(source.electricity?.us?.subregions || {})
        }
      }
    },
    waste: {
      ...STATIC_DEFAULTS.waste,
      ...(source.waste || {})
    },
    flights: {
      ...STATIC_DEFAULTS.flights,
      ...(source.flights || {}),
      domestic: {
        ...(STATIC_DEFAULTS.flights.domestic || {}),
        ...(source.flights?.domestic || {})
      },
      short_haul: {
        ...(STATIC_DEFAULTS.flights.short_haul || {}),
        ...(source.flights?.short_haul || {})
      },
      long_haul: {
        ...(STATIC_DEFAULTS.flights.long_haul || {}),
        ...(source.flights?.long_haul || {})
      },
      international: {
        ...(STATIC_DEFAULTS.flights.international || {}),
        ...(source.flights?.international || {})
      }
    },
    heating: {
      ...STATIC_DEFAULTS.heating,
      ...(source.heating || {}),
      fuels: {
        ...(STATIC_DEFAULTS.heating.fuels || {}),
        ...(source.heating?.fuels || {})
      }
    },
    analysis: {
      ...STATIC_DEFAULTS.analysis,
      ...(source.analysis || {}),
      global_comparison_electricity: {
        ...(STATIC_DEFAULTS.analysis.global_comparison_electricity || {}),
        ...(source.analysis?.global_comparison_electricity || {}),
        countries: Array.isArray(source.analysis?.global_comparison_electricity?.countries)
          ? source.analysis.global_comparison_electricity.countries
          : (STATIC_DEFAULTS.analysis.global_comparison_electricity.countries || [])
      }
    }
  };
};

const normalizeCabinKey = (value) => {
  return String(value || 'average')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'average';
};

export const DEFAULT_EMISSION_FACTORS = mergeFactors(emissionFactorPayload?.factors || {});

export const resolveElectricityFactor = (factors, region) => {
  if (region && region !== 'US Average') {
    const subregions = factors?.electricity?.us?.subregions || {};
    const regionEntry = subregions[region];
    if (regionEntry?.kg_co2e_per_kwh) {
      return regionEntry.kg_co2e_per_kwh;
    }
  }

  return factors?.electricity?.us?.average_kg_co2e_per_kwh
    || factors?.electricity?.kg_co2e_per_kwh
    || DEFAULT_EMISSION_FACTORS.electricity.kg_co2e_per_kwh;
};

export const resolveCarFactor = (factors, fuelType) => {
  if (fuelType === 'diesel') {
    return factors?.transport?.vehicle_factors?.passenger_car?.diesel_kg_co2e_per_km
      || factors?.transport?.car_diesel_kg_co2e_per_km
      || factors?.transport?.vehicle_factors?.passenger_car?.gasoline_kg_co2e_per_km
      || factors?.transport?.car_kg_co2e_per_km
      || DEFAULT_EMISSION_FACTORS.transport.car_kg_co2e_per_km;
  }
  return factors?.transport?.vehicle_factors?.passenger_car?.gasoline_kg_co2e_per_km
    || factors?.transport?.car_kg_co2e_per_km
    || DEFAULT_EMISSION_FACTORS.transport.car_kg_co2e_per_km;
};

export const resolveTransportModeFactor = (factors, modeKey) => {
  const mode = factors?.transport?.public_transport?.modes?.[modeKey];
  if (Number.isFinite(mode?.kg_co2e_per_pkm)) {
    return mode.kg_co2e_per_pkm;
  }

  if (modeKey !== 'rail') {
    const railFallback = factors?.transport?.public_transport?.modes?.rail?.kg_co2e_per_pkm;
    if (Number.isFinite(railFallback) && (modeKey === 'transit_rail' || modeKey === 'light_rail')) {
      return railFallback;
    }
  }

  return 0;
};

export const resolveFlightFactor = (factors, segment, cabin = 'average') => {
  const normalizedCabin = normalizeCabinKey(cabin);
  const segmentFactors = factors?.flights?.[segment] || {};

  if (Number.isFinite(segmentFactors?.[normalizedCabin])) {
    return segmentFactors[normalizedCabin];
  }

  if (Number.isFinite(segmentFactors?.average)) {
    return segmentFactors.average;
  }

  if (segment === 'domestic') {
    return factors?.flights?.domestic_kg_co2e_per_pkm || DEFAULT_EMISSION_FACTORS.flights.domestic_kg_co2e_per_pkm;
  }

  if (segment === 'short_haul') {
    return factors?.flights?.short_haul_kg_co2e_per_pkm || DEFAULT_EMISSION_FACTORS.flights.short_haul_kg_co2e_per_pkm;
  }

  if (segment === 'long_haul') {
    return factors?.flights?.long_haul_kg_co2e_per_pkm || DEFAULT_EMISSION_FACTORS.flights.long_haul_kg_co2e_per_pkm;
  }

  return 0;
};

export const resolveHeatingFactor = (factors, fuelKey) => {
  if (fuelKey === 'natural_gas') {
    return factors?.heating?.fuels?.natural_gas?.kg_co2e_per_unit
      || factors?.heating?.gas_kg_co2e_per_m3
      || DEFAULT_EMISSION_FACTORS.heating.gas_kg_co2e_per_m3;
  }

  if (fuelKey === 'lpg') {
    return factors?.heating?.fuels?.lpg?.kg_co2e_per_unit
      || factors?.heating?.lpg_kg_co2e_per_liter
      || DEFAULT_EMISSION_FACTORS.heating.lpg_kg_co2e_per_liter;
  }

  if (fuelKey === 'kerosene') {
    return factors?.heating?.fuels?.kerosene?.kg_co2e_per_unit
      || factors?.heating?.kerosene_kg_co2e_per_liter
      || DEFAULT_EMISSION_FACTORS.heating.kerosene_kg_co2e_per_liter;
  }

  return factors?.heating?.fuels?.[fuelKey]?.kg_co2e_per_unit || 0;
};

const addCategoryValue = (totals, categories, categoryId, value) => {
  if (!Number.isFinite(value)) return;
  totals.dailyFootprint += value;
  categories[categoryId] = categories[categoryId] || { dailyFootprint: 0 };
  categories[categoryId].dailyFootprint += value;
};

export const calculateFootprint = (data, selections, factors) => {
  const normalizedFactors = mergeFactors(factors);
  const totals = { dailyFootprint: 0 };
  const categories = {};

  const selected = Array.isArray(selections) ? selections : [];

  if (selected.includes('transport')) {
    const fuelType = data?.transport?.fuel_type || 'gasoline';
    const distance = toNumber(data?.transport?.distance);
    const motorcycleDistance = toNumber(data?.transport?.motorcycle_distance);
    const transitRailDistance = toNumber(data?.transport?.public_transport);
    const commuterRailDistance = toNumber(data?.transport?.commuter_rail_distance);
    const busDistance = toNumber(data?.transport?.bus_distance);
    const carFactor = resolveCarFactor(normalizedFactors, fuelType);
    const motorcycleFactor = normalizedFactors.transport.vehicle_factors?.motorcycle?.gasoline_kg_co2e_per_km
      || normalizedFactors.transport.motorcycle_kg_co2e_per_km;
    const transitRailFactor = resolveTransportModeFactor(normalizedFactors, 'transit_rail');
    const commuterRailFactor = resolveTransportModeFactor(normalizedFactors, 'commuter_rail');
    const busFactor = resolveTransportModeFactor(normalizedFactors, 'bus');

    addCategoryValue(
      totals,
      categories,
      'transport',
      distance * carFactor
    );
    addCategoryValue(
      totals,
      categories,
      'transport',
      motorcycleDistance * motorcycleFactor
    );
    addCategoryValue(
      totals,
      categories,
      'transport',
      transitRailDistance * transitRailFactor
    );
    addCategoryValue(
      totals,
      categories,
      'transport',
      commuterRailDistance * commuterRailFactor
    );
    addCategoryValue(
      totals,
      categories,
      'transport',
      busDistance * busFactor
    );
  }

  if (selected.includes('electricity')) {
    const usage = toNumber(data?.electricity?.usage);
    const region = data?.electricity?.region;
    const factor = resolveElectricityFactor(normalizedFactors, region);
    const daily = (usage * factor) / 30;
    addCategoryValue(totals, categories, 'electricity', daily);
  }

  if (selected.includes('waste')) {
    const amount = toNumber(data?.waste?.amount);
    addCategoryValue(
      totals,
      categories,
      'waste',
      (amount * normalizedFactors.waste.general_kg_co2e_per_kg) / 7
    );
  }


  if (selected.includes('flights')) {
    const domestic = toNumber(data?.flights?.domestic);
    const shortHaul = toNumber(data?.flights?.short_haul);
    const shortHaulClass = data?.flights?.short_haul_class || 'average';
    const longHaul = toNumber(data?.flights?.long_haul);
    const longHaulClass = data?.flights?.long_haul_class || 'average';
    const domesticFactor = resolveFlightFactor(normalizedFactors, 'domestic', 'average');
    const shortFactor = resolveFlightFactor(normalizedFactors, 'short_haul', shortHaulClass);
    const longFactor = resolveFlightFactor(normalizedFactors, 'long_haul', longHaulClass);
    const domesticDaily = domestic > 0 ? (domestic * domesticFactor) / 365 : 0;
    const shortDaily = shortHaul > 0 ? (shortHaul * shortFactor) / 365 : 0;
    const longDaily = longHaul > 0 ? (longHaul * longFactor) / 365 : 0;

    addCategoryValue(totals, categories, 'flights', domesticDaily);
    addCategoryValue(totals, categories, 'flights', shortDaily);
    addCategoryValue(totals, categories, 'flights', longDaily);
  }

  if (selected.includes('heating')) {
    const gasUse = toNumber(data?.heating?.gas_use);
    const lpgUse = toNumber(data?.heating?.lpg_use);
    const keroseneUse = toNumber(data?.heating?.kerosene_use);

    addCategoryValue(
      totals,
      categories,
      'heating',
      (gasUse * resolveHeatingFactor(normalizedFactors, 'natural_gas')) / 30
    );
    addCategoryValue(
      totals,
      categories,
      'heating',
      (lpgUse * resolveHeatingFactor(normalizedFactors, 'lpg')) / 30
    );
    addCategoryValue(
      totals,
      categories,
      'heating',
      (keroseneUse * resolveHeatingFactor(normalizedFactors, 'kerosene')) / 30
    );
  }

  return {
    totals: {
      dailyFootprint: totals.dailyFootprint.toFixed(2)
    },
    categories
  };
};


