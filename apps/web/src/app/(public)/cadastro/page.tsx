import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Criar conta — DRIVO",
};

export default function CadastroPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <RegisterForm />
    </main>
  );
}
