import { Autocomplete, AutocompleteItem, Button, Card, CardBody, CardHeader, Chip, Divider, ScrollShadow, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, useMemo, useEffect } from "react";
import { OperacionService } from "../services/operacion.service"; // NUEVO
import { addToast } from "@heroui/toast"; // NUEVO
import { useRouter } from "next/navigation"; // NUEVO

import PagadorCard, { PagadorData } from "../components/PagadorCard";
import PagadorFacturasModal from "../components/PagadorFacturasModal";

const fmtCurrency = (v: number) =>
    v.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

// NUEVO: formato compacto para mostrar dentro del input
const fmtCurrencyShort = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
};

type StepCreacionProps = {
    bindStepActions?: (a: {
        next?: () => Promise<void> | void;
        prev?: () => Promise<void> | void;
        nextDisabled?: boolean;
        prevDisabled?: boolean;
    }) => void;
    id?: string;
    rfc?: string;
    idLote?: string;
    onAdvance?: () => Promise<void> | void;
};

export default function StepCreacions({ bindStepActions, id, rfc, onAdvance }: StepCreacionProps) {
    const [selectedPagadores, setSelectedPagadores] = useState<PagadorData[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [pagadorEnModal, setPagadorEnModal] = useState<PagadorData | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);

    // NUEVO: estados para Top10Empresas
    const [topPagadores, setTopPagadores] = useState<any[]>([]);
    const [loadingTop, setLoadingTop] = useState(false);
    const [errorTop, setErrorTop] = useState<string | null>(null);
    // NUEVO: estado envío operación
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    const router = useRouter(); // NUEVO

    // NUEVO: fetch Top10Empresas
    useEffect(() => {
        if (!id || !rfc) return;
        let cancelled = false;
        (async () => {
            try {
                setLoadingTop(true);
                setErrorTop(null);
                const res = await OperacionService.top10Empresas({ id, rfc });
                if (!cancelled) {
                    setTopPagadores(res.topPagadores || []);
                }
            } catch (e: any) {
                if (!cancelled) setErrorTop("No se pudo cargar Top10 de empresas");
            } finally {
                if (!cancelled) setLoadingTop(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id, rfc]);

    const availablePagadores = topPagadores.filter(p => !selectedPagadores.some(s => s.rfc === p.rfc));

    // NUEVO: lista filtrada según lo que escribe el usuario
    const filteredPagadores = useMemo(() => {
        const q = inputValue.trim().toLowerCase();
        if (!q) return availablePagadores;
        return availablePagadores.filter(p =>
            p.rfc.toLowerCase().includes(q) ||
            p.nombre.toLowerCase().includes(q)
        );
    }, [availablePagadores, inputValue]);

    // NUEVO: sincroniza estado de botones del stepper
    useEffect(() => {
        bindStepActions?.({
            prevDisabled: true, // Paso 1: siempre deshabilitado "anterior"
            nextDisabled: selectedPagadores.length === 0 || loadingSubmit, // Next deshabilitado si no hay pagador
            next: handleCrearOperacion, // NUEVO
        });
    }, [selectedPagadores, bindStepActions, loadingSubmit]);

    // NUEVO: totales de facturas seleccionadas
    const { totalSeleccionado, totalRecibido } = useMemo(() => {
        let totalSeleccionado = 0;
        let totalRecibido = 0;
        selectedPagadores.forEach(p => {
            const facturas = (p as any).selectedFacturas ?? p.facturas ?? [];
            facturas.forEach((f: any) => {
                totalSeleccionado += f.valorFactura || 0;
                totalRecibido += f.recibido || 0;
            });
        });
        return { totalSeleccionado, totalRecibido };
    }, [selectedPagadores]);

    // NUEVO: función para crear operación (state 1)
    const handleCrearOperacion = async () => {
        if (!rfc || !id || selectedPagadores.length === 0 || loadingSubmit) return;
        try {
            setLoadingSubmit(true);

            // Mapeo de facturas limpiando campos UI innecesarios
            const clientesSeleccionados = selectedPagadores.map((p: any) => ({
                valorPosibleNegociacion: p.valorPosibleNegociacion,
                valorPosibleNegociacionRecibido: p.valorPosibleNegociacionRecibido,
                valorPendienteNegociacion: p.valorPendienteNegociacion,
                lineaCredito: p.lineaCredito,
                nombre: p.nombre,
                rfc: p.rfc,
                informacionNegociacion: p.informacionNegociacion,
                porcentaje: p.porcentaje,
                facturas: (p.selectedFacturas || []).map((f: any) => ({
                    uuid: f.uuid,
                    issuedAt: f.issuedAt,
                    valorFactura: f.valorFactura,
                    recibido: f.recibido,
                })),
            }));

            const body = {
                state: 1 as const,
                requestData: {
                    clientesSeleccionados,
                    nombre: selectedPagadores[0]?.nombre || "", // TODO: reemplazar por nombre del cliente originador si se dispone
                    rfc,
                    idLote: null,
                },
            };

            const res = await OperacionService.crearOperacionClientesSeleccionados(body);
            const ok = res?.responseData?.Succeeded;
            const idLote = res?.responseData?.IdLote;

            if (ok && idLote) {
                addToast({
                    title: "Operación creada",
                    description: `Lote: ${idLote}`,
                    color: "success",
                });
                // Redirigir a la página del lote
                router.replace(`/operacion/${encodeURIComponent(rfc)}/${encodeURIComponent(id)}/lote/${encodeURIComponent(idLote)}`);
                return;
            }

            if (ok && !idLote) {
                // Caso raro: éxito sin IdLote -> fallback
                await onAdvance?.();
                return;
            }

            const rc = res?.responseData?.ReasonCode?.Value;
            const rd = res?.responseData?.ReasonCode?.Description;
            addToast({
                title: "No se pudo crear",
                description: rd ? `${rc} - ${rd}` : "Error al crear la operación",
                color: "danger",
            });
        } catch (e) {
            addToast({ title: "Error", description: "Fallo en la creación de la operación", color: "danger" });
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleSelect = (key: React.Key | null) => {
        if (!key) return;
        const found = topPagadores.find(p => p.rfc === key);
        if (found) {
            setPagadorEnModal(found);
            setEditIndex(null);
            setModalOpen(true);
        }
        setSelectedKey(null);
        setInputValue("");
    };

    const handleRemove = (rfc: string) => {
        setSelectedPagadores(prev => prev.filter(p => p.rfc !== rfc));
    };

    const handleEdit = (rfc: string) => {
        const idx = selectedPagadores.findIndex(p => p.rfc === rfc);
        if (idx >= 0) {
            const pag = selectedPagadores[idx];
            setPagadorEnModal(pag);
            setEditIndex(idx);
            setModalOpen(true);
        }
    };

    const handleConfirmModal = (pagadorSeleccionado: PagadorData & { selectedFacturas: any[] }) => {
        if (editIndex !== null) {
            setSelectedPagadores(prev => prev.map((p, i) => i === editIndex ? { ...pagadorSeleccionado } : p));
        } else {
            setSelectedPagadores(prev => [...prev, pagadorSeleccionado]);
        }
    };

    // Nueva función para asegurar limpieza del Autocomplete al cerrar modal
    const closeModal = () => {
        setModalOpen(false);
        setPagadorEnModal(null);
        setEditIndex(null);
        setSelectedKey(null);
        setInputValue(""); // asegura limpiar el texto visible
    };

    return (
        <>
            <Card shadow="none">
                <CardHeader className="flex items-center justify-between pr-5 pl-5">
                    <div className="w-full flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold flex items-center gap-2">Busca a tu cliente y selecciona las facturas que deseas adelantar <Icon icon="tabler:list-search" fontSize={"23"} className="text-primary flex-shrink-0 ml-1" /></h2>
                            <p className="text-small text-default-600">
                                Puedes seleccionar los clientes que desees utilizando el buscador o cargar los XMLs manualmente con el botón a continuación:
                            </p>
                        </div>
                        <Chip color="primary" variant="bordered" size="lg">
                            Tasa: 2.5 %
                        </Chip>
                    </div>
                </CardHeader>
                <CardBody className="flex flex-col gap-4">
                    <div className="flex gap-2 items-start px-1">
                        <div className="flex-1">
                            <Autocomplete
                                className="w-full"
                                items={filteredPagadores}
                                label="Selecciona un pagador"
                                variant="faded"
                                selectedKey={selectedKey ?? undefined}
                                inputValue={inputValue}
                                onInputChange={setInputValue}
                                onSelectionChange={(k) => handleSelect(k as string)}
                                allowsCustomValue={false}
                                placeholder={loadingTop ? "Cargando pagadores..." : "RFC, razón social..."}
                                isLoading={loadingTop}
                                isDisabled={loadingTop && availablePagadores.length === 0}
                                endContent={
                                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-default-200 dark:border-default-100 select-none">
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            hidden={loadingTop}
                                            color="primary"
                                            className="h-5 px-2 text-[12px] font-medium !opacity-100 !bg-primary-100 !text-primary-700 !border-primary-200"
                                        >
                                            Total seleccionado: {fmtCurrencyShort(totalSeleccionado)}
                                        </Chip>
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color="success"
                                            hidden={loadingTop}
                                            className="h-5 px-2 text-[12px] font-medium !opacity-100 !bg-success-100 !text-success-700 !border-success-200"
                                        >
                                            Total Recibido: {fmtCurrencyShort(totalRecibido)}
                                        </Chip>
                                    </div>
                                }
                            >
                                {(item) => (
                                    <AutocompleteItem key={item.rfc} textValue={`${item.rfc} - ${item.nombre}`}>
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{item.rfc} - {item.nombre}</span>
                                            </div>
                                            <Chip className="text-md text-default-700" color="success" variant="faded">Cupo: {fmtCurrency(item.lineaCredito)} MXN</Chip>
                                        </div>
                                    </AutocompleteItem>
                                )}
                            </Autocomplete>
                        </div>
                        <Button
                            color="primary"
                            size="lg"
                            className="py-7"
                            startContent={<Icon icon="line-md:cloud-alt-upload-filled" fontSize={"25"} />}
                        >
                            Subir XML's
                        </Button>
                    </div>

                    <ScrollShadow className="w-full pr-1 max-h-[55vh]" size={1}>
                        <div className="grid grid-cols-2 gap-3 pb-10 pt-2 px-1">
                            {selectedPagadores.length === 0 && (
                                <div className="text-xs text-default-400 italic px-1 col-span-2">
                                    Ningún pagador seleccionado todavía.
                                </div>
                            )}
                            {selectedPagadores.map(item => (
                                <PagadorCard
                                    key={item.rfc}
                                    data={item}
                                    onRemove={() => handleRemove(item.rfc)}
                                    onEdit={() => handleEdit(item.rfc)}
                                />
                            ))}
                        </div>
                    </ScrollShadow>
                </CardBody>
            </Card>
            <PagadorFacturasModal
                open={modalOpen}
                pagador={pagadorEnModal}
                onClose={closeModal}
                onConfirm={(p) => {
                    handleConfirmModal(p);
                    // El modal internamente llamará onClose, pero si cambiara en el futuro
                    // nos aseguramos de limpiar también aquí.
                    setInputValue("");
                    setSelectedKey(null);
                }}
                initialSelectedIds={pagadorEnModal?.selectedFacturas?.map(f => f.uuid) || []}
            />
        </>
    );
}