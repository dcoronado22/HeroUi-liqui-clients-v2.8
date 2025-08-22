"use client";

import { AuthService } from "@liquicapital/common";

type CachedToken = { token: string; exp: number }; // exp en segundos epoch

let cached: CachedToken | null = null;
let refreshPromise: Promise<string | null> | null = null;

// Decode exp de un JWT sin validar la firma (solo para expiración)
function decodeExp(jwt: string): number | null {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    try {
        const payload = JSON.parse(
            Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
        );
        return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
        return null;
    }
}

function needsRefresh(exp?: number | null, skewSec = 60) {
    if (!exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= exp - skewSec;
}

async function acquire(): Promise<string | null> {
    if (typeof (AuthService as any).ensureInitialized === "function") {
        await (AuthService as any).ensureInitialized();
    }
    const token = await AuthService.acquireToken(); // asumes accessToken
    if (!token) return null;
    const exp = decodeExp(token) ?? Math.floor(Date.now() / 1000) + 300; // fallback 5 min
    cached = { token, exp };
    return token;
}

// Llama esto desde el request interceptor
export async function getBearerToken(): Promise<string | null> {
    if (cached && !needsRefresh(cached.exp)) return cached.token;

    // De-dup: si ya hay un refresh en curso, espera ese
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
        try {
            return await acquire();
        } finally {
            refreshPromise = null;
        }
    })();
    return refreshPromise;
}

export function clearCachedToken() {
    cached = null;
}
