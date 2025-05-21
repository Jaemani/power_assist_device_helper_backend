// lib/models/Guardian.js
import mongoose from 'mongoose';

const GuardianSchema = new mongoose.Schema({
  name:         { type: String, required: true }, // Add name directly to guardian document
  firebaseUid:  { type: String, required: true }, // 보호자 입력만 되고 앱 가입 안됐을 수 있으므로 unique: false
  userId:   { type: mongoose.Types.ObjectId, ref: 'users', required: true },
}, { timestamps: true, versionKey: false }); // automatically add createdAt and updatedAt fields

const GuardianModel = mongoose.models.guardians || mongoose.model('guardians', GuardianSchema);

export default GuardianModel;
