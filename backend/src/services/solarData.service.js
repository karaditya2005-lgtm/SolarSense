import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { SolarData } from '../models/SolarData.js';
import { ApiError } from '../utils/ApiError.js';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination.js';
import { logSystemEvent } from './log.service.js';

export const getSolarDataList = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.source) {
    filter.source = query.source;
  }

  if (query.location || query.q) {
    const locSearch = query.location || query.q;
    filter['location.name'] = { $regex: locSearch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), $options: 'i' };
  }

  if (query.from || query.to) {
    filter.timestamp = {};
    if (query.from) filter.timestamp.$gte = new Date(query.from);
    if (query.to) filter.timestamp.$lte = new Date(query.to);
  }

  const [records, total] = await Promise.all([
    SolarData.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email'),
    SolarData.countDocuments(filter),
  ]);

  return {
    records,
    meta: createPaginationMeta(total, page, limit),
  };
};

export const getSolarDataById = async (id) => {
  const record = await SolarData.findById(id).populate('createdBy', 'name email');
  if (!record) {
    throw ApiError.notFound('Solar data record not found.');
  }
  return record;
};

export const findActualSolarMeasurement = async (latitude, longitude, targetDateTime) => {
  if (!latitude || !longitude || !targetDateTime) return null;
  const targetDate = new Date(targetDateTime);
  if (isNaN(targetDate.getTime())) return null;

  const latNum = Number(latitude);
  const lonNum = Number(longitude);

  // Search window of +/- 30 minutes and spatial proximity within 0.15 degrees
  const windowStart = new Date(targetDate.getTime() - 45 * 60 * 1000);
  const windowEnd = new Date(targetDate.getTime() + 45 * 60 * 1000);

  const match = await SolarData.findOne({
    'location.latitude': { $gte: latNum - 0.15, $lte: latNum + 0.15 },
    'location.longitude': { $gte: lonNum - 0.15, $lte: lonNum + 0.15 },
    timestamp: { $gte: windowStart, $lte: windowEnd },
  }).sort({ timestamp: 1 });

  return match;
};

export const createSolarDataRecord = async (data, adminUser, requestId = null) => {
  try {
    const record = await SolarData.create({
      ...data,
      createdBy: adminUser._id,
    });

    await logSystemEvent({
      level: 'info',
      type: 'admin',
      action: 'SOLAR_DATA_CREATED',
      actorId: adminUser._id,
      targetType: 'SolarData',
      targetId: record._id,
      message: `Admin ${adminUser.email} created solar data record at ${record.location.name}`,
      requestId,
    });

    return record;
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict('A record for this location, timestamp, and source already exists.');
    }
    throw err;
  }
};

export const updateSolarDataRecord = async (id, updateData, adminUser, requestId = null) => {
  const updated = await SolarData.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
  if (!updated) {
    throw ApiError.notFound('Solar data record not found.');
  }

  await logSystemEvent({
    level: 'info',
    type: 'admin',
    action: 'SOLAR_DATA_UPDATED',
    actorId: adminUser._id,
    targetType: 'SolarData',
    targetId: updated._id,
    message: `Admin ${adminUser.email} updated solar data record ${id}`,
    requestId,
  });

  return updated;
};

export const deleteSolarDataRecord = async (id, adminUser, requestId = null) => {
  const deleted = await SolarData.findByIdAndDelete(id);
  if (!deleted) {
    throw ApiError.notFound('Solar data record not found.');
  }

  await logSystemEvent({
    level: 'warn',
    type: 'admin',
    action: 'SOLAR_DATA_DELETED',
    actorId: adminUser._id,
    targetType: 'SolarData',
    targetId: id,
    message: `Admin ${adminUser.email} deleted solar data record ${id}`,
    requestId,
  });

  return { message: 'Solar data record deleted successfully.' };
};

