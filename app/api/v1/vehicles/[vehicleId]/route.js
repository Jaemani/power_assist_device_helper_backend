import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles } from '@/lib/db/models';
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export const GET = withAuth( async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";

    const { vehicleId } = await params;
    const firebaseUid = decoded.user_id;
    if (!vehicleId) {
        return new NextResponse(JSON.stringify({ error: 'Invalid vehicleId' }), {
            status: 404,
            headers: getCorsHeaders(origin),
        });
    }
    const vehicle = await Vehicles.findOne({ vehicleId });

    // 해당 vehicle이 존재하지 않은 경우
    if (!vehicle) {
        return new NextResponse(JSON.stringify({ error: 'Invalid vehicleId' }), {
            status: 404,
            headers: getCorsHeaders(origin),
        });
    }
    // 주인이 있는 vehicle인 경우
    // 유저 본인인지, guardian인지 확인


    // const decoded = { // dymmy data
    //     firebaseUid: 'HpErhmIUaoc2q2v9yxkXjji375y2',
    //     phoneNumber: '01012345678',
    //     role: 'user'
    // };

    const loginUser = await Users.findOne({ firebaseUid: firebaseUid });
    const vehicleUserId = vehicle?.userId

    // front vehicleUserId, loginUser is to avoid null access
    if (vehicleUserId && loginUser && vehicleUserId.toString() != loginUser._id.toString()) {
        return new NextResponse(JSON.stringify({ error: 'Not the vehicle owner' }), {
            status: 403,
            headers: getCorsHeaders(origin),
        });
    }

    // no owner vehicle OR owner is the same as loginUser
    return NextResponse.json({
        userId: vehicleUserId ? vehicleUserId.toString() : "",
        vehicleId: vehicle.vehicleId,
        model: vehicle.model,
        purchasedAt: vehicle.purchasedAt ? vehicle.purchasedAt.toISOString() : "", // Date to ISOString
        registeredAt: vehicle.registeredAt ? vehicle.registeredAt.toISOString() : "", // Date to ISOString
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