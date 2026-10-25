"use client";
import { PageLoading } from "@/components/ui/PageLoading";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GarageHeader } from "@/components/garage/GarageHeader";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/hooks/use-auth";
import { useVehicles } from "@/hooks/use-vehicles";
import type { Vehicle } from "@/services/vehicles";
import { vehicleImage } from "@/features/garage/vehicle-image";

function VehicleCard({
  vehicle,
}: {
  vehicle: Vehicle;
}) {
  const modelYear = vehicle.anoFabricacao ?? vehicle.ano;
  const image = vehicleImage(vehicle.marca, vehicle.modelo);

  return (
    <article className="group overflow-hidden rounded-[22px] bg-raised transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none">
      <div className="relative flex h-[216px] items-center justify-center bg-[#101012] text-[#38383A]">
        {image ? (
          <>
            <Image
              src={image}
              alt={`Imagem ilustrativa de ${vehicle.marca} ${vehicle.modelo}`}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 414px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] group-focus-within:scale-[1.02] motion-reduce:transform-none"
            />
          </>
        ) : (
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[88px]"
          >
            {vehicle.tipo?.toLowerCase().includes("moto")
              ? "two_wheeler"
              : "directions_car"}
          </span>
        )}
      </div>
      <div className="relative min-h-[192px] px-5 pb-6 pt-[22px] sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-tertiary">
          {vehicle.marca}
        </p>
        <VehiclePlate plate={vehicle.placa} />
        <h2 className="mt-2 max-w-[72%] truncate text-[22px] font-semibold leading-[1.2] tracking-[-0.025em] text-bright">
          {vehicle.modelo}
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-muted" />
          <span>
            {[vehicle.cor, `${modelYear}/${vehicle.ano}`, vehicle.combustivel || vehicle.tipo]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </p>
        <div className="absolute inset-x-5 bottom-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_32px] items-end gap-3 text-tertiary sm:inset-x-6">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.12em]">Renavam</p>
            <p className="mt-1 truncate font-mono text-xs tracking-[0.02em] text-bright">
              {vehicle.renavam || "—"}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.12em]">Chassi</p>
            <p className="mt-1 truncate font-mono text-xs tracking-[0.02em] text-bright">
              {vehicle.chassi.slice(0, 3)}•••••••{vehicle.chassi.slice(-4)}
            </p>
          </div>
          <Link
            href={`/garagem/${vehicle.id}/editar`}
            aria-label={`Editar ${vehicle.marca} ${vehicle.modelo}`}
            className="flex size-8 items-center justify-center rounded-full bg-field text-bright transition-colors hover:bg-elevated focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-rounded text-lg" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function VehiclePlate({ plate }: { plate: string }) {
  return (
    <div
      aria-label={`Placa ${plate}`}
      className="absolute right-5 top-[42px] w-[104px] overflow-hidden rounded-[5px] border border-[#d5d9df] bg-white shadow-md sm:right-6"
    >
      <div className="flex h-[11px] items-center justify-between bg-[#1464b4] px-1.5 text-[6px] font-bold leading-none tracking-[0.08em] text-white">
        <span>BRASIL</span>
        <span
          aria-hidden="true"
          className="flex h-[5px] w-[8px] items-center justify-center rounded-[1px] bg-[#16864a] text-[3px] text-yellow-300"
        >
          ◆
        </span>
      </div>
      <div className="flex h-[22px] items-center justify-center font-mono text-[13px] font-bold leading-none tracking-[0.13em] text-[#121212]">
        {plate}
      </div>
    </div>
  );
}

function VehicleSkeleton() {
  return (
    <div aria-hidden="true" className="h-[408px] animate-pulse rounded-[22px] bg-raised" />
  );
}

function EmptyGarage() {
  return (
    <section className="flex min-h-[calc(100svh-128px)] flex-col items-center justify-center px-5 text-center">
      <h1 className="text-[26px] font-bold tracking-[-0.04em] text-bright">
        Sua garagem está vazia
      </h1>
      <p className="mt-3 max-w-[390px] text-sm leading-[1.55] text-muted">
        Adicione seu primeiro veículo. Com o CRLV em mãos, a maior parte dos
        dados é preenchida automaticamente.
      </p>
      <Link
        href="/garagem/importar"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-hover"
      >
        Importar CRLV
      </Link>
      <Link
        href="/garagem/novo"
        className="mt-4 text-xs text-muted underline hover:text-bright"
      >
        Cadastrar veículo manualmente
      </Link>
    </section>
  );
}

