import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import {
    Card,
    CardBody,
    Button,
    Spinner,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Tooltip,
    Accordion,
    AccordionItem,
} from "@heroui/react";
import type { DocumentoExpediente } from "@/src/domains/vinculacion/services/vinculacion.service";
import { VinculacionService } from "@/src/domains/vinculacion/services/vinculacion.service";

// Define file type
interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    lastModified: number;
    url: string;
    uploadedAt: Date;
}

export const DocumentCard: React.FC<{ folderId: string; doc: DocumentoExpediente }> = ({ folderId, doc }) => {
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [fetchingFileId, setFetchingFileId] = React.useState<number | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // NEW: refs y mapa de overflow por archivo
    const nameRefs = React.useRef<Record<string, HTMLParagraphElement | null>>({});
    const [overflowMap, setOverflowMap] = React.useState<Record<string, boolean>>({});

    const setNameRef = (id: string) => (el: HTMLParagraphElement | null) => {
        nameRefs.current[id] = el;
    };

    React.useLayoutEffect(() => {
        const entries = Object.entries(nameRefs.current);
        const next: Record<string, boolean> = {};
        const ros: ResizeObserver[] = [];

        entries.forEach(([id, el]) => {
            if (!el) return;
            const calc = () => {
                const isOverflow = el.scrollWidth > el.clientWidth;
                setOverflowMap(prev => (prev[id] === isOverflow ? prev : { ...prev, [id]: isOverflow }));
            };
            calc();
            const ro = new ResizeObserver(calc);
            ro.observe(el);
            ros.push(ro);
        });

        return () => ros.forEach(ro => ro.disconnect());
    }, [files]);

    React.useEffect(() => {
        // cleanup: revocar URLs al desmontar
        return () => {
            files.forEach(f => URL.revokeObjectURL(f.url));
        };
    }, [files]);

    // NUEVO: estado local para archivos del servidor y sync con props
    const [serverFiles, setServerFiles] = React.useState(doc?.files ?? []);
    React.useEffect(() => {
        setServerFiles(doc?.files ?? []);
    }, [doc?.files]);

    // Handle drag events
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) {
            setIsDragging(true);
        }
    };

    // Handle file drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    // Process files
    const handleFiles = (fileList: FileList) => {
        setIsUploading(true);

        // Convert FileList to array
        const newFiles = Array.from(fileList).map(file => {
            // Create object URL for preview
            const url = URL.createObjectURL(file);

            return {
                id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                url: url,
                uploadedAt: new Date()
            };
        });

        // Simulate upload delay
        setTimeout(() => {
            setFiles(prevFiles => [...prevFiles, ...newFiles]);
            setIsUploading(false);
        }, 1500);
    };

    // NEW: escuchar drop desde las cards de la lista
    React.useEffect(() => {
        const handler = (evt: Event) => {
            const e = evt as CustomEvent<{ documentId: string | number; files: FileList }>;
            const detail = e.detail;
            if (!detail) return;
            if (String(detail.documentId) !== String(doc.document_id)) return;
            handleFiles(detail.files);
        };
        window.addEventListener("expediente:drop-files", handler as EventListener);
        return () => window.removeEventListener("expediente:drop-files", handler as EventListener);
    }, [doc?.document_id]);

    // Handle file deletion
    const handleDelete = (id: string) => {
        setFiles(prevFiles => {
            const updatedFiles = prevFiles.filter(file => file.id !== id);

            // Revoke object URL to free memory
            const fileToDelete = prevFiles.find(file => file.id === id);
            if (fileToDelete) {
                URL.revokeObjectURL(fileToDelete.url);
            }

            return updatedFiles;
        });
    };

    // Handle file download
    const handleDownload = (file: UploadedFile) => {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle file view
    const handleView = (file: UploadedFile) => {
        window.open(file.url, '_blank');
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get appropriate icon for file type
    const getFileIcon = (fileType: string): string => {
        if (fileType.includes('pdf')) {
            return 'lucide:file-type-pdf';
        } else if (fileType.includes('word') || fileType.includes('document')) {
            return 'lucide:file-type-doc';
        } else if (fileType.includes('excel') || fileType.includes('sheet')) {
            return 'lucide:file-type-xls';
        } else if (fileType.includes('image')) {
            return 'lucide:image';
        } else if (fileType.includes('text')) {
            return 'lucide:file-text';
        } else {
            return 'lucide:file';
        }
    };

    const getPreSignedUrl = async (fileId: number) => {
        try {
            setFetchingFileId(fileId);
            const res = await VinculacionService.downloadFileExpediente({
                Folderid: String(folderId),
                FileId: String(fileId),
            });
            return res?.preSignedUrl;
        } catch (e) {
            console.error("Error al obtener preSignedUrl", e);
            return null;
        } finally {
            setFetchingFileId(null);
        }
    };

    const handleViewServerFile = async (fileId: number) => {
        const url = await getPreSignedUrl(fileId);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleDownloadServerFile = async (fileId: number, filename?: string) => {
        const url = await getPreSignedUrl(fileId);
        if (!url) return;
        const a = document.createElement("a");
        a.href = url;
        if (filename) a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // NUEVO: eliminar archivo del servidor
    const handleDeleteServerFile = async (fileId: number) => {
        try {
            setFetchingFileId(fileId);
            const res = await VinculacionService.deleteFileExpediente({
                Folderid: String(folderId),
                FileId: String(fileId),
            });
            if (res?.succeeded) {
                setServerFiles(prev => prev.filter(f => f.file_id !== fileId));
            }
        } catch (e) {
            console.error("Error al eliminar archivo del expediente", e);
        } finally {
            setFetchingFileId(null);
        }
    };

    return (
        <Card className="shadow-md">
            <CardBody className="p-6">

                {(doc.comments && doc.status == "invalid") && (
                    <div className="w-1/2 mb-4 -ml-3">
                        <Accordion variant="splitted">
                            <AccordionItem key="1" aria-label="Razón rechazo" startContent={<Icon icon="line-md:alert-circle-loop" className="text-danger" />} title="Razón rechazo">
                                {doc.comments}
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}

                <h2 className="text-xl font-semibold mb-4">Documentos</h2>

                {/* NUEVO: Formato de referencia (url_pre) */}
                {doc.url_pre && (
                    <Card className="p-3 mb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <h3 className="text-md font-medium">Formato pre-llenado</h3>
                                <Tooltip content="Este es el formato que debes completar y subir" placement="top" offset={6}>
                                    <Icon icon="line-md:alert-circle-loop" className="ml-2 text-primary text-xl" />
                                </Tooltip>
                            </div>
                            <Button
                                as="a"
                                href={doc.url_pre}
                                download
                                target="_blank"
                                size="sm"
                                color="primary"
                                variant="ghost"
                                startContent={<Icon icon="solar:download-linear" />}
                            >
                                Descargar
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Upload area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors duration-200 bg-primary-50 ${isDragging
                        ? 'border-primary bg-primary-50'
                        : 'border-default-200 hover:border-primary-300'
                        }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileInputChange}
                        multiple
                    />

                    <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: isDragging ? 1.05 : 1 }}
                        className="flex flex-col items-center justify-center cursor-pointer"
                    >
                        <Icon
                            icon="lucide:upload-cloud"
                            className={`text-4xl mb-3 ${isDragging ? 'text-primary' : 'text-default-400'}`}
                        />
                        <p className="text-default-600 font-medium mb-1">
                            {isDragging ? 'Suelta para subir' : 'Arrastra y suelta archivos aquí'}
                        </p>
                        <p className="text-default-400 text-sm mb-3">o haz clic para seleccionar archivos</p>
                        <Button
                            color="primary"
                            variant="flat"
                            size="sm"
                            startContent={<Icon icon="lucide:plus" />}
                        >
                            Seleccionar archivos
                        </Button>
                    </motion.div>
                </div>

                {/* Upload progress */}
                <AnimatePresence>
                    {isUploading && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4"
                        >
                            <div className="flex items-center p-3 rounded-md bg-default-50">
                                <Spinner size="sm" color="primary" className="mr-3" />
                                <span className="text-sm">Subiendo archivos...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* File list (unificada: servidor + locales) */}
                {(((doc?.status?.toLowerCase() !== "preparing") && serverFiles.length > 0) || files.length > 0) && (
                    <div>
                        <h3 className="text-md font-medium mb-3">Archivos subidos</h3>
                        <div className="space-y-3">
                            {/* Archivos del servidor */}
                            {(doc?.status?.toLowerCase() !== "preparing") && serverFiles.map((f) => (
                                <div
                                    key={`srv-${f.file_id}`}
                                    className="flex items-center justify-between p-3 rounded-md border border-default-200 bg-content1"
                                >
                                    <div className="flex items-center min-w-0">
                                        <div className="h-10 w-10 rounded bg-default-100 flex items-center justify-center mr-3 shrink-0">
                                            <Icon icon="lucide:file" className="text-xl text-default-600" />
                                        </div>
                                        <Tooltip content={f.filename} placement="top" offset={6}>
                                            <p className="font-medium text-sm leading-tight truncate max-w-[70ch]">
                                                {f.filename}
                                            </p>
                                        </Tooltip>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            startContent={<Icon icon="lucide:eye" />}
                                            isDisabled={fetchingFileId === f.file_id}
                                            isLoading={fetchingFileId === f.file_id}
                                            onPress={() => handleViewServerFile(f.file_id)}
                                        >
                                            Ver
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            startContent={<Icon icon="lucide:download" />}
                                            isDisabled={fetchingFileId === f.file_id}
                                            isLoading={fetchingFileId === f.file_id}
                                            onPress={() => handleDownloadServerFile(f.file_id, f.filename)}
                                        >
                                            Descargar
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="danger"
                                            variant="light"
                                            startContent={<Icon icon="lucide:trash-2" />}
                                            isDisabled={fetchingFileId === f.file_id}
                                            onPress={() => handleDeleteServerFile(f.file_id)}
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Archivos locales */}
                            <AnimatePresence>
                                {files.map((file) => (
                                    <motion.div
                                        key={`loc-${file.id}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-center justify-between p-3 rounded-md border border-default-200 bg-content1"
                                    >
                                        <div className="flex items-center min-w-0">
                                            <div className="h-10 w-10 rounded bg-default-100 flex items-center justify-center mr-3 shrink-0">
                                                <Icon icon={getFileIcon(file.type)} className="text-xl text-default-600" />
                                            </div>
                                            <div className="min-w-0">
                                                {/* NEW: tooltip condicional cuando se trunca */}
                                                {overflowMap[file.id] ? (
                                                    <Tooltip content={file.name} placement="top" offset={6}>
                                                        <p
                                                            ref={setNameRef(file.id)}
                                                            className="font-medium text-sm leading-tight truncate"
                                                        >
                                                            {file.name}
                                                        </p>
                                                    </Tooltip>
                                                ) : (
                                                    <p
                                                        ref={setNameRef(file.id)}
                                                        className="font-medium text-sm leading-tight truncate"
                                                    >
                                                        {file.name}
                                                    </p>
                                                )}
                                                <p className="text-xs text-default-400 mt-0.5">
                                                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button
                                                        isIconOnly
                                                        variant="light"
                                                        size="sm"
                                                        aria-label="Opciones"
                                                    >
                                                        <Icon icon="lucide:more-vertical" className="text-lg" />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu aria-label="Opciones de archivo">
                                                    <DropdownItem
                                                        key="view"
                                                        startContent={<Icon icon="lucide:eye" className="text-lg" />}
                                                        onPress={() => handleView(file)}
                                                    >
                                                        Ver documento
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        key="download"
                                                        startContent={<Icon icon="lucide:download" className="text-lg" />}
                                                        onPress={() => handleDownload(file)}
                                                    >
                                                        Descargar
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        key="delete"
                                                        className="text-danger"
                                                        color="danger"
                                                        startContent={<Icon icon="lucide:trash-2" className="text-lg" />}
                                                        onPress={() => handleDelete(file.id)}
                                                    >
                                                        Eliminar
                                                    </DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Empty state (solo si no hay ni servidor ni locales) */}
                {files.length === 0 &&
                    !isUploading &&
                    !((doc?.status?.toLowerCase() !== "preparing") && serverFiles.length > 0) && (
                        <div className="mt-4 text-center py-6">
                            <p className="text-default-400 text-sm">
                                No hay documentos subidos aún
                            </p>
                        </div>
                    )}
            </CardBody>
        </Card>
    );
};