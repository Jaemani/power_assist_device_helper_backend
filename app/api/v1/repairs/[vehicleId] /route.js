// app/api/v1/repairs/[vehicleId]/route.js
import Repair from '@/lib/models/Repair.js'; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');

  const doc = await Repair.findOne({ vehicleId }).lean();

  return new Response(JSON.stringify(doc?.repairReceipt || []), { status: 200 });
}

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');
  
  const record = await req.json();

  const updated = await Repair.findOneAndUpdate(
    { vehicleId },
    { $push: { repairReceipt: { $each: record } } },  
    { new: true, upsert: true }
  );

  return new Response(JSON.stringify(updated.repairReceipt), { status: 200 });
}
