import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  vehicleId:   { type: String, required: true, unique: true },
  userId:      { type: mongoose.Types.ObjectId, ref: 'users', default: null },
  model: { type: String, default: "" },
  purchasedAt:  { type: Date, default: null },
  manufacturedAt:  { type: Date, default: null },
}, { timestamps: true, versionKey: false});

const VehicleModel = mongoose.models.vehicles || mongoose.model('vehicles', VehicleSchema);

export default VehicleModel;
