import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_EMISSION_FACTORS } from './footprint';

const DATA_PATH = path.join(process.cwd(), 'data', 'emission-factors.json');
const SOURCES_PATH = path.join(process.cwd(), 'data', 'emission-factors.sources.json');
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const DEFAULT_STATEMENT =
  'Emission factors are periodically updated using the GHG Protocol Cross-Sector Tools workbook and U.S. EPA eGRID electricity datasets to cover stationary combustion, purchased electricity, public transportation, and flight activity with current published defaults.';

let cachedFactors = null;

const readJsonFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

const writeJsonFile = async (filePath, data) => {
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, 'utf8');
};

const toTimestamp = (value) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.getTime() : 0;
};

const isStale = (data) => {
  if (!data?.updatedAt) return true;
  const updatedAt = toTimestamp(data.updatedAt);
  if (!updatedAt) return true;
  return Date.now() - updatedAt > CACHE_TTL_MS;
};

const splitCsvLine = (line) => {
  const pattern = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/g;
  return line.split(pattern).map((value) => value.replace(/^"|"$/g, '').trim());
};

const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((acc, header, idx) => {
      acc[header] = values[idx] ?? '';
      return acc;
    }, {});
  });
};

const getDeepValue = (obj, pathValue) => {
  if (!pathValue) return undefined;
  return pathValue.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

const setDeepValue = (obj, pathValue, value) => {
  const keys = pathValue.split('.');
  let current = obj;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
      return;
    }
    current[key] = current[key] || {};
    current = current[key];
  });
};

const applyRowFilter = (rows, rowFilter) => {
  if (!rowFilter) return rows;
  return rows.filter((row) => {
    return Object.entries(rowFilter).every(([key, expected]) => {
      return String(row[key] || '').trim() === String(expected).trim();
    });
  });
};

const extractFromCsv = (rows, source) => {
  const filtered = applyRowFilter(rows, source.rowFilter);
  const row = filtered[0];
  if (!row) return null;
  const raw = row[source.valueColumn];
  const value = parseFloat(String(raw).replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
};

const extractFromJson = (data, source) => {
  if (source.valuePath) {
    const value = getDeepValue(data, source.valuePath);
    const parsed = Number.isFinite(value) ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeValue = (value, source) => {
  if (!Number.isFinite(value)) return null;
  if (typeof source.multiplier === 'number') {
    return value * source.multiplier;
  }
  return value;
};

const loadSourcesConfig = async () => {
  return (await readJsonFile(SOURCES_PATH)) || {};
};

const normalizePayload = (payload) => {
  const factors = payload?.factors || payload || {};
  return {
    updatedAt: payload?.updatedAt || new Date().toISOString().split('T')[0],
    statement: payload?.statement || DEFAULT_STATEMENT,
    sources: payload?.sources || [],
    factors: {
      ...DEFAULT_EMISSION_FACTORS,
      ...(factors || {})
    }
  };
};

export const refreshEmissionFactors = async ({ writeToDisk = true, force = false } = {}) => {
  const currentRaw = (await readJsonFile(DATA_PATH)) || cachedFactors || {};
  const current = normalizePayload(currentRaw);
  const sources = await loadSourcesConfig();
  const updates = [];

  for (const source of Object.values(sources)) {
    if (!source?.url || !source?.targetPath) continue;
    if (source.enabled === false) continue;

    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'SustainabilityClubWebsite/1.0'
        }
      });

      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      let value = null;

      if (source.type === 'json' || contentType.includes('application/json') || source.url.endsWith('.json')) {
        const data = JSON.parse(text);
        value = extractFromJson(data, source);
      } else {
        const rows = parseCsv(text);
        value = extractFromCsv(rows, source);
      }

      value = normalizeValue(value, source);

      if (Number.isFinite(value)) {
        updates.push({ targetPath: source.targetPath, value });
      }
    } catch (error) {
      // Ignore transient source refresh failures and keep existing cached factors.
    }
  }

  if (!updates.length && !force) {
    cachedFactors = current;
    return current;
  }

  const next = { ...current, factors: { ...current.factors } };
  updates.forEach(({ targetPath, value }) => {
    setDeepValue(next, targetPath, value);
  });

  next.updatedAt = new Date().toISOString().split('T')[0];

  cachedFactors = next;

  if (writeToDisk) {
    try {
      await writeJsonFile(DATA_PATH, next);
    } catch (error) {
      // Ignore write errors in read-only environments.
    }
  }

  return next;
};

export const getEmissionFactors = async ({ allowRefresh = true } = {}) => {
  if (!cachedFactors) {
    cachedFactors = normalizePayload((await readJsonFile(DATA_PATH)) || {});
  }

  if (allowRefresh && isStale(cachedFactors)) {
    cachedFactors = await refreshEmissionFactors({ writeToDisk: true });
  }

  return cachedFactors;
};
