import { NextResponse } from 'next/server';
import { Repairs, Vehicles, Users } from '@/lib/db/models';
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
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const repairStationCode = searchParams.get('repairStationCode');
    const isAccident = searchParams.get('isAccident');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    // Build query
    let query = {};

    // Only add filters if they are explicitly provided
    if (startDate) {
      query.repairedDate = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.repairedDate = { ...query.repairedDate, $lte: new Date(endDate) };
    }
    if (repairStationCode) {
      query.repairStationCode = repairStationCode;
    }
    if (isAccident !== null && isAccident !== undefined) {
      query.isAccident = isAccident === 'true';
    }
    if (status) {
      query.status = status;
    }

    // If userId is provided, find all repairs for vehicles belonging to that user
    if (userId) {
      // First find all vehicles belonging to this user
      // Convert userId string to ObjectId for comparison with vehicle.userId
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const userVehicles = await Vehicles.find({ userId: userObjectId });
      
      if (userVehicles.length === 0) {
        return NextResponse.json({
          success: true,
          repairs: [],
          currentPage: page,
          totalPages: 0,
          total: 0
        }, { headers: getCorsHeaders(origin) });
      }

      // Get array of vehicle ObjectIds to match against repair.vehicleId
      const vehicleIds = userVehicles.map(v => v._id);
      query.vehicleId = { $in: vehicleIds };
    }

    if (search) {
      query.$or = [
        { repairStationLabel: { $regex: search, $options: 'i' } },
        { memo: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [repairs, total] = await Promise.all([
      Repairs.find(query)
        .sort({ repairedDate: -1 }) // Always sort by repair date, most recent first
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'vehicleId',
          select: 'userId vehicleId'
        })
        .lean(),
      Repairs.countDocuments(query)
    ]);

    // Transform repairs to match frontend expectations
    const transformedRepairs = repairs.map(repair => ({
      ...repair,
      vehicleId: repair.vehicleId._id.toString(), // Convert ObjectId to string
      vehicle: repair.vehicleId // Keep the populated vehicle data if needed
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
    console.error('Error in repairs admin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: getCorsHeaders(origin)
      }
    );
  }
}

export async function POST(req) {
  const origin = req.headers.get("origin") || "";
  try {
    // Verify admin authentication
    const authResponse = await validateAdminToken(req);
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    const body = await req.json();
    const { vehicleId, ...repairData } = body;

    // Validate vehicle exists
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

    // Create repair record
    const repair = await Repairs.create({
      vehicleId: vehicle._id,
      ...repairData
    });

    return NextResponse.json({
      success: true,
      repair
    }, { headers: getCorsHeaders(origin) });

  } catch (error) {
    console.error('Error in repairs admin API:', error);
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