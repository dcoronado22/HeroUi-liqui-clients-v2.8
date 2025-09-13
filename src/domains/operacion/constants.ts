export const StateToStepId: Record<number, string> = {
    1: "creado",
    2: "procese-inicio",
    3: "firma-soportes",
    4: "cotizado",
};

export type ReasonCategory =
    | "ok"
    | "not-found"
    | "validation"
    | "exists"
    | "buro-pending"
    | "buro-denied"
    | "buro-error"
    | "expediente-error"
    | "integracion-error"
    | "transient"
    | "unknown";

export const ReasonMap: Record<number, ReasonCategory> = {
    1: "ok",
    1025: "not-found",
    1027: "exists",
    1030: "validation",
    1039: "buro-denied",
    1040: "buro-pending",
    1051: "buro-error",
    11026: "expediente-error",
    // agrega los que uses a menudo…
};
