import { z } from 'zod';

export const updateSettingSchema = z.object({
  params: z.object({
    key: z.string().trim().min(1),
  }),
  body: z.object({
    value: z.any({ required_error: 'Value is required' }),
  }),
});
