import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users } from '@/lib/db/models';
import { validateAdminToken } from '@/lib/auth/adminAuth';
import { getCorsHeaders } from '@/lib/cors';

export async function GET(request) {
    await connectToMongoose();
    const origin = request.headers.get("origin") || "";

    const authResponse = await validateAdminToken(request);
    if (authResponse instanceof NextResponse) {
        return authResponse;
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        const query = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const [users, total] = await Promise.all([
            Users.find(query)
                .select('name phoneNumber role recipientType smsConsent guardianIds createdAt updatedAt')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            Users.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }, { headers: getCorsHeaders(origin) });
    } catch (error) {
        console.error('Get users error:', error);
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