"use client";

import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/PageLoading";

export function SessionGate({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session.isPending) return <PageLoading />;
  if (session.isError) {
    if (session.error instanceof ApiError && session.error.status === 401)
      return <PageLoading />;
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-6 text-center">
        <section className="max-w-md rounded-2xl bg-raised p-8">
          <h1 className="text-xl font-semibold text-bright">
            Não foi possível conectar
          </h1>
          <p className="mt-3 text-sm text-muted">
            Verifique sua conexão e tente novamente.
          </p>
          <Button onClick={() => void session.refetch()} className="mt-6">
            Tentar novamente
          </Button>
        </section>
      </main>
    );
  }
  return children;
}
