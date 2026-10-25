"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/Logo";
import { LogoutButton } from "@/features/auth/LogoutButton";

export function GarageHeader() {
  const pathname = usePathname();
  const session = useSession();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const name = session.data?.name ?? "";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-BR"))
    .join("");
  const garageIsActive = pathname.startsWith("/garagem");
  const profileIsActive = pathname.startsWith("/perfil");

  return (
    <header className="relative z-20 bg-surface">
      <div className="relative mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 sm:px-10">
        <Link href="/garagem" aria-label="Drivo, ir para garagem" className="flex items-center gap-2.5">
          <Logo width={64} />
          <span className="text-[18px] font-semibold tracking-[-0.04em] text-bright">Drivo</span>
        </Link>
        <nav aria-label="Navegação principal" className="relative z-10 flex shrink-0 items-center rounded-full bg-raised p-1 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
          <Link href="/garagem" aria-current={garageIsActive ? "page" : undefined}
            className={`rounded-full px-2.5 py-2 text-[10px] font-medium transition-colors sm:px-4 sm:text-xs ${garageIsActive ? "bg-elevated text-bright" : "text-muted hover:text-bright"}`}>
            Meus veículos
          </Link>
          <Link href="/perfil" aria-current={profileIsActive ? "page" : undefined}
            className={`rounded-full px-2.5 py-2 text-[10px] font-medium transition-colors sm:px-4 sm:text-xs ${profileIsActive ? "bg-elevated text-bright" : "text-muted hover:text-bright"}`}>
            Perfil
          </Link>
        </nav>
        <div className="relative ml-auto">
          <button type="button" aria-label="Abrir menu da conta" aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((open) => !open)}
            className="flex cursor-pointer items-center gap-3 rounded-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary">
            <span className="hidden text-xs text-muted sm:inline">{name}</span>
            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-[#635BFF] text-[11px] font-semibold text-white">{initials}</span>
          </button>
          {profileMenuOpen ? (
            <div className="absolute right-0 top-11 w-48 rounded-xl border border-separator bg-raised p-2 shadow-xl">
              <LogoutButton />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
