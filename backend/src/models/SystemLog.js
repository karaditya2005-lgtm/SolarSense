import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error'],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['auth', 'forecast', 'admin', 'ml', 'weather', 'system'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    targetType: {
      type: String,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    message: {
      type: String,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
    requestId: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ type: 1, level: 1, createdAt: -1 });
// Retention TTL index: 90 days (7,776,000 seconds)
systemLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const SystemLog = mongoose.model('SystemLog', systemLogSchema);
