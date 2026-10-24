import { z } from 'zod';
import {
  anoField,
  chassiField,
  figmaPendingOptionalFields,
  marcaField,
  modeloField,
  optionalCor,
  optionalRenavam,
  placaField,
} from './vehicle-fields.js';

export const vehicleCreateSchema = z
  .object({
    placa: placaField,
    marca: marcaField,
    modelo: modeloField,
    ano: anoField,
    chassi: chassiField,
    renavam: optionalRenavam,
    cor: optionalCor,
    ...figmaPendingOptionalFields,
  })
  // `.strict()`: userId/origem/chaves desconhecidas são recusados com 400 (RF16).
  .strict();

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
