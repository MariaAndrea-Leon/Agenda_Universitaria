// Filas de la base de datos tal como las devuelve Supabase.

import type { Modo, TemaId } from "@/lib/temas/temas";

export interface Perfil {
  id: string;
  nombre: string | null;
  universidad: string | null;
  carrera: string | null;
  zona_horaria: string;
  tema: TemaId;
  modo: Modo;
  nota_aprobatoria: number;
  avisos_push: boolean;
  avisos_correo: boolean;
  avisos_antes: number[];
  token_calendario?: string; // falta si no se ha corrido la migración del calendario
}

export interface Semestre {
  id: string;
  nombre: string;
  inicio: string; // "YYYY-MM-DD"
  fin: string;
  activo: boolean;
}

export interface Materia {
  id: string;
  semestre_id: string;
  nombre: string;
  codigo: string | null;
  docente: string | null;
  creditos: number | null;
  color: string;
}

export interface Bloque {
  id: string;
  materia_id: string;
  dia_semana: number;
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string;
  salon: string | null;
  tipo: "clase" | "laboratorio" | "tutoria" | "otro";
}

export const TIPOS_BLOQUE: { valor: Bloque["tipo"]; nombre: string }[] = [
  { valor: "clase", nombre: "Clase" },
  { valor: "laboratorio", nombre: "Laboratorio" },
  { valor: "tutoria", nombre: "Tutoría" },
  { valor: "otro", nombre: "Otro" },
];

// Colores para distinguir materias. Son independientes del tema y todos
// dejan leer texto blanco encima (contraste de al menos 4,5:1).
export const COLORES_MATERIA = [
  "#95122C",
  "#B4361A",
  "#8A5A00",
  "#4B5D16",
  "#1F6B4F",
  "#0E6377",
  "#1D4E89",
  "#4C3A8F",
  "#7A2E77",
  "#5B4636",
] as const;

export interface Tarea {
  id: string;
  materia_id: string;
  titulo: string;
  descripcion: string | null;
  entrega: string; // ISO
  prioridad: "baja" | "media" | "alta";
  completada_en: string | null;
}

export const PRIORIDADES: { valor: Tarea["prioridad"]; nombre: string }[] = [
  { valor: "alta", nombre: "Alta" },
  { valor: "media", nombre: "Media" },
  { valor: "baja", nombre: "Baja" },
];

export interface Evaluacion {
  id: string;
  materia_id: string;
  nombre: string;
  tipo: "examen" | "quiz" | "taller" | "exposicion" | "proyecto" | "otro";
  porcentaje: number;
  fecha: string | null; // ISO
  salon: string | null;
  temas: string | null;
  nota: number | null;
  creado_en: string;
}

export const TIPOS_EVALUACION: { valor: Evaluacion["tipo"]; nombre: string }[] = [
  { valor: "examen", nombre: "Examen" },
  { valor: "quiz", nombre: "Quiz" },
  { valor: "taller", nombre: "Taller" },
  { valor: "exposicion", nombre: "Exposición" },
  { valor: "proyecto", nombre: "Proyecto" },
  { valor: "otro", nombre: "Otro" },
];

export type MateriaCorta = Pick<Materia, "id" | "nombre" | "color">;

export interface Apunte {
  id: string;
  usuario_id: string;
  materia_id: string;
  fecha: string; // "YYYY-MM-DD"
  titulo: string | null;
  fondo: string;
  dibujo: unknown; // se valida con leerDibujo
  creado_en: string;
  editado_en: string;
}
