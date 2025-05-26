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
            if (search) {
                const searchLower = search.toLowerCase();
                pipeline.push({
                    $match: {
                        $or: [
                            { "vehicle.vehicleId": { $regex: searchLower, $options: "i" } },
                            { "user.name": { $regex: searchLower, $options: "i" } },
                            { "user.phoneNumber": { $regex: search, $options: "i" } }
                        ]
                    }
                });
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
                    { $match: query },
                    ...(search ? [{
                        $lookup: {
                            from: "vehicles",
                            localField: "vehicleId",
                            foreignField: "_id",
                            as: "vehicle"
                        }
                    }, {
                        $unwind: {
                            path: "$vehicle",
                            preserveNullAndEmptyArrays: true
                        }
                    }, {
                        $lookup: {
                            from: "users",
                            localField: "vehicle.userId",
                            foreignField: "_id",
                            as: "user"
                        }
                    }, {
                        $unwind: {
                            path: "$user",
                            preserveNullAndEmptyArrays: true
                        }
                    }, {
                        $match: {
                            $or: [
                                { "vehicle.vehicleId": { $regex: search.toLowerCase(), $options: "i" } },
                                { "user.name": { $regex: search.toLowerCase(), $options: "i" } },
                                { "user.phoneNumber": { $regex: search, $options: "i" } }
                            ]
                        }
                    }] : []),
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
