import mongoose from 'mongoose';

const solarDataSchema = new mongoose.Schema(
  {
    location: {
      name: { type: String, required: true, trim: true },
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      timezone: { type: String, default: 'UTC' },
    },
    timestamp: {
      type: Date,
      required: [true, 'Observation timestamp is required'],
      index: true,
    },
    ghiWm2: {
      type: Number,
      required: [true, 'GHI is required'],
      min: [0, 'GHI must be >= 0'],
      max: [1500, 'GHI must be <= 1500'],
    },
    dniWm2: {
      type: Number,
      min: 0,
      default: 0,
    },
    dhiWm2: {
      type: Number,
      min: 0,
      default: 0,
    },
    temperatureC: {
      type: Number,
      required: [true, 'Temperature is required'],
      min: [-60, 'Temperature must be >= -60°C'],
      max: [70, 'Temperature must be <= 70°C'],
    },
    cloudCoverPct: {
      type: Number,
      min: 0,
      max: 100,
    },
    humidityPct: {
      type: Number,
      min: 0,
      max: 100,
    },
    windSpeedMs: {
      type: Number,
      min: 0,
    },
    acPowerKw: {
      type: Number,
      min: 0,
    },
    capacityKw: {
      type: Number,
      min: 0,
    },
    source: {
      type: String,
      required: [true, 'Data provenance source is mandatory'],
      trim: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

solarDataSchema.index({ 'location.name': 1, timestamp: -1 });
solarDataSchema.index(
  { 'location.latitude': 1, 'location.longitude': 1, timestamp: 1, source: 1 },
  { unique: true }
);

export const SolarData = mongoose.model('SolarData', solarDataSchema);
