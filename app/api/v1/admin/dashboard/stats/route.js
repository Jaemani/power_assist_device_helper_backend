import { NextResponse } from 'next/server';
import { Users, Vehicles, SelfChecks } from '@/lib/db/models';
import { validateAdminToken } from '@/lib/auth/adminAuth';
import connectToMongoose from '@/lib/db/connect';
import { getCorsHeaders } from '@/lib/cors';

export async function GET(request) {
    await connectToMongoose();
    const origin = request.headers.get("origin") || "";

    const authResponse = await validateAdminToken(request);
    if (authResponse instanceof NextResponse) {
        return authResponse;
    }

    try {
        const [
            totalUsers,
            usersByRole,
            usersByRecipientType,
            totalVehicles,
            totalSelfChecks,
            recentSelfChecks
        ] = await Promise.all([
            // Total users count
            Users.countDocuments(),
            
            // Users grouped by role
            Users.aggregate([
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Users grouped by recipient type
            Users.aggregate([
                {
                    $group: {
                        _id: '$recipientType',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Total vehicles count
            Vehicles.countDocuments(),

            // Total self-checks count
            SelfChecks.countDocuments(),

            // Recent self-checks (last 7 days)
            SelfChecks.countDocuments({
                createdAt: { 
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                }
            })
        ]);

        // Process role statistics
        const roleStats = usersByRole.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // Process recipient type statistics
        const recipientTypeStats = usersByRecipientType.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        const stats = {
            users: {
                total: totalUsers,
                byRole: roleStats,
                byRecipientType: recipientTypeStats
            },
            vehicles: {
                total: totalVehicles
            },
            selfChecks: {
                total: totalSelfChecks,
                lastSevenDays: recentSelfChecks
            }
        };

        return NextResponse.json({
            success: true,
            stats
        }, {
            headers: getCorsHeaders(origin)
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { 
                status: 500,
                headers: getCorsHeaders(origin)
            }
        );
    }
}

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(request.headers.get("origin") || ""),
    });
} 