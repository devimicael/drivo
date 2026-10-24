import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./LoginForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

const mutateAsync = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-auth", () => ({
  useLogin: () => ({ mutateAsync, isPending: false, error: null }),
}));

// next/image não existe no jsdom; um <img> simples basta para os testes.
// <img> aqui é intencional (mock do next/image); o lint já foi avisado por linha.
vi.mock("next/image", () => ({
  /* eslint-disable-next-line @next/next/no-img-element */
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
  });

  it("anuncia erro de validação nos dois campos ao enviar vazio", async () => {
    render(<LoginForm />);

    fireEvent.submit(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
      expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("envia credenciais válidas para o hook de login", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "mariana.costa@email.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-secreta" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "mariana.costa@email.com",
        password: "senha-secreta",
      });
    });
  });

  it("exibe a marca com texto alternativo", () => {
    render(<LoginForm />);

    expect(screen.getByAltText("Drivo")).toBeInTheDocument();
  });
});
