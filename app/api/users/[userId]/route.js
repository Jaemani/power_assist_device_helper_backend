import { NextRequest } from 'next/server';
import { decryptString } from "@/lib/auth/stringCipher";

export async function GET(req) {
    const id = req.nextUrl.pathname.split('/').pop(); // Get id from QR
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const decoded = decryptString(id);
    if (!decoded) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    return new Response(JSON.stringify({ title: `User ${decoded} pages` }), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json'
         },
    });
}