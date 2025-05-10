import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  vehicleId:   { type: String, required: true, unique: true },
  userId:      { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  model: { type: String, required: true },
  purchasedDate:  { type: Date, required: true },
  registeredDate:  { type: Date, required: true },
}, { timestamps: true });

const VehicleModel = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);

export default VehicleModel;
