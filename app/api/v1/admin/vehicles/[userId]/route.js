import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles } from '@/lib/db/models';
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export const GET = withAuth( async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    if (decoded.role === 'admin') {
        
        const { userId } = await params;

        if (!userId) {
            return new NextResponse(JSON.stringify({ error: 'Invalid userId' }), {
                status: 404,
                headers: getCorsHeaders(origin),
            });
        }

        const vehicles = await Vehicles.find({ userId });

        if (!vehicles) {
            return new NextResponse(JSON.stringify({ error: 'No vehicles found' }), {
                status: 404,
                headers: getCorsHeaders(origin),
            });
        }

        return NextResponse.json({
            success: true,
            vehicles,
        }, {
            status: 200,
            headers: getCorsHeaders(origin),
        });
        
        
    }else{
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: getCorsHeaders(origin),
        });
    }
});

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req.headers.get("origin") || ""),
  });
}