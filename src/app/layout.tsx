import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { COOKIE_MODO, COOKIE_TEMA, cssDeTemas } from "@/lib/temas/css";
import { MODO_POR_DEFECTO, TEMA_POR_DEFECTO, esModo, esTemaId } from "@/lib/temas/temas";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agenda Universitaria",
  description: "Clases, tareas, exámenes y notas de la universidad en un solo lugar.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const galletas = await cookies();
  const temaGuardado = galletas.get(COOKIE_TEMA)?.value;
  const modoGuardado = galletas.get(COOKIE_MODO)?.value;
  const tema = esTemaId(temaGuardado) ? temaGuardado : TEMA_POR_DEFECTO;
  const modo = esModo(modoGuardado) ? modoGuardado : MODO_POR_DEFECTO;

  return (
    <html lang="es" data-tema={tema} data-modo={modo}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssDeTemas() }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
