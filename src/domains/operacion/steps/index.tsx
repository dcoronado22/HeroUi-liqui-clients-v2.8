import { EstadoOperacion } from "@/src/domains/operacion/estados";
import { StepDef } from "@/src/shared/types/stepper";
import StepCreacion from "./StepCreacion";

export const STEPS: StepDef<any>[] = [
    { id: "default", title: "Inicio", description: "Inicio del flujo", icon: "lucide:play-circle" },
    { id: "creado", title: "Inicio Operación", description: "Inicio de la operación", icon: "lucide:clipboard-edit" },
    { id: "procese-inicio", title: "Procesando Inicio", description: "Procesando la operación", icon: "lucide:loader" },
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
    [EstadoOperacion.Creado]: (p) => (
        <></>
    ),
    [EstadoOperacion.ProceseInicio]: (p) => (
        <></>
    ),
    [EstadoOperacion.CaptureFirmaMiFiel]: (p) => (<></>),
    [EstadoOperacion.Cotizado]: (p) => (
        <></>
    ),
};
