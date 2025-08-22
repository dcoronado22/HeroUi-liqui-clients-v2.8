"use client";

import * as React from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { usePolling } from "@/src/shared/hooks/usePolling";
import { VinculacionService } from "../services/vinculacion.service";
import { Icon } from "@iconify/react";

type Props = {
    id: string;
    rfc: string;
    detalle?: any;
    bindStepActions: (a: { nextDisabled?: boolean; prevDisabled?: boolean }) => void;
    onAdvance: () => Promise<void> | void;
};

export default function StepFirmaMiFiel({
    id,
    rfc,
    detalle,
    bindStepActions,
    onAdvance,
}: Props) {
    const v = detalle?.vinculacion;
    const email = v?.datosAutorizacionBuro?.email ?? "";
    const aplicaAval = detalle?.alianza?.aplicaAval === true;

    // no hay “Siguiente” manual
    React.useEffect(() => {
        bindStepActions({ nextDisabled: true });
    }, [bindStepActions]);

    // ---------- UI flags ----------
    const [buroPending, setBuroPending] = React.useState(false);
    const [rechazado, setRechazado] = React.useState(false);
    const [documentoFirmado, setDocumentoFirmado] = React.useState(
        v?.documentoFirmado === true ||
        v?.datosAutorizacionBuro?.autorizacionBuro?.state === 1
    );

    // Banner de retry para state=7
    const empiezaEn7 = v?.state === 7;
    const [showRetryExpediente, setShowRetryExpediente] = React.useState(!!empiezaEn7);
    const [retryLoading, setRetryLoading] = React.useState(false);

    const creatingExpediente = React.useRef(false);

    // ---------- Polling config ----------
    const isDone = React.useCallback((res: any) => {
        const rc = res?.responseData?.ReasonCode?.Value;
        const backendState = res?.state;

        // Rechazado explícito
        if (rc === 1039) return true;

        // El back movió el estado (dejó de ser 4)
        if (typeof backendState === "number" && backendState !== 4) return true;

        return false; // seguir poll
    }, []);

    const onTick = React.useCallback((res: any) => {
        const rc = res?.responseData?.ReasonCode?.Value;
        setBuroPending(rc === 1040);
        if (rc === 1039) setRechazado(true);
        if (res?.responseData?.StateMiFiel === 1) setDocumentoFirmado(true);
    }, []);

    const intentarCrearExpedienteAzul = React.useCallback(async () => {
        if (creatingExpediente.current) {
            console.log("🟡 Ya está creando expediente, saltando...");
            return;
        }

        console.log("🔵 Iniciando creación de expediente...");
        creatingExpediente.current = true;
        setRetryLoading(true);

        setRetryLoading(true);
        try {
            const nombre =
                v?.datosRegistroVinculacion?.razonSocial ??
                [
                    v?.datosRegistroVinculacion?.nombres,
                    v?.datosRegistroVinculacion?.apellidoPaterno,
                    v?.datosRegistroVinculacion?.apellidoMaterno,
                ].filter(Boolean).join(" ");

            const emailDestino =
                v?.datosRegistroVinculacion?.email ?? email ?? "";

            const res = await VinculacionService.crearExpedienteAzul({
                id,
                rfc,
                name: nombre ?? "",
                email: emailDestino,
            });

            const ok = res?.responseData?.Succeeded === true;
            const rc = res?.responseData?.ReasonCode?.Value;

            if (ok) {
                addToast({
                    title: "Expediente creado",
                    description: "Continuando…",
                    color: "success",
                });
                setShowRetryExpediente(false);
                creatingExpediente.current = false;
                await onAdvance();
            } else {
                // RC conocido 11026 (máximo folders), u otros → mantenemos banner
                addToast({
                    title: `Creación de expediente`,
                    description:
                        res?.responseData?.ReasonCode?.Description ||
                        "No fue posible crear el expediente. Intenta nuevamente.",
                    color: "warning",
                });
                setShowRetryExpediente(true);
                // no hacemos onAdvance; te quedas aquí para reintentar
            }
        } catch (err) {
            console.error("crearExpedienteAzul error:", err);
            addToast({
                title: "Error de red",
                description: "No fue posible crear el expediente. Intenta de nuevo.",
                color: "danger",
            });
            setShowRetryExpediente(true);
        } finally {
            setRetryLoading(false);
            creatingExpediente.current = false;
        }
    }, [email, id, onAdvance, rfc, v?.datosRegistroVinculacion]);

    const onDone = React.useCallback(
        async (res: any) => {
            const rc = res?.responseData?.ReasonCode?.Value;
            const backendState = res?.state;

            if (rc === 1039) {
                addToast({
                    title: "Buró rechazado",
                    description: "El buró fue rechazado (1039).",
                    color: "danger",
                });
                await onAdvance();
                return;
            }

            // Si el back pasó a 7, intentamos crear el expediente
            if (backendState === 7) {
                // Si NO aplica aval, igual intentamos 7
                // (aplicaAval no impide 7; sólo cambia el camino previo de 5/6)
                await intentarCrearExpedienteAzul();
                return;
            }

            // En cualquier otro estado != 4, refrescamos para que el contenedor monte el siguiente Step
            await onAdvance();
        },
        [intentarCrearExpedienteAzul, onAdvance]
    );

    const enabled = v?.state === 4; // sólo polea en state 4

    usePolling({
        enabled,
        intervalMs: 10000,
        task: () =>
            VinculacionService.tickFirmaMiFiel({
                id,
                rfc,
                datosAutorizacionBuro: v?.datosAutorizacionBuro,
            }),
        isDone,
        onTick,
        onDone,
        pauseWhenHidden: true,
        maxTicks: 120,
    });

    const tipoContribuyente = v?.datosRegistroVinculacion?.tipoContribuyente; // 0=PM, 1=PF, 2=PF c/AE
    const nombreContribuyente =
        tipoContribuyente === 0
            ? v?.datosRegistroVinculacion?.razonSocial ?? "—"
            : [
                v?.datosRegistroVinculacion?.nombres,
                v?.datosRegistroVinculacion?.apellidoPaterno,
                v?.datosRegistroVinculacion?.apellidoMaterno,
            ]
                .filter(Boolean)
                .join(" ") || "—";
    const rfcDisplay = v?.datosRegistroVinculacion?.rfc ?? rfc;

    function StatusChip() {
        if (rechazado) {
            return (
                <Chip color="danger" variant="flat" startContent={<Icon icon="lucide:shield-x" className="mr-2" />}>
                    Buró rechazado
                </Chip>
            );
        }
        if (documentoFirmado && buroPending) {
            return (
                <Chip color="warning" variant="dot">
                    <Icon icon="lucide:clock" className="mr-2" />
                    Firmado, validando buró…
                </Chip>
            );
        }
        if (documentoFirmado) {
            return (
                <Chip color="success" variant="flat" startContent={<Icon icon="line-md:check-all" className="mr-2" />}>
                    Documento firmado
                </Chip>
            );
        }
        return (
            <Chip color="warning" variant="flat" size="lg" startContent={<Icon icon="line-md:loading-loop" className="mr-2" />}>
                Pendiente de firma
            </Chip>
        );
    }

    const onModificar = () => {
        addToast({
            title: "Modificar y regenerar",
            description:
                "Aquí conectarás tu modal/flujo para actualizar datos y regenerar el documento.",
        });
    };

    const onVerArchivo = () => {
        addToast({
            title: "Ver archivo",
            description: "Conecta aquí tu fetch a S3 / visor PDF.",
        });
    };

    return (
        <Card className="max-w-full h-full mx-auto" shadow="none">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Icon icon="icon-park-outline:protect" className="text-2xl mr-1" />
                    <div className="font-semibold text-2xl text-default-600">Autorización pendiente de firma electrónica</div>
                </div>
                <StatusChip />
            </CardHeader>

            {/* Banner de retry para state=7 */}
            {showRetryExpediente && (
                <div className="w-full px-4 py-3">
                    <Card shadow="sm" className="bg-warning-100">
                        <CardBody className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="text-sm text-warning-700">
                                <div className="font-medium">Creación de expediente pendiente</div>
                                <div>Intenta nuevamente crear el expediente en Expediente Azul.</div>
                            </div>
                            <Button
                                color="warning"
                                variant="solid"
                                isLoading={retryLoading}
                                onPress={intentarCrearExpedienteAzul}
                            >
                                Reintentar creación de expediente
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            )}

            <div className="w-full h-px bg-divider" />

            <CardBody className="space-y-8">
                {/* Banner informativo */}
                <Card shadow="sm">
                    <CardBody className="flex items-start gap-4 bg-primary-50 text-primary-800">
                        <Icon icon="line-md:alert-circle" className="text-3xl self-center flex-shrink-0" />
                        <div className="text-sm">
                            <p className="mb-2 text-center">
                                Hemos enviado un documento de autorización a la plataforma MiFiel para
                                obtener tu firma digital. MiFiel te notificará al correo electrónico{" "}
                                <strong className="text-primary">{email || "correo registrado"}</strong>. Por favor, revisa tu
                                bandeja de entrada y sigue las instrucciones para firmar. Una vez que registres tu firma, nuestro sistema
                                avanzará automáticamente al siguiente paso del proceso. Este proceso puede tardar unos minutos mientras
                                recibimos la confirmación.
                            </p>
                        </div>
                    </CardBody>
                </Card>

                {/* Resumen + acciones */}
                <Card shadow="md" className="px-4 py-4" >
                    <CardBody className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-lg sm:text-xl font-semibold">
                                Autorización de servicios {nombreContribuyente}
                            </h3>
                            <p className="text-sm text-foreground-500 mt-1">
                                <span className="font-medium">RFC:</span> {rfcDisplay} ·{" "}
                                <span className="font-medium">Email:</span> {email || "—"}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                            <Button
                                variant="flat"
                                color="primary"
                                onPress={onModificar}
                                isDisabled={rechazado || documentoFirmado}
                            >
                                <Icon icon="lucide:pencil" className="mr-2" />
                                Modificar y regenerar
                            </Button>
                            <Button color="primary" onPress={onVerArchivo}>
                                <Icon icon="lucide:eye" className="mr-2" />
                                Ver archivo
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </CardBody>
        </Card>
    );
}
