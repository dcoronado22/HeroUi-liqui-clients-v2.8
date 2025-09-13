import { Card, CardBody, CardHeader, Button, Chip, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

export interface Factura {
    uuid: string;
    issuedAt: string;
    valorFactura: number;
    recibido: number;
}

export interface InformacionNegociacion {
    mondeda: string;
    montoActivo: number;
    montoCobrado: number;
    balance: number;
    aforo: number;
    promedioDiasPago: number;
    plazo: number;
}

export interface PagadorData {
    valorPosibleNegociacion: number;
    valorPosibleNegociacionRecibido: number;
    valorPendienteNegociacion: number;
    lineaCredito: number;
    nombre: string;
    rfc: string;
    informacionNegociacion: InformacionNegociacion;
    facturas: Factura[];
    porcentaje: number;
    selectedFacturas?: Factura[]; // <-- nuevo
}

interface Props {
    data: PagadorData;
    onRemove: () => void;
    onEdit?: () => void;
}

const fmtCurrency = (v: number) =>
    v.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

export default function PagadorCard({ data, onRemove, onEdit }: Props) {
    const totalFacturasVigentes = data.facturas.reduce((acc, f) => acc + f.valorFactura, 0);
    const facturasBase = (data.selectedFacturas && data.selectedFacturas.length > 0) ? data.selectedFacturas : data.facturas;
    const valorSeleccionado = facturasBase.reduce((a, f) => a + f.valorFactura, 0);
    const totalRecibes = facturasBase.reduce((a, f) => a + f.recibido, 0);
    const porcentajeUso = data.lineaCredito > 0 ? Math.min((valorSeleccionado / data.lineaCredito) * 100, 100) : 0;
    const barColor = porcentajeUso > 100 ? "bg-danger" : "bg-success";

    return (
        <Card
            radius="sm"
            shadow="md"
            className="border border-default-200 w-full relative transition-transform duration-300 transform-gpu hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:shadow-default-300/50 hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
            <CardHeader className="flex justify-between items-center gap-3 pb-3 pl-5">
                <Tooltip hidden={data.nombre?.length < 30} content={`${data.rfc} - ${data.nombre}`}>
                    <div className="flex flex-col max-w-[70%]">
                        <span className="font-medium truncate" title={`${data.rfc} - ${data.nombre}`}>
                            {data.rfc} - {data.nombre}
                        </span>
                    </div>
                </Tooltip>
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<Icon icon="lucide:list-plus" fontSize={16} />}
                        onPress={onEdit}
                    >
                        Modificar
                    </Button>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="danger"
                        aria-label="Eliminar pagador"
                        onPress={onRemove}
                        className="text-danger"
                    >
                        <Icon icon="solar:close-circle-bold" fontSize={20} />
                    </Button>
                </div>
            </CardHeader>
            <CardBody className="pt-0 ">
                <div className="grid grid-cols-2 gap-3 px-2">
                    <Info label="Línea de crédito" value={fmtCurrency(data.lineaCredito)} />
                    <Info label="Total facturas vigentes" value={data.facturas.length} />
                    <Info label="Días de plazo" value={Math.round(data.informacionNegociacion.promedioDiasPago)} />
                    <Info label="Aforo" value={`${(data.informacionNegociacion.aforo * 100).toFixed(2)} %`} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3 justify-start">
                    <Chip size="sm" variant="flat" color="default">
                        Valor seleccionado: {fmtCurrency(valorSeleccionado)}
                    </Chip>
                    <Chip size="sm" variant="flat" color="success">
                        Total recibes: {fmtCurrency(totalRecibes)}
                    </Chip>
                </div>
            </CardBody>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-default-100 overflow-hidden rounded-b-sm">
                <div
                    className={`h-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${porcentajeUso}%` }}
                />
                <span className="sr-only">Uso de línea: {porcentajeUso.toFixed(2)}%</span>
            </div>
        </Card>
    );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-default-400">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
