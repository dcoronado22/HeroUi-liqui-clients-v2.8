"use client";

import * as React from "react";
import type { StepDef, StepId } from "@/src/shared/types/stepper";

export function useResolvedSteps<TCtx = any>(
    steps: StepDef<TCtx>[],
    ctx?: TCtx
) {
    const resolved = React.useMemo(() => {
        const visible = steps.filter(s => (s.visible ? s.visible(ctx as TCtx) : true));
        return visible;
    }, [steps, ctx]);

    const findIndex = React.useCallback(
        (id: StepId) => resolved.findIndex(s => s.id === id),
        [resolved]
    );

    const getNext = React.useCallback(
        (id: StepId | null) => {
            if (resolved.length === 0) return null;
            const i = id ? findIndex(id) : -1;
            const next = i >= 0 ? i + 1 : 0;
            return next < resolved.length ? resolved[next].id : null;
        },
        [resolved, findIndex]
    );

    const getPrev = React.useCallback(
        (id: StepId | null) => {
            if (resolved.length === 0) return null;
            const i = id ? findIndex(id) : -1;
            const prev = i > 0 ? i - 1 : null;
            return prev !== null ? resolved[prev].id : null;
        },
        [resolved, findIndex]
    );

    return { steps: resolved, findIndex, getNext, getPrev, length: resolved.length };
}
