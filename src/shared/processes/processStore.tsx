"use client";

import React, { createContext, useReducer, useContext, ReactNode } from "react";
import type { Process, ProcessWsEvent } from "./types";

// ----------------- STATE -----------------
interface ProcessState {
    processes: Record<string, Process[]>;
    // key = entityId, value = lista de procesos
}

const initialState: ProcessState = {
    processes: {},
};

// ----------------- ACTIONS -----------------
type ProcessAction =
    | { type: "UPSERT_FROM_EVENT"; event: ProcessWsEvent }
    | { type: "RESET_ENTITY"; entityId: string; processes: Process[] };

// ----------------- REDUCER -----------------
function processReducer(state: ProcessState, action: ProcessAction): ProcessState {
    switch (action.type) {
        case "RESET_ENTITY": {
            return {
                ...state,
                processes: {
                    ...state.processes,
                    [action.entityId]: action.processes,
                },
            };
        }

        case "UPSERT_FROM_EVENT": {
            const { event } = action;
            const entityId = (event as any).entityId ?? event.entity.id; // 👈 preferimos el normalizado
            const prev = state.processes[entityId] ?? [];

            // Buscar proceso existente
            const idx = prev.findIndex((p) => p.id === event.processId);

            const base: Process = idx >= 0 ? prev[idx] : {
                id: event.processId,
                type: event.processType,
                entity: event.entity,
                state: "pending",
                createdAt: event.updatedAt || new Date().toISOString(),
                updatedAt: event.updatedAt || new Date().toISOString(),
                criticality: "normal",
            };

            let updated: Process = {
                ...base,
                updatedAt: event.updatedAt || new Date().toISOString()
            };

            switch (event.name) {
                case "process.started":
                    updated = { ...updated, state: "running", message: event.message };
                    break;
                case "process.progress":
                    updated = { ...updated, state: "running", progress: event.progress, message: event.message };
                    break;
                case "process.require_input":
                    updated = { ...updated, state: "running", message: event.message, stepId: event.stepId };
                    break;
                case "process.completed":
                    updated = { ...updated, state: "completed", message: event.message, completedAt: new Date().toISOString() };
                    break;
                case "process.failed":
                    updated = {
                        ...updated,
                        state: "failed",
                        message: event.message,
                        failureSeverity: event.severity,
                        failureReason: event.reason,
                        stepId: event.stepId,
                    };
                    break;
            }

            const newList = idx >= 0
                ? [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)]
                : [...prev, updated];

            console.log("📝 UPSERT reducer =>", entityId, newList); // 👈 debug

            return {
                ...state,
                processes: {
                    ...state.processes,
                    [entityId]: newList,
                },
            };
        }

        default:
            return state;
    }
}

// ----------------- CONTEXT -----------------
const ProcessContext = createContext<{
    state: ProcessState;
    dispatch: React.Dispatch<ProcessAction>;
}>({ state: initialState, dispatch: () => undefined });

export function ProcessProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(processReducer, initialState);
    return (
        <ProcessContext.Provider value={{ state, dispatch }}>
            {children}
        </ProcessContext.Provider>
    );
}

export function useProcessStore() {
    return useContext(ProcessContext);
}