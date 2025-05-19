import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import connectToMongoose from '@/lib/db/connect';
import { Admins, RepairStations } from '@/lib/db/models';
import { getCorsHeaders } from '@/lib/cors';
import bcrypt from 'bcryptjs';

export async function POST(request) {

    await connectToMongoose();
    const origin = request.headers.get("origin") || "";
    
    try {
        const { id, password } = await request.json();

        const admin = await Admins.findOne({ id });
        if (!admin) {
            return NextResponse.json(
            { success: false, message: 'Invalid credentials or not an admin' },
            { 
                status: 401,
                headers: getCorsHeaders(origin)
            }
            );
        }

        // Compare hashed password
        
        const isMatch = await bcrypt.compare(password + process.env.PEPPER, admin.password);
        if (!isMatch) {
            return NextResponse.json(
            { success: false, message: 'Invalid credentials or not an admin' },
            { 
                status: 401,
                headers: getCorsHeaders(origin)
            }
            );
        }

        const repairStation = await RepairStations.findById(admin.repairStation);

        // Create JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ 
            id: admin.id,
            label: repairStation.label,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        return NextResponse.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                label: repairStation.label,
            }
        }, {
            headers: getCorsHeaders(origin)
        });
    } catch (error) {
        console.error('Login error:', error);
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