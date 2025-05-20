import { NextResponse } from 'next/server';
import { Vehicles } from '@/lib/db/models';
import { validateAdminToken } from '@/lib/auth/adminAuth';
import { getCorsHeaders } from '@/lib/cors';
import mongoose from 'mongoose';

export async function GET(req) {
  const origin = req.headers.get("origin") || "";
  try {
    // Verify admin authentication
    const authResponse = await validateAdminToken(req);
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { 
          status: 400,
          headers: getCorsHeaders(origin)
        }
      );
    }

    // Find vehicles for the user
    const vehicles = await Vehicles.find({ 
      userId: new mongoose.Types.ObjectId(userId)
    }).lean();

    return NextResponse.json({
      success: true,
      vehicles: vehicles.map(vehicle => ({
        ...vehicle,
        _id: vehicle._id.toString(),
        userId: vehicle.userId.toString()
      }))
    }, { headers: getCorsHeaders(origin) });

  } catch (error) {
    console.error('Error in vehicles admin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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