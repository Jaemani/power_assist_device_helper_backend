// lib/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firebaseUid:   { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  phoneNumber:   { type: String, required: true },
  role:          { type: String, enum: ['user','admin','repairer','guardian'], default: 'user' },
  recipientType: { type: String, enum: ['일반','차상위','수급자', '미등록'], require: true },
  smsConsent:    { type: Boolean, required: true },
  guardianIds:   [{ type: mongoose.Types.ObjectId, ref: 'guardians' }]
}, { timestamps: true, versionKey: false }); // automatically add createdAt and updatedAt fields

const UserModel = mongoose.models.users || mongoose.model('users', UserSchema);

export default UserModel;
