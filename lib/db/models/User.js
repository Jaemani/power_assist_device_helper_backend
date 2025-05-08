// lib/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firebaseUid:   { type: String, required: true, unique: true },
  phoneNumber:   { type: String, required: true },
  role:          { type: String, enum: ['user','admin','repairer','guardian'], default: 'user' },
  vehicleIds:    [{ type: mongoose.Types.ObjectId, ref: 'Vehicle' }],
  guardianIds:   [{ type: mongoose.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

export default UserModel;
