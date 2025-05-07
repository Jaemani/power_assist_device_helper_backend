import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getVehiclesCollection } from '@/lib/db/models';

export async function GET(req) {
    const vehicles = await getVehiclesCollection();

    let newVehicleId = "ee32568f-0918-40db-b749-441a62c78e21"

    if (!newVehicleId) {
        newVehicleId = uuidv4();
        console.log("Generated new uuid for vehicleId");
    }

    try {
        await vehicles.insertOne({
            vehicleId: newVehicleId,
            userId: null,
            deviceModel: "",
            deviceDate: null,
            createDate: new Date(),
            updateDate: new Date(),
        });
        return new Response(JSON.stringify({ message: "Vehicle created with ID :", newVehicleId }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json'
                },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error creating vehicle with ID' }), {
            status: 400,
            headers: { 
                'Content-Type': 'application/json'
                },
        });
    }
    
}