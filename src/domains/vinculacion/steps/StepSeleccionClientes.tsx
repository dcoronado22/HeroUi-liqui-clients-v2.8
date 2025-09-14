// src/modules/vinculacion/steps/StepSeleccionClientes.tsx
"use client";

import * as React from "react";
import {
    Card, CardBody, CardHeader, Button, Input, Autocomplete, AutocompleteItem, Chip
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { Icon } from "@iconify/react";
import { VinculacionService } from "../services/vinculacion.service";

type Pagador = { nombre: string; rfc: string };

type Props = {
    id: string;
    rfc: string;
    detalle?: any; // puede traer topPagadores y liquidezNecesaria del back
    bindStepActions: (a: {
        next?: () => Promise<void> | void;
        prev?: () => Promise<void> | void;
        nextDisabled?: boolean;
        prevDisabled?: boolean;
    }) => void;
    onAdvance: () => Promise<void> | void;
};

export default function StepSeleccionClientes({
    id,
    rfc,
    detalle,
    bindStepActions,
    onAdvance,
}: Props) {
    // Sugerencias (si las tienes en el detalle; ajusta el path según tu back)
    const sugeridos: Pagador[] =
        detalle?.pagadores?.map((p: any) => ({ nombre: p.nombre, rfc: p.rfc })) ??
        detalle?.topPagadores?.map((p: any) => ({ nombre: p.nombre, rfc: p.rfc })) ??
        [];

    type Pagador = { nombre: string; rfc: string };
    type PagadorUI = Pagador & { _id: string };

    const mkId = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));


    // Inicialización (si el back trae ya una selección previa)
    const [seleccionados, setSeleccionados] = React.useState<PagadorUI[]>(
        (detalle?.vinculacion?.pagadores ?? []).map((p: any) => ({
            nombre: p.nombre,
            rfc: p.rfc,
            _id: mkId(),
        }))
    );

    const [query, setQuery] = React.useState("");
    const [liq, setLiq] = React.useState<string>(
        // si te llega number del back: lo formateas a string con comas
        numberToMasked(detalle?.vinculacion?.liquidezNecesaria) ?? ""
    );
    const [saving, setSaving] = React.useState(false);

    // Sugerencias que aún no están seleccionadas
    const disponibles = React.useMemo(
        () =>
            sugeridos.filter(
                (s) => !seleccionados.some((x) => equalRFC(x.rfc, s.rfc))
            ),
        [sugeridos, seleccionados]
    );

    const esValido = React.useMemo(() => {
        if (seleccionados.length === 0) return false;
        const allOk = seleccionados.every((p) => !!p.nombre?.trim() && !!p.rfc?.trim());
        const liquidezOk = maskedToNumber(liq) >= 0; // opcional que sea > 0
        return allOk && liquidezOk;
    }, [seleccionados, liq]);

    // Handlers básicos
    const addFromSugerido = (p?: Pagador | null) => {
        if (!p) return;
        if (seleccionados.some((x) => equalRFC(x.rfc, p.rfc))) return;
        setSeleccionados((prev) => [...prev, { ...p, _id: mkId() }]);
        setQuery("");
    };

    const removePagador = (idItem: string) => {
        setSeleccionados((prev) => prev.filter((it) => it._id !== idItem));
    };

    const addManual = () => {
        setSeleccionados((prev) => [...prev, { _id: mkId(), nombre: "", rfc: "" }]);
    };

    const updateManual = (idItem: string, field: keyof Pagador, value: string) => {
        setSeleccionados((prev) =>
            prev.map((it) => (it._id === idItem ? { ...it, [field]: value } : it))
        );
    };

    // NEXT action (StepActions)
    const doNext = React.useCallback(async () => {
        if (!esValido) {
            addToast({
                title: "Faltan datos",
                description: "Agrega al menos un cliente y completa nombre + RFC.",
                color: "warning",
            });
            return;
        }
        try {
            setSaving(true);
            const payload = {
                pagadores: seleccionados,
                liquidezNecesaria: maskedToNumber(liq),
            };
            const res = await VinculacionService.avanzarSeleccionClientes({
                id,
                rfc,
                pagadores: payload.pagadores,
                liquidezNecesaria: payload.liquidezNecesaria,
            });

            const ok = res?.responseData?.Succeeded === true;
            if (!ok) {
                const rc = res?.responseData?.ReasonCode?.Value;
                const rd = res?.responseData?.ReasonCode?.Description || "No fue posible avanzar.";
                addToast({ title: `Error ${rc ?? ""}`, description: rd, color: "danger" });
                return;
            }

            addToast({ title: "Guardado", description: "Continuando…", color: "success" });
            await onAdvance(); // el contenedor hará getDetalle y cambiará el step
        } catch (e) {
            console.error(e);
            addToast({ title: "Error de red", description: "Intenta nuevamente.", color: "danger" });
        } finally {
            setSaving(false);
        }
    }, [esValido, id, rfc, seleccionados, liq, onAdvance]);

    // Vincula CTA persistente
    React.useEffect(() => {
        bindStepActions({
            next: doNext,
            nextDisabled: !esValido || saving,
            // prev: si aplica retroceso en tu flujo, lo agregas aquí
        });
    }, [bindStepActions, doNext, esValido, saving]);

    return (
        <Card shadow="none">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:list-checks" className="text-2xl" />
                    <div className="text-lg font-semibold">Selecciona tus clientes</div>
                </div>
                <Chip variant="flat" color="primary">{seleccionados.length} seleccionados</Chip>
            </CardHeader>

            <div className="w-full h-px bg-divider" />

            <CardBody className="flex flex-col gap-6">
                <p className="text-small text-default-600">
                    Elige tus principales clientes para el estudio de cupo. Puedes buscarlos de sugerencias o agregarlos manualmente.
                </p>

                {/* Buscador de sugerencias */}
                <div className="grid grid-cols-1 gap-3">
                    <Autocomplete
                        label="Buscar cliente sugerido"
                        variant="bordered"
                        allowsEmptyCollection
                        inputValue={query}
                        onInputChange={setQuery}
                        onSelectionChange={(key) => {
                            const found = disponibles.find((d) => (d.rfc === key));
                            if (found) addFromSugerido(found);
                        }}
                        defaultItems={disponibles}
                        placeholder="Ej: ACME S.A. de C.V."
                        startContent={<Icon icon="lucide:search" />}
                        selectedKey={undefined}
                    >
                        {(item: Pagador) => (
                            <AutocompleteItem key={item.rfc}>
                                {item.nombre} — {item.rfc}
                            </AutocompleteItem>
                        )}
                    </Autocomplete>

                    <div className="flex items-center gap-2">
                        <Button variant="flat" onPress={addManual} startContent={<Icon icon="lucide:plus" />}>
                            Agregar cliente manual
                        </Button>
                    </div>
                </div>

                {/* Lista de seleccionados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {seleccionados.map((p) => (
                        <Card key={p._id} shadow="sm">
                            <CardBody className="flex flex-col gap-3">
                                <Input
                                    variant="bordered"
                                    label="Nombre del cliente"
                                    value={p.nombre}
                                    onValueChange={(v) => updateManual(p._id, "nombre", v)}
                                    isRequired
                                />
                                <Input
                                    variant="bordered"
                                    label="RFC"
                                    value={p.rfc}
                                    onValueChange={(v) => updateManual(p._id, "rfc", v.toUpperCase())}
                                    isRequired
                                />
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        onPress={() => removePagador(p._id)}
                                        startContent={<Icon icon="lucide:trash-2" />}
                                    >
                                        Quitar
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Liquidez necesaria */}
                <div className="grid grid-cols-1 gap-3">
                    <div className="text-medium font-medium">¿Cuánta liquidez necesitas?</div>
                    <Input
                        endContent={
                            <div className="flex items-center">
                                MXN
                            </div>
                        }
                        variant="bordered"
                        label="Liquidez (MXN)"
                        labelPlacement="outside"
                        placeholder="0.00"
                        startContent={
                            <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 text-small">$</span>
                            </div>
                        }
                        value={liq}
                        onValueChange={(v) => setLiq(maskCurrency(v))}
                    />
                </div>
            </CardBody>
        </Card>
    );
}

/* Helpers */
function equalRFC(a?: string, b?: string) {
    return (a ?? "").trim().toUpperCase() === (b ?? "").trim().toUpperCase();
}
function maskedToNumber(s: string) {
    if (!s) return 0;
    const n = Number(s.replace(/[^0-9]/g, ""));
    return Number.isFinite(n) ? n : 0;
}
function numberToMasked(n?: number) {
    if (typeof n !== "number") return "";
    return n.toLocaleString("es-MX");
}
function maskCurrency(s: string) {
    const n = maskedToNumber(s);
    return n === 0 ? "" : n.toLocaleString("es-MX");
}
