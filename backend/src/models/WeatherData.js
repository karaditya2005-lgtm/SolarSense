import mongoose from 'mongoose';

const weatherDataSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      default: 'open-meteo',
    },
    hourly: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    daily: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const WeatherData = mongoose.model('WeatherData', weatherDataSchema);
