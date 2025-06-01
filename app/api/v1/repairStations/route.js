import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { RepairStations, Admins } from '@/lib/db/models'; 
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export const GET = withAuth(async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    const { searchParams } = new URL(req.url);
    const adminParam = searchParams.get('admin');
    
    // If admin=current and user is admin, return only their repair station
    if (adminParam === 'current' && decoded?.role === 'admin') {
        try {
            console.log('Admin current repair station GET called with decoded:', decoded);
            
            if (!decoded.id) {
                return NextResponse.json(
                    { success: false, message: 'Admin ID not found in token' },
                    { status: 400, headers: getCorsHeaders(origin) }
                );
            }
            
            // Find the admin first
            const admin = await Admins.findOne({ id: decoded.id });
            console.log('Found admin:', admin ? 'Yes' : 'No');
            console.log('Admin repairStation ID:', admin?.repairStation);
            
            if (!admin) {
                return NextResponse.json(
                    { success: false, message: 'Admin not found' },
                    { status: 404, headers: getCorsHeaders(origin) }
                );
            }

            if (!admin.repairStation) {
                return NextResponse.json(
                    { success: false, message: 'Admin has no repair station assigned' },
                    { status: 404, headers: getCorsHeaders(origin) }
                );
            }

            // Find the repair station directly by ID
            const repairStation = await RepairStations.findById(admin.repairStation);
            console.log('Found repair station:', repairStation ? 'Yes' : 'No');
            
            if (!repairStation) {
                return NextResponse.json(
                    { success: false, message: 'Repair station not found' },
                    { status: 404, headers: getCorsHeaders(origin) }
                );
            }

            console.log('Repair station aid:', repairStation.aid);

            return NextResponse.json({
                success: true,
                repairStation: {
                    _id: repairStation._id,
                    code: repairStation.code,
                    label: repairStation.label,
                    aid: repairStation.aid || [0, 0, 0]
                }
            }, { headers: getCorsHeaders(origin) });
        } catch (error) {
            console.error('Error getting admin repair station:', error);
            console.error('Error stack:', error.stack);
            return NextResponse.json(
                { success: false, message: 'Internal server error', error: error.message },
                { status: 500, headers: getCorsHeaders(origin) }
            );
        }
    }
    
    // Default behavior: return all repair stations
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
            aid: station.aid || [0, 0, 0] // Include aid field for aid calculations
        }));

        return NextResponse.json({
            stations: simplified,
        }, { status: 200,
            headers: getCorsHeaders(origin),
        });
    }catch (error) {
        console.error('Error in GET function:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: getCorsHeaders(origin),
        });
    }
});

// PUT - Update current admin's repair station aid values (admin only)
export const PUT = withAuth(async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    
    if (decoded.role === 'admin') {
        try {
            console.log('Admin repair station PUT called with decoded:', decoded);
            const { aid } = await req.json();
            console.log('Received aid values:', aid);
            
            // Validate aid array
            if (!Array.isArray(aid) || aid.length !== 3 || !aid.every(val => typeof val === 'number' && val >= 0)) {
                console.log('Invalid aid array:', aid);
                return NextResponse.json(
                    { success: false, message: 'Invalid aid values. Must be array of 3 non-negative numbers.' },
                    { status: 400, headers: getCorsHeaders(origin) }
                );
            }

            // Find the admin and get their repair station
            const admin = await Admins.findOne({ id: decoded.id });
            console.log('Found admin:', admin ? 'Yes' : 'No');
            console.log('Admin repairStation ID:', admin?.repairStation);
            
            if (!admin) {
                return NextResponse.json(
                    { success: false, message: 'Admin not found' },
                    { status: 404, headers: getCorsHeaders(origin) }
                );
            }

            console.log('About to update repair station with ID:', admin.repairStation);
            console.log('New aid values:', aid);

            // Check current values before update
            const currentRepairStation = await RepairStations.findById(admin.repairStation);
            console.log('Current repair station aid before update:', currentRepairStation?.aid);

            // Update the repair station's aid values
            const updatedRepairStation = await RepairStations.findByIdAndUpdate(
                admin.repairStation,
                { aid },
                { new: true }
            );

            console.log('Update operation completed');
            console.log('Updated repair station exists:', updatedRepairStation ? 'Yes' : 'No');
            console.log('Updated aid values:', updatedRepairStation?.aid);

            // Double-check by fetching from database again
            const verifyRepairStation = await RepairStations.findById(admin.repairStation);
            console.log('Verification fetch - aid values in DB:', verifyRepairStation?.aid);

            if (!updatedRepairStation) {
                return NextResponse.json(
                    { success: false, message: 'Repair station not found' },
                    { status: 404, headers: getCorsHeaders(origin) }
                );
            }

            return NextResponse.json({
                success: true,
                repairStation: {
                    _id: updatedRepairStation._id,
                    code: updatedRepairStation.code,
                    label: updatedRepairStation.label,
                    aid: updatedRepairStation.aid
                }
            }, { headers: getCorsHeaders(origin) });
        } catch (error) {
            console.error('Error updating repair station:', error);
            return NextResponse.json(
                { success: false, message: 'Internal server error' },
                { status: 500, headers: getCorsHeaders(origin) }
            );
        }
    } else {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401, headers: getCorsHeaders(origin) }
        );
    }
});

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req.headers.get("origin") || ""),
  });
}