import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2).max(100),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    subject: z.string({ required_error: 'Subject is required' }).trim().min(2).max(150),
    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(2000, 'Message cannot exceed 2000 characters'),
  }),
});

export const updateContactStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID format'),
  }),
  body: z.object({
    status: z.enum(['new', 'read', 'resolved']),
  }),
});
