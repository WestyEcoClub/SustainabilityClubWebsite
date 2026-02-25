import { 
  Car, 
  Zap, 
  Trash, 
  Utensils, 
  Plane, 
  Droplets 
} from 'lucide-react';

export const RESULT_TYPES = [
  { id: 'dailyFootprint', name: 'Daily Footprint', unit: 'kg CO2e' }
];

export const CATEGORIES = {
  transport: {
    id: 'transport',
    name: 'Daily Transport',
    icon: Car,
    description: 'Average car or public transport emissions.',
    inputs: [
      {
        id: 'distance',
        name: 'Main Transport',
        unit: 'km',
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * 0.2 }),
        placeholder: 'Distance traveled per day',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'public_transport',
        name: 'Public Transport',
        unit: 'km',
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * 0.05 }),
        placeholder: 'Bus/Train distance',
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
    description: 'Emissions from power plants.',
    inputs: [
      {
        id: 'usage',
        name: 'Monthly Consumption',
        unit: 'kWh / month',
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * (0.5 / 30) }),
        placeholder: 'Monthly consumption',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      }
    ]
  },
  waste: {
    id: 'waste',
    name: 'Weekly Waste',
    icon: Trash,
    description: 'Methane and processing emissions.',
    inputs: [
      {
        id: 'amount',
        name: 'General Waste',
        unit: 'kg / week',
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * (1.5 / 7) }),
        placeholder: 'Waste produced per week',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'recycling',
        name: 'Recycling',
        unit: 'kg / week',
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * (0.2 / 7) }),
        placeholder: 'Recycled amount',
        renderInput: 'Input',
        renderSimulation: 'Slider',
        isExtendable: true
      }
    ]
  },
  diet: {
    id: 'diet',
    name: 'Dietary Habits',
    icon: Utensils,
    description: 'Daily impact of food choices.',
    inputs: [
      {
        id: 'base_diet',
        name: 'Main Diet Type',
        renderInput: 'Select',
        renderSimulation: 'Options',
        calculate: (val) => ({ dailyFootprint: parseFloat(val) || 0 }),
        options: [
          { label: 'Omnivore', value: '4.5' },
          { label: 'Vegetarian', value: '2.5' },
          { label: 'Vegan', value: '1.5' }
        ]
      },
      {
        id: 'meat_consumption',
        name: 'Red Meat Frequency',
        renderInput: 'Select',
        renderSimulation: 'Options',
        calculate: (val) => ({ dailyFootprint: parseFloat(val) || 0 }),
        options: [
          { label: 'Daily', value: '2.0' },
          { label: 'Few times / week', value: '1.0' },
          { label: 'Rarely', value: '0.2' },
          { label: 'None', value: '0' }
        ],
        isExtendable: true
      },
      {
        id: 'dairy_consumption',
        name: 'Dairy Frequency',
        renderInput: 'Select',
        renderSimulation: 'Options',
        calculate: (val) => ({ dailyFootprint: parseFloat(val) || 0 }),
        options: [
          { label: 'High', value: '1.0' },
          { label: 'Moderate', value: '0.5' },
          { label: 'None', value: '0' }
        ],
        isExtendable: true
      }
    ]
  },
  water: {
    id: 'water',
    name: 'Water Usage',
    icon: Droplets,
    description: 'Energy used for water treatment.',
    inputs: [
      {
        id: 'daily_use',
        name: 'Daily Water Use',
        unit: 'Liters / day',
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * 0.001 }),
        placeholder: 'Daily water use',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      }
    ]
  },
  flights: {
    id: 'flights',
    name: 'Annual Flights',
    icon: Plane,
    description: 'High-altitude carbon emissions.',
    inputs: [
      {
        id: 'short_haul',
        name: 'Short Haul (<3h)',
        unit: 'Hours / year',
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * (150 / 365) }),
        placeholder: 'Total hours per year',
        renderInput: 'Input',
        renderSimulation: 'Slider'
      },
      {
        id: 'long_haul',
        name: 'Long Haul (>3h)',
        unit: 'Hours / year',
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * (250 / 365) }),
        placeholder: 'Total hours per year',
        renderInput: 'Input',
        renderSimulation: 'Slider',
        isExtendable: true
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
        calculate: (val) => ({ dailyFootprint: (parseFloat(val) || 0) * (2.0 / 30) }),
        placeholder: 'Monthly gas use',
        renderInput: 'Input',
        renderSimulation: 'Slider'
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
  transport: { distance: 0, public_transport: 0 },
  electricity: { usage: 0 },
  waste: { amount: 0, recycling: 0 },
  diet: { base_diet: '4.5', meat_consumption: '0.2', dairy_consumption: '0.5' },
  water: { daily_use: 0 },
  flights: { short_haul: 0, long_haul: 0 },
  heating: { gas_use: 0 }
};

export const calculateScore = (selectionData, selections) => {
  const scores = selections.reduce((acc, catId) => {
    const config = CATEGORIES[catId];
    if (!config) return acc;
    
    config.inputs.forEach((input) => {
      const val = selectionData[catId]?.[input.id];
      const res = input.calculate(val) || {};
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
    const res = input.calculate(val) || {};
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
    getData: (data, activeSelections) => {
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
    getData: (data, activeSelections) => {
      const scores = calculateScore(data, activeSelections);
      const totalScore = scores.dailyFootprint || "0.00";
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
    getData: (data, simulationData, activeSelections) => {
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
    getData: (data, simulationData, activeSelections) => {
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
