# GHG Protocol Excel Ingestion

This folder contains scripts for parsing the GHG Protocol emission factor workbook and updating `data/emission-factors.json`.

## Quick Run

```bash
npm run ingest:ghg
```

Generate workbook-based global comparison data for the calculator chart:

```bash
npm run ingest:electricity-comparison
```

Run both updates together (recommended yearly refresh command):

```bash
npm run ingest:all
```

## Notes

- The script downloads the Excel file if `data/ghg-protocol-factors.xlsx` is missing.
- Parsed values are merged into `data/emission-factors.json` and the `updatedAt` date is refreshed.
- Electricity comparison bars (US + available CN/TW/BR/TH/UK entries) are generated from workbook sheets only.
- Update the source URL by passing it as the first argument:

```bash
node scripts/ingest-ghg-excel.js "https://example.com/your.xlsx"
```

