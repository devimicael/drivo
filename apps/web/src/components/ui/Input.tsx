"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { cx } from "@/lib/cx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Rótulo curto renderizado acima do campo, ligado via `htmlFor`. */
  label: string;
  /** Mensagem de validação/anúncio. Vazio = campo válido. */
  error?: string;
}

const BASE =
  "h-12 w-full rounded-lg bg-field px-3.5 text-[15px] text-foreground outline-hidden " +
  "placeholder:text-muted/85 " +
  "transition-shadow duration-200 " +
  "focus-visible:ring-2 focus-visible:ring-primary/70 " +
  "aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger/70";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id: idProp, className, type = "text", ...props },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-bright">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(BASE, className)}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
