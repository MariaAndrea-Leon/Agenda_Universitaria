import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad · Agenda Universitaria" };

// Página pública: la piden Play Store y App Store. El correo de contacto se
// configura con NEXT_PUBLIC_CORREO_SOPORTE.
export default function Privacidad() {
  const correo = process.env.NEXT_PUBLIC_CORREO_SOPORTE;
  const contacto = correo ? (
    <a href={`mailto:${correo}`} className="underline">
      {correo}
    </a>
  ) : (
    "el correo de soporte que aparece en la ficha de la app en la tienda"
  );
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-8 [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
      <h1 className="text-2xl font-bold">Política de privacidad</h1>
      <p className="text-sm">Última actualización: 13 de octubre de 2026.</p>
      <p>
        Agenda Universitaria es una agenda para estudiantes: clases, tareas, exámenes, notas y apuntes. Esta página explica
        qué datos guarda, para qué y cómo borrarlos.
      </p>

      <h2>Qué datos guardamos</h2>
      <ul>
        <li>Tu cuenta: correo y contraseña (la contraseña se guarda cifrada; nadie puede leerla).</li>
        <li>Tu perfil: nombre, universidad, carrera, zona horaria, tema de colores y preferencias de recordatorios.</li>
        <li>Lo que escribes en la agenda: semestres, materias, horarios, tareas, exámenes, notas y apuntes del pizarrón, con las imágenes y enlaces que les pongas.</li>
        <li>Los apuntes que compartes: a quién se los compartiste (su correo).</li>
        <li>Los equipos donde instalaste la app (por ejemplo «Android · Chrome») y la fecha de último uso.</li>
        <li>Si activas notificaciones, la dirección técnica que da tu navegador para enviarlas.</li>
      </ul>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Solo para que la agenda funcione: mostrarte tus datos en tus equipos, enviarte los recordatorios que pediste y dejarte compartir apuntes.</li>
        <li>No vendemos tus datos, no mostramos publicidad y no los usamos para rastrearte en otras apps o sitios.</li>
      </ul>

      <h2>Quién más los ve</h2>
      <ul>
        <li>Nadie más ve tus datos, salvo los apuntes que tú compartas con otra persona por su correo; esa persona los puede ver pero no cambiar.</li>
        <li>
          Los datos se guardan con proveedores que prestan el servicio técnico: Supabase (base de datos, cuentas e imágenes),
          Vercel (la página web) y, si activas los recordatorios por correo, Resend (envío de correos). Ellos no pueden usarlos para
          otra cosa.
        </li>
        <li>Todo viaja cifrado (HTTPS) y cada persona solo puede leer sus propios datos.</li>
      </ul>

      <h2 id="eliminar">Cómo eliminar tu cuenta y tus datos</h2>
      <p>
        Dentro de la app entra a <strong>Perfil → Eliminar mi cuenta</strong>, escribe tu correo y confirma. Se borran de inmediato
        tu cuenta y todos tus datos, incluidas las imágenes del pizarrón. Si ya no puedes entrar, escríbenos a {contacto} desde el
        correo de la cuenta y la borramos.
      </p>

      <h2>Menores de edad</h2>
      <p>La app es para estudiantes universitarios y no está dirigida a menores de 13 años.</p>

      <h2>Contacto</h2>
      <p>Si tienes preguntas sobre tus datos, escríbenos a {contacto}.</p>

      <p>
        <a href="/ingresar" className="underline">
          Volver a la agenda
        </a>
      </p>
    </main>
  );
}
