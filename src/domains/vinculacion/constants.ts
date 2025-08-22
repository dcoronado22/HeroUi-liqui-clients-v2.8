export const StateToStepId: Record<number, string> = {
    1: "registro",
    2: "clave-ciec",
    3: "datos-buro",
    4: "firma-mifiel",         // polling
    5: "datos-avales",
    6: "firma-avales",         // polling
    7: "firma-mifiel",
    8: "seleccion-clientes",
    9: "cargue-expediente",
    10: "resumen",
    11: "rechazado",
    12: "cancelado",
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
