import { NextResponse } from 'next/server';
import initializeFirebaseAdmin from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

await initializeFirebaseAdmin();

export async function GET(req) {
    try {
        if (!req.headers.get('authorization')) return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
        const token = req.headers.get('authorization').split("Bearer ")[1]; // Extract the token from the header
        if (!token) return NextResponse.json({ error: 'Missing firebase token' }, { status: 400 });


        let role;
        try {
            const decoded = await getAuth().verifytoken(token);
            console.log('Decoded token:', decoded);
            role = decoded.role;

        } catch (error) {
            console.error('Error verifying ID token:', error);
            return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
        }

        if(role === undefined || role === "") {
            return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 }); // decoded but data not correct
        }

        return NextResponse.json({
            role: role,
        }, { status: 200 });

    }catch (error) {
        console.error('Error in GET function:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}