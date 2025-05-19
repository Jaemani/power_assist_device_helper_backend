import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  repairStation:  { type: mongoose.Types.ObjectId, ref: 'repairstations', required: true },
  id: { type: String, required: true },
  password: { type: String, require: true },
}, { timestamps: true, versionKey: false }); // automatically add createdAt and updatedAt fields

const AdminModel = mongoose.models.admins || mongoose.model('admins', AdminSchema);

export default AdminModel;
