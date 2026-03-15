const fs = require('fs/promises');
const path = require('path');
const xlsx = require('xlsx');

const DEFAULT_URL =
  'https://ghgprotocol.org/sites/default/files/2024-05/Emission_Factors_for_Cross_Sector_Tools_V2.0_0.xlsx';

const downloadFile = async (url, outPath) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download Excel file: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buffer);
  return outPath;
};

const toRows = (sheet) => {
  return xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });
};

const toRowsArray = (sheet) => {
  return xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
};

const listHeaders = (rows) => {
  const firstRow = rows[0] || {};
  return Object.keys(firstRow);
};

const normalizeHeader = (header) => String(header || '').trim().toLowerCase();

const getColumnKey = (row, candidateHeaders) => {
  const keys = Object.keys(row);
  for (const candidate of candidateHeaders) {
    const match = keys.find((key) => normalizeHeader(key) === normalizeHeader(candidate));
    if (match) return match;
  }
  return null;
};

const extractFactors = (rows) => {
  const headerKey = getColumnKey(rows[0] || {}, [
    'fuel',
    'fuel type',
    'fuel/energy',
    'energy carrier',
    'energy type'
  ]);
  const unitKey = getColumnKey(rows[0] || {}, ['unit', 'units']);
  const valueKey = getColumnKey(rows[0] || {}, [
    'kg co2e per unit',
    'kg co2e/unit',
    'kg co2e',
    'kg co2 per unit'
  ]);

  if (!headerKey || !valueKey) {
    return [];
  }

  return rows
    .map((row) => {
      const fuel = String(row[headerKey] || '').trim();
      const unit = String(row[unitKey] || '').trim();
      const value = parseFloat(String(row[valueKey] || '').replace(/,/g, ''));
      return {
        fuel,
        unit,
        value: Number.isFinite(value) ? value : null
      };
    })
    .filter((row) => row.fuel && row.value !== null);
};

const formatSample = (factors) => {
  return factors.slice(0, 15).map((row) => {
    return `- ${row.fuel} (${row.unit}): ${row.value}`;
  });
};

const main = async () => {
  const url = process.argv[2] || DEFAULT_URL;
  const outPath = path.join(process.cwd(), 'data', 'ghg-protocol-factors.xlsx');
  const filePath = await downloadFile(url, outPath);

  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetNames = workbook.SheetNames;

  console.log('Workbook sheets:');
  sheetNames.forEach((name) => console.log(`- ${name}`));

  const sheetResults = [];
  const inspection = [];
  const rawInspection = [];
  const rawSheetTargets = new Set([
    'Stationary Combustion',
    'Mobile Combustion - Fuel Use',
    'Mobile Combustion - Distance',
    'Mobile Combustion - Public',
    'Electricity US'
  ]);

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = toRows(sheet);
    if (!rows.length) continue;

    inspection.push({
      name: sheetName,
      headers: listHeaders(rows),
      sample: rows.slice(0, 3)
    });

    if (rawSheetTargets.has(sheetName)) {
      const rawRows = toRowsArray(sheet);
      rawInspection.push({
        name: sheetName,
        rows: rawRows.slice(0, 20)
      });
    }

    const factors = extractFactors(rows);
    if (!factors.length) continue;

    sheetResults.push({ sheetName, factors });
  }

  console.log('\nDetected factor tables:');
  sheetResults.forEach((sheet) => {
    console.log(`\n${sheet.sheetName}`);
    formatSample(sheet.factors).forEach((line) => console.log(line));
  });

  const summaryPath = path.join(process.cwd(), 'data', 'ghg-protocol-factors.summary.json');
  await fs.writeFile(
    summaryPath,
    JSON.stringify(
      {
        sourceUrl: url,
        extractedAt: new Date().toISOString(),
        sheets: sheetResults.map((sheet) => ({
          name: sheet.sheetName,
          rows: sheet.factors.length,
          sample: sheet.factors.slice(0, 10)
        })),
        inspection: inspection.map((item) => ({
          name: item.name,
          headers: item.headers,
          sample: item.sample
        })),
        rawInspection
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`\nSaved summary to ${summaryPath}`);
};

main().catch((error) => {
  console.error('Failed to parse workbook:', error);
  process.exit(1);
});
