import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ModelVersion } from '../src/models/ModelVersion.js';
import { logger } from '../src/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  try {
    const metaPath = path.resolve(__dirname, '../../ml/models/v1.0.0/metadata.json');
    if (!fs.existsSync(metaPath)) {
      logger.error(`Metadata file not found at ${metaPath}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(metaPath, 'utf8');
    const meta = JSON.parse(raw);

    await connectDB();

    // Mark others as inactive if needed
    await ModelVersion.updateMany({ name: meta.name }, { $set: { isActive: false } });

    const modelRecord = await ModelVersion.findOneAndUpdate(
      { name: meta.name, version: meta.version },
      {
        name: meta.name,
        version: meta.version,
        trainedAt: new Date(meta.trainedAt),
        datasetDescription: meta.datasetDescription,
        featureList: meta.featureList,
        metrics: meta.metrics,
        hyperparameters: meta.hyperparameters,
        baselineComparison: meta.baselineComparison,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    logger.info({ modelRecord }, `Successfully registered model ${meta.name} (${meta.version}) in database.`);
  } catch (err) {
    logger.error({ err }, 'Error registering model.');
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

run();
