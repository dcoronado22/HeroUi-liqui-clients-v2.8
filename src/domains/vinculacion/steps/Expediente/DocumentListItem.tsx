"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Card, CardBody, Button, Chip, Tooltip } from "@heroui/react";
import type { DocumentoExpediente } from "@/src/domains/vinculacion/services/vinculacion.service";
import { getExpedienteStatusLabel } from "./expedienteStatus";

// Helpers locales
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

const getStatusIcon = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === "valid") return { icon: "line-md:circle-twotone-to-confirm-circle-transition", color: "text-success" };
    if (s === "preparing" || s === "pending") return { icon: "line-md:alert-circle", color: "text-warning" };
    if (s === "invalid" || s === "rejected") return { icon: "line-md:close-circle", color: "text-danger" };
    return { icon: "lucide:file-text", color: "text-default-400" };
};

type Props = {
    doc: DocumentoExpediente;
    onOpen: () => void;
};

export const DocumentListItem: React.FC<Props> = ({ doc, onOpen }) => {
    // NEW: medir overflow del nombre
    const nameRef = React.useRef<HTMLParagraphElement | null>(null);
    const [isNameOverflowing, setIsNameOverflowing] = React.useState(false);
    // NEW: estado para drag & drop en la card
    const [dragCounter, setDragCounter] = React.useState(0);
    const isDragActive = dragCounter > 0;
    // NEW: detectar arrastre global de archivos
    const [globalDragCounter, setGlobalDragCounter] = React.useState(0);
    const isGlobalDragging = globalDragCounter > 0;
    // NEW: hover de la card
    const [isHovering, setIsHovering] = React.useState(false);
    // NEW: condición para mostrar UI de drop (reemplaza contenido)
    const showDropUI = isDragActive || (isGlobalDragging && isHovering);

    const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types || []).includes("Files");

    // NEW: listeners globales para detectar arrastre de archivos
    React.useEffect(() => {
        const hasFilesTypes = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes("Files");

        const onWinDragEnter = (e: DragEvent) => {
            if (!hasFilesTypes(e)) return;
            setGlobalDragCounter(c => c + 1);
        };
        const onWinDragOver = (e: DragEvent) => {
            if (!hasFilesTypes(e)) return;
            e.preventDefault();
        };
        const onWinDragLeave = (e: DragEvent) => {
            if (!hasFilesTypes(e)) return;
            setGlobalDragCounter(c => Math.max(0, c - 1));
        };
        const resetGlobal = () => setGlobalDragCounter(0);

        window.addEventListener("dragenter", onWinDragEnter);
        window.addEventListener("dragover", onWinDragOver);
        window.addEventListener("dragleave", onWinDragLeave);
        window.addEventListener("drop", resetGlobal);
        window.addEventListener("dragend", resetGlobal);
        return () => {
            window.removeEventListener("dragenter", onWinDragEnter);
            window.removeEventListener("dragover", onWinDragOver);
            window.removeEventListener("dragleave", onWinDragLeave);
            window.removeEventListener("drop", resetGlobal);
            window.removeEventListener("dragend", resetGlobal);
        };
    }, []);

    const onDragEnter = (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(c => c + 1);
    };
    const onDragOver = (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
    };
    const onDragLeave = (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(c => Math.max(0, c - 1));
    };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(0);
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            // Abrir el detalle y luego despachar el evento para que lo consuma DocumentCard
            onOpen();
            const ev = new CustomEvent("expediente:drop-files", {
                detail: { documentId: doc.document_id, files }
            } as any);
            setTimeout(() => window.dispatchEvent(ev), 300);
        }
    };

    React.useEffect(() => {
        const el = nameRef.current;
        if (!el) return;
        const check = () => setIsNameOverflowing(el.scrollWidth > el.clientWidth);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [doc?.name]);

    const { icon, color } = getStatusIcon(doc.status);

    return (
        <Card
            isPressable
            onPress={onOpen}
            shadow="sm"
            radius="lg"
            className={`group w-full border border-default-200 bg-content1 transition-colors hover:shadow-md ${showDropUI ? "ring-2 ring-primary/50 bg-primary/5" : "hover:bg-content2"}`}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onMouseEnter={() => setIsHovering(true)}   // NEW
            onMouseLeave={() => setIsHovering(false)}  // NEW
        >
            <CardBody className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 ">
                {showDropUI ? (
                    // NEW: reemplazar contenido mientras se arrastra archivo (drop target)
                    <div className="w-full py-0">
                        <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/60 rounded-lg py-1 bg-primary-50">
                            <Icon icon="lucide:upload-cloud" className="text-2xl text-primary" />
                            <p className="text-sm font-medium text-primary">
                                Suelta para subir a este documento
                            </p>
                            <p className="text-xs text-default-500">o continúa arrastrando a otra tarjeta</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-md shrink-0">
                                <Icon icon={icon} className={`text-2xl ${color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                                {/* NEW: tooltip condicional cuando el nombre se trunca */}
                                {isNameOverflowing ? (
                                    <Tooltip content={doc.name} placement="top" offset={6}>
                                        <p
                                            ref={nameRef}
                                            className="font-medium text-sm leading-tight truncate"
                                        >
                                            {doc.name}
                                        </p>
                                    </Tooltip>
                                ) : (
                                    <p
                                        ref={nameRef}
                                        className="font-medium text-sm leading-tight truncate"
                                    >
                                        {doc.name}
                                    </p>
                                )}

                                <div className="flex items-center gap-3 mt-2">
                                    <Chip color={statusToColor(doc.status)} variant="dot" className="capitalize" size="sm">
                                        {getExpedienteStatusLabel(doc.status)}
                                    </Chip>
                                    {doc.files?.length ? (
                                        <span className="text-xs text-default-500">
                                            {doc.files.length} archivo(s)
                                        </span>
                                    ) : (
                                        <span className="text-xs text-default-400">Sin archivos</span>
                                    )}
                                    <span className="text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ver detalle
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            {doc.url_pre && (
                                <Tooltip content="Ver formato" placement="top">
                                    <Button
                                        as="a"
                                        href={doc.url_pre}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        isIconOnly
                                        size="sm"
                                        variant="ghost"
                                        radius="full"
                                        onClick={(e) => e.stopPropagation()}
                                        startContent={<Icon icon="lucide:external-link" />}
                                        aria-label="Abrir formato en nueva pestaña"
                                    />
                                </Tooltip>
                            )}
                            <Tooltip content="Ver detalle" placement="top">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    radius="full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpen();
                                    }}
                                    startContent={<Icon icon="lucide:eye" />}
                                    aria-label="Ver detalle del documento"
                                />
                            </Tooltip>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
};
