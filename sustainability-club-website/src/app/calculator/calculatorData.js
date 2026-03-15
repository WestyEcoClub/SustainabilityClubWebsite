import { 
  Car, 
  Zap, 
  Trash, 
  Plane
} from 'lucide-react';
import {
  DEFAULT_EMISSION_FACTORS,
  resolveCarFactor,
  resolveElectricityFactor,
  resolveFlightFactor,
  resolveHeatingFactor,
  resolveTransportModeFactor
} from '@/lib/footprint';

const FACTORS = DEFAULT_EMISSION_FACTORS;

export const RESULT_TYPES = [
  { id: 'dailyFootprint', name: 'Daily Footprint', unit: 'kg CO2e' }
];

export const CATEGORIES = {
  transport: {
    id: 'transport',
    name: 'Daily Transport',
    icon: Car,
    description: 'Cars, motorcycles, buses, and rail travel emissions.',
    inputs: [
      {
        id: 'distance',
        name: 'Car Distance',
        unit: 'km / day',
        calculate: (val, ctx) => {
          const fuelType = ctx?.transport?.fuel_type || 'gasoline';
          const factor = resolveCarFactor(FACTORS, fuelType);
          return { dailyFootprint: (parseFloat(val) || 0) * factor };
        },
        placeholder: 'Distance driven per day',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'fuel_type',
        name: 'Fuel Type',
        renderInput: 'Select',
        renderSimulation: 'Options',
        calculate: () => ({ dailyFootprint: 0 }),
        options: [
          { label: 'Gasoline', value: 'gasoline' },
          { label: 'Diesel', value: 'diesel' }
        ]
      },
      {
        id: 'public_transport',
        name: 'Subway / Tram Distance',
        unit: 'km / day',
        calculate: (val) => ({
          dailyFootprint: (parseFloat(val) || 0) * resolveTransportModeFactor(FACTORS, 'transit_rail')
        }),
        placeholder: 'Subway or tram distance per day',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'bus_distance',
        name: 'Bus / Shuttle Distance',
        unit: 'km / day',
        calculate: (val) => ({
          dailyFootprint: (parseFloat(val) || 0) * resolveTransportModeFactor(FACTORS, 'bus')
        }),
        placeholder: 'Bus distance per day',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'commuter_rail_distance',
        name: 'Commuter Rail Distance',
        unit: 'km / day',
        calculate: (val) => ({
          dailyFootprint: (parseFloat(val) || 0) * resolveTransportModeFactor(FACTORS, 'commuter_rail')
        }),
        placeholder: 'Commuter rail distance per day',
        renderInput: 'Input',
        renderSimulation: 'Slider',
        isExtendable: true
      },
      {
        id: 'motorcycle_distance',
        name: 'Motorcycle Distance',
        unit: 'km / day',
        calculate: (val) => ({
          dailyFootprint: (parseFloat(val) || 0) * (FACTORS.transport.motorcycle_kg_co2e_per_km || 0.1223)
        }),
        placeholder: 'Motorcycle distance per day',
        renderInput: 'Input',
        renderSimulation: 'Slider',
        isExtendable: true
      }
    ]
  },
  electricity: {
    id: 'electricity',
    name: 'Electricity Use',
    icon: Zap,
    description: 'Emissions from power grids (EPA eGRID).',
    inputs: [
      {
        id: 'usage',
        name: 'Monthly Consumption',
        unit: 'kWh / month',
        calculate: (val, ctx) => {
          const region = ctx?.electricity?.region || 'US Average';
          const factor = resolveElectricityFactor(FACTORS, region);
          return { dailyFootprint: (parseFloat(val) || 0) * (factor / 30) };
        },
        placeholder: 'Monthly consumption',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'region',
        name: 'Electricity Grid Region (US)',
        renderInput: 'Select',
        renderSimulation: 'Options',
        calculate: () => ({ dailyFootprint: 0 }),
        options: [
          { label: 'US Average (0.604)', value: 'US Average' },
          { label: '--- Cleanest ---', value: '__group_cleanest', disabled: true },
          { label: 'NPCC Upstate NY (0.327)', value: 'NPCC Upstate NY' },
          { label: 'WECC California (0.328)', value: 'WECC California' },
          { label: 'WECC Northwest (0.409)', value: 'WECC Northwest' },
          { label: 'NPCC New England (0.421)', value: 'NPCC New England' },
          { label: 'SERC Mississippi Valley (0.463)', value: 'SERC Mississippi Valley' },
          { label: '--- Moderate ---', value: '__group_moderate', disabled: true },
          { label: 'ASCC Miscellaneous (0.243)', value: 'ASCC Miscellaneous' },
          { label: 'ERCOT All (0.568)', value: 'ERCOT All' },
          { label: 'RFC East (0.517)', value: 'RFC East' },
          { label: 'FRCC All (0.553)', value: 'FRCC All' },
          { label: 'SERC South (0.676)', value: 'SERC South' },
          { label: '--- Dirtiest ---', value: '__group_dirtiest', disabled: true },
          { label: 'WECC Rockies (0.854)', value: 'WECC Rockies' },
          { label: 'SPP North (0.889)', value: 'SPP North' },
          { label: 'MRO East (0.832)', value: 'MRO East' },
          { label: 'HICC Oahu (0.822)', value: 'HICC Oahu' }
        ]
      }
    ]
  },
  waste: {
    id: 'waste',
    name: 'Weekly Waste',
    icon: Trash,
    description: 'General waste disposal emissions (IPCC).',
    inputs: [
      {
        id: 'amount',
        name: 'General Waste',
        unit: 'kg / week',
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * (1.5 / 7) }),
        placeholder: 'Waste produced per week',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      }
    ]
  },
  flights: {
    id: 'flights',
    name: 'Annual Flights',
    icon: Plane,
    description: 'Passenger-distance flight emissions with cabin-class factors.',
    inputs: [
      {
        id: 'domestic',
        name: 'Domestic Flights (to/from UK workbook basis)',
        unit: 'km / year',
        calculate: (val) => ({
          dailyFootprint: (parseFloat(val) || 0) * (resolveFlightFactor(FACTORS, 'domestic', 'average') / 365)
        }),
        placeholder: 'Total domestic flight km per year',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'short_haul',
        name: 'Short Haul Flights (<3,700 km)',
        unit: 'km / year',
        calculate: (val, ctx) => ({
          dailyFootprint: (parseFloat(val) || 0) * (
            resolveFlightFactor(FACTORS, 'short_haul', ctx?.flights?.short_haul_class || 'average') / 365
          )
        }),
        placeholder: 'Total km per year',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'short_haul_class',
        name: 'Short Haul Cabin Class',
        renderInput: 'Select',
        renderSimulation: 'Options',
        calculate: () => ({ dailyFootprint: 0 }),
        options: [
          { label: 'Average Passenger', value: 'average' },
          { label: 'Economy', value: 'economy' },
          { label: 'Business', value: 'business' }
        ]
      },
      {
        id: 'long_haul',
        name: 'Long Haul Flights (≥3,700 km)',
        unit: 'km / year',
        calculate: (val, ctx) => ({
          dailyFootprint: (parseFloat(val) || 0) * (
            resolveFlightFactor(FACTORS, 'long_haul', ctx?.flights?.long_haul_class || 'average') / 365
          )
        }),
        placeholder: 'Total km per year',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'long_haul_class',
        name: 'Long Haul Cabin Class',
        renderInput: 'Select',
        renderSimulation: 'Options',
        calculate: () => ({ dailyFootprint: 0 }),
        options: [
          { label: 'Average Passenger', value: 'average' },
          { label: 'Economy', value: 'economy' },
          { label: 'Premium Economy', value: 'premium_economy' },
          { label: 'Business', value: 'business' },
          { label: 'First', value: 'first' }
        ]
      }
    ]
  },
  heating: {
    id: 'heating',
    name: 'Home Heating',
    icon: Zap,
    description: 'Carbon emissions from space heating.',
    inputs: [
      {
        id: 'gas_use',
        name: 'Monthly Gas Use',
        unit: 'm³ / month',
        calculate: (val) => ({
          dailyFootprint: (parseFloat(val) || 0) * (resolveHeatingFactor(FACTORS, 'natural_gas') / 30)
        }),
        placeholder: 'Monthly gas use',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'lpg_use',
        name: 'Monthly LPG / Propane Use',
        unit: 'L / month',
        calculate: (val) => ({
          dailyFootprint: (parseFloat(val) || 0) * (resolveHeatingFactor(FACTORS, 'lpg') / 30)
        }),
        placeholder: 'Monthly LPG or propane use',
        renderInput: 'Input',
        renderSimulation: 'Slider',
        isExtendable: true
      },
      {
        id: 'kerosene_use',
        name: 'Monthly Kerosene Use',
        unit: 'L / month',
        calculate: (val) => ({
          dailyFootprint: (parseFloat(val) || 0) * (resolveHeatingFactor(FACTORS, 'kerosene') / 30)
        }),
        placeholder: 'Monthly kerosene use',
        renderInput: 'Input',
        renderSimulation: 'Slider',
        isExtendable: true
      }
    ]
  }
};

