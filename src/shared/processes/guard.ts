import  { Process } from "./types";
import type { Action } from "./types";
import type { GuardResult } from "./types";

/**
 * Función pura que determina el estado de gating
 * según procesos y acciones activas.
 */
export function getGuardResult(processes: Process[], actions: Action[]): GuardResult {
  // 1. Fallo hard => LOCKED
  const hardFail = processes.find((p) => p.state === "failed" && p.failureSeverity === "hard");
  if (hardFail) {
    return {
      state: "LOCKED",
      cause: { type: "PROCESS", process: hardFail },
      ui: {
        blocking: true,
        message: hardFail.message || "El proceso crítico falló",
      },
    };
  }

  // 2. Acciones pendientes => REQUIRES_INPUT
  const pendingAction = actions.find((a) => a.status === "pending");
  if (pendingAction) {
    return {
      state: "REQUIRES_INPUT",
      cause: { type: "ACTION", action: pendingAction },
      ui: {
        blocking: true,
        message: pendingAction.title,
        stepId: pendingAction.stepId,
      },
    };
  }

  // 3. Procesos críticos corriendo => PREPARING
  const running = processes.find((p) => p.state === "running");
  if (running) {
    return {
      state: "PREPARING",
      cause: { type: "PROCESS", process: running },
      ui: {
        blocking: false,
        message: running.message || `Ejecutando ${running.type}`,
      },
    };
  }

  // 4. Nada crítico => UNLOCKED
  return { state: "UNLOCKED" };
}