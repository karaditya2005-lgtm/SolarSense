import { z } from 'zod';

export const createSolarDataSchema = z.object({
  body: z.object({
    location: z.object({
      name: z.string().trim().min(2).max(100),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      timezone: z.string().default('UTC'),
    }),
    timestamp: z.string().datetime(),
    ghiWm2: z.number().min(0).max(1500),
    dniWm2: z.number().min(0).default(0),
    dhiWm2: z.number().min(0).default(0),
    temperatureC: z.number().min(-60).max(70),
    cloudCoverPct: z.number().min(0).max(100).optional(),
    humidityPct: z.number().min(0).max(100).optional(),
    windSpeedMs: z.number().min(0).optional(),
    acPowerKw: z.number().min(0).optional(),
    capacityKw: z.number().min(0).optional(),
    source: z.string().trim().min(2).max(100),
  }),
});

export const updateSolarDataSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
  body: z.object({
    location: z
      .object({
        name: z.string().trim().min(2).max(100).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        timezone: z.string().optional(),
      })
      .optional(),
    timestamp: z.string().datetime().optional(),
    ghiWm2: z.number().min(0).max(1500).optional(),
    dniWm2: z.number().min(0).optional(),
    dhiWm2: z.number().min(0).optional(),
    temperatureC: z.number().min(-60).max(70).optional(),
    cloudCoverPct: z.number().min(0).max(100).optional(),
    humidityPct: z.number().min(0).max(100).optional(),
    windSpeedMs: z.number().min(0).optional(),
    acPowerKw: z.number().min(0).optional(),
    capacityKw: z.number().min(0).optional(),
    source: z.string().trim().min(2).max(100).optional(),
  }),
});
