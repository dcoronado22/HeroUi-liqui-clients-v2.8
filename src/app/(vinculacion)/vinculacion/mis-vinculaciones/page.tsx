"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import * as React from "react";
import {
    Card, CardBody, CardHeader, Button, Chip, Spinner, Image, Progress, ScrollShadow,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { redirect } from "next/navigation";
import { EmpresasService, type Empresa } from "@/src/domains/vinculacion/services/empresas.service";
import { useMsal } from "@azure/msal-react";

/** Barra segmentada compacta (con % al final) */
function SegmentedProgressBar({
    percent,
    color = "primary",
}: {
    percent: number;
    color?: "primary" | "success" | "warning" | "danger";
}) {
    const segments = 10;
    const filled = Math.max(0, Math.min(segments, Math.ceil((percent / 100) * segments)));
    return (
        <div className="flex items-center gap-1 w-full">
            {Array.from({ length: segments }).map((_, i) => (
                <div
                    key={i}
                    className="h-3 flex-1 rounded-sm transition-colors"
                    style={{
                        background:
                            i < filled
                                ? `hsl(var(--heroui-${color}))`
                                : `hsl(var(--heroui-${color}) / 0.22)`,
                    }}
                />
            ))}
            <span className="text-tiny ml-1 tabular-nums">{Math.round(percent)}%</span>
        </div>
    );
}

/** Mapea tu enum/estado del back a porcentaje/tono (ajústalo si quieres otra curva) */
function getEstadoProgress(
    idState: number
): { percent: number; tone: "primary" | "success" | "warning" | "danger" } {
    const map: Record<number, number> = {
        1: 10,  // Creando
        2: 20,  // Clave CIEC
        3: 35,  // Datos Buró
        4: 50,  // Firma MiFiel
        5: 60,  // Datos Avales
        6: 70,  // Firma Avales
        8: 85,  // Selección clientes
        9: 90,  // Cargue expediente
        10: 100 // Vinculado
    };
    const percent = map[idState] ?? 0;
    const tone = idState === 10 ? "success" : "primary";
    return { percent, tone };
}

export default function MisVinculacionesPage() {
    const { instance } = useMsal();
    const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
    const email = (account?.idTokenClaims as any)?.outputEmail as string || "";

    const [loading, setLoading] = React.useState(true);
    const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
    const [alianza, setAlianza] = React.useState<any>(null);

    React.useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                const res = await EmpresasService.getEmpresasUsuario({ email });
                if (!active) return;
                setEmpresas(res.empresas ?? []);
                setAlianza(res.alianza ?? null);
            } catch (e) {
                console.error("getEmpresasUsuario error", e);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [email]);

    const goNuevo = () => redirect("/vinculacion/nuevo");
    const openVinculacion = (e: Empresa) => {
        redirect(`/vinculacion/${e.id}?rfc=${encodeURIComponent(e.rfc)}`);
    };

    if (loading) {
        return (
            <div className="w-full h-[70vh] flex flex-col items-center justify-center gap-6">
                <Spinner label="Cargando tus vinculaciones…" />
                <Image alt="LiquiCapital" className="dark:filter-none filter invert" src="/logo.png" width={180} />
            </div>
        );
    }

    if (!empresas?.length) {
        return (
            <div className="w-full h-[70vh] flex flex-col items-center justify-center gap-4">
                <Icon icon="lucide:briefcase" className="text-3xl text-default-500" />
                <p className="text-default-600">Aún no tienes vinculaciones.</p>
                <Button color="primary" onPress={goNuevo} startContent={<Icon icon="lucide:plus" />}>
                    Crear nueva vinculación
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
            {/* Header tipo dashboard */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Mis vinculaciones</h1>
                    <p className="text-default-500">
                        Tienes {empresas.length} {empresas.length === 1 ? "proceso" : "procesos"} en curso.
                    </p>
                </div>
                <Button color="primary" startContent={<Icon icon="lucide:plus" />} onPress={goNuevo}>
                    Nueva vinculación
                </Button>
            </div>

            {/* Lista con scroll y sombras */}
            <ScrollShadow className="flex flex-col gap-3 max-h-[70vh] pr-1" hideScrollBar size={28}>
                {empresas.map((e) => {
                    const { percent, tone } = getEstadoProgress(e.idState);
                    const done = e.idState === 10;

                    return (
                        <Card
                            key={e.id}
                            shadow="sm"
                            className="border border-default-200 bg-content1/60 hover:bg-content1 transition-colors cursor-pointer"
                            isPressable
                            onPress={() => openVinculacion(e)}
                        >
                            <CardHeader className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-large bg-content2 flex items-center justify-center">
                                        <Icon
                                            icon={
                                                done
                                                    ? "line-md:check-all"
                                                    : e.idState >= 8
                                                        ? "lucide:list-checks"
                                                        : e.idState >= 4
                                                            ? "lucide:signature"
                                                            : e.idState >= 3
                                                                ? "lucide:file-text"
                                                                : e.idState >= 2
                                                                    ? "lucide:key-round"
                                                                    : "lucide:clipboard-edit"
                                            }
                                            className={done ? "text-success" : "text-primary"}
                                            width={20}
                                        />
                                    </div>
                                    <div>
                                        <div className="font-semibold">{e.rfc}</div>
                                        <div className="text-small text-default-500">{e.nombreContribuyente}</div>
                                    </div>
                                </div>

                                <Chip
                                    variant="flat"
                                    color={done ? "success" : "primary"}
                                    startContent={<Icon icon={done ? "line-md:check-all" : "lucide:clock"} />}
                                    className="capitalize"
                                >
                                    {e.descriptionState}
                                </Chip>
                            </CardHeader>

                            <CardBody className="pt-0">
                                <SegmentedProgressBar percent={percent} color={tone} />
                            </CardBody>
                        </Card>
                    );
                })}

                {/* CTA “Agregar nuevo” al final (borde punteado) */}
                <Card
                    className="mt-2 border border-dashed border-default-300 bg-content1/40 hover:bg-content1 transition-colors"
                    isPressable
                    onPress={goNuevo}
                >
                    <CardBody className="h-24 flex items-center justify-center gap-2">
                        <Icon icon="lucide:plus" />
                        <span className="font-medium">Agregar nueva vinculación</span>
                    </CardBody>
                </Card>
            </ScrollShadow>
        </div>
    );
}