
import mongoose from 'mongoose';

const SelfCheckSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Types.ObjectId, ref: 'vehicles', required: true },
  userId:    { type: mongoose.Types.ObjectId, ref: 'users', required: true },
  detail:    { type: String, default: "" },
  checkedAt: { type: Date, default: null },
}, {
  timestamps: true,      
  versionKey: false,
});

const SelfCheckModel = mongoose.models.selfChecks || mongoose.model('selfChecks', SelfCheckSchema);
export default SelfCheckModel
