import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { RepairStations } from '@/lib/db/models'; 
import { withAuth } from '@/lib/auth/withAuth';
import { setCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export const GET = withAuth(async (req, ctx, decoded) => {
    setCorsHeaders(req);
    try {
        const stations = await RepairStations.find().lean();

        const simplified = stations.map((station) => ({
            code: station.code,
            state: station.state,
            city: station.city,
            region: station.region,
            address: station.address,
            label: station.name,
            telephone: station.telephone,
            coordinate: station.coordinate.coordinates, // [lng, lat] 만 전달
        }));

        return NextResponse.json({
            stations: simplified,
        }, { status: 200 });

    }catch (error) {
        console.error('Error in GET function:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});