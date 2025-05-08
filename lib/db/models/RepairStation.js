import mongoose from 'mongoose';

const RepairStationSchema = new mongoose.Schema({
  repairStationCode: { type: String, required: true, unique: true },
  repairStationId:   { type: String, required: true, unique: true },
  repairStationName: { type: String, required: true },
  passwd:            { type: String, required: true }
}, { timestamps: true });

const RepairStationModel = mongoose.models.RepairStation || mongoose.model('RepairStation', RepairStationSchema);

export default RepairStationModel;
