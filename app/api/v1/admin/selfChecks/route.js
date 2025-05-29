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
            const checkResultSearch = searchParams.get('checkResultSearch');

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

            // Build aggregation pipeline
            const pipeline = [
                { $match: query },
                {
                    $lookup: {
                        from: "vehicles",
                        localField: "vehicleId",
                        foreignField: "_id",
                        as: "vehicle"
                    }
                },
                {
                    $unwind: {
                        path: "$vehicle",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "vehicle.userId",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        "vehicle._id": { $toString: "$vehicle._id" },
                        "user._id": { $toString: "$user._id" }
                    }
                }
            ];

            // Add search filter to pipeline if provided
            const searchConditions = [];
            
            if (search) {
                searchConditions.push({
                    $or: [
                        { "vehicle.vehicleId": { $regex: search, $options: "i" } },
                        { "user.name": { $regex: search, $options: "i" } },
                        { "user.phoneNumber": { $regex: search, $options: "i" } }
                    ]
                });
            }
            
            if (checkResultSearch) {
                // For check result search, we'll create conditions based on the search term
                // mapping common Korean terms to boolean fields
                const searchTerm = checkResultSearch.toLowerCase();
                const checkConditions = [];
                
                // Motor related searches
                if (searchTerm.includes('모터') || searchTerm.includes('소음') || searchTerm.includes('진동')) {
                    checkConditions.push({ motorNoise: true });
                }
                if (searchTerm.includes('속도') || searchTerm.includes('느림') || searchTerm.includes('빠름')) {
                    checkConditions.push({ abnormalSpeed: true });
                }
                
                // Battery related searches
                if (searchTerm.includes('배터리') || searchTerm.includes('점멸') || searchTerm.includes('깜빡')) {
                    checkConditions.push({ batteryBlinking: true });
                }
                if (searchTerm.includes('충전') && (searchTerm.includes('안') || searchTerm.includes('못'))) {
                    checkConditions.push({ chargingNotStart: true });
                }
                if (searchTerm.includes('방전') || searchTerm.includes('빨리')) {
                    checkConditions.push({ batteryDischargeFast: true });
                }
                if (searchTerm.includes('완충') && searchTerm.includes('안')) {
                    checkConditions.push({ incompleteCharging: true });
                }
                
                // Brake related searches
                if (searchTerm.includes('브레이크') || searchTerm.includes('제동') || searchTerm.includes('지연')) {
                    checkConditions.push({ breakDelay: true });
                }
                if (searchTerm.includes('패드') || searchTerm.includes('마모')) {
                    checkConditions.push({ breakPadIssue: true });
                }
                
                // Tire related searches
                if (searchTerm.includes('타이어') || searchTerm.includes('펑크')) {
                    checkConditions.push({ tubePunctureFrequent: true });
                }
                if (searchTerm.includes('타이어') && searchTerm.includes('마모')) {
                    checkConditions.push({ tireWearFrequent: true });
                }
                
                // Seat related searches
                if (searchTerm.includes('시트') || searchTerm.includes('느슨')) {
                    checkConditions.push({ seatUnstable: true });
                }
                if (searchTerm.includes('시트') && searchTerm.includes('커버')) {
                    checkConditions.push({ seatCoverIssue: true });
                }
                
                // Frame related searches
                if (searchTerm.includes('프레임') || searchTerm.includes('소음')) {
                    checkConditions.push({ frameNoise: true });
                }
                if (searchTerm.includes('프레임') && (searchTerm.includes('깨짐') || searchTerm.includes('금') || searchTerm.includes('휘어짐'))) {
                    checkConditions.push({ frameCrack: true });
                }
                
                // Other searches
                if (searchTerm.includes('발걸이')) {
                    checkConditions.push({ footRestLoose: true });
                }
                if (searchTerm.includes('미끄럼') || searchTerm.includes('고무')) {
                    checkConditions.push({ antislipWorn: true });
                }
                
                // If we found matching conditions, add them to search
                if (checkConditions.length > 0) {
                    searchConditions.push({ $or: checkConditions });
                }
            }
            
            if (searchConditions.length > 0) {
                pipeline.push({ $match: { $and: searchConditions } });
            }

            // Add projection and sorting
            pipeline.push(
                {
                    $project: {
                        _id: 1,
                        vehicleId: 1,
                        createdAt: 1,
                        motorNoise: 1,
                        abnormalSpeed: 1,
                        batteryBlinking: 1,
                        chargingNotStart: 1,
                        breakDelay: 1,
                        breakPadIssue: 1,
                        tubePunctureFrequent: 1,
                        tireWearFrequent: 1,
                        batteryDischargeFast: 1,
                        incompleteCharging: 1,
                        seatUnstable: 1,
                        seatCoverIssue: 1,
                        footRestLoose: 1,
                        antislipWorn: 1,
                        frameNoise: 1,
                        frameCrack: 1,
                        updatedAt: 1,
                        vehicle: {
                            _id: "$vehicle._id",
                            vehicleId: "$vehicle.vehicleId",
                            model: "$vehicle.model"
                        },
                        user: {
                            _id: "$user._id",
                            name: "$user.name",
                            phoneNumber: "$user.phoneNumber"
                        }
                    }
                },
                { $sort: { createdAt: -1 } }
            );

            // Execute aggregation with pagination
            const [selfChecksResult, totalResult] = await Promise.all([
                SelfChecks.aggregate([
                    ...pipeline,
                    { $skip: skip },
                    { $limit: limit }
                ]),
                SelfChecks.aggregate([
                    ...pipeline.slice(0, -2), // Remove projection and sorting for count
                    { $count: "total" }
                ])
            ]);

            const filteredChecks = selfChecksResult;
            const total = totalResult[0]?.total || 0;

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
