"use client";

import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cx";
import type { UploadedCrlv } from "./CrlvUploadForm";

type Props = { file: UploadedCrlv; onReplace: () => void };

export function CrlvScannedCard({ file, onReplace }: Props) {
  const isPdf = file.type === "application/pdf";

  return (
    <section className="rounded-[20px] bg-raised p-6" aria-labelledby="scanned-crlv-title">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
          <span className="material-symbols-rounded text-[22px] leading-none">
            document_scanner
          </span>
        </span>
        <div>
          <h2 id="scanned-crlv-title" className="text-[16px] font-semibold text-bright">Importar CRLV</h2>
          <p className="mt-1 text-xs text-muted">Preenchemos o formulário para você</p>
        </div>
      </div>
      <div className="mt-5 flex min-h-16 items-center gap-3 rounded-xl bg-field px-4 py-3">
        <span className={cx("material-symbols-rounded text-[22px]", isPdf ? "text-danger" : "text-primary")} aria-hidden="true">
          {isPdf ? "picture_as_pdf" : "image"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-bright">{file.name}</p>
          <p className="mt-0.5 text-[11px] text-tertiary">{Math.max(1, Math.round(file.size / 1024))} KB · lido agora</p>
        </div>
        <span className="material-symbols-rounded text-xl text-success" aria-label="Leitura concluída">check_circle</span>
      </div>
      <Button type="button" variant="secondary" onClick={onReplace} className="mt-5">
        Importar outro CRLV
      </Button>
    </section>
  );
}
