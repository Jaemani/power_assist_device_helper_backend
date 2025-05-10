import { NextResponse } from 'next/server';
import { connectToMongoose } from '@/lib/db/connect';
import { User, Guardian } from '@/db/models';
import { getAuth } from 'firebase-admin/auth';

await connectToMongoose();

export async function POST(req) {
    const { idToken, phoneNumber, role, vehicleId } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'Missing firebase idToken' }, { status: 400 });

    const decoded = await getAuth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    const users = await getUsersCollection();
    const guardians = await getGuardiansCollection();

    try {
        const user = await users.findOne({ firebaseUid });
        if (user) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        await users.insertOne({
            firebaseUid,
            phoneNumber,
            role,
            vehicleIds: [vehicleId], // array of ObjectId
            guardianIds: [], // array of ObjectId
            createDate: new Date(),
            updateDate: new Date(),
        });

        return NextResponse.json({ message: 'new User Registered!' }, { status: 200 });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }
}
