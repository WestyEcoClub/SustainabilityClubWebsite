import { NextResponse } from 'next/server';
import { calculateFootprint } from '@/lib/footprint';
import { getEmissionFactors, refreshEmissionFactors } from '@/lib/emissionFactors';

export const runtime = 'nodejs';

const DEFAULT_STATEMENT =
  'Emission factors are periodically updated using the GHG Protocol Cross-Sector Tools workbook and U.S. EPA eGRID electricity datasets to cover stationary combustion, purchased electricity, public transportation, and flight activity with current published defaults.';

const normalizeSelections = (selections) => {
  return Array.isArray(selections) ? selections : [];
};

export async function POST(request) {
  try {
    const body = await request.json();
    const selections = normalizeSelections(body?.selections);

    if (!selections.length) {
      return NextResponse.json({
        current: { totals: { dailyFootprint: '0.00' }, categories: {} },
        simulated: { totals: { dailyFootprint: '0.00' }, categories: {} },
        meta: {
          updatedAt: null,
          statement: DEFAULT_STATEMENT,
          sources: []
        }
      });
    }

    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    const factorPayload = forceRefresh
      ? await refreshEmissionFactors({ writeToDisk: true, force: true })
      : await getEmissionFactors();

    const factors = factorPayload?.factors || {};

    const current = calculateFootprint(body?.data, selections, factors);
    const simulated = calculateFootprint(body?.simulationData || body?.data, selections, factors);

    return NextResponse.json({
      current,
      simulated,
      meta: {
        updatedAt: factorPayload?.updatedAt || null,
        statement: factorPayload?.statement || DEFAULT_STATEMENT,
        sources: factorPayload?.sources || []
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request payload.' },
      { status: 400 }
    );
  }
}

