import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { getCorsHeaders } from '@/lib/cors';

export async function validateAdminToken(request) {
    const origin = request.headers.get('origin') || '';
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Access denied. No token provided.' },
                { status: 401, headers: getCorsHeaders(origin) }
            );
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        
        // Check if the user has admin role
        if (payload.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Access denied. Admin privileges required.' },
                { status: 403, headers: getCorsHeaders(origin) }
            );
        }

        // Add user info to request
        request.user = payload;
        return request;
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Invalid token.' },
            { status: 401, headers: getCorsHeaders(origin) }
        );
    }
} 