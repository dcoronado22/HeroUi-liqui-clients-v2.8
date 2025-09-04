"use client";
import * as React from "react";

export type VinculacionFlags = {
    aplicaAval?: boolean;
    personaMoral?: boolean;
    claveCiecIsValid?: boolean;
};

type FlowState = {
    id: string | null;
    rfc: string | null;
    currentState: number | null;
    flags: VinculacionFlags;
    folderId: number | null; // NUEVO
    expedientePct: number | null; // NUEVO
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
};

type Actions = {
    setIdRfc: (id: string, rfc: string) => void;
    hydrateFromDetalle: (d: {
        id: string;
        rfc: string;
        state: number;
        flags: VinculacionFlags;
        folderId?: number | null; // NUEVO
    }) => void;
    setExpedientePct: (pct: number | null) => void; // NUEVO
    reset: () => void;
    needsReset: (newId: string, newRfc?: string) => boolean;
};

const initialState: FlowState = {
    id: null,
    rfc: null,
    currentState: null,
    flags: {},
    folderId: null, // NUEVO
    expedientePct: null, // NUEVO
    sidebarCollapsed: false,
    toggleSidebar: () => { },
};

const Ctx = React.createContext<(FlowState & Actions) | null>(null);

export function VinculacionFlowProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState<FlowState>(initialState);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

    const toggleSidebar = React.useCallback(() => setSidebarCollapsed(v => !v), []);

    const setIdRfc = React.useCallback((id: string, rfc: string) => {
        setState((s) => ({ ...s, id, rfc }));
    }, []);

    const hydrateFromDetalle = React.useCallback((d: {
        id: string;
        rfc: string;
        state: number;
        flags: VinculacionFlags;
        folderId?: number | null; // NUEVO
    }) => {
        console.log(`Hydrating context with: id=${d.id}, rfc=${d.rfc}, state=${d.state}`);
        setState((prev) => ({
            ...prev,
            id: d.id,
            rfc: d.rfc,
            currentState: d.state,
            flags: d.flags,
            folderId: d.folderId ?? prev.folderId ?? null, // NUEVO
        }));
    }, []);

    const setExpedientePct = React.useCallback((pct: number | null) => {
        setState((prev) => ({ ...prev, expedientePct: pct }));
    }, []); // NUEVO

    const reset = React.useCallback(() => {
        console.log("Resetting vinculacion context");
        setState({ ...initialState, sidebarCollapsed, toggleSidebar });
    }, [sidebarCollapsed, toggleSidebar]);

    const needsReset = React.useCallback((newId: string, newRfc?: string) => {
        if (!state.id && !state.rfc) return false;
        if (state.id && state.id !== newId) return true;
        if (newRfc && state.rfc && state.rfc !== newRfc) return true;
        return false;
    }, [state.id, state.rfc]);

    const value = React.useMemo(() => ({
        ...state,
        sidebarCollapsed,
        toggleSidebar,
        setIdRfc,
        hydrateFromDetalle,
        setExpedientePct, // NUEVO
        reset,
        needsReset
    }), [
        state,
        sidebarCollapsed,
        toggleSidebar,
        setIdRfc,
        hydrateFromDetalle,
        setExpedientePct, // NUEVO
        reset,
        needsReset
    ]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVinculacionFlow() {
    const ctx = React.useContext(Ctx);
    if (!ctx) throw new Error("useVinculacionFlow must be used within VinculacionFlowProvider");
    return ctx;
}