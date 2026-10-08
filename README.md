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

El esquema está en `supabase/migrations/` (aplicar en orden):

1. `…_esquema_inicial.sql`: tablas `perfiles`, `semestres`, `materias`,
   `bloques_horario`, `tareas`, `evaluaciones`, `recordatorios` y
   `suscripciones_push`, todas con Row Level Security (cada usuario solo ve
   sus propios datos).
2. `…_activar_semestre.sql`: función para cambiar el semestre activo.

### Conectar el proyecto de Supabase

1. En el panel de Supabase, abre **SQL Editor**, pega cada archivo de
   `supabase/migrations/` en orden y ejecútalo. (Con la CLI: `npx supabase link`
   y luego `npx supabase db push`.)
2. En **Authentication > URL Configuration**, pon como *Site URL* la dirección
   donde corre la app (por ejemplo la de Vercel) y agrega
   `https://tu-app.vercel.app/auth/confirmar` y `http://localhost:3000/auth/confirmar`
   en *Redirect URLs*. Ese es el destino del correo de confirmación.
3. En **Project Settings > API** copia *Project URL* y la clave *anon public* a
   `.env.local` (y a las variables de entorno de Vercel).

### Supabase local (opcional)

Con Docker instalado, `npx supabase start` levanta una copia local con las
migraciones aplicadas e imprime la URL y la clave anon para `.env.local`.

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
  app/(app)/         Páginas con sesión: horario, materias, semestres, perfil
  app/ingresar/      Inicio de sesión y registro
  app/auth/          Confirmación de correo y cierre de sesión
  lib/horario/       Lógica del horario (cruces, grilla) con pruebas
  lib/temas/         Temas de color y cálculo de contraste
  lib/supabase/      Clientes de Supabase y middleware de sesión
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
