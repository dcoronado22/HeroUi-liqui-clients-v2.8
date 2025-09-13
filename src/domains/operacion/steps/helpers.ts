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

    // Normal: encontrar el índice del step actual
    const idx = visibles.findIndex(s => s.id === stepId);
    const index = idx >= 0 ? idx : 0;
    const title = visibles[index]?.title ?? "Vinculación";

    return { title, index, total };
}
