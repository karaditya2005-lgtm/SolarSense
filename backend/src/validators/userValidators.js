import { z } from 'zod';

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    organization: z.string().trim().max(120).optional(),
    preferences: z
      .object({
        units: z.enum(['metric', 'imperial']).optional(),
        defaultLocation: z
          .object({
            name: z.string().optional(),
            latitude: z.number().min(-90).max(90).optional(),
            longitude: z.number().min(-180).max(180).optional(),
            timezone: z.string().optional(),
          })
          .optional(),
        defaultCapacityKw: z.number().min(0.1).max(10000).optional(),
        batteryCapacityKwh: z.number().min(0).max(10000).nullish(),
      })
      .optional(),
  }),
});

export const deleteMeSchema = z.object({
  body: z.object({
    password: z.string({ required_error: 'Password confirmation is required to delete account' }),
  }),
});

export const adminUpdateUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
  body: z.object({
    role: z.enum(['user', 'admin']).optional(),
    status: z.enum(['active', 'suspended']).optional(),
    name: z.string().trim().min(2).max(80).optional(),
  }),
});
