import { z } from 'zod';

export const issueFormSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  categoryId: z.string().optional(),
  departmentId: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  isAnonymous: z.boolean()
});
