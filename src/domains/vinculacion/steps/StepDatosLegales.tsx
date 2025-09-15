// src/domains/vinculacion/steps/StepDatosLegales.tsx
import React from "react";
import { Tabs, Tab, Card, Divider } from "@heroui/react";
import FormApoderadoLegal from './StepDatosLegales/FormRepresentanteLegal';
import FormDatosEscrituracion from "./StepDatosLegales/FormDatosEscrituracion";
import FormDatosCuentas from './StepDatosLegales/FormDatosCuentas';
import { VinculacionService } from "../services/vinculacion.service";
import { estadosEntry } from "@/config/constants";
import { Icon } from "@iconify/react";

export default function StepDatosLegales({ detalle, bindStepActions }: { detalle: any, bindStepActions?: (a: { next?: () => Promise<void>, nextDisabled?: boolean }) => void }) {
    const [selected, setSelected] = React.useState("apoderado");
    const [validity, setValidity] = React.useState({
        apoderado: false,
        escrituracion: false,
        cuenta: false,
    });
    const [formsData, setFormsData] = React.useState({
        apoderadoLegalData: detalle?.apoderadoLegalData ?? {},
        escrituraData: detalle?.escrituraData ?? {},
        desembolsoData: detalle?.desembolsoData ?? {},
    });

    const icon = (isValid: boolean) =>
        isValid ? (
            <Icon icon="line-md:circle-filled-to-confirm-circle-filled-transition" fontSize={18} className="text-success ml-2" />
        ) : (
            <Icon icon="line-md:alert-circle-twotone-loop"
                fontSize={18} className="text-warning ml-2" />
        );

    const handleUpdate = (key: "apoderadoLegalData" | "escrituraData" | "desembolsoData", data: any) => {
        setFormsData(prev => ({ ...prev, [key]: data }));
    };

    const lastPayloadRef = React.useRef<any>(null);

    const handleTabChange = async (key: string) => {
        setSelected(key);

        const payload = {
            rfc: detalle?.vinculacion?.datosRegistroVinculacion?.rfc,
            id: detalle?.vinculacion?.id,
            apoderadoLegalData: normalizeFormData(formsData.apoderadoLegalData),
            escrituraData: normalizeFormData(formsData.escrituraData),
            desembolsoData: normalizeFormData(formsData.desembolsoData),
        };

        // Solo si cambió algo disparamos
        if (JSON.stringify(lastPayloadRef.current) === JSON.stringify(payload)) {
            return;
        }

        try {
            const res = await VinculacionService.almaceneDatosContrato(payload);
            if (res?.succeeded) {
                lastPayloadRef.current = payload; // guardamos snapshot
            }
        } catch (err) {
            console.error("Error al guardar datos", err);
        }
    };

    const handleNext = async () => {
        const payload = {
            rfc: detalle?.vinculacion?.datosRegistroVinculacion?.rfc,
            id: detalle?.vinculacion?.id,
            apoderadoLegalData: normalizeFormData(formsData.apoderadoLegalData),
            escrituraData: normalizeFormData(formsData.escrituraData),
            desembolsoData: normalizeFormData(formsData.desembolsoData),
        };

        // Paso 1: Guardar cambios de contratos
        await VinculacionService.almaceneDatosContrato(payload);

        // Paso 2: Avanzar flujo (state=9)
        const folderId = detalle?.vinculacion?.datosExpedienteAzul?.folder_id;
        if (!folderId) {
            console.error("Falta FolderId en detalle");
            return;
        }

        try {
            const res = await VinculacionService.avanzarDatosLegales({
                id: payload.id,
                rfc: payload.rfc,
                folderId: String(folderId),
            });
            if (res?.responseData?.ReasonCode?.Description) {
                console.log("Avance state=9:", res.responseData.ReasonCode.Description);
            }
        } catch (e) {
            console.error("Error al avanzar a state=9", e);
        }
    };

    function validateInitial(data: any, type: "apoderado" | "escrituracion" | "cuenta") {
        if (type === "apoderado") {
            return !!(
                data?.nombre &&
                data?.numeroEscritura &&
                data?.fechaEscritura &&
                data?.nombreNotario &&
                data?.numeroNotario &&
                data?.ciudadNotario &&
                (data?.estadoNotario?.size > 0 || typeof data?.estadoNotario === "string") &&
                data?.numeroFolioMercantil &&
                data?.ciudadRegistro &&
                (data?.estadoRegistro?.size > 0 || typeof data?.estadoRegistro === "string")
            );
        }
        if (type === "escrituracion") {
            return !!(
                data?.numeroEscritura &&
                data?.fechaEscritura &&
                data?.nombreNotario &&
                data?.numeroNotario &&
                data?.ciudadNotario &&
                (data?.estadoNotario?.size > 0 || typeof data?.estadoNotario === "string") &&
                data?.numeroFolioMercantil &&
                data?.ciudadRegistro &&
                (data?.estadoRegistro?.size > 0 || typeof data?.estadoRegistro === "string") &&
                data?.deudorFirmaElectronica
            );
        }
        if (type === "cuenta") {
            return !!(
                data?.banco &&
                data?.beneficiario &&
                data?.numeroCuenta &&
                /^\d{10,16}$/.test(data?.numeroCuenta) &&
                data?.clabe &&
                /^\d{18}$/.test(data?.clabe) &&
                data?.certificacionBancaria
            );
        }
        return false;
    }

    React.useEffect(() => {
        setValidity({
            apoderado: validateInitial(formsData.apoderadoLegalData, "apoderado"),
            escrituracion: validateInitial(formsData.escrituraData, "escrituracion"),
            cuenta: validateInitial(formsData.desembolsoData, "cuenta"),
        });
    }, []);

    React.useEffect(() => {
        const allValid =
            validateInitial(formsData.apoderadoLegalData, "apoderado") &&
            validateInitial(formsData.escrituraData, "escrituracion") &&
            validateInitial(formsData.desembolsoData, "cuenta");

        bindStepActions?.({
            next: handleNext,
            nextDisabled: !allValid,
        });
    }, [formsData, bindStepActions]);

    function normalizeFormData(data: any) {
        if (!data) return data;

        const estadoNotarioValue =
            data.estadoNotario instanceof Set ? Array.from(data.estadoNotario)[0] : data.estadoNotario;
        const estadoRegistroValue =
            data.estadoRegistro instanceof Set ? Array.from(data.estadoRegistro)[0] : data.estadoRegistro;

        const estadoNotarioEntry =
            estadosEntry.find(e => e.value === estadoNotarioValue)?.entry || estadoNotarioValue || "";

        const estadoRegistroEntry =
            estadosEntry.find(e => e.value === estadoRegistroValue)?.entry || estadoRegistroValue || "";

        return {
            ...data,
            fechaEscritura: data.fechaEscritura
                ? typeof data.fechaEscritura === "string"
                    ? data.fechaEscritura
                    : `${data.fechaEscritura.year}-${String(data.fechaEscritura.month).padStart(
                        2,
                        "0"
                    )}-${String(data.fechaEscritura.day).padStart(2, "0")}`
                : null,
            estadoNotario: estadoNotarioEntry,
            estadoRegistro: estadoRegistroEntry,
        };
    }

    return (
        <div className="flex w-full flex-col">
            <Tabs
                variant="solid"
                aria-label="Formularios"
                selectedKey={selected}
                onSelectionChange={(key) => handleTabChange(String(key))}
                fullWidth
                classNames={{
                    tabContent: "group-data-[selected=true]:text-primary-500"
                }}
            >
                <Tab
                    key="apoderado"
                    title={
                        <span className="flex items-center gap-1">
                            Datos del Apoderado Legal {icon(validity.apoderado)}
                        </span>
                    }
                >
                    <Card className="p-6">
                        <FormApoderadoLegal
                            initialData={formsData?.apoderadoLegalData}
                            onValidityChange={(isValid) =>
                                setValidity((prev) => ({ ...prev, apoderado: isValid }))
                            }
                            onChange={data => handleUpdate("apoderadoLegalData", data)}
                        />
                    </Card>
                </Tab>
                <Tab
                    key="escrituracion"
                    title={
                        <span className="flex items-center gap-1">
                            Datos de Escrituración {icon(validity.escrituracion)}
                        </span>
                    }
                >
                    <Card className="p-6">
                        <FormDatosEscrituracion
                            initialData={formsData?.escrituraData}
                            onValidityChange={(isValid) =>
                                setValidity((prev) => ({ ...prev, escrituracion: isValid }))
                            }
                            onChange={data => handleUpdate("escrituraData", data)}
                        />
                    </Card>
                </Tab>

                <Tab
                    key="cuenta"
                    title={
                        <span className="flex items-center gap-1">
                            Datos de Estado de Cuenta {icon(validity.cuenta)}
                        </span>
                    }
                >
                    <Card className="p-6">
                        <FormDatosCuentas
                            initialData={formsData?.desembolsoData}
                            onValidityChange={(isValid) =>
                                setValidity((prev) => ({ ...prev, cuenta: isValid }))
                            }
                            onChange={data => handleUpdate("desembolsoData", data)}
                        />
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );
}