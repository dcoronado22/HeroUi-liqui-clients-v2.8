"use client";

import React from "react";
import { useProcessStore } from "@/src/shared/processes/processStore";
import { useActionStore } from "@/src/shared/processes/actionStore";
import { getGuardResult } from "@/src/shared/processes/guard";
import { Alert, Chip } from "@heroui/react";
import { useVinculacionFlow } from "@/src/domains/vinculacion/context/flow-context";
import { Icon } from "@iconify/react";

export function GuardBanner() {
    const { state: processState } = useProcessStore();
    const { state: actionState } = useActionStore();

    // 👇 OJO: aquí podrías usar el entityId actual desde el flowContext (ej: vinculacion.id)
    const flow = useVinculacionFlow();
    const entityId = flow.id ?? "demo";
    const processes = processState.processes[entityId] ?? [];

    const actions = actionState.actions[entityId] ?? [];

    const guard = getGuardResult(processes, actions);

    if (guard.state === "UNLOCKED") return null;

    let color: "success" | "warning" | "danger" | "primary" = "primary";
    if (guard.state === "LOCKED") color = "danger";
    if (guard.state === "PREPARING") color = "warning";
    if (guard.state === "REQUIRES_INPUT") color = "primary";
    if (guard.state === "COMPLETED") color = "success";

    // Nueva función usando Iconify
    function getGuardIcon(state: string): string | undefined {
        if (state === "LOCKED") return "mdi:lock";
        if (state === "PREPARING") return "line-md:loading-loop";
        if (state === "COMPLETED") return "mdi:check-circle-outline";
        return undefined;
    }

    return (
        <div>
            <Chip
                color={color}
                variant="flat"
                size="lg"
                title={`Estado: ${guard.state}`}
                endContent={getGuardIcon(guard.state) ? <Icon icon={getGuardIcon(guard.state)!} className="mr-2" /> : undefined}
            >
                {guard.ui?.message || "Acción requerida para continuar."}
            </Chip>
        </div>
    );
}