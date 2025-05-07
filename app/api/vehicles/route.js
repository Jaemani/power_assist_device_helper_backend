import { NextResponse } from 'next/server';
import { getVehiclesCollection, getUsersCollection, ObjectId } from '@/lib/db/models';

export async function GET(req) {
    const vehicleId = req.nextUrl.searchParams.get('vehicleId');
    if (!vehicleId) return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });

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
        return new Response(JSON.stringify({ message: 'new QR' }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json'
             },
        });
    }

    // 주인이 있는 vehicle인 경우
    // 유저 본인인지, guardian인지 확인은 login 시에 진행
    return new Response(JSON.stringify({ message: 'Succesfully fond vehicle' }), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json'
         },
    });
}