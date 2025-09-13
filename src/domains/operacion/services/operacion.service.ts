"use client";

import { apiCall } from "@/src/shared/lib/api/client";

const BASE = "/operaciones";

export type CrearOperacionBody = {
    state: 1;
    requestData: {
        datosRegistroOperacion: {
            id: string;
            rfc: string;
            razonSocial: string;
            nombres: string;
            apellidoPaterno: string;
            apellidoMaterno: string;
            telefono: string;
            whatsapp: string;
            personaConActividadesEmpresariales: boolean;
            nombresRepLegal: string;
            apellidoPaternoRepLegal: string;
            apellidoMaternoRepLegal: string;
            email: string;
            confirmaEmail: string;
            avisoPrivacidad: boolean;
            tipoContribuyente: 0 | 1 | 2;
            nacionalidad: string;
        };
        allianceCode?: string;
        rfc: string;
    };
};

export type CrearOperacionRes = {
    state: number; // suele venir 2
    status: number;
    token?: string;
    responseData?: {
        Id?: string;
        Token?: string | null;
        Succeeded: boolean;
        ReasonCode?: { Value: number; Description?: string };
        Messages?: string[];
    };
};

export type GetDocumentosExpedienteBody = {
    FolderId: string;
    Rfc: string;
    Id: string;
};

export type DocumentoExpediente = {
    name: string;
    document_id: number;
    status: string;
    comments: string | null;
    valid_until: string | null;
    url_pre: string | null;
    files: { filename: string; file_id: number }[];
};

export type GetDocumentosExpedienteRes = {
    payload: {
        document_list: DocumentoExpediente[];
        messages: any;
        reasonCode: number;
        succeeded: boolean;
        messages_validation: any;
    };
    documentsIsValid: boolean;
    escrituraDataValida: boolean;
    apoderadoLegalDataValida: boolean;
    desembolsoDataValida: boolean;
    camposInvalidos: any[];
    id: string | null;
    token: string | null;
    succeeded: boolean;
    reasonCode: { value: number; description?: string };
    messages: any[];
};

export type DownloadFileExpedienteBody = {
    Folderid: string; // string esperado por el backend
    FileId: string;   // string esperado por el backend
};

export type DownloadFileExpedienteRes = {
    preSignedUrl: string;
    id: string | null;
    token: string | null;
    succeeded: boolean;
    reasonCode: { value: number; description?: string };
    messages: any[];
};

export type DeleteFileExpedienteBody = {
    Folderid: string;
    FileId: string;
};

export type DeleteFileExpedienteRes = {
    succeeded: boolean;
    reasonCode: { value: number; description?: string };
    messages: any[];
    id?: string | null;
    token?: string | null;
};

// NUEVOS TIPOS GetOperacionesLote
export type GetOperacionesLoteBody = {
    rfc: string;
};

export type OperacionClienteLote = {
    id: string;
    rfc: string;
    idLote: string;
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
};

export type OperacionLote = {
    idLote: any;
    id: string;
    rfc: string;
    state: number;
    status: number;
    fechaCreacion: string;
    fechaModificacion: string;
    cantidadOperaciones: number;
    stateDescription: string;
    statusDescription: string;
    montoTotal: number;
    cantidadFacturas: number;
    cotizacionesCompletadas: number;
    operacionCliente: OperacionClienteLote[];
    estadoRug: number;
};

export type GetOperacionesLoteRes = {
    operacionesLote: OperacionLote[];
    id: string | null;
    idLote: string | null;
    token: string | null;
    succeeded: boolean;
    reasonCode: { value: number; description?: string };
    messages: any[];
};

// NUEVOS TIPOS GenereOferta
export type GenereOfertaBody = {
    rfc: string;
    id: string;
};

export type FacturaGenereOferta = {
    uuid: string;
    issuedAt: string;
    valorFactura: number;
    recibido: number;
};

export type InformacionNegociacionGenereOferta = {
    mondeda: string; // se respeta el nombre tal como viene del backend
    montoActivo: number;
    montoCobrado: number;
    balance: number;
    aforo: number;
    promedioDiasPago: number;
    plazo: number;
};

