export enum EstadoVinculacion {
    Default = 0,
    Creando = 1,
    CaptureClaveCiec = 2,
    CaptureAutorizacionBuro = 3,
    CaptureFirmaMiFiel = 4,
    CaptureAutorizacionAvales = 5,
    CaptureFirmaAvales = 6,
    CaptureFormatosExpediente = 7, // backend-only (sin UI)
    SeleccionClientesEstudio = 8,
    CaptureCargueFormatosExpediente = 9,
    Vinculado = 10,
    Rechazado = 11,
    Cancelado = 12,
}
