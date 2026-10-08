import type { Apunte } from "@/lib/modelos";

// Fila de apuntes_compartidos con el apunte que se comparte.
export interface Compartido {
  id: string;
  propietario_nombre: string | null;
  propietario_correo: string | null;
  materia_nombre: string;
  creado_en: string;
  apuntes: Apunte | null;
}

export const COLUMNAS_COMPARTIDO = "id, propietario_nombre, propietario_correo, materia_nombre, creado_en, apuntes(*)";

// "Andrea (andrea@utp.edu.co)"
export const deQuien = (c: Pick<Compartido, "propietario_nombre" | "propietario_correo">) =>
  [c.propietario_nombre, c.propietario_correo && `(${c.propietario_correo})`].filter(Boolean).join(" ") || "Otra persona";
