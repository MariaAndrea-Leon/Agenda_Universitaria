"use client";

import { useEffect } from "react";

// Evento que Chrome y Android lanzan cuando la app se puede instalar.
export interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __eventoInstalar?: EventoInstalar | null;
  }
}

export const EVENTO_INSTALABLE = "agenda:instalable";

// Registra el service worker para que la app se pueda instalar y muestre
// una página propia cuando no hay conexión. También guarda el aviso de
// instalación, que llega una sola vez y antes de que se abra el perfil.
export function RegistrarSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const alPoderInstalar = (e: Event) => {
      e.preventDefault();
      window.__eventoInstalar = e as EventoInstalar;
      window.dispatchEvent(new Event(EVENTO_INSTALABLE));
    };
    const alInstalar = () => {
      window.__eventoInstalar = null;
      window.dispatchEvent(new Event(EVENTO_INSTALABLE));
    };
    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);
  return null;
}
