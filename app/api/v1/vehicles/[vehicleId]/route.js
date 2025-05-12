import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import initializeFirebaseAdmin from '@/lib/firebaseAdmin';
import { Users, Vehicles } from '@/lib/db/models';
import { getAuth } from 'firebase-admin/auth';

await connectToMongoose();
await initializeFirebaseAdmin();

export async function GET(req, { params } ) {
    const { vehicleId } = await params;
    if (!vehicleId) return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });

    const vehicle = await Vehicles.findOne({ vehicleId });

    // 해당 vehicle이 존재하지 않은 경우
    if (!vehicle) return NextResponse.json({ error: 'Invalid vehicleId' }, { status: 400 });

    // 주인이 있는 vehicle인 경우
    // 유저 본인인지, guardian인지 확인

    // 세션유효 확인
    if (!req.headers.get('authorization')) return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    else {
        const token = req.headers.get('authorization').split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: 'Missing firebase token' }, { status: 401 });
        try {
            const decoded = await getAuth().verifytoken(token);
            if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        } catch (error) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
    }

    // const decoded = { // dymmy data
    //     firebaseUid: 'HpErhmIUaoc2q2v9yxkXjji375y2',
    //     phoneNumber: '01012345678',
    //     role: 'user'
    // };

    const loginUser = await Users.findOne({ firebaseUid: decoded.uid });
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
}
