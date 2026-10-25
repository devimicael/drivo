"use client";

import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { cx } from "@/lib/cx";
import { useCrlvScan } from "@/hooks/use-crlv-scan";
import type { CrlvScanResponse } from "@/services/crlv";
import { validateCrlvFile } from "./validate-crlv-file";

export type UploadedCrlv = { name: string; size: number; type: string };

type Props = {
  onScanned: (result: CrlvScanResponse["data"], file: UploadedCrlv) => void;
  onManual: (reason?: string) => void;
};

export function CrlvUploadForm({ onScanned, onManual }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const scan = useCrlvScan();
  const errorMessage = validationError ?? (scan.error instanceof ApiError && scan.error.status === 502
    ? "Falha na leitura automática. Preencha manualmente."
    : scan.error ? "Não foi possível ler o arquivo. Tente novamente ou preencha manualmente." : null);

  function selectFile(selected?: File) {
    // Keep the File in React state but clear the native input so it can emit
    // change again when the same document is selected on a later attempt.
    if (input.current) input.current.value = "";
    setValidationError(null);
    scan.reset();
    if (!selected) { setFile(null); return; }
    const error = validateCrlvFile(selected);
    if (error) { setFile(null); setValidationError(error); return; }
    setFile(selected);
  }

  function dropFile(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!scan.isPending) selectFile(event.dataTransfer.files[0]);
  }

  async function submit() {
    if (!file) { setValidationError("Selecione um arquivo para continuar."); return; }
    try {
      const result = await scan.mutateAsync(file);
      onScanned(result.data, { name: file.name, size: file.size, type: file.type });
    } catch (error) {
      if (error instanceof ApiError && error.status === 502) onManual("Falha na leitura automática. Preencha manualmente.");
    }
  }

  return (
    <section className="mx-auto max-w-[520px] rounded-[20px] bg-raised p-6 sm:p-7" aria-labelledby="crlv-import-title">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
          <span className="material-symbols-rounded text-[22px] leading-none">document_scanner</span>
        </span>
        <div>
          <h2 id="crlv-import-title" className="text-[16px] font-semibold text-bright">Importar CRLV</h2>
          <p className="mt-1 text-xs text-muted">Preenchemos o formulário para você</p>
        </div>
      </div>

      <input ref={input} aria-label="Documento CRLV" className="sr-only" type="file" disabled={scan.isPending}
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        onChange={(event) => selectFile(event.target.files?.[0])} />

      {file ? (
        <div className="mt-5 flex min-h-16 items-center gap-3 rounded-xl bg-field px-4 py-3" role="status">
          <span className={cx("material-symbols-rounded text-[22px]", file.type === "application/pdf" ? "text-danger" : "text-primary")} aria-hidden="true">
            {file.type === "application/pdf" ? "picture_as_pdf" : "image"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-bright">{file.name}</p>
            <p className="mt-0.5 text-[11px] text-tertiary">{Math.max(1, Math.round(file.size / 1024))} KB · pronto para leitura</p>
          </div>
          <span className="material-symbols-rounded text-xl text-success" aria-hidden="true">check_circle</span>
        </div>
      ) : (
        <div className="mt-5" onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={dropFile}>
          <button type="button" disabled={scan.isPending} onClick={() => input.current?.click()}
            className={cx("flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60", dragging ? "border-primary bg-primary/10" : "border-separator bg-field hover:border-primary hover:bg-elevated")}>
            <span className="material-symbols-rounded text-[26px] text-primary" aria-hidden="true">upload_file</span>
            <span className="mt-2 text-sm font-medium text-bright">Selecionar CRLV</span>
            <span className="mt-1 text-xs text-muted">ou arraste o arquivo para cá</span>
          </button>
          <p className="mt-3 text-center text-[11px] text-tertiary">PDF, JPG, PNG ou WebP · Até 5 MB</p>
        </div>
      )}

      {errorMessage ? <p role="alert" className="mt-3 text-sm text-danger">{errorMessage}</p> : null}

      {scan.isPending ? (
        <p role="status" aria-live="polite" aria-atomic="true" className="mt-4 text-center text-xs text-muted">
          Enviando e analisando o documento. A leitura pode levar até 30 segundos.
        </p>
      ) : null}

      {file ? (
        <Button type="button" variant="secondary" disabled={scan.isPending}
          onClick={() => { if (input.current) input.current.value = ""; input.current?.click(); }}
          className="mt-5">Importar outro CRLV</Button>
      ) : null}
      <Button type="button" loading={scan.isPending} disabled={!file || scan.isPending} onClick={submit}
        className="mt-3">{scan.isPending ? "Lendo CRLV..." : "Ler documento"}</Button>
      <button type="button" disabled={scan.isPending} onClick={() => onManual()}
        className="mx-auto mt-4 block cursor-pointer text-xs font-medium text-muted underline-offset-4 hover:text-bright hover:underline disabled:cursor-not-allowed disabled:opacity-60">
        Preencher manualmente
      </button>
    </section>
  );
}
