"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehiclesService } from "@/services/vehicles";
import type { VehicleCreateInput } from "@/schemas/vehicle.schema";

export const vehiclesQueryKey = ["vehicles"] as const;

export function useVehicles(search = "") {
  return useQuery({
    queryKey: [...vehiclesQueryKey, search] as const,
    queryFn: () => vehiclesService.list(search),
  });
}

export function useVehicle(id: string, enabled = true) {
  return useQuery({
    queryKey: [...vehiclesQueryKey, "detail", id] as const,
    queryFn: () => vehiclesService.getOne(id),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleCreateInput) => vehiclesService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vehiclesQueryKey });
    },
  });
}

export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<VehicleCreateInput>) => vehiclesService.update(id, input),
    onSuccess: async (vehicle) => {
      queryClient.setQueryData([...vehiclesQueryKey, "detail", id], vehicle);
      await queryClient.invalidateQueries({ queryKey: vehiclesQueryKey });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiclesService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vehiclesQueryKey });
    },
  });
}
