"use client";

import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { getBearerToken } from "../tokenManager";
import { env } from "@/config/env";

// Normaliza origen objetivo de la request (baseURL + url relativa)
function getRequestOrigin(config: InternalAxiosRequestConfig) {
    const base = config.baseURL ?? "";
    const url = config.url ?? "";
    const absolute = /^https?:\/\//i.test(url) ? url : new URL(url, base).toString();
    try {
        return new URL(absolute).origin;
    } catch {
        return ""; // si por alguna razón no parsea, no adjuntamos
    }
}

const API_ORIGIN = (() => {
    try {
        return new URL(env.API_URL).origin;
    } catch {
        return "";
    }
})();

export async function attachAuthTokenRequestInterceptor(
    config: InternalAxiosRequestConfig
) {
    // Normaliza headers a AxiosHeaders
    if (!config.headers) {
        config.headers = new AxiosHeaders();
    } else if (!(config.headers instanceof AxiosHeaders)) {
        config.headers = new AxiosHeaders(config.headers);
    }
    const headers = config.headers as AxiosHeaders;

    // Solo adjunta Bearer si el destino es tu API
    const destOrigin = getRequestOrigin(config);
    const isSameApi = API_ORIGIN && destOrigin === API_ORIGIN;

    if (isSameApi && !headers.has("Authorization")) {
        const token = await getBearerToken(); // cachea y refresca si está por expirar
        if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
}
