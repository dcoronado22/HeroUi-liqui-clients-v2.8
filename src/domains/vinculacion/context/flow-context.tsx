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
};

const Ctx = React.createContext<(FlowState & Actions) | null>(null);

export function VinculacionFlowProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState<FlowState>({
        id: null,
        rfc: null,
        currentState: null,
        flags: {},
        sidebarCollapsed: false,
        toggleSidebar: () => { },
    });

    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const toggleSidebar = React.useCallback(() => setSidebarCollapsed(v => !v), []);

    const setIdRfc = (id: string, rfc: string) => {
        setState((s) => ({ ...s, id, rfc }));
        try {
            sessionStorage.setItem(`v:${id}:rfc`, rfc);
        } catch { }
    };

    const hydrateFromDetalle = (d: { id: string; rfc: string; state: number; flags: VinculacionFlags }) => {
        setState({ id: d.id, rfc: d.rfc, currentState: d.state, flags: d.flags, sidebarCollapsed, toggleSidebar });
        try {
            sessionStorage.setItem(`v:${d.id}:rfc`, d.rfc);
        } catch { }
    };

    const reset = () => setState({ id: null, rfc: null, currentState: null, flags: {}, sidebarCollapsed: false, toggleSidebar });

    const value = React.useMemo(() => ({ ...state, sidebarCollapsed, toggleSidebar, setIdRfc, hydrateFromDetalle, reset }), [state, sidebarCollapsed, toggleSidebar]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVinculacionFlow() {
    const ctx = React.useContext(Ctx);
    if (!ctx) throw new Error("useVinculacionFlow must be used within VinculacionFlowProvider");
    return ctx;
}
