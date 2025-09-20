export enum OperacionEstado {
  Creado = 1,
  CargueInicio = 2,
  CaptureFirmaContratos = 3,
  CaptureFirmaMiFiel = 4,
  Cotizado = 5,
}

export const estadoDescriptions: { [k in OperacionEstado]: string } = {
  [OperacionEstado.Creado]: "Creado",
  [OperacionEstado.CargueInicio]: "Verificando Cotización",
  [OperacionEstado.CaptureFirmaContratos]: "Pendiente Firma Contratos",
  [OperacionEstado.CaptureFirmaMiFiel]: "Pendiente Autorización Firma Soportes",
  [OperacionEstado.Cotizado]: "Cotizado",
};

// Orden de flujo (5 pasos)
export const flujo5: OperacionEstado[] = [
  OperacionEstado.Creado,
  OperacionEstado.CargueInicio,
  OperacionEstado.CaptureFirmaContratos,
  OperacionEstado.CaptureFirmaMiFiel,
  OperacionEstado.Cotizado,
];

type Tone = "primary" | "success";

export function parseEstado(raw: number | string): OperacionEstado | null {
  if (typeof raw === "number")
    return OperacionEstado[raw] ? (raw as OperacionEstado) : null;
  const key = Object.keys(OperacionEstado).find(
    (k) => k.toLowerCase() === String(raw).toLowerCase()
  );
  return key ? ((OperacionEstado as any)[key] as OperacionEstado) : null;
}

export function operacionStateToUI(raw: number | string): {
  label: string;
  pct: number;
  tone: Tone;
} {
  const estado = parseEstado(raw);
  if (!estado) return { label: "Desconocido", pct: 0, tone: "primary" };

  const idx = flujo5.indexOf(estado);
  const pct = idx >= 0 ? Math.round((idx / (flujo5.length - 1)) * 100) : 0;

  return {
    label: estadoDescriptions[estado],
    pct,
    tone: estado === OperacionEstado.Cotizado ? "success" : "primary",
  };
}
