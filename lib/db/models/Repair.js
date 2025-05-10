import mongoose from 'mongoose';

const RepairSchema = new mongoose.Schema({
  vehicleId:  { type: mongoose.Types.ObjectId, ref: 'Vehicle', required: true },
  repairedDate: { type: Date, required: true },
  billingPrice: { type: Number, required: true },
  isAccident: { type: Boolean, required: true },
  repairStationCode:  { type: String, required: true },
  repairStationLabel: { type: String, required: true },
  repairer: { type: String, default: true },
  repairCategories: { type: String, required: true },
  batteryVolatge: { type: Number, required: false },
  etcRepairParts: { type: String, required: false },
  memo: { type: String, required: false },
}, { timestamps: true });

const RepairModel = mongoose.models.Repair || mongoose.model('Repair', RepairSchema);

export default RepairModel;
