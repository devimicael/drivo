"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import {
  vehicleSchema,
  type VehicleCreateInput,
  type VehicleFormValues,
} from "@/schemas/vehicle.schema";

type Props = {
  onSubmit: (values: VehicleCreateInput) => Promise<void>;
  busy: boolean;
  error: unknown;
  initialValues?: Partial<VehicleFormValues>;
  missingFields?: string[];
  aside?: ReactNode;
  mode?: "create" | "edit";
};

export function VehicleForm({
  onSubmit,
  busy,
  error,
  initialValues,
  aside,
  missingFields = [],
  mode = "create",
}: Props) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues, unknown, VehicleCreateInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      placa: "",
      marca: "",
      modelo: "",
      ano: "",
      chassi: "",
      renavam: "",
      cor: "",
      combustivel: "",
      apelido: "",
      cilindrada: "",
      tipo: "",
      uf: "",
      anoFabricacao: "",
      ...initialValues,
    },
  });
  const chassiLength = String(
    useWatch({ control, name: "chassi" }) ?? "",
  ).length;
  const marca = useWatch({ control, name: "marca" });
  const modelo = useWatch({ control, name: "modelo" });
  const values = useWatch({ control });
  const serverError =
    error instanceof ApiError
      ? error.message
      : error
        ? "Não foi possível salvar o veículo. Tente novamente."
        : null;
  const field = (name: keyof VehicleFormValues) =>
    (errors[name]?.message as string | undefined) ??
    (missingFields.includes(name) && !String(values[name] ?? "").trim()
      ? "Não identificado no documento. Preencha este campo."
      : undefined);
  const previewName = [marca?.trim(), modelo?.trim()].filter(Boolean).join(" ");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="pb-24">
      {serverError ? (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </p>
      ) : null}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-raised p-5 sm:p-6">
            <header className="mb-5">
              <h2 className="text-lg font-semibold text-bright">
                Identificação
              </h2>
              <p className="mt-1 text-xs text-muted">
                Dados oficiais do veículo, conforme o documento.
              </p>
            </header>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Input
                label="Placa"
                className="font-mono"
                placeholder="ABC1D23"
                maxLength={8}
                autoCapitalize="characters"
                error={field("placa")}
                {...register("placa")}
              />
              <Input
                label="RENAVAM"
                className="font-mono"
                placeholder="Somente números"
                inputMode="numeric"
                error={field("renavam")}
                {...register("renavam")}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Chassi"
                  className="font-mono"
                  placeholder="17 caracteres"
                  maxLength={17}
                  autoCapitalize="characters"
                  error={field("chassi")}
                  {...register("chassi")}
                />
                <p
                  className="mt-1 text-right text-[10px] text-tertiary"
                  aria-live="polite"
                >
                  {chassiLength}/17
                </p>
              </div>
            </div>
          </section>
          <section className="rounded-2xl bg-raised p-5 sm:p-6">
            <header className="mb-5">
              <h2 className="text-lg font-semibold text-bright">
                Características
              </h2>
              <p className="mt-1 text-xs text-muted">
                Como o veículo aparece na sua garagem.
              </p>
            </header>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Input
                label="Marca"
                placeholder="Ex.: Toyota"
                maxLength={60}
                error={field("marca")}
                {...register("marca")}
              />
              <Input
                label="Modelo"
                placeholder="Ex.: Corolla"
                maxLength={80}
                error={field("modelo")}
                {...register("modelo")}
              />
            </div>
            <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-3">
              <Input
                label="Ano de fabricação"
                placeholder="Opcional"
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                error={field("anoFabricacao")}
                {...register("anoFabricacao")}
              />
              <Input
                label="Ano do modelo"
                placeholder="2024"
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                error={field("ano")}
                {...register("ano")}
              />
              <Input
                label="Cor"
                placeholder="Ex.: Prata"
                maxLength={40}
                error={field("cor")}
                {...register("cor")}
              />
              <Input
                label="Combustível"
                placeholder="Ex.: Híbrido"
                maxLength={40}
                error={field("combustivel")}
                {...register("combustivel")}
              />
              <Input
                label="Tipo"
                placeholder="Ex.: Automóvel"
                maxLength={40}
                error={field("tipo")}
                {...register("tipo")}
              />
              <Input
                label="Apelido (opcional)"
                placeholder="Ex.: Carro da família"
                maxLength={80}
                error={field("apelido")}
                {...register("apelido")}
              />
            </div>
            <details className="mt-5 border-t border-separator pt-4">
              <summary className="cursor-pointer text-xs font-medium text-muted marker:text-tertiary hover:text-bright">
                Outros dados opcionais
              </summary>
              <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <Input
                  label="Cilindrada (cm³)"
                  placeholder="500 a 10.000"
                  type="number"
                  min={500}
                  max={10000}
                  error={field("cilindrada")}
                  {...register("cilindrada")}
                />
                <Input
                  label="UF"
                  placeholder="Ex.: SP"
                  maxLength={2}
                  autoCapitalize="characters"
                  error={field("uf")}
                  {...register("uf")}
                />
              </div>
            </details>
          </section>
        </div>
        {aside ? <aside>{aside}</aside> : null}
      </div>
      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-separator bg-raised/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-3 sm:px-8 xl:px-20">
          <p className="hidden truncate text-xs text-muted sm:block">
            {mode === "edit" ? "Editando" : "Novo veículo"}
            {previewName ? ` · ${previewName}` : ""}
            {mode === "edit" && values.placa ? ` · ${values.placa}` : ""}
          </p>
          <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/garagem"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-field px-6 text-sm font-semibold text-bright hover:bg-elevated"
            >
              Cancelar
            </Link>
            <Button
              type="submit"
              loading={busy || isSubmitting}
              className="sm:w-auto sm:min-w-40"
            >
              {mode === "edit" ? "Salvar alterações" : "Salvar veículo"}
            </Button>
          </div>
        </div>
      </footer>
    </form>
  );
}
