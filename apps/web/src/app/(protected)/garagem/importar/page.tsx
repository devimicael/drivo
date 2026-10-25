"use client";
import { PageLoading } from "@/components/ui/PageLoading";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GarageHeader } from "@/components/garage/GarageHeader";
import { VehicleForm } from "@/features/garage/VehicleForm";
import { CrlvUploadForm } from "@/features/import/CrlvUploadForm";
import type { UploadedCrlv } from "@/features/import/CrlvUploadForm";
import { CrlvScannedCard } from "@/features/import/CrlvScannedCard";
import { useSession } from "@/hooks/use-auth";
import {
  useCreateVehicle,
  useUpdateVehicle,
  useVehicle,
} from "@/hooks/use-vehicles";
import {
  vehicleFormValues,
  vehicleUpdateValues,
} from "@/features/garage/vehicle-form-values";
import type {
  VehicleCreateInput,
  VehicleFormValues,
} from "@/schemas/vehicle.schema";
import type { CrlvScanResponse } from "@/services/crlv";

type ScanData = CrlvScanResponse["data"];

export default function ImportVehiclePage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen bg-surface"
          aria-label="Carregando importação"
          aria-busy="true"
        />
      }
    >
      <ImportVehicleContent />
    </Suspense>
  );
}

function ImportVehicleContent() {
  const router = useRouter();
  const session = useSession();
  const editId = useSearchParams().get("editar") ?? "";
  const currentVehicle = useVehicle(editId, Boolean(editId && session.data));
  const updateVehicle = useUpdateVehicle(editId);
  const createVehicle = useCreateVehicle();
  const [scan, setScan] = useState<ScanData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedCrlv | null>(null);
  const [manual, setManual] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  useEffect(() => {
    if (session.isError) router.replace("/login");
  }, [session.isError, router]);

  function resetImportState() {
    setScan(null);
    setUploadedFile(null);
    setManual(false);
    setScanError(null);
  }

  async function save(values: VehicleCreateInput) {
    try {
      if (editId) {
        await updateVehicle.mutateAsync(vehicleUpdateValues(values));
        resetImportState();
        router.push("/garagem?atualizado=1");
      } else {
        await createVehicle.mutateAsync(values);
        resetImportState();
        router.push("/garagem?criado=1");
      }
    } catch {
      /* O formulário exibe o erro da API. */
    }
  }

  if (session.isPending || !session.data) return <PageLoading />;
  if (editId && currentVehicle.isPending)
    return (
      <main
        className="min-h-screen bg-surface"
        aria-label="Carregando veículo"
        aria-busy="true"
      />
    );
  if (editId && currentVehicle.isError)
    return (
      <main className="min-h-screen bg-surface">
        <GarageHeader />
        <div className="mx-auto max-w-xl px-6 py-16 text-bright">
          <h1 className="text-xl font-semibold">
            Não foi possível carregar o veículo.
          </h1>
          <Link href="/garagem" className="mt-5 inline-block text-primary">
            Voltar à garagem
          </Link>
        </div>
      </main>
    );
  const initialValues = {
    ...(currentVehicle.data ? vehicleFormValues(currentVehicle.data) : {}),
    ...scan?.extracted,
  } as Partial<VehicleFormValues>;

  return (
    <main className="min-h-screen bg-surface pb-24">
      <GarageHeader />
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 xl:px-20">
        <Link
          href="/garagem"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-bright"
        >
          <span className="material-symbols-rounded text-lg" aria-hidden="true">
            arrow_back
          </span>
          Voltar à garagem
        </Link>
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">
            {editId ? "Atualizar veículo" : "Novo veículo"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-bright">Importar CRLV</h1>
          <p className="mt-2 text-sm text-muted">
            {scan
              ? "Revise os dados encontrados e confirme antes de salvar."
              : manual
                ? "Preencha os dados do veículo e confirme antes de salvar."
                : "Envie seu CRLV para preencher os dados automaticamente."}
          </p>
        </div>
        {scan || manual ? (
          <>
            {scan ? (
              <p className="mb-5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-bright">
                Leitura concluída. Confira cada campo antes de salvar; os dados
                do documento podem precisar de correção.
              </p>
            ) : (
              <p
                role={scanError ? "alert" : undefined}
                className="mb-5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-bright"
              >
                {scanError ?? "Preencha os dados do veículo manualmente."}
              </p>
            )}
            <VehicleForm
              mode={editId ? "edit" : "create"}
              onSubmit={save}
              busy={createVehicle.isPending || updateVehicle.isPending}
              error={editId ? updateVehicle.error : createVehicle.error}
              initialValues={initialValues}
              missingFields={scan?.missingRequiredFields}
              aside={scan && uploadedFile ? <CrlvScannedCard file={uploadedFile} onReplace={resetImportState} /> : undefined}
            />
          </>
        ) : (
          <CrlvUploadForm
            onScanned={(result, file) => {
              setScan(result);
              setUploadedFile(file);
            }}
            onManual={(reason) => {
              setScanError(reason ?? null);
              setManual(true);
            }}
          />
        )}
      </div>
    </main>
  );
}
