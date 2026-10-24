import Image from "next/image";

import { cx } from "@/lib/cx";

/**
 * Marca DRIVO (carro branco). `alt="Drivo"` porque é o identificador da página.
 * Largura controlada pelo chamador — o arquivo original tem proporção 89×28.
 */
export function Logo({ width = 48, className }: { width?: number; className?: string }) {
  return (
    <Image
      src="/img/logo.png"
      alt="Drivo"
      width={89}
      height={28}
      style={{ width }}
      className={cx("h-auto", className)}
    />
  );
}
