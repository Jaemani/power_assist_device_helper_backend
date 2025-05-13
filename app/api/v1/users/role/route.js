import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';

export const GET = withAuth(async (req, ctx, decoded) => {
    const origin = req.headers.get("origin") || "";

    try {
        const role = decoded.role; // Extract the role from the decoded token

        return new NextResponse(JSON.stringify({ role }), {
            status: 200,
            headers: getCorsHeaders(origin),
        });

    }catch (error) {
        console.error('Error in GET function:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: getCorsHeaders(origin),
        });
    }
});

export async function OPTIONS(req) {
  const origin = req.headers.get("origin") || "";
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}