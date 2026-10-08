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
