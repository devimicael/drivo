import { z } from 'zod';
import {
  anoField,
  chassiField,
  optionalVehicleFields,
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
    ...optionalVehicleFields,
  })
  // `.strict()`: userId/origem/chaves desconhecidas são recusados com 400 (RF16).
  .strict();

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
