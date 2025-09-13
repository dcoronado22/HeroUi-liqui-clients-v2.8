export enum EstadoOperacion {
    Default = 0,
    Creado = 1, // Inicio Operación
    ProceseInicio = 2, // Procesando Inicio
    CaptureFirmaMiFiel = 3, // Pendiente Autorización Firma Soportes
    Cotizado = 4, // Cotizado
}
