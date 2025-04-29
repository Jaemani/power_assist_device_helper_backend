import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
    const body = await req.json();
    const kakaoId = body.kakaoId; // must access after await

    if (!kakaoId) {
        return new Response(JSON.stringify({ error: 'kakaoId missing' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const vehicleId = uuidv4();

    return new Response(JSON.stringify({ 
        message: `new Vehicle ID generated!`, 
        vehicleId: vehicleId
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}