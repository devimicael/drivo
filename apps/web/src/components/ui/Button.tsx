"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Variante visual. Reaproveite no cadastro e nas telas da garagem. */
  variant?: ButtonVariant;
  /** Estado de envio: desabilita o botão e mostra indicador. */
  loading?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-field text-foreground hover:bg-bright/10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading = false, disabled, className, children, ...props },
  ref,
) {
  const isInert = Boolean(disabled) || loading;

  return (
    <button
      ref={ref}
      type="button" // sobrescrito por quem passa type="submit"
      disabled={isInert}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold",
        "transition-colors duration-200",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span aria-hidden="true" className="material-symbols-rounded animate-spin text-base">
            progress_activity
          </span>
          <span className="sr-only">Enviando…</span>
        </>
      ) : null}
      <span>{children}</span>
    </button>
  );
});
