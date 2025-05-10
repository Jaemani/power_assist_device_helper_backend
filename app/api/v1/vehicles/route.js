import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { User, Vehicle } from '@/lib/db/models';

await connectToMongoose();

export async function GET(req) {
    const vehicleId = req.nextUrl.searchParams.get('vehicleId');
    if (!vehicleId) return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });

    const vehicle = await Vehicle.findOne({ vehicleId });

    // 해당 vehicle이 존재하지 않은 경우
    if (!vehicle) return NextResponse.json({ error: 'Invalid vehicleId' }, { status: 400 });

    // 주인 없는 vehicle인 경우
    if (!vehicle.userId) return NextResponse.json({ message: 'new QR with no owner' }, { status: 200 });

    // 주인이 있는 vehicle인 경우
    // 유저 본인인지, guardian인지 확인

    // // 세션유효 확인
    // if (!req.headers.get('authorization')) return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    // else {
    //     const token = req.headers.get('authorization').split(' ')[1];
    //     if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    //     try {
    //         const decoded = verifyToken(token);
    //         if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    //     } catch (error) {
    //         return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    //     }
    // }

    const decoded = { // dymmy data
        uid: 'HpErhmIUaoc2q2v9yxkXjji375y2',
        role: 'user',
        guid: ''
    };

    const loginUser = await User.findOne({ firebaseUid: decoded.uid });
    const vehicleUser = await User.findOne({ _id: vehicle.userId });

    if (vehicleUser._id.toString() === loginUser._id.toString()) {
        return NextResponse.json({ message: 'Succesfully found vehicle & owner' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden: not the vehicle owner' }, { status: 403 });
}
