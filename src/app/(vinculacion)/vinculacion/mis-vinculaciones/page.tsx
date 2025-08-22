"use client";

import * as React from "react";
import {
    Card, CardBody, CardHeader, Button, Chip, Spinner, Image
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { redirect, useRouter } from "next/navigation";
import { EmpresasService, type Empresa } from "@/src/domains/vinculacion/services/empresas.service";
import { useMsal } from "@azure/msal-react";

function SegmentedProgressBar({ percent, color = "primary" }: { percent: number; color?: "primary" | "success" | "warning" | "danger" }) {
    const segments = 10;
    const filled = Math.max(0, Math.min(segments, Math.ceil((percent / 100) * segments)));
    return (
        <div className="flex items-center gap-1 w-full">
            {Array.from({ length: segments }).map((_, i) => (
                <div
                    key={i}
                    className={`h-3 flex-1 rounded-sm transition-colors`}
                    style={{
                        background: i < filled
                            ? `hsl(var(--heroui-${color}))`
                            : `hsl(var(--heroui-${color}) / 0.25)`,
                    }}
                />
            ))}
            <span className="text-tiny ml-1 tabular-nums">{Math.round(percent)}%</span>
        </div>
    );
}

/** Mapea tu enum/estado del back a porcentaje/tono (ajústalo a tu regla real) */
function getEstadoProgress(idState: number): { percent: number; tone: "primary" | "success" | "warning" | "danger" } {
    // ejemplo rápido:
    // 1=Creando, 2=Clave CIEC, 3=Buro, 4=Firma, 5/6=Avales, 8=Selección, 9=Cargue, 10=Vinculado
    const map: Record<number, number> = { 1: 10, 2: 20, 3: 35, 4: 50, 5: 60, 6: 70, 8: 85, 9: 90, 10: 100 };
    const percent = map[idState] ?? 0;
    const tone = idState === 10 ? "success" : "primary";
    return { percent, tone };
}

export default function MisVinculacionesPage() {
    const router = useRouter();
    const { instance } = useMsal();
    const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
    const email = account?.idTokenClaims?.outputEmail as string || "";

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
        return () => { active = false; };
    }, [email]);

    const goNuevo = () => redirect("/vinculacion/nuevo");

    const openVinculacion = (e: Empresa) => {
        redirect(`/vinculacion/${e.id}?rfc=${encodeURIComponent(e.rfc)}`);
    };

    if (loading) {
        return (
            <div className="w-full h-[70vh] flex flex-col items-center justify-center gap-6">
                <Spinner label="Cargando tus vinculaciones…" />
                <Image alt="LiquiCapital" src="/logo.png" width={180} />
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
                <Button onClick={() => console.log(account)}>test</Button>
            </div>
        );
    }

    return (
        <div className="w-full h-full px-4 py-6 flex justify-center">
            <div className="w-full h-full flex items-center justify-center">
                <Card className="w-full max-w-3xl mb-20">
                    <CardHeader className="flex items-center justify-center">
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:folder-cog" className="text-2xl" />
                            <div className="font-semibold text-lg">Mis vinculaciones</div>
                        </div>
                    </CardHeader>
                    <div className="w-full h-px bg-divider" />
                    <CardBody className="flex flex-col gap-3">
                        {empresas.map((e) => {
                            const { percent, tone } = getEstadoProgress(e.idState);
                            return (
                                <Card
                                    isPressable
                                    key={e.id}
                                    shadow="sm"
                                    className="cursor-pointer hover:shadow-md transition-shadow py-3"
                                    onPress={() => openVinculacion(e)}
                                >
                                    <CardBody className="gap-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold">{e.rfc}</div>
                                                <div className="text-small text-default-500">{e.nombreContribuyente}</div>
                                            </div>
                                            <Chip variant="flat" color={e.idState === 10 ? "success" : "primary"}>
                                                {e.descriptionState}
                                            </Chip>
                                        </div>
                                        <SegmentedProgressBar percent={percent} color={tone} />
                                    </CardBody>
                                </Card>
                            );
                        })}

                        <div className="pt-2">
                            <Button fullWidth color="primary" onPress={goNuevo} startContent={<Icon icon="lucide:plus" />}>
                                Crear nueva vinculación
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}