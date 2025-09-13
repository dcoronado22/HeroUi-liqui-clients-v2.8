"use client";

import { stateToComponentMap, StateToStepId, STEPS } from "@/src/domains/operacion/steps";
import { useOperacionFlow } from "@/src/domains/operacion/context/flow-context";
import StepActions from "@/src/shared/components/Stepper/StepActions";
import VerticalStepper from "@/src/shared/components/Stepper/VerticalStepper";
import { Card, CardBody, cn, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { EstadoOperacion } from "@/src/domains/operacion/estados";
import StepCreacion from "@/src/domains/operacion/steps/StepCreacion";

export default function OperacionPage() {
    const flow = useOperacionFlow();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loadingNext, setLoadingNext] = useState(false);
    const [stepActions, setStepActions] = useState<{
        next?: () => Promise<void> | void;
        prev?: () => Promise<void> | void;
        nextDisabled?: boolean;
        prevDisabled?: boolean;
    }>({});

    const refreshFromDetalle = useCallback(async () => {

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const withRefresh = useCallback(
        (action?: () => Promise<void> | void) =>
            async () => {
                try {
                    if (action) await action();
                } finally {
                    await refreshFromDetalle();
                }
            },
        [refreshFromDetalle]
    );

    const bindStepActions = useCallback((a: typeof stepActions) => {
        const boundNext = a.next ? withRefresh(a.next) : undefined;

        const wrappedNext = boundNext
            ? async () => {
                setLoadingNext(true);
                try {
                    await boundNext();
                } finally {
                    setLoadingNext(false);
                }
            }
            : undefined;

        setStepActions({
            ...a,
            next: wrappedNext,
        });
    }, [withRefresh]);

    const currentStepId = useMemo(() => {
        if (flow.currentState == null) return "default";
        return StateToStepId[flow.currentState] ?? "default";
    }, [flow.currentState]);

    const StepComponent = useMemo(() => {
        // Fallback mientras no se hidrata (estado inicial)
        if (flow.currentState == null) return StepCreacion;
        return stateToComponentMap[flow.currentState as EstadoOperacion] ?? null;
    }, [flow.currentState]);

    const collapsed = flow.sidebarCollapsed;

    return (
        <div className="w-full h-[100%] px-4 py-6 flex flex-col">
            <div className="flex flex-1 min-h-0 gap-4">
                {/* LEFT: Stepper (colapsable) */}
                <Card
                    className={cn(
                        "shrink-0 h-full transition-all duration-300 overflow-hidden",
                        collapsed ? "w-[5.3%]" : "basis-[20%]"
                    )}
                >
                    <CardBody className="h-full overflow-auto">
                        <VerticalStepper
                            steps={STEPS}
                            ctx={flow.flags}
                            currentId={currentStepId}
                            clickable={false}
                            compact={collapsed}
                        />
                    </CardBody>
                </Card>

                {/* RIGHT: Contenido + Footer persistente */}
                <Card className="flex-1 h-full">
                    <CardBody className="h-full p-0">
                        {/* CONTENIDO */}
                        <div className="flex-1 overflow-auto p-4">
                            {loading ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <Spinner label="Cargando detalle…" />
                                </div>
                            ) : errorMsg ? (
                                <div className="text-danger">{errorMsg}</div>
                            ) : StepComponent ? (
                                <StepComponent
                                    id={flow.id ?? ""}
                                    rfc={flow.rfc ?? ""}
                                    idLote={flow.idLote ?? ""}
                                    bindStepActions={bindStepActions}
                                    onAdvance={refreshFromDetalle}
                                />
                            ) : (
                                <div className="text-default-500">
                                    No hay UI definida para el estado <b>{flow.currentState}</b>.
                                </div>
                            )}
                        </div>

                        {/* FOOTER */}
                        <StepActions
                            onPrev={stepActions.prev}
                            onNext={stepActions.next}
                            disablePrev={stepActions.prevDisabled}
                            disableNext={stepActions.nextDisabled}
                            loadingNext={loadingNext}
                        />
                    </CardBody>
                </Card>
            </div>
        </div >
    );
}