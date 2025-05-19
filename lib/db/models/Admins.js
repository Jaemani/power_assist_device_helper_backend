// lib/models/User.js
import mongoose from 'mongoose';

const AdminsSchema = new mongoose.Schema({
  repairStation:  { type: mongoose.Types.ObjectId, ref: 'repairstations', required: true },
  id: { type: String, required: true },
  password: { type: String, require: true },
}, { timestamps: true, versionKey: false }); // automatically add createdAt and updatedAt fields

const UserModel = mongoose.models.admins || mongoose.model('admins', AdminsSchema);

export default UserModel;
