import Image from "next/image";
import type { ReactNode } from "react";

export interface AuthHeroProps {
  /** Foto exibida no quadro arredondado (ex.: /img/login.jpg). */
  image: string;
  /** Título curto em duas linhas, canto inferior esquerdo. */
  title: ReactNode;
  /** Apoio em cinza, largura limitada para quebrar em duas linhas. */
  subtitle: string;
  /**
   * `alt` é vazio: a foto é decorativa; o texto sobreposto é a mensagem real.
   */
  imageAlt?: string;
}

/**
 * Coluna esquerda das telas de autenticação (desktop): foto em moldura
 * arredondada com gradiente de contraste e copy no canto inferior.
 * Só aparece em lg+ (abaixo disso a autenticação fica em tela cheia).
 */
export function AuthHero({ image, imageAlt = "", title, subtitle }: AuthHeroProps) {
  return (
    <div className="hidden p-3 lg:flex">
      <figure className="relative flex-1 overflow-hidden rounded-3xl">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        {/* Gradiente de baixo para cima garante contraste do texto. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/5"
        />
        <figcaption className="absolute inset-x-0 bottom-0 p-7">
          <h2 className="text-[28px] leading-[1.2] font-bold text-white">{title}</h2>
          <p className="mt-3 max-w-[290px] text-sm text-bright">{subtitle}</p>
        </figcaption>
      </figure>
    </div>
  );
}
