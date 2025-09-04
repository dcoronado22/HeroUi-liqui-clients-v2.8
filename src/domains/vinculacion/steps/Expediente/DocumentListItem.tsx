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
            className="group w-full border border-default-200 bg-content1 hover:bg-content2 transition-colors hover:shadow-md"
        >
            <CardBody className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 ">
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
                            <span className="text-xs text-default-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </CardBody>
        </Card>
    );
};
