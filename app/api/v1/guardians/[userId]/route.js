import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Guardians } from '@/lib/db/models'; 
import mongoose from 'mongoose';
import { withAuth } from '@/lib/auth/withAuth';
import { getAuth } from 'firebase-admin/auth'
import { getCorsHeaders } from '@/lib/cors';
import { validateAdminToken } from '@/lib/auth/adminAuth';

////////////////////////////////////////////////////////////
// 관리자용 API
////////////////////////////////////////////////////////////

export const GET = withAuth(async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    if (decoded.role === 'admin') {

        const authResponse = await validateAdminToken(req);
        
    }else{
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: getCorsHeaders(origin),
        });
    }
});

export async function OPTIONS(req) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
    });
}