export const importSolarDataCsv = async (csvBuffer, adminUser, requestId = null) => {
  return new Promise((resolve, reject) => {
    const parser = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const rows = [];
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        rows.push(record);
      }
    });

    parser.on('error', (err) => {
      reject(ApiError.unprocessableEntity(`CSV parsing failed: ${err.message}`));
    });

    parser.on('end', async () => {
      let inserted = 0;
      let skipped = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // header is row 1

        try {
          const lat = parseFloat(row.latitude);
          const lon = parseFloat(row.longitude);
          const ghi = parseFloat(row.ghiWm2 || row.ghi);
          const temp = parseFloat(row.temperatureC || row.temperature);

          if (isNaN(lat) || lat < -90 || lat > 90) {
            errors.push({ row: rowNum, message: 'Invalid latitude value (-90 to 90)' });
            continue;
          }
          if (isNaN(lon) || lon < -180 || lon > 180) {
            errors.push({ row: rowNum, message: 'Invalid longitude value (-180 to 180)' });
            continue;
          }
          if (isNaN(ghi) || ghi < 0 || ghi > 1500) {
            errors.push({ row: rowNum, message: 'Invalid GHI value (0 to 1500 W/m²)' });
            continue;
          }
          if (isNaN(temp) || temp < -60 || temp > 70) {
            errors.push({ row: rowNum, message: 'Invalid temperature (-60 to 70°C)' });
            continue;
          }

          const timestamp = new Date(row.timestamp);
          if (isNaN(timestamp.getTime())) {
            errors.push({ row: rowNum, message: 'Invalid ISO timestamp' });
            continue;
          }

          const source = row.source || 'csv_import';
          const locName = row.locationName || row.location || 'Benchmark Site';

          const doc = {
            location: {
              name: locName,
              latitude: lat,
              longitude: lon,
              timezone: row.timezone || 'UTC',
            },
            timestamp,
            ghiWm2: ghi,
            dniWm2: row.dniWm2 ? parseFloat(row.dniWm2) : 0,
            dhiWm2: row.dhiWm2 ? parseFloat(row.dhiWm2) : 0,
            temperatureC: temp,
            cloudCoverPct: row.cloudCoverPct ? parseFloat(row.cloudCoverPct) : undefined,
            humidityPct: row.humidityPct ? parseFloat(row.humidityPct) : undefined,
            windSpeedMs: row.windSpeedMs ? parseFloat(row.windSpeedMs) : undefined,
            acPowerKw: row.acPowerKw ? parseFloat(row.acPowerKw) : undefined,
            capacityKw: row.capacityKw ? parseFloat(row.capacityKw) : undefined,
            source,
            createdBy: adminUser._id,
          };

          // Upsert or insert ignore duplicates
          const result = await SolarData.updateOne(
            {
              'location.latitude': lat,
              'location.longitude': lon,
              timestamp,
              source,
            },
            { $setOnInsert: doc },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            inserted++;
          } else {
            skipped++;
          }
        } catch (rowErr) {
          errors.push({ row: rowNum, message: rowErr.message });
        }
      }

      await logSystemEvent({
        level: 'info',
        type: 'admin',
        action: 'SOLAR_DATA_IMPORTED',
        actorId: adminUser._id,
        targetType: 'SolarData',
        message: `Admin ${adminUser.email} imported CSV: ${inserted} inserted, ${skipped} skipped, ${errors.length} errors.`,
        meta: { inserted, skipped, errorsCount: errors.length },
        requestId,
      });

      resolve({ inserted, skipped, errors });
    });
  });
};

export const exportSolarDataCsv = async (query, res) => {
  const filter = {};
  if (query.source) filter.source = query.source;
  if (query.from || query.to) {
    filter.timestamp = {};
    if (query.from) filter.timestamp.$gte = new Date(query.from);
    if (query.to) filter.timestamp.$lte = new Date(query.to);
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="solardata_export.csv"');

  const stringifier = stringify({
    header: true,
    columns: [
      'timestamp',
      'locationName',
      'latitude',
      'longitude',
      'timezone',
      'ghiWm2',
      'dniWm2',
      'dhiWm2',
      'temperatureC',
      'cloudCoverPct',
      'humidityPct',
      'windSpeedMs',
      'acPowerKw',
      'capacityKw',
      'source',
    ],
  });

  stringifier.pipe(res);

  const cursor = SolarData.find(filter).sort({ timestamp: -1 }).cursor();

  for await (const doc of cursor) {
    stringifier.write({
      timestamp: doc.timestamp.toISOString(),
      locationName: doc.location.name,
      latitude: doc.location.latitude,
      longitude: doc.location.longitude,
      timezone: doc.location.timezone,
      ghiWm2: doc.ghiWm2,
      dniWm2: doc.dniWm2,
      dhiWm2: doc.dhiWm2,
      temperatureC: doc.temperatureC,
      cloudCoverPct: doc.cloudCoverPct ?? '',
      humidityPct: doc.humidityPct ?? '',
      windSpeedMs: doc.windSpeedMs ?? '',
      acPowerKw: doc.acPowerKw ?? '',
      capacityKw: doc.capacityKw ?? '',
      source: doc.source,
    });
  }

  stringifier.end();
};
