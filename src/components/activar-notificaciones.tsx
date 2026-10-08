"use client";

import { useEffect, useState, useTransition } from "react";
import { borrarSuscripcion, guardarSuscripcion, probarNotificacion } from "@/app/(app)/perfil/avisos";
import { Boton } from "./boton";

type Estado = "cargando" | "sin-soporte" | "sin-configurar" | "bloqueadas" | "inactivas" | "activas";

const CLAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function aBytes(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

// Activa o desactiva las notificaciones push en este dispositivo.
export function ActivarNotificaciones() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, empezar] = useTransition();

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setEstado("sin-soporte");
      }
      if (!CLAVE) return setEstado("sin-configurar");
      if (Notification.permission === "denied") return setEstado("bloqueadas");
      const registro = await navigator.serviceWorker.getRegistration();
      const sub = await registro?.pushManager.getSubscription();
      setEstado(sub ? "activas" : "inactivas");
    })();
  }, []);

  const activar = () =>
    empezar(async () => {
      setAviso(null);
      try {
        const permiso = await Notification.requestPermission();
        if (permiso !== "granted") return setEstado(permiso === "denied" ? "bloqueadas" : "inactivas");
        const registro = await navigator.serviceWorker.ready;
        const sub = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(CLAVE!) });
        const error = await guardarSuscripcion(sub.toJSON());
        if (error) {
          await sub.unsubscribe();
          setAviso(error);
          return;
        }
        setEstado("activas");
      } catch {
        setAviso("No se pudieron activar las notificaciones en este navegador.");
      }
    });

  const desactivar = () =>
    empezar(async () => {
      setAviso(null);
      const registro = await navigator.serviceWorker.getRegistration();
      const sub = await registro?.pushManager.getSubscription();
      if (sub) {
        await borrarSuscripcion(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("inactivas");
    });

  const probar = () =>
    empezar(async () => {
      setAviso(await probarNotificacion());
    });

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-fondo p-3">
      <p className="text-sm font-medium">Notificaciones en este dispositivo</p>
      {estado === "cargando" && <p className="text-sm opacity-80">Revisando…</p>}
      {estado === "sin-soporte" && (
        <p className="text-sm">
          Este navegador no permite notificaciones. En iPhone funcionan solo con la app instalada en la pantalla de
          inicio (iOS 16.4 o superior).
        </p>
      )}
      {estado === "sin-configurar" && (
        <p className="text-sm">Las notificaciones todavía no están configuradas en el servidor.</p>
      )}
      {estado === "bloqueadas" && (
        <p className="text-sm">
          Las notificaciones están bloqueadas para esta página. Permítelas en la configuración del navegador y vuelve a
          intentar.
        </p>
      )}
      {estado === "inactivas" && (
        <Boton type="button" onClick={activar} disabled={ocupado} className="self-start">
          Activar notificaciones
        </Boton>
      )}
      {estado === "activas" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Activadas.</span>
          <Boton type="button" variante="secundario" onClick={probar} disabled={ocupado}>
            Enviar una prueba
          </Boton>
          <Boton type="button" variante="secundario" onClick={desactivar} disabled={ocupado}>
            Desactivar
          </Boton>
        </div>
      )}
      {aviso && (
        <p role="status" className="text-sm">
          {aviso}
        </p>
      )}
    </div>
  );
}
