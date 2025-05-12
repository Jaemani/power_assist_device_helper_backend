import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import initializeFirebaseAdmin from '@/lib/firebaseAdmin';
import { Users, Vehicles } from '@/lib/db/models'; 
import { getAuth } from 'firebase-admin/auth';
import mongoose from 'mongoose';

// await connectToMongoose();
await connectToMongoose();
await initializeFirebaseAdmin();

export async function POST(req) {
    try {
        // const authHeader = req.headers.authorization || "";
        // const idToken = authHeader.split("Bearer ")[1]; // Extract the token from the header
        // if (!idToken) return NextResponse.json({ error: 'Missing firebase idToken' }, { status: 400 });

        const {name, model, purchasedAt, registeredAt, recipientType} = await req.json();

        // let firebaseUid, phoneNumber;
        // try {
        //     const decoded = await getAuth().verifyIdToken(idToken);
        //     console.log('Decoded token:', decoded);
        //     firebaseUid = decoded.user_id;
        //     phoneNumber = decoded.phone_number;

        // } catch (error) {
        //     console.error('Error verifying ID token:', error);
        //     return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
        // } 


        try {
            // if (firebaseUid === undefined || firebaseUid === "" || phoneNumber === undefined || phoneNumber === "") {
            //     return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 }); // decoded but data not correct
            // }
            
            // dummy decoded data
            const firebaseUid = "test"
            const phoneNumber = "01012345678"
            const role = "user"

            // find a random vehicle that has no owner
            const result = await Vehicles.aggregate([
                { $match: { userId: null } },
                { $sample: { size: 1 } }
            ]);
            const randomVehicle = result[0];
            if (!randomVehicle) {
                return NextResponse.json({ error: 'No available vehicle found' }, { status: 404 });
            }


            const user = await Users.findOne({ firebaseUid });
            if (user) {
                return NextResponse.json({ error: 'User already exists' }, { status: 409 });
            }

            // new user
            const newUser = new Users({
                name,
                firebaseUid, // from decoded token
                phoneNumber, // from decoded token
                role, // from decoded token
                recipientType,
                guardianIds: [], // array of ObjectId, empty at first. type by manager manually later
            });
            
            await newUser.save();

            await Vehicles.updateOne(
                { _id: randomVehicle._id }, // filter
                { $set: { 
                    userId:new mongoose.Types.ObjectId(newUser._id.toString()) , // newly generated user's ObjectId
                    model: model,
                    purchasedAt: new Date(purchasedAt), // ISOString to Date
                    registeredAt: new Date(registeredAt), // ISOString to Date
                 } } // update
            );

            return NextResponse.json({ 
                userId: newUser._id.toString(), // ourput newly generated ObjectId
                name: newUser.name,
                phoneNumber: newUser.phoneNumber,
                role: newUser.role,
                recipientType: newUser.recipientType,
                vehicleId: randomVehicle.vehicleId,
            }, { status: 201 });

        } catch (error) {
            console.error('Error creating user:', error);
            return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
        }

    }catch (error) {
        console.error('Error in POST function:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
