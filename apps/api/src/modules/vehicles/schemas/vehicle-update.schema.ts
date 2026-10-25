import { z } from 'zod';
import {
  anoField,
  chassiField,
  nullableVehicleFields,
  marcaField,
  modeloField,
  nullableCor,
  nullableRenavam,
  placaField,
} from './vehicle-fields.js';

// Semântica de PATCH: campo ausente = inalterado; null limpa apenas os opcionais.
export const vehicleUpdateSchema = z
  .object({
    placa: placaField.optional(),
    marca: marcaField.optional(),
    modelo: modeloField.optional(),
    ano: anoField.optional(),
    chassi: chassiField.optional(),
    renavam: nullableRenavam,
    cor: nullableCor,
    ...nullableVehicleFields,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
