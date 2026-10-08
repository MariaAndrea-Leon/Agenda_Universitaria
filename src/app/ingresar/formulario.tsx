"use client";

import { useActionState, useState } from "react";
import { iniciarSesion, registrarse, type EstadoIngreso } from "./acciones";
import { Campo } from "@/components/campo";

export function FormularioIngreso() {
  const [modo, setModo] = useState<"ingresar" | "registrarse">("ingresar");
  const [estadoIngreso, ingresar, ingresando] = useActionState<EstadoIngreso, FormData>(iniciarSesion, {});
  const [estadoRegistro, registrar, registrando] = useActionState<EstadoIngreso, FormData>(registrarse, {});

  const esRegistro = modo === "registrarse";
  const estado = esRegistro ? estadoRegistro : estadoIngreso;
  const pendiente = esRegistro ? registrando : ingresando;

  return (
    <div className="rounded-2xl bg-superficie p-6">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-fondo p-1" role="tablist">
        {(["ingresar", "registrarse"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={`rounded-lg py-2 font-medium ${modo === m ? "bg-primario text-sobre-primario" : ""}`}
          >
            {m === "ingresar" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form action={esRegistro ? registrar : ingresar} className="flex flex-col gap-4" key={modo}>
        {esRegistro && <Campo etiqueta="Nombre" name="nombre" autoComplete="name" defaultValue={estado.nombre} required />}
        <Campo
          etiqueta="Correo"
          name="correo"
          type="email"
          autoComplete="email"
          defaultValue={estado.correo}
          required
        />
        <Campo
          etiqueta="Contraseña"
          name="clave"
          type="password"
          autoComplete={esRegistro ? "new-password" : "current-password"}
          minLength={8}
          required
        />

        {estado.error && (
          <p role="alert" className="rounded-lg bg-alerta px-3 py-2 text-sm font-bold text-sobre-alerta">
            {estado.error}
          </p>
        )}
        {estado.aviso && (
          <p role="status" className="rounded-lg bg-acento px-3 py-2 text-sm text-sobre-acento">
            {estado.aviso}
          </p>
        )}

        <button
          type="submit"
          disabled={pendiente}
          className="rounded-xl bg-primario px-5 py-2.5 font-medium text-sobre-primario disabled:opacity-60"
        >
          {pendiente ? "Un momento…" : esRegistro ? "Crear cuenta" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
