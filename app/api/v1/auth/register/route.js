import { NextResponse } from 'next/server';
import { connectToMongoose } from '@/lib/db/connect';
import initializeFirebaseAdmin from '@/lib/firebaseAdmin';
import { User } from '@/lib/db/models'; 
import { getAuth } from 'firebase-admin/auth';

// await connectToMongoose();
await connectToMongoose();
await initializeFirebaseAdmin();

export async function POST(req) {
    try {
        const { idToken, phoneNumber, role } = await req.json();
        if (!idToken) return NextResponse.json({ error: 'Missing firebase idToken' }, { status: 400 });

        let firebaseUid;
        try {
            const decoded = await getAuth().verifyIdToken(idToken);
            console.log('Decoded token:', decoded);
            firebaseUid = decoded.uid;

        } catch (error) {
            console.error('Error verifying ID token:', error);
            return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
        } 


        try {
            if (firebaseUid === undefined) {
                return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
            }
            
            const user = await User.findOne({ firebaseUid });
            if (user) {
                return NextResponse.json({ error: 'User already exists' }, { status: 400 });
            }

            await User.insertOne({
                firebaseUid,
                phoneNumber,
                role,
                guardianIds: [], // array of ObjectId
            });

            return NextResponse.json({ message: 'new User Registered!' }, { status: 200 });

        } catch (error) {
            console.error('Error creating user:', error);
            return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
        }

    }catch (error) {
        console.error('Error in POST function:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
