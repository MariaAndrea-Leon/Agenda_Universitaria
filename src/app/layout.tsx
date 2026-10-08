import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { COOKIE_TEMA, cssDeTemas } from "@/lib/temas/css";
import { TEMA_POR_DEFECTO, esTemaId } from "@/lib/temas/temas";
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
  const guardado = (await cookies()).get(COOKIE_TEMA)?.value;
  const tema = esTemaId(guardado) ? guardado : TEMA_POR_DEFECTO;

  return (
    <html lang="es" data-tema={tema}>
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
