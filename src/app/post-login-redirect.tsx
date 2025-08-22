"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useIsAuthenticated } from "@azure/msal-react";

/** Si hay una ruta recordada, la usa una sola vez post-login. */
export default function PostLoginRedirect() {
    const isAuth = useIsAuthenticated();
    const router = useRouter();

    React.useEffect(() => {
        if (!isAuth) return;
        const dest = sessionStorage.getItem("postLoginRedirect");
        if (dest) {
            sessionStorage.removeItem("postLoginRedirect");
            router.replace(dest);
        }
    }, [isAuth, router]);

    return null;
}
