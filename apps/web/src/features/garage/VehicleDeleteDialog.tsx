"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import type { Vehicle } from "@/services/vehicles";

type Props = {
  vehicle: Vehicle;
  pending: boolean;
  error: unknown;
  onCancel: () => void;
  onConfirm: () => void;
};

export function VehicleDeleteDialog({
  vehicle,
  pending,
  error,
  onCancel,
  onConfirm,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      element?.close();
    };
  }, []);
  function requestClose() {
    if (pending || isClosing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCancel();
      return;
    }
    setIsClosing(true);
    closeTimer.current = setTimeout(onCancel, 140);
  }
  const message =
    error instanceof ApiError
      ? error.message
      : error
        ? "Não foi possível excluir o veículo."
        : null;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="delete-vehicle-title"
      aria-describedby="delete-vehicle-description"
      data-closing={isClosing ? "true" : undefined}
      className="m-auto w-[calc(100%_-_40px)] max-w-[400px] rounded-[20px] border border-separator/60 bg-raised text-foreground shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-[6px]"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section className="px-6 pb-7 pt-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger">
          <span className="material-symbols-rounded text-[23px]" aria-hidden="true">
            warning_amber
          </span>
        </div>
        <h2
          id="delete-vehicle-title"
          className="mt-5 text-[17px] font-semibold leading-6 text-bright"
        >
          Excluir {vehicle.marca} {vehicle.modelo}?
        </h2>
        <p
          id="delete-vehicle-description"
          className="mt-3 text-[13px] leading-5 text-muted"
        >
          O veículo de placa {vehicle.placa} e todos os seus dados serão
          removidos permanentemente.
        </p>
        {message ? (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {message}
          </p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={requestClose}
            autoFocus
            className="min-w-0 flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={pending}
            onClick={onConfirm}
            className="min-w-0 flex-1"
          >
            Excluir
          </Button>
        </div>
      </section>
    </dialog>
  );
}
