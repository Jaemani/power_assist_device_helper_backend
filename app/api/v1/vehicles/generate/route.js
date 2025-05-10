import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToMongoose } from '@/lib/db/connect';
import Vehicle from '@/db/models';

await connectToMongoose();

export async function GET(req) {
    const vehicles = await getVehiclesCollection();

    let newVehicleId = "ee32568f-0918-40db-b749-441a62c78e21";

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
        return NextResponse.json({ message: "Vehicle created with ID :", newVehicleId }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Error creating vehicle with ID' }, { status: 400 });
    }
}
