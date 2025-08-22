// src/app/(vinculacion)/vinculacion/layout.tsx
"use client";

import * as React from "react";
import Header from "@/src/domains/vinculacion/components/Header";
import { VinculacionFlowProvider, useVinculacionFlow } from "@/src/domains/vinculacion/context/flow-context";
import { STEPS } from "@/src/domains/vinculacion/steps";
import { computeHeaderProgress } from "@/src/domains/vinculacion/steps/helpers";
import RequireAuth from "@/src/shared/auth/RequireAuth";
import { usePathname } from "next/navigation";

export default function VinculacionLayout({ children }: { children: React.ReactNode }) {
    return (
        <VinculacionFlowProvider>
            <VinculacionShell>{children}</VinculacionShell>
        </VinculacionFlowProvider>
    );
}

function VinculacionShell({ children }: { children: React.ReactNode }) {
    const flow = useVinculacionFlow();
    const pathname = usePathname();

    const isMisVinculaciones = pathname?.startsWith("/vinculacion/mis-vinculaciones");

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
                    showIsCollabsable={!isMisVinculaciones}
                    showSteps={!isMisVinculaciones}
                    showRfc={!isMisVinculaciones}
                />
                <main className="flex-1 min-h-0 -mt-6">{children}</main>
            </div>
        </RequireAuth>
    );
}
