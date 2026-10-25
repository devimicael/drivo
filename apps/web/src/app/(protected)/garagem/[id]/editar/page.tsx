"use client";
import { PageLoading } from "@/components/ui/PageLoading";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { GarageHeader } from "@/components/garage/GarageHeader";
import { VehicleForm } from "@/features/garage/VehicleForm";
import {
  vehicleFormValues,
  vehicleUpdateValues,
} from "@/features/garage/vehicle-form-values";
import { VehicleDeleteDialog } from "@/features/garage/VehicleDeleteDialog";
import { useSession } from "@/hooks/use-auth";
import {
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicle,
} from "@/hooks/use-vehicles";
import { ApiError } from "@/lib/api";
import type { VehicleCreateInput } from "@/schemas/vehicle.schema";

export default function EditVehiclePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditVehicleContent />
    </Suspense>
  );
}

function EditVehicleContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const session = useSession();
  const vehicle = useVehicle(id, Boolean(session.data));
  const update = useUpdateVehicle(id);
  const remove = useDeleteVehicle();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (session.isError) router.replace("/login");
  }, [session.isError, router]);

  async function save(values: VehicleCreateInput) {
    try {
      await update.mutateAsync(vehicleUpdateValues(values));
      router.push("/garagem?atualizado=1");
    } catch {
      // A mutation mantém o erro para exibição junto ao formulário.
    }
  }

  if (session.isPending || !session.data || vehicle.isPending) {
    return <PageLoading />;
  }

  if (vehicle.isError || !vehicle.data) {
    const notFound =
      vehicle.error instanceof ApiError && vehicle.error.status === 404;
    return (
      <main className="min-h-screen bg-surface text-foreground">
        <GarageHeader />
        <section className="mx-auto max-w-xl px-5 py-20 text-center">
          <h1 className="text-2xl font-bold text-bright">
            {notFound
              ? "Veículo não encontrado"
              : "Não foi possível carregar o veículo"}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {notFound
              ? "Este veículo não existe ou não pertence à sua conta."
              : "Tente novamente em instantes."}
          </p>
          <Link
            href="/garagem"
            className="mt-6 inline-flex h-11 items-center rounded-lg bg-field px-5 text-sm font-semibold text-bright"
          >
            Voltar à garagem
          </Link>
        </section>
      </main>
    );
  }

  const current = vehicle.data;
  const date = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  const aside = (
    <div className="space-y-6">
      <section
        aria-label="Histórico do veículo"
        className="space-y-5 rounded-2xl bg-raised p-6 text-xs"
      >
        <p className="flex justify-between gap-3">
          <span className="text-tertiary">Cadastrado em</span>
          <span>{date(current.createdAt)}</span>
        </p>
        <p className="flex justify-between gap-3">
          <span className="text-tertiary">Última alteração</span>
          <span>{date(current.updatedAt)}</span>
        </p>
      </section>
      <Link
        href={`/garagem/importar?editar=${id}`}
        className="flex h-11 items-center justify-center rounded-lg bg-field px-5 text-xs font-semibold text-bright hover:bg-elevated"
      >
        Atualizar com novo CRLV
      </Link>
      <section className="rounded-2xl bg-raised p-6">
        <h2 className="text-sm font-semibold">Excluir veículo</h2>
        <p className="mt-2 text-xs leading-5 text-muted">
          Remove o veículo e todos os seus dados da sua garagem. Não é possível
          desfazer.
        </p>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-danger/10 text-xs font-semibold text-danger hover:bg-danger/20"
        >
          Excluir veículo
        </button>
      </section>
    </div>
  );
  return (
    <main className="min-h-screen bg-surface text-foreground">
      <GarageHeader />
      <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-7 sm:px-8 sm:pt-8 xl:px-20">
        <Link
          href="/garagem"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
        >
          <span
            className="material-symbols-rounded text-base"
            aria-hidden="true"
          >
            arrow_back
          </span>
          Voltar
        </Link>
        <h1 className="mb-7 mt-2 text-[30px] font-bold leading-tight tracking-[-0.04em] text-bright sm:text-[40px]">
          {current.modelo}
        </h1>
        <VehicleForm
          mode="edit"
          initialValues={vehicleFormValues(current)}
          onSubmit={save}
          busy={update.isPending}
          error={update.error}
          aside={aside}
        />
      </div>
      {confirmDelete ? (
        <VehicleDeleteDialog
          vehicle={current}
          pending={remove.isPending}
          error={remove.error}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            void remove
              .mutateAsync(id)
              .then(() => router.push("/garagem"))
              .catch(() => undefined);
          }}
        />
      ) : null}
    </main>
  );
}
