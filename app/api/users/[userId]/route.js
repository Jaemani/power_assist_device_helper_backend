import { NextRequest } from 'next/server';
 
export async function GET(req) {
    const decodedUserId = req.cookies.get('decodedUserId')?.value;

    if (!decodedUserId) {
        return new Response(JSON.stringify({ error: 'Decoded ID not found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
    }

    // e.g. Query a database for user with ID `userId`
    return new Response(JSON.stringify({ title: `User ${decodedUserId} pages` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}