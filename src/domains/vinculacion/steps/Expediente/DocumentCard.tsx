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
    DropdownItem
} from "@heroui/react";

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

export const DocumentCard = () => {
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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

    return (
        <Card className="shadow-md">
            <CardBody className="p-6">
                <h2 className="text-xl font-semibold mb-4">Documentos</h2>

                {/* Upload area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors duration-200 ${isDragging
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

                {/* File list */}
                {files.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-md font-medium mb-3">Archivos subidos</h3>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {files.map((file) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-center justify-between p-3 rounded-md border border-default-200 bg-content1"
                                    >
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded bg-default-100 flex items-center justify-center mr-3">
                                                <Icon icon={getFileIcon(file.type)} className="text-xl text-default-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm line-clamp-1">{file.name}</p>
                                                <p className="text-xs text-default-400">
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

                {/* Empty state */}
                {files.length === 0 && !isUploading && (
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