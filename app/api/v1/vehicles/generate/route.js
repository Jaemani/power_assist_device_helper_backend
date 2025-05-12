import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectToMongoose from '@/lib/db/connect';
import { Vehicles } from '@/lib/db/models';

await connectToMongoose();

export async function GET(req) {

    let newVehicleId;

    if (!newVehicleId) {
        newVehicleId = uuidv4();
        console.log("Generated new uuid for vehicleId");
    }

    try {

        const newVehicle = Vehicles({
            vehicleId: newVehicleId,
            userId: null,
            model: "",
            purchasedAt: null,
            registeredAt: null,
        });

        await newVehicle.save();


        return NextResponse.json({ message: "Vehicle created with ID :", newVehicleId }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Error creating vehicle with ID', detail: error.message }, { status: 400 });
    }
}
