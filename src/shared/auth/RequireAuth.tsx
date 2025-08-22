"use client";

import React from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { usePathname } from "next/navigation";
import { Spinner } from "@heroui/react";

/**
 * Protege rutas: si no hay sesión, dispara loginRedirect una sola vez y
 * recuerda a dónde volver (pathname actual).
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const isAuth = useIsAuthenticated();
    const { instance, inProgress, accounts } = useMsal();
    const pathname = usePathname();
    const triedRef = React.useRef(false);

    React.useEffect(() => {
        if (isAuth || triedRef.current) return;
        // evita loops mientras MSAL está procesando otro flujo
        if (inProgress === "login" || inProgress === "acquireToken") return;

        triedRef.current = true;
        // recuerda a dónde volver
        sessionStorage.setItem("postLoginRedirect", pathname || "/");
        instance.loginRedirect().catch((e) => {
            // si falla, permitimos reintentar en el próximo render
            triedRef.current = false;
            console.error("loginRedirect error", e);
        });
    }, [isAuth, inProgress, instance, pathname]);

    // Mientras resuelve: UI minimal
    if (!isAuth) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <Spinner label="Conectando con tu sesión..." />
            </div>
        );
    }

    return <>{children}</>;
}
