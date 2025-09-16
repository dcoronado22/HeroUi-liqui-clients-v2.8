"use client";

import * as React from "react";
import { Card, CardBody, Tooltip, Chip, Card as HeroCard } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { EstadosFinancierosCard } from "../components/EstadosFinancierosCard";

type Props = {
    detalle: any;
    isEvaluating?: boolean;
    allValid?: boolean;
};

export default function StepPendientes({ detalle, isEvaluating = false, allValid = false }: Props) {
    const data = detalle?.responseData ?? detalle;

    let validations = [
        { key: "finanzas", name: "Razones financieras", valid: data?.RazonesFinancierasValidas, icon: "lucide:trending-up" },
        { key: "docs", name: "Documentos cargados", valid: data?.DocumentsIsValid, icon: "lucide:folder-open" },
        { key: "buro", name: "Buró de crédito", valid: data?.BuroValido, icon: "lucide:shield-check" },
        { key: "escritura", name: "Acta constitutiva", valid: data?.EscrituraDataValida, icon: "lucide:file-text" },
        { key: "apoderado", name: "Apoderado legal", valid: data?.ApoderadoLegalDataValida, icon: "lucide:user-check" },
        { key: "cuenta", name: "Estado de cuenta", valid: data?.DesembolsoDataValida, icon: "lucide:wallet" },
    ];

    // NUEVO: Si allValid, fuerza todos los pasos como válidos
    if (allValid) {
        validations = validations.map(v => ({ ...v, valid: true }));
    }

    const documents = data?.Payload?.document_list ?? [];
    const completedSteps = validations.filter(v => v.valid === true).length;
    const progressPercentage = (completedSteps / validations.length) * 100;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card shadow="none">
                <CardBody className="p-3">
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-4 px-3">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="text-lg font-bold ">
                                        {isEvaluating ? "Validando..." : "Pendientes de Validación"}
                                    </h2>
                                    <p className="text-sm text-gray-500 ">
                                        Completa los siguientes pasos para finalizar la vinculación
                                    </p>
                                </div>
                            </div>
                            <Chip
                                color={progressPercentage === 100 ? "success" : (isEvaluating ? "primary" : "warning")}
                                variant="flat"
                                size="md"
                                className="font-semibold"
                            >
                                {completedSteps}/{validations.length} completados
                            </Chip>
                        </div>
                    </div>

                    <VerticalTimeline
                        validations={validations}
                        documents={documents}
                        detalle={detalle}
                        isEvaluating={isEvaluating} // 👈 pásalo al timeline
                    />
                </CardBody>
            </Card>
        </motion.div>
    );
}

