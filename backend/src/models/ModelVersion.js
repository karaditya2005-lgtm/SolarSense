import mongoose from 'mongoose';

const modelVersionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    trainedAt: {
      type: Date,
      default: Date.now,
    },
    datasetDescription: {
      type: String,
    },
    featureList: {
      type: [String],
      default: [],
    },
    metrics: {
      mae: { type: Number },
      rmse: { type: Number },
      r2: { type: Number },
      nmae: { type: Number },
    },
    hyperparameters: {
      type: mongoose.Schema.Types.Mixed,
    },
    baselineComparison: {
      type: mongoose.Schema.Types.Mixed,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

modelVersionSchema.index({ name: 1, version: 1 }, { unique: true });

export const ModelVersion = mongoose.model('ModelVersion', modelVersionSchema);
