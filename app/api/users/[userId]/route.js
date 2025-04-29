import { NextRequest } from 'next/server';
import { decodeQR } from '@/lib/middleware/decryptQR';

export async function GET(req) {
    const decodeResponse = await decodeQR(req);
      
    // if (decodeResponse instanceof NextResponse && decodeResponse.status !== 200) {
    // return decodeResponse;
    // } // If object is an instance of ClassName, returns true.

    // const decodedUserId = req.headers.get('x-decoded-user-id');
    // if (!decodedUserId) {
    //     return new Response(JSON.stringify({ error: 'Decoded ID not found' }), {
    //         status: 400,
    //         headers: { 'Content-Type': 'application/json' },
    //     });
    // }

    // e.g. Query a database for user with ID `userId`
    return new Response(JSON.stringify({ title: `User ${decodeResponse} pages` }), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json'
         },
    });
}