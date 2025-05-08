import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  vehicleId:   { type: String, required: true, unique: true },
  userId:      { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  deviceModel: { type: String, required: true },
  deviceDate:  { type: Date, required: true }
}, { timestamps: true });

const VehicleModel = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);

export default VehicleModel;
