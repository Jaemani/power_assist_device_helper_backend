import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { SelfChecks, Vehicles, Users } from '@/lib/db/models';
import { validateAdminToken } from '@/lib/auth/adminAuth';
import { getCorsHeaders } from '@/lib/cors';
import { withAuth } from '@/lib/auth/withAuth';

await connectToMongoose();

export const GET = withAuth(async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    if (decoded.role === 'admin') {
        // Verify admin authentication
        const authResponse = await validateAdminToken(req);
        if (authResponse instanceof NextResponse) {
            return authResponse;
        }

        try {
            // Get query parameters
            const { searchParams } = new URL(req.url);
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '10');
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');
            const vehicleId = searchParams.get('vehicleId');
            const hasIssues = searchParams.get('hasIssues');
            const search = searchParams.get('search');

            // Calculate skip for pagination
            const skip = (page - 1) * limit;

            // Build query
            const query = {};
            
            if (startDate) {
                query.createdAt = { $gte: new Date(startDate) };
            }
            if (endDate) {
                query.createdAt = { 
                    ...query.createdAt,
                    $lte: new Date(endDate + 'T23:59:59')
                };
            }
            if (vehicleId) {
                query.vehicleId = vehicleId;
            }
            if (hasIssues === 'true') {
                query.$or = [
                    { motorNoise: true },
                    { abnormalSpeed: true },
                    { batteryBlinking: true },
                    { chargingNotStart: true },
                    { breakDelay: true },
                    { breakPadIssue: true },
                    { tubePunctureFrequent: true },
                    { tireWearFrequent: true },
                    { batteryDischargeFast: true },
                    { incompleteCharging: true },
                    { seatUnstable: true },
                    { seatCoverIssue: true },
                    { footRestLoose: true },
                    { antislipWorn: true },
                    { frameNoise: true },
                    { frameCrack: true }
                ];
            }

            // Execute query with pagination
            const [selfChecks, total] = await Promise.all([
                SelfChecks.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                SelfChecks.countDocuments(query)
            ]);

            // Get vehicle and user information for each self-check
            const selfChecksWithDetails = await Promise.all(selfChecks.map(async (check) => {
                const vehicle = await Vehicles.findById(check.vehicleId).lean();
                const user = vehicle?.userId ? await Users.findById(vehicle.userId).lean() : null;
                
                return {
                    ...check,
                    vehicle: vehicle ? {
                        _id: vehicle._id.toString(),
                        vehicleId: vehicle.vehicleId,
                        model: vehicle.model
                    } : null,
                    user: user ? {
                        _id: user._id.toString(),
                        name: user.name,
                        phoneNumber: user.phoneNumber
                    } : null
                };
            }));

            // Apply search filter if provided
            let filteredChecks = selfChecksWithDetails;
            if (search) {
                const searchLower = search.toLowerCase();
                filteredChecks = selfChecksWithDetails.filter(check => 
                    (check.vehicle?.vehicleId?.toLowerCase().includes(searchLower)) ||
                    (check.user?.name?.toLowerCase().includes(searchLower)) ||
                    (check.user?.phoneNumber?.includes(search))
                );
            }

            return NextResponse.json({
                success: true,
                selfChecks: filteredChecks,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total
            }, { headers: getCorsHeaders(origin) });
        } catch (error) {
            console.error('Error in admin self-checks API:', error);
            return NextResponse.json(
                { success: false, message: 'Internal server error' },
                {
                    status: 500,
                    headers: getCorsHeaders(origin)
                }
            );
        }
    } else {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: getCorsHeaders(origin),
        });
    }
});

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(request.headers.get("origin") || ""),
    });
}
