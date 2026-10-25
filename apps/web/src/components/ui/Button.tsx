"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Variante visual. Reaproveite no cadastro e nas telas da garagem. */
  variant?: ButtonVariant;
  /** Estado de envio: desabilita o botão e mostra indicador. */
  loading?: boolean;
  size?: "default" | "compact";
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-field text-foreground hover:bg-bright/10",
  danger: "bg-danger text-white hover:bg-danger/90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading = false, size = "default", disabled, className, children, ...props },
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
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold",
        size === "compact" ? "h-9 w-auto px-4 text-xs" : "h-11 w-full text-sm",
        "transition-[background-color,color,transform,box-shadow] duration-150 ease-out enabled:hover:-translate-y-px enabled:hover:shadow-sm enabled:active:translate-y-0",
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
