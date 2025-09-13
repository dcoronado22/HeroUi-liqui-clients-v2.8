import { Autocomplete, AutocompleteItem, Button, Card, CardBody, CardHeader, Chip, Divider, ScrollShadow } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, useMemo, useEffect } from "react"; // agregado useMemo

import PagadorCard, { PagadorData } from "../components/PagadorCard";
import PagadorFacturasModal from "../components/PagadorFacturasModal";

const topPagadores: PagadorData[] = [
    {
        valorPosibleNegociacion: 27754237.49,
        valorPosibleNegociacionRecibido: 25333836.70,
        valorPendienteNegociacion: 620348563.98,
        lineaCredito: 54215645.61,
        nombre: "PISA AGROPECUARIA",
        rfc: "PAG920715NSA",
        informacionNegociacion: {
            mondeda: "MXN",
            montoActivo: 674564209.59,
            montoCobrado: 620348563.98,
            balance: 674564209.59,
            aforo: 0.95,
            promedioDiasPago: 46.93,
            plazo: 0
        },
        facturas: [
            { "uuid": "edb26d26-3de6-4626-9ae5-38630db6bbb9", "issuedAt": "2025-08-30T00:29:14", "valorFactura": 4072530.19, "recibido": 3717371.62 },
            { "uuid": "ab550df0-410c-4f5b-97cc-6d8325b3ccd1", "issuedAt": "2025-08-30T00:25:48", "valorFactura": 3366496.67, "recibido": 3072910.11 },
            { "uuid": "7a558e0b-28b4-47d0-9f12-72144fd4a660", "issuedAt": "2025-08-30T00:47:56", "valorFactura": 2544444.78, "recibido": 2322547.99 },
            { "uuid": "b6a8c4a0-c0e7-4ced-a5b9-cd248010fdae", "issuedAt": "2025-08-30T00:51:35", "valorFactura": 2068726.61, "recibido": 1888316.41 },
            { "uuid": "91d07a6e-ef96-4345-8d78-976e71a1ab60", "issuedAt": "2025-08-27T00:11:19", "valorFactura": 1796071.81, "recibido": 1639439.38 },
            { "uuid": "a9fceb09-a361-40f2-8b3a-327109b58d92", "issuedAt": "2025-08-29T23:43:07", "valorFactura": 1726877.22, "recibido": 1576279.14 },
            { "uuid": "1021d430-6d1e-4925-83e2-ff9b595ccb0d", "issuedAt": "2025-08-29T23:48:22", "valorFactura": 1671038, "recibido": 1525309.56 },
            { "uuid": "cb6b0412-4e3d-46df-97a8-b91f87f56100", "issuedAt": "2025-08-27T00:08:53", "valorFactura": 1594753.01, "recibido": 1455677.26 },
            { "uuid": "0abc391c-6938-4236-bcda-09663147647e", "issuedAt": "2025-08-30T00:39:14", "valorFactura": 1556040.18, "recibido": 1420340.51 },
            { "uuid": "b1d706ac-f020-4b95-9d1f-bf67d622ec48", "issuedAt": "2025-08-27T00:03:41", "valorFactura": 1329966.42, "recibido": 1213982.27 },
            { "uuid": "65ac502d-80c5-4fd8-9e72-8187e680332d", "issuedAt": "2025-08-30T00:33:09", "valorFactura": 1272778.68, "recibido": 1161781.77 },
            { "uuid": "2bd3a768-c91f-4713-b4a7-69306663a06b", "issuedAt": "2025-08-27T00:02:14", "valorFactura": 1250208.1, "recibido": 1141179.54 },
            { "uuid": "96685695-d564-46cc-b9af-b0deb3f95ab7", "issuedAt": "2025-08-14T17:13:18", "valorFactura": 1202827.77, "recibido": 1097931.16 },
            { "uuid": "4657e5ee-132d-42ff-9481-7f7d5c1ca341", "issuedAt": "2025-08-14T17:21:43", "valorFactura": 1027965.9, "recibido": 938318.71 },
            { "uuid": "7336d8ca-6105-41fa-b303-39f2b0f37ebc", "issuedAt": "2025-09-04T18:04:42", "valorFactura": 448589.26, "recibido": 409468.54 },
            { "uuid": "a5f832b8-8148-4be7-92fc-0e36e0d9791b", "issuedAt": "2025-09-04T19:05:46", "valorFactura": 443776.53, "recibido": 405075.52 },
            { "uuid": "fa4285f7-32da-4461-9520-b95c030bbc4f", "issuedAt": "2025-09-05T18:45:13", "valorFactura": 167954.08, "recibido": 153307.08 },
            { "uuid": "8eac32bf-b3ae-4ccc-87fe-412b8a4258cb", "issuedAt": "2025-09-05T18:33:59", "valorFactura": 106600.17, "recibido": 97303.75 },
            { "uuid": "a9cef8db-1eb7-4142-92ff-6ad3bf709262", "issuedAt": "2025-09-08T18:38:24", "valorFactura": 32256.47, "recibido": 29443.44 },
            { "uuid": "e0007546-826f-48a3-8cad-80661a120dcb", "issuedAt": "2025-08-14T22:15:33", "valorFactura": 31835.04, "recibido": 29058.76 },
            { "uuid": "1c905135-43c6-41d8-939e-8a5286dbeaa0", "issuedAt": "2025-08-14T22:11:42", "valorFactura": 25546.78, "recibido": 23318.89 },
            { "uuid": "23f5a539-b23d-458e-abbe-403b4d821c15", "issuedAt": "2025-09-08T18:20:37", "valorFactura": 16953.82, "recibido": 15475.31 }
        ],
        porcentaje: 2.5
    },
    {
        valorPosibleNegociacion: 69681.55,
        valorPosibleNegociacionRecibido: 55826.54,
        valorPendienteNegociacion: 52104517.34,
        lineaCredito: 12739947.85,
        nombre: "PROMOTORA DE PRODUCTOS METALICOS AZTLAN",
        rfc: "PPM1008095K5",
        informacionNegociacion: {
            mondeda: "MXN",
            montoActivo: 64844465.19,
            montoCobrado: 52104517.34,
            balance: 64844465.19,
            aforo: 0.95,
            promedioDiasPago: 188.06,
            plazo: 0
        },
        facturas: [
            { "uuid": "20108b2c-7541-4a62-b356-b10c8a293a83", "issuedAt": "2025-08-26T19:16:13", "valorFactura": 66560.8, "recibido": 53326.29 },
            { "uuid": "2308f3af-9662-4389-9a70-42aaf97b2f34", "issuedAt": "2025-09-03T22:17:46", "valorFactura": 3120.75, "recibido": 2500.24 }
        ],
        porcentaje: 2.5
    },
    {
        valorPosibleNegociacion: 5263500,
        valorPosibleNegociacionRecibido: 4554462.69,
        valorPendienteNegociacion: 40830500.00,
        lineaCredito: 5263500.00,
        nombre: "DSM NUTRITIONAL PRODUCTS MEXICO",
        rfc: "DNP010613GN4",
        informacionNegociacion: {
            mondeda: "MXN",
            montoActivo: 46094000.00,
            montoCobrado: 40830500.00,
            balance: 46094000.00,
            aforo: 0.95,
            promedioDiasPago: 107.11,
            plazo: 0
        },
        facturas: [
            { "uuid": "2233dffe-0dba-4594-9c4d-bbdc1623822c", "issuedAt": "2025-09-05T15:21:59", "valorFactura": 1754500, "recibido": 1518154.23 },
            { "uuid": "640e6b5d-2478-4186-8ad6-25c242e5f518", "issuedAt": "2025-08-28T22:45:06", "valorFactura": 1355750, "recibido": 1173119.18 },
            { "uuid": "a50dc950-486a-4177-be1c-124a04b6d920", "issuedAt": "2025-09-05T18:08:29", "valorFactura": 1355750, "recibido": 1173119.18 },
            { "uuid": "6e9d8e1d-04ea-44d5-aba8-e37a1676ac0d", "issuedAt": "2025-08-25T18:07:00", "valorFactura": 398750, "recibido": 345035.05 },
            { "uuid": "894fae2e-aa4c-4f17-9845-08053651751a", "issuedAt": "2025-09-05T18:09:22", "valorFactura": 398750, "recibido": 345035.05 }
        ],
        porcentaje: 2.5
    },
    {
        valorPosibleNegociacion: 373578,
        valorPosibleNegociacionRecibido: 348984.12,
        valorPendienteNegociacion: 20901562.41,
        lineaCredito: 451787.59,
        nombre: "LE TORREON BCS",
        rfc: "LTB041123G26",
        informacionNegociacion: {
            mondeda: "MXN",
            montoActivo: 21353350.00,
            montoCobrado: 20901562.41,
            balance: 21353350.00,
            aforo: 0.95,
            promedioDiasPago: 19.89,
            plazo: 0
        },
        facturas: [
            { "uuid": "2214a1d0-8416-48da-9dfd-16220e8137b9", "issuedAt": "2025-09-10T23:02:09", "valorFactura": 373578, "recibido": 348984.12 }
        ],
        porcentaje: 2.5
    }
];

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

export default function StepCreacions({ bindStepActions }: StepCreacionProps) {
    const [selectedPagadores, setSelectedPagadores] = useState<PagadorData[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [pagadorEnModal, setPagadorEnModal] = useState<PagadorData | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);

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
            nextDisabled: selectedPagadores.length === 0 // Next deshabilitado si no hay pagador
            // next: () => { /* aquí iría la lógica para avanzar cuando exista al menos un pagador */ }
        });
    }, [selectedPagadores, bindStepActions]);

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
                                placeholder="RFC, razón social..."
                                isDisabled={availablePagadores.length === 0}
                                endContent={
                                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-default-200 dark:border-default-100 select-none">
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            className="h-5 px-2 text-[12px] font-medium !opacity-100 !bg-primary-100 !text-primary-700 !border-primary-200"
                                        >
                                            Total seleccionado: {fmtCurrencyShort(totalSeleccionado)}
                                        </Chip>
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color="success"
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