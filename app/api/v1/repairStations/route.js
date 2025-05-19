import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { RepairStations } from '@/lib/db/models'; 
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export const GET = withAuth(async (req, { params }, decoded) => {
    try {
        const stations = await RepairStations.find().lean();

        const simplified = stations.map((station) => ({
            id: station._id.toString(),
            code: station.code,
            state: station.state,
            city: station.city,
            region: station.region,
            address: station.address,
            label: station.label,
            telephone: station.telephone,
            coordinate: station.coordinate.coordinates, // [lng, lat] 만 전달
        }));

        return NextResponse.json({
            stations: simplified,
        }, { status: 200,
            headers: getCorsHeaders(req.headers.get("origin") || ""),
        });
    }catch (error) {
        console.error('Error in GET function:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: getCorsHeaders(req.headers.get("origin") || ""),
        });
    }
});

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req.headers.get("origin") || ""),
  });
}