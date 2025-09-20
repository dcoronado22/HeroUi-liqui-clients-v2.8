"use client";

import { useProcessStore } from "./processStore";
import { useActionStore } from "./actionStore";
import type { ProcessWsEvent } from "./types";

/**
 * Hook para simular eventos de proceso desde el front
 */
export function useSimulateProcess(entityId: string = "demo") {
  const { dispatch: processDispatch } = useProcessStore();
  const { dispatch: actionDispatch } = useActionStore();

  const simulateEvent = (event: ProcessWsEvent) => {
    processDispatch({ type: "UPSERT_FROM_EVENT", event });

    if (event.name === "process.require_input") {
      actionDispatch({
        type: "ADD_ACTION",
        entityId: entityId,
        action: {
          id: event.actionId,
          entity: event.entity,
          relatedProcessId: event.processId,
          kind: "REQUIRE_INPUT",
          title: event.message,
          description: "El backend requiere que completes un paso.",
          stepId: event.stepId,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      });
    }
  };

  return { simulateEvent };
}