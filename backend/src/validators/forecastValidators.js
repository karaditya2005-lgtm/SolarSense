import { z } from 'zod';

export const createForecastSchema = z.object({
  body: z
    .object({
      locationQuery: z.string().trim().min(2).max(150).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      targetDateTime: z
        .string({ required_error: 'targetDateTime is required' })
        .datetime({ message: 'targetDateTime must be a valid ISO 8601 datetime' }),
      systemCapacityKw: z
        .number({ required_error: 'systemCapacityKw is required' })
        .min(0.1, 'Capacity must be at least 0.1 kW')
        .max(10000, 'Capacity cannot exceed 10,000 kW'),
      tiltDeg: z.number().min(0).max(90).optional(),
      azimuthDeg: z.number().min(0).max(360).optional(),
      mode: z.enum(['single', 'day']).default('day'),
      weatherOverrides: z
        .object({
          temperatureC: z.number().min(-60).max(75).optional(),
          cloudCoverPct: z.number().min(0).max(100).optional(),
          ghiWm2: z.number().min(0).max(1500).optional(),
          humidityPct: z.number().min(0).max(100).optional(),
          windSpeedMs: z.number().min(0).max(100).optional(),
        })
        .optional(),
    })
    .refine(
      (data) =>
        (data.locationQuery && data.locationQuery.length >= 2) ||
        (data.latitude !== undefined && data.longitude !== undefined),
      {
        message: 'Either locationQuery or both latitude and longitude must be provided',
        path: ['locationQuery'],
      }
    ),
});

export const getForecastsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    status: z.enum(['pending', 'completed', 'failed']).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    q: z.string().optional(),
    userId: z.string().optional(),
    location: z.string().optional(),
    model: z.string().optional(),
  }),
});
