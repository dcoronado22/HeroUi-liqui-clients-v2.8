// src/shared/hooks/useWebSocketClient.ts
"use client";

import { useEffect } from "react";
import { useProcessStore } from "@/src/shared/processes/processStore";
import { useActionStore } from "@/src/shared/processes/actionStore";
import type { ProcessWsEvent } from "@/src/shared/processes/types";

export function useWebSocketClient(
  url: string = "ws://localhost:4000",
  forcedEntityId?: string
) {
  const { dispatch: processDispatch } = useProcessStore();
  const { dispatch: actionDispatch } = useActionStore();

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => console.log("🔌 WS conectado:", url);
    ws.onclose = () => console.log("❌ WS desconectado");

    ws.onmessage = (event) => {
      try {
        const data: ProcessWsEvent = JSON.parse(event.data);

        const rawId = getEntityId(data.entity);
        const entityId = forcedEntityId ?? rawId;

        console.log("📮 WS event:", data);
        console.log("📦 IDs → raw:", rawId, "forced:", forcedEntityId, "final:", entityId);

        processDispatch({
          type: "UPSERT_FROM_EVENT",
          event: {
            ...data,
            entityId, // opcional en el tipo, pero lo mandamos
            entity: { ...data.entity, id: entityId }, // normalizado
          } as ProcessWsEvent & { entityId: string },
        });

        if (data.name === "process.require_input") {
          actionDispatch({
            type: "ADD_ACTION",
            entityId,
            action: {
              id: data.actionId,
              entity: { ...data.entity, id: entityId },
              relatedProcessId: data.processId,
              kind: "REQUIRE_INPUT",
              title: data.message,
              description: "El backend requiere que completes un paso.",
              stepId: data.stepId,
              status: "pending",
              createdAt: new Date().toISOString(),
            },
          });
        }
      } catch (err) {
        console.log("❌ Error parseando WS event:", err);
      }
    };

    return () => ws.close();
  }, [url, forcedEntityId, processDispatch, actionDispatch]);
}

function getEntityId(entity: any): string {
  if (entity?.entityId) return entity.entityId; // por si viene así
  if (entity?.id) return entity.id;
  return "unknown";
}