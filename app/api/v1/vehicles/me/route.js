import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles } from '@/lib/db/models';
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export const GET = withAuth( async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    

    const firebaseUid = decoded.user_id;
    
    const user = await Users.findOne({ firebaseUid });
    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized: no such user' }), {
            status: 401,
            headers: getCorsHeaders(origin),
        });
    }

    const vehicle = await Vehicles.findOne({ userId: user._id }).lean();
    if (!vehicle) {
        return new NextResponse(JSON.stringify({ error: 'No vehicle found for this user' }), {
            status: 404,
            headers: getCorsHeaders(origin),
        });
    }

    // no owner vehicle OR owner is the same as loginUser
    return NextResponse.json({
        vehicleId: vehicle.vehicleId
    }, {
        status: 200,
        headers: getCorsHeaders(origin),
    });
});

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req.headers.get("origin") || ""),
  });
}