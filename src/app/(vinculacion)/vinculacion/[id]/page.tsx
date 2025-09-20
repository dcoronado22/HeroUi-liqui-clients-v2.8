"use client";

import * as React from "react";
import { redirect, useParams, useSearchParams, useRouter } from "next/navigation"; // <-- agregado useRouter
import { Card, CardBody, cn, Spinner } from "@heroui/react";
import VerticalStepper from "@/src/shared/components/Stepper/VerticalStepper";
import StepActions from "@/src/shared/components/Stepper/StepActions";
import { VinculacionService } from "@/src/domains/vinculacion/services/vinculacion.service";
import { useVinculacionFlow } from "@/src/domains/vinculacion/context/flow-context";
import { stateToComponentMap, StateToStepId, STEPS } from "@/src/domains/vinculacion/steps";
import { EstadoVinculacion } from "@/src/domains/vinculacion/estados";
import { areDatosLegalesValid } from "@/src/domains/vinculacion/steps/helpers";
import { CheckAnimation } from "@/src/shared/components/CheckAnimation";
import { useProcessStore } from "@/src/shared/processes/processStore";
import { Process } from "@/src/shared/processes/types";
import { useWebSocketClient } from "@/src/shared/hooks/useWebSocketClient";
import BuroFailed from "@/src/shared/components/BuroFailed";

