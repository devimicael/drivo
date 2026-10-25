"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLogout } from "@/hooks/use-auth";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const logout = useLogout();
  const [error, setError] = useState(false);

  async function handleLogout() {
    try {
      setError(false);
      await logout.mutateAsync();
      router.replace("/login");
    } catch {
      setError(true);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={logout.isPending}
        className={
          compact
            ? "cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-primary hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            : "w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-bright hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {logout.isPending ? "Saindo…" : compact ? "Sair" : "Encerrar sessão"}
      </button>
      {error ? (
        <p role="alert" className="px-3 py-2 text-xs text-danger">
          Não foi possível sair. Tente novamente.
        </p>
      ) : null}
    </div>
  );
}