interface VerticalTimelineProps {
    validations: { key: string; name: string; valid: boolean | undefined; icon: string }[];
    documents: any[];
    detalle: any;
    isEvaluating: boolean;
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ validations, documents, detalle, isEvaluating }) => {
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
    };

    const invalidDocs = documents.filter((doc) =>
        ["preparing", "invalid", "reviewing"].includes(String(doc.status || "").toLowerCase())
    );

    const toggleExpanded = (key: string) => {
        setExpandedItems(prev => {
            const ns = new Set(prev);
            ns.has(key) ? ns.delete(key) : ns.add(key);
            return ns;
        });
    };

    return (
        <motion.div className="relative" variants={containerVariants} initial="hidden" animate="show">
            <div className="absolute left-[24px] ml-3 top-8 bottom-8 w-[2px] bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200" />

            {validations.map((val, i) => {
                // Tri-estado + dependencia del request real
                let status: "loading" | "success" | "error" | "pending";
                if (isEvaluating) {
                    status = "loading"; // 👈 mientras corre state=9, TODO muestra spinner
                } else if (val.valid === true) {
                    status = "success";
                } else if (val.valid === false) {
                    // Caso especial: buró "no valid" lo mostramos como pendiente (suele demorar)
                    status = val.key === "buro" ? "pending" : "error";
                } else {
                    // undefined (no vino flag) → pendiente, no error
                    status = "pending";
                }

                let subtitle: string | undefined;
                if (val.key === "docs") {
                    subtitle = val.valid
                        ? "Todos los documentos están validados correctamente"
                        : `${invalidDocs.length} documento(s) pendientes de validación`;
                } else if (val.key === "finanzas") {
                    subtitle = val.valid
                        ? "Todas las razones financieras están validadas"
                        : "Revisión de razones financieras requerida";
                } else if (val.key === "buro") {
                    subtitle = val.valid
                        ? "Buró de crédito validado correctamente"
                        : "El buró de crédito está pendiente de validación";
                } else {
                    subtitle = val.valid
                        ? "Validación completada exitosamente"
                        : "Este paso está pendiente o ha sido rechazado";
                }

                const hasDetails =
                    (val.key === "docs" && !val.valid && invalidDocs.length > 0) ||
                    (val.key === "finanzas" && !val.valid);

                return (
                    <motion.div key={`val-${val.key}`} className="mb-[4.2dvh] last:mb-0 px-3" variants={itemVariants}>
                        <TimelineItem
                            title={val.name}
                            subtitle={subtitle}
                            status={status}
                            icon={val.icon}
                            isLast={i === validations.length - 1}
                            hasDetails={hasDetails}
                            isExpanded={expandedItems.has(val.key)}
                            onToggle={() => hasDetails && toggleExpanded(val.key)}
                        />

                        {/* Detalle documentos */}
                        <AnimatePresence>
                            {val.key === "docs" && !val.valid && invalidDocs.length > 0 && expandedItems.has(val.key) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="ml-16 mt-3 overflow-hidden"
                                >
                                    <HeroCard shadow="sm">
                                        <CardBody className="p-4">
                                            <div className="space-y-3">
                                                {invalidDocs.map((doc: any) => (
                                                    <DocumentItem key={doc.document_id} doc={doc} />
                                                ))}
                                            </div>
                                        </CardBody>
                                    </HeroCard>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Detalle finanzas */}
                        <AnimatePresence>
                            {val.key === "finanzas" && !val.valid && expandedItems.has(val.key) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="ml-16 mt-3 overflow-hidden"
                                >
                                    <HeroCard shadow="sm">
                                        <CardBody className="p-4">
                                            <EstadosFinancierosCard
                                                rfc={detalle?.vinculacion?.datosRegistroVinculacion?.rfc}
                                                id={detalle?.vinculacion?.id}
                                            />
                                        </CardBody>
                                    </HeroCard>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};

interface TimelineItemProps {
    title: string;
    status: "success" | "pending" | "error" | "loading";
    icon: string;
    isLast: boolean;
    subtitle?: string;
    hasDetails?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
    title, subtitle, status, icon, isLast, hasDetails, isExpanded, onToggle
}) => {
    const statusConfig = {
        loading: {
            iconStatus: "line-md:loading-alt-loop",
            color: "text-primary-500 dark:text-primary-400",
            bgColor: "bg-primary-50 dark:bg-primary-900",
            borderColor: "border-primary-200 dark:border-primary-400",
            tooltip: "Validando…",
            spin: true,
            badge: { color: "primary", text: "Validando" }
        },
        success: {
            iconStatus: "lucide:check",
            color: "text-success-600 dark:text-success-400",
            bgColor: "bg-success-50 dark:bg-success-900",
            borderColor: "border-success-200 dark:border-success-400",
            tooltip: "Validado correctamente",
            spin: false,
            badge: { color: "success", text: "Completado" }
        },
        pending: {
            iconStatus: "lucide:clock",
            color: "text-warning-600 dark:text-warning-900",
            bgColor: "bg-yellow-50 dark:bg-yellow-600",
            borderColor: "border-yellow-200 dark:border-yellow-400",
            tooltip: "Pendiente de validación",
            spin: false,
            badge: { color: "warning", text: "Pendiente" }
        },
        error: {
            iconStatus: "lucide:x",
            color: "text-danger-600 dark:text-danger-400",
            bgColor: "bg-danger-50 dark:bg-danger-800",
            borderColor: "border-danger-200 dark:border-danger-400",
            tooltip: "Requiere atención",
            spin: false,
            badge: { color: "danger", text: "Pendiente" }
        },
    } as const;

    const cfg = statusConfig[status];

    return (
        <div
            className={`flex gap-4 group hover:shadow-md hover:p-2 transition-all rounded-xl ${hasDetails ? "cursor-pointer" : ""} hover:bg-gray-100 dark:hover:bg-gray-800`}
            onClick={hasDetails ? onToggle : undefined}
        >
            <Tooltip content={cfg.tooltip} placement="right">
                <div className={`relative z-10 rounded-full w-12 h-12 flex items-center justify-center ${cfg.bgColor} ${cfg.borderColor} border-2 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                    <div className="relative">
                        <Icon icon={icon} className={`text-xl ${cfg.color}`} />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${cfg.bgColor} ${cfg.borderColor} border`}>
                            <Icon icon={cfg.iconStatus} className={`text-xs ${cfg.color} ${cfg.spin ? "animate-spin" : ""}`} />
                        </div>
                    </div>
                </div>
            </Tooltip>

            <div className="flex-1 pt-0 flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-0">
                        <h4 className="text-lg font-semibold">{title}</h4>
                        <Chip color={cfg.badge.color as any} variant="flat" size="sm" className="font-medium">
                            {cfg.badge.text}
                        </Chip>
                    </div>
                    {subtitle && <p className="text-sm leading-relaxed">{subtitle}</p>}
                </div>
                {hasDetails && (
                    <div className="flex items-center h-full">
                        <Icon
                            icon={isExpanded ? "lucide:chevron-up" : "lucide:chevron-down"}
                            className="text-2xl text-gray-400 ml-2 transition-transform mr-2"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

interface DocumentItemProps { doc: any; }
const DocumentItem: React.FC<DocumentItemProps> = ({ doc }) => {
    const statusColors = {
        preparing: { bg: "bg-warning-100", text: "text-warning-700", icon: "lucide:clock", border: "border-gray-200" },
        invalid: { bg: "bg-red-50", text: "text-red-700", icon: "lucide:alert-circle", border: "border-gray-200" },
        reviewing: { bg: "bg-blue-50", text: "text-blue-700", icon: "lucide:eye", border: "border-gray-200" },
    } as const;

    const status = String(doc.status || "preparing").toLowerCase() as keyof typeof statusColors;
    const colors = statusColors[status] ?? statusColors.preparing;

    return (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border} hover:shadow-sm transition-shadow`}
        >
            <Icon icon={colors.icon} className={`text-xl ${colors.text}`} />
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                <p className={`text-xs ${colors.text} mt-0.5`}>Estado: {doc.status}</p>
            </div>
            {doc.url_pre && (
                <a href={doc.url_pre} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg transition-colors">
                    <Icon icon="lucide:external-link" className="text-gray-500 text-sm" />
                </a>
            )}
        </motion.div>
    );
};