export type PagadorSeleccionadoGenereOferta = {
    promedioDiasPago: number;
    valorPosibleNegociacion: number;
    valorPosibleNegociacionRecibido: number;
    valorPendienteNegociacion: number;
    lineaCredito: number;
    nombre: string;
    rfc: string;
    informacionNegociacion: InformacionNegociacionGenereOferta;
    facturas: FacturaGenereOferta[];
    porcentaje: number;
};

export type GenereOfertaRes = {
    pagadoresSeleccionados: PagadorSeleccionadoGenereOferta[];
    liquidezObtenida: number;
    liquidezNecesaria: number;
    cumpleLiquidezNecesaria: boolean;
    id: string | null;
    token: string | null;
    succeeded: boolean;
    reasonCode: { value: number; description?: string };
    messages: any[];
};

// NUEVOS TIPOS Top10Empresas
export type Top10EmpresasBody = {
    rfc: string;
    id: string;
};

export type FacturaTop10Empresas = {
    uuid: string;
    issuedAt: string;
    valorFactura: number;
    recibido: number;
};

export type InformacionNegociacionTop10Empresas = {
    mondeda: string;
    montoActivo: number;
    montoCobrado: number;
    balance: number;
    aforo: number;
    promedioDiasPago: number;
    plazo: number;
};

export type TopPagadorTop10Empresas = {
    valorPosibleNegociacion: number;
    valorPosibleNegociacionRecibido: number;
    valorPendienteNegociacion: number;
    lineaCredito: number;
    nombre: string;
    rfc: string;
    informacionNegociacion: InformacionNegociacionTop10Empresas;
    facturas: FacturaTop10Empresas[];
    porcentaje: number;
};

export type Top10EmpresasRes = {
    topPagadores: TopPagadorTop10Empresas[];
    cupoGlobal: number;
    id: string | null;
    token: string | null;
    succeeded: boolean;
    reasonCode: { value: number; description?: string };
    messages: any[];
};

export const OperacionService = {
    async crear(body: CrearOperacionBody) {
        return apiCall<CrearOperacionRes>(`${BASE}/Operacion`, {
            method: "POST",
            body,
        });
    },

    async getDetalle(id: string, rfc: string) {
        return apiCall<any>(`${BASE}/GetDetalleOperacion`, {
            method: "POST",
            body: { id, rfc },
        });
    },

    async tickFirmaMiFiel(params: {
        id: string;
        rfc: string;
        datosAutorizacionBuro?: any; // si tu back lo requiere para state 4
    }) {
        console.log("Polling terminado:");
        return apiCall<any>(`${BASE}/Operacion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                state: 4,
                requestData: {
                    id: params.id,
                    rfc: params.rfc,
                    datosAutorizacionBuro: params.datosAutorizacionBuro,
                    claveCiecIsValid: true,
                },
            }),
        });
    },

    async getDocumentoS3(params: { id: string; rfc: string; fileName: string }) {
        return apiCall<any>(`${BASE}/GetDocumentoS3`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        });
    },

    async getDocumentosExpediente(payload: GetDocumentosExpedienteBody) {
        return apiCall<GetDocumentosExpedienteRes>(`${BASE}/GetDocumentosExpediente`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    },

    // opcional: wrapper genérico para cambiar estado
    async stateManager<T = any>(payload: { state: number; requestData: any }) {
        return apiCall<T>(`${BASE}/Operacion`, {
            method: "POST",
            body: payload,
        });
    },

    async getOperacionesLote(rfc: string) {
        return apiCall<GetOperacionesLoteRes>(`${BASE}/GetOperacionesLote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rfc }),
        });
    },

    async genereOferta(payload: GenereOfertaBody) {
        return apiCall<GenereOfertaRes>(`${BASE}/GenereOferta`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    },

    // NUEVO: Top10Empresas
    async top10Empresas(payload: Top10EmpresasBody) {
        return apiCall<Top10EmpresasRes>(`${BASE}/Top10Empresas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    },
};
