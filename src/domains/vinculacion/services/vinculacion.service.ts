"use client";

import { apiCall } from "@/src/shared/lib/api/client";

const BASE = "/vinculaciones";

export type CrearVinculacionBody = {
    state: 1;
    requestData: {
        datosRegistroVinculacion: {
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

export type CrearVinculacionRes = {
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

export type UploadDocumentBody = {
    id: string;
    rfc: string;
    fileName: string;
    contentType: string;
    Base64Data: string;
    useTemp?: boolean;
};

export type UploadDocumentRes = {
    fileName: string;
    id: string | null;
    token: string | null;
    succeeded: boolean;
    reasonCode: { value: number; description?: string };
    messages: any[];
};

export const VinculacionService = {
    async crear(body: CrearVinculacionBody) {
        return apiCall<CrearVinculacionRes>(`${BASE}/Vinculacion`, {
            method: "POST",
            body,
        });
    },

    async getDetalle(id: string, rfc: string) {
        return apiCall<any>(`${BASE}/GetDetalleVinculacion`, {
            method: "POST",
            body: { id, rfc },
        });
    },

    async avanzarClaveCiec({ id, rfc }: { id: string; rfc: string }) {
        return apiCall<any>(`${BASE}/Vinculacion`, {
            method: "POST",
            body: {
                state: 2,
                requestData: { id, rfc, claveCiecIsValid: true },
            },
        });
    },

    async avanzarDatosBuro({ id, rfc, payload }: { id: string; rfc: string; payload: any }) {
        return apiCall<any>(`${BASE}/Vinculacion`, {
            method: "POST",
            body: {
                state: 3,
                requestData: {
                    id,
                    rfc,
                    datosAutorizacionBuro: payload,
                },
            },
        });
    },

    async tickFirmaMiFiel(params: {
        id: string;
        rfc: string;
        datosAutorizacionBuro?: any; // si tu back lo requiere para state 4
    }) {
        console.log("Polling terminado:");
        return apiCall<any>(`${BASE}/Vinculacion`, {
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

        async crearExpedienteAzul(params: {
        id: string;
        rfc: string;
        name: string;
        email: string;
    }) {
        return apiCall<any>(`${BASE}/Vinculacion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                state: 7,
                requestData: {
                    id: params.id,
                    rfc: params.rfc,
                    templateId: "4688",
                    parentFolder: "",
                    name: params.name,
                    email: params.email,
                    ownerId: "253244",
                    notes: "Auto",
                    notifications: "1",
                    notifyFrequency: "4",
                    phoneCountryCode: "57",
                    phone: "3102860351",
                    apiNotes: "auto",
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

    async actualizaDatosBuro(params: {
        Id: string;
        Rfc: string;
        DatosAutorizacionBuro: any;
    }) {
        return apiCall<any>(`${BASE}/ActualizaDatosBuro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        });
    },

    async avanzarSeleccionClientes(params: {
        id: string;
        rfc: string;
        pagadores: { nombre: string; rfc: string }[];
        liquidezNecesaria: number;
    }) {
        return apiCall<any>(`${BASE}/Vinculacion`, {
            method: "POST",
            body: {
                state: 8,
                requestData: {
                    id: params.id,
                    rfc: params.rfc,
                    clientes: params.pagadores,
                    liquidezNecesaria: params.liquidezNecesaria,
                },
            },
        });
    },

    async downloadFileExpediente(payload: DownloadFileExpedienteBody) {
        return apiCall<DownloadFileExpedienteRes>(`${BASE}/DownloadFileExpediente`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    },

    async deleteFileExpediente(payload: DeleteFileExpedienteBody) {
        return apiCall<DeleteFileExpedienteRes>(`${BASE}/DeleteFileExpediente`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    },

    async almaceneDatosContrato(payload: {
        rfc: string;
        id: string;
        escrituraData: any;
        apoderadoLegalData: any;
        desembolsoData: any;
      }) {
        return apiCall<any>(`${BASE}/AlmaceneDatosContrato`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      },

      

    async avanzarDatosLegales(params: { id: string; rfc: string; folderId: string }) {
        return apiCall<any>(`${BASE}/Vinculacion`, {
          method: "POST",
          body: {
            state: 9,
            requestData: {
              FolderId: params.folderId,
              Rfc: params.rfc,
              Id: params.id,
            },
          },
        });
      },

    async valideDocsRazonesFinancieras(params: { rfc?: string | null; id?: string | null }) {
        return apiCall<any>(`${BASE}/valideDocsRazonesFinancieras`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        });
    },

    async uploadDocument(payload: UploadDocumentBody) {
        const qs = new URLSearchParams({
            Id: String(payload.id ?? ""),
            Rfc: String(payload.rfc ?? ""),
            UseTemp: String(Boolean(payload.useTemp)),
            "File-Name": payload.fileName,
            "Content-Type": payload.contentType,
          }).toString();
        
          return apiCall<UploadDocumentRes>(`${BASE}/UploadDocument?${qs}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    },

    // opcional: wrapper genérico para cambiar estado
    async stateManager<T = any>(payload: { state: number; requestData: any }) {
        return apiCall<T>(`${BASE}/Vinculacion`, {
            method: "POST",
            body: payload,
        });
    },
};
