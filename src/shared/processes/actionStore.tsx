"use client";

import React, { createContext, useReducer, useContext, ReactNode } from "react";
import type { Action } from "./types";

// ----------------- STATE -----------------
interface ActionState {
    actions: Record<string, Action[]>; // key = entityId
}

const initialState: ActionState = {
    actions: {},
};

// ----------------- ACTIONS -----------------
type ActionAction =
    | { type: "ADD_ACTION"; entityId: string; action: Action }
    | { type: "RESOLVE_ACTION"; entityId: string; actionId: string }
    | { type: "RESET_ENTITY"; entityId: string; actions: Action[] };

// ----------------- REDUCER -----------------
function actionReducer(state: ActionState, action: ActionAction): ActionState {
    switch (action.type) {
        case "RESET_ENTITY":
            return {
                ...state,
                actions: {
                    ...state.actions,
                    [action.entityId]: action.actions,
                },
            };

        case "ADD_ACTION": {
            const prev = state.actions[action.entityId] ?? [];
            return {
                ...state,
                actions: {
                    ...state.actions,
                    [action.entityId]: [...prev, action.action],
                },
            };
        }

        case "RESOLVE_ACTION": {
            const prev = state.actions[action.entityId] ?? [];
            const newList: Action[] = prev.map((a) =>
                a.id === action.actionId
                    ? { ...a, status: "resolved", resolvedAt: new Date().toISOString() } as Action
                    : a
            );
            return {
                ...state,
                actions: {
                    ...state.actions,
                    [action.entityId]: newList,
                },
            };
        }

        default:
            return state;
    }
}

// ----------------- CONTEXT -----------------
const ActionContext = createContext<{
    state: ActionState;
    dispatch: React.Dispatch<ActionAction>;
}>({ state: initialState, dispatch: () => undefined });

export function ActionProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(actionReducer, initialState);
    return (
        <ActionContext.Provider value={{ state, dispatch }}>
            {children}
        </ActionContext.Provider>
    );
}

export function useActionStore() {
    return useContext(ActionContext);
}