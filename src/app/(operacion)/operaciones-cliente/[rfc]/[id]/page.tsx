"use client";

import { Button, Card, CardBody, Chip, Divider, Tooltip } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DynamicTable } from "@/src/shared/components/DynamicTable/DynamicTable";
import { OperacionService } from "@/src/domains/operacion/services/operacion.service";
import { Icon } from "@iconify/react";
import { TransactionCard } from "@/src/domains/operacion/components/transaction-card";
import { PreOfertaModal } from "@/src/domains/operacion/components/PreOfertaModal";

export default function OperacionesClientePage() {
    const { rfc, id } = useParams<{ rfc: string; id: string }>();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [preOfertaLoading, setPreOfertaLoading] = useState(false);
    const [preOfertaGenerada, setPreOfertaGenerada] = useState(false);
    const [preOfertaData, setPreOfertaData] = useState<any | null>(null); // guarda respuesta completa
    const [preOfertaModalOpen, setPreOfertaModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!rfc) return;
        (async () => {
            try {
                setLoading(true);
                const res = await OperacionService.getOperacionesLote(rfc);
                const rows = (res.operacionesLote || []).map(o => {
                    const avgAforo = o.operacionCliente.length
                        ? o.operacionCliente.reduce((acc, c) => acc + (c.aforo ?? 0), 0) / o.operacionCliente.length
                        : 0;
                    return {
                        id: o.id,
                        idLote: o.idLote,
                        fecha: `${new Date(o.fechaCreacion).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date(o.fechaCreacion).toLocaleTimeString()}`,
                        clientes: o.cantidadOperaciones,
                        monto: o.montoTotal,
                        aforo: Number(avgAforo.toFixed(2)),
                        estado: o.stateDescription,
                        raw: o,
                    };
                });
                setData(rows);
            } catch (e) {
                console.error("Error cargando operaciones lote", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [rfc]);

    useEffect(() => {
        if (!rfc || !id) return;
        let cancelled = false;
        (async () => {
            try {
                setPreOfertaLoading(true);
                const res = await OperacionService.genereOferta({ rfc, id: "18c84d53-1c81-4ecd-a5d8-622fec7e8289" });
                if (!cancelled && res?.succeeded) {
                    setPreOfertaGenerada(true);
                    setPreOfertaData(res); // almacena datos para el modal
                }
            } catch (e) {
                console.error("Error generando pre-oferta", e);
            } finally {
                if (!cancelled) setPreOfertaLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [rfc, id]);

    const columns = [
        { key: "fecha", label: "FECHA", allowsSorting: true },
        { key: "clientes", label: "#CLIENTES", allowsSorting: true },
        { key: "monto", label: "MONTO", allowsSorting: true, cellRenderer: (item: any) => `$${item.monto.toLocaleString()} MXN` },
        { key: "aforo", label: "AFORO", allowsSorting: true, cellRenderer: (item: any) => `${(item.aforo * 100).toFixed(2)}%` },
        {
            key: "estado",
            label: "ESTADO",
            allowsSorting: true,
            cellRenderer: (item: any) => (
                <Chip size="sm" color="primary" variant="flat">
                    {item.estado}
                </Chip>
            ),
        },
        {
            key: "opciones",
            label: "OPCIONES",
            allowsSorting: true,
            cellRenderer: (item: any) => (
                <Button
                    size="sm"
                    color="primary"
                    variant="solid"
                    onPress={() => router.push(`/operacion/${rfc}/${item.id}/lote/${item.idLote}`)}
                >
                    Continuar Solicitud
                </Button>

            ),
        },
    ];

    function handleRefetch() {
        setData(d => [...d]);
    }

    const accordionContent = (item: any) => {
        const ops = item.raw?.operacionCliente || [];
        return (
            <div className="p-0 space-y-0">
                {!ops.length && (
                    <div className="text-center text-sm text-default-500">
                        Sin operaciones cliente
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    {ops.map((op: any) => (
                        <TransactionCard key={op.id} transaction={op} variant="compact" />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full px-6 py-8 flex flex-col h-screen">
            <Card className="mb-4 px-4 py-3 flex flex-row items-center space-x-4">
                <Icon icon="line-md:list" className="w-6 h-6 text-default-500" />
                <Divider orientation="vertical" className="h-6" />
                <h5 className="text-lg font-bold">
                    Mis operaciones
                </h5>
                <Chip size="sm" color="primary" variant="flat" className="ml-2">
                    {data.length} operaciones
                </Chip>
                {!preOfertaLoading && preOfertaGenerada && (
                    <Tooltip content={<div className="px-2 py-5">
                        <div className="text-small font-bold">Pre-oferta disponible según tu necesidad de liquidez.</div>
                        <div className="text-tiny">Hemos generado una pre-oferta en base al monto solicitado. Revisa los detalles y continúa.</div>
                    </div>} placement="left" showArrow>
                        <Button
                            className="reflection-button font-medium ml-auto bg-success/25 text-success-600 hover:bg-success/20 active:bg-success/10 px-5 py-5.4"
                            color="success"
                            variant="solid"
                            size="md"
                            radius="md"
                            startContent={<Icon icon="line-md:confirm-circle-twotone" fontSize={20} />}
                            onPress={() => setPreOfertaModalOpen(true)}
                        >
                            Pre Oferta disponible
                        </Button>
                    </Tooltip>
                )}
                <Button
                    color="primary"
                    className={preOfertaGenerada ? "" : "ml-auto"}
                    startContent={<Icon icon="line-md:plus-circle" />}
                    onPress={() => router.push(`/operacion/${rfc}/${id}`)}
                >
                    Nueva Solicitud
                </Button>
            </Card>
            <Card className="p-2 flex-1 mb-12 min-h-0">
                <CardBody className="h-full overflow-hidden flex flex-col">
                    <DynamicTable
                        data={data}
                        columns={columns}
                        allowFiltering={true}
                        allowSorting={true}
                        allowColumnVisibility={true}
                        allowRowSelection={false}
                        initialVisibleColumns={["fecha", "clientes", "monto", "aforo", "estado", "opciones"]}
                        filterableColumns={["fecha", "estado"]}
                        itemsPerPage={5}
                        isLoading={loading}
                        isAccordion={true}
                        accordionContent={accordionContent}
                        accordionIcon="lucide:chevron-down"
                    />
                </CardBody>
            </Card>
            <PreOfertaModal
                open={preOfertaModalOpen}
                onClose={() => setPreOfertaModalOpen(false)}
                data={preOfertaData}
                onContinuar={() => {
                    // acción opcional al continuar desde la pre-oferta
                    // router.push(...)
                }}
            />
            <style jsx>{`
                .shimmer-diagonal {
                    isolation: isolate;
                }
                .shimmer-diagonal::after {
                    content: "";
                    position: absolute;
                    top: -150%;
                    left: -150%;
                    width: 300%;
                    height: 300%;
                    background: linear-gradient(
                        60deg,
                        rgba(255,255,255,0) 35%,
                        rgba(255,255,255,0.55) 50%,
                        rgba(255,255,255,0) 65%
                    );
                    transform: translateX(-60%);
                    animation: shimmerSweep 3s linear infinite;
                    pointer-events: none;
                    mix-blend-mode: screen;
                }
                @media (prefers-reduced-motion: reduce) {
                    .shimmer-diagonal::after {
                        animation: none;
                        opacity: 0;
                    }
                }
                @keyframes shimmerSweep {
                    0% { transform: translateX(-60%) translateY(0); }
                    50% { transform: translateX(0%) translateY(0); }
                    100% { transform: translateX(60%) translateY(0); }
                }
                .shimmer-diagonal:active::after {
                    animation-duration: 1.2s;
                }
            `}</style>
        </div>
    );
}