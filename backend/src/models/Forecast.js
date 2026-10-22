import mongoose from 'mongoose';

const hourlyWeatherSchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    temperatureC: { type: Number, required: true },
    cloudCoverPct: { type: Number, required: true },
    humidityPct: { type: Number, required: true },
    windSpeedMs: { type: Number, required: true },
    ghiWm2: { type: Number, required: true },
    dniWm2: { type: Number, default: 0 },
    dhiWm2: { type: Number, default: 0 },
    precipitationMm: { type: Number, default: 0 },
    overridden: { type: Boolean, default: false },
  },
  { _id: false }
);

const hourlyPredictionSchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    powerKw: { type: Number, required: true },
    capacityFactor: { type: Number },
    solarElevationDeg: { type: Number },
  },
  { _id: false }
);

const forecastSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    location: {
      name: { type: String, required: true, trim: true },
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      timezone: { type: String, default: 'UTC' },
      country: { type: String },
    },
    targetDateTime: {
      type: Date,
      required: true,
    },
    mode: {
      type: String,
      enum: ['single', 'day'],
      default: 'day',
    },
    system: {
      capacityKw: { type: Number, required: true, min: 0.1, max: 10000 },
      tiltDeg: { type: Number, min: 0, max: 90 },
      azimuthDeg: { type: Number, min: 0, max: 360, default: 180 },
    },
    weatherSnapshot: {
      source: { type: String, default: 'open-meteo' },
      fetchedAt: { type: Date, default: Date.now },
      hourly: [hourlyWeatherSchema],
    },
    features: {
      type: mongoose.Schema.Types.Mixed,
    },
    prediction: {
      targetPowerKw: { type: Number },
      unit: { type: String, default: 'kW' },
      hourly: [hourlyPredictionSchema],
      dayEnergyKwh: { type: Number },
      confidence: {
        lowKw: { type: Number },
        highKw: { type: Number },
      },
    },
    model: {
      name: { type: String },
      version: { type: String },
      trainedAt: { type: Date },
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    errorCode: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    durationMs: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

forecastSchema.index({ userId: 1, createdAt: -1 });
forecastSchema.index({ status: 1, createdAt: -1 });
forecastSchema.index({ createdAt: -1 });
forecastSchema.index({ 'location.name': 1 });
forecastSchema.index({ 'model.version': 1 });

export const Forecast = mongoose.model('Forecast', forecastSchema);
