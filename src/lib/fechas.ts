// "2026-08-03" → "3 ago 2026". Se interpreta como fecha local, sin hora,
// para que la zona horaria no la corra un día.
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}
