import type { ReactNode } from "react";
import { SessionGate } from "@/features/auth/SessionGate";

// A validação de navegação instantânea não consegue prerenderizar a sessão,
// que é confirmada em tempo de execução pelo endpoint de autenticação.
export const instant = false;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <SessionGate>{children}</SessionGate>;
}
