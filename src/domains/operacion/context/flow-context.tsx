"use client";
import * as React from "react";

export type OperacionFlags = {
    aplicaAval?: boolean;
    personaMoral?: boolean;
    claveCiecIsValid?: boolean;
};

type FlowState = {
    id: string | null;
    rfc: string | null;
    idLote: string | null;
    currentState: number | null;
    flags: OperacionFlags;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
};

type Actions = {
    setIdRfcIdLote: (id: string, rfc: string, idLote: string) => void;
    hydrateFromDetalle: (d: {
        id: string;
        rfc: string;
        idLote: string;
        state: number;
        flags: OperacionFlags;
    }) => void;
    reset: () => void;
    needsReset: (newId: string, newRfc?: string, newIdLote?: string) => boolean;
};

const initialState: FlowState = {
    id: null,
    rfc: null,
    idLote: null,
    currentState: null,
    flags: {},
    sidebarCollapsed: false,
    toggleSidebar: () => { },
};

const Ctx = React.createContext<(FlowState & Actions) | null>(null);

export function OperacionFlowProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState<FlowState>(initialState);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

    const toggleSidebar = React.useCallback(() => setSidebarCollapsed(v => !v), []);

    const setIdRfcIdLote = React.useCallback((id: string, rfc: string, idLote: string) => {
        setState((s) => ({ ...s, id, rfc, idLote }));
    }, []);

    const hydrateFromDetalle = React.useCallback((d: {
        id: string;
        rfc: string;
        idLote: string;
        state: number;
        flags: OperacionFlags;
        folderId?: number | null; // NUEVO
    }) => {
        console.log(`Hydrating context with: id=${d.id}, rfc=${d.rfc}, idLote=${d.idLote}, state=${d.state}`);
        setState((prev) => ({
            ...prev,
            id: d.id,
            rfc: d.rfc,
            idLote: d.idLote,
            currentState: d.state,
            flags: d.flags,
        }));
    }, []);

    const reset = React.useCallback(() => {
        console.log("Resetting Operacion context");
        setState({ ...initialState, sidebarCollapsed, toggleSidebar });
    }, [sidebarCollapsed, toggleSidebar]);

    const needsReset = React.useCallback((newId: string, newRfc?: string, newIdLote?: string) => {
        if (!state.id && !state.rfc && !state.idLote) return false;
        if (state.id && state.id !== newId) return true;
        if (newRfc && state.rfc && state.rfc !== newRfc) return true;
        if (newIdLote && state.idLote && state.idLote !== newIdLote) return true;
        return false;
    }, [state.id, state.rfc, state.idLote]);

    const value = React.useMemo(() => ({
        ...state,
        sidebarCollapsed,
        toggleSidebar,
        setIdRfcIdLote,
        hydrateFromDetalle,
        reset,
        needsReset
    }), [
        state,
        sidebarCollapsed,
        toggleSidebar,
        setIdRfcIdLote,
        hydrateFromDetalle,
        reset,
        needsReset
    ]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOperacionFlow() {
    const ctx = React.useContext(Ctx);
    if (!ctx) throw new Error("useOperacionFlow must be used within OperacionFlowProvider");
    return ctx;
}