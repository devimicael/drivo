import type { Vehicle } from "@/services/vehicles";
import type {
  VehicleCreateInput,
  VehicleFormValues,
} from "@/schemas/vehicle.schema";

export function vehicleFormValues(vehicle: Vehicle): VehicleFormValues {
  return {
    placa: vehicle.placa,
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    ano: vehicle.ano,
    chassi: vehicle.chassi,
    renavam: vehicle.renavam ?? "",
    cor: vehicle.cor ?? "",
    combustivel: vehicle.combustivel ?? "",
    apelido: vehicle.apelido ?? "",
    cilindrada: vehicle.cilindrada ?? "",
    tipo: vehicle.tipo ?? "",
    uf: vehicle.uf ?? "",
    anoFabricacao: vehicle.anoFabricacao ?? "",
  };
}

export function vehicleUpdateValues(
  values: VehicleCreateInput,
): VehicleCreateInput {
  return {
    ...values,
    renavam: values.renavam ?? null,
    cor: values.cor ?? null,
    combustivel: values.combustivel ?? null,
    apelido: values.apelido ?? null,
    cilindrada: values.cilindrada ?? null,
    tipo: values.tipo ?? null,
    uf: values.uf ?? null,
    anoFabricacao: values.anoFabricacao ?? null,
  };
}
