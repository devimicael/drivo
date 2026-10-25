import { describe, expect, it } from "vitest";

import { vehicleCreateSchema as backendVehicleSchema } from "../../../api/src/modules/vehicles/schemas/vehicle-create.schema.js";
import { vehicleSchema } from "./vehicle.schema";

describe("vehicle schema contract", () => {
  it("keeps the browser and API create payload keys in sync", () => {
    expect(Object.keys(vehicleSchema.shape).sort()).toEqual(
      Object.keys(backendVehicleSchema.shape).sort(),
    );
  });

  it("accepts the same required create payload as the API", () => {
    const payload = {
      placa: "abc-1d23",
      marca: " Toyota ",
      modelo: "Corolla",
      ano: "2023",
      chassi: "9BWZZZ377VT004251",
    };

    expect(vehicleSchema.parse(payload)).toEqual(backendVehicleSchema.parse(payload));
  });

  it("allows empty optional numeric inputs when creating a vehicle manually", () => {
    const result = vehicleSchema.parse({
      placa: "ABC1D23", marca: "Toyota", modelo: "Corolla", ano: "2023",
      chassi: "9BWZZZ377VT004251", cilindrada: "", anoFabricacao: " ",
    });
    expect(result.cilindrada).toBeUndefined();
    expect(result.anoFabricacao).toBeUndefined();
    expect(backendVehicleSchema.safeParse(result).success).toBe(true);
  });

  it("preserves populated numeric fields during CRLV review", () => {
    const result = vehicleSchema.parse({
      placa: "ABC1D23", marca: "Toyota", modelo: "Corolla", ano: "2023",
      chassi: "9BWZZZ377VT004251", cilindrada: 1800, anoFabricacao: 2022,
    });
    expect(result.cilindrada).toBe(1800);
    expect(result.anoFabricacao).toBe(2022);
  });
});
