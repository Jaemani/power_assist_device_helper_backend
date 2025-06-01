import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users,Repairs, Vehicles } from '@/lib/db/models';
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
            const repairStationCode = searchParams.get('repairStationCode');
            const isAccident = searchParams.get('isAccident');
            const vehicleId = searchParams.get('vehicleId');
            const searchTerm = searchParams.get('searchTerm');
            const repairType = searchParams.get('repairType');
            const minAmount = searchParams.get('minAmount');
            const maxAmount = searchParams.get('maxAmount');
            const repairCategories = searchParams.get('repairCategories');
            const memo = searchParams.get('memo');

            // Calculate skip for pagination
            const skip = (page - 1) * limit;

            // Build query
            const query = {};
            
            if (startDate) {
                query.repairedAt = { $gte: new Date(startDate) };
            }
            if (endDate) {
                query.repairedAt = { 
                    ...query.repairedAt,
                    $lte: new Date(endDate + 'T23:59:59')
                };
            }
            if (repairStationCode) {
                query.repairStationCode = repairStationCode;
            }
            if (isAccident !== null && isAccident !== undefined) {
                query.isAccident = isAccident === 'true';
            }
            // Handle repairType filter from frontend
            if (repairType) {
                if (repairType === 'accident') {
                    query.isAccident = true;
                } else if (repairType === 'regular') {
                    query.isAccident = false;
                }
            }
            if (vehicleId) {
                query.vehicleId = vehicleId;
            }
            if (minAmount) {
                query.billingPrice = { $gte: parseInt(minAmount) };
            }
            if (maxAmount) {
                query.billingPrice = { 
                    ...query.billingPrice,
                    $lte: parseInt(maxAmount)
                };
            }
            if (repairCategories) {
                const categoriesArray = repairCategories.split(',').filter(cat => cat.trim());
                if (categoriesArray.length > 0) {
                    query.repairCategories = { $in: categoriesArray };
                }
            }
            if (memo) {
                query.memo = { $regex: memo, $options: 'i' };
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
                }
            ];

            // Add search filtering after lookups
            const searchConditions = [];
            
            if (searchTerm) {
                searchConditions.push({
                    $or: [
                        { "user.name": { $regex: searchTerm, $options: "i" } },
                        { "vehicle.vehicleId": { $regex: searchTerm, $options: "i" } }
                    ]
                });
            }
            
            if (searchConditions.length > 0) {
                pipeline.push({ $match: { $and: searchConditions } });
            }

            // Add remaining pipeline stages
            pipeline.push(
                {
                    $addFields: {
                        "vehicle._id": { $toString: "$vehicle._id" },
                        "user._id": { $toString: "$user._id" }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        vehicleId: 1,
                        repairedAt: 1,
                        billingPrice: 1,
                        isAccident: 1,
                        repairStationLabel: 1,
                        repairStationCode: 1,
                        repairer: 1,
                        repairCategories: 1,
                        batteryVoltage: 1,
                        memo: 1,
                        troubleInfo: 1,
                        repairDetail: 1,
                        repairType: 1,
                        billedAmount: 1,
                        requestedAmount: 1,
                        createdAt: 1,
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
                { $sort: { repairedAt: -1 } }
            );

            // Execute aggregation with pagination
            const [repairsResult, totalResult] = await Promise.all([
                Repairs.aggregate([
                    ...pipeline,
                    { $skip: skip },
                    { $limit: limit }
                ]),
                Repairs.aggregate([
                    ...pipeline.slice(0, -2), // Remove projection and sorting for count
                    { $count: "total" }
                ])
            ]);

            const repairsWithVehicles = repairsResult;
            const total = totalResult[0]?.total || 0;

            return NextResponse.json({
                success: true,
                repairs: repairsWithVehicles,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total
            }, { headers: getCorsHeaders(origin) });
        } catch (error) {
            console.error('Error in admin repairs API:', error);
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
