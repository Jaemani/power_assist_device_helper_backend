import { NextResponse } from 'next/server';
import { Repairs, Vehicles } from '@/lib/db/models';
import { validateAdminToken } from '@/lib/auth/adminAuth';
import { getCorsHeaders } from '@/lib/cors';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  const origin = req.headers.get("origin") || "";
  try {
    // Verify admin authentication
    const authResponse = await validateAdminToken(req);
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    const { vehicleId } = await params;

    // First find the vehicle by its string identifier
    const vehicle = await Vehicles.findOne({ vehicleId }).lean();
    if (!vehicle) {
      return NextResponse.json(
        { error: '차량을 찾을 수 없습니다.' },
        { 
          status: 404,
          headers: getCorsHeaders(origin)
        }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Build query using the vehicle's _id
    const query = {
      vehicleId: vehicle._id // This is already an ObjectId
    };

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [repairs, total] = await Promise.all([
      Repairs.find(query)
        .sort({ repairedDate: -1 }) // Always sort by repair date, most recent first
        .skip(skip)
        .limit(limit)
        .lean(),
      Repairs.countDocuments(query)
    ]);

    // Transform repairs to match frontend expectations
    const transformedRepairs = repairs.map(repair => ({
      ...repair,
      vehicleId: repair.vehicleId.toString(), // Convert ObjectId to string
      vehicle: {
        ...vehicle,
        _id: vehicle._id.toString(),
        userId: vehicle.userId.toString()
      }
    }));

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      repairs: transformedRepairs,
      currentPage: page,
      totalPages,
      total
    }, { headers: getCorsHeaders(origin) });

  } catch (error) {
    console.error('Error in vehicle repairs admin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: getCorsHeaders(origin)
      }
    );
  }
}

export async function POST(req, { params }) {
  const origin = req.headers.get("origin") || "";
  try {
    // Verify admin authentication
    const authResponse = await validateAdminToken(req);
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    const { vehicleId } = params;
    const repairsData = await req.json();

    // Find vehicle first using the string identifier
    const vehicle = await Vehicles.findOne({ vehicleId });
    if (!vehicle) {
      return NextResponse.json(
        { error: '차량을 찾을 수 없습니다.' },
        { 
          status: 404,
          headers: getCorsHeaders(origin)
        }
      );
    }

    // Create repair records using the vehicle's _id
    const repairs = await Promise.all(
      repairsData.map(repairData => 
        Repairs.create({
          vehicleId: vehicle._id, // Use the vehicle's ObjectId
          ...repairData
        })
      )
    );

    return NextResponse.json({
      success: true,
      repairs
    }, { headers: getCorsHeaders(origin) });

  } catch (error) {
    console.error('Error in vehicle repairs admin API:', error);
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