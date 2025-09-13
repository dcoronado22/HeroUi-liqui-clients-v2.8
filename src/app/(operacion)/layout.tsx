"use client";

import * as React from "react";
import RequireAuth from "@/src/shared/auth/RequireAuth";
import { OperacionFlowProvider, useOperacionFlow } from "@/src/domains/operacion/context/flow-context";
import Header from "@/src/domains/operacion/components/Header";
import { usePathname, useParams } from "next/navigation";
import { computeHeaderProgress } from "@/src/domains/operacion/steps/helpers";
import { STEPS } from "@/src/domains/operacion/steps";

export default function OperacionLayout({ children }: { children: React.ReactNode }) {
    return (
        <OperacionFlowProvider>
            <OperacionShell>{children}</OperacionShell>
        </OperacionFlowProvider>
    );
}

function OperacionShell({ children }: { children: React.ReactNode }) {
    const flow = useOperacionFlow();
    const pathname = usePathname();
    const params = useParams<{ rfc?: string; id?: string; idLote?: string }>();

    React.useEffect(() => {
        if (!flow.rfc && params.rfc && params.id) {
            flow.setIdRfcIdLote(params.id, params.rfc, params.idLote ?? "");
        }
    }, [params.rfc, params.id, params.idLote, flow]);

    const isMisOperaciones = pathname?.startsWith("/operaciones-cliente");

    const progress = React.useMemo(
        () => computeHeaderProgress(STEPS, flow.flags, flow.currentState ?? undefined),
        [flow.flags, flow.currentState]
    );

    return (
        <RequireAuth>
            <div className="h-dvh flex flex-col overflow-hidden">
                <Header
                    stepTitle={progress.title}
                    stepBadge={`${progress.index + 1} de ${progress.total}`}
                    stepSubtitle={progress.subtitle}
                    rfc={flow.rfc}
                    showIsCollabsable={!isMisOperaciones}
                    showSteps={!isMisOperaciones}
                    showRfc
                />
                <main className="flex-1 min-h-0 -mt-6">{children}</main>
            </div>
        </RequireAuth>
    );
}