"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardBody, cn, Spinner } from "@heroui/react";
import { OperacionService } from "@/src/domains/operacion/services/operacion.service";
import { useOperacionFlow } from "@/src/domains/operacion/context/flow-context";
import { stateToComponentMap, StateToStepId, STEPS } from "@/src/domains/operacion/steps";
import StepActions from "@/src/shared/components/Stepper/StepActions";
import VerticalStepper from "@/src/shared/components/Stepper/VerticalStepper";
import { EstadoOperacion } from "@/src/domains/operacion/estados";
import StepCreacion from "@/src/domains/operacion/steps/StepCreacion";

export default function OperacionLotePage() {
    const { rfc, id, idLote } = useParams<{ rfc: string; id: string; idLote: string }>();
    const flow = useOperacionFlow();

    const [detalle, setDetalle] = React.useState<any | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
    const [loadingNext, setLoadingNext] = React.useState(false);
    const [stepActions, setStepActions] = React.useState<{
        next?: () => Promise<void> | void;
        prev?: () => Promise<void> | void;
        nextDisabled?: boolean;
        prevDisabled?: boolean;
    }>({});

    // Reset si cambian params (id / rfc / idLote)
    React.useEffect(() => {
        if (flow.needsReset(id, rfc, idLote)) {
            flow.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, rfc, idLote]);

    const refreshFromDetalle = React.useCallback(async () => {
        if (!rfc || !idLote) {
            setErrorMsg("Faltan parámetros requeridos.");
            return;
        }
        try {
            const res = await OperacionService.getDetalleOperacionesLote(rfc, idLote);
            setDetalle(res);

            // elegir operación a hidratar: la que coincide con param id, o primera
            const opArray = res?.operaciones || [];
            const op = opArray.find((o: any) => o.id === id) || opArray[0];

            const effectiveId = op?.id || id; // fallback al id del path
            const state = res?.state ?? op?.estadoOperacion ?? null;

            flow.hydrateFromDetalle({
                id: effectiveId,
                rfc,
                idLote,
                state,
                flags: {
                    // placeholder: agregar flags si el backend provee algo relevante
                },
            });

            setErrorMsg(null);
        } catch (e) {
            console.error("Error cargando detalle lote:", e);
            setErrorMsg("Error cargando detalle del lote.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rfc, idLote, id]);

    const withRefresh = React.useCallback(
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

    const bindStepActions = React.useCallback((a: typeof stepActions) => {
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

    React.useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            await refreshFromDetalle();
            if (active) setLoading(false);
        })();
        return () => { active = false; };
    }, [refreshFromDetalle]);

    const currentStepId = React.useMemo(() => {
        if (flow.currentState == null) return "default";
        return StateToStepId[flow.currentState] ?? "default";
    }, [flow.currentState]);

    const StepComponent = React.useMemo(() => {
        if (flow.currentState == null) return StepCreacion;
        return stateToComponentMap[flow.currentState as EstadoOperacion] ?? null;
    }, [flow.currentState]);

    const collapsed = flow.sidebarCollapsed;

    return (
        <div className="w-full h-[100%] px-4 py-6 flex flex-col">
            <div className="flex flex-1 min-h-0 gap-4">
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

                <Card className="flex-1 h-full">
                    <CardBody className="h-full p-0">
                        <div className="flex-1 overflow-auto p-4">
                            {loading ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <Spinner label="Cargando detalle del lote…" />
                                </div>
                            ) : errorMsg ? (
                                <div className="text-danger">{errorMsg}</div>
                            ) : StepComponent ? (
                                <StepComponent
                                    {...({
                                        id: flow.id ?? "",
                                        rfc: flow.rfc ?? "",
                                        idLote: flow.idLote ?? "",
                                        detalle,
                                        bindStepActions,
                                        onAdvance: refreshFromDetalle,
                                    } as any)}
                                />
                            ) : (
                                <div className="text-default-500">
                                    No hay UI definida para el estado <b>{flow.currentState}</b>.
                                </div>
                            )}
                        </div>

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
        </div>
    );
}