import webpush from "web-push";

// Envío de notificaciones push (Web Push con claves VAPID) y de correos
// (Resend). Cada función dice si el canal está configurado.

export interface SuscripcionPush {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface Mensaje {
  titulo: string;
  cuerpo: string;
  url: string;
}

export function pushConfigurado() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function correoConfigurado() {
  return Boolean(process.env.RESEND_API_KEY);
}

// Los servicios de push exigen un contacto https: o mailto:.
function contactoVapid(sitio: string) {
  if (process.env.VAPID_CONTACTO) return process.env.VAPID_CONTACTO;
  return sitio.startsWith("https://") ? sitio : "mailto:agenda@example.com";
}

// "ok", "vencida" (hay que borrar la suscripción) o "error".
export async function enviarPush(s: SuscripcionPush, m: Mensaje, sitio: string) {
  try {
    await webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      JSON.stringify(m),
      {
        vapidDetails: {
          subject: contactoVapid(sitio),
          publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          privateKey: process.env.VAPID_PRIVATE_KEY!,
        },
        TTL: 60 * 60 * 12,
      },
    );
    return "ok" as const;
  } catch (e) {
    const estado = (e as { statusCode?: number }).statusCode;
    return estado === 404 || estado === 410 ? ("vencida" as const) : ("error" as const);
  }
}

const escapar = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function enviarCorreo(para: string, m: Mensaje, sitio: string) {
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Agenda Universitaria <onboarding@resend.dev>",
      to: [para],
      subject: m.titulo,
      text: `${m.titulo}\n${m.cuerpo}\n\nAbre tu agenda: ${sitio}${m.url}`,
      html: `<p style="font-size:16px"><strong>${escapar(m.titulo)}</strong><br>${escapar(m.cuerpo)}</p><p><a href="${sitio}${m.url}">Abrir mi agenda</a></p>`,
    }),
  }).catch(() => null);
  return respuesta?.ok ? ("ok" as const) : ("error" as const);
}
