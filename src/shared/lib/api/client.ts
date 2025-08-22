"use client";

import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from "axios";
import { env } from "@/config/env";
import {
    attachAuthTokenRequestInterceptor,
} from "./Auth/attachAuthTokenRequestInterceptor";
import {
    logRequestInterceptor,
    logResponseInterceptor,
    handleAxiosError,
    setApiErrorHandler,
    setUnauthorizedHandler,
} from "@/src/shared/lib/api/Auth/logInterceptors";
import { clearCachedToken, getBearerToken } from "./tokenManager";

const apiClient: AxiosInstance = axios.create({
    baseURL: env.API_URL,
    // Opcional: evita que Axios trate 4xx/5xx como "ok":
    // validateStatus: (s) => s >= 200 && s < 300,
});

let interceptorsAttached = false;

function delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

function attachInterceptorsOnce() {
    if (interceptorsAttached) return;
    interceptorsAttached = true;

    apiClient.interceptors.request.use(attachAuthTokenRequestInterceptor);
    apiClient.interceptors.request.use(logRequestInterceptor);
    apiClient.interceptors.response.use(logResponseInterceptor);

    apiClient.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error: any) => {
            const axiosErr = error as AxiosError;
            const status = axiosErr.response?.status;
            const original = axiosErr.config as (AxiosRequestConfig & { _retry?: boolean; _attempt?: number }) | undefined;

            // Solo reintenta si fue 401 y proviene de tu API
            const fromApi =
                axiosErr.config &&
                typeof axiosErr.config.url === "string" &&
                (axiosErr.config.baseURL ?? env.API_URL) &&
                new URL(
                    /^https?:\/\//i.test(axiosErr.config.url)
                        ? axiosErr.config.url
                        : new URL(axiosErr.config.url, axiosErr.config.baseURL ?? env.API_URL).toString()
                ).origin === new URL(env.API_URL).origin;

            if (status === 401 && original && fromApi) {
                original._attempt = (original._attempt ?? 0) + 1;

                // 1) Primer intento: limpiar cache y probar token fresh
                if (!original._retry) {
                    original._retry = true;
                    try {
                        clearCachedToken();
                        const fresh = await getBearerToken();
                        if (fresh) {
                            original.headers = {
                                ...(original.headers || {}),
                                Authorization: `Bearer ${fresh}`,
                            };
                            return apiClient.request(original);
                        }
                    } catch {
                        // sigue al handler común
                    }
                }

                // 2) Segundo intento (opcional): pequeño backoff por si reloj del servidor difiere
                if (original._attempt === 2) {
                    await delay(300);
                    try {
                        clearCachedToken();
                        const fresh = await getBearerToken();
                        if (fresh) {
                            original.headers = {
                                ...(original.headers || {}),
                                Authorization: `Bearer ${fresh}`,
                            };
                            return apiClient.request(original);
                        }
                    } catch { }
                }
            }

            // 403: no reintentar (permiso insuficiente); 429/5xx (opcional) backoff:
            if (
                original &&
                (status === 429 || (status && status >= 500 && status < 600))
            ) {
                original._attempt = (original._attempt ?? 0) + 1;
                if (original._attempt <= 2) {
                    await delay(200 * original._attempt); // 200ms, 400ms
                    return apiClient.request(original);
                }
            }

            return handleAxiosError(error);
        }
    );
}

attachInterceptorsOnce();

export default apiClient;

export type ApiCallOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    signal?: AbortSignal;
};

export async function apiCall<T = any>(
    endpoint: string,
    options?: ApiCallOptions
): Promise<T> {
    const method = options?.method ?? "GET";
    const res = await apiClient.request<T>({
        url: endpoint,
        method,
        data: options?.body,
        params: options?.params,
        headers: options?.headers,
        signal: options?.signal,
    });
    return res.data;
}

export { setApiErrorHandler, setUnauthorizedHandler };
