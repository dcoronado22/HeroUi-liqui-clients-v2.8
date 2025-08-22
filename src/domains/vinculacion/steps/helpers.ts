import type { StepDef } from "@/src/shared/types/stepper";
import { StateToStepId } from "./index";

export function resolveVisibleSteps<TCtx>(steps: StepDef<TCtx>[], ctx: TCtx) {
    return steps.filter(s => (typeof s.visible === "function" ? s.visible(ctx) : s.visible ?? true));
}

type HeaderProgress = { title: string; index: number; total: number; subtitle?: string };

export function computeHeaderProgress<TCtx>(
    steps: StepDef<TCtx>[],
    ctx: TCtx,
    currentState?: number
): HeaderProgress {
    const visibles = resolveVisibleSteps(steps, ctx);
    const total = visibles.length;

    // Map estado→stepId (o fallback).
    let stepId = currentState != null ? StateToStepId[currentState] : undefined;

    // Caso especial: state 7 (sin UI) — mostramos el “siguiente visible” o nos quedamos en el último visible anterior.
    if (currentState === 7) {
        // estrategia simple: mantener el último visible anterior (firma-mifiel o firma-avales)
        // o mostrar un subtítulo de “Creando expediente…”
        const subtitle = "Creando expediente…";
        // Busca el anterior “con UI” lógico: si hay avales, el anterior visible es firma-avales; si no, firma-mifiel
        const prevIdCandidates = ["firma-avales", "firma-mifiel", "datos-buro", "clave-ciec", "registro"];
        const prev = visibles.slice().reverse().find(s => prevIdCandidates.includes(s.id));
        const index = Math.max(0, visibles.findIndex(s => s.id === (prev?.id ?? visibles[0].id)));
        const title = visibles[index]?.title ?? "Vinculación";
        return { title, index, total, subtitle };
    }

    // Normal: encontrar el índice del step actual
    const idx = visibles.findIndex(s => s.id === stepId);
    const index = idx >= 0 ? idx : 0;
    const title = visibles[index]?.title ?? "Vinculación";

    return { title, index, total };
}
