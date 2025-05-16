import { NextResponse }    from 'next/server';
import connectToMongoose  from '@/lib/db/connect';
import { Repairs }        from '@/lib/db/models';
import { withAuth }       from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';
import mongoose            from 'mongoose';

await connectToMongoose();

export const GET = withAuth(async (req, { params }, decoded) => {
  const origin                = req.headers.get('origin') || '';
  const { vehicleId, repairId } = params;

  if (
    !mongoose.Types.ObjectId.isValid(vehicleId) ||
    !mongoose.Types.ObjectId.isValid(repairId)
  ) {
    return NextResponse.json({ error: 'Invalid ID' }, {
      status: 400,
      headers: getCorsHeaders(origin),
    });
  }

  const record = await Repairs.findOne({
    _id:       new mongoose.Types.ObjectId(repairId),
    vehicleId: new mongoose.Types.ObjectId(vehicleId),
  }).lean();

  if (!record) {
    return NextResponse.json({ error: 'Not found' }, {
      status: 404,
      headers: getCorsHeaders(origin),
    });
  }

  return NextResponse.json({ repair: record }, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
});
