// --- Estados del backend:
export enum VinculacionEstado {
    Creado = 1,
    CaptureClaveCiec = 2,
    CaptureAutorizacionBuro = 3,
    CaptureFirmaMiFiel = 4,
    CaptureAutorizacionAvales = 5,
    CaptureFirmaAvales = 6,
    CaptureFormatosExpediente = 7,
    SeleccionClientesEstudio = 8,
    CaptureCargueFormatosExpediente = 9,
    Vinculado = 10,
    Rechazado = 11,
    Cancelado = 12,
    BuroDenied = 13,
  }
  
  export const estadoDescriptions: { [key in VinculacionEstado]: string } = {
    [VinculacionEstado.Creado]: "Creado",
    [VinculacionEstado.CaptureClaveCiec]: "Pendiente Clave Ciec",
    [VinculacionEstado.CaptureAutorizacionBuro]: "Pendiente Datos Buro",
    [VinculacionEstado.CaptureFirmaMiFiel]: "Pendiente Firma Rep. Legal",
    [VinculacionEstado.CaptureAutorizacionAvales]: "Pendiente Datos Avales",
    [VinculacionEstado.CaptureFirmaAvales]: "Pendiente Firma Avales",
    [VinculacionEstado.CaptureFormatosExpediente]: "Pendiente Creación Expediente Azul",
    [VinculacionEstado.SeleccionClientesEstudio]: "Pendiente Selección Clientes Estudio",
    [VinculacionEstado.CaptureCargueFormatosExpediente]: "Pendiente Cargue Expediente Azul",
    [VinculacionEstado.Vinculado]: "Vinculado",
    [VinculacionEstado.Rechazado]: "Rechazado",
    [VinculacionEstado.Cancelado]: "Cancelado",
    [VinculacionEstado.BuroDenied]: "Buró denegado",
  };
  
  // Orden de avance (10 pasos)
  const flujo10: VinculacionEstado[] = [
    VinculacionEstado.Creado,
    VinculacionEstado.CaptureClaveCiec,
    VinculacionEstado.CaptureAutorizacionBuro,
    VinculacionEstado.CaptureFirmaMiFiel,
    VinculacionEstado.CaptureAutorizacionAvales,
    VinculacionEstado.CaptureFirmaAvales,
    VinculacionEstado.CaptureFormatosExpediente,
    VinculacionEstado.SeleccionClientesEstudio,
    VinculacionEstado.CaptureCargueFormatosExpediente,
    VinculacionEstado.Vinculado,
  ];
  
  type Tone = "primary" | "success" | "danger";
  
  // Normaliza: el API a veces manda número o string
  function parseEstado(raw: string | number): VinculacionEstado | null {
    if (typeof raw === "number") {
      return VinculacionEstado[raw] ? (raw as VinculacionEstado) : null;
    }
    const key = Object.keys(VinculacionEstado).find(
      k => k.toLowerCase() === String(raw).toLowerCase()
    );
    return key ? (VinculacionEstado as any)[key] as VinculacionEstado : null;
  }
  
  export function stateToUI(raw: string | number): { label: string; pct: number; tone: Tone } {
    const estado = parseEstado(raw);
    if (!estado) return { label: "Desconocido", pct: 0, tone: "primary" };
  
    // Estados “felices” (progreso de 0% a 100% en 10 pasos)
    const idx = flujo10.indexOf(estado);
    if (idx >= 0) {
      const pct = Math.round((idx / (flujo10.length - 1)) * 100); // 0..100
      return {
        label: estadoDescriptions[estado],
        pct,
        tone: estado === VinculacionEstado.Vinculado ? "success" : "primary",
      };
    }
  
    // Terminales negativos
    if (
      estado === VinculacionEstado.Rechazado ||
      estado === VinculacionEstado.Cancelado ||
      estado === VinculacionEstado.BuroDenied
    ) {
      return { label: estadoDescriptions[estado], pct: 100, tone: "danger" };
    }
  
    return { label: estadoDescriptions[estado], pct: 0, tone: "primary" };
  }