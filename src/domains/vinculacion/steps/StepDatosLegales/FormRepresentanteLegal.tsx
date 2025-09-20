import React from "react";
import { Form, Input, Select, SelectItem, DateInput, Button, DatePicker, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { parseDate, getLocalTimeZone, today, CalendarDate } from "@internationalized/date";
import { estadosEntry } from "@/config/constants";
import type { Selection } from "@heroui/react";
import { normalize } from "../helpers";

type FormDataType = {
    nombre: string;
    numeroEscritura: string;
    fechaEscritura: any;
    nombreNotario: string;
    numeroNotario: string;
    ciudadNotario: string;
    estadoNotario: Set<string>;
    numeroFolioMercantil: string;
    ciudadRegistro: string;
    estadoRegistro: Set<string>;
};

type ErrorsType = Partial<Record<keyof FormDataType, string>>;

type Props = {
    initialData?: Partial<FormDataType>;
    onValidityChange?: (isValid: boolean) => void;
    onChange?: (data: FormDataType) => void;
};

export default function FormRepresentanteLegal({ initialData, onValidityChange, onChange }: Props) {
    const [formData, setFormData] = React.useState<FormDataType>({
        nombre: "",
        numeroEscritura: "",
        fechaEscritura: null,
        nombreNotario: "",
        numeroNotario: "",
        ciudadNotario: "",
        estadoNotario: new Set([]),
        numeroFolioMercantil: "",
        ciudadRegistro: "",
        estadoRegistro: new Set([])
    });

    const hydratingRef = React.useRef(false);

    React.useEffect(() => {
        if (!initialData) return;

        // Mapear ENTRY (texto) -> VALUE (código) para selectedKey
        const estadoNotarioValue = estadosEntry.find(
            e => normalize(e.entry) === normalize(initialData.estadoNotario as unknown as string)
        )?.value;

        const estadoRegistroValue = estadosEntry.find(
            e => normalize(e.entry) === normalize(initialData.estadoRegistro as unknown as string)
        )?.value;

        hydratingRef.current = true; // evitar onChange hacia el padre en esta pasada
        setFormData({
            nombre: initialData.nombre ?? "",
            numeroEscritura: initialData.numeroEscritura ?? "",
            fechaEscritura: initialData.fechaEscritura
                ? typeof initialData.fechaEscritura === "string"
                    ? parseDate(initialData.fechaEscritura)
                    : initialData.fechaEscritura
                : null,
            nombreNotario: initialData.nombreNotario ?? "",
            numeroNotario: initialData.numeroNotario ?? "",
            ciudadNotario: initialData.ciudadNotario ?? "",
            // ¡OJO! Guardamos VALUE en el Set (coincide con key del AutocompleteItem)
            estadoNotario: estadoNotarioValue ? new Set([estadoNotarioValue]) : new Set([]),
            numeroFolioMercantil: initialData.numeroFolioMercantil ?? "",
            ciudadRegistro: initialData.ciudadRegistro ?? "",
            estadoRegistro: estadoRegistroValue ? new Set([estadoRegistroValue]) : new Set([]),
        });
    }, [initialData]);

    React.useEffect(() => {
        const isValid = validateForm();

        // Pasar al padre ENTRY (texto), no VALUE
        const estadoNotarioCode = Array.from(formData.estadoNotario)[0];
        const estadoRegistroCode = Array.from(formData.estadoRegistro)[0];

        const toParent = {
            ...formData,
            estadoNotario: estadosEntry.find(e => e.value === estadoNotarioCode)?.entry ?? "",
            estadoRegistro: estadosEntry.find(e => e.value === estadoRegistroCode)?.entry ?? "",
        } as unknown as FormDataType;

        onValidityChange?.(isValid);

        // Evitar loop: no avisar al padre justo en la hidratación
        if (hydratingRef.current) {
            hydratingRef.current = false;
            return;
        }
        onChange?.(toParent);
    }, [formData]);

    const [errors, setErrors] = React.useState<ErrorsType>({});
    const [isSubmitted, setIsSubmitted] = React.useState(false);

    const handleInputChange = (field: keyof FormDataType, value: any) => {
        if (field === "fechaEscritura") {
            setFormData({
                ...formData,
                fechaEscritura: typeof value === "string" ? parseDate(value) : value
            });
        } else {
            setFormData({
                ...formData,
                [field]: value
            });
        }
        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: undefined
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: ErrorsType = {};
        if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
        if (!formData.numeroEscritura) newErrors.numeroEscritura = "El número de escritura es requerido";
        else if (isNaN(Number(formData.numeroEscritura))) newErrors.numeroEscritura = "Debe ser un valor numérico";
        if (!formData.fechaEscritura) newErrors.fechaEscritura = "La fecha de escritura es requerida";
        if (!formData.nombreNotario.trim()) newErrors.nombreNotario = "El nombre del notario es requerido";
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(formData.nombreNotario)) newErrors.nombreNotario = "Solo se permiten letras";
        if (!formData.numeroNotario) newErrors.numeroNotario = "El número de notario es requerido";
        else if (isNaN(Number(formData.numeroNotario))) newErrors.numeroNotario = "Debe ser un valor numérico";
        if (!formData.ciudadNotario.trim()) newErrors.ciudadNotario = "La ciudad del notario es requerida";
        if (formData.estadoNotario.size === 0) newErrors.estadoNotario = "El estado del notario es requerido";
        if (!formData.numeroFolioMercantil.trim()) newErrors.numeroFolioMercantil = "El número de folio mercantil es requerido";
        if (!formData.ciudadRegistro.trim()) newErrors.ciudadRegistro = "La ciudad de registro es requerida";
        if (formData.estadoRegistro.size === 0) newErrors.estadoRegistro = "El estado de registro es requerido";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        setIsSubmitted(true);
        if (validateForm()) {

        }
    };

    return (
        <Form className="space-y-6 w-full" onSubmit={handleSubmit}>
            <div className="mb-2 ml-1">
                <h2 className="text-xl font-semibold">Datos del Representante Legal</h2>
                <span className="text-sm font-light">Información necesaria del representante legal para la firma de contratos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <Input
                    label="Nombre"
                    placeholder="Ingrese el nombre completo"
                    value={formData.nombre}
                    onValueChange={value => handleInputChange("nombre", value)}
                    isRequired
                    isInvalid={!!errors.nombre}
                    errorMessage={errors.nombre}
                    fullWidth
                />
                <Input
                    label="Número de Escritura"
                    placeholder="Ingrese el número de escritura"
                    value={formData.numeroEscritura}
                    onValueChange={value => handleInputChange("numeroEscritura", value)}
                    type="number"
                    isRequired
                    isInvalid={!!errors.numeroEscritura}
                    errorMessage={errors.numeroEscritura}
                    fullWidth
                />
                <DatePicker
                    label="Fecha de Escritura"
                    value={formData.fechaEscritura}
                    onChange={value => handleInputChange("fechaEscritura", value)}
                    isRequired
                    showMonthAndYearPickers
                    isInvalid={!!errors.fechaEscritura}
                    errorMessage={errors.fechaEscritura}
                    maxValue={today(getLocalTimeZone())}
                    fullWidth
                />
                <Input
                    label="Nombre del Notario"
                    placeholder="Ingrese el nombre del notario"
                    value={formData.nombreNotario}
                    onValueChange={value => handleInputChange("nombreNotario", value)}
                    isRequired
                    isInvalid={!!errors.nombreNotario}
                    errorMessage={errors.nombreNotario}
                    fullWidth
                />
                <Input
                    label="Número del Notario"
                    placeholder="Ingrese el número del notario"
                    value={formData.numeroNotario}
                    onValueChange={value => handleInputChange("numeroNotario", value)}
                    type="number"
                    isRequired
                    isInvalid={!!errors.numeroNotario}
                    errorMessage={errors.numeroNotario}
                    fullWidth
                />
                <Input
                    label="Ciudad del Notario"
                    placeholder="Ingrese la ciudad del notario"
                    value={formData.ciudadNotario}
                    onValueChange={value => handleInputChange("ciudadNotario", value)}
                    isRequired
                    isInvalid={!!errors.ciudadNotario}
                    errorMessage={errors.ciudadNotario}
                    fullWidth
                />
                <Autocomplete
                    label="Estado del Notario"
                    placeholder="Seleccione el estado"
                    selectedKey={Array.from(formData.estadoNotario)[0] ?? null}
                    onSelectionChange={(key) => handleInputChange("estadoNotario", key ? new Set([key]) : new Set())}
                    isRequired
                    isInvalid={!!errors.estadoNotario}
                    errorMessage={errors.estadoNotario}
                    fullWidth
                >
                    {estadosEntry.map(state => (
                        <AutocompleteItem key={state.value}>
                            {state.entry}
                        </AutocompleteItem>
                    ))}
                </Autocomplete>
                <Input
                    label="Número de Folio Mercantil"
                    placeholder="Ingrese el número de folio mercantil"
                    value={formData.numeroFolioMercantil}
                    onValueChange={value => handleInputChange("numeroFolioMercantil", value)}
                    isRequired
                    isInvalid={!!errors.numeroFolioMercantil}
                    errorMessage={errors.numeroFolioMercantil}
                    fullWidth
                />
                <Input
                    label="Ciudad de Registro"
                    placeholder="Ingrese la ciudad de registro"
                    value={formData.ciudadRegistro}
                    onValueChange={value => handleInputChange("ciudadRegistro", value)}
                    isRequired
                    isInvalid={!!errors.ciudadRegistro}
                    errorMessage={errors.ciudadRegistro}
                    fullWidth
                />
                <Autocomplete
                    label="Estado de Registro"
                    placeholder="Seleccione el estado"
                    selectedKey={Array.from(formData.estadoRegistro)[0] ?? null}
                    onSelectionChange={(key) => handleInputChange("estadoRegistro", key ? new Set([key]) : new Set())}
                    isRequired
                    isInvalid={!!errors.estadoRegistro}
                    errorMessage={errors.estadoRegistro}
                    fullWidth
                >
                    {estadosEntry.map(state => (
                        <AutocompleteItem key={state.value} >
                            {state.entry}
                        </AutocompleteItem>
                    ))}
                </Autocomplete>
            </div>
        </Form>
    );
}
