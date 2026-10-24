import { z } from 'zod';

export const vehicleQuerySchema = z.object({
  search: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().trim().max(80, 'Termo de pesquisa muito longo.').optional(),
  ),
});

export type VehicleQuery = z.infer<typeof vehicleQuerySchema>;
