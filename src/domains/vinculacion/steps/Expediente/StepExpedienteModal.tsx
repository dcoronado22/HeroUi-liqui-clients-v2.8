"use client";

import React from "react";
import { Icon } from "@iconify/react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    Spinner,
    Badge,
    Chip,
    Accordion,
    AccordionItem,
    Progress,
    Divider,
    Input,
    Select,
    SelectItem,
    Tooltip,
} from "@heroui/react";
import type { Selection } from "@heroui/react";
import { DocumentCard } from "./DocumentCard";
import { DocumentListItem } from "./DocumentListItem";
import { getExpedienteStatusLabel } from "./expedienteStatus";
import {
    VinculacionService
} from "@/src/domains/vinculacion/services/vinculacion.service";
import type { DocumentoExpediente } from "@/src/domains/vinculacion/services/vinculacion.service";
// NUEVO: importar grupos definidos
import { groups as DOCUMENT_GROUPS } from "@/types/documentsGroup";

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

// NUEVO: utilidades para categorización basada en documento mapeado
const GENERAL_LABEL = "General";
const normalize = (s?: string | null) =>
    (s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");


const getCompletion = (list: DocumentoExpediente[]) => {
    if (!list.length) return 0;
    const done = list.filter(d => d.status?.toLowerCase() === "valid").length;
    return Math.round((done / list.length) * 100);
};

const percentToColor = (pct: number): "success" | "warning" | "danger" | "default" | "primary" => {
    if (pct === 100) return "success";
    if (pct === 0) return "default";
    return "warning";
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

    // Filtros: búsqueda y estado
    const [query, setQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<Selection>(new Set(["all"]));

    // NUEVO: controlar acordeones abiertos (se mantiene al volver del detalle)
    const [openCategories, setOpenCategories] = React.useState<Selection>(new Set());

    // Aplicar filtros
    const filteredDocs = React.useMemo(() => {
        const term = query.trim().toLowerCase();
        const sel = Array.from(statusFilter)[0] as string | undefined;
        return docs.filter((d) => {
            const matchesQuery = !term || d.name?.toLowerCase().includes(term);
            const s = d.status?.toLowerCase();
            const matchesStatus = !sel || sel === "all" || s === sel;
            return matchesQuery && matchesStatus;
        });
    }, [docs, query, statusFilter]);

    // NUEVO: construir el orden de categorías y el índice de nombres
    const visibleGroups = React.useMemo(
        () => DOCUMENT_GROUPS.filter(g => g.visible !== false),
        []
    );
    const categoryOrder = React.useMemo(
        () => [GENERAL_LABEL, ...visibleGroups.map(g => g.label)], // General primero
        [visibleGroups]
    );
    const nameToCategory = React.useMemo(() => {
        const map = new Map<string, string>();
        for (const g of visibleGroups) {
            for (const dn of g.documents) {
                map.set(normalize(dn), g.label);
            }
        }
        return map;
    }, [visibleGroups]);

    // NUEVO: agrupar por categoría usando el mapeo y fallback "General"
    const groupedByCategory = React.useMemo(() => {
        const groupsMap: Record<string, DocumentoExpediente[]> = {};
        categoryOrder.forEach(lbl => (groupsMap[lbl] = []));
        for (const doc of filteredDocs) {
            const n = normalize(doc.name);
            let cat = nameToCategory.get(n);
            if (!cat) {
                // Fallback por coincidencia parcial
                outer: for (const g of visibleGroups) {
                    for (const dn of g.documents) {
                        if (n.includes(normalize(dn))) {
                            cat = g.label;
                            break outer;
                        }
                    }
                }
            }
            if (!cat) cat = GENERAL_LABEL;
            groupsMap[cat].push(doc);
        }
        return groupsMap;
    }, [filteredDocs, nameToCategory, visibleGroups, categoryOrder]);

    // NUEVO: solo categorías con documentos
    const categoriesToRender = React.useMemo(
        () => categoryOrder.filter((cat) => (groupedByCategory[cat]?.length ?? 0) > 0),
        [categoryOrder, groupedByCategory]
    );

    // NUEVO: expandir únicamente categorías con resultados
    React.useEffect(() => {
        const hasQuery = query.trim().length > 0;
        if (!hasQuery || selectedDoc) return;
        const keys = new Set<React.Key>(categoriesToRender);
        setOpenCategories(keys as Selection);
    }, [query, selectedDoc, categoriesToRender]);

    // NUEVO: progreso global (todas las secciones)
    const overallPct = React.useMemo(() => getCompletion(docs), [docs]);

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
        <Drawer
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) handleClose();
            }}
            classNames={{
                base: "sm:data-[placement=right]:m-7 sm:data-[placement=left]:m-2  rounded-medium",
            }}
            motionProps={{
                variants: {
                    enter: {
                        opacity: 1,
                        y: 0,
                    },
                    exit: {
                        y: 100,
                        opacity: 0,

                    },
                },
            }}
            placement="bottom"
            backdrop="blur"
        >
            <DrawerContent className="max-w-[96.5%] min-h-[93%]">
                <>
                    <DrawerHeader className="flex items-center gap-2">
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
                                    {getExpedienteStatusLabel(selectedDoc.status)}
                                </Chip>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Icon icon="lucide:folder-open" />
                                <span className="font-semibold text-base">Expediente</span>
                            </div>
                        )}
                    </DrawerHeader>

                    <DrawerBody>
                        {/* Controles de búsqueda/filtro y refrescar */}
                        {!selectedDoc && (
                            <div className="mb-2 flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between mx-2">
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        size="sm"
                                        isClearable
                                        value={query}
                                        onValueChange={setQuery}
                                        placeholder="Buscar documento..."
                                        startContent={<Icon icon="lucide:search" />}
                                        onClear={() => setQuery("")}
                                    />
                                    <Select
                                        size="sm"
                                        className="max-w-[220px]"
                                        selectedKeys={statusFilter}
                                        onSelectionChange={setStatusFilter}
                                        aria-label="Filtrar por estado"
                                        selectionMode="single"
                                    >
                                        <SelectItem key="all">Todos</SelectItem>
                                        <SelectItem key="valid">Válido</SelectItem>
                                        <SelectItem key="preparing">Preparando</SelectItem>
                                        <SelectItem key="pending">Pendiente</SelectItem>
                                        <SelectItem key="invalid">Inválido</SelectItem>
                                        <SelectItem key="rejected">Rechazado</SelectItem>
                                    </Select>
                                </div>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    startContent={<Icon icon="lucide:refresh-ccw" />}
                                    isLoading={loading}
                                    onPress={loadDocs}
                                >
                                    Refrescar
                                </Button>
                            </div>
                        )}


                        {loading && (
                            <div className="flex items-center justify-center gap-2 py-8">
                                <Spinner color="primary" />
                                <span className="text-default-500 text-sm">Cargando...</span>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="text-danger text-sm">{error}</div>
                        )}
                        {/* Lista por acordeón con cards mejorados */}
                        {!loading && !error && !selectedDoc && (
                            <div className="space-y-3">

                                {filteredDocs.length > 0 ? (
                                    <Accordion
                                        selectionMode="multiple"
                                        variant="splitted"
                                        // NUEVO: controlado para persistir estado abierto
                                        selectedKeys={openCategories}
                                        onSelectionChange={setOpenCategories}
                                    >
                                        {categoriesToRender.map((cat) => {
                                            const list = groupedByCategory[cat] || [];
                                            const pct = getCompletion(list);
                                            // NUEVO: conteos y bandera de inválidos
                                            const total = list.length;
                                            const validCount = list.filter(d => d.status?.toLowerCase() === "valid").length;
                                            const missing = Math.max(total - validCount, 0);
                                            const hasInvalid = list.some(d => {
                                                const s = d.status?.toLowerCase();
                                                return s === "invalid" || s === "rejected";
                                            });

                                            return (
                                                <AccordionItem
                                                    key={cat}
                                                    aria-label={cat}
                                                    title={
                                                        <div className="flex w-full items-center justify-between py-2">
                                                            <div className="flex items-center gap-2">
                                                                <Icon icon={pct === 100 ? "line-md:folder-check" : "line-md:folder"} />
                                                                <span className="font-medium">{cat}</span>
                                                                {/* NUEVO: chips de totales y faltantes */}
                                                                <Chip size="sm" variant="flat" className="ml-1">
                                                                    {total} docs
                                                                </Chip>
                                                                <Chip
                                                                    size="sm"
                                                                    color={missing > 0 ? "warning" : "success"}
                                                                    variant="flat"
                                                                >
                                                                    {missing} faltan
                                                                </Chip>
                                                                {/* NUEVO: indicador de inválidos */}
                                                                {hasInvalid && (
                                                                    <Tooltip content="Hay documentos inválidos en esta categoría" placement="top">
                                                                        <span className="text-danger">
                                                                            <Icon icon="lucide:alert-triangle" />
                                                                        </span>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Progress
                                                                    aria-label={`Progreso ${cat}`}
                                                                    value={pct}
                                                                    size="sm"
                                                                    color={percentToColor(pct)}
                                                                    className="w-28"
                                                                />
                                                                <Chip size="sm" color={percentToColor(pct)} variant="flat">
                                                                    {pct}%
                                                                </Chip>
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    {list.length ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {list.map((doc) => (
                                                                <DocumentListItem
                                                                    key={doc.document_id}
                                                                    doc={doc}
                                                                    onOpen={() => setSelectedDoc(doc)}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-default-400 text-sm">
                                                            Sin documentos en esta categoría
                                                        </div>
                                                    )}
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                ) : (
                                    <div className="text-center py-8 text-default-400 text-sm">
                                        No se encontraron documentos
                                    </div>
                                )}
                            </div>
                        )}

                        {!loading && !error && selectedDoc && (
                            <div className="">
                                <div className="text-xs text-default-500 ml-6">
                                    Documento ID: {selectedDoc.document_id}
                                </div>
                                <DocumentCard
                                    folderId={folderId}
                                    doc={selectedDoc}
                                />
                            </div>
                        )}
                    </DrawerBody>

                    <DrawerFooter>
                        <div className="flex w-full items-center justify-between pl-3 pr-2">
                            {/* Izquierda: completitud (oculto mientras carga) */}
                            {!loading && (
                                <div className="flex items-center gap-3 py-1">
                                    <Icon icon="lucide:pie-chart" />
                                    <span className="text-sm font-medium">
                                        Completitud de todas las secciones
                                    </span>
                                    <Progress
                                        aria-label="Progreso global"
                                        value={overallPct}
                                        size="sm"
                                        color={percentToColor(overallPct)}
                                        className="w-40"
                                    />
                                    <Chip size="sm" color={percentToColor(overallPct)} variant="flat">
                                        {overallPct}%
                                    </Chip>
                                </div>
                            )}

                            {/* Derecha: botones */}
                            <div className="flex items-center gap-2">
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
                            </div>
                        </div>
                    </DrawerFooter>
                </>
            </DrawerContent>
        </Drawer>
    );
};
