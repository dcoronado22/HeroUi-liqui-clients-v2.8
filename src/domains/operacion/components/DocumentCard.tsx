'use client';
import React from 'react';
import { Card, CardBody, Button, Tooltip, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@heroui/react';
import { Icon } from '@iconify/react';
import { isPreviewable } from '@/src/shared/helpers/files';
import { OperacionService } from '../services/operacion.service';

export type UIDocument = {
    id: string;
    name: string;
    type: 'contrato' | 'pagare';
    status: '0' | '1';
    date: Date;
    size: string;
    raw?: any;
    ext?: string | null;
    path?: string;
    fileSigned?: string;
    url?: string | null;
};

interface DocumentCardProps {
    document: UIDocument;
    onView?: (d: UIDocument) => void;
    onDownload?: (d: UIDocument) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
    document,
    onView,
    onDownload
}) => {
    const [openPreview, setOpenPreview] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState(
        document.url || document.path || document.fileSigned || ''
    );
    const [loadingPreview, setLoadingPreview] = React.useState(false);

    const extension = (document.ext ||
        document.name.split('.').pop() ||
        (document.path?.split('/').pop()?.split('.').pop()))?.toLowerCase() || '';

    const upperExt = extension.toUpperCase();

    // Nuevo: nombre sin extensión y capitalizado
    const rawName = document.name || '';
    const nameWithoutExt = rawName.replace(/\.[^.]+$/, '');
    const displayName = nameWithoutExt
        ? nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1)
        : rawName;

    const canPreview = isPreviewable(extension);

    const handleView = async () => {
        if (onView) {
            onView(document);
            return;
        }
        const basePath = document.path;
        // Si ya tenemos una URL firmada (contiene AWSAccessKeyId) abrimos directamente
        const alreadySigned = previewUrl.includes('AWSAccessKeyId');
        if (basePath && !alreadySigned) {
            try {
                setLoadingPreview(true);
                const res = await OperacionService.getDocumentUrl(basePath);
                if (res?.urlFirmada) {
                    setPreviewUrl(res.urlFirmada);
                }
            } catch (e) {
                console.error('[DocumentCard] Error obteniendo url firmada', e);
            } finally {
                setLoadingPreview(false);
            }
        }
        if (canPreview) setOpenPreview(true);
        else window.open(previewUrl, '_blank');
    };

    // Nuevo: estado de firma y gradiente superior dependiente del estado
    const isSigned = document.status === '1';
    const barGradientFrom = isSigned ? 'from-success-300' : 'from-primary-300';
    const barGradientTo = isSigned ? 'to-success-500' : 'to-primary-500';

    // Eliminado: lógica condicional por tipo (contrato / pagare)
    // Se usa un estilo único para el ícono/contenedor
    const iconBgFrom = isSigned ? 'from-success-100' : 'from-primary-50';
    const iconBgTo = isSigned ? 'to-success-200' : 'to-primary-100';
    const iconBorder = isSigned ? 'border-success-200' : 'border-primary-200';
    const iconColor = isSigned ? 'text-success-600' : 'text-primary-400';

    const formatDate = (d: Date) =>
        new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);

    return (
        <Card className="border border-default-200 shadow-none overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${barGradientFrom} ${barGradientTo}`} />
            <CardBody>
                <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-md bg-gradient-to-br ${iconBgFrom} ${iconBgTo} border ${iconBorder} self-center mr-4`}>
                        <Icon icon="lucide:file-text" width={24} className={iconColor} />
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-medium text-foreground truncate" title={displayName}>
                                    {displayName}
                                </h3>
                            </div>

                            <div className="flex-shrink-0">
                                {document.status === '1' ? (
                                    <Tooltip content="Documento firmado">
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 bg-success-100 px-2 py-1 rounded-full">
                                            <Icon icon="lucide:check-circle" width={14} />
                                            Firmado
                                        </span>
                                    </Tooltip>
                                ) : (
                                    <Tooltip content="Pendiente de firma">
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-600 bg-warning-100 px-2 py-1 rounded-full">
                                            <Icon icon="lucide:clock" width={14} />
                                            Pendiente
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-default-500">
                            <span className="flex items-center gap-1">
                                <Icon icon="lucide:calendar" width={12} />
                                {formatDate(document.date)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Icon icon="lucide:hard-drive" width={12} />
                                {document.size || '—'}
                            </span>
                            <span className="flex items-center gap-1 bg-default-200 px-1.5 py-0.5 rounded text-foreground-700">
                                <Icon icon="lucide:file-type" width={12} />
                                {upperExt}
                            </span>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                            <div className="text-xs text-default-400">
                                ID: {document.id}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    startContent={<Icon icon={loadingPreview ? 'lucide:loader-2' : 'lucide:eye'} className={loadingPreview ? 'animate-spin' : ''} width={16} />}
                                    onPress={handleView}
                                    isDisabled={loadingPreview}
                                >
                                    Ver
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
            <Drawer isOpen={openPreview} onOpenChange={setOpenPreview} placement="left" size="full">
                <DrawerContent>
                    {(close) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1  text-center">
                                {displayName}
                            </DrawerHeader>
                            <DrawerBody>
                                {canPreview ? (
                                    loadingPreview ? (
                                        <div className="flex items-center justify-center h-[70vh] text-sm text-default-500">
                                            Obteniendo URL segura…
                                        </div>
                                    ) : extension === 'pdf' ? (
                                        <iframe
                                            src={previewUrl}
                                            className="w-full h-[100dvh] rounded border"
                                        />
                                    ) : (
                                        <img
                                            src={previewUrl}
                                            alt={document.name}
                                            className="max-h-[70vh] mx-auto object-contain"
                                        />
                                    )
                                ) : (
                                    <div className="text-sm text-default-500 space-y-2">
                                        <p>No es posible previsualizar este tipo de archivo.</p>
                                        {previewUrl && (
                                            <Button
                                                size="sm"
                                                startContent={<Icon icon="lucide:download" width={16} />}
                                                onPress={() => window.open(previewUrl, '_blank')}
                                            >
                                                Abrir / Descargar
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </DrawerBody>
                            <DrawerFooter>
                                <Button variant="solid" color="primary" onPress={close}>
                                    Cerrar
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </Card>
    );
};