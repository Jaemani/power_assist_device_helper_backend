import { NextRequest } from 'next/server';
import { getUsersCollection } from '@/lib/db/models';

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