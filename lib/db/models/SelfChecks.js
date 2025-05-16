import mongoose from 'mongoose';

const SelfCheckSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true },
  userId:    { type: mongoose.Types.ObjectId, required: true },
  abnormal:  { type: Boolean, required: true },
  detail:    { type: String },
  checkedAt: { type: Date, default: () => new Date() },
}, {
  timestamps: false,      
  versionKey: false,
});

export default mongoose.models.SelfCheck 
  || mongoose.model('SelfCheck', SelfCheckSchema);
