// lib/models/Guardian.js
import mongoose from 'mongoose';

const GuardianSchema = new mongoose.Schema({
  firebaseUid:  { type: String, required: true, unique: true },
  userId:   { type: mongoose.Types.ObjectId, ref: 'users', required: true },
}, { timestamps: true, versionKey: false }); // automatically add createdAt and updatedAt fields

const GuardianModel = mongoose.models.guardians || mongoose.model('guardians', GuardianSchema);

export default GuardianModel;
