"use client";

import React from "react";
import { Icon } from "@iconify/react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Spinner,
    Badge,
    Chip
} from "@heroui/react";
import { DocumentCard } from "./DocumentCard";
import {
    VinculacionService
} from "@/src/domains/vinculacion/services/vinculacion.service";
import type { DocumentoExpediente } from "@/src/domains/vinculacion/services/vinculacion.service";

type StepExpedienteModalProps = {
    isOpen: boolean;
    onClose: () => void;
    folderId: string; // FolderId
    rfc: string;      // Rfc
    id: string;       // Id
};

const statusToColor = (
    status: string
): "success" | "warning" | "danger" | "default" | "primary" => {
    switch (status?.toLowerCase()) {
        case "valid":
            return "success";
        case "preparing":
        case "pending":
            return "warning";
        case "invalid":
        case "rejected":
            return "danger";
        default:
            return "default";
    }
};

export const StepExpedienteModal: React.FC<StepExpedienteModalProps> = ({
    isOpen,
    onClose,
    folderId,
    rfc,
    id
}) => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [docs, setDocs] = React.useState<DocumentoExpediente[]>([]);
    const [selectedDoc, setSelectedDoc] = React.useState<DocumentoExpediente | null>(null);

    const handleClose = () => {
        setSelectedDoc(null);
        onClose();
    };

    const loadDocs = React.useCallback(async () => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        try {
            const res = await VinculacionService.getDocumentosExpediente({
                FolderId: folderId,
                Rfc: rfc,
                Id: id
            });
            setDocs(res?.payload?.document_list ?? []);
        } catch (e: any) {
            setError(e?.message ?? "Error al cargar documentos");
        } finally {
            setLoading(false);
        }
    }, [isOpen, folderId, rfc, id]);

    React.useEffect(() => {
        if (isOpen) {
            loadDocs();
        }
    }, [isOpen, loadDocs]);

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) handleClose();
            }}
            size="5xl"
            scrollBehavior="inside"
            backdrop="blur"
            className="min-w-[80%]"
            placement="top"
        >
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        {selectedDoc ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    isIconOnly
                                    variant="light"
                                    onPress={() => setSelectedDoc(null)}
                                    aria-label="Regresar"
                                >
                                    <Icon icon="lucide:arrow-left" />
                                </Button>
                                <span className="font-semibold text-base">{selectedDoc.name}</span>
                                <Chip color={statusToColor(selectedDoc.status)} variant="flat" className="ml-2 capitalize">
                                    {selectedDoc.status}
                                </Chip>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Icon icon="lucide:folder-open" />
                                <span className="font-semibold text-base">Expediente</span>
                            </div>
                        )}
                    </ModalHeader>

                    <ModalBody>
                        {loading && (
                            <div className="flex justify-center py-8">
                                <Spinner color="primary" />
                            </div>
                        )}

                        {!loading && error && (
                            <div className="text-danger text-sm">{error}</div>
                        )}

                        {!loading && !error && !selectedDoc && (
                            <div className="space-y-3">
                                {docs.map((doc) => (
                                    <div
                                        key={doc.document_id}
                                        className="flex items-center justify-between border rounded-md px-4 py-3 bg-content1"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{doc.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Chip color={statusToColor(doc.status)} variant="dot">
                                                    {doc.status}
                                                </Chip>
                                                {doc.files?.length ? (
                                                    <span className="text-xs text-default-500">
                                                        {doc.files.length} archivo(s)
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-default-400">Sin archivos</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {doc.url_pre && (
                                                <Button
                                                    as="a"
                                                    href={doc.url_pre}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    size="sm"
                                                    variant="ghost"
                                                    startContent={<Icon icon="lucide:external-link" />}
                                                >
                                                    Formato
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                color="primary"
                                                variant="flat"
                                                startContent={<Icon icon="lucide:eye" />}
                                                onPress={() => setSelectedDoc(doc)}
                                            >
                                                Ver detalle
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {docs.length === 0 && (
                                    <div className="text-center py-8 text-default-400 text-sm">
                                        No se encontraron documentos
                                    </div>
                                )}
                            </div>
                        )}

                        {!loading && !error && selectedDoc && (
                            <div className="space-y-4">
                                <div className="text-xs text-default-500">
                                    Documento ID: {selectedDoc.document_id}
                                </div>
                                {/* Vista de administración/carga de archivos */}
                                <DocumentCard />
                            </div>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        {selectedDoc ? (
                            <>
                                <Button variant="light" onPress={() => setSelectedDoc(null)}>
                                    Regresar
                                </Button>
                                <Button color="primary" onPress={handleClose}>
                                    Cerrar
                                </Button>
                            </>
                        ) : (
                            <Button color="primary" onPress={handleClose}>
                                Cerrar
                            </Button>
                        )}
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};
