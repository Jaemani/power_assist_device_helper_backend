import { NextResponse } from 'next/server';
import { connectToMongoose } from '@/lib/db/connect';
import { initializeFirebaseAdmin} from '@/lib/firebaseAdmin';
// import { User } from '@/lib/db/models'; 
import { getAuth } from 'firebase-admin/auth';

// await connectToMongoose();
await connectToMongoose();
await initializeFirebaseAdmin();

export async function POST(req) {

    const { idToken, phoneNumber, role, vehicleId } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'Missing firebase idToken' }, { status: 400 });

    try {
        const decoded = await getAuth().verifyIdToken(idToken);
        console.log('Decoded token:', decoded);
        const firebaseUid = decoded.uid;

        return NextResponse.json({ message: 'User Registered!' }, { status: 200 });

    } catch (error) {
        console.error('Error verifying ID token:', error);
        return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
    }


    // try {
    //     const user = await User.findOne({ firebaseUid });
    //     if (user) {
    //         return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    //     }

    //     await User.insertOne({
    //         firebaseUid,
    //         phoneNumber,
    //         role,
    //         vehicleIds: [vehicleId], // array of ObjectId
    //         guardianIds: [], // array of ObjectId
    //     });

    //     return NextResponse.json({ message: 'new User Registered!' }, { status: 200 });

    // } catch (error) {
    //     console.error('Error creating user:', error);
    //     return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    // }
}
