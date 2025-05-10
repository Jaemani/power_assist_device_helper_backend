import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  vehicleId:   { type: String, required: true, unique: true },
  userId:      { type: mongoose.Types.ObjectId, ref: 'users' },
  model: { type: String },
  purchasedDate:  { type: Date },
  registeredDate:  { type: Date },
}, { timestamps: true, versionKey: false});

const VehicleModel = mongoose.models.vehicles || mongoose.model('vehicles', VehicleSchema);

export default VehicleModel;