export const COMPARISON_DATA = {
  local: 8.2,
  national: 14.5,
  world: 4.8
};

export const INITIAL_DATA = {
  transport: {
    distance: 0,
    fuel_type: 'gasoline',
    public_transport: 0,
    bus_distance: 0,
    commuter_rail_distance: 0,
    motorcycle_distance: 0
  },
  electricity: { usage: 0, region: 'US Average' },
  waste: { amount: 0 },
  flights: {
    domestic: 0,
    short_haul: 0,
    short_haul_class: 'average',
    long_haul: 0,
    long_haul_class: 'average'
  },
  heating: {
    gas_use: 0,
    lpg_use: 0,
    kerosene_use: 0
  }
};

export const calculateScore = (selectionData, selections) => {
  const scores = selections.reduce((acc, catId) => {
    const config = CATEGORIES[catId];
    if (!config) return acc;
    
    config.inputs.forEach((input) => {
      const val = selectionData[catId]?.[input.id];
      const res = input.calculate(val, selectionData) || {};
      Object.keys(res).forEach(key => {
        acc[key] = (acc[key] || 0) + (res[key] || 0);
      });
    });
    
    return acc;
  }, {});

  // Format all values to 2 decimal places
  Object.keys(scores).forEach(key => {
    scores[key] = scores[key].toFixed(2);
  });

  return scores;
};

