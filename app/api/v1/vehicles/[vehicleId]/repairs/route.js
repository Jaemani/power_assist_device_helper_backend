import { NextResponse }    from 'next/server';
import connectToMongoose  from '@/lib/db/connect';
import { Repairs }        from '@/lib/db/models';
import { withAuth }       from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';
import mongoose            from 'mongoose';

await connectToMongoose();

export const GET = withAuth(async (req, { params }, decoded) => {
  const origin     = req.headers.get('origin') || '';
  const { vehicleId } = params;

  // vehicleId 검증
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
    return NextResponse.json({ error: 'Invalid vehicleId' }, {
      status: 400,
      headers: getCorsHeaders(origin),
    });
  }

  // 해당 차량의 모든 수리 내역 조회
  const list = await Repairs
    .find({ vehicleId: new mongoose.Types.ObjectId(vehicleId) })
    .sort({ date: -1 })  // 최신순
    .lean();

  // id, 날짜, 사고여부, 담당기관, 금액만 내려주기
  const items = list.map(r => ({
    id:       r._id.toString(),
    date:     r.date,
    accident: r.accident,
    station:  r.repairStation,
    cost:     r.cost,
  }));

  return NextResponse.json({ repairs: items }, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
});
