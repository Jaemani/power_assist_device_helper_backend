import { NextRequest } from 'next/server';

export async function GET(req) {
    const vehicleId = req.nextUrl.searchParams.get('vehicleId');
    if (!vehicleId) return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });

    if (vehicleId)
    return new Response(JSON.stringify({ title: `Vehicle ${vehicleId} pages` }), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json'
         },
    });
}