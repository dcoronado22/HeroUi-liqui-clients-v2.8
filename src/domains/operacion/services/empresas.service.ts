"use client";

import { apiCall } from "@/src/shared/lib/api/client";

const BASE = "/operaciones";

export type Empresa = {
    id: string;
    rfc: string;
    nombreContribuyente: string;
    idState: number;            // enum backend
    descriptionState: string;   // texto backend
};

export type GetEmpresasUsuarioReq = { email: string };
export type GetEmpresasUsuarioRes = {
    empresas: Empresa[];
    alianza?: any;
};

export const EmpresasService = {
    async getEmpresasUsuario(body: GetEmpresasUsuarioReq) {
        return apiCall<GetEmpresasUsuarioRes>(`${BASE}/GetEmpresasUsuario`, {
            method: "POST",
            body,
        });
    },
};