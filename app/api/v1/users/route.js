import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles } from '@/lib/db/models'; 
import mongoose from 'mongoose';
import { withAuth } from '@/lib/auth/withAuth';
import { getAuth } from 'firebase-admin/auth'
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();


export const POST = withAuth(async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    console.log("POST users/");
    try {
        const body = await req.json();
        const {name, vehicleId, model, purchasedAt, registeredAt, recipientType,smsConsent} = body;
        const firebaseUid = decoded.user_id;
        const phoneNumber = decoded.phone_number;
        const role = 'user'

        try {   
            if (typeof smsConsent !== 'boolean') {
              return new NextResponse(
                JSON.stringify({ error: 'Missing or invalid smsConsent' }),
                { status: 400, headers: getCorsHeaders(origin) }
              );
            }

            if (firebaseUid === undefined || firebaseUid === "" || phoneNumber === undefined || phoneNumber === "") {
                return new NextResponse(JSON.stringify({ error: 'Invalid ID token' }), {
                    status: 401,
                    headers: getCorsHeaders(origin),
                    
                });
            }
            
            const user = await Users.findOne({ firebaseUid });

            if (user) {
                console.log("Response users/ User exsist. ")
                console.log(firebaseUid ? firebaseUid.toString() : "No firebase uid");
                return new NextResponse(JSON.stringify({ error: 'User already exists' }), {
                    status: 409,
                    headers: getCorsHeaders(origin),
                    
                });
            }
            
            if (Object.keys(body).length === 0) {
                console.log("Response users/ is new User. ")
                console.log(firebaseUid ? firebaseUid.toString() : "No firebase uid");
                return new NextResponse(JSON.stringify({ message: 'new User' }), {
                    status: 200,
                    headers: getCorsHeaders(origin),
                });
            }
            // // dummy decoded data
            // const firebaseUid = "test"
            // const phoneNumber = "01012345678"
            // const role = "user"

            // find a vehicle
            const vehicle = await Vehicles.findOne({ vehicleId: vehicleId });
            if (!vehicle) {
                return new NextResponse(JSON.stringify({ error: 'Invalid vehicleId' }), {
                    status: 404,
                    headers: getCorsHeaders(origin),
                    
                });
            }

            if (vehicle.userId !== null) {
                return new NextResponse(JSON.stringify({ error: 'This Vehicle has an owner' }), {
                    status: 403,
                    headers: getCorsHeaders(origin),
                    
                });
            }

            // new user
            const newUser = new Users({
                name,
                firebaseUid, // from decoded token
                phoneNumber, // from decoded token
                role, // default role = 'user'
                recipientType,
                smsConsent,
                guardianIds: [], // array of ObjectId, empty at first. type by manager manually later
            });
            
            await newUser.save();
            console.log("Response users/ new User created. ")
            console.log(firebaseUid ? firebaseUid.toString() : "no Firebase uid");
            console.log(newUser);

            await Vehicles.updateOne(
                { _id: vehicle._id }, // filter
                { $set: { 
                    userId:new mongoose.Types.ObjectId(newUser._id.toString()) , // newly generated user's ObjectId
                    model: model,
                    purchasedAt: new Date(purchasedAt), // ISOString to Date
                    registeredAt: new Date(registeredAt), // ISOString to Date
                 } } // update
            );

            console.log("Response users/ Vehicle updated. ")
            console.log(vehicle ? vehicle._id.toString() : "no vehicle id");
            return NextResponse.json({ 
                userId: newUser._id.toString(), // ourput newly generated ObjectId
                name: newUser.name,
                phoneNumber: newUser.phoneNumber,
                role: newUser.role,
                recipientType: newUser.recipientType,
                smsConsent: newUser.smsConsent,
                vehicleId: vehicle.vehicleId,
            }, { 
                status: 201,
                headers: getCorsHeaders(origin) 
            });

        } catch (error) {
            console.error('Error creating user:', error);
            return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: getCorsHeaders(origin),
                
            });
        }

    }catch (error) {
        console.error('Error in POST function:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: getCorsHeaders(origin),
            
        });
    }
});

export async function OPTIONS(req) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
    });
}
