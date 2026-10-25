"use client";
import { PageLoading } from "@/components/ui/PageLoading";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GarageHeader } from "@/components/garage/GarageHeader";
import { VehicleForm } from "@/features/garage/VehicleForm";
import { useSession } from "@/hooks/use-auth";
import { useCreateVehicle } from "@/hooks/use-vehicles";
import type { VehicleCreateInput } from "@/schemas/vehicle.schema";

function CrlvUploadCard() {
  return (
    <section
      className="rounded-[20px] bg-raised p-5 sm:p-6"
      aria-labelledby="crlv-title"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <span className="material-symbols-rounded text-[22px] leading-none">
            document_scanner
          </span>
        </span>
        <div>
          <h2 id="crlv-title" className="text-[16px] font-semibold text-bright">
            Importar CRLV
          </h2>
          <p className="mt-1 text-xs text-muted">
            Preenchemos o formulário para você
          </p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-muted">
        Envie o documento em PDF ou imagem e revise os dados extraídos antes de salvar.
      </p>
      <Link
        href="/garagem/importar"
        className="mt-5 flex h-11 cursor-pointer items-center justify-center rounded-lg bg-field px-4 text-sm font-semibold text-bright transition hover:bg-elevated focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/70"
      >
        Selecionar CRLV
      </Link>
    </section>
  );
}

export default function NewVehiclePage() {
  const router = useRouter();
  const session = useSession();
  const createVehicle = useCreateVehicle();

  useEffect(() => {
    if (session.isError) router.replace("/login");
  }, [session.isError, router]);

  async function handleSubmit(values: VehicleCreateInput) {
    try {
      await createVehicle.mutateAsync(values);
      router.push("/garagem?criado=1");
    } catch {
      // A mutation mantém o erro para exibição junto ao formulário.
    }
  }

  if (session.isPending || !session.data) return <PageLoading />;

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <GarageHeader />
      <main className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-7 sm:px-8 sm:pt-8 xl:px-20">
        <Link
          href="/garagem"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
        >
          <span
            className="material-symbols-rounded text-base"
            aria-hidden="true"
          >
            arrow_back
          </span>{" "}
          Voltar
        </Link>
        <h1 className="mb-7 mt-2 text-[30px] font-bold leading-tight tracking-[-0.04em] text-bright sm:text-[40px]">
          Novo veículo
        </h1>
        <VehicleForm
          onSubmit={handleSubmit}
          busy={createVehicle.isPending}
          error={createVehicle.error}
          aside={<CrlvUploadCard />}
        />
      </main>
    </div>
  );
}