export default function VinculacionCasePage() {
    const params = useParams<{ id: string }>();
    const search = useSearchParams();
    const router = useRouter(); // <-- instancia router
    const didRedirectRef = React.useRef(false); // <-- evita múltiples pushes
    const caseId = params.id;
    const [detalle, setDetalle] = React.useState<any | null>(null);
    const [stepActions, setStepActions] = React.useState<{
        next?: () => Promise<void> | void;
        prev?: () => Promise<void> | void;
        nextDisabled?: boolean;
        prevDisabled?: boolean;
    }>({});

    const flow = useVinculacionFlow();
    useWebSocketClient("ws://localhost:4000", flow.id ?? undefined);
    const [loading, setLoading] = React.useState(true);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
    const [loadingNext, setLoadingNext] = React.useState(false);
    const [validationsLoading, setValidationsLoading] = React.useState(false);
    const [allValid, setAllValid] = React.useState(false);
    const [showCheckAnimation, setShowCheckAnimation] = React.useState(false);

    const { state: processState } = useProcessStore();
    const entityId = flow.id ?? "demo"; // usa la vinculación actual (o "demo" si estás probando)
    const processes: Process[] = processState.processes[entityId] ?? [];

    const buroFailed =
        processes.some(p => p.type === "BURO" && p.state === "failed" && p.failureSeverity === "hard");

    console.log("🔎 entityId:", entityId);
    console.log("🔎 processes:", processes);
    console.log("🔎 buroFailed?:", buroFailed);

    React.useEffect(() => {
        if (buroFailed && !collapsed) {
            flow.toggleSidebar();
        }

    }, [buroFailed])


    React.useEffect(() => {
        // Si ya hay un ID en el contexto y es diferente al actual, resetear
        if (flow.id && flow.id !== caseId) {
            console.log(`Resetting context: changing from ${flow.id} to ${caseId}`);
            flow.reset();
        }
    }, [caseId, flow.id, flow.reset]);

    const currentStepId = React.useMemo(() => {
        if (!flow.currentState) return "registro";
        return StateToStepId[flow.currentState] ?? "registro";
    }, [flow.currentState]);

    const resolveRFC = (search: URLSearchParams, caseId: string, flowRfc?: string | null) => {
        const fromQuery = search.get("rfc")?.trim().toUpperCase();
        const fromStorage = typeof window !== "undefined"
            ? sessionStorage.getItem(`v:${caseId}:rfc`) ?? undefined
            : undefined;
        const fromCtx = flowRfc ?? undefined;

        const resolved = fromQuery || fromStorage || fromCtx;

        if (resolved && fromCtx && resolved !== fromCtx) {
            console.log(`RFC mismatch detected: query/storage=${resolved}, context=${fromCtx}. Resetting context.`);
            flow.reset();
        }

        return resolved;
    };

    // carga/refresh de detalle
    const refreshFromDetalle = React.useCallback(async () => {
        const rfc = resolveRFC(search, caseId, flow.rfc);

        if (!rfc) {
            setErrorMsg("No fue posible resolver el RFC del caso.");
            return;
        }

        if (typeof window !== "undefined") {
            sessionStorage.setItem(`v:${caseId}:rfc`, rfc);
        }

        try {
            const res = await VinculacionService.getDetalle(caseId, rfc);
            const v = res?.vinculacion;

            console.log("🔎 getDetalle Response:", res);
            console.log("🔎 v.state:", v?.state);

            if (!v) {
                setErrorMsg("No se encontró la vinculación.");
                redirect("/vinculacion/nuevo");
                return;
            }


            setDetalle(res);

            const flags = {
                personaMoral: v?.datosRegistroVinculacion?.tipoContribuyente === 0,
                aplicaAval: res?.alianza?.aplicaAval === true,
                claveCiecIsValid: res?.claveCiecIsValid === true,
            };

            flow.hydrateFromDetalle({
                id: v.id,
                rfc: v.datosRegistroVinculacion?.rfc,
                state: v.state,
                flags,
                folderId: v?.datosExpedienteAzul?.folder_id ?? null, // NUEVO
            });

            // NUEVO: calcular % del expediente si hay folderId
            const folderId = v?.datosExpedienteAzul?.folder_id;
            if (folderId && v?.datosRegistroVinculacion?.rfc && v?.id) {
                try {
                    const docsRes = await VinculacionService.getDocumentosExpediente({
                        FolderId: String(folderId),
                        Rfc: v.datosRegistroVinculacion.rfc,
                        Id: v.id
                    });
                    const list = docsRes?.payload?.document_list || [];
                    const total = list.length;
                    const done = list.filter((d: any) => String(d?.status || "").toLowerCase() === "valid").length;
                    const pct = total ? Math.round((done / total) * 100) : 0;
                    flow.setExpedientePct(pct);
                } catch {
                    flow.setExpedientePct(null);
                }
            } else {
                flow.setExpedientePct(null);
            }

            if (String(v?.state) === String(EstadoVinculacion.CaptureCargueFormatosExpediente)) {
                console.log("✅ Entró al if de state=9 desde getDetalle");

                const allLegalesValid = areDatosLegalesValid(res);

                console.log("🔎 Validaciones calculadas en front:", allLegalesValid);

                if (allLegalesValid) {
                    console.log("🚀 Forzando estado Pendientes");
                    flow.hydrateFromDetalle({
                        id: v.id,
                        rfc: v.datosRegistroVinculacion?.rfc,
                        state: EstadoVinculacion.Pendientes,
                        flags,
                        folderId: v?.datosExpedienteAzul?.folder_id ?? null,
                    });
                    setDetalle(res);
                    return;
                }
            }

            setErrorMsg(null);
        } catch (error) {
            console.error("Error loading detalle:", error);
            setErrorMsg("Error cargando los datos de la vinculación.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId, search]);

    React.useEffect(() => {
        if (!loading && detalle?.vinculacion?.state === 9) {
            (async () => {
                try {
                    setValidationsLoading(true);
                    const res = await VinculacionService.stateManager({
                        state: 9,
                        requestData: {
                            FolderId: String(detalle?.vinculacion?.datosExpedienteAzul?.folder_id),
                            Rfc: detalle?.vinculacion?.datosRegistroVinculacion?.rfc,
                            Id: detalle?.vinculacion?.id,
                        },
                    });
                    if (res) {
                        setDetalle(res);

                        // 👇 calcular si TODO está validado
                        const d = res?.responseData ?? res;
                        const validations = [
                            d?.RazonesFinancierasValidas,
                            d?.DocumentsIsValid,
                            d?.BuroValido,
                            d?.EscrituraDataValida,
                            d?.ApoderadoLegalDataValida,
                            d?.DesembolsoDataValida,
                        ];
                        const allOk = validations.every(Boolean);
                        setAllValid(allOk);

                        if (allOk) {
                            setTimeout(() => {
                                setShowCheckAnimation(true);
                            }, 2000);
                        }
                    }
                } catch (e) {
                    console.error("Error ejecutando state=9", e);
                } finally {
                    setValidationsLoading(false);
                }
            })();
        }
    }, [loading, detalle?.vinculacion?.state]);

    const withRefresh = React.useCallback(
        (action?: () => Promise<void> | void) =>
            async () => {
                try {
                    if (action) await action();
                } finally {
                    await refreshFromDetalle(); // siempre refresca del back
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
            try {
                setLoading(true);
                await refreshFromDetalle();
            } catch (e) {
                console.error(e);
                setErrorMsg("Error cargando detalle.");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [refreshFromDetalle]);

    React.useEffect(() => {
        // Redirección automática si ya está vinculado
        if (
            !loading &&
            !didRedirectRef.current &&
            flow.currentState === EstadoVinculacion.Vinculado &&
            flow.id &&
            flow.rfc
        ) {
            didRedirectRef.current = true;
            router.push(`/operacion/${encodeURIComponent(flow.rfc)}/${flow.id}?nuevo=1`);
        }
    }, [loading, flow.currentState, flow.id, flow.rfc, router]);

    // Selecciona el componente del paso según el estado
    const StepComponent =
        (flow.currentState != null
            ? stateToComponentMap[flow.currentState as EstadoVinculacion]
            : null) || null;

    const collapsed = flow.sidebarCollapsed;

    return (
        <div className="w-full h-[100%] px-4 py-6 flex flex-col">
            <div className="flex flex-1 min-h-0 gap-4">
                {/* LEFT: Stepper (colapsable) */}
                <Card
                    className={cn(
                        "shrink-0 h-full transition-all duration-300 overflow-hidden",
                        collapsed ? "w-[5.3%]" : "basis-[20%]",
                        buroFailed && "opacity-200 blur-[1.5px] pointer-events-none select-none",
                        "dark:bg-white/5 " // <-- agrega bg para dark mode
                    )}
                >
                    <CardBody className="h-full overflow-auto">
                        <VerticalStepper
                            steps={STEPS}
                            ctx={flow.flags}
                            currentId={currentStepId}
                            clickable={false}
                            compact={collapsed}
                            markActiveAsCompleteIds={allValid ? [currentStepId] : []}
                        />
                    </CardBody>
                </Card>

                {/* RIGHT: Contenido + Footer persistente */}
                <Card className="flex-1 h-full">
                    <CardBody className="h-full p-0">
                        <div className={`flex h-full flex-col ${buroFailed ? "blur-sm pointer-events-none" : ""}`}>
                            {/* CONTENIDO */}
                            <div className="flex-1 overflow-auto p-4">
                                {loading ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Spinner label="Cargando detalle…" />
                                    </div>
                                ) : errorMsg ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <div className="text-danger text-center text-lg font-semibold">
                                            {errorMsg}
                                        </div>
                                    </div>
                                ) : showCheckAnimation ? ( // 👈 NUEVO
                                    <div className="relative w-min-[3000px] -mx-20 -my-5 h-[90dvh]">
                                        <CheckAnimation
                                            coverParent
                                            keepHeroVisible
                                            keepBackgroundVisible
                                            title="¡Vinculación exitosa!"
                                            subtitle="Ahora serás redirigido a la operación..."
                                            autoHideAfterMs={5000}
                                            holdVisibleMs={4000}
                                            onComplete={() => {
                                                if (!didRedirectRef.current && flow.id && flow.rfc) {
                                                    didRedirectRef.current = true;
                                                    router.push(`/operacion/${encodeURIComponent(flow.rfc!)}/${flow.id}?nuevo=1`);
                                                }
                                            }}
                                        />
                                    </div>
                                ) : StepComponent ? (
                                    <StepComponent
                                        id={flow.id!}
                                        rfc={flow.rfc!}
                                        detalle={detalle}
                                        bindStepActions={bindStepActions}
                                        onAdvance={refreshFromDetalle}
                                        isEvaluating={validationsLoading}
                                        allValid={allValid} // <-- NUEVO
                                    />
                                ) : (
                                    <div className="text-default-500">
                                        No hay UI definida para el estado <b>{flow.currentState}</b>.
                                    </div>
                                )}
                            </div>

                            {/* FOOTER */}
                            {!allValid && (
                                <>
                                    <StepActions
                                        onPrev={stepActions.prev}
                                        onNext={stepActions.next}
                                        disablePrev={stepActions.prevDisabled}
                                        disableNext={stepActions.nextDisabled}
                                        loadingNext={loadingNext} // <-- ya está correcto
                                    />
                                </>
                            )}
                        </div>
                    </CardBody>
                    {buroFailed && <BuroFailed />}
                </Card>
            </div>
        </div>
    );
}