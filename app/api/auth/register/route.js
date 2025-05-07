import { NextRequest } from 'next/server';

export async function POST(req) {
    const body = await req.json();

    const { uid, nickname, vehicleId } = body;

    return new Response(JSON.stringify({ 
        message: `new User Registered!`, 
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}