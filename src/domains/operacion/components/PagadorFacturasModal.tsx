import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Progress, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip,
    Divider
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { PagadorData, Factura } from "./PagadorCard";

interface Props {
    open: boolean;
    pagador: PagadorData | null;
    onClose: () => void;
    onConfirm: (pagador: PagadorData & { selectedFacturas: Factura[] }) => void;
    initialSelectedIds?: string[];
}

const fmtCurrency = (v: number) =>
    v.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

export default function PagadorFacturasModal({
    open,
    pagador,
    onClose,
    onConfirm,
    initialSelectedIds = []
}: Props) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));

    useEffect(() => {
        // Al abrir (o cambiar pagador) sincronizar selección inicial
        setSelectedIds(new Set(initialSelectedIds));
    }, [pagador, initialSelectedIds, open]);

    if (!pagador) return null;

    const facturas = pagador.facturas;

    const allSelected = selectedIds.size === facturas.length && facturas.length > 0;
    const toggleAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(facturas.map(f => f.uuid)));
    };

    const selectedFacturas = facturas.filter(f => selectedIds.has(f.uuid));

    const valorSeleccionado = selectedFacturas.reduce((acc, f) => acc + f.valorFactura, 0);
    const totalRecibes = selectedFacturas.reduce((acc, f) => acc + f.recibido, 0);
    const linea = pagador.lineaCredito;
    const progreso = Math.min(100, (valorSeleccionado / linea) * 100 || 0);
    const cupoDisponible = Math.max(0, linea - valorSeleccionado);

    return (
        <Modal isOpen={open} onOpenChange={(o) => !o && onClose()} size="5xl" scrollBehavior="inside" backdrop="blur">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Selecciona tus facturas
                    <span className="text-small font-normal text-default-500">
                        {pagador.rfc} - {pagador.nombre}
                    </span>
                </ModalHeader>
                <ModalBody className="flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-sm">
                            Todas las facturas del cliente <strong>{pagador.nombre}</strong> suman un total de <strong>{fmtCurrency(
                                facturas.reduce((a, f) => a + f.valorFactura, 0)
                            )}</strong>.
                        </span>
                        <Button size="sm" variant="flat" onPress={toggleAll}>
                            {allSelected ? "Quitar todas" : "Seleccionar todas"}
                        </Button>
                    </div>

                    <div className="flex items-end gap-4 flex-wrap">
                        <div className="flex-1 min-w-[240px]">
                            <Progress
                                label={`Cupo seleccionado: ${fmtCurrency(valorSeleccionado)}`}
                                value={progreso}
                                classNames={{ label: "text-xs" }}
                            />
                        </div>
                        <Chip size="sm" variant="flat" color={cupoDisponible >= 0 ? "success" : "danger"}>
                            Cupo disponible: {fmtCurrency(cupoDisponible)}
                        </Chip>
                        <Chip size="sm" variant="flat" color="primary">
                            Facturas seleccionadas: {selectedFacturas.length}
                        </Chip>
                    </div>

                    {/* Tabla (reemplazar con DynamicTable si existe en el proyecto) */}
                    <Table
                        isStriped
                        aria-label="Listado de facturas del pagador"
                        removeWrapper
                        isHeaderSticky
                        className="max-h-[320px] overflow-auto"
                        selectionMode="multiple"
                        selectedKeys={selectedIds}
                        onSelectionChange={(keys) => {
                            if (keys === "all") {
                                setSelectedIds(new Set(facturas.map(f => f.uuid)));
                            } else {
                                setSelectedIds(new Set(Array.from(keys as Set<string>)));
                            }
                        }}
                    >
                        <TableHeader>
                            <TableColumn>UUID</TableColumn>
                            <TableColumn align="start">Emitida</TableColumn>
                            <TableColumn align="start">Valor</TableColumn>
                            <TableColumn align="start">Recibes</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="Sin facturas">
                            {facturas.map(f => {
                                const checked = selectedIds.has(f.uuid);
                                return (
                                    <TableRow key={f.uuid} className={checked ? "bg-primary/5" : ""}>
                                        <TableCell className="text-sm">{f.uuid}</TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(f.issuedAt).toLocaleDateString("es-MX")}
                                        </TableCell>
                                        <TableCell className="text-sm text-left">
                                            {fmtCurrency(f.valorFactura)}
                                        </TableCell>
                                        <TableCell className="text-sm text-left text-success-600">
                                            {fmtCurrency(f.recibido)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </ModalBody>
                <ModalFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-small text-default-500">
                        <span>Valor seleccionado: <strong>{fmtCurrency(valorSeleccionado)}</strong></span>
                        <span>|</span>
                        <span>Total recibes: <strong>{fmtCurrency(totalRecibes)}</strong></span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="flat" color="danger" onPress={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            color="primary"
                            isDisabled={selectedFacturas.length === 0}
                            onPress={() => {
                                onConfirm({ ...pagador, selectedFacturas });
                                onClose();
                            }}
                        >
                            Confirmar
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}