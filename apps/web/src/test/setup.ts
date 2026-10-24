import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

import "@testing-library/jest-dom/vitest";

// Vitest roda sem `globals: true`, então a limpeza automática do RTL precisa
// ser ligada manualmente — sem isso cada teste acumula o DOM do anterior.
afterEach(cleanup);
