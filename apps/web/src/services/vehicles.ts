import { apiFetch } from "@/lib/api";
import type { VehicleCreateInput } from "@/schemas/vehicle.schema";

export interface Vehicle {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  chassi: string;
  renavam: string | null;
  cor: string | null;
  combustivel: string | null;
  apelido: string | null;
  cilindrada: number | null;
  tipo: string | null;
  uf: string | null;
  anoFabricacao: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleListResponse {
  data: Vehicle[];
  meta: { total: number; search: string | null };
}

export const vehiclesService = {
  list(search = ""): Promise<VehicleListResponse> {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    const suffix = params.size ? `?${params.toString()}` : "";
    return apiFetch(`/vehicles${suffix}`);
  },
  create(input: VehicleCreateInput): Promise<Vehicle> {
    return apiFetch("/vehicles", { method: "POST", body: JSON.stringify(input) });
  },
  getOne(id: string): Promise<Vehicle> {
    return apiFetch(`/vehicles/${id}`);
  },
  update(id: string, input: Partial<VehicleCreateInput>): Promise<Vehicle> {
    return apiFetch(`/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },
  remove(id: string): Promise<void> {
    return apiFetch(`/vehicles/${id}`, { method: "DELETE", headers: { "X-Confirm-Delete": "true" } });
  },
};
