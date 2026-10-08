// Lo que cada equipo recuerda de la app instalada, y el registro en el
// historial de equipos. Corre solo en el navegador.
import { nombreDispositivo } from "@/lib/dispositivo";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

const CLAVE = "agenda:dispositivo";
const INSTALADA = "agenda:instalada";
const ULTIMO_REGISTRO = "agenda:ultimo-registro";
const CADA = 12 * 60 * 60 * 1000;

function leer(nombre: string): string | null {
  try {
    return localStorage.getItem(nombre);
  } catch {
    return null;
  }
}

function escribir(nombre: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(nombre);
    else localStorage.setItem(nombre, valor);
  } catch {}
}

export const enModoApp = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const marcarInstalada = (si: boolean) => escribir(INSTALADA, si ? "1" : null);
export const pareceInstalada = () => leer(INSTALADA) === "1";

export function claveDelEquipo(): string {
  let clave = leer(CLAVE);
  if (!clave) {
    clave = crypto.randomUUID();
    escribir(CLAVE, clave);
  }
  return clave;
}

// Chrome y Edge dicen si la app ya está instalada en el equipo.
export async function instaladaSegunNavegador(): Promise<boolean> {
  const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> };
  if (!nav.getInstalledRelatedApps) return false;
  try {
    return (await nav.getInstalledRelatedApps()).length > 0;
  } catch {
    return false;
  }
}

// Agrega o actualiza este equipo en el historial (como mucho cada 12 horas).
export async function registrarEquipo(forzar = false) {
  const ultimo = Number(leer(ULTIMO_REGISTRO) ?? 0);
  if (!forzar && Date.now() - ultimo < CADA) return;
  const supabase = crearClienteNavegador();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await supabase
    .from("dispositivos")
    .upsert(
      {
        clave: claveDelEquipo(),
        nombre: nombreDispositivo(navigator.userAgent, navigator.maxTouchPoints),
        ultimo_uso: new Date().toISOString(),
      },
      { onConflict: "usuario_id,clave" },
    );
  if (!error) escribir(ULTIMO_REGISTRO, String(Date.now()));
}
