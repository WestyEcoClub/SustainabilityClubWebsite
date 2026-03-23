const fs = require('fs/promises');
const path = require('path');
const xlsx = require('xlsx');

const DATA_DIR = path.join(process.cwd(), 'data');
const XLSX_PATH = path.join(DATA_DIR, 'ghg-protocol-factors.xlsx');
const OUTPUT_PATH = path.join(DATA_DIR, 'emission-factors.json');

const toRowsArray = (sheet) => {
  return xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
};

const normalizeCell = (value) => String(value || '').trim();

const parseNumber = (value) => {
  const parsed = parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const toSourceDate = () => new Date().toISOString().split('T')[0];

const findRowIndex = (rows, predicate) => {
  return rows.findIndex((row) => predicate(row || []));
};

const parseUsAverageFactor = (rows) => {
  const tableTitle = rows.find((row) => /Table\s*1\.\s*Year\s*\d{4}/i.test(row.join(' '))) || [];
  const yearMatch = tableTitle.join(' ').match(/Year\s*(\d{4})/i);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

  const headerRowIndex = findRowIndex(rows, (row) => row.some((cell) => normalizeCell(cell) === 'eGRID subregion name'));
  const co2HeaderRowIndex = findRowIndex(rows, (row) => {
    return row.some((cell) => /annual CO2 output emission rate \(lb\/MWh\)/i.test(normalizeCell(cell)));
  });

  if (headerRowIndex < 0 || co2HeaderRowIndex < 0) {
    return null;
  }

  const nameIndex = rows[headerRowIndex].findIndex((cell) => normalizeCell(cell) === 'eGRID subregion name');
  const co2Index = rows[co2HeaderRowIndex].findIndex((cell) => /annual CO2 output emission rate \(lb\/MWh\)/i.test(normalizeCell(cell)));

  if (nameIndex < 0 || co2Index < 0) {
    return null;
  }

  const nextTableIndex = rows.findIndex((row, index) => {
    if (index <= co2HeaderRowIndex) return false;
    return row.some((cell) => /^Table\s*2\./i.test(normalizeCell(cell)));
  });

  const stopIndex = nextTableIndex > 0 ? nextTableIndex : rows.length;
  const values = [];

  for (let i = co2HeaderRowIndex + 1; i < stopIndex; i += 1) {
    const row = rows[i] || [];
    const name = normalizeCell(row[nameIndex]);
    const co2LbPerMwh = parseNumber(row[co2Index]);

    if (!name || !Number.isFinite(co2LbPerMwh)) continue;

    // Convert lb/MWh to kg/kWh.
    values.push(co2LbPerMwh * 0.00045359237);
  }

  if (!values.length) {
    return null;
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    id: 'US',
    name: 'US',
    year,
    sourceSheet: 'Electricity US',
    kg_co2e_per_kwh: Number(average.toFixed(12))
  };
};

const normalizeCountryNameFromTable = (titleText) => {
  const text = String(titleText || '').toLowerCase();
  if (text.includes('chinese')) return 'China';
  if (text.includes('taiwan')) return 'Taiwan';
  if (text.includes('brazil')) return 'Brazil';
  if (text.includes('thailand')) return 'Thailand';
  if (text.includes('u.k') || text.includes('uk')) return 'UK';
  return null;
};

const toId = (name) => String(name || '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();

const convertToKgPerKwh = (value, unitHint) => {
  if (!Number.isFinite(value)) return null;
  const unit = String(unitHint || '').toLowerCase().replace(/\s+/g, '');

  if (unit.includes('tco2/mwh')) return value;
  if (unit.includes('kgco2e/kwh')) return value;
  if (unit.includes('kg/kwh')) return value;
  return value;
};

const parseInternationalFactors = (rows) => {
  const byCountry = new Map();

  let currentCountry = null;
  let currentUnit = '';

  rows.forEach((row) => {
    const text = row.map((cell) => normalizeCell(cell)).join(' ').trim();
    if (!text) return;

    const tableMatch = text.match(/^Table\s*\d+\./i);
    if (tableMatch) {
      currentCountry = normalizeCountryNameFromTable(text);
      currentUnit = '';
      return;
    }

    if (currentCountry && /emission factor|co2\s*\(kg\/kwh\)/i.test(text)) {
      currentUnit = text;
      return;
    }

    if (!currentCountry) return;

    const year = parseNumber(row[1]);
    const value = parseNumber(row[2]);

    if (!Number.isFinite(year) || !Number.isFinite(value)) return;

    const kgPerKwh = convertToKgPerKwh(value, currentUnit);
    if (!Number.isFinite(kgPerKwh)) return;

    const existing = byCountry.get(currentCountry);
    if (!existing || year > existing.year) {
      byCountry.set(currentCountry, {
        id: toId(currentCountry),
        name: currentCountry,
        year: Math.trunc(year),
        sourceSheet: 'Electricity CN, TW, BR, TH, UK',
        kg_co2e_per_kwh: Number(kgPerKwh.toFixed(12))
      });
    }
  });

  return Array.from(byCountry.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const readJson = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
};

const upsertSource = (sources, nextSource) => {
  const current = Array.isArray(sources) ? [...sources] : [];
  const existingIndex = current.findIndex((source) => source?.id === nextSource.id);

  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...nextSource };
    return current;
  }

  current.push(nextSource);
  return current;
};

const main = async () => {
  const workbook = xlsx.readFile(XLSX_PATH, { cellDates: true });
  const usRows = toRowsArray(workbook.Sheets['Electricity US']);
  const intlRows = toRowsArray(workbook.Sheets['Electricity CN, TW, BR, TH, UK']);

  const us = parseUsAverageFactor(usRows);
  const international = parseInternationalFactors(intlRows);

  if (!us && international.length === 0) {
    throw new Error('No electricity comparison factors were found in the workbook.');
  }

  const countries = [
    ...(us ? [us] : []),
    ...international.filter((entry) => entry.name !== 'US')
  ];

  const payload = await readJson(OUTPUT_PATH);
  const currentFactors = payload?.factors || {};

  const next = {
    ...payload,
    updatedAt: toSourceDate(),
    factors: {
      ...currentFactors,
      analysis: {
        ...(currentFactors.analysis || {}),
        global_comparison_electricity: {
          basis: 'electricity_use_only',
          unit: 'kg_co2e_per_kwh',
          countries,
          notes: 'Comparison values come from workbook electricity grid emission factors and are converted to daily emissions in the UI using user electricity consumption data.'
        }
      }
    },
    sources: upsertSource(payload?.sources, {
      id: 'ghg-protocol-electricity-international',
      title: 'GHG Protocol Electricity Grid Factors (US + CN/TW/BR/TH/UK)',
      url: 'https://ghgprotocol.org/calculation-tools-and-guidance',
      sheets: ['Electricity US', 'Electricity CN, TW, BR, TH, UK']
    })
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(next, null, 2), 'utf8');

  console.log('Updated electricity comparison data in emission-factors.json.');
};

main().catch((error) => {
  console.error('Failed to generate electricity comparison data:', error);
  process.exit(1);
});

