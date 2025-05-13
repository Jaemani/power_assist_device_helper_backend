import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';

export const GET = withAuth(async (req, ctx, decoded) => {
    try {
        const role = decoded.role; // Extract the role from the decoded token

        return NextResponse.json({
            role: role,
        }, { status: 200 });

    }catch (error) {
        console.error('Error in GET function:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});