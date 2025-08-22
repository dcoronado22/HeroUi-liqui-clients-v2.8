"use client";

import * as React from "react";
import { Card, CardBody, Input, Select, SelectItem, Autocomplete, AutocompleteItem, Button } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { VinculacionService } from "../services/vinculacion.service";
import { isEmail, isPhone10, isCP5, todayISO } from "@/src/shared/helpers/validations";

// Asume que importas tus listas:
import { estados, municipios } from "@/config/constants";
// estados: {label:string, value:string}[]
// municipios: {estado:string, municipios:{label:string, value?:string}[]}[]

type Props = {
    id: string;
    rfc: string;
    detalle?: any;             // opcional (si el contenedor ya lo tiene)
    onAdvance: () => Promise<void> | void;
    bindStepActions: (a: {
        next?: () => Promise<void> | void;
        prev?: () => Promise<void> | void;
        nextDisabled?: boolean;
        prevDisabled?: boolean;
    }) => void;
};

export default function StepDatosBuro({ id, rfc, detalle, onAdvance, bindStepActions }: Props) {
    const v = detalle?.vinculacion;
    const registro = v?.datosRegistroVinculacion;

    const [telefono, setTelefono] = React.useState(v?.datosAutorizacionBuro?.telefono ?? "");
    const [cp, setCp] = React.useState(v?.datosAutorizacionBuro?.codigoPostal ?? "");
    const [estado, setEstado] = React.useState(v?.datosAutorizacionBuro?.estado ?? "");
    const [ciudad, setCiudad] = React.useState(v?.datosAutorizacionBuro?.ciudad ?? "");
    const [municipio, setMunicipio] = React.useState(v?.datosAutorizacionBuro?.municipio ?? "");
    const [colonia, setColonia] = React.useState(v?.datosAutorizacionBuro?.colonia ?? "");
    const [calle, setCalle] = React.useState(v?.datosAutorizacionBuro?.calle ?? "");
    const [numExt, setNumExt] = React.useState(v?.datosAutorizacionBuro?.numeroExterior ?? "");
    const [numInt, setNumInt] = React.useState(v?.datosAutorizacionBuro?.numeroInterior ?? "");
    const [email, setEmail] = React.useState(v?.datosAutorizacionBuro?.email ?? registro?.email ?? "");
    const [fechaFirma] = React.useState(v?.datosAutorizacionBuro?.fechaFirma || todayISO());
    const [saving, setSaving] = React.useState(false);

    const [loading, setLoading] = React.useState(false);

    const municipiosFiltrados =
        React.useMemo(() => (municipios.find((m) => m.estado === estado)?.municipios ?? []), [estado]);

    const valid =
        isPhone10(telefono) &&
        (!cp || isCP5(cp)) &&
        !!estado &&
        !!ciudad &&
        !!municipio &&
        isEmail(email);

    const tipoContribuyente = registro?.tipoContribuyente; // 0=PM,1=PF,2=PF con AE

    const doNext = React.useCallback(async () => {
        if (!valid) {
            addToast({
                title: "Revisa los datos",
                description: "Completa o corrige los campos requeridos.",
                color: "warning",
            });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                telefono,
                codigoPostal: cp || "",
                estado,
                ciudad,
                municipio,
                colonia,
                calle,
                numeroExterior: numExt,
                numeroInterior: numInt,
                email,
                fechaFirma, // solo-lectura
            };

            const res = await VinculacionService.avanzarDatosBuro({ id, rfc, payload });

            const ok = res?.responseData?.Succeeded === true;
            if (!ok) {
                const rc = res?.responseData?.ReasonCode?.Value;
                const rd = res?.responseData?.ReasonCode?.Description || "No fue posible avanzar";
                addToast({ title: `Error ${rc ?? ""}`, description: rd, color: "danger" });
                return;
            }

            addToast({ title: "Datos guardados", description: "Continuando…", color: "success" });
            // IMPORTANT: NO llames onAdvance aquí.
            // El contenedor envuelve next con withRefresh y ahí hace getDetalle.
        } catch (e) {
            console.error(e);
            addToast({ title: "Error de red", description: "Intenta nuevamente", color: "danger" });
        } finally {
            setSaving(false);
        }
    }, [
        valid,
        telefono, cp, estado, ciudad, municipio, colonia, calle, numExt, numInt, email, fechaFirma,
        id, rfc,
    ]);


    React.useEffect(() => {
        bindStepActions({
            next: doNext,
            nextDisabled: !valid || saving,
            // prev: opcional si este paso permite retroceder
        });
    }, [bindStepActions, doNext, valid, saving]);

    return (
        <Card shadow="none" >
            <CardBody className="flex flex-col gap-6">
                <div>
                    <h2 className="text-lg font-semibold">Autorización Buró</h2>
                    <p className="text-small text-default-600">
                        Asegúrate de que la información coincida con la registrada en Buró.
                    </p>
                </div>
                {/* Datos bloqueados de contribuyente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input variant="bordered" label="RFC" value={registro?.rfc ?? rfc} isReadOnly isDisabled />
                    <Input variant="bordered"
                        label="Tipo de contribuyente"
                        value={
                            tipoContribuyente === 0
                                ? "Persona moral"
                                : tipoContribuyente === 2
                                    ? "PF con AE"
                                    : "Persona física"
                        }
                        isReadOnly isDisabled
                    />
                    {tipoContribuyente === 0 ? (
                        <Input variant="bordered" label="Razón social" value={registro?.razonSocial ?? ""} isReadOnly isDisabled />
                    ) : (
                        <Input variant="bordered" label="Nombres" value={registro?.nombres ?? ""} isReadOnly isDisabled />
                    )}
                </div>

                {tipoContribuyente === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input variant="bordered" label="Nombre Rep. Legal" value={registro?.nombresRepLegal ?? ""} isReadOnly isDisabled />
                        <Input variant="bordered" label="Apellido paterno Rep." value={registro?.apellidoPaternoRepLegal ?? ""} isReadOnly isDisabled />
                        <Input variant="bordered" label="Apellido materno Rep." value={registro?.apellidoMaternoRepLegal ?? ""} isReadOnly isDisabled />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input variant="bordered" label="Apellido paterno" value={registro?.apellidoPaterno ?? ""} isReadOnly isDisabled />
                        <Input variant="bordered" label="Apellido materno" value={registro?.apellidoMaterno ?? ""} isReadOnly isDisabled />
                        <Input variant="bordered" label="Nacionalidad" value={registro?.nacionalidad ?? ""} isReadOnly isDisabled />
                    </div>
                )}

                {/* Contacto y domicilio */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input variant="bordered"
                        label="Teléfono (10 dígitos)"
                        value={telefono}
                        onValueChange={(v) => setTelefono(v.replace(/\D/g, "").slice(0, 10))}
                        isInvalid={telefono !== "" && !isPhone10(telefono)}
                        errorMessage={telefono !== "" && !isPhone10(telefono) ? "Debe tener 10 dígitos" : undefined}
                        isRequired
                    />
                    <Input variant="bordered"
                        label="Código postal"
                        value={cp}
                        onValueChange={(v) => setCp(v.replace(/\D/g, "").slice(0, 5))}
                        isInvalid={cp !== "" && !isCP5(cp)}
                        errorMessage={cp !== "" && !isCP5(cp) ? "5 dígitos" : undefined}
                    />
                    <Select
                        label="Estado"
                        variant="bordered"
                        selectedKeys={estado ? [estado] : []}
                        onSelectionChange={(keys) => {
                            const k = Array.from(keys)[0] as string | undefined;
                            setEstado(k ?? "");
                            setMunicipio(""); // reset municipio al cambiar estado
                        }}
                        isRequired
                    >
                        {estados.map((e) => (
                            <SelectItem key={e.value} textValue={e.label}>
                                {e.label}
                            </SelectItem>
                        ))}
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input variant="bordered" label="Ciudad" value={ciudad} onValueChange={setCiudad} isRequired />
                    <Autocomplete
                        label="Municipio"
                        variant="bordered"
                        selectedKey={municipio || undefined}
                        onSelectionChange={(k) => setMunicipio((k as string) ?? "")}
                        isDisabled={!estado}
                        isRequired
                        defaultItems={municipiosFiltrados}
                    >
                        {(item) => <AutocompleteItem key={item.label}>{item.label}</AutocompleteItem>}
                    </Autocomplete>
                    <Input variant="bordered" label="Colonia" value={colonia} onValueChange={setColonia} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input variant="bordered" label="Calle" value={calle} onValueChange={setCalle} />
                    <Input variant="bordered" label="Número exterior" value={numExt} onValueChange={setNumExt} />
                    <Input variant="bordered" label="Número interior" value={numInt} onValueChange={setNumInt} />
                </div>

                <div>
                    <h2 className="text-lg font-semibold">Datos para firma de documento</h2>
                    <p className="text-small text-default-600">
                        Por favor, ingresa el correo electrónico al que deseas que se envíe la solicitud de firma digital para autorizar la consulta en el Buró.
                    </p>
                </div>

                {/* Firma */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input variant="bordered"
                        type="email"
                        label="Email para solicitud de firma"
                        value={email}
                        onValueChange={setEmail}
                        isInvalid={email !== "" && !isEmail(email)}
                        errorMessage={email !== "" && !isEmail(email) ? "Email inválido" : undefined}
                        isRequired
                    />
                    <Input variant="bordered" label="Fecha de firma" value={fechaFirma} isReadOnly isDisabled disabled />
                </div>
            </CardBody>
        </Card>
    );
}
