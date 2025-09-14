import React, { useState, useMemo } from 'react';
import { CheckAnimation } from '../components/CheckAnimation';
// ...existing code (si hubiera más imports)...
import { Accordion, AccordionItem, Tooltip, Chip, Card, CardHeader, CardBody, CardFooter, Progress, Divider } from '@heroui/react';
import { Icon } from '@iconify/react';
import { DocumentCard } from '../components/DocumentCard';

// Eliminado: SuccessSplash

const StepCotizado: React.FC<any> = (props) => {
    const { detalle } = props; // ← nuevo
    const [showContent, setShowContent] = useState(false);

    // --- Build resumen y clients ---
    const {
        resumen,
        clients
    } = useMemo(() => {
        const operaciones = Array.isArray(detalle?.operaciones) ? detalle.operaciones : [];
        const resumenBase = {
            totalOperaciones: operaciones.length,
            totalFacturas: 0,
            totalRecibido: 0,
            aforoPromedio: 0,
            lineaCreditoTotal: 0,
            promedioDiasPago: 0,
            documentosFirmados: 0,
            documentosTotal: 0
        };

        const aforos: number[] = [];
        const diasPago: number[] = [];

        // clients: derivado de gruposRfc y documentos
        type Client = {
            clientKey: string;
            rfc: string;
            razonSocial: string;
            documentos: any[];
        };
        const clientsAccum: Client[] = [];

        operaciones.forEach((op: { gruposRfc: any; documentos: any; id: any; }) => {
            const grupos = Array.isArray(op.gruposRfc) ? op.gruposRfc : [];
            const documentos = Array.isArray(op.documentos) ? op.documentos : [];

            // Document stats
            documentos.forEach(doc => {
                const signedAt = doc.signedAt || doc.SignedAt;
                const path = doc.path || doc.Path;
                const state = doc.state ?? doc.State;
                const firmado = !!(
                    state === 1 ||
                    (typeof signedAt === 'string' && !/^0001-01-01|1970-01-01/.test(signedAt)) ||
                    (typeof path === 'string' && path.toLowerCase().includes('_firmado'))
                );
                resumenBase.documentosTotal += 1;
                if (firmado) resumenBase.documentosFirmados += 1;
            });

            grupos.forEach(g => {
                // Facturas / montos
                const cfdis = Array.isArray(g.cfdis) ? g.cfdis : [];
                cfdis.forEach((c: { valorFactura: any; recibido: any; }) => {
                    resumenBase.totalFacturas += Number(c.valorFactura || 0);
                    resumenBase.totalRecibido += Number(c.recibido || 0);
                });
                if (g.aforo != null) aforos.push(Number(g.aforo));
                if (g.promedioDiasPago != null) diasPago.push(Number(g.promedioDiasPago));
                if (g.lineaCredito != null) resumenBase.lineaCreditoTotal += Number(g.lineaCredito);

                // Map documentos de la operación a DocumentCard items
                const mappedDocs = (Array.isArray(op.documentos) ? op.documentos : []).map((d: any, idx: number) => {
                    const signedAt = d.signedAt || d.SignedAt;
                    const path = d.path || d.Path;
                    const state = d.state ?? d.State;
                    const fileSigned = d.fileSigned || d.FileSigned;
                    const firmado = !!(
                        state === 1 ||
                        (typeof signedAt === 'string' && !/^0001-01-01|1970-01-01/.test(signedAt)) ||
                        (typeof path === 'string' && path.toLowerCase().includes('_firmado'))
                    );
                    const originalName = (d.fileName || d.FileName || 'documento').toString();
                    const displayName = firmado ? `${originalName} - Firmado` : originalName;
                    return {
                        id: d.id || d.Id || `${op.id}-${idx}`,
                        name: displayName,
                        type: (d.fileName || '').toString().toLowerCase().includes('pagare') ? 'pagare' : 'contrato',
                        status: firmado ? '1' : '0',
                        date: new Date(signedAt || d.fechaCreacion || Date.now()),
                        size: '—',
                        ext: (path || fileSigned || '').split('.').pop() || null,
                        path,
                        fileSigned,
                        url: fileSigned || path || null,
                        raw: d
                    };
                });

                clientsAccum.push({
                    clientKey: `${op.id || 'op'}__${g.rfc}`,
                    rfc: g.rfc,
                    razonSocial: g.nombreDeudor || g.razonSocialDeudor || '—',
                    documentos: mappedDocs
                });
            });
        });

        resumenBase.aforoPromedio =
            aforos.length ? aforos.reduce((a, b) => a + b, 0) / aforos.length : 0;
        resumenBase.promedioDiasPago =
            diasPago.length ? Math.round(diasPago.reduce((a, b) => a + b, 0) / diasPago.length) : 0;

        return {
            resumen: resumenBase,
            clients: clientsAccum
        };
    }, [detalle]);

    const pctFirmados = resumen.documentosTotal === 0
        ? 0
        : Math.round((resumen.documentosFirmados / resumen.documentosTotal) * 100);

    const progressColor = pctFirmados === 100 ? 'success' : pctFirmados >= 60 ? 'primary' : 'warning';

    // Control acordiones
    const [openClients, setOpenClients] = useState<Set<string>>(new Set());
    React.useEffect(() => {
        setOpenClients(new Set(clients.map(c => c.clientKey)));
    }, [clients]);
    const toggleClient = (key: string) => {
        setOpenClients(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    return (
        <div className="relative h-full w-full flex items-center justify-center">
            {!showContent && (
                <CheckAnimation
                    size={120}
                    colorClass="success"
                    title="Operación completada"
                    subtitle="Todos los documentos fueron firmados satisfactoriamente."
                    postShiftMessage=""
                    coverParent
                    shiftToTopAfterBackground
                    onComplete={() => setShowContent(true)}
                />
            )}

            {showContent && (
                <div
                    className="w-full h-full overflow-auto animate-[fadeIn_0.45s_ease] flex flex-col"
                    style={{ animation: 'fadeIn 0.45s ease' }}
                >
                    <div className="flex flex-1 gap-6 h-full">
                        {/* Columna Resumen */}
                        <div className="w-full md:w-[30%] h-full">
                            <div className="sticky top-0 space-y-6 pb-8">
                                {/* Card Resumen */}
                                <Card isBlurred
                                    className="border-none bg-background/60 dark:bg-default-100/50 max-w-[610px] mt-1 ml-1"
                                    shadow="sm">
                                    <CardHeader className="flex items-center gap-2">
                                        <Icon icon="lucide:clipboard-list" className="text-primary-600" fontSize={20} />
                                        <h3 className="font-semibold text-default-800">Resumen de la Operación</h3>
                                    </CardHeader>
                                    <Divider className="px-2" />
                                    <CardBody className="py-0">
                                        <ul className="text-sm text-default-600 space-y-2 pt-4">
                                            <li className="flex justify-between">
                                                <span>Total operaciones:</span>
                                                <span className="font-medium text-default-800">{resumen.totalOperaciones}</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Valor facturas:</span>
                                                <span className="font-medium text-default-800">
                                                    {resumen.totalFacturas.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Recibido:</span>
                                                <span className="font-medium text-default-800">
                                                    {resumen.totalRecibido.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Línea crédito total:</span>
                                                <span className="font-medium text-default-800">
                                                    {resumen.lineaCreditoTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Aforo promedio:</span>
                                                <span className="font-medium text-default-800">
                                                    {(resumen.aforoPromedio * 100).toFixed(1)}%
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Prom. días pago:</span>
                                                <span className="font-medium text-default-800">
                                                    {resumen.promedioDiasPago} días
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Docs firmados:</span>
                                                <span className="font-medium text-default-800">
                                                    {resumen.documentosFirmados}/{resumen.documentosTotal}
                                                </span>
                                            </li>
                                        </ul>
                                    </CardBody>
                                    <CardFooter className="flex flex-col gap-2">
                                        <div className="flex justify-between w-full text-xs">
                                            <span className="text-default-500">Avance firmas</span>
                                            <span className="font-medium">{pctFirmados}%</span>
                                        </div>
                                        <Progress
                                            aria-label="Avance firmas"
                                            value={pctFirmados}
                                            color={progressColor}
                                            size="sm"
                                            className="w-full"
                                            showValueLabel={false}
                                        />
                                    </CardFooter>
                                </Card>

                                {/* Card Información */}
                                <Card isBlurred
                                    className="border-none bg-background/60 dark:bg-default-100/50 max-w-[610px]"
                                    shadow="sm">
                                    <CardHeader className="flex items-center gap-2">
                                        <Icon icon="lucide:info" className="text-default-500" />
                                        <h4 className="text-sm font-semibold text-default-700">Información</h4>
                                    </CardHeader>
                                    <CardBody className="pt-0">
                                        <p className="text-xs text-default-500 leading-relaxed">
                                            Estado final de la operación y documentos firmados agrupados por deudor. Expande cada grupo para revisar o descargar.
                                        </p>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                        {/* Columna Derecho: Documentos por Deudor */}
                        <div className="flex-1 h-full pb-8 mt-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-default-800 flex items-center gap-2">
                                    <Icon icon="lucide:building-2" className="text-primary-600" />
                                    Pagadores
                                </h3>
                                <Chip
                                    size="sm"
                                    color={pctFirmados === 100 ? 'success' : 'primary'}
                                    variant="flat"
                                >
                                    {pctFirmados === 100 ? 'Completado' : 'Parcial'}
                                </Chip>
                            </div>

                            <div className="grid gap-4 md:grid-cols-1">
                                {clients.map(c => {
                                    const totalDocs = c.documentos.length;
                                    const allSigned = totalDocs > 0 && c.documentos.every(d => d.status === '1');
                                    const debtorName = c.razonSocial || '—';
                                    const showTooltip = debtorName.length > 30;
                                    const statusIcon = allSigned
                                        ? 'line-md:circle-filled-to-confirm-circle-filled-transition'
                                        : 'line-md:alert-circle';
                                    const statusColor = allSigned ? 'text-success-600' : 'text-warning-500';
                                    const statusLabel = allSigned ? 'Todos los documentos firmados' : 'Pendiente de firma';
                                    const isOpen = openClients.has(c.clientKey);

                                    return (
                                        <div key={c.clientKey}>
                                            <Accordion
                                                selectedKeys={isOpen ? new Set([c.clientKey]) : new Set()}
                                                onSelectionChange={() => toggleClient(c.clientKey)}
                                                selectionMode="multiple"
                                                className=" shadow-sm"
                                                itemClasses={{
                                                    base: 'border border-default-200 rounded-md bg-default-50 data-[open=true]:bg-default-100 transition-colors -mx-2',
                                                    title: 'w-full',
                                                    trigger: 'p-3 flex items-center gap-3',
                                                    content: 'px-3 pb-4 pt-1'
                                                }}
                                            >
                                                <AccordionItem
                                                    key={c.clientKey}
                                                    aria-label={debtorName}
                                                    title={
                                                        <div className="flex items-center gap-3 w-full">
                                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                                <Icon icon="lucide:building" className="text-primary-600" width={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <Tooltip
                                                                    content={debtorName}
                                                                    isDisabled={!showTooltip}
                                                                    placement="top-start"
                                                                >
                                                                    <h3 className="font-medium truncate max-w-[23dvw]">
                                                                        {debtorName}
                                                                    </h3>
                                                                </Tooltip>
                                                                <p className="text-xs text-default-500">RFC: {c.rfc}</p>
                                                            </div>
                                                            <Tooltip content={statusLabel}>
                                                                <Icon
                                                                    icon={statusIcon}
                                                                    width={20}
                                                                    className={`${statusColor} flex-shrink-0`}
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                    }
                                                >
                                                    <div className="space-y-4">
                                                        {c.documentos.map((d: any) => (
                                                            <DocumentCard key={d.id} document={d} />
                                                        ))}
                                                        {c.documentos.length === 0 && (
                                                            <div className="text-xs text-default-400 italic">
                                                                Sin documentos para este deudor.
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionItem>
                                            </Accordion>
                                        </div>
                                    );
                                })}

                                {clients.length === 0 && (
                                    <div className="text-sm text-default-400 italic md:col-span-2">
                                        Sin documentos disponibles.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepCotizado;
