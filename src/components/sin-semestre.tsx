import Link from "next/link";

export function SinSemestre({ titulo }: { titulo: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="rounded-2xl bg-superficie p-4">
        Para empezar, crea tu semestre y agrega tus materias.{" "}
        <Link href="/semestres" className="font-medium underline">
          Crear semestre
        </Link>
      </p>
    </>
  );
}

export function SinMaterias({ titulo }: { titulo: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="rounded-2xl bg-superficie p-4">
        Primero agrega tus materias.{" "}
        <Link href="/materias" className="font-medium underline">
          Ir a materias
        </Link>
      </p>
    </>
  );
}
