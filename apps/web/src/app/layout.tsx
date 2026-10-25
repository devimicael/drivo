import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "material-symbols/rounded.css";
import "./globals.css";

// Figma (Design System): Inter para textos e JetBrains Mono para dados de
// veículo (placa, Renavam, chassi).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DRIVO",
  description: "Sua garagem organizada: cadastre e consulte seus veículos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Extensões como LanguageTool podem adicionar atributos ao <html> antes da hidratação.
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
