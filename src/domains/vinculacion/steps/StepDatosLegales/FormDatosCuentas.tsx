import React from "react";
import { Form, Input, Select, SelectItem, Button, Autocomplete, AutocompleteItem, DrawerBody, DrawerFooter, DrawerContent, Drawer, DrawerHeader, Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import { bancos } from "@/config/constants";
import { OperacionService } from "@/src/domains/operacion/services/operacion.service";
import { normalize } from "../helpers";
import { VinculacionService } from "@/src/domains/vinculacion/services/vinculacion.service";
import { addToast } from "@heroui/toast";
import { useVinculacionFlow } from "@/src/domains/vinculacion/context/flow-context";

type FormDataType = {
    banco: string;
    beneficiario: string;
    numeroCuenta: string;
    clabe: string;
    certificacionBancaria: File | string | null;
};

type ErrorsType = Partial<Record<keyof FormDataType, string>>;

type Props = {
    initialData?: Partial<FormDataType>;
    onValidityChange?: (isValid: boolean) => void;
    onChange?: (data: FormDataType) => void;
};

export default function FormDatosCuentas({ initialData, onValidityChange, onChange }: Props) {
    const [formData, setFormData] = React.useState<FormDataType>({
        banco: "",
        beneficiario: "",
        numeroCuenta: "",
        clabe: "",
        certificacionBancaria: null
    });

    const [errors, setErrors] = React.useState<ErrorsType>({});
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [openPreview, setOpenPreview] = React.useState(false);
    const [loadingPreview, setLoadingPreview] = React.useState(false);
    const [secureUrl, setSecureUrl] = React.useState<string | null>(null);

    const hydratingRef = React.useRef(false);
    const { id, rfc } = useVinculacionFlow();

    React.useEffect(() => {
        if (initialData) {
            const bancoValue = bancos.find(
                b => normalize(b.label) === normalize(initialData.banco as string)
            )?.value;

            hydratingRef.current = true;
            setFormData({
                banco: bancoValue ?? "",
                beneficiario: initialData.beneficiario ?? "",
                numeroCuenta: initialData.numeroCuenta ?? "",
                clabe: initialData.clabe ?? "",
                certificacionBancaria: initialData.certificacionBancaria ?? null,
            });
        }
    }, [initialData]);

    React.useEffect(() => {
        const isValid = validateForm();

        // Convertir VALUE → LABEL para enviar al padre
        const bancoLabel = bancos.find(b => b.value === formData.banco)?.label ?? "";

        const toParent = {
            ...formData,
            banco: bancoLabel,
        } as FormDataType;

        onValidityChange?.(isValid);

        if (hydratingRef.current) {
            hydratingRef.current = false;
            return;
        }
        onChange?.(toParent);
    }, [formData]);

    const handleInputChange = (field: keyof FormDataType, value: any) => {
        setFormData({
            ...formData,
            [field]: value
        });
        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: undefined
            });
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!id || !rfc) {
            addToast({ title: "Error", description: "Faltan datos de id o rfc", color: "danger" });
            return;
        }
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = (e.target?.result as string).split(",")[1];
                const res = await VinculacionService.uploadDocument({
                    id,
                    rfc,
                    fileName: "certificacionBancaria",
                    contentType: "application/pdf",
                    Base64Data: base64,
                    useTemp: false,
                });
                if (res.succeeded) {
                    addToast({ title: "Documento subido", description: res.reasonCode.description, color: "success" });
                    setFormData(f => ({
                        ...f,
                        certificacionBancaria: res.fileName,
                    }));
                } else {
                    addToast({ title: "Error al subir", description: res.reasonCode.description, color: "danger" });
                }
            };
            reader.readAsDataURL(file);
        } catch (e) {
            addToast({ title: "Error", description: "No se pudo subir el documento", color: "danger" });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                setErrors({
                    ...errors,
                    certificacionBancaria: "Solo se permiten archivos PDF"
                });
                return;
            }
            setFormData({
                ...formData,
                certificacionBancaria: file
            });
            const fileUrl = URL.createObjectURL(file);
            setPreviewUrl(fileUrl);
            if (errors.certificacionBancaria) {
                setErrors({
                    ...errors,
                    certificacionBancaria: undefined
                });
            }
            handleFileUpload(file);
        }
    };

    const handleReemplazarFile = () => {
        setFormData({
            ...formData,
            certificacionBancaria: null
        });
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        addToast({ title: "Documento eliminado", description: "Puedes subir uno nuevo", color: "warning" });
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type !== "application/pdf") {
                setErrors({
                    ...errors,
                    certificacionBancaria: "Solo se permiten archivos PDF"
                });
                return;
            }
            setFormData({
                ...formData,
                certificacionBancaria: file
            });
            const fileUrl = URL.createObjectURL(file);
            setPreviewUrl(fileUrl);
            if (errors.certificacionBancaria) {
                setErrors({
                    ...errors,
                    certificacionBancaria: undefined
                });
            }
            handleFileUpload(file);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: ErrorsType = {};
        if (!formData.banco) newErrors.banco = "El banco es requerido";
        if (!formData.beneficiario.trim()) newErrors.beneficiario = "El beneficiario es requerido";
        if (!formData.numeroCuenta) newErrors.numeroCuenta = "El número de cuenta es requerido";
        else if (!/^\d+$/.test(formData.numeroCuenta)) newErrors.numeroCuenta = "Debe contener solo dígitos";
        else if (formData.numeroCuenta.length < 10 || formData.numeroCuenta.length > 16) newErrors.numeroCuenta = "Debe tener entre 10 y 16 dígitos";
        if (!formData.clabe) newErrors.clabe = "La CLABE es requerida";
        else if (!/^\d+$/.test(formData.clabe)) newErrors.clabe = "Debe contener solo dígitos";
        else if (formData.clabe.length !== 18) newErrors.clabe = "Debe tener exactamente 18 dígitos";
        if (!formData.certificacionBancaria) newErrors.certificacionBancaria = "La certificación bancaria es requerida";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        if (validateForm()) {
            // Aquí puedes enviar los datos al backend
        }
    };

    // Obtener nombre y extensión según tipo
    let fileName = "";
    let fileExt = "";
    let nameWithoutExt = "";
    let fileSize = "";
    if (formData.certificacionBancaria instanceof File) {
        fileName = formData.certificacionBancaria.name;
        fileExt = fileName.split('.').pop()?.toUpperCase() || "";
        nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
        fileSize = ((formData.certificacionBancaria.size ?? 0) / 1024).toFixed(2) + " KB";
    } else if (typeof formData.certificacionBancaria === "string") {
        const parts = formData.certificacionBancaria.split('/');
        fileName = parts[parts.length - 1];
        fileExt = fileName.split('.').pop()?.toUpperCase() || "";
        nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
        fileSize = ""; // No hay size
    }

    // Botón para ver el PDF en Drawer
    const handleViewCertificacion = async () => {
        setLoadingPreview(true);
        let path = "";
        if (formData.certificacionBancaria instanceof File) {
            // No hay path, solo preview local
            setSecureUrl(previewUrl);
            setOpenPreview(true);
            setLoadingPreview(false);
            return;
        } else if (typeof formData.certificacionBancaria === "string") {
            path = formData.certificacionBancaria;
        }
        try {
            const res = await OperacionService.getDocumentUrl(path);
            if (res?.urlFirmada) {
                setSecureUrl(res.urlFirmada);
                setOpenPreview(true);
            }
        } catch (e) {
            setSecureUrl(null);
        } finally {
            setLoadingPreview(false);
        }
    };

    return (
        <Form className="space-y-6 w-full" onSubmit={handleSubmit}>
            <div className="mb-2 ml-1">
                <h2 className="text-xl font-semibold">Datos de Estado de Cuenta</h2>
                <span className="text-sm font-light">Información necesaria del estado de cuenta don de deseas recibir el deposito</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <Autocomplete
                    label="Banco"
                    placeholder="Seleccione el banco"
                    selectedKey={formData.banco}
                    onSelectionChange={key => handleInputChange("banco", key as string)}
                    isRequired
                    isInvalid={!!errors.banco}
                    errorMessage={errors.banco}
                    fullWidth
                >
                    {bancos.map(bank => (
                        <AutocompleteItem key={bank.value}>
                            {bank.label}
                        </AutocompleteItem>
                    ))}
                </Autocomplete>
                <Input
                    label="Beneficiario"
                    placeholder="Ingrese el nombre del beneficiario"
                    value={formData.beneficiario}
                    onValueChange={value => handleInputChange("beneficiario", value)}
                    isRequired
                    isInvalid={!!errors.beneficiario}
                    errorMessage={errors.beneficiario}
                    fullWidth
                />
                <Input
                    label="Número de Cuenta"
                    placeholder="Ingrese el número de cuenta (10-16 dígitos)"
                    value={formData.numeroCuenta}
                    onValueChange={value => handleInputChange("numeroCuenta", value)}
                    isRequired
                    isInvalid={!!errors.numeroCuenta}
                    errorMessage={errors.numeroCuenta}
                    fullWidth
                />
                <Input
                    label="CLABE"
                    placeholder="Ingrese la CLABE (18 dígitos)"
                    value={formData.clabe}
                    onValueChange={value => handleInputChange("clabe", value)}
                    isRequired
                    isInvalid={!!errors.clabe}
                    errorMessage={errors.clabe}
                    fullWidth
                />
            </div>
            <div className="w-full">
                <p className="text-sm font-medium ">Certificación Bancaria (PDF) <span className="text-danger">*</span></p>
                <p className="text-sm mb-2 font-light">Por favor, carga el estado de cuenta donde se va a recibir el depósito.</p>
                <div
                    className={`border-2 border-dashed rounded-lg p-4 transition-all ${isDragging
                        ? 'border-primary bg-primary-50'
                        : errors.certificacionBancaria
                            ? 'border-danger'
                            : formData.certificacionBancaria
                                ? 'border-success'
                                : 'border-default-300'
                        }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {!formData.certificacionBancaria ? (
                        <div className="flex flex-col items-center justify-center py-2">
                            <Icon
                                icon={isDragging ? "lucide:file-down" : "lucide:upload-cloud"}
                                className={`text-3xl mb-4 ${isDragging ? 'text-primary' : 'text-default-400'}`}
                            />
                            <p className={`text-lg mb-3 ${isDragging ? 'text-primary' : 'text-default-600'}`}>
                                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu archivo PDF aquí'}
                            </p>
                            <p className="text-default-500 mb-4">o</p>
                            <Button
                                color="primary"
                                variant="flat"
                                size="md"
                                onPress={() => fileInputRef.current?.click()}
                                startContent={<Icon icon="lucide:file-plus" />}
                            >
                                Seleccionar archivo
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="p-4 rounded-md">
                            <Card className="flex items-center p-3 rounded border border-default-200 gap-3 flex-row">
                                <Icon icon="lucide:file-text" className="text-3xl text-primary" />
                                <div className="flex-1 min-w-0 flex flex-row items-center gap-3 justify-between">
                                    <div>
                                        <p className="font-medium truncate">{fileName}</p>
                                        <p className="text-default-500 text-xs">{fileSize}</p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="success"
                                            onPress={handleViewCertificacion}
                                            startContent={<Icon icon={loadingPreview ? "lucide:loader-2" : "lucide:eye"} className={loadingPreview ? "animate-spin" : ""} fontSize={17} />}
                                            isDisabled={loadingPreview}
                                        >
                                            Ver
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="warning"
                                            onPress={handleReemplazarFile}
                                            startContent={<Icon icon="codex:replace" fontSize={20} />}
                                        >
                                            Reemplazar
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                            {/* Drawer para visor PDF */}
                            <Drawer isOpen={openPreview} onOpenChange={setOpenPreview} placement="left" size="full">
                                <DrawerContent>
                                    {(close) => (
                                        <>
                                            <DrawerHeader className="flex flex-col gap-1 text-center">
                                                {nameWithoutExt}
                                            </DrawerHeader>
                                            <DrawerBody>
                                                {loadingPreview ? (
                                                    <div className="flex items-center justify-center h-[70vh] text-sm text-default-500">
                                                        Obteniendo URL segura…
                                                    </div>
                                                ) : (
                                                    secureUrl ? (
                                                        <iframe
                                                            src={secureUrl}
                                                            className="w-full h-[100dvh] rounded border"
                                                        />
                                                    ) : (
                                                        <div className="text-sm text-danger">No se pudo obtener el archivo.</div>
                                                    )
                                                )}
                                            </DrawerBody>
                                            <DrawerFooter>
                                                <Button variant="solid" color="primary" onPress={close}>
                                                    Cerrar
                                                </Button>
                                            </DrawerFooter>
                                        </>
                                    )}
                                </DrawerContent>
                            </Drawer>
                        </div>
                    )}
                </div>
                {errors.certificacionBancaria && (
                    <p className="text-danger text-xs mt-1">{errors.certificacionBancaria}</p>
                )}
            </div>
        </Form>
    );
}
