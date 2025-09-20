// src/app/(vinculacion)/vinculacion/nuevo/page.tsx
"use client";

// en app/vinculacion/nuevo/page.tsx
export const dynamic = "force-dynamic";


import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Input, Checkbox, Button, Divider, CardFooter, cn } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { useAuthStore } from "@liquicapital/common";
import VerticalStepper from "@/src/shared/components/Stepper/VerticalStepper";
import type { StepDef } from "@/src/shared/types/stepper";
import { VinculacionService } from "@/src/domains/vinculacion/services/vinculacion.service";
import StepActions from "@/src/shared/components/Stepper/StepActions";
import { Icon } from "@iconify/react";
import { STEPS } from "@/src/domains/vinculacion/steps";
import { useVinculacionFlow } from "@/src/domains/vinculacion/context/flow-context";

const ALLIANCE_CODE = "8";

// Mismo juego de pasos del flujo, con "registro" como step inicial
type Ctx = { aplicaAval: boolean; personaMoral: boolean };

export default function VinculacionNuevoPage() {
    const router = useRouter();
    const { email: authEmail } = useAuthStore();

    // ---- Stepper (solo visual, no clickeable en "nuevo")
    const [ctx] = React.useState<Ctx>({ aplicaAval: false, personaMoral: false });
    const [currentId] = React.useState("registro");

    // ---- Form (mínimo necesario)
    const [submitting, setSubmitting] = React.useState(false);
    const [rfc, setRfc] = React.useState("");
    const [razonSocial, setRazonSocial] = React.useState("");
    const [nombres, setNombres] = React.useState("");
    const [apellidoPaterno, setApellidoPaterno] = React.useState("");
    const [apellidoMaterno, setApellidoMaterno] = React.useState("");
    const [nacionalidad, setNacionalidad] = React.useState("MÉXICO");
    const [telefono, setTelefono] = React.useState("");
    const [whatsapp, setWhatsapp] = React.useState("");
    const [email, setEmail] = React.useState(authEmail ?? "");
    const [avisoPrivacidad, setAvisoPrivacidad] = React.useState(false);
    const [personaConAE, setPersonaConAE] = React.useState(false);

    // Representante legal (PM)
    const [nombresRep, setNombresRep] = React.useState("");
    const [apPatRep, setApPatRep] = React.useState("");
    const [apMatRep, setApMatRep] = React.useState("");
    const [emailRep, setEmailRep] = React.useState("");

    const isPersonaMoral = rfc.trim().length === 12;
    const isPersonaFisica = rfc.trim().length > 12; // normalmente 13

    const tipoContribuyente = React.useMemo<0 | 1 | 2>(() => {
        if (isPersonaMoral) return 0 as const;             // PM
        if (isPersonaFisica && personaConAE) return 2 as const; // PF con AE
        if (isPersonaFisica) return 1 as const;            // PF
        return 0 as const;
    }, [isPersonaMoral, isPersonaFisica, personaConAE]);

    const handleRFC = (v: string) => setRfc(v.toUpperCase());
    const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    const isValidPhone10 = (v: string) => /^\d{10}$/.test(v);

    const canSubmit = React.useMemo(() => {
        if (!rfc || !(isPersonaMoral || isPersonaFisica)) return false;
        if (!isValidPhone10(telefono)) return false;
        if (whatsapp && !isValidPhone10(whatsapp)) return false;
        if (!avisoPrivacidad) return false;

        if (isPersonaMoral) {
            if (!razonSocial) return false;
            if (!nombresRep || !apPatRep || !apMatRep) return false;
            if (!isValidEmail(emailRep || "")) return false;
            return true;
        } else {
            if (!nombres || !apellidoPaterno || !apellidoMaterno) return false;
            if (!isValidEmail(email || "")) return false;
            if (!nacionalidad) return false;
            return true;
        }
    }, [
        rfc, isPersonaMoral, isPersonaFisica,
        telefono, whatsapp, avisoPrivacidad,
        razonSocial, nombresRep, apPatRep, apMatRep, emailRep,
        nombres, apellidoPaterno, apellidoMaterno, email, nacionalidad
    ]);

    const flow = useVinculacionFlow();

    React.useEffect(() => {
        // Resetear siempre al montar
        flow.reset();
    }, [])

    const onSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!canSubmit || submitting) return;

        try {
            setSubmitting(true);

            const body = {
                state: 1 as const,
                requestData: {
                    datosRegistroVinculacion: {
                        id: "",
                        rfc,
                        razonSocial: isPersonaMoral ? razonSocial : "",
                        nombres: isPersonaFisica ? nombres : "",
                        apellidoPaterno: isPersonaFisica ? apellidoPaterno : "",
                        apellidoMaterno: isPersonaFisica ? apellidoMaterno : "",
                        telefono,
                        whatsapp,
                        personaConActividadesEmpresariales: isPersonaFisica ? personaConAE : false,
                        nombresRepLegal: isPersonaMoral ? nombresRep : "",
                        apellidoPaternoRepLegal: isPersonaMoral ? apPatRep : "",
                        apellidoMaternoRepLegal: isPersonaMoral ? apMatRep : "",
                        email: isPersonaMoral ? (emailRep || "") : (email || ""),
                        confirmaEmail: isPersonaMoral ? (emailRep || "") : (email || ""),
                        avisoPrivacidad,
                        tipoContribuyente,
                        nacionalidad: isPersonaFisica ? (nacionalidad || "") : "MÉXICO",
                    },
                    allianceCode: ALLIANCE_CODE,
                    rfc, // el back también lo espera aquí
                },
            };

            const res = await VinculacionService.crear(body);
            const ok = res?.responseData?.Succeeded === true;
            const nextId = res?.responseData?.Id as string | undefined;

            if (ok && nextId) {
                addToast({ title: "Vinculación creada", description: "Redirigiendo…", color: "success" });
                // (Más adelante: setear {id,rfc} en FlowContext)
                router.replace(`/vinculacion/${encodeURIComponent(nextId)}?rfc=${encodeURIComponent(rfc)}`);
                return;
            }

            const rc = res?.responseData?.ReasonCode?.Value;
            const rd = res?.responseData?.ReasonCode?.Description;
            addToast({
                title: "No se pudo crear",
                description: rd ? `${rc} - ${rd}` : "Inténtalo de nuevo",
                color: "danger",
            });
        } catch (err) {
            console.error(err);
            addToast({
                title: "Error de red",
                description: "No fue posible crear la vinculación",
                color: "danger",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const collapsed = flow.sidebarCollapsed;

    return (
        <div className="w-full h-screen px-4 py-6 flex flex-col">

            <div className="flex min-h-0 gap-4 h-[88dvh]">
                {/* LEFT: Stepper (solo visual en 'nuevo') */}
                <Card
                    className={cn(
                        "shrink-0 h-full transition-all duration-300 overflow-hidden",
                        collapsed ? "w-[5.3%]" : "basis-[20%]"
                    )}
                >
                    <CardBody className="h-full overflow-auto">
                        <VerticalStepper
                            steps={STEPS}
                            ctx={ctx}
                            currentId={currentId}
                            onChange={() => { /* no-op: forward-only en 'nuevo' */ }}
                            clickable={false}
                            compact={collapsed}
                        />
                    </CardBody>
                </Card>

                {/* RIGHT: Formulario de creación */}
                <Card className="flex-1 h-full">
                    <CardBody className="h-full overflow-auto px-8 py-8">
                        <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-full">
                            <div className="flex items-center gap-2">
                                <Icon icon="lucide:clipboard-edit" className="text-2xl mr-2" />
                                <div className="font-semibold text-2xl text-default-600">Nueva vinculación</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3  mt-5">
                                <Input
                                    label="RFC"
                                    value={rfc}
                                    variant="faded"
                                    onValueChange={(v) => handleRFC(v)}
                                    placeholder="Ej. ABC123456789"
                                    isRequired
                                />
                                {isPersonaMoral && (<Input variant="faded" label="Razón social" value={razonSocial} onValueChange={setRazonSocial} isRequired />)}
                            </div>

                            {isPersonaMoral ? (
                                <>
                                    <Divider className="my-2" />
                                    <h2 className="font-medium">Persona moral</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input variant="faded" label="Nombres rep. legal" value={nombresRep} onValueChange={setNombresRep} isRequired />
                                        <Input variant="faded" label="Apellido paterno rep." value={apPatRep} onValueChange={setApPatRep} isRequired />

                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input variant="faded" label="Apellido materno rep." value={apMatRep} onValueChange={setApMatRep} isRequired />
                                        <Input
                                            label="Email"
                                            variant="faded"
                                            type="email"
                                            value={emailRep}
                                            onValueChange={setEmailRep}
                                            isRequired
                                        />
                                    </div>
                                </>
                            ) : isPersonaFisica ? (
                                <>
                                    <Divider className="my-2" />
                                    <h2 className="font-medium">Persona física</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Input variant="faded" label="Nombres" value={nombres} onValueChange={setNombres} isRequired />
                                        <Input variant="faded" label="Apellido paterno" value={apellidoPaterno} onValueChange={setApellidoPaterno} isRequired />
                                        <Input variant="faded" label="Apellido materno" value={apellidoMaterno} onValueChange={setApellidoMaterno} isRequired />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Input
                                            label="Nacionalidad"
                                            variant="faded"
                                            value={nacionalidad}
                                            onValueChange={setNacionalidad}
                                            description="Ej. MÉXICO"
                                            isRequired
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <Checkbox isSelected={personaConAE} onValueChange={setPersonaConAE}>
                                            ¿Realizas actividades empresariales?
                                        </Checkbox>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input variant="faded" label="Email" type="email" value={email} onValueChange={setEmail} isRequired />
                                        <Input
                                            variant="faded"
                                            label="WhatsApp (opcional)"
                                            value={whatsapp}
                                            onValueChange={(v) => setWhatsapp(v.replace(/\D/g, "").slice(0, 10))}
                                        />
                                    </div>

                                </>
                            ) : (
                                <p className="text-tiny text-default-500">
                                    Escribe el RFC para continuar (12 dígitos = persona moral, 13 = persona física)
                                </p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                    variant="faded"
                                    label="Teléfono (10 dígitos)"
                                    value={telefono}
                                    onValueChange={(v) => setTelefono(v.replace(/\D/g, "").slice(0, 10))}
                                    isRequired
                                />
                                <Input
                                    variant="faded"
                                    label="WhatsApp (opcional)"
                                    value={whatsapp}
                                    onValueChange={(v) => setWhatsapp(v.replace(/\D/g, "").slice(0, 10))}
                                />
                            </div>

                            <Checkbox isSelected={avisoPrivacidad} onValueChange={setAvisoPrivacidad}>
                                Acepto el <a className="underline" href="/aviso-privacidad" target="_blank">aviso de privacidad</a>
                            </Checkbox>
                        </form>
                    </CardBody>
                    <CardFooter className="text-tiny text-default-500">
                        <StepActions
                            // En “nuevo”, normalmente no hay “Anterior”
                            disablePrev
                            onNext={() => onSubmit()}       // puedes llamar tu handler de submit
                            disableNext={!canSubmit || submitting}
                            loadingNext={submitting}
                        />
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
