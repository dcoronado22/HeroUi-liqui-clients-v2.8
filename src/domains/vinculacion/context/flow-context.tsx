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
    }) => void;
    reset: () => void;
    // 🔥 NUEVO: Método para verificar si necesita reset
    needsReset: (newId: string, newRfc?: string) => boolean;
};

const initialState: FlowState = {
    id: null,
    rfc: null,
    currentState: null,
    flags: {},
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
        flags: VinculacionFlags
    }) => {
        console.log(`Hydrating context with: id=${d.id}, rfc=${d.rfc}, state=${d.state}`);
        setState((prev) => ({
            ...prev,
            id: d.id,
            rfc: d.rfc,
            currentState: d.state,
            flags: d.flags
        }));
    }, []);

    const reset = React.useCallback(() => {
        console.log("Resetting vinculacion context");
        setState({ ...initialState, sidebarCollapsed, toggleSidebar });
    }, [sidebarCollapsed, toggleSidebar]);

    // 🔥 NUEVO: Método para verificar si necesita reset
    const needsReset = React.useCallback((newId: string, newRfc?: string) => {
        // Si no hay datos en el contexto, no necesita reset
        if (!state.id && !state.rfc) return false;

        // Si el ID es diferente, necesita reset
        if (state.id && state.id !== newId) return true;

        // Si el RFC es diferente y está definido, necesita reset
        if (newRfc && state.rfc && state.rfc !== newRfc) return true;

        return false;
    }, [state.id, state.rfc]);

    const value = React.useMemo(() => ({
        ...state,
        sidebarCollapsed,
        toggleSidebar,
        setIdRfc,
        hydrateFromDetalle,
        reset,
        needsReset
    }), [
        state,
        sidebarCollapsed,
        toggleSidebar,
        setIdRfc,
        hydrateFromDetalle,
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