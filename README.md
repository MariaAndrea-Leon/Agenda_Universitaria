# Agenda Universitaria

Aplicativo web (instalable en el celular) para llevar en un solo lugar las
materias, el horario semanal, las tareas, los exámenes, los recordatorios y
las notas de la universidad, con promedio ponderado en escala de 0,0 a 5,0.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase**: PostgreSQL, autenticación y Row Level Security
- **Vitest** para pruebas
- Despliegue en **Vercel**

## Cómo correrlo

1. Instala Node.js 22 o superior.
2. Instala dependencias: `npm install`
3. Copia `.env.example` como `.env.local` y llena las claves de tu proyecto de Supabase.
4. Inicia el servidor: `npm run dev` y abre http://localhost:3000

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Pruebas (Vitest) |
| `npm run lint` | Revisión de estilo (ESLint) |
| `npm run typecheck` | Revisión de tipos |
| `npm run build` | Compilación de producción |

## Base de datos

El esquema está en `supabase/migrations/`. Para aplicarlo a tu proyecto de
Supabase puedes pegar el archivo SQL en el editor SQL del panel, o usar la
CLI de Supabase (`supabase link` y luego `supabase db push`).

Tablas: `perfiles`, `semestres`, `materias`, `bloques_horario`, `tareas`,
`evaluaciones` (exámenes y actividades calificables, con porcentaje y nota),
`recordatorios` y `suscripciones_push`. Todas tienen Row Level Security: cada
usuario solo ve sus propios datos.

## Temas de color

El estudiante elige un tema al configurar su agenda. Los colores están en
`src/lib/temas/temas.ts` y se asignan a roles (fondo, superficie, acento,
alerta, primario, texto) que se usan en Tailwind como `bg-primario`,
`text-sobre-acento`, etc. Las pruebas verifican el contraste de cada tema.

| Rol | Atardecer | Tierra |
|---|---|---|
| Fondo | `#F3F4F5` | `#F6F4F1` |
| Superficie | `#D8E0E1` | `#ECE2CE` |
| Acento | `#FF9408` | `#F2B635` |
| Alerta | `#CA3F16` | `#E45C10` |
| Primario | `#95122C` | `#4B5D16` |
| Texto | `#100C08` | `#223300` |

## Estructura

```
src/
  app/               Páginas (App Router)
  components/        Componentes de interfaz
  lib/temas/         Temas de color y cálculo de contraste
  lib/supabase/      Clientes de Supabase (navegador y servidor)
supabase/migrations/ Esquema de la base de datos
```

## Plan

| Fase | Contenido |
|---|---|
| 0 | Proyecto base, temas, esquema de base de datos, CI |
| 1 | Login, semestres, materias y horario |
| 2 | Tareas, exámenes, panel "Hoy" y calendario |
| 3 | Notas, promedios y "¿cuánto necesito?" |
| 4 | Recordatorios e instalación como app (PWA) |
| 5 | Exportar a Google Calendar, pulido y pruebas con usuarios |
