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
3. `…_modo_oscuro.sql`: preferencia de modo claro / oscuro en el perfil.

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

El estudiante elige en su perfil (o con el botón de luna/sol de la barra):

- **Modo**: claro, oscuro o según el dispositivo.
- **Tema del modo claro**: Atardecer o Tierra.

El modo oscuro siempre usa el tema Bosque. Los colores están en
`src/lib/temas/temas.ts` y se asignan a roles (fondo, superficie, acento,
alerta, primario, texto, barra) que se usan en Tailwind como `bg-primario`,
`text-sobre-acento`, etc. El fondo de la página es un degradado con los
colores de cada tema. Las pruebas verifican el contraste de cada tema.

| Rol | Atardecer | Tierra | Bosque (oscuro) |
|---|---|---|---|
| Fondo | `#F3F4F5` | `#F6F4F1` | `#051F20` |
| Superficie | `#D8E0E1` | `#ECE2CE` | `#163832` |
| Acento | `#FF9408` | `#F2B635` | `#8EB69B` |
| Alerta | `#CA3F16` | `#E45C10` | `#E07A5F` |
| Primario | `#95122C` | `#4B5D16` | `#8EB69B` |
| Barra | `#95122C` | `#4B5D16` | `#0B2B26` |
| Texto | `#100C08` | `#223300` | `#DAF1DE` |

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