export function GaragePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleCreated = searchParams.get("criado") === "1";
  const vehicleUpdated = searchParams.get("atualizado") === "1";
  const session = useSession();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const vehicles = useVehicles(search);

  useEffect(() => {
    if (session.isError) router.replace("/login");
  }, [session.isError, router]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  if (session.isPending || !session.data) return <PageLoading />;

  const list = vehicles.data?.data ?? [];
  const total = vehicles.data?.meta.total ?? 0;

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <GarageHeader />
      {!search &&
      !vehicles.isPending &&
      vehicles.isSuccess &&
      list.length === 0 ? (
        <>
          <EmptyGarage />
          {vehicleCreated ? (
            <p role="status" className="sr-only">
              Veículo cadastrado com sucesso.
            </p>
          ) : null}
        </>
      ) : (
        <main className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-10 sm:px-8 sm:pt-12 xl:px-20">
          {vehicleCreated || vehicleUpdated ? (
            <p
              role="status"
              className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            >
              {vehicleUpdated
                ? "Veículo atualizado com sucesso."
                : "Veículo cadastrado com sucesso."}
            </p>
          ) : null}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-bold leading-tight tracking-[-0.04em] text-bright sm:text-[40px]">
                  Meus veículos
                </h1>
                <Link
                  href="/garagem/novo"
                  aria-label="Adicionar veículo"
                  className="flex size-9 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-hover"
                >
                  <span
                    className="material-symbols-rounded text-xl"
                    aria-hidden="true"
                  >
                    add
                  </span>
                </Link>
              </div>
              {vehicles.isSuccess ? (
                <p className="mt-1 text-xs text-muted">
                  {total}{" "}
                  {total === 1 ? "veículo cadastrado" : "veículos cadastrados"}
                </p>
              ) : null}
            </div>
            <label className="flex h-11 w-full items-center gap-2.5 rounded-xl bg-raised px-4 text-muted focus-within:ring-2 focus-within:ring-primary/70 lg:max-w-[320px]">
              <span className="sr-only">Buscar por placa ou modelo</span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por placa ou modelo"
                className="w-full bg-transparent text-xs text-bright outline-hidden placeholder:text-tertiary"
              />
            </label>
          </div>

          {vehicles.isPending ? (
            <section
              aria-label="Carregando veículos"
              aria-busy="true"
              className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              <VehicleSkeleton />
              <VehicleSkeleton />
              <VehicleSkeleton />
            </section>
          ) : vehicles.isError && !vehicles.data ? (
            <section className="mt-12 rounded-2xl bg-raised px-6 py-12 text-center">
              <p className="text-bright">
                Não foi possível carregar seus veículos.
              </p>
              <p className="mt-2 text-sm text-muted">
                Verifique sua conexão e tente novamente.
              </p>
              <Button
                type="button"
                onClick={() => void vehicles.refetch()}
                className="mx-auto mt-5 max-w-48"
              >
                Tentar novamente
              </Button>
            </section>
          ) : list.length === 0 ? (
            <section className="mt-12 rounded-2xl bg-raised px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-bright">
                Nenhum veículo encontrado
              </h2>
              <p className="mt-2 text-sm text-muted">
                Tente buscar por outra placa ou modelo.
              </p>
            </section>
          ) : (
            <>
              {vehicles.isError ? (
                <p role="status" className="mt-5 text-sm text-warning">
                  A lista exibida pode estar desatualizada. Não foi possível
                  atualizá-la agora.
                </p>
              ) : null}
              <section
                aria-label="Veículos cadastrados"
                className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {list.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
                {!search ? (
                  <Link
                    href="/garagem/novo"
                    className="flex min-h-[408px] flex-col items-center justify-center rounded-[22px] border border-dashed border-separator bg-surface px-6 text-center transition hover:border-primary hover:bg-raised"
                  >
                    <span
                      className="material-symbols-rounded text-4xl text-bright"
                      aria-hidden="true"
                    >
                      add_circle
                    </span>
                    <span className="mt-3 text-sm font-semibold text-bright">
                      Adicionar veículo
                    </span>
                    <span className="mt-1 text-xs text-muted">
                      Preencha manualmente ou importe o CRLV
                    </span>
                  </Link>
                ) : null}
              </section>
            </>
          )}
        </main>
      )}
    </div>
  );
}
