import { NextResponse } from 'next/server';
import { getTopMovers, getMarketWinnersAndLosers, getCurrentWeekStart } from '@/lib/market-stock-exchange';
export const runtime = 'nodejs';
// Cache 1 heure - les fluctuations du marché sont fictives/hebdomadaires
export const revalidate = 3600;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment') || 'femme';
    const marketZone = searchParams.get('marketZone') || 'EU';

    const topMovers = getTopMovers(segment, marketZone);
    const { winners, losers } = getMarketWinnersAndLosers(segment, marketZone);

    const response = NextResponse.json({
        updatedAt: new Date(),
        weekStart: getCurrentWeekStart(),
        topMovers,
        winners,
        losers
    });
    // Cache CDN 1 heure
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return response;
}
