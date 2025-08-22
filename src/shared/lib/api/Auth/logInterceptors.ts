"use client";

import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

let showErrorMessage: ((message: string) => void) | null = null;
let onUnauthorized: (() => void) | null = null;

export const setApiErrorHandler = (handler: (message: string) => void) => {
    showErrorMessage = handler;
};

export const setUnauthorizedHandler = (handler: () => void) => {
    onUnauthorized = handler;
};

export const logRequestInterceptor = async (
    config: InternalAxiosRequestConfig<any>
) => {
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug(
            `[API] → ${config.method?.toUpperCase()} ${config.baseURL ?? ""}${config.url}`,
            config
        );
    }
    return config;
};

export const logResponseInterceptor = (response: AxiosResponse) => {
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug(`[API] ← ${response.status} ${response.config.url}`, response.data);
    }
    return response;
};

const GENERIC_ERROR_MESSAGE =
    "Ha ocurrido un error. Por favor, inténtalo nuevamente.";

export async function handleAxiosError(error: any) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
        const status = axiosError.response.status;

        // Construye un texto de recurso/acción para mostrar en errores 401/403
        const url = axiosError.config?.url ?? "";
        const parts = url.split("/");
        const resource = parts.length > 2 ? parts.at(-2) : "undefined";
        const action = parts.length > 1 ? parts.at(-1) : "undefined";

        if (status === 401 || status === 403) {
            showErrorMessage?.(
                `Usuario no autorizado para acceder al recurso ${resource}:${action}`
            );
            onUnauthorized?.();
        } else {
            const payload = axiosError.response.data as any;
            const msg =
                typeof payload === "string"
                    ? payload
                    : payload?.message || GENERIC_ERROR_MESSAGE;
            showErrorMessage?.(msg);
        }

        if (status === 422) {
            const payload = axiosError.response.data as any;
            // Ejemplos de esquemas típicos: { errors: [{field, message}] } o { details: {...} }
            const fieldErrors: string[] =
                payload?.errors?.map((e: any) => (e.message || e.msg || JSON.stringify(e))) ??
                Object.values(payload?.details ?? {}) as string[];
            const msg = fieldErrors.length
                ? `Validación: ${fieldErrors.join(" · ")}`
                : payload?.message || GENERIC_ERROR_MESSAGE;
            showErrorMessage?.(msg);
            return Promise.reject(error);
        }


    } else if (axiosError.request) {
        showErrorMessage?.("Error de red o sin respuesta del servidor");
    } else {
        showErrorMessage?.(axiosError.message || GENERIC_ERROR_MESSAGE);
    }

    return Promise.reject(error);
}