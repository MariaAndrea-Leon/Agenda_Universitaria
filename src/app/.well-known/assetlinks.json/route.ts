import { NextResponse } from "next/server";

// Prueba para Android de que la app de Play Store y esta página son de la
// misma persona, así la app abre la página a pantalla completa (sin barra
// del navegador). La huella sale de Play Console > Integridad de la app.
export function GET() {
  const huellas = (process.env.ANDROID_SHA256 ?? "")
    .split(",")
    .map((h) => h.trim().toUpperCase())
    .filter(Boolean);
  const paquete = process.env.ANDROID_PAQUETE || "app.vercel.agenda_universitaria_zeta.twa";
  return NextResponse.json(
    huellas.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: { namespace: "android_app", package_name: paquete, sha256_cert_fingerprints: huellas },
          },
        ]
      : [],
  );
}
