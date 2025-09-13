import React from "react";
import { Card, CardBody, Badge, Divider, Chip, Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

interface Transaction {
    id: string;
    rfc: string;
    rfcTo: string;
    state: number;
    status: number;
    numeroFacturas: number;
    monto: number;
    aforo: number;
    diasPlazo: number;
    fechaCreacion: string;
    stateDescription: string;
    statusDescription: string;
}

interface TransactionCardProps {
    transaction: Transaction;
    variant?: "default" | "compact";
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, variant = "compact" }) => {
    // Format currency with MXN symbol and thousands separators
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Format date to a more readable format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Format percentage
    const formatPercentage = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatShortDate = (dateString: string) =>
        new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
            .format(new Date(dateString));

    // Determine status color based on state
    const getStatus = (): { color: "default" | "success" | "warning" | "primary" | "danger"; bar: string } => {
        switch (transaction.state) {
            case 1: return { color: "success", bar: "bg-success-500" };
            case 2: return { color: "warning", bar: "bg-warning-500" };
            case 3: return { color: "primary", bar: "bg-primary-500" };
            case 4: return { color: "danger", bar: "bg-danger-500" };
            default: return { color: "default", bar: "bg-default-300" };
        }
    };
    const status = getStatus();

    if (variant === "compact") {
        return (
            <Card className="w-full transition-colors" radius="sm">
                <CardBody className="p-0">
                    <div className="flex items-stretch w-full">
                        <div className={`w-1 ${status.bar} rounded-l-sm flex-shrink-0`} />
                        <div className="flex flex-1 items-center justify-between gap-2 px-3 py-2 min-w-0">
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Icon icon="lucide:file-text" className="text-primary-500 text-sm" />
                                <div className="hidden xl:flex flex-col leading-tight">
                                    <span className="text-[10px] text-default-500">RFC</span>
                                    <span className="text-xs font-medium truncate">{transaction.rfcTo}</span>
                                </div>
                            </div>
                            <div className="flex flex-col leading-tight flex-shrink-0">
                                <span className="text-[10px] text-default-500">Monto</span>
                                <span className="text-xs font-semibold">{formatCurrency(transaction.monto)}</span>
                            </div>
                            <div className="flex flex-col leading-tight flex-shrink-0">
                                <span className="text-[10px] text-default-500">Fact.</span>
                                <span className="text-xs font-medium">{transaction.numeroFacturas}</span>
                            </div>
                            <div className="flex flex-col leading-tight flex-shrink-0">
                                <span className="text-[10px] text-default-500">Aforo</span>
                                <span className="text-xs font-medium">{formatPercentage(transaction.aforo)}</span>
                            </div>
                            <div className="flex flex-col leading-tight flex-shrink-0">
                                <span className="text-[10px] text-default-500">Plazo</span>
                                <span className="text-xs font-medium">{(transaction.diasPlazo)} d</span>
                            </div>
                            <div className="hidden lg:flex flex-col leading-tight flex-shrink-0">
                                <span className="text-[10px] text-default-500">Fecha</span>
                                <span className="text-[10px] font-medium">{formatShortDate(transaction.fechaCreacion)}</span>
                            </div>
                            <div className="flex items-center flex-shrink-0">
                                <Chip
                                    color={status.color as any}
                                    variant="flat"
                                    className="text-[10px] font-medium px-2 py-0.5 truncate max-w-[140px]"
                                >
                                    {transaction.stateDescription}
                                </Chip>
                            </div>
                            <div className="flex items-center flex-shrink-0">
                                <Tooltip
                                    content="Ver detalles">
                                    <Button
                                        aria-label="Ver detalles"
                                        color="primary"
                                    >
                                        <Icon icon="line-md:external-link" className="text-base" />
                                    </Button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card
            className="w-full transition-all duration-300 hover:shadow-lg"
            shadow="sm"
        >
            <CardBody className="p-0 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Left status indicator */}
                    <div className={`w-full md:w-2 ${status.bar} flex-shrink-0`}></div>

                    {/* Main content */}
                    <div className="flex flex-col md:flex-row flex-grow p-4 md:p-6 gap-6">
                        {/* Left column - Primary information */}
                        <div className="flex-grow space-y-4">
                            <div className="flex items-center gap-2">
                                <Icon icon="lucide:file-text" className="text-primary-500 text-xl" />
                                <h3 className="text-lg font-semibold text-foreground-800">
                                    Transacción {transaction.id.substring(0, 8)}
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-foreground-400">Monto</p>
                                    <p className="text-xl font-semibold text-foreground-900">{formatCurrency(transaction.monto)}</p>
                                </div>

                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-sm text-foreground-400">Facturas</p>
                                        <div className="flex items-center gap-1">
                                            <Icon icon="lucide:files" className="text-foreground-500" />
                                            <p className="font-medium">{transaction.numeroFacturas}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-foreground-400">Aforo</p>
                                        <div className="flex items-center gap-1">
                                            <Icon icon="lucide:percent" className="text-foreground-500" />
                                            <p className="font-medium">{formatPercentage(transaction.aforo)}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-foreground-400">Plazo</p>
                                        <div className="flex items-center gap-1">
                                            <Icon icon="lucide:calendar" className="text-foreground-500" />
                                            <p className="font-medium">{Math.round(transaction.diasPlazo)} días</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Badge color={status.color} variant="flat" className="px-3 py-1">
                                    {transaction.stateDescription}
                                </Badge>
                            </div>
                        </div>

                        {/* Divider for mobile */}
                        <div className="md:hidden my-4">
                            <Divider />
                        </div>

                        {/* Right column - Secondary information */}
                        <div className="md:w-72 flex-shrink-0 space-y-4">
                            <div className="bg-content2 rounded-md p-3 space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-foreground-500">RFC Emisor</p>
                                    <p className="text-sm font-medium">{transaction.rfc}</p>
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-foreground-500">RFC Receptor</p>
                                    <p className="text-sm font-medium">{transaction.rfcTo}</p>
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-foreground-500">Fecha Creación</p>
                                    <p className="text-sm font-medium">{formatDate(transaction.fechaCreacion)}</p>
                                </div>
                            </div>

                            <div className="bg-content2 rounded-md p-3">
                                <p className="text-xs text-foreground-500 mb-1">Estado</p>
                                <p className="text-sm">{transaction.statusDescription}</p>
                            </div>

                            <div className="flex justify-end">
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors">
                                        <Icon icon="lucide:eye" className="text-lg" />
                                        <span>Ver detalles</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};