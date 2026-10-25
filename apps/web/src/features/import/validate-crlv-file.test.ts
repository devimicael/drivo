import { describe, expect, it } from "vitest";
import { validateCrlvFile } from "./validate-crlv-file";

describe("CRLV upload before network", () => {
  it("rejects a forbidden extension even with an allowed MIME", () => {
    expect(validateCrlvFile({ name: "file.exe", type: "application/pdf", size: 100 })).not.toBeNull();
  });
  it("rejects oversized files and unsupported MIME", () => {
    expect(validateCrlvFile({ name: "crlv.pdf", type: "application/pdf", size: 5_242_881 })).not.toBeNull();
    expect(validateCrlvFile({ name: "crlv.pdf", type: "text/plain", size: 100 })).not.toBeNull();
  });
  it("accepts supported files at the size limit", () => {
    expect(validateCrlvFile({ name: "CRLV.PDF", type: "application/pdf", size: 5_242_880 })).toBeNull();
    expect(validateCrlvFile({ name: "crlv.jpeg", type: "image/jpeg", size: 100 })).toBeNull();
  });
});
