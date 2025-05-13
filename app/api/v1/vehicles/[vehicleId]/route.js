import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles } from '@/lib/db/models';
import { withAuth } from '@/lib/auth/withAuth';
import { setCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export const GET = withAuth( async (req, { params }, decoded) => {
    setCorsHeaders(req);
    const { vehicleId } = await params;
    const firebaseUid = decoded.user_id;
    if (!vehicleId) return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });

    const vehicle = await Vehicles.findOne({ vehicleId });

    // 해당 vehicle이 존재하지 않은 경우
    if (!vehicle) return NextResponse.json({ error: 'Invalid vehicleId' }, { status: 400 });

    // 주인이 있는 vehicle인 경우
    // 유저 본인인지, guardian인지 확인


    // const decoded = { // dymmy data
    //     firebaseUid: 'HpErhmIUaoc2q2v9yxkXjji375y2',
    //     phoneNumber: '01012345678',
    //     role: 'user'
    // };

    const loginUser = await Users.findOne({ firebaseUid: firebaseUid });
    const vehicleUser = await Vehicles.findOne({ vehicleId }).populate('userId');

    // front vehicleUser, loginUser is to avoid null access
    if (vehicleUser && loginUser && vehicleUser._id.toString() != loginUser._id.toString()) {
        return NextResponse.json({ error: 'Not the vehicle owner' }, { status: 404 });
    }

    // no owner vehicle OR owner is the same as loginUser
    return NextResponse.json({
        userId: vehicleUser.userId ? vehicleUser.userId.toString() : "",
        vehicleId: vehicle.vehicleId,
        model: vehicle.model,
        purchasedAt: vehicle.purchasedAt ? vehicle.purchasedAt.toISOString() : "", // Date to ISOString
        registeredAt: vehicle.registeredAt ? vehicle.registeredAt.toISOString() : "", // Date to ISOString
    }, { status: 200 });
});
