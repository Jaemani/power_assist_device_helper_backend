import RepairInfo from '@/lib/models/RepairInfo.js'; 
import mongoose from 'mongoose';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');

  const objectId = mongoose.Types.ObjectId(vehicleId);

  const doc = await RepairInfo.findOne({ vehicleId: objectId }).lean();

  return new Response(JSON.stringify(doc?.repairReceipt || []), { status: 200 });
}

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');

  const objectId = mongoose.Types.ObjectId(vehicleId);

  const record = await req.json();

  const updated = await RepairInfo.findOneAndUpdate(
    { vehicleId: objectId }, 
    { $push: { repairReceipt: { $each: record } } },  
    { new: true, upsert: true }
  );

  return new Response(JSON.stringify(updated.repairReceipt), { status: 200 });
}
