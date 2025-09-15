"use client";

import * as React from "react";
import { Card, CardBody, Button, Tooltip, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { VinculacionService } from "@/src/domains/vinculacion/services/vinculacion.service";
import { addToast } from "@heroui/toast";
import { useVinculacionFlow } from "@/src/domains/vinculacion/context/flow-context";

type Props = {
    rfc?: string | null;
    id?: string | null;
};

export const EstadosFinancierosCard: React.FC<Props> = ({ rfc, id }) => {
    const { id: ctxId, rfc: ctxRfc } = useVinculacionFlow();

    const effectiveRfc = rfc ?? ctxRfc;
    const effectiveId = id ?? ctxId;

    const [loadingUpload, setLoadingUpload] = React.useState({
        recientes: false,
        historicos: false,
    });
    const [hasDocuments, setHasDocuments] = React.useState({
        recientes: false,
        historicos: false,
    });

    const fileInputRefRecientes = React.useRef<HTMLInputElement>(null);
    const fileInputRefHistoricos = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        verifyDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const verifyDocuments = async () => {
        if (!effectiveId || !effectiveRfc) return;
        try {
            const data = await VinculacionService.valideDocsRazonesFinancieras({
                rfc: effectiveRfc,
                id: effectiveId,
            });
            setHasDocuments({
                recientes: data.hasRecentDocuments,
                historicos: data.hasHistoricalDocuments,
            });
        } catch {
            addToast({
                title: "Error",
                description: "No se pudieron verificar los documentos.",
                color: "danger",
            });
        }
    };

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "recientes" | "historicos"
    ) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setLoadingUpload((prev) => ({ ...prev, [type]: true }));

        const fileName =
            type === "recientes"
                ? "estados_financieros_3_meses"
                : "estados_financieros_2_anos";

        try {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const base64 = (ev.target?.result as string).split(",")[1];

                const res = await VinculacionService.uploadDocument({
                    id: effectiveId || "",
                    rfc: effectiveRfc || "",
                    fileName,
                    contentType: "application/pdf",
                    Base64Data: base64,
                    useTemp: false,
                });

                if (res.succeeded) {
                    addToast({
                        title: "Documento cargado",
                        description: res.reasonCode?.description ?? "Se cargó correctamente.",
                        color: "success",
                    });
                    setHasDocuments((prev) => ({ ...prev, [type]: true }));
                    await verifyDocuments();
                } else {
                    addToast({
                        title: "Error",
                        description: res.reasonCode?.description ?? "No se pudo guardar.",
                        color: "danger",
                    });
                }
            };
            reader.readAsDataURL(file);
        } catch {
            addToast({
                title: "Error",
                description: "Error al guardar el documento.",
                color: "danger",
            });
        } finally {
            setLoadingUpload((prev) => ({ ...prev, [type]: false }));
        }
    };

    const renderUploadButton = (type: "recientes" | "historicos") => {
        const isUploaded = hasDocuments[type];
        const isLoading = loadingUpload[type];
        const label =
            type === "recientes"
                ? "Estados financieros últimos 3 meses"
                : "Estados financieros últimos 2 años";

        const fileInputRef =
            type === "recientes" ? fileInputRefRecientes : fileInputRefHistoricos;

        return (
            <div className="flex items-center gap-2 w-full">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, type)}
                />
                <Button
                    color="primary"
                    variant={isUploaded ? "flat" : "solid"}
                    onPress={() => fileInputRef.current?.click()}
                    isDisabled={isLoading || isUploaded}
                    startContent={
                        isLoading ? (
                            <Spinner size="sm" />
                        ) : (
                            <Icon icon="lucide:upload" fontSize={18} />
                        )
                    }
                    className="flex-1"
                >
                    {label}
                </Button>
                {isUploaded && (
                    <Tooltip content="Ya existe un documento cargado y en revisión.">
                        <Icon icon="lucide:search-check" className="text-primary text-lg" />
                    </Tooltip>
                )}
            </div>
        );
    };

    return (
        <Card className="w-full -mt-7" shadow="none">
            <CardBody className="space-y-4">
                <div className="flex flex-col items-center text-center">
                    <p className="text-sm text-default-500">
                        Haremos un breve análisis de tus estados financieros y nos pondremos en contacto contigo.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderUploadButton("recientes")}
                    {renderUploadButton("historicos")}
                </div>
            </CardBody>
        </Card>
    );
};