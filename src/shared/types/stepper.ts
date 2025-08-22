export type StepId = string;

export type StepDef<TCtx = any> = {
    id: StepId;
    title: string;
    description?: string;
    icon?: string;            // iconify name opcional (ej. "lucide:building")
    // Opcionales para dinamismo:
    visible?: (ctx: TCtx) => boolean;      // si el paso se muestra
    disabled?: (ctx: TCtx) => boolean;     // si aparece pero no es navegable
};

export type StepperPropsBase<TCtx = any> = {
    steps: StepDef<TCtx>[];
    ctx?: TCtx;
    currentId: StepId;
    onChange?: (id: StepId) => void;       // click en step
    clickable?: boolean;                   // permitir navegación por click
};
