import { connectToMongoose } from '@/lib/db/connect';
import { Repair } from '@/db/models';

export async function GET(req) {
  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });

  const doc = await Repair.findOne({ vehicleId }).lean();
  const objectId = mongoose.Types.ObjectId(vehicleId);

  return new Response(JSON.stringify(doc?.repairReceipt || []), { status: 200 });
}

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');

  const objectId = mongoose.Types.ObjectId(vehicleId);

  const record = await req.json();

  const updated = await Repair.findOneAndUpdate(
    { vehicleId },
    { $push: { repairReceipt: { $each: record } } },  
    { new: true, upsert: true }
  );

  return new Response(JSON.stringify(updated.repairReceipt), { status: 200 });
}
