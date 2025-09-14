'use client';
import React from 'react';
import { Card, CardBody, Chip, Spinner, Tooltip, Accordion, AccordionItem } from '@heroui/react'; // + Accordion
import { Icon } from '@iconify/react';
import { DocumentCard, UIDocument } from './DocumentCard';

export interface Client {
    clientKey: string; // ← NUEVO identificador único estable
    rfc: string;
    razonSocial: string;
    nombreDeudor?: string; // nuevo
    documents: UIDocument[];
}

interface Props {
    clients: Client[];
    loading: boolean;
    reasonCode?: number | null;
    reasonDesc?: string | null;
}

export const DocumentPollingStatus: React.FC<Props> = ({
    clients,
    loading,
    reasonCode,
    reasonDesc
}) => {
    const allDocs = clients.flatMap(c => c.documents);
    const total = allDocs.length;
    const signed = allDocs.filter(d => d.status === '1').length;
    const pct = total === 0 ? 0 : Math.round((signed / total) * 100);

    // Nuevo: control de expansión por cliente (colapsado por defecto)
    const [openClients, setOpenClients] = React.useState<Set<string>>(new Set());

    // Abrir todos solo una vez (primera carga de clientes)
    const autoOpenedRef = React.useRef(false);
    React.useEffect(() => {
        if (!autoOpenedRef.current && clients.length > 0) {
            setOpenClients(new Set(clients.map(c => c.clientKey)));
            autoOpenedRef.current = true;
        }
    }, [clients]);

    const toggleClient = (key: string) => {
        setOpenClients(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-foreground">Estado de Firmas Digitales</h1>
                    <Icon icon="lucide:file-signature" className="text-primary-600 ml-2" width={24} />
                </div>
                {loading && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-default-500 mr-3">Verificando</span>
                        <Spinner size="sm" color="primary" variant='gradient' />
                    </div>
                )}
            </div>

            {/* Info Card */}
            <Card className="bg-content1 border-none shadow-xs">
                <CardBody className="gap-4">
                    <div className="flex items-start -mx-3">
                        <div>
                            <p className="text-default-600 text-sm">
                                Hemos enviado los documentos a la plataforma MiFiel para obtener la firma digital. El usuario <strong>{"xxxxx"}</strong> recibirá un correo electrónico con las instrucciones para completar el proceso. Ten en cuenta que la actualización del estado de la firma puede tardar unos minutos después de que se complete en la plataforma, mientras recibimos la confirmación de MiFiel.
                                {reasonCode === 4026 && (
                                    <span className="block mt-1 text-warning-600">
                                        {reasonDesc || 'Aún no hay documentos disponibles.'}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex flex-col gap-2 mt-2 -mx-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-default-500">
                                Progreso: {signed} de {total || 0} documentos firmados
                            </span>
                            <span className="text-sm font-medium">{pct}%</span>
                        </div>
                        <div className="w-full bg-default-100 rounded-full h-3 p-0.5 border border-default-200">
                            <div
                                className="bg-gradient-to-r from-primary to-success h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end px-2"
                                style={{ width: `${total === 0 ? 5 : Math.max((signed / (total || 1)) * 100, 5)}%` }}
                            >
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Summary header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium text-foreground">Resumen de Documentos</h2>
            </div>

            {/* Client sections */}
            <div className="grid gap-3 md:grid-cols-2">
                {clients.map(c => {
                    const debtorName = c.nombreDeudor || c.razonSocial || '—';
                    const showNameTooltip = debtorName.length > 30;
                    const totalDocs = c.documents.length;
                    const allSigned = totalDocs > 0 && c.documents.every(d => d.status === '1');
                    const statusIcon = allSigned ? 'line-md:circle-filled-to-confirm-circle-filled-transition' : 'line-md:alert-circle';
                    const statusColor = allSigned ? 'text-success-600' : 'text-warning-500';
                    const statusLabel = allSigned ? 'Todos los documentos firmados' : 'Pendiente de firma';
                    const isOpen = openClients.has(c.clientKey);

                    return (
                        <div key={c.clientKey}>
                            <Accordion
                                // Un accordion por cliente para mantener columnas
                                selectedKeys={isOpen ? new Set([c.clientKey]) : new Set()}
                                onSelectionChange={() => toggleClient(c.clientKey)}
                                selectionMode="multiple"
                                className="bg-transparent shadow-none"
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
                                                <Tooltip content={debtorName} isDisabled={!showNameTooltip} placement="top-start">
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
                                        {c.documents.map(d => (
                                            <DocumentCard key={d.id} document={d} />
                                        ))}
                                        {c.documents.length === 0 && (
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
                        {reasonCode === 4026
                            ? 'Esperando que el se generen los documentos…'
                            : 'Sin documentos disponibles.'}
                    </div>
                )}
            </div>
        </div>
    );
};