import { EstadoVinculacion } from "@/src/domains/vinculacion/estados";
import StepClaveCiec from "./StepClaveCiec";
import StepPlaceholder from "./StepPlaceholder";
import StepDatosBuro from "./StepDatosBuro";
import StepFirmaMiFiel from "./StepFirmaMiFiel";
import StepSeleccionClientes from "./StepSeleccionClientes";
import { StepDef } from "@/src/shared/types/stepper";

export const STEPS: StepDef<any>[] = [
  { id: "registro", title: "Registro", description: "Crear vinculación", icon: "lucide:clipboard-edit" },
  { id: "clave-ciec", title: "Clave CIEC", description: "Captura de clave", icon: "lucide:key-round" },
  { id: "datos-buro", title: "Datos Buró", description: "Información SAT/Buró", icon: "lucide:file-text" },
  { id: "firma-mifiel", title: "Firma MiFiel", description: "Autorización", icon: "solar:shield-check-linear" },
  { id: "datos-avales", title: "Datos Avales", description: "Solo si aplica", icon: "lucide:users", visible: (ctx) => ctx.aplicaAval },
  { id: "firma-avales", title: "Firma Avales", description: "Autorizaciones", icon: "lucide:signature", visible: (ctx) => ctx.aplicaAval },
  { id: "formato-expediente", title: "Formato Expediente", description: "Backend-only", icon: "lucide:folder-cog", visible: () => false },
  { id: "seleccion-clientes", title: "Selección clientes", description: "Estudio de cupo", icon: "lucide:list-checks" },
  { id: "cargue-expediente", title: "Cargue expediente", description: "Expediente Azul", icon: "lucide:upload" },
  { id: "resumen", title: "Vinculado", description: "Finalizado", icon: "lucide:check-circle-2" },
];


export const StateToStepId: Record<number, string> = {
  [EstadoVinculacion.Creando]: "registro",
  [EstadoVinculacion.CaptureClaveCiec]: "clave-ciec",
  [EstadoVinculacion.CaptureAutorizacionBuro]: "datos-buro",
  [EstadoVinculacion.CaptureFirmaMiFiel]: "firma-mifiel",
  [EstadoVinculacion.CaptureAutorizacionAvales]: "datos-avales",
  [EstadoVinculacion.CaptureFirmaAvales]: "firma-avales",
  // 👇 Ojo: 7 NO tiene UI. Lo tratamos especial en el helper de header.
  [EstadoVinculacion.SeleccionClientesEstudio]: "seleccion-clientes",
  [EstadoVinculacion.CaptureCargueFormatosExpediente]: "cargue-expediente",
  [EstadoVinculacion.Vinculado]: "resumen",
};

export const stateToComponentMap: Record<
  EstadoVinculacion,
  React.ComponentType<any>
> = {
  [EstadoVinculacion.Default]: () => null,
  [EstadoVinculacion.Creando]: () => null,

  [EstadoVinculacion.CaptureClaveCiec]: StepClaveCiec,
  [EstadoVinculacion.CaptureAutorizacionBuro]: StepDatosBuro,
  [EstadoVinculacion.CaptureFirmaMiFiel]: StepFirmaMiFiel,

  [EstadoVinculacion.CaptureAutorizacionAvales]: (p) => (
    <StepPlaceholder title="Datos Avales" note="Solo si aplica avales." {...p} />
  ),
  [EstadoVinculacion.CaptureFirmaAvales]: (p) => (
    <StepPlaceholder title="Firma Avales" note="Autorización avalistas." {...p} />
  ),

  // 7: backend-only, sin UI
  [EstadoVinculacion.CaptureFormatosExpediente]: StepFirmaMiFiel,
  [EstadoVinculacion.SeleccionClientesEstudio]: StepSeleccionClientes,
  [EstadoVinculacion.CaptureCargueFormatosExpediente]: (p) => (
    <StepPlaceholder title="Cargue expediente" note="Expediente Azul." {...p} />
  ),
  [EstadoVinculacion.Vinculado]: (p) => (
    <StepPlaceholder title="Vinculado" note="Proceso finalizado." {...p} />
  ),
  [EstadoVinculacion.Rechazado]: (p) => (
    <StepPlaceholder title="Rechazado" note="Caso no aprobado." {...p} />
  ),
  [EstadoVinculacion.Cancelado]: (p) => (
    <StepPlaceholder title="Cancelado" note="Caso cancelado." {...p} />
  ),
};
