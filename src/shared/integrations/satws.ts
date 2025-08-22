"use client";

type SatwsGlobal = {
    init?: () => void;
    destroy?: () => void;
    subscribe?: (eventName: string, cb: (...a: any[]) => void) => void;
};

declare global {
    interface Window { Satws?: SatwsGlobal }
}

let loaderPromise: Promise<void> | null = null;

export function loadSatwsScript({
    key = "6074da",
    src = "https://cdn.satws.com/widget/script/index.min.js",
    id = "satws-widget-id",
}: { key?: string; src?: string; id?: string } = {}) {
    if (typeof window === "undefined") return Promise.resolve(); // SSR
    if (loaderPromise) return loaderPromise;
    if (document.getElementById(id)) return (loaderPromise = Promise.resolve());

    loaderPromise = new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.id = id;
        s.async = true;
        s.src = src;
        s.type = "text/javascript";
        s.setAttribute("data-Key", key);
        s.setAttribute("data-hide-close", "true");
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("SATWS script failed to load"));
        document.body.appendChild(s);
    });

    return loaderPromise;
}

export function openSatws({
    onSuccess,
    onError,
}: {
    onSuccess: () => void;
    onError: () => void;
}) {
    const satws = window.Satws;
    if (!satws?.init) {
        throw new Error("SATWS no inicializado aún");
    }
    // Suscripciones "once" sencillas
    satws.subscribe?.("registerWithSuccess", () => onSuccess());
    satws.subscribe?.("errorOnRegister", () => onError());
    satws.init();
}
