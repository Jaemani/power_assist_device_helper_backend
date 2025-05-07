import { NextResponse } from 'next/server';
import { getVehiclesCollection, getUsersCollection, ObjectId } from '@/lib/db/models';
import { verifyToken } from '@/lib/auth/JWT';

export async function GET(req) {
    const vehicleId = req.nextUrl.searchParams.get('vehicleId');
    if (!vehicleId) return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });

    const users = await getUsersCollection();
    const vehicles = await getVehiclesCollection();
    const vehicle = await vehicles.findOne({ vehicleId });

    // 해당 vehicle이 존재하지 않은 경우
    if(!vehicle) {
        return new Response(JSON.stringify({ error: 'Invalid vehicleId' }), {
            status: 400,
            headers: { 
                'Content-Type': 'application/json'
             },
        });
    }

    // 주인 없는 vehicle인 경우
    if(!vehicle.userId){
        return new Response(JSON.stringify({ message: 'new QR with no owner' }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json'
             },
        });
    }

    // 주인이 있는 vehicle인 경우
    // 유저 본인인지, guardian인지 확인

    // // 세션유효 확인
    // if (!req.headers.get('authorization')) {
    //     return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
    //         status: 401,
    //         headers: { 
    //             'Content-Type': 'application/json'
    //          },
    //     });
    // }else {
    //     const token = req.headers.get('authorization').split(' ')[1];
    //     if (!token) {
    //         return new Response(JSON.stringify({ error: 'Missing token' }), {
    //             status: 401,
    //             headers: { 
    //                 'Content-Type': 'application/json'
    //              },
    //         });
    //     }
    //     try {
    //         const decoded = verifyToken(token);
    //         if (!decoded) {
    //             return new Response(JSON.stringify({ error: 'Invalid token' }), {
    //                 status: 401,
    //                 headers: { 
    //                     'Content-Type': 'application/json'
    //                  },
    //             });
    //         }
    //     } catch (error) {
    //         return new Response(JSON.stringify({ error: 'Invalid token' }), {
    //             status: 401,
    //             headers: { 
    //                 'Content-Type': 'application/json'
    //              },
    //         });
    //     }
    // }

    const decoded = {
        uid: '681ba925f07406f9e0a87090',
        role: 'user',
        guid: ''
    };

    const user = await users.findOne({ _id: new ObjectId(decoded.uid) });
    for(let uVehicle of user.vehicleIds){ // user might have multiple vehicles
        console.log(vehicleId, uVehicle, vehicle.userId.toString(), decoded.uid);
        if(vehicleId === uVehicle && vehicle.userId.toString() === decoded.uid){
            return new Response(JSON.stringify({ message: 'Succesfully found vehicle & owner' }), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json'
                 },
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Matched user not found' }), {
        status: 400,
        headers: { 
            'Content-Type': 'application/json'
         },
    });
}