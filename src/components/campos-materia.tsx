import { Campo } from "@/components/campo";
import { COLORES_MATERIA, type Materia } from "@/lib/modelos";

// Campos compartidos por los formularios de crear y editar materia.
export function CamposMateria({ materia, colorSugerido }: { materia?: Materia; colorSugerido?: string }) {
  const color = materia?.color ?? colorSugerido ?? COLORES_MATERIA[0];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" name="nombre" defaultValue={materia?.nombre} placeholder="Cálculo diferencial" required />
        <Campo etiqueta="Docente" name="docente" defaultValue={materia?.docente ?? ""} />
        <Campo etiqueta="Código" name="codigo" defaultValue={materia?.codigo ?? ""} />
        <Campo
          etiqueta="Créditos"
          name="creditos"
          type="number"
          min={0}
          max={20}
          defaultValue={materia?.creditos ?? ""}
        />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLORES_MATERIA.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={c === color} className="peer sr-only" />
              <span
                className="block size-9 rounded-full ring-texto ring-offset-2 ring-offset-superficie peer-checked:ring-2 peer-focus-visible:ring-2"
                style={{ backgroundColor: c }}
              />
              <span className="sr-only">{c}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
