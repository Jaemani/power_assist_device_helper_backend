import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles } from '@/lib/db/models'; 
import mongoose from 'mongoose';
import { withAuth } from '@/lib/auth/withAuth';
import { getAuth } from 'firebase-admin/auth'
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();


export const POST = withAuth(async (req, { params }, decoded) => {
    try {
        const {name, vehicleId, model, purchasedAt, registeredAt, recipientType} = await req.json();
        const firebaseUid = decoded.user_id;
        const phoneNumber = decoded.phone_number;
        const role = 'user'

        try {
            if (firebaseUid === undefined || firebaseUid === "" || phoneNumber === undefined || phoneNumber === "") {
                return new NextResponse(JSON.stringify({ error: 'Invalid ID token' }), {
                    status: 401,
                    headers: getCorsHeaders(req.headers.get("origin") || ""),
                    credentials: "include",
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
                    headers: getCorsHeaders(req.headers.get("origin") || ""),
                    credentials: "include",
                });
            }

            if (vehicle.userId !== null) {
                return new NextResponse(JSON.stringify({ error: 'This Vehicle has an owner' }), {
                    status: 403,
                    headers: getCorsHeaders(req.headers.get("origin") || ""),
                    credentials: "include",
                });
            }

            const user = await Users.findOne({ firebaseUid });
            if (user) {
                return new NextResponse(JSON.stringify({ error: 'User already exists' }), {
                    status: 409,
                    headers: getCorsHeaders(req.headers.get("origin") || ""),
                    credentials: "include",
                });
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

            //사용자 토큰에 user역할을 붙여줌
            //ID 토큰에 role 커스텀 클레이 추가
            await getAuth().setCustomUserClaims(firebaseUid, { role })

            await Vehicles.updateOne(
                { _id: vehicle._id }, // filter
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
                vehicleId: vehicle.vehicleId,
            }, { 
                status: 201,
                headers: getCorsHeaders(req.headers.get("origin") || "") 
            });

        } catch (error) {
            console.error('Error creating user:', error);
            return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: getCorsHeaders(req.headers.get("origin") || ""),
                credentials: "include",
            });
        }

    }catch (error) {
        console.error('Error in POST function:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: getCorsHeaders(req.headers.get("origin") || ""),
            credentials: "include",
        });
    }
});

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req.headers.get("origin") || ""),
    credentials: "include",
  });
}