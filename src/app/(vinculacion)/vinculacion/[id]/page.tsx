// src/app/(vinculacion)/vinculacion/[id]/page.tsx
"use client";

import * as React from "react";
import { redirect, useParams, useSearchParams } from "next/navigation";
import { Card, CardBody, cn, Spinner } from "@heroui/react";
import VerticalStepper from "@/src/shared/components/Stepper/VerticalStepper";
import StepActions from "@/src/shared/components/Stepper/StepActions";
import { VinculacionService } from "@/src/domains/vinculacion/services/vinculacion.service";
import { useVinculacionFlow } from "@/src/domains/vinculacion/context/flow-context";
import { stateToComponentMap, STEPS } from "@/src/domains/vinculacion/steps";
import { EstadoVinculacion } from "@/src/domains/vinculacion/estados";

// mapea state numérico a stepId (sin 7)
const StateToStepId: Record<number, string> = {
    [EstadoVinculacion.Creando]: "registro",
    [EstadoVinculacion.CaptureClaveCiec]: "clave-ciec",
    [EstadoVinculacion.CaptureAutorizacionBuro]: "datos-buro",
    [EstadoVinculacion.CaptureFirmaMiFiel]: "firma-mifiel",
    [EstadoVinculacion.CaptureFormatosExpediente]: "firma-mifiel",
    [EstadoVinculacion.CaptureAutorizacionAvales]: "datos-avales",
    [EstadoVinculacion.CaptureFirmaAvales]: "firma-avales",
    [EstadoVinculacion.SeleccionClientesEstudio]: "seleccion-clientes",
    [EstadoVinculacion.CaptureCargueFormatosExpediente]: "cargue-expediente",
    [EstadoVinculacion.Vinculado]: "resumen",
    [EstadoVinculacion.Rechazado]: "rechazado",
    [EstadoVinculacion.Cancelado]: "cancelado",
};

export default function VinculacionCasePage() {
    const params = useParams<{ id: string }>();
    const search = useSearchParams();
    const caseId = params.id;
    const [detalle, setDetalle] = React.useState<any | null>(null);
    const [stepActions, setStepActions] = React.useState<{
        next?: () => Promise<void> | void;
        prev?: () => Promise<void> | void;
        nextDisabled?: boolean;
        prevDisabled?: boolean;
    }>({});

    const flow = useVinculacionFlow();
    const [loading, setLoading] = React.useState(true);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
    const [loadingNext, setLoadingNext] = React.useState(false);

    const currentStepId = React.useMemo(() => {
        if (!flow.currentState) return "registro";
        return StateToStepId[flow.currentState] ?? "registro";
    }, [flow.currentState]);

    // carga/refresh de detalle
    const refreshFromDetalle = React.useCallback(async () => {
        const rfc = flow.rfc
            ?? (typeof window !== "undefined" ? sessionStorage.getItem(`v:${caseId}:rfc`) ?? undefined : undefined)
            ?? search.get("rfc")?.toUpperCase();

        if (!rfc) {
            setErrorMsg("No fue posible resolver el RFC del caso.");
            return;
        }

        const res = await VinculacionService.getDetalle(caseId, rfc);
        const v = res?.vinculacion;

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
        });

        setErrorMsg(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId, search, flow.rfc]);

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
                        collapsed ? "w-[5.3%]" : "basis-[20%]"
                    )}
                >
                    <CardBody className="h-full overflow-auto">
                        <VerticalStepper
                            steps={STEPS}
                            ctx={flow.flags}
                            currentId={currentStepId}
                            clickable={false}
                            compact={collapsed} // Adjusts the stepper to be more compact when collapsed
                        />
                    </CardBody>
                </Card>

                {/* RIGHT: Contenido + Footer persistente */}
                <Card className="flex-1 h-full">
                    <CardBody className="h-full p-0">
                        <div className="flex h-full flex-col">
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
                                        id={flow.id!}
                                        rfc={flow.rfc!}
                                        detalle={detalle}
                                        bindStepActions={bindStepActions}   // 👈 se lo pasamos al step
                                        onAdvance={refreshFromDetalle}      // si quieres mantener esta vía también
                                    />
                                ) : (
                                    <div className="text-default-500">
                                        No hay UI definida para el estado <b>{flow.currentState}</b>.
                                    </div>
                                )}
                            </div>

                            {/* FOOTER (por ahora deshabilitado; cada Step puede manejar su CTA propio o lo conectamos luego) */}
                            <StepActions
                                onPrev={stepActions.prev}
                                onNext={stepActions.next}
                                disablePrev={stepActions.prevDisabled}
                                disableNext={stepActions.nextDisabled}
                                loadingNext={loadingNext}
                            />
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
