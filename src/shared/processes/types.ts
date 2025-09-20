// src/shared/processes/types.ts

/**
 * ==============================
 *   ENTITY
 * ==============================
 */

export type EntityRef =
  | { type: "vinculacion"; id: string };
// Si luego manejas otros contextos (ej. operación), se agregan aquí.

/**
 * ==============================
 *   PROCESSES
 * ==============================
 */

export type ProcessType =
  | "CLAVE_SIEC"
  | "SITUACION_FISCAL"
  | "BURO"
  | "EXPEDIENTE";

export type ProcessState =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type FailureSeverity = "soft" | "hard";

export type ProcessCriticality = "critical" | "high" | "normal" | "low";

export const PROCESS_CRITICALITY: Record<ProcessType, ProcessCriticality> = {
  CLAVE_SIEC: "high",
  SITUACION_FISCAL: "normal",
  BURO: "critical",
  EXPEDIENTE: "low",
};

export type ProcessId = string;

export interface Process {
  id: ProcessId;
  type: ProcessType;
  entity: EntityRef;

  state: ProcessState;
  message?: string;
  progress?: number;

  failureSeverity?: FailureSeverity;
  failureReason?: string;

  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;

  criticality: ProcessCriticality;

  stepId?: string;
  meta?: Record<string, unknown>;
}

/**
 * ==============================
 *   ACTIONS (Action Center)
 * ==============================
 */

export type ActionStatus = "pending" | "resolved";

export type ActionKind =
  | "REQUIRE_INPUT"
  | "FIX_ERROR"
  | "COMPLETE_STEP"
  | "RETRY";

export interface Action {
  id: string;
  entity: EntityRef;

  relatedProcessId?: ProcessId;

  kind: ActionKind;
  title: string;
  description?: string;
  severity?: FailureSeverity;
  stepId?: string;

  status: ActionStatus;
  createdAt: string;
  resolvedAt?: string;
  meta?: Record<string, unknown>;
}

/**
 * ==============================
 *   WS EVENTS (simulador o backend real)
 * ==============================
 */

export type WsEventName =
  | "process.started"
  | "process.progress"
  | "process.require_input"
  | "process.completed"
  | "process.failed";

interface WsEventBase {
  name: WsEventName;
  entity: EntityRef;
  processId: ProcessId;
  processType: ProcessType;
  updatedAt?: string;
  version?: number;
  entityId?: string;
}

export interface ProcessStartedEvent extends WsEventBase {
  name: "process.started";
  message?: string;
}

export interface ProcessProgressEvent extends WsEventBase {
  name: "process.progress";
  progress: number;
  message?: string;
}

export interface ProcessRequireInputEvent extends WsEventBase {
  name: "process.require_input";
  inputType: string;
  stepId?: string;
  message: string;
  actionId: string;
}

export interface ProcessCompletedEvent extends WsEventBase {
  name: "process.completed";
  message?: string;
  result?: Record<string, unknown>;
}

export interface ProcessFailedEvent extends WsEventBase {
  name: "process.failed";
  severity: FailureSeverity;
  reason?: string;
  stepId?: string;
  message?: string;
}

export type ProcessWsEvent =
  | ProcessStartedEvent
  | ProcessProgressEvent
  | ProcessRequireInputEvent
  | ProcessCompletedEvent
  | ProcessFailedEvent;

/**
 * ==============================
 *   GUARD (control de Stepper/UI)
 * ==============================
 */

export type GuardState =
  | "LOCKED"
  | "PREPARING"
  | "REQUIRES_INPUT"
  | "UNLOCKED"
  | "COMPLETED";

export type GuardCause =
  | {
      type: "PROCESS";
      process: Pick<
        Process,
        "id" | "type" | "state" | "message" | "criticality" | "stepId" | "failureSeverity"
      >;
    }
  | {
      type: "ACTION";
      action: Pick<
        Action,
        "id" | "kind" | "title" | "severity" | "stepId" | "description"
      >;
    };

export interface GuardResult {
  state: GuardState;
  cause?: GuardCause;
  ui?: {
    stepId?: string;
    message?: string;
    blocking?: boolean;
  };
}