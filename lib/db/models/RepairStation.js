import mongoose from 'mongoose';

const RepairStationSchema = new mongoose.Schema({
  repairStationCode: { type: String, required: true, unique: true },
  repairStationId:   { type: String, required: true, unique: true },
  repairStationLabel: { type: String, required: true }
}, { timestamps: true });

const RepairStationModel = mongoose.models.RepairStation || mongoose.model('RepairStation', RepairStationSchema);

export default RepairStationModel;
