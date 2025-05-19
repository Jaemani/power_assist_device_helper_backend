import { NextResponse } from 'next/server';
import { Users } from '@/lib/db/models';
import { validateAdminToken } from '@/lib/auth/adminAuth';
import connectToMongoose from '@/lib/db/connect';
import mongoose from 'mongoose';
import { getCorsHeaders } from '@/lib/cors';

export async function GET(request, { params }) {
    await connectToMongoose();
    const origin = request.headers.get("origin") || "";

    const authResponse = await validateAdminToken(request);
    if (authResponse instanceof NextResponse) {
        return authResponse;
    }

    try {
        const user = await Users.findById(params.id)
            .select('name phoneNumber role recipientType smsConsent guardianIds createdAt updatedAt')
            .lean();

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { 
                    status: 404,
                    headers: getCorsHeaders(origin)
                }
            );
        }

        return NextResponse.json(
            { success: true, user },
            { headers: getCorsHeaders(origin) }
        );
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { 
                status: 500,
                headers: getCorsHeaders(origin)
            }
        );
    }
}

export async function PUT(request, { params }) {
    await connectToMongoose();
    const origin = request.headers.get("origin") || "";

    const authResponse = await validateAdminToken(request);
    if (authResponse instanceof NextResponse) {
        return authResponse;
    }

    try {
        const { name, phoneNumber, role, recipientType, smsConsent } = await request.json();

        // Validate role if provided
        if (role && !['user', 'admin', 'repairer', 'guardian'].includes(role)) {
            return NextResponse.json(
                { success: false, message: 'Invalid role value' },
                { 
                    status: 400,
                    headers: getCorsHeaders(origin)
                }
            );
        }

        // Validate recipientType if provided
        if (recipientType && !['general', 'lowIncome', 'welfare', 'unregistered'].includes(recipientType)) {
            return NextResponse.json(
                { success: false, message: 'Invalid recipient type' },
                { 
                    status: 400,
                    headers: getCorsHeaders(origin)
                }
            );
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (role) updateData.role = role;
        if (recipientType) updateData.recipientType = recipientType;
        if (typeof smsConsent === 'boolean') updateData.smsConsent = smsConsent;

        const user = await Users.findByIdAndUpdate(
            params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('name phoneNumber role recipientType smsConsent guardianIds updatedAt');

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { 
                    status: 404,
                    headers: getCorsHeaders(origin)
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user
        }, {
            headers: getCorsHeaders(origin)
        });
    } catch (error) {
        console.error('Update user error:', error);
        if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json(
                { success: false, message: 'Invalid data provided', errors: error.errors },
                { 
                    status: 400,
                    headers: getCorsHeaders(origin)
                }
            );
        }
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { 
                status: 500,
                headers: getCorsHeaders(origin)
            }
        );
    }
}

export async function DELETE(request, { params }) {
    await connectToMongoose();
    const origin = request.headers.get("origin") || "";

    const authResponse = await validateAdminToken(request);
    if (authResponse instanceof NextResponse) {
        return authResponse;
    }

    try {
        const user = await Users.findByIdAndDelete(params.id);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { 
                    status: 404,
                    headers: getCorsHeaders(origin)
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        }, {
            headers: getCorsHeaders(origin)
        });
    } catch (error) {
        console.error('Delete user error:', error);
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