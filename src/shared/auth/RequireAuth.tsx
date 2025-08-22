"use client";

import React from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const isAuth = useIsAuthenticated();
    const { instance, inProgress } = useMsal();
    const pathname = usePathname();
    const search = useSearchParams();
    const router = useRouter();
    const triedRef = React.useRef(false);

    // 1) NO hacer nada mientras MSAL procesa el redirect (limpia el hash aquí)
    if (inProgress === "handleRedirect") {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <Spinner label="Procesando inicio de sesión..." />
            </div>
        );
    }

    // 2) Lanzar login cuando NO hay sesión y MSAL está idle
    React.useEffect(() => {
        if (isAuth || triedRef.current) return;
        if (inProgress !== "none") return; // esperar a idle

        triedRef.current = true;

        // guarda ruta + query para volver exactamente ahí
        const dest =
            pathname + (search?.toString() ? `?${search.toString()}` : "");
        sessionStorage.setItem("postLoginRedirect", dest || "/");

        instance
            .loginRedirect({
                redirectUri:
                    typeof window !== "undefined" ? window.location.origin : undefined,
                scopes: ["openid", "profile"], // Add required scopes here
            })
            .catch((e) => {
                triedRef.current = false;
                console.error("loginRedirect error", e);
            });
    }, [isAuth, inProgress, instance, pathname, search]);

    // 3) Ya con sesión y MSAL idle, vuelve al destino y limpia el hash si quedara alguno
    React.useEffect(() => {
        if (!isAuth || inProgress !== "none") return;

        const dest = sessionStorage.getItem("postLoginRedirect");
        if (dest && dest !== window.location.pathname + window.location.search) {
            sessionStorage.removeItem("postLoginRedirect");
            router.replace(dest);
            return;
        }

        // Fallback: si quedara fragmento por cualquier razón, límpialo
        if (window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
    }, [isAuth, inProgress, router]);

    if (!isAuth) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <Spinner label="Conectando con tu sesión..." />
            </div>
        );
    }

    return <>{children}</>;
}
