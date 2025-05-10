// lib/models/Guardian.js
import mongoose from 'mongoose';

const GuardianSchema = new mongoose.Schema({
  firebaseUid:  { type: String, required: true, unique: true },
  userId:   { type: mongoose.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true }); // automatically add createdAt and updatedAt fields

const GuardianModel = mongoose.models.Guardian || mongoose.model('Guardian', GuardianSchema);

export default GuardianModel;
