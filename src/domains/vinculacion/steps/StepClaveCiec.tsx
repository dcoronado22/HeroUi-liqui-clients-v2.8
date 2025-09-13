"use client";

import * as React from "react";
import { Card, CardBody, Button, Skeleton, CardHeader, ScrollShadow } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { loadSatwsScript, openSatws } from "@/src/shared/integrations/satws";
import { VinculacionService } from "@/src/domains/vinculacion/services/vinculacion.service";
import { Icon } from "@iconify/react";

type Props = {
    id: string;
    rfc: string;
    onAdvance: () => Promise<void> | void; // el contenedor hará getDetalle() y re-render
    bindStepActions: (a: { nextDisabled?: boolean; prevDisabled?: boolean }) => void;
};

export default function StepClaveCiec({ id, rfc, onAdvance, bindStepActions }: Props) {
    const [videoLoaded, setVideoLoaded] = React.useState(false);
    const [opening, setOpening] = React.useState(false);
    const successHandledRef = React.useRef(false);

    // Handler común para cuando el usuario cierra/cancela el widget
    const handleWidgetDismiss = React.useCallback(() => {
        setOpening(false);
        addToast({
            title: "Autenticación cancelada",
            description: "Puedes intentarlo nuevamente.",
            color: "warning",
        });
    }, []);

    React.useEffect(() => {
        // precarga script
        loadSatwsScript().catch(console.error);
    }, []);

    React.useEffect(() => {
        bindStepActions({ nextDisabled: true });
    }, [bindStepActions]);

    const handleOpen = async () => {
        try {
            await loadSatwsScript();
            // Reset del guard por cada apertura
            successHandledRef.current = false;

            openSatws({
                onSuccess: async () => {
                    // Evita múltiple ejecución en la misma apertura
                    if (successHandledRef.current) return;
                    successHandledRef.current = true;

                    try {
                        setOpening(true);
                        await VinculacionService.avanzarClaveCiec({ id, rfc });
                        addToast({ title: "Autenticación exitosa", description: "Continuando al siguiente paso…", color: "success" });
                        await onAdvance(); // el contenedor refresca detalle → moverá el step
                    } catch (e) {
                        console.error(e);
                        addToast({ title: "No se pudo avanzar", description: "Intenta nuevamente", color: "danger" });
                    } finally {
                        setOpening(false);
                    }
                },
                onError: () => {
                    addToast({ title: "Autenticación fallida", description: "Revisa tus datos e intenta de nuevo", color: "danger" });
                    setOpening(false);
                },
            });
        } catch (e) {
            console.error(e);
            addToast({ title: "Error", description: "No fue posible iniciar el widget", color: "danger" });
            setOpening(false);
        }
    };

    return (
        <ScrollShadow className="h-[100%]" size={15} >
            <Card shadow="none">
                <CardHeader className="flex items-center justify-between">
                    <div className="w-full flex items-center justify-between gap-4 py-2">
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold">¿Qué es la clave CIEC?</h2>
                            <p className="text-small text-default-600">
                                Este paso es indispensable para conocer el estado de tu empresa y tu factoraje.
                                A continuación te mostramos un video explicativo.
                            </p>
                        </div>
                        <Button color="primary" size="lg" onPress={handleOpen} startContent={<Icon icon="material-symbols:fingerprint" fontSize={"25"} />} isLoading={opening}>
                            Autenticar con Clave CIEC
                        </Button>
                    </div>
                </CardHeader>
                <CardBody className="flex flex-col gap-4" >
                    <div className="flex justify-center">
                        {!videoLoaded && (
                            <Skeleton className="rounded-lg" style={{ width: 640, height: 360 }} />
                        )}
                        <iframe
                            src="https://s3.amazonaws.com/public.cesione.com.co/Liquicapital/Liquicapital.mp4"
                            width="50wv"
                            height="50dhv"
                            onLoad={() => setVideoLoaded(true)}
                            style={{ display: videoLoaded ? "block" : "none", border: "none" }}
                            title="claveciec"
                        />
                        <style jsx>{`
                    /* Ajusta el iframe al espacio disponible de la pantalla manteniendo 16:9 */
                    iframe[title="claveciec"] {
                        width: min(70%, 90vw) !important;
                        aspect-ratio: 16 / 9;
                        height: auto !important;
                        max-height: 90dvh;
                        border: none;
                    }
                    @supports not (height: 100dvh) {
                        iframe[title="claveciec"] {
                            max-height: 90vh;
                        }
                    }
                `}</style>
                    </div>

                </CardBody >
            </Card >
        </ScrollShadow>
    );
}
