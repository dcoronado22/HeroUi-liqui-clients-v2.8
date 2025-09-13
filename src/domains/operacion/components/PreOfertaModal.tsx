"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardHeader,
    CardBody,
    Chip,
    Divider,
    Accordion,
    AccordionItem,
    ScrollShadow,
    Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import {
    GenereOfertaRes,
    FacturaGenereOferta,
} from "@/src/domains/operacion/services/operacion.service";

type PreOfertaModalProps = {
    open: boolean;
    onClose: () => void;
    data: GenereOfertaRes | null;
    onContinuar?: () => void;
};

const fmtCurrency = (v: number) =>
    v.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
    });

export function PreOfertaModal({
    open,
    onClose,
    data,
    onContinuar,
}: PreOfertaModalProps) {
    const pagadores = data?.pagadoresSeleccionados || [];
    const liquidezObtenida = data?.liquidezObtenida || 0;
    const liquidezNecesaria = data?.liquidezNecesaria || 0;
    const cobertura = liquidezNecesaria
        ? (liquidezObtenida / liquidezNecesaria) * 100
        : 0;
    const gap = Math.max(0, liquidezNecesaria - liquidezObtenida);
    const totalFacturas = pagadores.reduce((a, p) => a + p.facturas.length, 0);
    const totalRecibido = pagadores?.reduce((acc, p) =>
        acc + p.facturas.reduce((facAcc, f) => facAcc + (f.recibido || 0), 0), 0) || 0;

    return (
        <Modal
            isOpen={open}
            onOpenChange={(o) => !o && onClose()}
            size="5xl"
            scrollBehavior="inside"
            backdrop="blur"
            className="max-h-[90vh] min-w-[90dvw] text-sm"
        >
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <Icon
                        icon="solar:hand-money-outline"
                        className="text-primary"
                        fontSize={26}
                    />
                    Pre-Oferta Generada
                </ModalHeader>
                <ModalBody className="pt-0">
                    {!data && (
                        <div className="py-10 text-center text-sm text-default-400">
                            Generando información de la pre-oferta...
                        </div>
                    )}

                    {data && (
                        <div className="grid grid-cols-12 gap-4">
                            {/* Columna Izquierda */}
                            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                                <Card shadow="sm" className="border border-default-200">
                                    <CardHeader className="pb-1 text-sm font-semibold flex items-center gap-2">
                                        <Icon icon="mdi:cash-fast" className="text-primary" fontSize={20} />
                                        Resumen de Liquidez
                                    </CardHeader>
                                    <CardBody className="pt-2 text-sm flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <span>Liquidez necesaria:</span>
                                            <span className="font-medium">
                                                {fmtCurrency(liquidezNecesaria)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Liquidez obtenida:</span>
                                            <span className="font-medium text-primary">
                                                {fmtCurrency(liquidezObtenida)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total recibido:</span>
                                            <span className="font-medium text-success">
                                                {fmtCurrency(totalRecibido)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Cobertura:</span>
                                            <span className="font-medium">
                                                {cobertura.toFixed(2)}%
                                            </span>
                                        </div>
                                        {!data?.cumpleLiquidezNecesaria && (
                                            <div className="flex justify-between">
                                                <span>Faltante:</span>
                                                <span className="font-medium text-warning">
                                                    {fmtCurrency(gap)}
                                                </span>
                                            </div>
                                        )}
                                        <Divider className="my-1" />
                                        <div className="flex justify-between">
                                            <span># Pagadores:</span>
                                            <span className="font-medium">{pagadores.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span># Facturas:</span>
                                            <span className="font-medium">{totalFacturas}</span>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card shadow="sm" className="border border-default-200">
                                    <CardHeader className="pb-1 text-sm font-semibold flex items-center gap-2">
                                        <Icon icon="mdi:chart-line" className="text-primary" fontSize={20} />
                                        Estadísticas rápidas
                                    </CardHeader>
                                    <CardBody className="pt-2 text-sm flex flex-col gap-2">
                                        <ScrollShadow className="max-h-[200px]">
                                            {pagadores.slice(0, 6).map((p) => {
                                                const ratio = p.informacionNegociacion.aforo * 100;
                                                return (
                                                    <div
                                                        key={p.rfc}
                                                        className="flex flex-col pb-1"
                                                    >
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="truncate max-w-[60%]"
                                                                title={p.nombre}
                                                            >
                                                                {p.nombre}
                                                            </span>
                                                            <span className="font-medium">
                                                                {ratio.toFixed(2)}% aforo
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-[11px] text-default-500">
                                                            <span>{p.rfc}</span>
                                                            <span>
                                                                {fmtCurrency(p.valorPosibleNegociacion)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </ScrollShadow>
                                        {pagadores.length === 0 && (
                                            <div className="text-default-400 text-center text-sm py-1">
                                                Sin datos
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>

                                <Card shadow="sm" className="border border-default-200">
                                    <CardHeader className="pb-1 text-sm font-semibold flex items-center gap-2">
                                        <Icon
                                            icon="mdi:information-slab-circle-outline"
                                            className="text-primary"
                                            fontSize={20}
                                        />
                                        Notas
                                    </CardHeader>
                                    <CardBody className="pt-2 text-[12px] leading-relaxed text-default-500">
                                        Pre-oferta generada automáticamente con base en el aforo y
                                        montos disponibles. Puedes continuar para ajustar o
                                        descartar pagadores antes de confirmar.
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Columna Derecha */}
                            <div className="col-span-12 lg:col-span-8">
                                <Card shadow="sm" className="border border-default-200 h-full">
                                    <CardHeader className="pb-1 text-sm font-semibold flex items-center gap-2 flex-wrap">
                                        <Icon
                                            icon="mdi:account-multiple"
                                            className="text-primary"
                                            fontSize={20}
                                        />
                                        Pagadores y Facturas
                                        <Chip size="sm" variant="flat" color="primary">
                                            {pagadores.length}
                                        </Chip>
                                        <Chip size="sm" variant="flat" color="secondary">
                                            {totalFacturas} facturas
                                        </Chip>
                                    </CardHeader>
                                    <CardBody className="pt-2">
                                        <ScrollShadow className="max-h-[60dvh] min-h-[60dvh]">
                                            {pagadores.length === 0 && (
                                                <div className="text-center text-sm text-default-400 py-4">
                                                    No hay pagadores en la pre-oferta.
                                                </div>
                                            )}
                                            {pagadores.length > 0 && (
                                                <Accordion
                                                    selectionMode="multiple"
                                                    variant="light"
                                                >
                                                    {pagadores.map((p) => {
                                                        const aforoPct = (
                                                            p.informacionNegociacion.aforo * 100
                                                        ).toFixed(2);
                                                        return (
                                                            <AccordionItem
                                                                key={p.rfc}
                                                                aria-label={p.nombre}
                                                                title={
                                                                    <div className="flex flex-col w-full">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-medium text-sm truncate">
                                                                                {p.nombre}
                                                                            </span>
                                                                            <Chip
                                                                                size="sm"
                                                                                variant="flat"
                                                                                color="primary"
                                                                            >
                                                                                {p.rfc}
                                                                            </Chip>
                                                                            <Tooltip content="Porcentaje aforo">
                                                                                <Chip
                                                                                    size="sm"
                                                                                    variant="flat"
                                                                                    color="success"
                                                                                >
                                                                                    {aforoPct}%
                                                                                </Chip>
                                                                            </Tooltip>
                                                                            <Tooltip content="Promedio días de pago">
                                                                                <Chip
                                                                                    size="sm"
                                                                                    variant="flat"
                                                                                    color="default"
                                                                                >
                                                                                    {p.informacionNegociacion.promedioDiasPago}
                                                                                </Chip>
                                                                            </Tooltip>
                                                                            <Tooltip content="Facturas incluidas">
                                                                                <Chip
                                                                                    size="sm"
                                                                                    variant="flat"
                                                                                    color="secondary"
                                                                                >
                                                                                    {p.facturas.length} facturas
                                                                                </Chip>
                                                                            </Tooltip>
                                                                        </div>
                                                                        <div className="flex gap-4 text-[12px] text-default-500 mt-1 flex-wrap">
                                                                            <span>
                                                                                Valor posible:{" "}
                                                                                {fmtCurrency(p.valorPosibleNegociacion)}
                                                                            </span>
                                                                            <span>
                                                                                Recibido:{" "}
                                                                                {fmtCurrency(p.valorPosibleNegociacionRecibido || p.facturas?.reduce((acc, f) => acc + (f.recibido || 0), 0))}
                                                                            </span>
                                                                            <span>
                                                                                Pendiente:{" "}
                                                                                {fmtCurrency(p.valorPendienteNegociacion)}
                                                                            </span>
                                                                            <span>
                                                                                Línea: {fmtCurrency(p.lineaCredito)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                }
                                                            >
                                                                <ScrollShadow className="max-h-[260px] pr-2">
                                                                    <table className="w-full text-sm border-collapse">
                                                                        <thead>
                                                                            <tr className="text-[12px] text-default-600 bg-default-50">
                                                                                <th className="text-left font-medium p-2">
                                                                                    UUID
                                                                                </th>
                                                                                <th className="text-left font-medium p-2">
                                                                                    Emisión
                                                                                </th>
                                                                                <th className="text-right font-medium p-2">
                                                                                    Valor
                                                                                </th>
                                                                                <th className="text-right font-medium p-2">
                                                                                    Recibido
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {p.facturas.map(
                                                                                (f: FacturaGenereOferta) => (
                                                                                    <tr
                                                                                        key={f.uuid}
                                                                                        className="border-b border-default-100 hover:bg-default-50/70 transition-colors"
                                                                                    >
                                                                                        <td className="p-2 align-top break-all max-w-[240px]">
                                                                                            {f.uuid}
                                                                                        </td>
                                                                                        <td className="p-2 align-top whitespace-nowrap">
                                                                                            {new Date(
                                                                                                f.issuedAt
                                                                                            ).toLocaleDateString("es-MX", {
                                                                                                year: "numeric",
                                                                                                month: "2-digit",
                                                                                                day: "2-digit",
                                                                                            })}
                                                                                        </td>
                                                                                        <td className="p-2 text-right whitespace-nowrap">
                                                                                            {fmtCurrency(f.valorFactura)}
                                                                                        </td>
                                                                                        <td className="p-2 text-right whitespace-nowrap text-success">
                                                                                            {fmtCurrency(f.recibido)}
                                                                                        </td>
                                                                                    </tr>
                                                                                )
                                                                            )}
                                                                            {p.facturas.length === 0 && (
                                                                                <tr>
                                                                                    <td
                                                                                        colSpan={4}
                                                                                        className="p-4 text-center text-default-400 italic"
                                                                                    >
                                                                                        Sin facturas disponibles
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </ScrollShadow>
                                                            </AccordionItem>
                                                        );
                                                    })}
                                                </Accordion>
                                            )}
                                        </ScrollShadow>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cerrar
                    </Button>
                    <Button
                        color="primary"
                        onPress={() => {
                            onContinuar?.();
                            onClose();
                        }}
                        startContent={<Icon icon="mdi:arrow-right-bold-circle" />}
                        isDisabled={!data}
                    >
                        Continuar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
