import { NextRequest } from 'next/server';

export async function GET(req) {
    const id = req.nextUrl.pathname.split('/').pop(); // Get id from QR
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    return new Response(JSON.stringify({ title: `Vehicle ${id} pages` }), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json'
         },
    });
}