import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';
import connectToMongoose from '@/lib/db/connect';
import Users from '@/lib/db/models/Users';

await connectToMongoose();

export const GET = withAuth(async (req, ctx, decoded) => {
    const origin = req.headers.get("origin") || "";

    try {
        const firebaseUid = decoded.user_id;
        const user = await Users.findOne({ firebaseUid });
        if (!user) {
            return new NextResponse(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: getCorsHeaders(origin),
            });
        }
        return new NextResponse(JSON.stringify({ role: user.role }), {
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