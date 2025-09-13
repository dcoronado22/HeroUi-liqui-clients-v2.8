import { EstadoOperacion } from "@/src/domains/operacion/estados";
import { StepDef } from "@/src/shared/types/stepper";
import StepCreacion from "./StepCreacion";
import StepVerificacion from "./StepVerificacion";
import StepFirmaSoportes from "./StepFirmaSoportes";

export const STEPS: StepDef<any>[] = [
    { id: "default", title: "Inicio", description: "Inicio del flujo", icon: "lucide:play-circle" },
    { id: "procese-inicio", title: "Verificación", description: "Verificación de cotizaciones", icon: "lucide:loader" },
    { id: "firma-soportes", title: "Firma Soportes", description: "Pendiente firma soportes", icon: "solar:shield-check-linear" },
    { id: "cotizado", title: "Cotizado", description: "Operación cotizada", icon: "lucide:check-circle-2" },
];


export const StateToStepId: Record<number, string> = {
    [EstadoOperacion.Default]: "default",
    [EstadoOperacion.Creado]: "creado",
    [EstadoOperacion.ProceseInicio]: "procese-inicio",
    [EstadoOperacion.CaptureFirmaMiFiel]: "firma-soportes",
    [EstadoOperacion.Cotizado]: "cotizado",
};

export const stateToComponentMap: Record<
    EstadoOperacion,
    React.ComponentType<any>
> = {
    [EstadoOperacion.Default]: StepCreacion,
    [EstadoOperacion.Creado]: StepVerificacion,
    [EstadoOperacion.ProceseInicio]: StepVerificacion,
    [EstadoOperacion.CaptureFirmaMiFiel]: StepFirmaSoportes,
    [EstadoOperacion.Cotizado]: (p) => (
        <></>
    ),
};