export const getCategoryScore = (catId, catValue) => {
  const config = CATEGORIES[catId];
  if (!config || !catValue) return {};
  
  return config.inputs.reduce((acc, input) => {
    const val = catValue[input.id];
    const res = input.calculate(val, { [catId]: catValue }) || {};
    Object.keys(res).forEach(key => {
      acc[key] = (acc[key] || 0) + (res[key] || 0);
    });
    return acc;
  }, {});
};

export const CHART_COLORS = ['#10B981', '#0EA5E9', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const ANALYSIS_CHARTS = {
  ratios: {
    id: 'ratios',
    type: 'pie',
    title: 'Emission Ratios',
    accentColor: 'bg-primary-green',
    getData: (data, activeSelections, apiResults) => {
      if (apiResults?.current?.categories) {
        return activeSelections.map(id => {
          const config = CATEGORIES[id];
          const value = apiResults.current.categories[id]?.dailyFootprint || 0;
          return {
            name: config.name,
            value: parseFloat(value.toFixed(2))
          };
        }).filter(item => item.value > 0);
      }

      return activeSelections.map(id => {
        const config = CATEGORIES[id];
        const value = data[id];
        const scores = getCategoryScore(id, value);

        return {
          name: config.name,
          value: parseFloat((scores.dailyFootprint || 0).toFixed(2))
        };
      }).filter(item => item.value > 0);
    }
  },
  comparison: {
    id: 'comparison',
    type: 'bar',
    title: 'Global Comparison',
    accentColor: 'bg-primary-skyblue',
    footer: 'Values in kg CO2e per day',
    getData: (data, activeSelections, apiResults) => {
      const totalScore = apiResults?.current?.totals?.dailyFootprint
        ?? (calculateScore(data, activeSelections).dailyFootprint || "0.00");
      return [
        { name: 'You', value: parseFloat(totalScore), fill: '#0EA5E9' },
        { name: 'Local', value: COMPARISON_DATA.local, fill: '#10B981' },
        { name: 'National', value: COMPARISON_DATA.national, fill: '#64748B' },
        { name: 'World', value: COMPARISON_DATA.world, fill: '#94A3B8' }
      ];
    }
  }
};

export const SIMULATION_CHARTS = {
  categoryComparison: {
    id: 'categoryComparison',
    type: 'line',
    title: 'Category Comparison',
    getData: (data, simulationData, activeSelections, apiResults) => {
      if (apiResults?.current?.categories && apiResults?.simulated?.categories) {
        return activeSelections.map(id => {
          const config = CATEGORIES[id];
          const original = apiResults.current.categories[id]?.dailyFootprint || 0;
          const simulated = apiResults.simulated.categories[id]?.dailyFootprint || 0;

          return {
            category: config.name,
            original: parseFloat(original.toFixed(2)),
            simulated: parseFloat(simulated.toFixed(2))
          };
        });
      }

      return activeSelections.map(id => {
        const config = CATEGORIES[id];
        const originalValue = data[id];
        const simulatedValue = simulationData[id];

        const originalScores = getCategoryScore(id, originalValue);
        const simulatedScores = getCategoryScore(id, simulatedValue);

        return {
          category: config.name,
          original: parseFloat((originalScores.dailyFootprint || 0).toFixed(2)),
          simulated: parseFloat((simulatedScores.dailyFootprint || 0).toFixed(2))
        };
      });
    }
  },
  totalTrend: {
    id: 'totalTrend',
    type: 'line',
    title: 'Total Impact Trend',
    getData: (data, simulationData, activeSelections, apiResults) => {
      if (apiResults?.current?.totals && apiResults?.simulated?.totals) {
        const current = parseFloat(apiResults.current.totals.dailyFootprint || 0);
        const simulated = parseFloat(apiResults.simulated.totals.dailyFootprint || 0);
        const target = current * 0.5;

        return [
          { name: 'Original State', original: current, simulated: current },
          { name: 'Simulated State', original: current, simulated: simulated },
          { name: '50% Goal', original: target, simulated: target },
        ];
      }

      const current = parseFloat(calculateScore(data, activeSelections).dailyFootprint || 0);
      const simulated = parseFloat(calculateScore(simulationData, activeSelections).dailyFootprint || 0);
      const target = current * 0.5;

      return [
        { name: 'Original State', original: current, simulated: current },
        { name: 'Simulated State', original: current, simulated: simulated },
        { name: '50% Goal', original: target, simulated: target },
      ];
    }
  }
};
