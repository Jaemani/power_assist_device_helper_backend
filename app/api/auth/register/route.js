import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto'; // generator random string
import { encryptString } from '@/lib/auth/stringCipher';
 
export async function POST(req) {
    const body = await req.json();
    const kakaoId = body.kakaoId; // must access after await

    if (!kakaoId) {
        return new Response(JSON.stringify({ error: 'kakaoId missing' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const userId = randomBytes(32).toString('hex'); // 2^256 possibilities
    console.log(userId);
    const encodedId = encryptString(userId);
    console.log(encodedId)

    return new Response(JSON.stringify({ message: `kakaoId: ${kakaoId}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}